import { Prisma } from '@prisma/client';

export interface Ticket {
    id: string;
    number: string;
    createdAt: Date;
    updatedAt: Date;
    status: string;
    servicedAt: Date | null;
    completedAt: Date | null;
    waitTime: number;
    priority: string;
    department: string;
    service: string;
    customerName: string;
    position: number;
    userId: string;
    assignedAgentId: string | null;
    departmentId: string | null;
    agentId: string | null;
}

export interface TicketWithRelations extends Omit<Ticket, 'assignedAgent'> {
    user: Prisma.UserGetPayload<{ include: { tickets: true } }>;
    assignedAgent: Prisma.UserGetPayload<{ include: { assignedTickets: true } }> | null;
    Department: Prisma.DepartmentGetPayload<{ include: { tickets: true } }> | null;
    Agent: Prisma.AgentGetPayload<{ include: { tickets: true } }> | null;
}

export interface DepartmentStat {
    name: string;
    activeTickets: number;
    waitingTickets: number;
    servingTickets: number;
    agentsAvailable: number;
    avgWaitTime: number;
}

export interface TicketCreateData extends Prisma.TicketCreateInput {
    additionalInfo?: string;
}

export interface TicketGenerationData {
    userId?: string;
    customerName: string;
    serviceId?: string;
    serviceName: string;
    departmentId: string;
    department: string;
    priority: 'low' | 'normal' | 'high';
    estimatedWaitTime?: number;
    additionalInfo?: string;
    status?: 'waiting';
}

export interface BaseUser {
    id: string;
    username: string;
    email: string;
    role: string;
    status: string | null;
    department: string | null;
    tickets?: Ticket[];
    assignedTickets?: Ticket[];
}

export interface BaseAgent {
    id: string;
    name: string;
    status: string;
    ticketsHandled: number;
    avgHandlingTime: number;
    customerSatisfaction: number;
    departmentId: string;
    department?: Prisma.DepartmentGetPayload<{ include: { agents: true } }>;
    tickets?: Ticket[];
    createdAt: Date;
    updatedAt: Date;
}

export interface BaseDepartment {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
    agents?: Prisma.AgentGetPayload<{ include: { department: true } }>[];
    tickets?: Ticket[];
    waitingCount: number;
    activeCount: number;
} 