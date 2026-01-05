import express from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import logger from '../utils/logger';

const router = express.Router();

// Validation middleware
const validateUser = [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('role').optional().isIn(['user', 'manager', 'admin'])
];

// Get all users
router.get('/', async (req, res) => {
  try {
    const { role, isActive } = req.query;

    const where: any = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedIssues: true,
            createdIssues: true,
            teamMembers: true,
            projectMembers: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ users });
  } catch (error) {
    logger.error('Error fetching users', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        assignedIssues: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                key: true
              }
            }
          }
        },
        createdIssues: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                key: true
              }
            }
          }
        },
        teamMembers: {
          include: {
            team: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        },
        projectMembers: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                key: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Error fetching user', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user
router.put('/:id', validateUser, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const { name, email, role, avatar, isActive } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email already exists (if changing)
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        role,
        avatar,
        isActive
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    logger.info('User updated successfully', { userId: updatedUser.id });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Error updating user', { error: error.message });
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has assigned issues
    const assignedIssues = await prisma.issue.count({
      where: { assigneeId: userId }
    });

    if (assignedIssues > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete user with assigned issues. Please reassign or close the issues first.' 
      });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    logger.info('User deleted successfully', { userId });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user', { error: error.message });
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user statistics
    const [
      totalAssignedIssues,
      totalCreatedIssues,
      issuesByStatus,
      issuesByType,
      issuesByPriority
    ] = await Promise.all([
      prisma.issue.count({
        where: { assigneeId: userId }
      }),
      prisma.issue.count({
        where: { reporterId: userId }
      }),
      prisma.issue.groupBy({
        by: ['status'],
        where: { assigneeId: userId },
        _count: {
          status: true
        }
      }),
      prisma.issue.groupBy({
        by: ['type'],
        where: { assigneeId: userId },
        _count: {
          type: true
        }
      }),
      prisma.issue.groupBy({
        by: ['priority'],
        where: { assigneeId: userId },
        _count: {
          priority: true
        }
      })
    ]);

    const stats = {
      totalAssignedIssues,
      totalCreatedIssues,
      issuesByStatus,
      issuesByType,
      issuesByPriority
    };

    res.json({ stats });
  } catch (error) {
    logger.error('Error fetching user stats', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

export default router;
