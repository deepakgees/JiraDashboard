import express from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import logger from '../utils/logger';

const router = express.Router();

// Validation middleware
const validateIssue = [
  body('summary').trim().isLength({ min: 5, max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('type').isIn(['bug', 'feature', 'task', 'story', 'epic']),
  body('priority').isIn(['low', 'medium', 'high', 'critical']),
  body('status').isIn(['to-do', 'in-progress', 'in-review', 'done']),
  body('storyPoints').optional().isInt({ min: 1, max: 100 }),
  body('assigneeId').optional().isInt(),
  body('projectId').isInt(),
  body('sprintId').optional().isInt()
];

// Get all issues with filters
router.get('/', async (req, res) => {
  try {
    const { 
      projectId, 
      assigneeId, 
      status, 
      type, 
      priority,
      page = '1',
      limit = '50'
    } = req.query;

    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (projectId) where.projectId = parseInt(projectId as string);
    if (assigneeId) where.assigneeId = parseInt(assigneeId as string);
    if (status) where.status = status;
    if (type) where.type = type;
    if (priority) where.priority = priority;

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          reporter: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          project: {
            select: {
              id: true,
              name: true,
              key: true
            }
          },
          sprint: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip,
        take: limitNum
      }),
      prisma.issue.count({ where })
    ]);

    res.json({
      issues,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching issues', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// Get issue by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const issueId = parseInt(id);

    if (isNaN(issueId)) {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        reporter: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            key: true
          }
        },
        sprint: {
          select: {
            id: true,
            name: true
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        },
        attachments: {
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    res.json({ issue });
  } catch (error) {
    logger.error('Error fetching issue', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
});

// Create new issue
router.post('/', validateIssue, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      summary,
      description,
      type,
      priority,
      status,
      storyPoints,
      assigneeId,
      projectId,
      sprintId
    } = req.body;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return res.status(400).json({ error: 'Project not found' });
    }

    // Check if assignee exists (if provided)
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId }
      });

      if (!assignee) {
        return res.status(400).json({ error: 'Assignee not found' });
      }
    }

    // Check if sprint exists (if provided)
    if (sprintId) {
      const sprint = await prisma.sprint.findUnique({
        where: { id: sprintId }
      });

      if (!sprint) {
        return res.status(400).json({ error: 'Sprint not found' });
      }
    }

    // Generate issue key
    const projectKey = project.key;
    const issueCount = await prisma.issue.count({
      where: { projectId }
    });
    const issueKey = `${projectKey}-${issueCount + 1}`;

    const issue = await prisma.issue.create({
      data: {
        key: issueKey,
        summary,
        description,
        type,
        priority,
        status,
        storyPoints: storyPoints ? parseInt(storyPoints) : null,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        projectId: parseInt(projectId),
        sprintId: sprintId ? parseInt(sprintId) : null,
        reporterId: 1 // TODO: Get from JWT token
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            key: true
          }
        }
      }
    });

    logger.info('Issue created successfully', { issueId: issue.id, issueKey: issue.key });

    res.status(201).json({
      message: 'Issue created successfully',
      issue
    });
  } catch (error) {
    logger.error('Error creating issue', { error: error.message });
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// Update issue
router.put('/:id', validateIssue, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const issueId = parseInt(id);

    if (isNaN(issueId)) {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }

    const {
      summary,
      description,
      type,
      priority,
      status,
      storyPoints,
      assigneeId,
      projectId,
      sprintId
    } = req.body;

    // Check if issue exists
    const existingIssue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!existingIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const updatedIssue = await prisma.issue.update({
      where: { id: issueId },
      data: {
        summary,
        description,
        type,
        priority,
        status,
        storyPoints: storyPoints ? parseInt(storyPoints) : null,
        assigneeId: assigneeId ? parseInt(assigneeId) : null,
        projectId: parseInt(projectId),
        sprintId: sprintId ? parseInt(sprintId) : null
      },
      include: {
        assignee: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            key: true
          }
        }
      }
    });

    logger.info('Issue updated successfully', { issueId: updatedIssue.id });

    res.json({
      message: 'Issue updated successfully',
      issue: updatedIssue
    });
  } catch (error) {
    logger.error('Error updating issue', { error: error.message });
    res.status(500).json({ error: 'Failed to update issue' });
  }
});

// Delete issue
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const issueId = parseInt(id);

    if (isNaN(issueId)) {
      return res.status(400).json({ error: 'Invalid issue ID' });
    }

    // Check if issue exists
    const existingIssue = await prisma.issue.findUnique({
      where: { id: issueId }
    });

    if (!existingIssue) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Delete issue (cascade will handle related records)
    await prisma.issue.delete({
      where: { id: issueId }
    });

    logger.info('Issue deleted successfully', { issueId });

    res.json({ message: 'Issue deleted successfully' });
  } catch (error) {
    logger.error('Error deleting issue', { error: error.message });
    res.status(500).json({ error: 'Failed to delete issue' });
  }
});

export default router;
