"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = express_1.default.Router();
const createProjectSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
});
const addMemberSchema = zod_1.z.object({
    userId: zod_1.z.number(),
    role: zod_1.z.enum(["admin", "member"]).default("member"),
});
// Get user's projects
router.get("/", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const projects = await database_1.db.project.findMany({
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
    }
    catch (error) {
        console.error("Get projects error:", error);
        return res.status(500).json({ error: "Failed to fetch projects" });
    }
});
// Create new project
router.post("/", auth_1.authenticateToken, (0, validation_1.validateBody)(createProjectSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description } = req.body;
        const project = await database_1.db.project.create({
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
    }
    catch (error) {
        console.error("Create project error:", error);
        return res.status(500).json({ error: "Failed to create project" });
    }
});
// Get project by ID
router.get("/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const project = await database_1.db.project.findFirst({
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
    }
    catch (error) {
        console.error("Get project error:", error);
        return res.status(500).json({ error: "Failed to fetch project" });
    }
});
// Update project
router.put("/:id", auth_1.authenticateToken, (0, validation_1.validateBody)(createProjectSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { title, description } = req.body;
        // Check if user has access to the project
        const membership = await database_1.db.projectMember.findFirst({
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
        const project = await database_1.db.project.update({
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
    }
    catch (error) {
        console.error("Update project error:", error);
        return res.status(500).json({ error: "Failed to update project" });
    }
});
// Delete project
router.delete("/:id", auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
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
        const membership = await database_1.db.projectMember.findFirst({
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
        await database_1.db.project.delete({
            where: { id: projectId },
        });
        console.log(`✅ Project ${projectId} deleted by user ${userId}`);
        return res.json({ success: true, message: "Project deleted successfully" });
    }
    catch (error) {
        console.error("Delete project error:", error);
        return res.status(500).json({ error: "Failed to delete project" });
    }
});
// Add member to project
router.post("/:id/members", auth_1.authenticateToken, (0, validation_1.validateBody)(addMemberSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { userId: newMemberId, role } = req.body;
        // Check if user is admin of the project
        const membership = await database_1.db.projectMember.findFirst({
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
        const existingMember = await database_1.db.projectMember.findFirst({
            where: {
                projectId: parseInt(id),
                userId: newMemberId,
            },
        });
        if (existingMember) {
            return res.status(400).json({ error: "User is already a member" });
        }
        const newMember = await database_1.db.projectMember.create({
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
    }
    catch (error) {
        console.error("Add member error:", error);
        return res.status(500).json({ error: "Failed to add member" });
    }
});
exports.default = router;
//# sourceMappingURL=projects.js.map