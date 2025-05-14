import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Users, 
  ClipboardList, 
  FileText, 
  UserCircle, 
  Settings, 
  BarChart2, 
  MessageSquare, 
  HelpCircle
} from 'lucide-react';
import { useAuth } from '../../contexts/hooks/useAuth';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Determine navigation links based on user role
  const getNavLinks = () => {
    const role = user?.role;
    
    if (role === 'admin') {
      return [
        { name: 'Dashboard', path: '/admin/dashboard', icon: <Home size={20} /> },
        { name: 'Queue Management', path: '/admin/queues', icon: <ClipboardList size={20} /> },
        { name: 'Users', path: '/admin/users', icon: <Users size={20} /> },
        { name: 'Departments', path: '/admin/departments', icon: <FileText size={20} /> },
        { name: 'Analytics', path: '/admin/analytics', icon: <BarChart2 size={20} /> },
        { name: 'Settings', path: '/admin/settings', icon: <Settings size={20} /> },
      ];
    }
    
    if (role === 'agent') {
      return [
        { name: 'Dashboard', path: '/agent/dashboard', icon: <Home size={20} /> },
        { name: 'Current Queue', path: '/agent/current-queue', icon: <ClipboardList size={20} /> },
        { name: 'My Performance', path: '/agent/performance', icon: <BarChart2 size={20} /> },
        { name: 'Customer History', path: '/agent/customer-history', icon: <FileText size={20} /> },
      ];
    }
    
    // Default for customer
    return [
      { name: 'Dashboard', path: '/customer/dashboard', icon: <Home size={20} /> },
      { name: 'Generate Ticket', path: '/customer/generate-ticket', icon: <ClipboardList size={20} /> },
      { name: 'Queue Status', path: '/customer/queue-status', icon: <BarChart2 size={20} /> },
      { name: 'My Documents', path: '/customer/documents', icon: <FileText size={20} /> },
      { name: 'Feedback', path: '/customer/feedback', icon: <MessageSquare size={20} /> },
      { name: 'Profile', path: '/customer/profile', icon: <UserCircle size={20} /> },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <div className="h-full py-6">
      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700'
                  }
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200
                `}
              >
                <div className={`
                  ${isActive ? 'text-blue-700' : 'text-gray-500 group-hover:text-blue-700'}
                  mr-3 flex-shrink-0
                `}>
                  {item.icon}
                </div>
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
      
      <div className="mt-10 px-3">
        <div className="pt-6 border-t border-gray-200">
          <Link
            to="/help"
            className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-50 hover:text-blue-700"
          >
            <HelpCircle size={20} className="text-gray-500 group-hover:text-blue-700 mr-3" />
            Help & Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;