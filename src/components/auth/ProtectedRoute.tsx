import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/hooks/useAuth';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireRole?: 'customer' | 'admin' | 'agent';
}

const ProtectedRoute = ({ children, requireRole }: ProtectedRouteProps) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();
    const [isChecking, setIsChecking] = useState(true);
    
    useEffect(() => {
        // Check if we have auth data in localStorage
        const storedUser = localStorage.getItem('user');
        const storedAuth = localStorage.getItem('isAuthenticated');
        
        // We've completed our check
        setIsChecking(false);
    }, []);
    
    // Show loading while checking authentication
    if (isChecking) {
        return <div className="flex justify-center items-center h-24">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>;
    }

    if (!isAuthenticated) {
        // Redirect to login page if not authenticated
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireRole && user?.role !== requireRole) {
        // Redirect to home page if user doesn't have required role
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;