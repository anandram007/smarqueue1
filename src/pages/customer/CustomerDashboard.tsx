import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Clock, FileText, Bell, BarChart2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/hooks/useAuth';
import { useQueue } from '../../contexts/QueueContext';
import { useNotification } from '../../contexts/NotificationContext';
import RecentActivityFeed from '../../components/dashboard/RecentActivityFeed';
import { QueueData, QueueResponse } from '../../types/queue';

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { activeTicket, isConnected, isConnecting, error: queueError, socket } = useQueue();
  const { addNotification } = useNotification();
  const [error, setError] = useState<string | null>(null);

  const [queueData, setQueueData] = useState<QueueData>({
    position: 0,
    estimatedWaitTime: 0,
    queueLength: 0,
    department: '',
    agent: null,
    ticketNumber: '',
    status: ''
  });

  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Fetch queue data
  const fetchQueueData = async () => {
    if (!isConnected) {
      setError('Not connected to queue server');
      return;
    }

    try {
      if (!socket || !activeTicket) return;

      socket.emit('get-customer-queue-data', { ticketId: activeTicket.id }, (response: QueueResponse) => {
        if (response.success && response.data) {
          setQueueData(response.data);
          setLastUpdated(new Date());
          setError(null);
        } else {
          addNotification('Failed to fetch queue data: ' + response.error, 'error');
          setError('Failed to fetch queue data');
        }
      });
    } catch (err) {
      console.error('Error fetching queue data:', err);
      setError('Failed to fetch queue data');
      addNotification('Failed to fetch queue data', 'error');
    }
  };

  useEffect(() => {
    fetchQueueData();

    // Refresh data periodically only if connected
    let intervalId: NodeJS.Timeout;
    if (isConnected) {
      intervalId = setInterval(fetchQueueData, 30000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isConnected, socket, activeTicket]);

  // Show loading state
  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to queue server...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || queueError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center bg-red-50 p-8 rounded-lg max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error || queueError}</p>
          <button
            onClick={fetchQueueData}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-gray-600">Welcome back, {user?.username || 'Guest'}</p>
      </div>

      {/* Active Ticket Card */}
      <div className="mb-8">
        {activeTicket ? (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Your Active Ticket</h2>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${activeTicket.status === 'serving' ? 'bg-green-100 text-green-800' :
                  activeTicket.status === 'waiting' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                  {activeTicket.status}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center">
                  <div className="rounded-full bg-blue-100 p-2 mr-3">
                    <ClipboardList size={20} className="text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Ticket Number</p>
                    <p className="text-lg font-semibold text-gray-900">#{activeTicket.ticketNumber}</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="rounded-full bg-blue-100 p-2 mr-3">
                    <Clock size={20} className="text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimated Wait</p>
                    <p className="text-lg font-semibold text-gray-900">{queueData.estimatedWaitTime} min</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="rounded-full bg-blue-100 p-2 mr-3">
                    <BarChart2 size={20} className="text-blue-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Position</p>
                    <p className="text-lg font-semibold text-gray-900">{queueData.position} of {queueData.queueLength}</p>
                  </div>
                </div>
              </div>

              {/* Department Info */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Department: <span className="font-medium">{activeTicket.department}</span></p>
                {queueData.agent && (
                  <p className="text-sm text-gray-600 mt-1">
                    Serving Agent: <span className="font-medium">{queueData.agent.name}</span>
                  </p>
                )}
              </div>

              <div className="mt-6">
                <Link
                  to="/customer/queue-status"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-800"
                >
                  View Queue Status
                </Link>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell size={18} className="text-blue-500" />
                  <p className="ml-2 text-sm text-gray-600">
                    You'll receive notifications as your turn approaches
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  Last updated: {lastUpdated.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="text-center">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 text-blue-700 mb-4">
                <ClipboardList size={24} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No Active Ticket</h2>
              <p className="text-gray-600 mb-6">
                You don't have an active ticket in the queue. Generate a new ticket to get started.
              </p>
              <Link
                to="/customer/generate-ticket"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-800"
              >
                Generate Ticket
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/customer/generate-ticket"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <ClipboardList size={20} className="text-blue-700" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Generate Ticket</h3>
                <p className="text-sm text-gray-600 mt-1">Create a new queue ticket</p>
              </div>
            </div>
          </Link>

          <Link
            to="/customer/documents"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <FileText size={20} className="text-blue-700" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Documents</h3>
                <p className="text-sm text-gray-600 mt-1">Upload or view documents</p>
              </div>
            </div>
          </Link>

          <Link
            to="/customer/profile"
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-blue-500 transition-all duration-200"
          >
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-3 mr-4">
                <BarChart2 size={20} className="text-blue-700" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Profile</h3>
                <p className="text-sm text-gray-600 mt-1">Manage your account</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <RecentActivityFeed />
      </div>
    </div>
  );
};

export default CustomerDashboard;
