"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = express_1.default.Router();
// Get all users
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const users = await database_1.db.user.findMany({
            where: { isActive: true },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                userPic: true,
                createdAt: true
            },
            orderBy: { username: 'asc' }
        });
        return res.json({ success: true, data: users });
    }
    catch (error) {
        console.error('Get users error:', error);
        return res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// Get user by ID
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user = await database_1.db.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                userPic: true,
                createdAt: true
            }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json({ success: true, data: user });
    }
    catch (error) {
        console.error('Get user error:', error);
        return res.status(500).json({ error: 'Failed to fetch user' });
    }
});
// Update user profile
router.put('/profile', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { firstName, lastName, username } = req.body;
        // Check if username is taken (if being changed)
        if (username) {
            const existingUser = await database_1.db.user.findFirst({
                where: {
                    username,
                    id: { not: userId }
                }
            });
            if (existingUser) {
                return res.status(400).json({ error: 'Username already taken' });
            }
        }
        const user = await database_1.db.user.update({
            where: { id: userId },
            data: {
                firstName,
                lastName,
                username
            },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                userPic: true
            }
        });
        return res.json({ success: true, data: user });
    }
    catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ error: 'Failed to update profile' });
    }
});
// Upload user profile picture
router.post('/upload-avatar', auth_1.authenticateToken, upload_1.upload.single('avatar'), async (req, res) => {
    try {
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        // Create user-specific directory
        const userDir = path_1.default.join('uploads', 'EmployeeUploads', userId.toString());
        if (!fs_1.default.existsSync(userDir)) {
            fs_1.default.mkdirSync(userDir, { recursive: true });
        }
        // Move file to user-specific directory
        const newPath = path_1.default.join(userDir, req.file.filename);
        fs_1.default.renameSync(req.file.path, newPath);
        // Update user record
        const user = await database_1.db.user.update({
            where: { id: userId },
            data: { userPic: req.file.filename },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                userPic: true
            }
        });
        return res.json({ success: true, data: user });
    }
    catch (error) {
        console.error('Upload avatar error:', error);
        return res.status(500).json({ error: 'Failed to upload avatar' });
    }
});
exports.default = router;
//# sourceMappingURL=users.js.map