const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Helper functions
const calculateAverageWaitTime = (tickets) => {
  if (!tickets || tickets.length === 0) return 0;
  const totalWaitTime = tickets.reduce((sum, ticket) => {
    return sum + (ticket.waitTime || 0);
  }, 0);
  return Math.round(totalWaitTime / tickets.length);
};

const calculateTicketCompletion = async (startDate) => {
  const [completed, total] = await Promise.all([
    prisma.ticket.count({
      where: {
        status: 'completed',
        createdAt: { gte: startDate }
      }
    }),
    prisma.ticket.count({
      where: {
        createdAt: { gte: startDate }
      }
    })
  ]);
  return total ? Math.round((completed / total) * 100) : 0;
};

const calculatePeakHours = async (startDate) => {
  const tickets = await prisma.ticket.findMany({
    where: {
      createdAt: { gte: startDate }
    },
    select: {
      createdAt: true
    }
  });

  // Group tickets by hour and count
  const hourCounts = tickets.reduce((acc, ticket) => {
    const hour = ticket.createdAt.getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {});

  // Convert to array and sort by count
  return Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Return top 5 peak hours
};

// Helper function to get current dashboard data
const getDashboardData = async () => {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const [activeTickets, departments, agents] = await Promise.all([
    prisma.ticket.findMany({
      where: {
        status: { in: ['waiting', 'serving'] },
        createdAt: { gte: startDate }
      },
      include: {
        Department: true,
        Agent: true,
        user: true,
        assignedAgent: true
      }
    }),
    prisma.department.findMany({
      include: {
        tickets: true,
        agents: true
      }
    }),
    prisma.agent.findMany({
      include: {
        department: true,
        tickets: {
          where: {
            status: 'serving'
          }
        }
      }
    })
  ]);

  // Format active tickets for the admin dashboard
  const formattedActiveTickets = activeTickets.map(ticket => ({
    id: ticket.id,
    number: ticket.number,
    customerName: ticket.user ? ticket.user.username : ticket.customerName,
    department: ticket.Department.name,
    serviceName: ticket.service,
    status: ticket.status,
    waitTime: Math.floor((new Date() - new Date(ticket.createdAt)) / (1000 * 60)),
    assignedAgent: ticket.assignedAgent ? ticket.assignedAgent.name : undefined
  }));

  return {
    stats: {
      totalActiveTickets: activeTickets.length,
      avgWaitTime: calculateAverageWaitTime(activeTickets),
      customersServed: await prisma.ticket.count({
        where: {
          status: 'completed',
          createdAt: { gte: startDate }
        }
      }),
      ticketCompletion: await calculateTicketCompletion(startDate)
    },
    departmentStats: departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      activeTickets: dept.tickets.filter(t => ['waiting', 'serving'].includes(t.status)).length,
      avgWaitTime: calculateAverageWaitTime(dept.tickets),
      agentsAvailable: dept.agents.filter(a => a.status === 'available').length
    })),
    agents: agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      department: agent.department.name,
      status: agent.status,
      ticketsHandled: agent.tickets.length
    })),
    activeTickets: formattedActiveTickets
  };
};

