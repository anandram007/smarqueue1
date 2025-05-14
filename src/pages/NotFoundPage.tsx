import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/hooks/useAuth';

const NotFoundPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleBackToHome = () => {
        if (user) {
            // Redirect based on user role
            if (user.role === 'customer') {
                navigate('/customer/dashboard');
            } else if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (user.role === 'agent') {
                navigate('/agent/dashboard');
            } else {
                navigate('/');
            }
        } else {
            navigate('/');
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <h2 className="text-3xl font-semibold text-gray-700 mb-6">Page Not Found</h2>
                <p className="text-gray-500 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <button
                    onClick={handleBackToHome}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
};

export default NotFoundPage;