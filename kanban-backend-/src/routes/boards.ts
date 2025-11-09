import express from 'express';
import { z } from 'zod';
import { db } from '../config/database';
import { authenticateToken } from '../middleware/auth';
import { validateBody } from '../middleware/validation';

const router = express.Router();

const createBoardSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  projectId: z.number()
});

// Get boards for a project
router.get('/project/:projectId', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { projectId } = req.params;

    // Check project access
    const membership = await db.projectMember.findFirst({
      where: {
        projectId: parseInt(projectId),
        userId
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    const boards = await db.board.findMany({
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
  } catch (error) {
    console.error('Get boards error:', error);
  return  res.status(500).json({ error: 'Failed to fetch boards' });
  }
});

// Create new board
router.post('/', authenticateToken, validateBody(createBoardSchema), async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { title, description, projectId } = req.body;

    // Check project access
    const membership = await db.projectMember.findFirst({
      where: {
        projectId,
        userId
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied to this project' });
    }

    const board = await db.board.create({
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
  } catch (error) {
    console.error('Create board error:', error);
   return res.status(500).json({ error: 'Failed to create board' });
  }
});

export default router;