// Dashboard event handlers
const handleDashboardEvents = (io, socket) => {
  // Get dashboard data
  socket.on('get-dashboard-data', async ({ timeRange }, callback) => {
    try {
      let startDate = new Date();

      // Adjust date range based on selection
      switch (timeRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        default: // today
          startDate.setHours(0, 0, 0, 0);
      }

      const dashboardData = await getDashboardData();
      callback({
        success: true,
        ...dashboardData,
        peakHours: await calculatePeakHours(startDate)
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Broadcast updates when ticket status changes
  socket.on('ticket-status-changed', async (data) => {
    try {
      // Update all connected clients with new data
      const dashboardData = await getDashboardData();
      io.emit('dashboard-update', dashboardData);

      // Update specific agent's dashboard if ticket is assigned
      if (data.agentId) {
        io.to(`agent:${data.agentId}`).emit('agent-ticket-update', {
          ticketId: data.ticketId,
          status: data.status
        });
      }
    } catch (error) {
      console.error('Error broadcasting ticket update:', error);
    }
  });

  // Listen for ticket creation events
  socket.on('ticket-created', async (ticketData) => {
    try {
      // Fetch updated dashboard data
      const dashboardData = await getDashboardData();

      // Broadcast to all admin dashboards
      io.to('admin-dashboard').emit('dashboard-update', dashboardData);
    } catch (error) {
      console.error('Error updating dashboard after ticket creation:', error);
    }
  });

  // Join admin dashboard room when an admin connects
  socket.on('join-admin-dashboard', () => {
    socket.join('admin-dashboard');
  });

  // Agent event handlers
  socket.on('join-agent-room', (agentId) => {
    socket.join(`agent:${agentId}`);
    console.log(`Agent ${agentId} joined their room`);
  });

  socket.on('leave-agent-room', (agentId) => {
    socket.leave(`agent:${agentId}`);
    console.log(`Agent ${agentId} left their room`);
  });

  socket.on('get-agent-stats', async ({ agentId }, callback) => {
    try {
      // Log the prisma object to debug
      console.log('Prisma client in get-agent-stats:', !!prisma);

      // Make sure to use the prisma parameter that was passed in
      const agent = await prisma.agent.findUnique({ where: { id: agentId } });

      // Prepare agent stats
      const agentStats = {
        ticketsHandled: agent.ticketsHandled || 0,
        avgHandlingTime: agent.avgHandlingTime || 0,
        customerSatisfaction: agent.customerSatisfaction || 0,
        status: agent.status || 'offline'
      };

      callback({ success: true, stats: agentStats });
    } catch (error) {
      console.error('Error fetching agent stats:', error);
      callback({ success: false, error: 'Failed to fetch agent stats' });
    }
  });

  socket.on('update-agent-status', async ({ agentId, status }, callback) => {
    try {
      // Update agent status in database
      await prisma.agent.update({
        where: { id: agentId },
        data: { status }
      });

      // Get updated dashboard data
      const dashboardData = await getDashboardData();

      // Broadcast updates to all connected clients
      io.emit('dashboard-update', dashboardData);

      // Notify specific agent
      io.to(`agent:${agentId}`).emit('status-updated', { status });

      callback({ success: true });
    } catch (error) {
      console.error('Error updating agent status:', error);
      callback({ success: false, error: error.message });
    }
  });

  socket.on('get-current-ticket', async ({ agentId }, callback) => {
    try {
      // Find current ticket assigned to agent
      const ticket = await prisma.ticket.findFirst({
        where: {
          assignedAgentId: agentId,
          status: 'serving'
        }
      });

      callback({
        success: true,
        ticket: ticket ? {
          id: ticket.id.toString(),
          number: ticket.number,
          customerName: ticket.customerName,
          service: ticket.service,
          waitTime: Math.floor((new Date() - new Date(ticket.createdAt)) / (1000 * 60)),
          status: 'serving'
        } : null
      });
    } catch (error) {
      console.error('Error fetching current ticket:', error);
      callback({
        success: false,
        error: error.message
      });
    }
  });

  socket.on('complete-ticket', async ({ ticketId, agentId }, callback) => {
    try {
      // Update ticket status in database
      const result = await prisma.ticket.update({
        where: { id: ticketId, assignedAgentId: agentId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });

      if (!result) {
        return callback({
          success: false,
          error: 'Ticket not found or not assigned to this agent'
        });
      }

      // Update queue and notify clients
      io.emit('queue-update', await getQueueLength(prisma));

      // Update dashboard stats
      io.emit('dashboard-update', await getDashboardData(prisma));

      callback({ success: true });
    } catch (error) {
      console.error('Error completing ticket:', error);
      callback({
        success: false,
        error: error.message
      });
    }
  });

  socket.on('get-next-ticket', async ({ agentId }, callback) => {
    try {
      // Find next ticket in queue
      const nextTicket = await prisma.ticket.findFirst({
        where: { status: 'waiting' },
        orderBy: { priority: -1, createdAt: 1 }
      });

      if (!nextTicket) {
        return callback({
          success: true,
          ticket: null
        });
      }

      // Assign ticket to agent
      const result = await prisma.ticket.update({
        where: { id: nextTicket.id },
        data: {
          status: 'serving',
          assignedAgentId: agentId,
          servicedAt: new Date()
        }
      });

      if (!result) {
        return callback({
          success: false,
          error: 'Ticket not found or not assigned to this agent'
        });
      }

      // Update queue and notify clients
      io.emit('queue-update', await getQueueLength(prisma));

      // Notify customer that their ticket is being served
      io.to(`customer:${nextTicket.userId}`).emit('ticket-called', {
        ticketId: nextTicket.id.toString(),
        ticketNumber: nextTicket.number
      });

      callback({
        success: true,
        ticket: {
          id: nextTicket.id.toString(),
          number: nextTicket.number,
          customerName: nextTicket.customerName,
          service: nextTicket.service,
          waitTime: Math.floor((new Date() - new Date(nextTicket.createdAt)) / (1000 * 60)),
          status: 'serving'
        }
      });
    } catch (error) {
      console.error('Error getting next ticket:', error);
      callback({
        success: false,
        error: error.message
      });
    }
  });

  socket.on('transfer-ticket', async ({ ticketId, fromAgentId, toDepartment }, callback) => {
    try {
      // Update ticket in database
      const result = await prisma.ticket.update({
        where: { id: ticketId, assignedAgentId: fromAgentId },
        data: {
          status: 'waiting',
          departmentId: toDepartment,
          assignedAgentId: null,
          servicedAt: new Date()
        }
      });

      if (!result) {
        return callback({
          success: false,
          error: 'Ticket not found or not assigned to this agent'
        });
      }

      // Update queue and notify clients
      io.emit('queue-update', await getQueueLength(prisma));

      callback({ success: true });
    } catch (error) {
      console.error('Error transferring ticket:', error);
      callback({
        success: false,
        error: error.message
      });
    }
  });

  // Admin ticket management handlers
  socket.on('admin-complete-ticket', async ({ ticketId }, callback) => {
    try {
      const ticket = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'completed',
          completedAt: new Date()
        },
        include: {
          Department: true,
          user: true,
          assignedAgent: true
        }
      });

      // Notify all relevant parties
      io.emit('ticket-status-update', {
        ticketId,
        status: 'completed'
      });

      // Update dashboard data
      const dashboardData = await getDashboardData();
      io.emit('dashboard-update', dashboardData);

      // Notify the customer if they exist
      if (ticket.user) {
        io.to(`user:${ticket.user.id}`).emit('ticket-completed', {
          ticketId
        });
      }

      // Notify the assigned agent if exists
      if (ticket.assignedAgent) {
        io.to(`agent:${ticket.assignedAgent.id}`).emit('ticket-completed', {
          ticketId
        });
      }

      callback({ success: true });
    } catch (error) {
      console.error('Error completing ticket:', error);
      callback({ success: false, error: error.message });
    }
  });

  socket.on('admin-cancel-ticket', async ({ ticketId }, callback) => {
    try {
      const ticket = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: 'cancelled',
          completedAt: new Date()
        },
        include: {
          Department: true,
          user: true,
          assignedAgent: true
        }
      });

      // Notify all relevant parties
      io.emit('ticket-status-update', {
        ticketId,
        status: 'cancelled'
      });

      // Update dashboard data
      const dashboardData = await getDashboardData();
      io.emit('dashboard-update', dashboardData);

      // Notify the customer if they exist
      if (ticket.user) {
        io.to(`user:${ticket.user.id}`).emit('ticket-cancelled', {
          ticketId
        });
      }

      // Notify the assigned agent if exists
      if (ticket.assignedAgent) {
        io.to(`agent:${ticket.assignedAgent.id}`).emit('ticket-cancelled', {
          ticketId
        });
      }

      callback({ success: true });
    } catch (error) {
      console.error('Error cancelling ticket:', error);
      callback({ success: false, error: error.message });
    }
  });

  socket.on('admin-forward-ticket', async ({ ticketId, departmentId }, callback) => {
    try {
      const ticket = await prisma.ticket.update({
        where: { id: ticketId },
        data: {
          departmentId,
          assignedAgentId: null,
          status: 'waiting'
        },
        include: {
          Department: true,
          user: true,
          assignedAgent: true
        }
      });

      // Notify all relevant parties
      io.emit('ticket-status-update', {
        ticketId,
        status: 'waiting',
        departmentId
      });

      // Update dashboard data
      const dashboardData = await getDashboardData();
      io.emit('dashboard-update', dashboardData);

      // Notify the customer if they exist
      if (ticket.user) {
        io.to(`user:${ticket.user.id}`).emit('ticket-forwarded', {
          ticketId,
          departmentName: ticket.Department.name
        });
      }

      // Notify the previously assigned agent if exists
      if (ticket.assignedAgent) {
        io.to(`agent:${ticket.assignedAgent.id}`).emit('ticket-forwarded', {
          ticketId
        });
      }

      callback({ success: true });
    } catch (error) {
      console.error('Error forwarding ticket:', error);
      callback({ success: false, error: error.message });
    }
  });

  socket.on('admin-view-documents', async ({ ticketId }, callback) => {
    try {
      const documents = await prisma.document.findMany({
        where: { ticketId },
        select: {
          id: true,
          filename: true,
          fileType: true,
          uploadedAt: true,
          url: true
        }
      });

      callback({ success: true, documents });
    } catch (error) {
      console.error('Error fetching ticket documents:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Helper function to get queue length
  const getQueueLength = async (prisma) => {
    return await prisma.ticket.count({ where: { status: 'waiting' } });
  };
};

module.exports = handleDashboardEvents;