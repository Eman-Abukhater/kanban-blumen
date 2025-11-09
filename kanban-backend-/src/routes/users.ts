import express from 'express';
import { db } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { upload } from '../middleware/upload';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Get all users
router.get('/', authenticateToken, async (req, res) => {
  try {
    const users = await db.user.findMany({
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
  } catch (error) {
    console.error('Get users error:', error);
   return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await db.user.findUnique({
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
  } catch (error) {
    console.error('Get user error:', error);
   return res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { firstName, lastName, username } = req.body;

    // Check if username is taken (if being changed)
    if (username) {
      const existingUser = await db.user.findFirst({
        where: {
          username,
          id: { not: userId }
        }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken' });
      }
    }

    const user = await db.user.update({
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
  } catch (error) {
    console.error('Update profile error:', error);
   return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Upload user profile picture
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    const userId = (req as any).user.id;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Create user-specific directory
    const userDir = path.join('uploads', 'EmployeeUploads', userId.toString());
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    // Move file to user-specific directory
    const newPath = path.join(userDir, req.file.filename);
    fs.renameSync(req.file.path, newPath);

    // Update user record
    const user = await db.user.update({
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
  } catch (error) {
    console.error('Upload avatar error:', error);
     return res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

export default router;