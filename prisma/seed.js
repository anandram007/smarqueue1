import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Create guest user for anonymous tickets
    const guestUser = await prisma.user.create({
        data: {
            id: 'guest',
            username: 'Guest User',
            email: 'guest@system.local',
            password: await bcrypt.hash('guestpass', 10),
            role: 'guest'
        },
    });

    // Create departments
    const customerService = await prisma.department.create({
        data: {
            name: 'Customer Service',
        },
    });

    const technicalSupport = await prisma.department.create({
        data: {
            name: 'Technical Support',
        },
    });

    // Create agent users with credentials
    const agent1User = await prisma.user.create({
        data: {
            username: 'john.doe',
            email: 'john.doe@example.com',
            password: await bcrypt.hash('agent123', 10),
            role: 'agent',
            department: customerService.name
        },
    });

    const agent2User = await prisma.user.create({
        data: {
            username: 'jane.smith',
            email: 'jane.smith@example.com',
            password: await bcrypt.hash('agent123', 10),
            role: 'agent',
            department: technicalSupport.name
        },
    });

    // Create admin user
    const adminUser = await prisma.user.create({
        data: {
            username: 'admin',
            email: 'admin@example.com',
            password: await bcrypt.hash('admin123', 10),
            role: 'admin',
            permissions: 'all'
        },
    });

    // Create agents linked to their user accounts
    const agent1 = await prisma.agent.create({
        data: {
            name: agent1User.username,
            status: 'available',
            ticketsHandled: 15,
            avgHandlingTime: 12.5,
            customerSatisfaction: 4.8,
            departmentId: customerService.id,
        },
    });

    const agent2 = await prisma.agent.create({
        data: {
            name: agent2User.username,
            status: 'busy',
            ticketsHandled: 20,
            avgHandlingTime: 10.2,
            customerSatisfaction: 4.9,
            departmentId: technicalSupport.id,
        },
    });

    // Create a test customer user for tickets
    const testUser1 = await prisma.user.create({
        data: {
            username: 'testuser1',
            email: 'testuser1@example.com',
            password: await bcrypt.hash('test123', 10),
            role: 'customer'
        }
    });

    const testUser2 = await prisma.user.create({
        data: {
            username: 'testuser2',
            email: 'testuser2@example.com',
            password: await bcrypt.hash('test123', 10),
            role: 'customer'
        }
    });

    // Create some tickets
    await prisma.ticket.create({
        data: {
            number: 'T001',
            userId: testUser1.id,
            status: 'waiting',
            departmentId: customerService.id,
            department: customerService.name,
            service: 'General Inquiry',
            customerName: 'Alice Johnson',
            priority: 'normal',
            waitTime: 15,
        },
    });

    await prisma.ticket.create({
        data: {
            number: 'T002',
            userId: testUser2.id,
            status: 'serving',
            departmentId: technicalSupport.id,
            department: technicalSupport.name,
            service: 'Technical Support',
            agentId: agent2.id,
            customerName: 'Bob Wilson',
            priority: 'high',
            waitTime: 5,
        },
    });

    console.log('Seed data created successfully');
    console.log('\nLogin Credentials:');
    console.log('Admin - Email: admin@example.com, Password: admin123');
    console.log('Agent 1 - Email: john.doe@example.com, Password: agent123');
    console.log('Agent 2 - Email: jane.smith@example.com, Password: agent123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 