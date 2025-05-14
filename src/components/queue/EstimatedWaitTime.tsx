import React from 'react';
import { Clock } from 'lucide-react';

interface EstimatedWaitTimeProps {
  minutes: number;
}

const EstimatedWaitTime: React.FC<EstimatedWaitTimeProps> = ({ minutes }) => {
  // Format minutes into hours and minutes if needed
  const formatTime = (mins: number) => {
    if (mins < 60) {
      return `${mins} minutes`;
    }
    
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    
    if (remainingMins === 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    
    return `${hours} hour${hours > 1 ? 's' : ''} ${remainingMins} min`;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 flex items-center">
      <div className="rounded-full bg-blue-100 p-3 mr-4">
        <Clock size={24} className="text-blue-700" />
      </div>
      <div>
        <p className="text-sm text-gray-600">Estimated Wait Time</p>
        <div className="flex items-baseline">
          <span className="text-2xl font-bold text-gray-900">{formatTime(minutes)}</span>
        </div>
      </div>
    </div>
  );
};

export default EstimatedWaitTime;