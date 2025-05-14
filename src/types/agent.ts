export type AgentStatus = 'available' | 'busy' | 'offline';

export interface AgentStats {
    ticketsHandled: number;
    avgHandlingTime: number;
    customerSatisfaction: number;
    status: AgentStatus;
}

export interface CurrentTicket {
    id: string;
    number: string;
    customerName: string;
    service: string;
    waitTime: number;
    status: 'serving' | 'pending';
} 