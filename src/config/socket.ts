import { io, Socket } from 'socket.io-client';

export const SOCKET_EVENTS = {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    CONNECT_ERROR: 'connect_error',
    TICKET_UPDATE: 'ticket-update',
    QUEUE_UPDATE: 'queue-update',
    AGENT_STATUS_UPDATE: 'agent-status-update',
    TICKET_COMPLETED: 'ticket-completed',
    TICKET_CANCELLED: 'ticket-cancelled',
    TICKET_TRANSFERRED: 'ticket-transferred'
};

export const createSocketInstance = (): Socket => {
    const socket = io('http://localhost:5000', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        auth: {
            token: localStorage.getItem('token')
        }
    });

    // Add connection event listeners
    socket.on('connect', () => {
        console.log('Socket connected successfully');
    });

    socket.on('connect_error', (error: Error) => {
        console.error('Socket connection error:', error);
    });

    socket.on('disconnect', (reason: string) => {
        console.log('Socket disconnected:', reason);
    });

    return socket;
};

export const SOCKET_URL = 'http://localhost:5000';