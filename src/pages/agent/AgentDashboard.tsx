import React, { useState, useEffect } from 'react';
import { Users, Clock, BarChart2, Clipboard } from 'lucide-react';
import { useAuth } from '../../contexts/hooks/useAuth';
import { useQueue } from '../../contexts/QueueContext';
import { useNotification } from '../../contexts/NotificationContext';
import { SOCKET_EVENTS } from '../../config/socket';
import type { AgentStats, CurrentTicket } from '../../types/agent';

const AgentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { socket, isConnected } = useQueue();
  const { addNotification } = useNotification();
  const [stats, setStats] = useState<AgentStats>({
    ticketsHandled: 0,
    avgHandlingTime: 0,
    customerSatisfaction: 0,
    status: 'offline'
  });
  const [currentTicket, setCurrentTicket] = useState<CurrentTicket | null>(null);
  const [queueLength, setQueueLength] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  // Initialize socket connection and event listeners
  useEffect(() => {
    if (!socket || !isConnected || !user?.id) return;

    // Join agent room
    socket.emit('join-agent-room', user.id);

    // Listen for ticket updates
    socket.on(SOCKET_EVENTS.TICKET_UPDATE, (ticket: CurrentTicket) => {
      if (currentTicket?.id === ticket.id) {
        setCurrentTicket(ticket);
        setLastUpdated(new Date());
      }
    });

    // Listen for queue updates
    socket.on(SOCKET_EVENTS.QUEUE_UPDATE, (length: number) => {
      setQueueLength(length);
      setLastUpdated(new Date());
    });

    // Fetch initial stats
    fetchAgentStats();

    // Set up periodic stats refresh
    const statsInterval = setInterval(fetchAgentStats, 30000);

    return () => {
      socket.off(SOCKET_EVENTS.TICKET_UPDATE);
      socket.off(SOCKET_EVENTS.QUEUE_UPDATE);
      clearInterval(statsInterval);
    };
  }, [socket, isConnected, user?.id]);

  // Fetch agent stats
  const fetchAgentStats = async () => {
    if (!socket || !isConnected || !user?.id) return;

    socket.emit('get-agent-stats', { agentId: user.id }, (response: { success: boolean; stats?: AgentStats; error?: string }) => {
      if (response.success && response.stats) {
        setStats(response.stats);
      } else {
        console.error('Failed to fetch agent stats:', response.error);
      }
    });
  };

  // Get next ticket
  const handleGetNextTicket = async () => {
    if (!socket || !isConnected || !user?.id) {
      addNotification('Not connected to server', 'error');
      return;
    }

    socket.emit('get-next-ticket', { agentId: user.id }, (response: { success: boolean; ticket?: CurrentTicket; error?: string }) => {
      if (response.success && response.ticket) {
        setCurrentTicket(response.ticket);
        addNotification('New ticket assigned', 'success');
      } else {
        addNotification(response.error || 'No tickets in queue', 'info');
      }
    });
  };

  // Forward ticket to another department
  const handleForwardTicket = async (departmentId: string) => {
    if (!socket || !isConnected || !currentTicket) {
      addNotification('Cannot forward ticket: Not connected to server', 'error');
      return;
    }

    socket.emit('transfer-ticket',
      {
        ticketId: currentTicket.id,
        fromAgentId: user?.id,
        toDepartment: departmentId
      },
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          setCurrentTicket(null);
          addNotification('Ticket forwarded successfully', 'success');
          fetchAgentStats();
        } else {
          addNotification(response.error || 'Failed to forward ticket', 'error');
        }
      }
    );
  };

  // Review current ticket
  const handleReviewTicket = async () => {
    if (!socket || !isConnected || !currentTicket || !user?.id) {
      addNotification('Cannot review ticket: Not connected to server', 'error');
      return;
    }

    socket.emit('review-ticket',
      { ticketId: currentTicket.id, agentId: user.id },
      (response: { success: boolean; ticket?: CurrentTicket; error?: string }) => {
        if (response.success && response.ticket) {
          setCurrentTicket(response.ticket);
          setIsReviewing(true);
        } else {
          addNotification(response.error || 'Failed to review ticket', 'error');
        }
      }
    );
  };

  // Process ticket after review
  const handleProcessTicket = async (action: 'completed' | 'cancelled') => {
    if (!socket || !isConnected || !currentTicket || !user?.id) {
      addNotification(`Cannot ${action} ticket: Not connected to server`, 'error');
      return;
    }

    socket.emit('process-ticket',
      {
        ticketId: currentTicket.id,
        agentId: user.id,
        action,
        notes: reviewNotes
      },
      (response: { success: boolean; error?: string }) => {
        if (response.success) {
          setCurrentTicket(null);
          setIsReviewing(false);
          setReviewNotes('');
          addNotification(`Ticket ${action} successfully`, 'success');
          fetchAgentStats();
        } else {
          addNotification(response.error || `Failed to ${action} ticket`, 'error');
        }
      }
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.username}</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm">Status:</span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
            {isConnected ? 'Online' : 'Offline'}
          </span>
          <span className="text-sm text-gray-500">
            Connected to queue server
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Tickets Handled Today</h2>
            <Users className="h-6 w-6 text-blue-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{stats.ticketsHandled}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Avg. Handling Time</h2>
            <Clock className="h-6 w-6 text-green-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{stats.avgHandlingTime} min</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Customer Satisfaction</h2>
            <BarChart2 className="h-6 w-6 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mt-2">{stats.customerSatisfaction}%</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Current Ticket</h2>
            <Clipboard className="h-6 w-6 text-gray-400" />
          </div>

          {currentTicket ? (
            isReviewing ? (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Ticket Number</p>
                    <p className="font-semibold">{currentTicket.number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer Name</p>
                    <p className="font-semibold">{currentTicket.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-semibold">{currentTicket.service}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Wait Time</p>
                    <p className="font-semibold">{currentTicket.waitTime} min</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Add any notes about this ticket..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => handleProcessTicket('completed')}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                  >
                    Complete Ticket
                  </button>
                  <button
                    onClick={() => handleProcessTicket('cancelled')}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Cancel Ticket
                  </button>
                  <button
                    onClick={() => setIsReviewing(false)}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Ticket Number</p>
                    <p className="font-semibold">{currentTicket.number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer Name</p>
                    <p className="font-semibold">{currentTicket.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-semibold">{currentTicket.service}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Wait Time</p>
                    <p className="font-semibold">{currentTicket.waitTime} min</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleReviewTicket}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Review Ticket
                  </button>
                  <button
                    onClick={() => handleForwardTicket('some-department-id')}
                    className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
                  >
                    Forward Ticket
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No Active Ticket</p>
              <p className="text-sm text-gray-400 mb-4">You don't have any active tickets assigned to you.</p>
              <button
                onClick={handleGetNextTicket}
                className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                disabled={!isConnected}
              >
                Get Next Ticket
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Queue Status</h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium">Current Queue</h3>
              <p className="text-gray-500">{queueLength} customers waiting</p>
            </div>
            <p className="text-sm text-gray-400">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
