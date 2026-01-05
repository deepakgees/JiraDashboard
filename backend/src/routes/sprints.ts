import express from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import logger from '../utils/logger';

const router = express.Router();

// Validation middleware
const validateSprint = [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('goal').optional().trim().isLength({ max: 500 }),
  body('startDate').isISO8601(),
  body('endDate').isISO8601(),
  body('projectId').isInt()
];

// Get all sprints
router.get('/', async (req, res) => {
  try {
    const { projectId, status } = req.query;

    const where: any = {};
    if (projectId) where.projectId = parseInt(projectId as string);
    if (status) where.status = status;

    const sprints = await prisma.sprint.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true
          }
        },
        _count: {
          select: {
            issues: true
          }
        }
      },
      orderBy: {
        startDate: 'desc'
      }
    });

    res.json({ sprints });
  } catch (error) {
    logger.error('Error fetching sprints', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch sprints' });
  }
});

// Get sprint by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sprintId = parseInt(id);

    if (isNaN(sprintId)) {
      return res.status(400).json({ error: 'Invalid sprint ID' });
    }

    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true
          }
        },
        issues: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!sprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    res.json({ sprint });
  } catch (error) {
    logger.error('Error fetching sprint', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch sprint' });
  }
});

// Create new sprint
router.post('/', validateSprint, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, goal, startDate, endDate, projectId } = req.body;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: parseInt(projectId) }
    });

    if (!project) {
      return res.status(400).json({ error: 'Project not found' });
    }

    const sprint = await prisma.sprint.create({
      data: {
        name,
        goal,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        projectId: parseInt(projectId)
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            key: true
          }
        }
      }
    });

    logger.info('Sprint created successfully', { sprintId: sprint.id, sprintName: sprint.name });

    res.status(201).json({
      message: 'Sprint created successfully',
      sprint
    });
  } catch (error) {
    logger.error('Error creating sprint', { error: error.message });
    res.status(500).json({ error: 'Failed to create sprint' });
  }
});

// Update sprint
router.put('/:id', validateSprint, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const sprintId = parseInt(id);

    if (isNaN(sprintId)) {
      return res.status(400).json({ error: 'Invalid sprint ID' });
    }

    const { name, goal, startDate, endDate, projectId, status } = req.body;

    // Check if sprint exists
    const existingSprint = await prisma.sprint.findUnique({
      where: { id: sprintId }
    });

    if (!existingSprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    const updatedSprint = await prisma.sprint.update({
      where: { id: sprintId },
      data: {
        name,
        goal,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        projectId: parseInt(projectId),
        status
      }
    });

    logger.info('Sprint updated successfully', { sprintId: updatedSprint.id });

    res.json({
      message: 'Sprint updated successfully',
      sprint: updatedSprint
    });
  } catch (error) {
    logger.error('Error updating sprint', { error: error.message });
    res.status(500).json({ error: 'Failed to update sprint' });
  }
});

// Delete sprint
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const sprintId = parseInt(id);

    if (isNaN(sprintId)) {
      return res.status(400).json({ error: 'Invalid sprint ID' });
    }

    // Check if sprint exists
    const existingSprint = await prisma.sprint.findUnique({
      where: { id: sprintId }
    });

    if (!existingSprint) {
      return res.status(404).json({ error: 'Sprint not found' });
    }

    // Delete sprint (cascade will handle related records)
    await prisma.sprint.delete({
      where: { id: sprintId }
    });

    logger.info('Sprint deleted successfully', { sprintId });

    res.json({ message: 'Sprint deleted successfully' });
  } catch (error) {
    logger.error('Error deleting sprint', { error: error.message });
    res.status(500).json({ error: 'Failed to delete sprint' });
  }
});

export default router;
