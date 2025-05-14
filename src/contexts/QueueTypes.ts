import { Socket } from 'socket.io-client';

// Export the QueueItem interface
export interface QueueItem {
    id: string;
    ticketNumber: string;
    userId: string;
    customerName: string;
    serviceId: string;
    serviceName: string;
    departmentId: string;
    department: string;
    priority: 'low' | 'normal' | 'high';
    status: 'waiting' | 'serving' | 'completed' | 'cancelled';
    position: number;
    estimatedWaitTime: number;
    createdAt: string;
    additionalInfo?: string;
}

// Export the TicketGenerationData interface
export interface TicketGenerationData {
    userId?: string;
    customerName: string;
    departmentId: string;
    department: string;
    serviceName: string;
    priority: 'low' | 'normal' | 'high';
    additionalInfo?: string;
    status?: 'waiting';
}

// Update QueueContextInterface to include queue
export interface QueueContextInterface {
    queue: QueueItem[];
    activeTicket: QueueItem | null;
    currentNumber: number;
    generateTicket: (ticketData: TicketGenerationData) => Promise<QueueItem>;
    cancelTicket: (ticketId: string) => Promise<void>;
    updateTicketStatus: (ticketId: string, status: QueueItem['status']) => Promise<void>;
    socket: typeof Socket | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
}

// Export the socket URL constant
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// Export socket event types
export type AgentStatus = 'available' | 'busy' | 'offline';