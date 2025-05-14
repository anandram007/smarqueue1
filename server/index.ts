import 'dotenv/config';
import express, { Request, Response, ErrorRequestHandler, RequestHandler } from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { PrismaClient, Ticket, Document, TicketHistory } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import nodemailer from 'nodemailer';

// Import types from types.ts
import type {
    TicketGenerationData
} from './types';

// Log environment variables (without sensitive data)
console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
    JWT_SECRET: process.env.JWT_SECRET ? 'Set' : 'Not set',
});

const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

// Body parsing middleware - IMPORTANT: Place these before other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

// Static file serving
app.use('/uploads', express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: './uploads/faces',
    filename: (req, file, cb) => {
        cb(null, `${uuidv4()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            return cb(new Error('Only image files are allowed!'));
        }
        cb(null, true);
    }
});

// Request logging middleware
app.use((req: Request, res: Response, next) => {
    console.log(`${req.method} ${req.url}`);
    console.log('Headers:', req.headers);
    if (req.body) console.log('Request body:', req.body);
    next();
});

// Error handling middleware
const errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
    next(err);
};

app.use(errorHandler);

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com', // Gmail address
        pass: process.env.EMAIL_APP_PASSWORD || 'your-app-password' // Gmail App Password
    }
});

// Authentication endpoints
app.post('/api/auth/login', upload.single('faceImage'), async (req: Request, res: Response) => {
    try {
        console.log('Login attempt - Raw body:', req.body);
        console.log('Login attempt - Headers:', req.headers);
        console.log('Login attempt - File:', req.file);

        const { email, password } = req.body;

        if (!email || !password) {
            console.log('Missing credentials - Email:', email, 'Password:', password ? '[PRESENT]' : '[MISSING]');
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find user
        const user = await prisma.user.findUnique({ 
            where: { email },
            select: {
                id: true,
                email: true,
                username: true,
                password: true,
                role: true,
                faceImagePath: true
            }
        });

        if (!user) {
            console.log('User not found:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            console.log('Invalid password for user:', email);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Handle face image if provided
        if (req.file) {
            console.log('Updating face image for user:', user.id);
            await prisma.user.update({
                where: { id: user.id },
                data: { 
                    faceImagePath: req.file.path.replace(/\\/g, '/') // Normalize path for Windows
                }
            });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'maaz123456789012maaz',
            { expiresIn: '24h' }
        );

        console.log('Login successful for user:', user.id);

        return res.json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            token,
        });
    } catch (error) {
        console.error('Login error:', error);
        if (error instanceof Error) {
            return res.status(500).json({ message: `Server error during login: ${error.message}` });
        }
        return res.status(500).json({ message: 'Server error during login' });
    }
});

app.post('/api/auth/register', upload.single('faceImage'), async (req: Request, res: Response) => {
    try {
        console.log('Register attempt - Form data:', req.body);
        console.log('Register attempt - File:', req.file);

        const { username, email, password } = req.body;

        // Validate input
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Prepare user data
        const userData: any = {
            username,
            email,
            password: hashedPassword,
            role: 'customer',
        };

        // Add face image path if file was uploaded
        if (req.file) {
            userData.faceImagePath = req.file.path.replace(/\\/g, '/'); // Normalize path for Windows
            console.log('Face image path:', userData.faceImagePath);
        }

        // Create user
        const user = await prisma.user.create({
            data: userData
        });

        console.log('User created successfully:', user.id);

        // Generate token
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET || 'maaz123456789012maaz',
            { expiresIn: '24h' }
        );

        return res.status(201).json({
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            token,
        });
    } catch (error) {
        console.error('Registration error:', error);
        if (error instanceof Error) {
            return res.status(500).json({ message: `Server error during registration: ${error.message}` });
        }
        return res.status(500).json({ message: 'Server error during registration' });
    }
});

// Department endpoints
app.get('/api/departments', async (_req: Request, res: Response) => {
    try {
        const departments = await prisma.department.findMany({
            include: {
                agents: true,
                tickets: {
                    where: {
                        status: 'waiting'
                    }
                }
            }
        });

        res.json(departments);
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ message: 'Failed to fetch departments' });
    }
});

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:5000", "http://localhost:3000"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    },
    // Add performance configurations
    connectTimeout: 20000,
    pingTimeout: 20000,
    pingInterval: 10000,
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    maxHttpBufferSize: 1e8 // 100 MB
});

// Initialize ticket counter in memory
let ticketCounter = 1000;

// Helper function to generate unique ticket number
const generateUniqueTicketNumber = async (): Promise<string> => {
    let isUnique = false;
    let ticketNumber = '';

    while (!isUnique) {
        ticketCounter++;
        ticketNumber = `T${ticketCounter}`;

        // Check if number exists
        const existingTicket = await prisma.ticket.findUnique({
            where: { number: ticketNumber }
        });

        if (!existingTicket) {
            isUnique = true;
        }
    }

    return ticketNumber;
};

// Define Prisma include types
type TicketInclude = Prisma.TicketInclude;
type TicketWithRelations = Prisma.TicketGetPayload<{
    include: {
        Department: true;
        documents: true;
        history: {
            include: {
                agent: true;
            };
        };
    };
}>;

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Send immediate connection acknowledgment
    socket.emit('connection_ack', { status: 'connected' });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log('Client disconnected:', socket.id, 'Reason:', reason);
    });

    // Handle errors
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });

    // Handle ticket generation with minimal operations
    socket.on('generate-ticket', async (ticketData: TicketGenerationData, callback) => {
        try {
            console.log('Generating ticket for:', ticketData);

            // Generate unique ticket number
            const ticketNumber = await generateUniqueTicketNumber();

            // Get initial position
            const waitingCount = await prisma.ticket.count({
                where: {
                    departmentId: ticketData.departmentId,
                    status: 'waiting'
                }
            });

            // Create ticket with proper field mapping
            const ticket = await prisma.ticket.create({
                data: {
                    number: ticketNumber,
                    status: 'waiting',
                    userId: ticketData.userId || 'guest',
                    department: ticketData.department,
                    departmentId: ticketData.departmentId,
                    service: ticketData.serviceName,
                    customerName: ticketData.customerName,
                    priority: ticketData.priority || 'normal',
                    waitTime: ticketData.estimatedWaitTime || 10,
                    position: waitingCount + 1,
                    additionalInfo: ticketData.additionalInfo || ''
                },
                include: {
                    Department: true
                }
            });

            console.log('Ticket created:', ticket);

            // Send response immediately
            callback({ success: true, ticket });

            // Emit events after response
            socket.emit('ticket-created', ticket);
            socket.to(`department:${ticketData.departmentId}`).emit('new-ticket', ticket);

            // Update queue length for all clients
            io.emit('queue-update', waitingCount + 1);
        } catch (error) {
            console.error('Failed to create ticket:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            callback({ success: false, error: errorMessage });
        }
    });

    // Handle joining rooms
    socket.on('join-agent-room', (agentId: string) => {
        console.log('Agent joining room:', agentId);
        socket.join(`agent:${agentId}`);
        socket.emit('room_joined', { room: `agent:${agentId}` });
    });

    socket.on('join-admin-dashboard', () => {
        console.log('Admin joining dashboard room');
        socket.join('admin-dashboard');
        socket.emit('room_joined', { room: 'admin-dashboard' });
    });

    // Handle agent status updates
    socket.on('update-agent-status', async ({ agentId, status }, callback) => {
        try {
            console.log('Updating agent status:', agentId, status);
            // Update agent status in database
            const updatedAgent = await prisma.agent.update({
                where: { id: agentId },
                data: { status }
            });

            // Notify relevant clients
            io.to(`agent:${agentId}`).emit('status-updated', { status });
            io.to('admin-dashboard').emit('agent-status-update', updatedAgent);

            callback({ success: true });
        } catch (error) {
            console.error('Error updating agent status:', error);
            callback({ success: false, error: 'Failed to update status' });
        }
    });

    // Handle dashboard data requests
    socket.on('get-dashboard-data', async (_timeRange, callback) => {
        try {
            const [
                activeTickets,
                completedTickets,
                agents,
                departments,
                liveTickets
            ] = await Promise.all([
                prisma.ticket.count({ where: { status: 'waiting' } }),
                prisma.ticket.count({ where: { status: 'completed' } }),
                prisma.agent.findMany(),
                prisma.department.findMany({
                    include: {
                        _count: {
                            select: { tickets: true }
                        }
                    }
                }),
                // Fetch actual active tickets
                prisma.ticket.findMany({
                    where: {
                        status: { in: ['waiting', 'serving'] }
                    },
                    include: {
                        Department: true,
                        Agent: true
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                })
            ]);

            const data = {
                stats: {
                    totalActiveTickets: activeTickets,
                    avgWaitTime: 15,
                    customersServed: completedTickets,
                    ticketCompletion: completedTickets ? (completedTickets / (activeTickets + completedTickets)) * 100 : 0
                },
                departmentStats: departments.map(dept => ({
                    id: dept.id,
                    name: dept.name,
                    activeTickets: dept._count.tickets,
                    avgWaitTime: 10,
                    agentsAvailable: agents.filter(a => a.departmentId === dept.id && a.status === 'available').length
                })),
                agents: agents.map(agent => ({
                    id: agent.id,
                    name: agent.name,
                    department: agent.departmentId,
                    status: agent.status,
                    ticketsHandled: 0
                })),
                activeTickets: liveTickets.map(ticket => ({
                    id: ticket.id,
                    number: ticket.number,
                    customerName: ticket.customerName,
                    department: ticket.Department?.name || ticket.department,
                    serviceName: ticket.service,
                    status: ticket.status,
                    waitTime: Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60))
                })),
                peakHours: []
            };

            callback({ success: true, ...data });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            callback({ success: false, error: 'Failed to fetch dashboard data' });
        }
    });

    // Handle admin ticket actions
    socket.on('admin-complete-ticket', async ({ ticketId }, callback) => {
        try {
            const ticket = await prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    status: 'completed',
                    completedAt: new Date()
                }
            });

            // Emit update events
            io.emit('ticket-status-update', { ticketId, status: 'completed' });
            socket.to(`department:${ticket.departmentId}`).emit('ticket-completed', ticket);

            callback({ success: true });
        } catch (error) {
            console.error('Error completing ticket:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to complete ticket';
            callback({ success: false, error: errorMessage });
        }
    });

    socket.on('admin-cancel-ticket', async ({ ticketId }, callback) => {
        try {
            const ticket = await prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    status: 'cancelled',
                    completedAt: new Date()
                }
            });

            // Emit update events
            io.emit('ticket-status-update', { ticketId, status: 'cancelled' });
            socket.to(`department:${ticket.departmentId}`).emit('ticket-cancelled', ticket);

            callback({ success: true });
        } catch (error) {
            console.error('Error cancelling ticket:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to cancel ticket';
            callback({ success: false, error: errorMessage });
        }
    });

    socket.on('admin-forward-ticket', async ({ ticketId, departmentId }, callback) => {
        try {
            const [ticket, department] = await Promise.all([
                prisma.ticket.findUnique({ where: { id: ticketId } }),
                prisma.department.findUnique({ where: { id: departmentId } })
            ]);

            if (!ticket || !department) {
                throw new Error('Ticket or department not found');
            }

            await prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    departmentId: departmentId,
                    department: department.name,
                    assignedAgentId: null,
                    agentId: null
                }
            });

            // Emit update events
            io.emit('ticket-forwarded', {
                ticketId,
                oldDepartmentId: ticket.departmentId,
                newDepartmentId: departmentId
            });

            callback({ success: true });
        } catch (error) {
            console.error('Error forwarding ticket:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to forward ticket';
            callback({ success: false, error: errorMessage });
        }
    });

    // Handle agent ticket management
    socket.on('get-agent-dashboard-data', async (agentId: string, callback) => {
        try {
            const agent = await prisma.agent.findUnique({
                where: { id: agentId },
                include: {
                    department: true,
                    tickets: {
                        where: {
                            status: { in: ['completed', 'cancelled'] },
                            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
                        }
                    }
                }
            });

            if (!agent) {
                throw new Error('Agent not found');
            }

            const [currentTicket, queueLength] = await Promise.all([
                prisma.ticket.findFirst({
                    where: {
                        assignedAgentId: agentId,
                        status: 'serving'
                    }
                }),
                prisma.ticket.count({
                    where: {
                        departmentId: agent.departmentId,
                        status: 'waiting'
                    }
                })
            ]);

            const stats = {
                ticketsHandled: agent.tickets.length,
                avgHandlingTime: agent.avgHandlingTime,
                customerSatisfaction: agent.customerSatisfaction,
                status: agent.status
            };

            const formattedTicket = currentTicket ? {
                id: currentTicket.id,
                ticketNumber: currentTicket.number,
                customerName: currentTicket.customerName,
                serviceName: currentTicket.service,
                waitTime: Math.floor((Date.now() - currentTicket.createdAt.getTime()) / (1000 * 60)),
                status: 'serving' as const
            } : null;

            callback({
                success: true,
                stats,
                currentTicket: formattedTicket,
                queueLength
            });
        } catch (error) {
            console.error('Error fetching agent dashboard data:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to fetch agent data';
            callback({ success: false, error: errorMessage });
        }
    });

    socket.on('get-next-ticket', async ({ agentId }, callback) => {
        try {
            // Verify agent exists and is available
            const agent = await prisma.agent.findUnique({
                where: { id: agentId },
                include: { department: true }
            });

            if (!agent) {
                throw new Error('Agent not found');
            }

            // Get next waiting ticket in the agent's department
            const nextTicket = await prisma.ticket.findFirst({
                where: {
                    departmentId: agent.departmentId,
                    status: 'waiting',
                    assignedAgentId: null
                },
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'asc' }
                ]
            });

            if (!nextTicket) {
                callback({ success: true, ticket: null });
                return;
            }

            // Update ticket status and assign to agent
            const updatedTicket = await prisma.ticket.update({
                where: { id: nextTicket.id },
                data: {
                    status: 'serving',
                    assignedAgentId: agentId,
                    servicedAt: new Date()
                },
                include: {
                    Department: true
                }
            });

            // Get updated queue length
            const newQueueLength = await prisma.ticket.count({
                where: {
                    departmentId: agent.departmentId,
                    status: 'waiting'
                }
            });

            // Format ticket for response
            const formattedTicket = {
                id: updatedTicket.id,
                number: updatedTicket.number,
                customerName: updatedTicket.customerName,
                service: updatedTicket.service,
                waitTime: Math.floor((Date.now() - updatedTicket.createdAt.getTime()) / (1000 * 60)),
                status: 'serving' as const
            };

            // Emit updates
            io.emit('ticket-status-update', {
                ticketId: updatedTicket.id,
                status: 'serving',
                agentId
            });

            // Update queue length for all clients
            io.emit('queue-update', newQueueLength);

            // Notify customer that their ticket is being served
            if (updatedTicket.userId !== 'guest') {
                socket.to(`customer:${updatedTicket.userId}`).emit('ticket-called', {
                    ticketId: updatedTicket.id,
                    ticketNumber: updatedTicket.number,
                    agentName: agent.name
                });
            }

            callback({ success: true, ticket: formattedTicket });
        } catch (error) {
            console.error('Error getting next ticket:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to get next ticket';
            callback({ success: false, error: errorMessage });
        }
    });

    socket.on('complete-ticket', async ({ ticketId, agentId }, callback) => {
        try {
            const ticket = await prisma.ticket.update({
                where: {
                    id: ticketId,
                    assignedAgentId: agentId
                },
                data: {
                    status: 'completed',
                    completedAt: new Date()
                },
                include: {
                    Department: true
                }
            });

            // Update agent metrics
            await prisma.agent.update({
                where: { id: agentId },
                data: {
                    ticketsHandled: { increment: 1 }
                }
            });

            // Emit updates
            io.emit('ticket-status-update', {
                ticketId: ticket.id,
                status: 'completed'
            });

            // Notify department room
            socket.to(`department:${ticket.departmentId}`).emit('ticket-completed', ticket);

            callback({ success: true });
        } catch (error) {
            console.error('Error completing ticket:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to complete ticket';
            callback({ success: false, error: errorMessage });
        }
    });

    socket.on('transfer-ticket', async ({ ticketId, toDepartment }, callback) => {
        try {
            const [ticket, targetDepartment] = await Promise.all([
                prisma.ticket.findUnique({
                    where: { id: ticketId },
                    include: { Department: true }
                }),
                prisma.department.findFirst({
                    where: { name: toDepartment }
                })
            ]);

            if (!ticket || !targetDepartment) {
                throw new Error('Ticket or target department not found');
            }

            const updatedTicket = await prisma.ticket.update({
                where: { id: ticketId },
                data: {
                    departmentId: targetDepartment.id,
                    department: targetDepartment.name,
                    status: 'waiting',
                    assignedAgentId: null,
                    position: await prisma.ticket.count({
                        where: {
                            departmentId: targetDepartment.id,
                            status: 'waiting'
                        }
                    }) + 1
                }
            });

            // Emit updates
            io.emit('ticket-status-update', {
                ticketId: updatedTicket.id,
                status: 'waiting',
                departmentId: targetDepartment.id
            });

            // Notify departments
            socket.to(`department:${ticket.departmentId}`).emit('ticket-transferred-out', updatedTicket);
            socket.to(`department:${targetDepartment.id}`).emit('ticket-transferred-in', updatedTicket);

            callback({ success: true });
        } catch (error) {
            console.error('Error transferring ticket:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to transfer ticket';
            callback({ success: false, error: errorMessage });
        }
    });

    // Handle agent ticket review
    socket.on('review-ticket', async ({ ticketId, agentId }, callback) => {
        try {
            // Verify agent exists
            const agent = await prisma.agent.findUnique({
                where: { id: agentId },
                include: { department: true }
            });

            if (!agent) {
                throw new Error('Agent not found');
            }

            // Get ticket with full details
            const ticket = await prisma.ticket.findUnique({
                where: { id: ticketId },
                include: {
                    Department: true,
                    documents: true,
                    history: {
                        include: {
                            agent: true
                        },
                        orderBy: {
                            createdAt: 'desc'
                        }
                    }
                }
            }) as TicketWithRelations | null;

            if (!ticket) {
                throw new Error('Ticket not found');
            }

            // Format ticket for review
            const formattedTicket = {
                id: ticket.id,
                number: ticket.number,
                customerName: ticket.customerName,
                service: ticket.service,
                department: ticket.Department?.name || ticket.department,
                status: ticket.status,
                priority: ticket.priority,
                waitTime: Math.floor((Date.now() - ticket.createdAt.getTime()) / (1000 * 60)),
                createdAt: ticket.createdAt,
                documents: ticket.documents.map(doc => ({
                    id: doc.id,
                    name: doc.name,
                    type: doc.type,
                    url: doc.url
                })),
                history: ticket.history.map(entry => ({
                    id: entry.id,
                    action: entry.action,
                    notes: entry.notes,
                    createdAt: entry.createdAt,
                    agentName: entry.agent.name
                })),
                additionalInfo: ticket.additionalInfo
            };

            callback({ success: true, ticket: formattedTicket });
        } catch (error) {
            console.error('Error reviewing ticket:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to review ticket';
            callback({ success: false, error: errorMessage });
        }
    });

    // Handle agent ticket action after review
    socket.on('process-ticket', async ({ ticketId, agentId, action, notes }, callback) => {
        try {
            // Verify agent exists
            const agent = await prisma.agent.findUnique({
                where: { id: agentId }
            });

            if (!agent) {
                throw new Error('Agent not found');
            }

            // Get ticket
            const ticket = await prisma.ticket.findUnique({
                where: { id: ticketId }
            });

            if (!ticket) {
                throw new Error('Ticket not found');
            }

            // Create ticket history entry and update ticket in a transaction
            const updatedTicket = await prisma.$transaction(async (tx) => {
                // Create history entry
                await tx.ticketHistory.create({
                    data: {
                        action,
                        notes: notes || '',
                        ticketId,
                        agentId
                    }
                });

                // Update ticket status
                const updatedTicket = await tx.ticket.update({
                    where: { id: ticketId },
                    data: {
                        status: action,
                        completedAt: action === 'completed' ? new Date() : undefined
                    },
                    include: {
                        Department: true
                    }
                });

                // Update agent metrics
                if (action === 'completed') {
                    await tx.agent.update({
                        where: { id: agentId },
                        data: {
                            ticketsHandled: { increment: 1 }
                        }
                    });
                }

                return updatedTicket;
            });

            // Get updated queue length
            const newQueueLength = await prisma.ticket.count({
                where: {
                    departmentId: ticket.departmentId,
                    status: 'waiting'
                }
            });

            // Emit updates
            io.emit('ticket-status-update', {
                ticketId: updatedTicket.id,
                status: action,
                agentId
            });

            // Update queue length for all clients
            io.emit('queue-update', newQueueLength);

            // Notify customer
            if (ticket.userId !== 'guest') {
                socket.to(`customer:${ticket.userId}`).emit('ticket-processed', {
                    ticketId: ticket.id,
                    ticketNumber: ticket.number,
                    status: action,
                    agentName: agent.name
                });
            }

            callback({ success: true });
        } catch (error) {
            console.error('Error processing ticket:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to process ticket';
            callback({ success: false, error: errorMessage });
        }
    });
});

// Update the feedback endpoint
app.post('/api/feedback', (async (req: Request, res: Response) => {
    try {
        const { name, email, subject, message } = req.body;

        // Validate input
        if (!name || !email || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Email content
        const mailOptions = {
            from: process.env.EMAIL_USER || 'your-email@gmail.com',
            to: process.env.FEEDBACK_EMAIL || 'your-feedback-email@gmail.com',
            subject: `Feedback from ${name}: ${subject}`,
            text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}

Sent from: Queue Management System
            `,
            html: `
<h2>Feedback Received</h2>
<p><strong>Name:</strong> ${name}</p>
<p><strong>Email:</strong> ${email}</p>
<p><strong>Subject:</strong> ${subject}</p>
<h3>Message:</h3>
<p>${message}</p>
<br>
<p><em>Sent from: Queue Management System</em></p>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Log feedback for backup
        console.log('Feedback received:', {
            name,
            email,
            subject,
            message,
            timestamp: new Date().toISOString()
        });

        // Send response
        res.status(200).json({
            success: true,
            message: 'Feedback received successfully. Thank you for your input!'
        });

    } catch (error) {
        console.error('Error handling feedback:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process feedback'
        });
    }
}) as RequestHandler);

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});