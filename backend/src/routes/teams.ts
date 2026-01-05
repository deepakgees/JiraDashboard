import express from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../index';
import logger from '../utils/logger';

const router = express.Router();

// Validation middleware
const validateTeam = [
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 })
];

// Get all teams
router.get('/', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        _count: {
          select: {
            members: true
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ teams });
  } catch (error) {
    logger.error('Error fetching teams', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get team by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const teamId = parseInt(id);

    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
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

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({ team });
  } catch (error) {
    logger.error('Error fetching team', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Create new team
router.post('/', validateTeam, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;

    const team = await prisma.team.create({
      data: {
        name,
        description
      }
    });

    logger.info('Team created successfully', { teamId: team.id, teamName: team.name });

    res.status(201).json({
      message: 'Team created successfully',
      team
    });
  } catch (error) {
    logger.error('Error creating team', { error: error.message });
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Update team
router.put('/:id', validateTeam, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const teamId = parseInt(id);

    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    const { name, description } = req.body;

    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!existingTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        name,
        description
      }
    });

    logger.info('Team updated successfully', { teamId: updatedTeam.id });

    res.json({
      message: 'Team updated successfully',
      team: updatedTeam
    });
  } catch (error) {
    logger.error('Error updating team', { error: error.message });
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Delete team
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const teamId = parseInt(id);

    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!existingTeam) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Delete team (cascade will handle related records)
    await prisma.team.delete({
      where: { id: teamId }
    });

    logger.info('Team deleted successfully', { teamId });

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    logger.error('Error deleting team', { error: error.message });
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// Add member to team
router.post('/:id/members', [
  body('userId').isInt(),
  body('role').optional().isIn(['member', 'lead', 'admin'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const teamId = parseInt(id);
    const { userId, role = 'member' } = req.body;

    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }

    // Check if team exists
    const team = await prisma.team.findUnique({
      where: { id: teamId }
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId) }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: parseInt(userId),
          teamId
        }
      }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'User is already a member of this team' });
    }

    const teamMember = await prisma.teamMember.create({
      data: {
        userId: parseInt(userId),
        teamId,
        role
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    logger.info('Team member added successfully', { teamId, userId: parseInt(userId) });

    res.status(201).json({
      message: 'Team member added successfully',
      teamMember
    });
  } catch (error) {
    logger.error('Error adding team member', { error: error.message });
    res.status(500).json({ error: 'Failed to add team member' });
  }
});

// Remove member from team
router.delete('/:id/members/:userId', async (req, res) => {
  try {
    const { id, userId } = req.params;
    const teamId = parseInt(id);
    const memberUserId = parseInt(userId);

    if (isNaN(teamId) || isNaN(memberUserId)) {
      return res.status(400).json({ error: 'Invalid team ID or user ID' });
    }

    // Check if team member exists
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId_teamId: {
          userId: memberUserId,
          teamId
        }
      }
    });

    if (!teamMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Remove team member
    await prisma.teamMember.delete({
      where: {
        userId_teamId: {
          userId: memberUserId,
          teamId
        }
      }
    });

    logger.info('Team member removed successfully', { teamId, userId: memberUserId });

    res.json({ message: 'Team member removed successfully' });
  } catch (error) {
    logger.error('Error removing team member', { error: error.message });
    res.status(500).json({ error: 'Failed to remove team member' });
  }
});

export default router;
