import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import NotificationPanel from '../notifications/NotificationPanel';
import { useAuth } from '../../contexts/hooks/useAuth';

const Layout: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-grow flex">
        {isAuthenticated && (
          <div className="hidden md:block w-64 bg-white border-r border-gray-200">
            <Sidebar />
          </div>
        )}
        
        <main className="flex-grow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>
        
        {isAuthenticated && (
          <div className="hidden lg:block w-80 border-l border-gray-200 bg-white">
            <NotificationPanel />
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Layout;