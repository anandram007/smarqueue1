import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default function handleAgentEvents(io: Server, socket: Socket) {
    // Agent joins their department room
    socket.on('agent-join-department', async ({ agentId, departmentId }) => {
        socket.join(`department:${departmentId}`);
        socket.join(`agent:${agentId}`);

        // Update agent status to available
        await prisma.agent.update({
            where: { id: agentId },
            data: { status: 'available' }
        });

        // Broadcast updated department stats
        const stats = await getDepartmentStats(departmentId);
        io.to(`department:${departmentId}`).emit('department-stats-update', {
            departmentId,
            stats
        });
    });

    // Agent leaves their department
    socket.on('agent-leave-department', async ({ agentId, departmentId }) => {
        socket.leave(`department:${departmentId}`);
        socket.leave(`agent:${agentId}`);

        // Update agent status to offline
        await prisma.agent.update({
            where: { id: agentId },
            data: { status: 'offline' }
        });

        // Broadcast updated department stats
        const stats = await getDepartmentStats(departmentId);
        io.to(`department:${departmentId}`).emit('department-stats-update', {
            departmentId,
            stats
        });
    });

    // Agent starts serving a ticket
    socket.on('start-serving-ticket', async ({ ticketId, agentId }, callback) => {
        try {
            const ticket = await prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    status: 'serving',
                    servicedAt: new Date(),
                    assignedAgent: {
                        connect: { id: agentId }
                    }
                },
                include: {
                    Department: true,
                    user: true
                }
            });

            if (!ticket.departmentId) {
                throw new Error('Invalid ticket: missing department ID');
            }

            // Update agent status
            await prisma.agent.update({
                where: { id: agentId },
                data: { status: 'busy' }
            });

            // Notify all relevant parties
            io.to(`ticket:${ticketId}`).emit('ticket-status-update', {
                ticketId,
                status: 'serving',
                agentId
            });

            // Update department stats
            const stats = await getDepartmentStats(ticket.departmentId);
            io.to(`department:${ticket.departmentId}`).emit('department-stats-update', {
                departmentId: ticket.departmentId,
                stats
            });

            // Notify the customer
            if (ticket.user) {
                io.to(`user:${ticket.user.id}`).emit('ticket-being-served', {
                    ticketId,
                    agentId
                });
            }

            callback({ success: true, ticket });
        } catch (error) {
            console.error('Error starting to serve ticket:', error);
            callback({ success: false, error: error instanceof Error ? error.message : 'Failed to start serving ticket' });
        }
    });

    // Agent completes a ticket
    socket.on('complete-ticket', async ({ ticketId, agentId }, callback) => {
        try {
            const ticket = await prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    status: 'completed',
                    completedAt: new Date()
                },
                include: {
                    Department: true,
                    user: true
                }
            });

            if (!ticket.departmentId) {
                throw new Error('Invalid ticket: missing department ID');
            }

            // Update agent status
            await prisma.agent.update({
                where: { id: agentId },
                data: {
                    status: 'available',
                    ticketsHandled: {
                        increment: 1
                    }
                }
            });

            // Calculate and update handling time
            if (ticket.servicedAt) {
                const handlingTime = (new Date().getTime() - new Date(ticket.servicedAt).getTime()) / (1000 * 60); // in minutes
                await updateAgentStats(agentId, handlingTime);
            }

            // Notify all relevant parties
            io.to(`ticket:${ticketId}`).emit('ticket-status-update', {
                ticketId,
                status: 'completed'
            });

            // Update department stats
            const stats = await getDepartmentStats(ticket.departmentId);
            io.to(`department:${ticket.departmentId}`).emit('department-stats-update', {
                departmentId: ticket.departmentId,
                stats
            });

            // Notify the customer
            if (ticket.user) {
                io.to(`user:${ticket.user.id}`).emit('ticket-completed', {
                    ticketId
                });
            }

            callback({ success: true, ticket });
        } catch (error) {
            console.error('Error completing ticket:', error);
            callback({ success: false, error: error instanceof Error ? error.message : 'Failed to complete ticket' });
        }
    });

    // Update agent status
    socket.on('update-agent-status', async ({ agentId, status }, callback) => {
        try {
            const agent = await prisma.agent.update({
                where: { id: agentId },
                data: { status },
                include: {
                    department: true
                }
            });

            // Broadcast updated department stats
            const stats = await getDepartmentStats(agent.departmentId);
            io.to(`department:${agent.departmentId}`).emit('department-stats-update', {
                departmentId: agent.departmentId,
                stats
            });

            callback({ success: true, agent });
        } catch (error) {
            console.error('Error updating agent status:', error);
            callback({ success: false, error: 'Failed to update status' });
        }
    });
}

// Helper function to get department statistics
async function getDepartmentStats(departmentId: string) {
    const department = await prisma.department.findUnique({
        where: { id: departmentId },
        include: {
            agents: true,
            tickets: {
                where: {
                    status: 'waiting'
                }
            }
        }
    });

    if (!department) {
        return {
            avgWaitTime: 0,
            activeAgents: 0,
            waitingTickets: 0,
            avgServiceTime: 0
        };
    }

    const activeAgents = department.agents.filter(a => a.status === 'available').length;
    const waitingTickets = department.tickets.length;

    // Calculate average service time from completed tickets
    const completedTickets = await prisma.ticket.findMany({
        where: {
            departmentId,
            status: 'completed',
            servicedAt: { not: null },
            completedAt: { not: null }
        }
    });

    const avgServiceTime = completedTickets.length > 0
        ? completedTickets.reduce((sum, ticket) => {
            const serviceTime = ticket.completedAt && ticket.servicedAt
                ? (new Date(ticket.completedAt).getTime() - new Date(ticket.servicedAt).getTime()) / (1000 * 60)
                : 0;
            return sum + serviceTime;
        }, 0) / completedTickets.length
        : 10; // Default to 10 minutes if no data

    return {
        avgWaitTime: activeAgents > 0 ? Math.ceil((waitingTickets * avgServiceTime) / activeAgents) : waitingTickets * avgServiceTime,
        activeAgents,
        waitingTickets,
        avgServiceTime
    };
}

// Helper function to update agent statistics
async function updateAgentStats(agentId: string, handlingTime: number) {
    const agent = await prisma.agent.findUnique({
        where: { id: agentId }
    });

    if (!agent) return;

    const newAvgHandlingTime = agent.ticketsHandled > 0
        ? ((agent.avgHandlingTime * (agent.ticketsHandled - 1)) + handlingTime) / agent.ticketsHandled
        : handlingTime;

    await prisma.agent.update({
        where: { id: agentId },
        data: {
            avgHandlingTime: newAvgHandlingTime
        }
    });
} 