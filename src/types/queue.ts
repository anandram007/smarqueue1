export interface QueueData {
    position: number;
    estimatedWaitTime: number;
    queueLength: number;
    department: string;
    agent: {
        name: string;
        status: string;
    } | null;
    ticketNumber: string;
    status: string;
}

export interface QueueResponse {
    success: boolean;
    data?: QueueData;
    error?: string;
}

export interface TicketStatusUpdate {
    status: 'waiting' | 'serving' | 'completed';
    ticketId: string;
} 