const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const handleCustomerEvents = (io, socket) => {
    // Join customer room
    socket.on('join-customer-room', (userId) => {
        socket.join(`customer:${userId}`);
    });

    // Get customer queue data
    socket.on('get-customer-queue-data', async ({ ticketId }, callback) => {
        try {
            const ticket = await prisma.ticket.findUnique({
                where: { id: ticketId },
                include: {
                    department: true,
                    agent: true
                }
            });

            if (!ticket) {
                return callback({ success: false, error: 'Ticket not found' });
            }

            // Get queue position
            const queuePosition = await prisma.ticket.count({
                where: {
                    departmentId: ticket.departmentId,
                    status: 'waiting',
                    createdAt: { lt: ticket.createdAt }
                }
            });

            // Get estimated wait time
            const avgWaitTime = await calculateDepartmentWaitTime(ticket.departmentId);

            // Get total queue length
            const queueLength = await prisma.ticket.count({
                where: {
                    departmentId: ticket.departmentId,
                    status: 'waiting'
                }
            });

            callback({
                success: true,
                data: {
                    ticketNumber: ticket.number,
                    status: ticket.status,
                    position: queuePosition + 1,
                    estimatedWaitTime: Math.round(avgWaitTime * (queuePosition + 1)),
                    queueLength,
                    department: ticket.department.name,
                    agent: ticket.agent ? {
                        name: ticket.agent.name,
                        status: ticket.agent.status
                    } : null
                }
            });
        } catch (error) {
            console.error('Error fetching customer queue data:', error);
            callback({ success: false, error: error.message });
        }
    });

    // Helper function to calculate average wait time
    async function calculateDepartmentWaitTime(departmentId) {
        const completedTickets = await prisma.ticket.findMany({
            where: {
                departmentId,
                status: 'completed',
                servicedAt: { not: null },
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
            },
            select: {
                createdAt: true,
                servicedAt: true
            }
        });

        if (completedTickets.length === 0) return 5; // Default 5 minutes if no data

        const totalWaitTime = completedTickets.reduce((sum, ticket) => {
            return sum + (new Date(ticket.servicedAt).getTime() - new Date(ticket.createdAt).getTime());
        }, 0);

        return (totalWaitTime / completedTickets.length) / (1000 * 60); // Convert to minutes
    }
};

module.exports = handleCustomerEvents; 