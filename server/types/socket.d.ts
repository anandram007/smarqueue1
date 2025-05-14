import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

export interface CustomSocket extends Socket {
    user?: {
        id: string;
        role: string;
    };
}

export interface SocketHandlers {
    handleCustomerEvents(io: Server, socket: CustomSocket): void;
    handleDashboardEvents(io: Server, socket: CustomSocket, prisma: PrismaClient): void;
} 