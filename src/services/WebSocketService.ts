import { useEffect, useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';

// Define types for our real-time data
export interface AgentStatus {
  id: string;
  name: string;
  department: string;
  status: 'available' | 'busy' | 'offline';
  ticketsHandled: number;
}

export interface QueueStats {
  totalActiveTickets: number;
  avgWaitTime: number;
  customersServed: number;
  ticketCompletion: number;
}

export interface DepartmentStats {
  id: string;
  name: string;
  activeTickets: number;
  avgWaitTime: number;
  agentsAvailable: number;
}

export interface PeakHourData {
  hour: number;
  count: number;
}

export interface DashboardData {
  stats: QueueStats;
  departmentStats: DepartmentStats[];
  agents: AgentStatus[];
  peakHours: PeakHourData[];
  lastUpdated: Date;
}

// WebSocket hook for real-time dashboard data
export function useWebSocketDashboard() {
  const { addNotification } = useNotification();
  const [isConnected, setIsConnected] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
      totalActiveTickets: 0,
      avgWaitTime: 0,
      customersServed: 0,
      ticketCompletion: 0
    },
    departmentStats: [],
    agents: [],
    peakHours: [],
    lastUpdated: new Date()
  });

  useEffect(() => {
    // In a real implementation, connect to your WebSocket server
    // For now, we'll simulate with random data updates
    
    // Simulate connection established
    setIsConnected(true);
    addNotification('Real-time data connection established', 'success');
    
    // Function to generate random dashboard data
    const generateRandomData = () => {
      // Generate random stats
      const stats = {
        totalActiveTickets: Math.floor(Math.random() * 50) + 10,
        avgWaitTime: Math.floor(Math.random() * 30) + 5,
        customersServed: Math.floor(Math.random() * 100) + 20,
        ticketCompletion: Math.floor(Math.random() * 40) + 60
      };
      
      // Generate random department stats
      const departments = [
        'Claims Processing', 
        'Billing Department', 
        'Enrollment Services', 
        'Benefits Department'
      ];
      
      const departmentStats = departments.map((name, index) => ({
        id: (index + 1).toString(),
        name,
        activeTickets: Math.floor(Math.random() * 15) + 1,
        avgWaitTime: Math.floor(Math.random() * 20) + 5,
        agentsAvailable: Math.floor(Math.random() * 5) + 1
      }));
      
      // Generate random agent data
      const agentNames = [
        'John Smith', 
        'Emma Wilson', 
        'Michael Johnson', 
        'Sarah Davis', 
        'Robert Taylor'
      ];
      
      const statuses: ('available' | 'busy' | 'offline')[] = ['available', 'busy', 'offline'];
      
      const agents = agentNames.map((name, index) => ({
        id: (index + 1).toString(),
        name,
        department: departments[Math.floor(Math.random() * departments.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        ticketsHandled: Math.floor(Math.random() * 20) + 1
      }));
      
      // Generate random peak hours data
      const peakHours = Array(5).fill(null).map((_, index) => ({
        hour: Math.floor(Math.random() * 12) + 8, // Between 8 AM and 8 PM
        count: Math.floor(Math.random() * 30) + 10
      }));
      
      return {
        stats,
        departmentStats,
        agents,
        peakHours,
        lastUpdated: new Date()
      };
    };
    
    // Initial data
    setDashboardData(generateRandomData());
    
    // Simulate WebSocket updates every 10 seconds
    const intervalId = setInterval(() => {
      setDashboardData(generateRandomData());
    }, 10000);
    
    // Cleanup on unmount
    return () => {
      clearInterval(intervalId);
      setIsConnected(false);
    };
  }, [addNotification]);
  
  return { dashboardData, isConnected };
}