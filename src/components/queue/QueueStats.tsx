import React from 'react';
import { BarChart2 } from 'lucide-react';

interface QueueStatsProps {
  peopleAhead: number;
  totalInQueue: number;
}

const QueueStats: React.FC<QueueStatsProps> = ({ peopleAhead, totalInQueue }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 flex items-center">
      <div className="rounded-full bg-blue-100 p-3 mr-4">
        <BarChart2 size={24} className="text-blue-700" />
      </div>
      <div>
        <p className="text-sm text-gray-600">Queue Stats</p>
        <div className="flex flex-col">
          <span className="text-gray-900">
            <span className="font-semibold">{peopleAhead}</span> people ahead
          </span>
          <span className="text-gray-900">
            <span className="font-semibold">{totalInQueue}</span> total in queue
          </span>
        </div>
      </div>
    </div>
  );
};

export default QueueStats;