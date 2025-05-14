import { Server, Socket } from 'socket.io';
import { PrismaClient, Ticket, Agent } from '@prisma/client';

const prisma = new PrismaClient();

interface TimeRange {
  start: Date;
  end: Date;
}

interface DashboardStats {
  departments: DepartmentStat[];
  overallStats: {
    totalActiveTickets: number;
    totalCompletedTickets: number;
    totalActiveAgents: number;
    totalBusyAgents: number;
    averageWaitTime: number;
    serviceEfficiency: number;
  };
}

interface DepartmentStat {
  id: string;
  name: string;
  activeAgents: number;
  waitingTickets: number;
  servingTickets: number;
  totalAgents: number;
}

interface AgentMetrics {
  totalTicketsHandled: number;
  averageHandlingTime: number;
  customerSatisfaction: number;
  ticketsByPriority: Record<string, number>;
  performanceScore: number;
}

// Define the handler function
const handleDashboardEvents = (io: Server, socket: Socket) => {
  // Admin joins dashboard room
  socket.on('join-admin-dashboard', () => {
    socket.join('admin-dashboard');
  });

  // Get real-time dashboard data
  socket.on('get-dashboard-data', async (callback) => {
    try {
      const dashboardData = await getDashboardData();
      callback({ success: true, data: dashboardData });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      callback({ success: false, error: 'Failed to fetch dashboard data' });
    }
  });

  // Subscribe to department updates
  socket.on('subscribe-to-departments', async (departmentIds: string[]) => {
    departmentIds.forEach(id => {
      socket.join(`department:${id}`);
    });
  });

  // Get department performance metrics
  socket.on('get-department-metrics', async ({ departmentId, timeRange }: { departmentId: string; timeRange: TimeRange }, callback) => {
    try {
      const metrics = await getDepartmentMetrics(departmentId, timeRange);
      callback({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching department metrics:', error);
      callback({ success: false, error: 'Failed to fetch department metrics' });
    }
  });

  // Get agent performance metrics
  socket.on('get-agent-metrics', async ({ agentId, timeRange }: { agentId: string; timeRange: TimeRange }, callback) => {
    try {
      const metrics = await getAgentMetrics(agentId, timeRange);
      callback({ success: true, data: metrics });
    } catch (error) {
      console.error('Error fetching agent metrics:', error);
      callback({ success: false, error: 'Failed to fetch agent metrics' });
    }
  });

  // Handle agent joining their room
  socket.on('join-agent-room', (agentId: string) => {
    if (agentId) {
      socket.join(`agent-${agentId}`);
      console.log(`Agent ${agentId} joined their room`);
    }
  });

  // Handle getting agent stats
  socket.on('get-agent-stats', async ({ agentId }, callback) => {
    try {
      if (!agentId) {
        throw new Error('Agent ID is required');
      }

      // In a real implementation, fetch from database
      // For now, return mock data
      const stats = {
        ticketsHandled: 12,
        avgHandlingTime: 8,
        customerSatisfaction: 4.7,
        status: 'available'
      };

      callback({ success: true, stats });
    } catch (error) {
      console.error('Error getting agent stats:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Handle updating agent status
  socket.on('update-agent-status', async ({ agentId, status }, callback) => {
    try {
      console.log(`Updating agent ${agentId} status to ${status}`);

      if (!agentId) {
        throw new Error('Agent ID is required');
      }

      // Validate status
      if (!['available', 'busy', 'offline'].includes(status)) {
        throw new Error('Invalid status value');
      }

      // In a real implementation, update in database
      // For example:
      // await prisma.agent.update({
      //   where: { id: agentId },
      //   data: { status }
      // });

      // For now, just return success
      callback({ success: true });
    } catch (error) {
      console.error('Error updating agent status:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Handle getting current ticket
  socket.on('get-current-ticket', async ({ agentId }, callback) => {
    try {
      // In a real implementation, fetch from database
      // For now, return mock data or null
      const ticket = null; // or mock data

      callback({ success: true, ticket });
    } catch (error) {
      console.error('Error getting current ticket:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Handle getting next ticket
  socket.on('get-next-ticket', async ({ agentId }, callback) => {
    try {
      if (!agentId) {
        throw new Error('Agent ID is required');
      }

      // In a real implementation, fetch from queue and assign to agent
      // For now, return mock data or null
      const ticket = null; // or mock data

      callback({ success: true, ticket });
    } catch (error) {
      console.error('Error getting next ticket:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Handle completing a ticket
  socket.on('complete-ticket', async ({ ticketId, agentId }, callback) => {
    try {
      // In a real implementation, update ticket status in database
      // For now, just return success
      callback({ success: true });
    } catch (error) {
      console.error('Error completing ticket:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Handle transferring a ticket
  socket.on('transfer-ticket', async ({ ticketId, fromAgentId, toDepartment }, callback) => {
    try {
      // In a real implementation, update ticket assignment in database
      // For now, just return success
      callback({ success: true });
    } catch (error) {
      console.error('Error transferring ticket:', error);
      callback({ success: false, error: error.message });
    }
  });

  // Handle getting queue length
  socket.on('get-queue-length', async (callback) => {
    try {
      // In a real implementation, count waiting tickets in database
      // For now, return mock data
      callback({ success: true, length: 5 });
    } catch (error) {
      console.error('Error getting queue length:', error);
      callback({ success: false, error: error.message });
    }
  });
};

// Helper function to get dashboard data
async function getDashboardData(): Promise<DashboardStats> {
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);

  const [departments, agents, tickets] = await Promise.all([
    prisma.department.findMany({
      include: {
        agents: true,
        tickets: {
          where: {
            status: { in: ['waiting', 'serving'] }
          }
        }
      }
    }),
    prisma.agent.findMany({
      where: {
        status: { not: 'offline' }
      }
    }),
    prisma.ticket.findMany({
      where: {
        createdAt: { gte: startDate }
      }
    })
  ]);

  // Calculate department statistics
  const departmentStats = departments.map(dept => ({
    id: dept.id,
    name: dept.name,
    activeAgents: dept.agents.filter(a => a.status === 'available').length,
    waitingTickets: dept.tickets.filter(t => t.status === 'waiting').length,
    servingTickets: dept.tickets.filter(t => t.status === 'serving').length,
    totalAgents: dept.agents.length
  }));

  // Calculate overall statistics
  const totalActiveTickets = tickets.filter(t => t.status === 'waiting' || t.status === 'serving').length;
  const totalCompletedTickets = tickets.filter(t => t.status === 'completed').length;
  const totalActiveAgents = agents.filter(a => a.status === 'available').length;
  const totalBusyAgents = agents.filter(a => a.status === 'busy').length;

  return {
    departments: departmentStats,
    overallStats: {
      totalActiveTickets,
      totalCompletedTickets,
      totalActiveAgents,
      totalBusyAgents,
      averageWaitTime: await calculateAverageWaitTime(),
      serviceEfficiency: calculateServiceEfficiency(totalCompletedTickets, totalActiveTickets)
    }
  };
}

// Helper function to get department metrics
async function getDepartmentMetrics(departmentId: string, timeRange: TimeRange) {
  const tickets = await prisma.ticket.findMany({
    where: {
      departmentId,
      createdAt: {
        gte: timeRange.start,
        lte: timeRange.end
      }
    },
    include: {
      assignedAgent: true
    }
  });

  const completedTickets = tickets.filter(t => t.status === 'completed');

  return {
    totalTickets: tickets.length,
    completedTickets: completedTickets.length,
    averageHandlingTime: calculateAverageHandlingTime(completedTickets),
    customerSatisfaction: await calculateCustomerSatisfaction(departmentId, timeRange),
    peakHours: calculatePeakHours(tickets),
    agentPerformance: await getAgentPerformanceByDepartment(departmentId, timeRange)
  };
}

// Helper function to get agent metrics
async function getAgentMetrics(agentId: string, timeRange: TimeRange): Promise<AgentMetrics> {
  const tickets = await prisma.ticket.findMany({
    where: {
      assignedAgentId: agentId,
      createdAt: {
        gte: timeRange.start,
        lte: timeRange.end
      }
    }
  });

  const completedTickets = tickets.filter(t => t.status === 'completed');

  return {
    totalTicketsHandled: completedTickets.length,
    averageHandlingTime: calculateAverageHandlingTime(completedTickets),
    customerSatisfaction: await calculateCustomerSatisfaction(agentId, timeRange),
    ticketsByPriority: calculateTicketsByPriority(tickets),
    performanceScore: calculateAgentPerformanceScore(completedTickets)
  };
}

// Helper function to calculate average wait time
async function calculateAverageWaitTime(): Promise<number> {
  const completedTickets = await prisma.ticket.findMany({
    where: {
      status: 'completed',
      servicedAt: { not: null },
      createdAt: { not: null }
    }
  });

  if (completedTickets.length === 0) return 0;

  const totalWaitTime = completedTickets.reduce((sum, ticket) => {
    if (ticket.servicedAt && ticket.createdAt) {
      return sum + (new Date(ticket.servicedAt).getTime() - new Date(ticket.createdAt).getTime()) / (1000 * 60);
    }
    return sum;
  }, 0);

  return Math.round(totalWaitTime / completedTickets.length);
}

// Helper function to calculate service efficiency
function calculateServiceEfficiency(completed: number, active: number): number {
  if (completed + active === 0) return 0;
  return Math.round((completed / (completed + active)) * 100);
}

// Helper function to calculate average handling time
function calculateAverageHandlingTime(tickets: Ticket[]): number {
  if (tickets.length === 0) return 0;

  const totalTime = tickets.reduce((sum, ticket) => {
    if (ticket.completedAt && ticket.servicedAt) {
      return sum + (new Date(ticket.completedAt).getTime() - new Date(ticket.servicedAt).getTime()) / (1000 * 60);
    }
    return sum;
  }, 0);

  return Math.round(totalTime / tickets.length);
}

// Helper function to calculate customer satisfaction
async function calculateCustomerSatisfaction(id: string, timeRange: TimeRange): Promise<number> {
  const feedback = await prisma.ticketFeedback.findMany({
    where: {
      createdAt: {
        gte: timeRange.start,
        lte: timeRange.end
      },
      OR: [
        { departmentId: id },
        { agentId: id }
      ]
    }
  });

  if (feedback.length === 0) return 0;

  const totalRating = feedback.reduce((sum, f) => sum + f.rating, 0);
  return Math.round((totalRating / feedback.length) * 100) / 100;
}

// Helper function to calculate peak hours
function calculatePeakHours(tickets: Ticket[]): { hour: number; count: number }[] {
  const hourCounts = new Array(24).fill(0);

  tickets.forEach(ticket => {
    const hour = new Date(ticket.createdAt).getHours();
    hourCounts[hour]++;
  });

  return hourCounts.map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

// Helper function to get agent performance by department
async function getAgentPerformanceByDepartment(departmentId: string, timeRange: TimeRange) {
  const agents = await prisma.agent.findMany({
    where: {
      departmentId
    },
    include: {
      tickets: {
        where: {
          createdAt: {
            gte: timeRange.start,
            lte: timeRange.end
          }
        }
      }
    }
  });

  return agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    ticketsHandled: agent.tickets.filter(t => t.status === 'completed').length,
    avgHandlingTime: agent.avgHandlingTime,
    customerSatisfaction: agent.customerSatisfaction
  }));
}

// Helper function to calculate tickets by priority
function calculateTicketsByPriority(tickets: any[]): Record<string, number> {
  return tickets.reduce((acc, ticket) => {
    acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

// Helper function to calculate agent performance score
function calculateAgentPerformanceScore(tickets: any[]): number {
  if (tickets.length === 0) return 0;

  const avgHandlingTime = calculateAverageHandlingTime(tickets);
  const completionRate = tickets.length / (tickets.length + tickets.filter(t => t.status === 'cancelled').length);

  // Score is based on handling time (lower is better) and completion rate (higher is better)
  const handlingTimeScore = Math.max(0, 100 - (avgHandlingTime / 2)); // Assumes 50 minutes is worst case
  const completionScore = completionRate * 100;

  return Math.round((handlingTimeScore + completionScore) / 2);
}

export default handleDashboardEvents;