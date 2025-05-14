import React, { useState, useEffect, useCallback } from 'react';
import { Users, Clock, BarChart2, Clipboard, XIcon, FileText } from 'lucide-react';
import { useQueue } from '../../contexts/QueueContext';
import { useNotification } from '../../contexts/NotificationContext';
import type { Socket } from 'socket.io-client';

interface QueueContextType {
  socket: Socket | null;
  isConnected: boolean;
}

interface NotificationContextType {
  addNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface DashboardResponse {
  success: boolean;
  stats: {
    totalActiveTickets: number;
    avgWaitTime: number;
    customersServed: number;
    ticketCompletion: number;
  };
  departmentStats: DepartmentStats[];
  agents: Agent[];
  peakHours: PeakHourData[];
  activeTickets?: Ticket[];
  error?: string;
}

interface DepartmentStats {
  id: string;
  name: string;
  activeTickets: number;
  avgWaitTime: number;
  agentsAvailable: number;
}

interface Agent {
  id: string;
  name: string;
  department: string;
  status: 'available' | 'busy' | 'offline';
  ticketsHandled: number;
}

interface PeakHourData {
  hour: number;
  count: number;
}

interface Ticket {
  id: string;
  number: string;
  customerName: string;
  department: string;
  serviceName: string;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled';
  waitTime: number;
  assignedAgent?: string;
  documents?: Document[];
}

interface Document {
  id: string;
  filename: string;
  fileType: string;
  uploadedAt: string;
  url: string;
}

interface TicketStatusUpdate {
  ticketId: string;
  status: 'waiting' | 'serving' | 'completed' | 'cancelled';
}

const AdminDashboard: React.FC = () => {
  const { socket, isConnected } = useQueue() as QueueContextType;
  const { addNotification } = useNotification() as NotificationContextType;
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // State for real-time data
  const [stats, setStats] = useState({
    totalActiveTickets: 0,
    avgWaitTime: 0,
    customersServed: 0,
    ticketCompletion: 0
  });

  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [peakHours, setPeakHours] = useState<PeakHourData[]>([]);

  // New state for ticket management
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

  // Request dashboard data from server
  const fetchDashboardData = useCallback(() => {
    if (!socket || !isConnected) return;

    setIsLoading(true);
    socket.emit('get-dashboard-data', { timeRange }, (response: DashboardResponse) => {
      if (response.success) {
        setStats(response.stats);
        setDepartmentStats(response.departmentStats);
        setAgents(response.agents);
        setPeakHours(response.peakHours);
        setActiveTickets(response.activeTickets || []);
        setLastUpdated(new Date());
      } else {
        addNotification(response.error || 'Failed to fetch dashboard data', 'error');
        if (retryCount < maxRetries) {
          setTimeout(fetchDashboardData, 5000);
          setRetryCount(prev => prev + 1);
        }
      }
      setIsLoading(false);
    });
  }, [socket, isConnected, timeRange, retryCount, maxRetries, addNotification]);

  // Fetch dashboard data based on selected time range
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const initializeDashboard = () => {
      // Initial fetch
      fetchDashboardData();

      // Listen for real-time updates
      if (socket && isConnected) {
        socket.on('dashboard-update', (data: DashboardResponse) => {
          if (data.success) {
            setStats(data.stats);
            setDepartmentStats(data.departmentStats);
            setAgents(data.agents);
            setPeakHours(data.peakHours);
            setLastUpdated(new Date());
          }
        });

        // Listen for agent status changes
        socket.on('agent-status-update', (updatedAgent: Agent) => {
          setAgents(prevAgents =>
            prevAgents.map(agent =>
              agent.id === updatedAgent.id ? updatedAgent : agent
            )
          );
        });

        // Set up polling for data refresh (as a fallback)
        intervalId = setInterval(fetchDashboardData, 30000); // Every 30 seconds

        // Join admin dashboard room
        socket.emit('join-admin-dashboard');
      }
    };

    initializeDashboard();

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (socket) {
        socket.off('dashboard-update');
        socket.off('agent-status-update');
        socket.emit('leave-admin-dashboard');
      }
    };
  }, [socket, timeRange, isConnected, fetchDashboardData]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for ticket updates
    socket.on('ticket-status-update', ({ ticketId, status }: TicketStatusUpdate) => {
      setActiveTickets(prev => prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, status } : ticket
      ));
    });

    return () => {
      socket.off('ticket-status-update');
    };
  }, [socket, isConnected]);

  // Handle ticket actions
  const handleCompleteTicket = (ticketId: string) => {
    if (!socket || !isConnected) return;

    socket.emit('admin-complete-ticket', { ticketId }, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        addNotification('Ticket completed successfully', 'success');
        setActiveTickets(prev => prev.filter(t => t.id !== ticketId));
      } else {
        addNotification(response.error || 'Failed to complete ticket', 'error');
      }
    });
  };

  const handleCancelTicket = (ticketId: string) => {
    if (!socket || !isConnected) return;

    socket.emit('admin-cancel-ticket', { ticketId }, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        addNotification('Ticket cancelled successfully', 'success');
        setActiveTickets(prev => prev.filter(t => t.id !== ticketId));
      } else {
        addNotification(response.error || 'Failed to cancel ticket', 'error');
      }
    });
  };

  const handleForwardTicket = (ticketId: string, departmentId: string) => {
    if (!socket || !isConnected) return;

    socket.emit('admin-forward-ticket', { ticketId, departmentId }, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        addNotification('Ticket forwarded successfully', 'success');
        setSelectedDepartment('');
      } else {
        addNotification(response.error || 'Failed to forward ticket', 'error');
      }
    });
  };

  const handleViewDocuments = (ticketId: string) => {
    if (!socket || !isConnected) return;

    socket.emit('admin-view-documents', { ticketId }, (response: { success: boolean; documents?: Document[]; error?: string }) => {
      if (response.success && response.documents) {
        setDocuments(response.documents);
        setShowDocuments(true);
      } else {
        addNotification(response.error || 'Failed to fetch documents', 'error');
      }
    });
  };

  return (
    <div>
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="mt-1 text-gray-600">Overview of queue performance and metrics</p>
          </div>
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setTimeRange('today')}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg ${timeRange === 'today'
                ? 'bg-blue-700 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-200`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('week')}
              className={`px-4 py-2 text-sm font-medium ${timeRange === 'week'
                ? 'bg-blue-700 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
                } border-t border-b border-gray-200`}
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setTimeRange('month')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${timeRange === 'month'
                ? 'bg-blue-700 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
                } border border-gray-200`}
            >
              This Month
            </button>
            <button
              onClick={fetchDashboardData}
              className="ml-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              title="Refresh data"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading dashboard data...</span>
        </div>
      )}

      {/* Connection Status Indicator */}
      <div className={`mb-4 px-4 py-2 rounded-md ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`h-3 w-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <p className="text-sm font-medium">
              {isConnected ? 'Connected to queue server' : 'Connecting to queue server...'}
            </p>
          </div>
          {!isConnected && (
            <button
              onClick={() => {
                setRetryCount(0);
                fetchDashboardData();
              }}
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Retry Connection
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <Clipboard size={24} className="text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalActiveTickets}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium flex items-center">
              <span className="text-xs">↑</span> 8%
            </span>
            <span className="ml-2 text-gray-600">from last {timeRange}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <Clock size={24} className="text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Avg. Wait Time</p>
              <p className="text-2xl font-bold text-gray-900">{stats.avgWaitTime} min</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-red-600 font-medium flex items-center">
              <span className="text-xs">↑</span> 3%
            </span>
            <span className="ml-2 text-gray-600">from last {timeRange}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <Users size={24} className="text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Customers Served</p>
              <p className="text-2xl font-bold text-gray-900">{stats.customersServed}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium flex items-center">
              <span className="text-xs">↑</span> 12%
            </span>
            <span className="ml-2 text-gray-600">from last {timeRange}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 mr-4">
              <BarChart2 size={24} className="text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ticket Completion</p>
              <p className="text-2xl font-bold text-gray-900">{stats.ticketCompletion}%</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium flex items-center">
              <span className="text-xs">↑</span> 4%
            </span>
            <span className="ml-2 text-gray-600">from last {timeRange}</span>
          </div>
        </div>
      </div>

      {/* Department Stats */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Activity</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Active Tickets
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Wait Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agents Available
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departmentStats.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{dept.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{dept.activeTickets}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{dept.avgWaitTime} min</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${dept.agentsAvailable < 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {dept.agentsAvailable}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-blue-700 hover:text-blue-900">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Live Queue Activity and Agent Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Agent Status</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tickets Handled
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {agents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-700 flex items-center justify-center text-white">
                            {agent.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{agent.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${agent.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : agent.status === 'busy'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.ticketsHandled}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Peak Hours Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Peak Hours</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900">Busiest Times</h3>
              <div className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
            </div>

            <div className="space-y-3">
              {peakHours.map((peak, index) => (
                <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-md mr-3">
                    <Clock size={16} className="text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {peak.hour === 0 ? '12 AM' :
                        peak.hour < 12 ? `${peak.hour} AM` :
                          peak.hour === 12 ? '12 PM' :
                            `${peak.hour - 12} PM`}
                    </p>
                    <p className="text-xs text-gray-600">{peak.count} tickets</p>
                  </div>
                  <div className="ml-auto">
                    <div className="w-24 bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${(peak.count / Math.max(...peakHours.map(p => p.count))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}

              {peakHours.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-gray-500">No peak hour data available</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <button className="w-full px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium rounded-md">
                View Detailed Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Tickets Section */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Tickets</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket #
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wait Time
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{ticket.number}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.serviceName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${ticket.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                          ticket.status === 'serving' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ticket.waitTime} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleCompleteTicket(ticket.id)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => handleCancelTicket(ticket.id)}
                        className="text-red-600 hover:text-red-900 mr-3"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setSelectedTicket(ticket)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Forward
                      </button>
                      <button
                        onClick={() => handleViewDocuments(ticket.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        View Docs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Forward Ticket Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Forward Ticket #{selectedTicket.number}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label="Select department for forwarding"
              >
                <option value="">Select a department</option>
                {departmentStats.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setSelectedDepartment('');
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedDepartment) {
                    handleForwardTicket(selectedTicket.id, selectedDepartment);
                    setSelectedTicket(null);
                  }
                }}
                disabled={!selectedDepartment}
                className={`px-4 py-2 text-sm font-medium text-white rounded-md ${selectedDepartment
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-blue-400 cursor-not-allowed'
                  }`}
              >
                Forward
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Documents Modal */}
      {showDocuments && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Uploaded Documents</h3>
              <button
                onClick={() => {
                  setShowDocuments(false);
                  setDocuments([]);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <XIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <FileText className="h-6 w-6 text-gray-400" />
                    <span className="ml-2 text-sm font-medium text-gray-900">{doc.filename}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </span>
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
              {documents.length === 0 && (
                <p className="text-center text-gray-500 py-4">No documents found for this ticket.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Live Updates Indicator */}
      <div className="mt-6 text-right text-sm text-gray-500">
        <p>Live data - Last updated: {lastUpdated.toLocaleTimeString()}</p>
        <p>Auto-refreshes every 30 seconds</p>
      </div>
    </div>
  );
};

export default AdminDashboard;