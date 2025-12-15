"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const zod_1 = require("zod");
const database_1 = require("../config/database");
const validation_1 = require("../middleware/validation");
const auth_1 = require("../middleware/auth");
const helpers_1 = require("../utils/helpers");
const router = express_1.default.Router();
// Validation schemas
const authUserSchema = zod_1.z.object({
    fkpoid: zod_1.z.string().transform(Number),
    userid: zod_1.z.string().transform(Number),
});
const addBoardSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100),
    fkpoid: zod_1.z.coerce.number().int().positive(), // "1" → 1
    addedby: zod_1.z.string().min(1),
    addedbyid: zod_1.z.coerce.number().int().positive(), // "2" → 2
});
const editBoardSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100),
    boardid: zod_1.z.number(),
    updatedby: zod_1.z.string(),
});
const addKanbanListSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100),
    fkboardid: zod_1.z.coerce.number().int().positive(),
    fkpoid: zod_1.z.coerce.number().int().positive(),
    addedby: zod_1.z.string().min(1).optional(), // used only for message
});
const addCardSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    fkKanbanListId: zod_1.z.coerce.number().int().positive(),
    fkboardid: zod_1.z.coerce.number().int().positive(),
    fkpoid: zod_1.z.coerce.number().int().positive(),
    addedby: zod_1.z.string().min(1).optional(),
});
const addTaskSchema = zod_1.z.object({
    title: zod_1.z.string().min(1),
    fkKanbanCardId: zod_1.z.coerce.number().int().positive(),
    selectedOptions: zod_1.z.string().optional().default(""),
    fkboardid: zod_1.z.coerce.number().int().positive(),
    fkpoid: zod_1.z.coerce.number().int().positive(),
    addedby: zod_1.z.string().min(1).optional(),
});
// Auth user - verify user access to project
router.get("/authuser", async (req, res) => {
    try {
        const { fkpoid, userid } = authUserSchema.parse(req.query);
        console.log("🔍 Auth Request - ProjectID:", fkpoid, "UserID:", userid);
        // Check if user exists and has access to the project
        const user = await database_1.db.user.findUnique({
            where: { id: userid },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                userPic: true,
                isActive: true,
            },
        });
        console.log("👤 User Found:", user ? `${user.username} (ID: ${user.id})` : "NOT FOUND");
        if (!user || !user.isActive) {
            return res.status(404).json({ error: "User not found or inactive" });
        }
        // Check if project exists
        const project = await database_1.db.project.findUnique({
            where: { id: fkpoid },
            select: {
                id: true,
                title: true,
            },
        });
        console.log("📁 Project Found:", project ? `${project.title} (ID: ${project.id})` : "NOT FOUND");
        if (!project) {
            return res.status(404).json({
                error: "Project not found",
                details: `Project with ID ${fkpoid} does not exist in the database`,
            });
        }
        // Check project access
        const projectMember = await database_1.db.projectMember.findFirst({
            where: {
                projectId: fkpoid,
                userId: userid,
            },
            include: {
                project: {
                    select: {
                        id: true,
                        title: true,
                    },
                },
            },
        });
        console.log("🔐 Project Member:", projectMember ? `FOUND (Role: ${projectMember.role})` : "NOT FOUND");
        if (!projectMember) {
            // Get all projects user has access to for debugging
            const userProjects = await database_1.db.projectMember.findMany({
                where: { userId: userid },
                select: { projectId: true },
            });
            const accessibleProjectIds = userProjects.map((pm) => pm.projectId);
            console.log("❌ Access Denied - User", userid, "tried to access project", fkpoid);
            console.log("✅ User has access to projects:", accessibleProjectIds);
            return res.status(403).json({
                error: "Access denied to this project",
                details: `User ${userid} is not a member of project ${fkpoid}`,
                accessibleProjects: accessibleProjectIds,
            });
        }
        return res.json({
            ...user,
            fkpoid: fkpoid,
            projectTitle: projectMember.project.title,
            role: projectMember.role,
        });
    }
    catch (error) {
        console.error("Auth user error:", error);
        return res.status(500).json({ error: "Authentication failed" });
    }
});
// Get board list for a project - No caching for real-time updates
router.get("/getBoardlist", async (req, res) => {
    try {
        const { fkpoid } = req.query;
        if (!fkpoid) {
            return res.status(400).json({ error: "Project ID required" });
        }
        const boards = await database_1.db.board.findMany({
            where: { projectId: parseInt(fkpoid) },
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
            orderBy: { createdAt: "desc" },
        });
        const formattedBoards = boards.map((board) => ({
            boardId: board.id,
            title: board.title,
            description: board.description,
            createdAt: board.createdAt,
            createdBy: board.createdBy.username,
        }));
        return res.json(formattedBoards);
    }
    catch (error) {
        console.error("Get board list error:", error);
        return res.status(500).json({ error: "Failed to fetch boards" });
    }
});
// Add new board
router.post("/addboard", auth_1.authenticateToken, (0, validation_1.validateBody)(addBoardSchema), async (req, res) => {
    try {
        const { title, fkpoid, addedby } = req.body;
        const board = await database_1.db.board.create({
            data: {
                title,
                projectId: fkpoid,
                createdById: req.user.id, // <— from JWT, not from body
            },
            select: { id: true },
        });
        // Clear any cached board list data for this project
        helpers_1.APICache.clear();
        const io = req.app.get("io");
        if (io) {
            io.emitToProject(fkpoid, "addEditBoard", `New board "${title}" created by ${addedby}`);
        }
        return res.json(board.id);
    }
    catch (error) {
        console.error("Add board error:", error);
        return res.status(500).json({ error: "Failed to create board" });
    }
});
// Edit board
router.post("/editboard", (0, validation_1.validateBody)(editBoardSchema), async (req, res) => {
    try {
        const { title, boardid, updatedby } = req.body;
        const board = await database_1.db.board.update({
            where: { id: boardid },
            data: { title },
            include: { project: true },
        });
        // Clear any cached data
        helpers_1.APICache.clear();
        // Emit real-time update
        const io = req.app.get("io");
        if (io) {
            io.emitToProject(board.projectId, "addEditBoard", `Board "${title}" updated by ${updatedby}`);
        }
        return res.json(`Board updated successfully`);
    }
    catch (error) {
        console.error("Edit board error:", error);
        return res.status(500).json({ error: "Failed to update board" });
    }
});
// Get kanban list (complete board data) - No caching for real-time updates
router.get("/getkanbanlist", async (req, res) => {
    try {
        const { fkboardid } = req.query;
        if (!fkboardid) {
            return res.status(400).json({ error: "Board ID required" });
        }
        // Use a single optimized query with proper relations
        const lists = await database_1.db.kanbanList.findMany({
            where: { boardId: parseInt(fkboardid) },
            include: {
                cards: {
                    include: {
                        tags: {
                            orderBy: { seqNo: "asc" },
                        },
                        tasks: {
                            include: {
                                assignments: {
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                username: true,
                                            },
                                        },
                                    },
                                },
                                createdBy: {
                                    select: {
                                        username: true,
                                    },
                                },
                                updatedBy: {
                                    select: {
                                        username: true,
                                    },
                                },
                            },
                            orderBy: { seqNo: "asc" },
                        },
                        createdBy: {
                            select: {
                                username: true,
                            },
                        },
                    },
                    orderBy: { seqNo: "asc" },
                },
                createdBy: {
                    select: {
                        username: true,
                    },
                },
            },
            orderBy: { seqNo: "asc" },
        });
        // Transform data to match frontend structure
        const formattedLists = lists.map((list) => ({
            kanbanListId: list.id,
            id: `list-${list.id}`,
            title: list.title,
            fkBoardId: list.boardId,
            seqNo: list.seqNo,
            createdAt: list.createdAt,
            addedBy: list.createdBy?.username || "Unknown",
            kanbanCards: list.cards.map((card) => ({
                kanbanCardId: card.id,
                id: `card-${card.id}`,
                title: card.title,
                desc: card.description,
                imageUrl: card.imageUrl,
                completed: card.completed,
                startDate: card.startDate,
                endDate: card.endDate,
                date: card.startDate && card.endDate
                    ? {
                        startDate: card.startDate,
                        endDate: card.endDate,
                    }
                    : null,
                fkKanbanListId: card.listId,
                seqNo: card.seqNo,
                createdAt: card.createdAt,
                addedBy: card.createdBy?.username || "Unknown",
                kanbanTags: card.tags.map((tag) => ({
                    kanbanTagId: tag.id,
                    id: `tag-${tag.id}`,
                    title: tag.title,
                    color: tag.color,
                    fkKanbanCardId: tag.cardId,
                    seqNo: tag.seqNo,
                    createdAt: tag.createdAt,
                    addedBy: tag.createdBy?.username || "Unknown",
                })),
                kanbanTasks: card.tasks.map((task) => ({
                    kanbanTaskId: task.id,
                    id: `task-${task.id}`,
                    title: task.title,
                    completed: task.completed,
                    imageUrl: task.fileUrl,
                    fkKanbanCardId: task.cardId,
                    seqNo: task.seqNo,
                    createdAt: task.createdAt,
                    addedBy: task.createdBy?.username || "Unknown", // Use optional chaining
                    updatedBy: task.updatedBy?.username || "", // Use optional chaining
                    assignTo: task.assignments
                        .map((a) => a.user?.username || "Unknown") // Use optional chaining
                        .join(" - "),
                })),
            })),
        }));
        return res.json(formattedLists);
    }
    catch (error) {
        console.error("Get kanban list error:", error);
        return res.status(500).json({ error: "Failed to fetch kanban data" });
    }
});
// Add kanban list
router.post("/addkanbanlist", auth_1.authenticateToken, (0, validation_1.validateBody)(addKanbanListSchema), async (req, res) => {
    try {
        const { title, fkboardid, fkpoid, addedby } = req.body;
        const lastList = await database_1.db.kanbanList.findFirst({
            where: { boardId: fkboardid },
            orderBy: { seqNo: "desc" },
        });
        const seqNo = (lastList?.seqNo || 0) + 1;
        const list = await database_1.db.kanbanList.create({
            data: {
                title,
                seqNo,
                board: { connect: { id: fkboardid } }, // relation connect
                createdBy: { connect: { id: req.user.id } }, // relation connect
            },
        });
        // Clear any cached data
        helpers_1.APICache.clear();
        const io = req.app.get("io");
        if (io) {
            io.emitToProject(fkpoid, "ReceiveMessage", `New list "${title}" created by ${addedby ?? req.user.username}`);
        }
        return res.json({ kanbanListId: list.id, seqNo: list.seqNo });
    }
    catch (error) {
        console.error("Add kanban list error:", error);
        return res.status(500).json({ error: "Failed to create list" });
    }
});
// Edit list name
router.post("/editlistname", async (req, res) => {
    try {
        const { title, listid, updatedby, fkboardid, fkpoid } = req.body;
        await database_1.db.kanbanList.update({
            where: { id: listid },
            data: { title },
        });
        // Clear any cached data
        helpers_1.APICache.clear();
        // Emit real-time update
        const io = req.app.get("io");
        if (io) {
            io.emitToProject(fkpoid, "ReceiveMessage", `List renamed to "${title}" by ${updatedby}`);
        }
        return res.json("List name updated successfully");
    }
    catch (error) {
        console.error("Edit list name error:", error);
        return res.status(500).json({ error: "Failed to update list name" });
    }
});
// Add card
router.post("/addcard", auth_1.authenticateToken, (0, validation_1.validateBody)(addCardSchema), async (req, res) => {
    try {
        const { title, fkKanbanListId, fkpoid, addedby } = req.body;
        const lastCard = await database_1.db.kanbanCard.findFirst({
            where: { listId: fkKanbanListId },
            orderBy: { seqNo: "desc" },
        });
        const seqNo = (lastCard?.seqNo || 0) + 1;
        const card = await database_1.db.kanbanCard.create({
            data: {
                title,
                description: title,
                seqNo,
                list: { connect: { id: fkKanbanListId } }, // relation connect
                createdBy: { connect: { id: req.user.id } }, // relation connect
            },
        });
        // Clear any cached data
        helpers_1.APICache.clear();
        const io = req.app.get("io");
        if (io) {
            io.emitToProject(fkpoid, "ReceiveMessage", `New card "${title}" created by ${addedby ?? req.user.username}`);
        }
        return res.json({ kanbanCardId: card.id, seqNo: card.seqNo });
    }
    catch (error) {
        console.error("Add card error:", error);
        return res.status(500).json({ error: "Failed to create card" });
    }
});
// Edit card (now accepts Cloudinary URL)
router.post("/editcard", async (req, res) => {
    try {
        const { title, kanbanCardId, updatedby, desc, completed, startDate, endDate, imageUrl, imagePublicId, fkboardid, fkpoid, } = req.body;
        console.log("📝 Edit card request:", {
            kanbanCardId,
            title,
            imageUrl: imageUrl || "not provided",
            isCloudinaryUrl: imageUrl &&
                (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")),
        });
        const updateData = {
            title,
            description: desc,
        };
        // If imageUrl is provided, update it (Cloudinary URL)
        if (imageUrl) {
            updateData.imageUrl = imageUrl;
            console.log("✅ Updating imageUrl to:", imageUrl);
        }
        if (completed !== undefined) {
            updateData.completed = completed === "true" || completed === true;
        }
        if (startDate) {
            updateData.startDate = new Date(startDate);
        }
        if (endDate) {
            updateData.endDate = new Date(endDate);
        }
        const updatedCard = await database_1.db.kanbanCard.update({
            where: { id: parseInt(kanbanCardId) },
            data: updateData,
        });
        console.log("💾 Card updated in database:", {
            id: updatedCard.id,
            imageUrl: updatedCard.imageUrl,
        });
        // Emit real-time update
        const io = req.app.get("io");
        if (io) {
            io.emitToProject(fkpoid, "ReceiveMessage", `Card "${title}" updated by ${updatedby}`);
        }
        return res.json("Card updated successfully");
    }
    catch (error) {
        console.error("Edit card error:", error);
        return res.status(500).json({ error: "Failed to update card" });
    }
});
// Add tag
router.post("/addTag", async (req, res) => {
    try {
        const { title, color, fkKanbanCardId, addedby, addedbyid } = req.body;
        // Validate required fields
        if (!title || !color || !fkKanbanCardId) {
            return res.status(400).json({
                error: "Missing required fields: title, color, or fkKanbanCardId",
            });
        }
        if (!addedbyid) {
            return res.status(400).json({ error: "User ID (addedbyid) is required" });
        }
        // Verify user exists
        const user = await database_1.db.user.findUnique({
            where: { id: addedbyid },
        });
        if (!user) {
            return res
                .status(404)
                .json({ error: `User with ID ${addedbyid} not found` });
        }
        // Verify card exists
        const card = await database_1.db.kanbanCard.findUnique({
            where: { id: fkKanbanCardId },
        });
        if (!card) {
            return res
                .status(404)
                .json({ error: `Card with ID ${fkKanbanCardId} not found` });
        }
        // Get next sequence number
        const lastTag = await database_1.db.kanbanTag.findFirst({
            where: { cardId: fkKanbanCardId },
            orderBy: { seqNo: "desc" },
        });
        const seqNo = (lastTag?.seqNo || 0) + 1;
        const tag = await database_1.db.kanbanTag.create({
            data: {
                title,
                color,
                cardId: fkKanbanCardId,
                seqNo,
                createdById: addedbyid,
            },
        });
        return res.json(tag.id);
    }
    catch (error) {
        console.error("Add tag error:", error);
        return res.status(500).json({
            error: "Failed to create tag",
            details: error.message,
        });
    }
});
// Delete tag
router.get("/deletetag", async (req, res) => {
    try {
        const { tagid } = req.query;
        await database_1.db.kanbanTag.delete({
            where: { id: parseInt(tagid) },
        });
        return res.json("Tag deleted successfully");
    }
    catch (error) {
        console.error("Delete tag error:", error);
        return res.status(500).json({ error: "Failed to delete tag" });
    }
});
// Get all members - No caching for consistency
router.get("/getmembers", async (req, res) => {
    try {
        const users = await database_1.db.user.findMany({
            where: { isActive: true },
            select: {
                id: true,
                username: true,
                email: true,
                userPic: true,
            },
        });
        const formattedUsers = users.map((user) => ({
            value: user.username,
            label: user.username,
            color: "#0052CC",
            userId: user.id,
        }));
        return res.json(formattedUsers);
    }
    catch (error) {
        console.error("Get members error:", error);
        return res.status(500).json({ error: "Failed to fetch members" });
    }
});
// Add task
router.post("/addtask", auth_1.authenticateToken, (0, validation_1.validateBody)(addTaskSchema), async (req, res) => {
    try {
        const { title, fkKanbanCardId, selectedOptions, fkpoid, addedby } = req.body;
        const lastTask = await database_1.db.kanbanTask.findFirst({
            where: { cardId: fkKanbanCardId },
            orderBy: { seqNo: "desc" },
        });
        const seqNo = (lastTask?.seqNo || 0) + 1;
        const task = await database_1.db.kanbanTask.create({
            data: {
                title,
                seqNo,
                createdById: req.user.id, // <— from JWT
                cardId: fkKanbanCardId,
            },
            select: { id: true },
        });
        if (selectedOptions) {
            const usernames = selectedOptions
                .split(" - ")
                .map((s) => s.trim()) // <-- fix
                .filter(Boolean);
            if (usernames.length) {
                const users = await database_1.db.user.findMany({
                    where: { username: { in: usernames } },
                    select: { id: true },
                });
                if (users.length) {
                    await database_1.db.taskAssignment.createMany({
                        data: users.map((u) => ({ taskId: task.id, userId: u.id })),
                    });
                }
            }
        }
        const io = req.app.get("io");
        if (io) {
            io.emitToProject(fkpoid, "ReceiveMessage", `New task "${title}" created by ${addedby ?? req.user.username}`);
        }
        return res.json(task.id);
    }
    catch (error) {
        console.error("Add task error:", error);
        return res.status(500).json({ error: "Failed to create task" });
    }
});
// Delete task
router.get("/deletetask", async (req, res) => {
    try {
        const { taskid } = req.query;
        await database_1.db.kanbanTask.delete({
            where: { id: parseInt(taskid) },
        });
        return res.json("Task deleted successfully");
    }
    catch (error) {
        console.error("Delete task error:", error);
        return res.status(500).json({ error: "Failed to delete task" });
    }
});
// Submit task - accepts Cloudinary URL for files
router.post("/submittask", async (req, res) => {
    try {
        const { KanbanTaskId, updatedby, completed, fileUrl, fkboardid, fkpoid } = req.body;
        console.log("📝 Submit task request:", {
            KanbanTaskId,
            updatedby,
            completed,
            fileUrl: fileUrl || "no file",
            fkboardid,
            fkpoid,
        });
        if (!KanbanTaskId) {
            return res.status(400).json({ error: "KanbanTaskId is required" });
        }
        const updateData = {};
        // Handle completion status
        if (completed !== undefined) {
            updateData.completed = completed === "true" || completed === true;
        }
        // Handle file URL (Cloudinary URL)
        if (fileUrl) {
            updateData.fileUrl = fileUrl;
            console.log("✅ Updating task fileUrl to:", fileUrl);
        }
        // Find user by username
        if (updatedby) {
            const user = await database_1.db.user.findUnique({
                where: { username: updatedby },
            });
            if (user) {
                updateData.updatedById = user.id;
            }
        }
        const updatedTask = await database_1.db.kanbanTask.update({
            where: { id: parseInt(KanbanTaskId) },
            data: updateData,
        });
        console.log("💾 Task updated in database:", {
            id: updatedTask.id,
            completed: updatedTask.completed,
            fileUrl: updatedTask.fileUrl,
        });
        // Emit real-time update
        const io = req.app.get("io");
        if (io) {
            io.emitToProject(parseInt(fkpoid), "ReceiveMessage", `Task submitted by ${updatedby || "User"}`);
        }
        return res.json({
            message: "Task submitted successfully",
            task: {
                id: updatedTask.id,
                completed: updatedTask.completed,
                fileUrl: updatedTask.fileUrl,
            },
        });
    }
    catch (error) {
        console.error("Submit task error:", error);
        return res.status(500).json({
            error: "Failed to submit task",
            details: error.message,
        });
    }
});
// Handle drag and drop for cards
router.post("/useondragcard", async (req, res) => {
    try {
        const { sourceListId, destinationListId, kanbanCardId, cardTiltle, updatedBy, oldSeqNo, newSeqNo, fkBoardId, fkpoid, } = req.body;
        await database_1.db.$transaction(async (prisma) => {
            if (sourceListId === destinationListId) {
                // Same list - reorder cards
                if (oldSeqNo < newSeqNo) {
                    // Move down - decrement cards between old and new position
                    await prisma.kanbanCard.updateMany({
                        where: {
                            listId: sourceListId,
                            seqNo: {
                                gt: oldSeqNo,
                                lte: newSeqNo,
                            },
                        },
                        data: {
                            seqNo: {
                                decrement: 1,
                            },
                        },
                    });
                }
                else {
                    // Move up - increment cards between new and old position
                    await prisma.kanbanCard.updateMany({
                        where: {
                            listId: sourceListId,
                            seqNo: {
                                gte: newSeqNo,
                                lt: oldSeqNo,
                            },
                        },
                        data: {
                            seqNo: {
                                increment: 1,
                            },
                        },
                    });
                }
                // Update the dragged card
                await prisma.kanbanCard.update({
                    where: { id: kanbanCardId },
                    data: { seqNo: newSeqNo },
                });
            }
            else {
                // Different lists
                // Update source list - decrement all cards after old position
                await prisma.kanbanCard.updateMany({
                    where: {
                        listId: sourceListId,
                        seqNo: {
                            gt: oldSeqNo,
                        },
                    },
                    data: {
                        seqNo: {
                            decrement: 1,
                        },
                    },
                });
                // Update destination list - increment all cards at or after new position
                await prisma.kanbanCard.updateMany({
                    where: {
                        listId: destinationListId,
                        seqNo: {
                            gte: newSeqNo,
                        },
                    },
                    data: {
                        seqNo: {
                            increment: 1,
                        },
                    },
                });
                // Update the dragged card
                await prisma.kanbanCard.update({
                    where: { id: kanbanCardId },
                    data: {
                        listId: destinationListId,
                        seqNo: newSeqNo,
                    },
                });
            }
        });
        // Emit real-time update
        const io = req.app.get("io");
        if (io) {
            io.emitToProject(fkpoid, "ReceiveMessage", `Card "${cardTiltle}" moved by ${updatedBy}`);
        }
        return res.json("Card position updated successfully");
    }
    catch (error) {
        console.error("Drag card error:", error);
        return res.status(500).json({ error: "Failed to update card position" });
    }
});
// Get online users for a project
router.get("/getonlineusers", async (req, res) => {
    try {
        const { fkpoid } = req.query;
        if (!fkpoid) {
            return res.status(400).json({ error: "Project ID required" });
        }
        const io = req.app.get("io");
        const onlineUsers = io ? io.getOnlineUsers(parseInt(fkpoid)) : [];
        return res.json(onlineUsers);
    }
    catch (error) {
        console.error("Get online users error:", error);
        return res.status(500).json({ error: "Failed to get online users" });
    }
});
exports.default = router;
//# sourceMappingURL=kanban.js.map