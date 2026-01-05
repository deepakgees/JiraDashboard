import express from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import logger from '../utils/logger';

const router = express.Router();

// Validation middleware
const validateProject = [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('key').trim().isLength({ min: 2, max: 10 }).matches(/^[A-Z]+$/),
  body('description').optional().trim().isLength({ max: 500 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601()
];

// Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        _count: {
          select: {
            issues: true,
            sprints: true,
            members: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ projects });
  } catch (error) {
    logger.error('Error fetching projects', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        issues: {
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
            }
          },
          orderBy: {
            updatedAt: 'desc'
          }
        },
        sprints: {
          orderBy: {
            startDate: 'desc'
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    logger.error('Error fetching project', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new project
router.post('/', validateProject, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, key, description, startDate, endDate } = req.body;

    // Check if project key already exists
    const existingProject = await prisma.project.findUnique({
      where: { key }
    });

    if (existingProject) {
      return res.status(400).json({ error: 'Project key already exists' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        key,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      }
    });

    logger.info('Project created successfully', { projectId: project.id, projectKey: project.key });

    res.status(201).json({
      message: 'Project created successfully',
      project
    });
  } catch (error) {
    logger.error('Error creating project', { error: error.message });
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', validateProject, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const { name, key, description, startDate, endDate, status } = req.body;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check if project key already exists (if changing)
    if (key !== existingProject.key) {
      const keyExists = await prisma.project.findUnique({
        where: { key }
      });

      if (keyExists) {
        return res.status(400).json({ error: 'Project key already exists' });
      }
    }

    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: {
        name,
        key,
        description,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status
      }
    });

    logger.info('Project updated successfully', { projectId: updatedProject.id });

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    logger.error('Error updating project', { error: error.message });
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Delete project
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const projectId = parseInt(id);

    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Delete project (cascade will handle related records)
    await prisma.project.delete({
      where: { id: projectId }
    });

    logger.info('Project deleted successfully', { projectId });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    logger.error('Error deleting project', { error: error.message });
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;
