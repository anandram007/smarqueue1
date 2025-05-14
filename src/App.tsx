import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QueueProvider } from './contexts/QueueContext';
import { NotificationProvider } from './contexts/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AgentDashboard from './pages/agent/AgentDashboard';
import QueueStatusPage from './pages/queue/QueueStatusPage';
import GenerateTicketPage from './pages/queue/GenerateTicketPage';
import DocumentUploadPage from './pages/customer/DocumentUploadPage';
import ProfilePage from './pages/ProfilePage';
import FeedbackPage from './pages/customer/FeedbackPage';
import NotFoundPage from './pages/NotFoundPage';
import { Outlet } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import HelpSupportPage from './pages/HelpSupportPage';

function App() {
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    // Check if authentication data exists in localStorage
    const checkAuth = () => {
      const storedUser = localStorage.getItem('user');
      const storedAuth = localStorage.getItem('isAuthenticated');
      
      // Use the values to determine if user is authenticated
      const isUserAuthenticated = storedUser && storedAuth === 'true';
      console.log('User authentication status:', isUserAuthenticated);
      
      // Set auth ready state to true after checking
      setIsAuthReady(true);
    };
    
    checkAuth();
  }, []);

  // Don't render protected routes until auth state is checked
  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <QueueProvider>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute><Outlet /></ProtectedRoute>}>
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/help" element={<HelpSupportPage />} /> {/* Add Help & Support route */}

                  {/* Customer Routes */}
                  <Route path="/customer">
                    <Route
                      path="dashboard"
                      element={
                        <ProtectedRoute requireRole="customer">
                          <CustomerDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="queue-status"
                      element={
                        <ProtectedRoute requireRole="customer">
                          <ErrorBoundary>
                            <QueueStatusPage />
                          </ErrorBoundary>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="generate-ticket"
                      element={
                        <ProtectedRoute requireRole="customer">
                          <GenerateTicketPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="documents"
                      element={
                        <ProtectedRoute requireRole="customer">
                          <DocumentUploadPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="profile"
                      element={
                        <ProtectedRoute requireRole="customer">
                          <ProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="feedback"
                      element={
                        <ProtectedRoute requireRole="customer">
                          <FeedbackPage />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* Admin Routes */}
                  <Route path="/admin">
                    <Route
                      path="dashboard"
                      element={
                        <ProtectedRoute requireRole="admin">
                          <AdminDashboard />
                        </ProtectedRoute>
                      }
                    />
                  </Route>
                  {/* Agent Routes */}
                  <Route path="/agent">
                    <Route
                      path="dashboard"
                      element={
                        <ProtectedRoute requireRole="agent">
                          <AgentDashboard />
                        </ProtectedRoute>
                      }
                    />
                </Route>
                </Route>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </QueueProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
