import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addProjectMember() {
  try {
    // Step 1: List all users
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

    users.forEach((user) => {
      console.log(
        `  ID: ${user.id} | Username: ${user.username} | Email: ${user.email} | Name: ${user.firstName} ${user.lastName}`
      );
    });

    // Step 2: List all projects
    console.log("\n📋 Available Projects:");
    const projects = await prisma.project.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        createdAt: true,
      },
    });

    projects.forEach((project) => {
      console.log(
        `  ID: ${project.id} | Title: ${project.title} | Description: ${
          project.description || "N/A"
        }`
      );
    });

    // Step 3: Check if any arguments were passed
    const userId = process.argv[2] ? parseInt(process.argv[2]) : null;
    const projectId = process.argv[3] ? parseInt(process.argv[3]) : null;
    const role = process.argv[4] || "admin"; // Default to admin

    if (!userId || !projectId) {
      console.log("\n❌ Usage: npm run add-member <userId> <projectId> [role]");
      console.log("   Example: npm run add-member 1 1 admin");
      console.log('   Roles: "admin" or "member" (default: admin)\n');
      process.exit(1);
    }

    // Step 4: Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.log(`\n❌ User with ID ${userId} not found!`);
      process.exit(1);
    }

    // Step 5: Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      console.log(`\n❌ Project with ID ${projectId} not found!`);
      process.exit(1);
    }

    // Step 6: Check if member already exists
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId: userId,
      },
    });

    if (existingMember) {
      console.log(
        `\n⚠️  User "${user.username}" is already a member of project "${project.title}" with role: ${existingMember.role}`
      );

      // Ask if they want to update the role
      if (existingMember.role !== role) {
        console.log(
          `\n🔄 Updating role from "${existingMember.role}" to "${role}"...`
        );
        await prisma.projectMember.update({
          where: { id: existingMember.id },
          data: { role },
        });
        console.log(`✅ Role updated successfully!`);
      }
    } else {
      // Step 7: Add project member
      console.log(
        `\n➕ Adding user "${user.username}" as ${role} to project "${project.title}"...`
      );

      const newMember = await prisma.projectMember.create({
        data: {
          userId: userId,
          projectId: projectId,
          role: role,
        },
      });

      console.log(`✅ Successfully added! Member ID: ${newMember.id}`);
    }

    // Step 8: Show current project members
    console.log(`\n👥 Current members of "${project.title}":`);
    const members = await prisma.projectMember.findMany({
      where: { projectId: projectId },
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

    members.forEach((member) => {
      console.log(
        `  ${member.user.username} (${member.user.email}) - Role: ${member.role}`
      );
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addProjectMember();
