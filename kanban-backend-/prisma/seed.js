"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Starting database seed...');
    // Create admin user
    const adminPassword = await bcryptjs_1.default.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@kanban.com' },
        update: {},
        create: {
            username: 'admin',
            email: 'admin@kanban.com',
            password: adminPassword,
            firstName: 'Admin',
            lastName: 'User'
        }
    });
    // Create demo users
    const user1Password = await bcryptjs_1.default.hash('user123', 12);
    const user1 = await prisma.user.upsert({
        where: { email: 'john@kanban.com' },
        update: {},
        create: {
            username: 'john_doe',
            email: 'john@kanban.com',
            password: user1Password,
            firstName: 'John',
            lastName: 'Doe'
        }
    });
    const user2Password = await bcryptjs_1.default.hash('user123', 12);
    const user2 = await prisma.user.upsert({
        where: { email: 'jane@kanban.com' },
        update: {},
        create: {
            username: 'jane_smith',
            email: 'jane@kanban.com',
            password: user2Password,
            firstName: 'Jane',
            lastName: 'Smith'
        }
    });
    // Create demo project
    const project = await prisma.project.upsert({
        where: { id: 1 },
        update: {},
        create: {
            title: 'Demo Project',
            description: 'A demo project for testing the Kanban board',
            createdById: admin.id
        }
    });
    // Add users to project
    await prisma.projectMember.upsert({
        where: {
            projectId_userId: {
                projectId: project.id,
                userId: admin.id
            }
        },
        update: {},
        create: {
            projectId: project.id,
            userId: admin.id,
            role: 'admin'
        }
    });
    await prisma.projectMember.upsert({
        where: {
            projectId_userId: {
                projectId: project.id,
                userId: user1.id
            }
        },
        update: {},
        create: {
            projectId: project.id,
            userId: user1.id,
            role: 'member'
        }
    });
    await prisma.projectMember.upsert({
        where: {
            projectId_userId: {
                projectId: project.id,
                userId: user2.id
            }
        },
        update: {},
        create: {
            projectId: project.id,
            userId: user2.id,
            role: 'member'
        }
    });
    // Create demo board
    const board = await prisma.board.upsert({
        where: { id: 1 },
        update: {},
        create: {
            title: 'Demo Kanban Board',
            description: 'A demo board for testing',
            projectId: project.id,
            createdById: admin.id
        }
    });
    // Create demo lists
    const todoList = await prisma.kanbanList.upsert({
        where: { id: 1 },
        update: {},
        create: {
            title: 'To Do',
            boardId: board.id,
            seqNo: 1,
            createdById: admin.id
        }
    });
    const inProgressList = await prisma.kanbanList.upsert({
        where: { id: 2 },
        update: {},
        create: {
            title: 'In Progress',
            boardId: board.id,
            seqNo: 2,
            createdById: admin.id
        }
    });
    const doneList = await prisma.kanbanList.upsert({
        where: { id: 3 },
        update: {},
        create: {
            title: 'Done',
            boardId: board.id,
            seqNo: 3,
            createdById: admin.id
        }
    });
    // Create demo cards
    const card1 = await prisma.kanbanCard.upsert({
        where: { id: 1 },
        update: {},
        create: {
            title: 'Setup Project Environment',
            description: 'Install dependencies and configure development environment',
            listId: todoList.id,
            seqNo: 1,
            createdById: admin.id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
    });
    const card2 = await prisma.kanbanCard.upsert({
        where: { id: 2 },
        update: {},
        create: {
            title: 'Design Database Schema',
            description: 'Create database schema for the kanban application',
            listId: inProgressList.id,
            seqNo: 1,
            createdById: user1.id,
            startDate: new Date(),
            endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) // 5 days from now
        }
    });
    const card3 = await prisma.kanbanCard.upsert({
        where: { id: 3 },
        update: {},
        create: {
            title: 'Create User Authentication',
            description: 'Implement user registration and login functionality',
            listId: doneList.id,
            seqNo: 1,
            completed: true,
            createdById: user2.id,
            startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
        }
    });
    // Create demo tags
    await prisma.kanbanTag.upsert({
        where: { id: 1 },
        update: {},
        create: {
            title: 'Backend',
            color: 'bg-blue-600 text-white',
            cardId: card1.id,
            seqNo: 1,
            createdById: admin.id
        }
    });
    await prisma.kanbanTag.upsert({
        where: { id: 2 },
        update: {},
        create: {
            title: 'High Priority',
            color: 'bg-red-600 text-white',
            cardId: card2.id,
            seqNo: 1,
            createdById: user1.id
        }
    });
    await prisma.kanbanTag.upsert({
        where: { id: 3 },
        update: {},
        create: {
            title: 'Authentication',
            color: 'bg-green-600 text-white',
            cardId: card3.id,
            seqNo: 1,
            createdById: user2.id
        }
    });
    // Create demo tasks
    const task1 = await prisma.kanbanTask.upsert({
        where: { id: 1 },
        update: {},
        create: {
            title: 'Install Node.js and npm',
            cardId: card1.id,
            seqNo: 1,
            createdById: admin.id
        }
    });
    const task2 = await prisma.kanbanTask.upsert({
        where: { id: 2 },
        update: {},
        create: {
            title: 'Setup database connection',
            cardId: card1.id,
            seqNo: 2,
            createdById: admin.id
        }
    });
    const task3 = await prisma.kanbanTask.upsert({
        where: { id: 3 },
        update: {},
        create: {
            title: 'Create user registration endpoint',
            completed: true,
            cardId: card3.id,
            seqNo: 1,
            createdById: user2.id,
            updatedById: user2.id
        }
    });
    // Create task assignments
    await prisma.taskAssignment.upsert({
        where: {
            taskId_userId: {
                taskId: task1.id,
                userId: admin.id
            }
        },
        update: {},
        create: {
            taskId: task1.id,
            userId: admin.id
        }
    });
    await prisma.taskAssignment.upsert({
        where: {
            taskId_userId: {
                taskId: task2.id,
                userId: user1.id
            }
        },
        update: {},
        create: {
            taskId: task2.id,
            userId: user1.id
        }
    });
    console.log('✅ Database seeded successfully!');
    console.log('Demo users created:');
    console.log('- Admin: admin@kanban.com / admin123');
    console.log('- User 1: john@kanban.com / user123');
    console.log('- User 2: jane@kanban.com / user123');
    console.log(`- Demo Project ID: ${project.id}`);
    console.log(`- Demo Board ID: ${board.id}`);
}
main()
    .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map