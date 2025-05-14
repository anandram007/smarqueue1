import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default function handleCustomerEvents(io: Server, socket: Socket) {
    // Get customer queue data
    socket.on('get-customer-queue-data', async ({ ticketId }, callback) => {
        try {
            const ticket = await prisma.ticket.findUnique({
                where: { id: ticketId },
                include: {
                    Department: true,
                    Agent: true,
                    user: true,
                    assignedAgent: true
                }
            });

            if (!ticket) {
                callback({ success: false, error: 'Ticket not found' });
                return;
            }

            // Get queue position and other waiting tickets in same department
            const waitingTickets = await prisma.ticket.findMany({
                where: {
                    departmentId: ticket.departmentId,
                    status: 'waiting'
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });

            // Calculate real-time statistics
            const position = waitingTickets.findIndex(t => t.id === ticketId) + 1;
            const departmentStats = await getDepartmentStats(ticket.departmentId);

            // Send response to requesting client
            callback({
                success: true,
                data: {
                    ticket,
                    position,
                    waitingCount: waitingTickets.length,
                    estimatedWaitTime: departmentStats.avgWaitTime,
                    departmentName: ticket.Department?.name || 'Unknown'
                }
            });

            // Broadcast updated stats to all clients in the department
            io.to(`department:${ticket.departmentId}`).emit('department-stats-update', {
                departmentId: ticket.departmentId,
                stats: departmentStats
            });

        } catch (error) {
            console.error('Error fetching customer queue data:', error);
            callback({ success: false, error: 'Failed to fetch queue data' });
        }
    });

    // Subscribe to ticket updates
    socket.on('subscribe-to-ticket', (ticketId: string) => {
        socket.join(`ticket:${ticketId}`);
    });

    // Unsubscribe from ticket updates
    socket.on('unsubscribe-from-ticket', (ticketId: string) => {
        socket.leave(`ticket:${ticketId}`);
    });

    // Subscribe to department updates
    socket.on('subscribe-to-department', (departmentId: string) => {
        socket.join(`department:${departmentId}`);
    });

    // Handle customer feedback
    socket.on('submit-feedback', async ({ ticketId, rating, comment }, callback) => {
        try {
            const feedback = await prisma.feedback.create({
                data: {
                    ticketId,
                    rating,
                    comment
                }
            });

            // Notify relevant parties about the feedback
            io.to(`ticket:${ticketId}`).emit('feedback-received', feedback);

            callback({ success: true, feedback });
        } catch (error) {
            console.error('Error submitting feedback:', error);
            callback({ success: false, error: 'Failed to submit feedback' });
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
            activeAgents: 0
        };
    }

    const activeAgents = department.agents.filter(a => a.status === 'available').length;
    const waitingTickets = department.tickets.length;

    // Calculate average wait time based on historical data
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