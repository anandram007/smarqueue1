import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { createSocketInstance, SOCKET_EVENTS } from '../config/socket';
import { QueueContextInterface, QueueItem, TicketGenerationData } from './QueueTypes';
import { useNotification } from './NotificationContext';
import { useAuth } from './hooks/useAuth';

// Create the context with a default value
const QueueContext = createContext<QueueContextInterface | undefined>(undefined);

// Create the hook
export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error('useQueue must be used within a QueueProvider');
  }
  return context;
}

// Create the provider component
export function QueueProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeTicket, setActiveTicket] = useState<QueueItem | null>(null);
  const [currentNumber, setCurrentNumber] = useState(0);
  const { addNotification } = useNotification();
  const { user } = useAuth();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = () => {
    if (socket) {
      socket.connect();
      return;
    }

    setIsConnecting(true);
    const newSocket = createSocketInstance();
    setSocket(newSocket);
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
    }
  };

  useEffect(() => {
    if (!socket) {
      connect();
      return;
    }

    socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);

      // Join appropriate rooms based on user role
      if (user) {
        if (user.role === 'agent') {
          socket.emit('join-agent-room', user.id);
        } else if (user.role === 'admin') {
          socket.emit('join-admin-dashboard');
        } else {
          socket.emit('join-customer-room', user.id);
        }
      }
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      addNotification('Disconnected from server', 'warning');
    });

    socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
      setIsConnecting(false);
      setError('Failed to connect to server');
      addNotification('Connection error: ' + error.message, 'error');
    });

    return () => {
      socket.off(SOCKET_EVENTS.CONNECT);
      socket.off(SOCKET_EVENTS.DISCONNECT);
      socket.off(SOCKET_EVENTS.CONNECT_ERROR);
    };
  }, [socket, user, addNotification]);

  // Reconnect when user changes
  useEffect(() => {
    if (user && !isConnected && !isConnecting) {
      connect();
    }
  }, [user, isConnected, isConnecting]);

  // Handle ticket updates
  useEffect(() => {
    if (socket) {
      socket.on('ticket-update', (updatedTicket: QueueItem) => {
        setQueue(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));
        if (activeTicket?.id === updatedTicket.id) {
          setActiveTicket(updatedTicket);
        }
      });
    }
  }, [socket, activeTicket]);

  // Generate ticket function
  const generateTicket = useCallback(async (ticketData: TicketGenerationData): Promise<QueueItem> => {
    if (!socket || !isConnected) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Ticket generation timed out'));
      }, 20000);

      socket.emit('generate-ticket', ticketData, (response: { success: boolean; ticket?: QueueItem; error?: string }) => {
        clearTimeout(timeout);
        if (response.success && response.ticket) {
          setQueue(prev => [...prev, response.ticket] as QueueItem[]);
          setActiveTicket(response.ticket);
          resolve(response.ticket);
        } else {
          reject(new Error(response.error || 'Failed to generate ticket'));
        }
      });
    });
  }, [socket, isConnected]);

  // Cancel ticket function
  const cancelTicket = useCallback(async (ticketId: string): Promise<void> => {
    if (!socket || !isConnected) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Cancel ticket operation timed out'));
      }, 5000);

      socket.emit('cancel-ticket', ticketId, (response: { success: boolean; error?: string }) => {
        clearTimeout(timeout);
        if (response.success) {
          setQueue(prev => prev.filter(t => t.id !== ticketId));
          if (activeTicket?.id === ticketId) {
            setActiveTicket(null);
          }
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to cancel ticket'));
        }
      });
    });
  }, [socket, isConnected, activeTicket]);

  // Update ticket status function
  const updateTicketStatus = useCallback(async (ticketId: string, status: QueueItem['status']): Promise<void> => {
    if (!socket || !isConnected) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Update status operation timed out'));
      }, 5000);

      socket.emit('update-ticket-status', { ticketId, status }, (response: { success: boolean; error?: string }) => {
        clearTimeout(timeout);
        if (response.success) {
          setQueue(prev => prev.map(t => t.id === ticketId ? { ...t, status } : t));
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to update ticket status'));
        }
      });
    });
  }, [socket, isConnected]);

  const value = {
    queue,
    activeTicket,
    currentNumber,
    generateTicket,
    cancelTicket,
    updateTicketStatus,
    socket,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect
  };

  return <QueueContext.Provider value={value}>{children}</QueueContext.Provider>;
}

// Export the context for direct usage if needed
export { QueueContext };
