import React from 'react';
import { ClipboardList } from 'lucide-react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center">
      <div className="h-8 w-8 bg-gradient-to-r from-blue-800 to-blue-600 rounded-md flex items-center justify-center text-white">
        <ClipboardList size={18} />
      </div>
    </div>
  );
};

export default Logo;