import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addProject() {
  try {
    // Step 1: List all users (to choose who creates the project)
    console.log("📋 Available Users:");
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (users.length === 0) {
      console.log("❌ No users found! Please create a user first.");
      process.exit(1);
    }

    users.forEach((user) => {
      console.log(
        `  ID: ${user.id} | Username: ${user.username} | Email: ${user.email} | Name: ${user.firstName} ${user.lastName}`
      );
    });

    // Step 2: List existing projects
    console.log("\n📋 Existing Projects:");
    const existingProjects = await prisma.project.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
        createdBy: {
          select: {
            username: true,
          },
        },
      },
    });

    if (existingProjects.length === 0) {
      console.log("  No projects found yet.");
    } else {
      existingProjects.forEach((project) => {
        console.log(
          `  ID: ${project.id} | Title: ${project.title} | Created by: ${project.createdBy.username}`
        );
      });
    }

    // Step 3: Get arguments
    const title = process.argv[2];
    const description = process.argv[3];
    const createdById = process.argv[4] ? parseInt(process.argv[4]) : null;
    const autoAddCreator = process.argv[5] === "true" || !process.argv[5]; // Default true

    if (!title || !createdById) {
      console.log(
        '\n❌ Usage: npm run add-project "<title>" "<description>" <createdById> [autoAddCreator]'
      );
      console.log(
        '   Example: npm run add-project "My Project" "Project description" 1'
      );
      console.log(
        '   Example: npm run add-project "My Project" "Project description" 1 true'
      );
      console.log(
        "\n   autoAddCreator: Automatically add creator as admin member (default: true)\n"
      );
      process.exit(1);
    }

    // Step 4: Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: createdById },
    });

    if (!user) {
      console.log(`\n❌ User with ID ${createdById} not found!`);
      process.exit(1);
    }

    // Step 5: Create project
    console.log(`\n➕ Creating project "${title}"...`);

    const project = await prisma.project.create({
      data: {
        title: title,
        description: description || null,
        createdById: createdById,
      },
    });

    console.log(`✅ Project created successfully! Project ID: ${project.id}`);

    // Step 6: Automatically add creator as admin member
    if (autoAddCreator) {
      console.log(
        `\n➕ Adding creator "${user.username}" as admin to the project...`
      );

      await prisma.projectMember.create({
        data: {
          userId: createdById,
          projectId: project.id,
          role: "admin",
        },
      });

      console.log(`✅ Creator added as admin successfully!`);
    }

    // Step 7: Show project details
    console.log(`\n📊 Project Details:`);
    console.log(`   ID: ${project.id}`);
    console.log(`   Title: ${project.title}`);
    console.log(`   Description: ${project.description || "N/A"}`);
    console.log(`   Created by: ${user.username} (ID: ${user.id})`);
    console.log(`   Created at: ${project.createdAt}`);

    // Step 8: Show project members
    const members = await prisma.projectMember.findMany({
      where: { projectId: project.id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    if (members.length > 0) {
      console.log(`\n👥 Project Members:`);
      members.forEach((member) => {
        console.log(
          `   ${member.user.username} (${member.user.email}) - Role: ${member.role}`
        );
      });
    }

    console.log(
      `\n💡 Next steps: Use "npm run add-member ${createdById} ${project.id} admin" to add more members`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addProject();
