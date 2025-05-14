import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

declare function handleDashboardEvents(io: Server, socket: Socket, prisma: PrismaClient): void;

export default handleDashboardEvents;