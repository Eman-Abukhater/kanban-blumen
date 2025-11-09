import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createDefaultProject() {
  try {
    console.log("🔍 Checking if Project ID 1 exists...");

    // Check if project 1 already exists
    const existingProject = await prisma.project.findUnique({
      where: { id: 1 },
    });

    if (existingProject) {
      console.log("✅ Project ID 1 already exists:");
      console.log(`   Title: ${existingProject.title}`);
      console.log(`   Description: ${existingProject.description || "N/A"}`);
      console.log("\n💡 No action needed!");
      return;
    }

    console.log("❌ Project ID 1 not found. Creating default project...\n");

    // Find user ID 1
    const user = await prisma.user.findUnique({
      where: { id: 1 },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });

    if (!user) {
      console.log("❌ User ID 1 not found! Cannot create project.");
      console.log("\nPlease create a user first or specify a different user ID.");
      process.exit(1);
    }

    console.log(`👤 Found user: ${user.username} (${user.email})`);

    // Use raw SQL to insert project with specific ID
    await prisma.$executeRaw`
      INSERT INTO projects (id, title, description, "createdById", "createdAt", "updatedAt")
      VALUES (1, 'Default Project', 'Default project for admin', ${user.id}, NOW(), NOW())
    `;

    console.log("✅ Project ID 1 created successfully!");

    // Add user as admin member
    await prisma.projectMember.create({
      data: {
        userId: user.id,
        projectId: 1,
        role: "admin",
      },
    });

    console.log(`✅ Added ${user.username} as admin to the project!\n`);

    // Fetch and display the created project
    const project = await prisma.project.findUnique({
      where: { id: 1 },
      include: {
        createdBy: {
          select: {
            username: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                username: true,
                email: true,
              },
            },
          },
        },
      },
    });

    console.log("📊 Project Details:");
    console.log(`   ID: ${project?.id}`);
    console.log(`   Title: ${project?.title}`);
    console.log(`   Description: ${project?.description || "N/A"}`);
    console.log(`   Created by: ${project?.createdBy.username}`);
    console.log(`   Created at: ${project?.createdAt}`);

    console.log("\n👥 Project Members:");
    project?.members.forEach((member) => {
      console.log(
        `   ${member.user.username} (${member.user.email}) - Role: ${member.role}`
      );
    });

    console.log("\n🎉 Success! You can now access the frontend with:");
    console.log("   http://localhost:3000/auth/1/1");
  } catch (error: any) {
    console.error("❌ Error:", error.message);

    if (error.code === "P2002") {
      console.log(
        "\n💡 Tip: Project ID 1 might already exist. Run this script again to check."
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultProject();

