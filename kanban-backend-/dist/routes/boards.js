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
const createBoardSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(100),
    description: zod_1.z.string().optional(),
    projectId: zod_1.z.number()
});
// Get boards for a project
router.get('/project/:projectId', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { projectId } = req.params;
        // Check project access
        const membership = await database_1.db.projectMember.findFirst({
            where: {
                projectId: parseInt(projectId),
                userId
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        const boards = await database_1.db.board.findMany({
            where: { projectId: parseInt(projectId) },
            include: {
                createdBy: {
                    select: {
                        username: true
                    }
                },
                lists: {
                    select: {
                        id: true,
                        title: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return res.json({ success: true, data: boards });
    }
    catch (error) {
        console.error('Get boards error:', error);
        return res.status(500).json({ error: 'Failed to fetch boards' });
    }
});
// Create new board
router.post('/', auth_1.authenticateToken, (0, validation_1.validateBody)(createBoardSchema), async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, projectId } = req.body;
        // Check project access
        const membership = await database_1.db.projectMember.findFirst({
            where: {
                projectId,
                userId
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied to this project' });
        }
        const board = await database_1.db.board.create({
            data: {
                title,
                description,
                projectId,
                createdById: userId
            },
            include: {
                createdBy: {
                    select: {
                        username: true
                    }
                }
            }
        });
        return res.status(201).json({ success: true, data: board });
    }
    catch (error) {
        console.error('Create board error:', error);
        return res.status(500).json({ error: 'Failed to create board' });
    }
});
exports.default = router;
//# sourceMappingURL=boards.js.map