import express from "express";
import { z } from "zod";
import { db } from "../config/database";
import { authenticateToken } from "../middleware/auth";
import { validateBody } from "../middleware/validation";

const router = express.Router();

const createProjectSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
});

const addMemberSchema = z.object({
  userId: z.number(),
  role: z.enum(["admin", "member"]).default("member"),
});

// Get user's projects
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;

    const projects = await db.project.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
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
                id: true,
                username: true,
                email: true,
                userPic: true,
              },
            },
          },
        },
        boards: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ success: true, data: projects });
  } catch (error) {
    console.error("Get projects error:", error);
    return res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// Create new project
router.post(
  "/",
  authenticateToken,
  validateBody(createProjectSchema),
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { title, description } = req.body;

      const project = await db.project.create({
        data: {
          title,
          description,
          createdById: userId,
          members: {
            create: {
              userId,
              role: "admin",
            },
          },
        },
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
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return res.status(201).json({ success: true, data: project });
    } catch (error) {
      console.error("Create project error:", error);
      return res.status(500).json({ error: "Failed to create project" });
    }
  }
);

// Get project by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    const project = await db.project.findFirst({
      where: {
        id: parseInt(id),
        members: {
          some: { userId },
        },
      },
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
                id: true,
                username: true,
                email: true,
                userPic: true,
              },
            },
          },
        },
        boards: true,
      },
    });

    if (!project) {
      return res
        .status(404)
        .json({ error: "Project not found or access denied" });
    }

    return res.json({ success: true, data: project });
  } catch (error) {
    console.error("Get project error:", error);
    return res.status(500).json({ error: "Failed to fetch project" });
  }
});

// Update project
router.put(
  "/:id",
  authenticateToken,
  validateBody(createProjectSchema),
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { title, description } = req.body;

      // Check if user has access to the project
      const membership = await db.projectMember.findFirst({
        where: {
          projectId: parseInt(id),
          userId,
          role: "admin",
        },
      });

      if (!membership) {
        return res
          .status(403)
          .json({ error: "Only project admins can update projects" });
      }

      const project = await db.project.update({
        where: { id: parseInt(id) },
        data: {
          title,
          description,
          updatedAt: new Date(),
        },
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
                  id: true,
                  username: true,
                  email: true,
                },
              },
            },
          },
          boards: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      });

      return res.json({ success: true, data: project });
    } catch (error) {
      console.error("Update project error:", error);
      return res.status(500).json({ error: "Failed to update project" });
    }
  }
);

// Delete project
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const projectId = parseInt(id);

    // 🔒 PROTECTION: Prevent deletion of default project (ID 1)
    if (projectId === 1) {
      console.log(`🚫 User ${userId} attempted to delete default project (ID 1)`);
      return res.status(403).json({
        error: "Cannot delete default project",
        message: "The default project (ID 1) is protected and cannot be deleted",
      });
    }

    // Check if user is admin of the project
    const membership = await db.projectMember.findFirst({
      where: {
        projectId: projectId,
        userId,
        role: "admin",
      },
    });

    if (!membership) {
      return res
        .status(403)
        .json({ error: "Only project admins can delete projects" });
    }

    // Delete the project (cascade will handle members)
    await db.project.delete({
      where: { id: projectId },
    });

    console.log(`✅ Project ${projectId} deleted by user ${userId}`);
    return res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    return res.status(500).json({ error: "Failed to delete project" });
  }
});

// Add member to project
router.post(
  "/:id/members",
  authenticateToken,
  validateBody(addMemberSchema),
  async (req, res) => {
    try {
      const userId = (req as any).user.id;
      const { id } = req.params;
      const { userId: newMemberId, role } = req.body;

      // Check if user is admin of the project
      const membership = await db.projectMember.findFirst({
        where: {
          projectId: parseInt(id),
          userId,
          role: "admin",
        },
      });

      if (!membership) {
        return res
          .status(403)
          .json({ error: "Only project admins can add members" });
      }

      // Check if user is already a member
      const existingMember = await db.projectMember.findFirst({
        where: {
          projectId: parseInt(id),
          userId: newMemberId,
        },
      });

      if (existingMember) {
        return res.status(400).json({ error: "User is already a member" });
      }

      const newMember = await db.projectMember.create({
        data: {
          projectId: parseInt(id),
          userId: newMemberId,
          role,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              userPic: true,
            },
          },
        },
      });

      return res.status(201).json({ success: true, data: newMember });
    } catch (error) {
      console.error("Add member error:", error);
      return res.status(500).json({ error: "Failed to add member" });
    }
  }
);

export default router;
