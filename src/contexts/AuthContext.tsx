import { createContext, useState, useEffect, type ReactNode } from 'react';

export interface User {
    id: string;
    username: string;
    email: string;
    role: 'customer' | 'admin' | 'agent';
}

export interface AuthContextType {
    isAuthenticated: boolean;
    user: User | null;
    login: (userData: User) => void;
    logout: () => void;
}

// Export the context so it can be imported in the useAuth hook
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    // Load authentication state from localStorage on initial render
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedAuth = localStorage.getItem('isAuthenticated');
        
        if (storedUser && storedAuth === 'true') {
            setUser(JSON.parse(storedUser));
            setIsAuthenticated(true);
        }
    }, []);

    const login = (userData: User) => {
        // Save to state
        setIsAuthenticated(true);
        setUser(userData);
        
        // Persist to localStorage
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        // Clear state
        setIsAuthenticated(false);
        setUser(null);
        
        // Clear localStorage
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

// Remove the useAuth export from this file