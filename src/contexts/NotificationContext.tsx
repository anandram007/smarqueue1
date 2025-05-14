import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    message: string;
    type: NotificationType;
    timestamp: number;
}

interface NotificationContextType {
    notifications: Notification[];
    addNotification: (message: string, type: NotificationType) => void;
    removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Use useCallback to prevent recreation on every render
    const addNotification = useCallback((message: string, type: NotificationType) => {
        const id = Date.now().toString();
        const newNotification = { id, message, type, timestamp: Date.now() };
        
        setNotifications(prev => [...prev, newNotification]);
        
        // Set timeout to auto-remove notification
        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    }, []);  // No dependencies here to avoid the loop

    // Use useCallback to prevent recreation on every render
    const removeNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, []);  // No dependencies here to avoid the loop

    return (
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};