import express from 'express';
import { query, param, validationResult } from 'express-validator';
import { prisma } from '../index';
import logger from '../utils/logger';
import { ConfigService } from '../services/configService';

const router = express.Router();
const configService = new ConfigService(prisma);

// Validation middleware
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * GET /api/config/teams
 * Get all team configurations
 */
router.get('/teams', async (req, res) => {
  try {
    const teams = await configService.getTeamConfigs();
    
    logger.info('Team configurations retrieved', {
      count: teams.length,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: teams
    });
  } catch (error: any) {
    logger.error('Failed to get team configurations', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve team configurations'
    });
  }
});

/**
 * GET /api/config/teams/:teamName
 * Get specific team configuration
 */
router.get('/teams/:teamName', [
  param('teamName').notEmpty().withMessage('Team name is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { teamName } = req.params;
    
    const team = await configService.getTeamConfig(teamName);
    
    if (!team) {
      return res.status(404).json({
        success: false,
        error: 'Team configuration not found'
      });
    }

    logger.info('Team configuration retrieved', {
      teamName,
      teamId: team.id
    });

    res.json({
      success: true,
      data: team
    });
  } catch (error: any) {
    logger.error('Failed to get team configuration', {
      error: error.message,
      teamName: req.params.teamName
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve team configuration'
    });
  }
});

/**
 * GET /api/config/team-names
 * Get available team names
 */
router.get('/team-names', async (req, res) => {
  try {
    const teamNames = await configService.getAvailableTeamNames();
    
    logger.info('Available team names retrieved', {
      count: teamNames.length,
      teams: teamNames
    });

    res.json({
      success: true,
      data: teamNames
    });
  } catch (error: any) {
    logger.error('Failed to get available team names', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve available team names'
    });
  }
});

/**
 * GET /api/config/project-keys
 * Get available project keys
 */
router.get('/project-keys', async (req, res) => {
  try {
    const projectKeys = await configService.getAvailableProjectKeys();
    
    logger.info('Available project keys retrieved', {
      count: projectKeys.length,
      projects: projectKeys
    });

    res.json({
      success: true,
      data: projectKeys
    });
  } catch (error: any) {
    logger.error('Failed to get available project keys', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve available project keys'
    });
  }
});

/**
 * GET /api/config/statistics
 * Get import statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const statistics = await configService.getImportStatistics();
    
    logger.info('Import statistics retrieved', {
      totalImports: statistics.totalImports,
      activeTeams: statistics.activeTeams
    });

    res.json({
      success: true,
      data: statistics
    });
  } catch (error: any) {
    logger.error('Failed to get import statistics', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve import statistics'
    });
  }
});

/**
 * GET /api/config/statistics/:teamName
 * Get team-specific statistics
 */
router.get('/statistics/:teamName', [
  param('teamName').notEmpty().withMessage('Team name is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { teamName } = req.params;
    
    const statistics = await configService.getTeamStatistics(teamName);
    
    logger.info('Team statistics retrieved', {
      teamName,
      totalImports: statistics.totalImports,
      totalEpics: statistics.totalEpics,
      totalIssues: statistics.totalIssues
    });

    res.json({
      success: true,
      data: statistics
    });
  } catch (error: any) {
    logger.error('Failed to get team statistics', {
      error: error.message,
      teamName: req.params.teamName
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve team statistics'
    });
  }
});

/**
 * GET /api/config/recent-activity
 * Get recent import activity
 */
router.get('/recent-activity', [
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const activity = await configService.getRecentImportActivity(parseInt(limit as string));
    
    logger.info('Recent import activity retrieved', {
      count: activity.length,
      limit
    });

    res.json({
      success: true,
      data: activity
    });
  } catch (error: any) {
    logger.error('Failed to get recent import activity', {
      error: error.message,
      query: req.query
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve recent import activity'
    });
  }
});

/**
 * GET /api/config/summary
 * Get configuration summary for dashboard
 */
router.get('/summary', async (req, res) => {
  try {
    const summary = await configService.getConfigurationSummary();
    
    logger.info('Configuration summary retrieved', {
      totalTeams: summary.totalTeams,
      activeConfigurations: summary.activeConfigurations
    });

    res.json({
      success: true,
      data: summary
    });
  } catch (error: any) {
    logger.error('Failed to get configuration summary', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve configuration summary'
    });
  }
});

/**
 * GET /api/config/import-settings
 * Get default import settings
 */
router.get('/import-settings', async (req, res) => {
  try {
    const settings = configService.getDefaultImportSettings();
    
    logger.info('Import settings retrieved');

    res.json({
      success: true,
      data: settings
    });
  } catch (error: any) {
    logger.error('Failed to get import settings', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve import settings'
    });
  }
});

export default router;
