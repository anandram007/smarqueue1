import { Server, Socket } from 'socket.io';
import { PrismaClient } from '@prisma/client';

declare function handleCustomerEvents(io: Server, socket: Socket): void;
export default handleCustomerEvents; 