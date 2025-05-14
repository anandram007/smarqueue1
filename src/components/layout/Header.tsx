import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, LogOut, User, Settings, Clipboard } from 'lucide-react';
import { useAuth } from '../../contexts/hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import Logo from '../common/Logo';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { notifications } = useNotification();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const unreadNotifications = notifications?.filter(notification => !notification.read).length || 0;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Logo />
              <span className="ml-2 text-xl font-semibold text-blue-900">HealthQueue</span>
            </div>
          </div>

          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-8">
            {!isAuthenticated ? (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-blue-800 px-3 py-2 text-sm font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                {/* Notification Button */}
                <div className="relative">
                  <button
                    className="p-2 text-gray-600 hover:text-blue-700 rounded-full hover:bg-gray-100"
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  >
                    <Bell size={20} />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-0 right-0 block h-4 w-4 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                        {unreadNotifications}
                      </span>
                    )}
                  </button>
                  
                  {isNotificationOpen && (
                    <div className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-800">Notifications</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications?.length > 0 ? (
                          notifications.slice(0, 5).map((notification, index) => (
                            <div 
                              key={index} 
                              className={`px-4 py-3 border-b border-gray-100 ${!notification.read ? 'bg-blue-50' : ''}`}
                            >
                              <p className="text-sm text-gray-800">{notification.message}</p>
                              <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-sm text-gray-500">No notifications</div>
                        )}
                      </div>
                      <div className="px-4 py-2 border-t border-gray-100">
                        <Link 
                          to="/notifications" 
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    className="flex items-center text-sm font-medium text-gray-700 hover:text-blue-800"
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                  >
                    <div className="h-8 w-8 rounded-full bg-blue-700 flex items-center justify-center text-white">
                      {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <ChevronDown size={16} className="ml-1" />
                  </button>
                  
                  {isProfileOpen && (
                    <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-800">{user?.name || user?.email}</p>
                        <p className="text-xs text-gray-500">{user?.role}</p>
                      </div>
                      
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User size={16} className="mr-2" />
                        Profile
                      </Link>
                      
                      <Link
                        to="/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings size={16} className="mr-2" />
                        Settings
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut size={16} className="mr-2" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center sm:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-800 hover:bg-gray-100"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/login"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Register
                </Link>
              </>
            ) : (
              <>
                <div className="px-4 py-2 border-t border-gray-200">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-700 flex items-center justify-center text-white">
                      {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <p className="text-base font-medium text-gray-800">{user?.name || user?.email}</p>
                      <p className="text-sm text-gray-500">{user?.role}</p>
                    </div>
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Profile
                </Link>
                
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Settings
                </Link>
                
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;