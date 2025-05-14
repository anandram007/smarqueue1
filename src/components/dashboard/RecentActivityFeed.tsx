import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQueue } from '../../contexts/QueueContext';
import { useAuth } from '../../contexts/hooks/useAuth';

const RecentActivityFeed: React.FC = () => {
  const { user } = useAuth();
  const { queue } = useQueue();
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  // Update recent activity whenever the queue changes
  useEffect(() => {
    if (!user || !queue.length) return;
    
    // Filter activities related to the current user
    const userActivities = queue.filter(item => 
      item.userId === user.id || 
      item.customerName === user.username
    );
    
    // Sort by most recent first
    const sortedActivities = [...userActivities].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Take the most recent 5 activities
    setRecentActivity(sortedActivities.slice(0, 5));
  }, [queue, user]);

  // Format relative time (e.g., "2 minutes ago")
  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - activityTime.getTime()) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  // Get status color class based on ticket status
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'serving': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (recentActivity.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">No recent activity found</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h3 className="text-md font-medium text-gray-900 mb-2">Live Activity Updates</h3>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="p-4 sm:px-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-700 truncate">
                  Ticket #{activity.ticketNumber}
                </p>
                <div className="text-xs text-gray-500">{getRelativeTime(activity.createdAt)}</div>
              </div>
              <div className="mt-2 flex justify-between">
                <p className="text-sm text-gray-600">{activity.serviceName}</p>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColorClass(activity.status)}`}>
                  {activity.status}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 px-4 py-3 text-right">
          <p className="text-xs text-gray-500">Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    </div>
  );
};

export default RecentActivityFeed;