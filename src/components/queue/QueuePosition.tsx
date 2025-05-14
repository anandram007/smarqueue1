import React from 'react';
import { Users } from 'lucide-react';

interface QueuePositionProps {
  position: number;
}

const QueuePosition: React.FC<QueuePositionProps> = ({ position }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 flex items-center">
      <div className="rounded-full bg-blue-100 p-3 mr-4">
        <Users size={24} className="text-blue-700" />
      </div>
      <div>
        <p className="text-sm text-gray-600">Your Position</p>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-gray-900">{position}</span>
          <span className="ml-1 text-sm text-gray-600">in queue</span>
        </div>
      </div>
    </div>
  );
};

export default QueuePosition;