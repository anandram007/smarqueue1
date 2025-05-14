import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Users, AlertCircle } from 'lucide-react';
import { useQueue } from '../../contexts/QueueContext';
import { useAuth } from '../../contexts/hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import QueuePosition from '../../components/queue/QueuePosition';
import EstimatedWaitTime from '../../components/queue/EstimatedWaitTime';
import QueueStats from '../../components/queue/QueueStats';
import type { QueueItem } from '../../contexts/QueueTypes';

const QueueStatusPage: React.FC = () => {
  const { user } = useAuth();
  const { activeTicket, queue, cancelTicket } = useQueue();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastPosition, setLastPosition] = useState<number | null>(null);

  // Effect to monitor position changes and send notifications
  useEffect(() => {
    if (activeTicket && (lastPosition === null || lastPosition !== activeTicket.position)) {
      // If position changed, update last position
      if (lastPosition !== null) {
        // Only notify if this isn't the first load
        addNotification(`Your position in queue has changed to ${activeTicket.position}`, 'info');
      }
      setLastPosition(activeTicket.position);
    }
  }, [activeTicket, lastPosition, addNotification]);

  // Effect to check if it's almost user's turn
  useEffect(() => {
    if (activeTicket && activeTicket.position <= 3 && activeTicket.position > 0) {
      addNotification(`Almost your turn! You are position #${activeTicket.position} in line.`, 'warning');
    }
  }, [activeTicket, addNotification]);

  if (!activeTicket) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="text-center">
          <div className="flex justify-center">
            <AlertCircle size={48} className="text-blue-500" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-gray-900">No Active Ticket</h2>
          <p className="mt-2 text-gray-600">
            You don't have an active ticket in the queue. Generate a new ticket to get started.
          </p>
          <button
            onClick={() => navigate('/customer/generate-ticket')}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-700 hover:bg-blue-800"
          >
            Generate Ticket
          </button>
        </div>
      </div>
    );
  }

  // Calculate the actual number of people in queue with 'waiting' status
  const waitingCount = queue.filter(item => item.status === 'waiting').length;
  
  // Calculate people ahead (should be position - 1)
  const peopleAhead = activeTicket.position > 0 ? activeTicket.position - 1 : 0;

  const handleCancelTicket = () => {
    setShowConfirmation(true);
  };

  const confirmCancelTicket = () => {
    cancelTicket(activeTicket.id);
    setShowConfirmation(false);
    navigate('/customer/dashboard');
  };

  // Calculate the currently serving ticket
  // Explicitly use QueueItem type
  const currentlyServingTicket: QueueItem | undefined = queue.find(ticket => ticket.status === 'serving');
  const currentlyServingNumber = currentlyServingTicket ? currentlyServingTicket.ticketNumber : 'None';

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Queue Status</h1>
        <p className="mt-1 text-gray-600">Track your position in the queue and estimated waiting time.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Ticket #{activeTicket.ticketNumber}</h2>
              <p className="text-sm text-gray-600">{activeTicket.serviceName}</p>
            </div>
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {activeTicket.status}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <QueuePosition position={activeTicket.position} />
            <EstimatedWaitTime minutes={activeTicket.estimatedWaitTime} />
            <QueueStats peopleAhead={peopleAhead} totalInQueue={waitingCount} />
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-md font-medium text-gray-900">Department</h3>
                <p className="text-gray-600">{activeTicket.department}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <h3 className="text-md font-medium text-gray-900">Issued at</h3>
                <p className="text-gray-600">{new Date(activeTicket.createdAt).toLocaleString()}</p>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  onClick={handleCancelTicket}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel Ticket
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertCircle size={20} className="text-blue-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-gray-600">
                You'll receive notifications as your turn approaches. Make sure to keep this page open or check back regularly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Queue Updates Section */}
      <div className="mt-8 bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Queue Updates</h2>
        <div className="space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-200">
            <div className="flex items-center">
              <div className="rounded-full bg-green-100 p-2 mr-3">
                <Users size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Currently Serving</p>
                <p className="text-xl font-bold text-gray-900">
                  Ticket #{currentlyServingNumber}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Department</p>
              <p className="text-sm font-medium text-gray-900">{activeTicket.department}</p>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <div className="rounded-full bg-blue-100 p-2 mr-3">
                <Clock size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Average Service Time</p>
                <p className="text-gray-600">~10 minutes per customer</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Active Agents</p>
              <p className="text-sm font-medium text-gray-900">5 agents available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add real-time queue status */}
      <div className="text-sm text-gray-600">
        <p>Last updated: {new Date().toLocaleTimeString()}</p>
        <p>Total waiting: {waitingCount}</p>
        <p>Active agents: {queue.filter(item => item.status === 'serving').length} serving</p>
      </div>
      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cancel Ticket?</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to cancel your ticket? This action cannot be undone.</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                No, Keep Ticket
              </button>
              <button
                onClick={confirmCancelTicket}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Yes, Cancel Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueStatusPage;