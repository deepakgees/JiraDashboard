import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { prisma } from '../index';
import logger from '../utils/logger';
import { ImportService } from '../services/importService';
import { JiraService, createAuthToken, validateJiraConfig, JiraConfig } from '../services/jiraService';

const router = express.Router();

// Lazy initialization of importService to ensure prisma is available
let importServiceInstance: ImportService | null = null;
const getImportService = (): ImportService => {
  if (!prisma) {
    throw new Error('Prisma client is not initialized');
  }
  if (!importServiceInstance) {
    importServiceInstance = new ImportService(prisma);
  }
  return importServiceInstance;
};

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
 * GET /api/import/configs
 * Get all import configurations
 */
router.get('/configs', async (req, res) => {
  try {
    const importService = getImportService();
    const configs = await importService.getAllImportConfigs();
    
    logger.info('Import configurations retrieved', {
      count: configs.length,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      data: configs
    });
  } catch (error: any) {
    logger.error('Failed to get import configurations', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve import configurations'
    });
  }
});

/**
 * GET /api/import/configs/:teamName/:projectKey
 * Get specific import configuration
 */
router.get('/configs/:teamName/:projectKey', [
  param('teamName').notEmpty().withMessage('Team name is required'),
  param('projectKey').notEmpty().withMessage('Project key is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { teamName, projectKey } = req.params;
    const importService = getImportService();
    const config = await importService.getImportConfig(teamName, projectKey);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        error: 'Import configuration not found'
      });
    }

    logger.info('Import configuration retrieved', {
      teamName,
      projectKey,
      configId: config.id
    });

    res.json({
      success: true,
      data: config
    });
  } catch (error: any) {
    logger.error('Failed to get import configuration', {
      error: error.message,
      teamName: req.params.teamName,
      projectKey: req.params.projectKey
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve import configuration'
    });
  }
});

/**
 * POST /api/import/configs
 * Create or update import configuration
 */
router.post('/configs', [
  body('teamName').notEmpty().withMessage('Team name is required'),
  body('projectKey').notEmpty().withMessage('Project key is required'),
  body('jiraBaseUrl').isURL().withMessage('Valid Jira base URL is required'),
  body('importStartDate').isISO8601().withMessage('Valid import start date is required'),
  body('authType').optional().isIn(['api', 'cookie']).withMessage('Auth type must be either "api" or "cookie"'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  handleValidationErrors
], async (req, res) => {
  try {
    logger.info('POST /api/import/configs request received', {
      body: req.body,
      userAgent: req.get('User-Agent')
    });
    
    const { teamName, projectKey, jiraBaseUrl, importStartDate, authType, authToken, cookies, isActive } = req.body;
    const importService = getImportService();
    const config = await importService.saveImportConfig({
      teamName,
      projectKey,
      jiraBaseUrl,
      importStartDate: new Date(importStartDate),
      authType: authType || 'api',
      authToken,
      cookies,
      isActive
    });

    logger.info('Import configuration saved', {
      teamName,
      projectKey,
      configId: config.id,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      success: true,
      data: config
    });
  } catch (error: any) {
    logger.error('Failed to save import configuration', {
      error: error.message,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Failed to save import configuration'
    });
  }
});

/**
 * POST /api/import/test-connection
 * Test Jira connection (supports both API key and cookie authentication)
 */
router.post('/test-connection', [
  body('jiraBaseUrl').isURL().withMessage('Valid Jira base URL is required'),
  body('authType').isIn(['api', 'cookie']).withMessage('Auth type must be either "api" or "cookie"'),
  // Conditional validation based on auth type
  body().custom((value, { req }) => {
    if (req.body.authType === 'api') {
      if (!req.body.email || !req.body.apiToken) {
        throw new Error('Email and API token are required for API authentication');
      }
    } else if (req.body.authType === 'cookie') {
      if (!req.body.cookies) {
        throw new Error('Cookies are required for cookie authentication');
      }
    }
    return true;
  }),
  handleValidationErrors
], async (req, res) => {
  try {
    logger.info('POST /api/import/test-connection request received', {
      body: req.body,
      userAgent: req.get('User-Agent')
    });
    
    const { jiraBaseUrl, authType, email, apiToken, cookies } = req.body;
    
    let jiraConfig: JiraConfig;
    
    if (authType === 'api') {
      const authToken = createAuthToken(email, apiToken);
      jiraConfig = {
        baseUrl: jiraBaseUrl,
        authToken,
        authType: 'api',
        projectKey: 'TEST', // Dummy project key for connection test
        teamName: 'TEST', // Dummy team name for connection test
        importStartDate: '2024-01-01' // Dummy date for connection test
      };
    } else {
      jiraConfig = {
        baseUrl: jiraBaseUrl,
        cookies,
        authType: 'cookie',
        projectKey: 'TEST', // Dummy project key for connection test
        teamName: 'TEST', // Dummy team name for connection test
        importStartDate: '2024-01-01' // Dummy date for connection test
      };
    }

    const jiraService = new JiraService(jiraConfig);
    const result = await jiraService.testConnection();

    logger.info('Jira connection test', {
      jiraBaseUrl,
      authType,
      success: result.success,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      connected: result.success,
      message: result.message,
      user: result.user
    });
  } catch (error: any) {
    logger.error('Jira connection test failed', {
      error: error.message,
      jiraBaseUrl: req.body.jiraBaseUrl,
      authType: req.body.authType
    });

    res.status(500).json({
      success: false,
      connected: false,
      error: 'Connection test failed'
    });
  }
});

/**
 * POST /api/import/start
 * Start data import from Jira
 */
router.post('/start', [
  body('teamName').notEmpty().withMessage('Team name is required'),
  body('projectKey').notEmpty().withMessage('Project key is required'),
  body('jiraBaseUrl').isURL().withMessage('Valid Jira base URL is required'),
  body('importStartDate').isISO8601().withMessage('Valid import start date is required'),
  body('importType').optional().isIn(['epic', 'issue', 'full']).withMessage('Import type must be epic, issue, or full'),
  // Conditional validation based on auth type
  body().custom((value, { req }) => {
    if (req.body.authType === 'api') {
      if (!req.body.email || !req.body.apiToken) {
        throw new Error('Email and API token are required for API authentication');
      }
    } else if (req.body.authType === 'cookie') {
      if (!req.body.cookies) {
        throw new Error('Cookies are required for cookie authentication');
      }
    } else {
      // Default to API auth for backward compatibility
      if (!req.body.email || !req.body.apiToken) {
        throw new Error('Email and API token are required for API authentication');
      }
    }
    return true;
  }),
  handleValidationErrors
], async (req, res) => {
  try {
    const { teamName, projectKey, jiraBaseUrl, email, apiToken, cookies, importStartDate, importType = 'full', authType = 'api' } = req.body;
    
    let jiraConfig: JiraConfig;
    
    if (authType === 'api') {
      const authToken = createAuthToken(email, apiToken);
      jiraConfig = {
        baseUrl: jiraBaseUrl,
        authToken,
        authType: 'api',
        projectKey,
        teamName,
        importStartDate: importStartDate.split('T')[0] // Convert to YYYY-MM-DD format
      };
    } else {
      jiraConfig = {
        baseUrl: jiraBaseUrl,
        cookies,
        authType: 'cookie',
        projectKey,
        teamName,
        importStartDate: importStartDate.split('T')[0] // Convert to YYYY-MM-DD format
      };
    }

    const validationErrors = validateJiraConfig(jiraConfig);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration',
        details: validationErrors
      });
    }

    // Save configuration
    const importService = getImportService();
    await importService.saveImportConfig({
      teamName,
      projectKey,
      jiraBaseUrl,
      importStartDate: new Date(importStartDate),
      authType: authType,
      authToken: authType === 'api' ? jiraConfig.authToken : undefined,
      cookies: authType === 'cookie' ? jiraConfig.cookies : undefined,
      isActive: true
    });

    // Start import process
    const result = await importService.performImport(jiraConfig, importType);

    logger.info('Data import completed', {
      teamName,
      projectKey,
      importType,
      success: result.success,
      epicsProcessed: result.epicsProcessed,
      issuesProcessed: result.issuesProcessed,
      errorsCount: result.errors.length,
      importLogId: result.importLogId,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: result.success,
      data: {
        importLogId: result.importLogId,
        epicsProcessed: result.epicsProcessed,
        issuesProcessed: result.issuesProcessed,
        errors: result.errors
      }
    });
  } catch (error: any) {
    logger.error('Data import failed', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });

    res.status(500).json({
      success: false,
      error: 'Import process failed'
    });
  }
});

/**
 * GET /api/import/history
 * Get import history
 */
router.get('/history', [
  query('teamName').optional().notEmpty().withMessage('Team name cannot be empty'),
  query('projectKey').optional().notEmpty().withMessage('Project key cannot be empty'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { teamName, projectKey, limit = 50 } = req.query;
    const importService = getImportService();
    const history = await importService.getImportHistory(
      teamName as string,
      projectKey as string,
      parseInt(limit as string)
    );

    logger.info('Import history retrieved', {
      teamName,
      projectKey,
      limit,
      count: history.length
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error: any) {
    logger.error('Failed to get import history', {
      error: error.message,
      query: req.query
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve import history'
    });
  }
});

/**
 * GET /api/import/epics
 * Get imported epic data
 */
router.get('/epics', [
  query('teamName').optional().notEmpty().withMessage('Team name cannot be empty'),
  query('projectKey').optional().notEmpty().withMessage('Project key cannot be empty'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { teamName, projectKey } = req.query;
    const importService = getImportService();
    const epics = await importService.getImportedEpics(
      teamName as string,
      projectKey as string
    );

    logger.info('Imported epics retrieved', {
      teamName,
      projectKey,
      count: epics.length
    });

    res.json({
      success: true,
      data: epics
    });
  } catch (error: any) {
    logger.error('Failed to get imported epics', {
      error: error.message,
      query: req.query
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve imported epics'
    });
  }
});

/**
 * GET /api/import/issues
 * Get imported issue data
 */
router.get('/issues', [
  query('teamName').optional().notEmpty().withMessage('Team name cannot be empty'),
  query('projectKey').optional().notEmpty().withMessage('Project key cannot be empty'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { teamName, projectKey } = req.query;
    const importService = getImportService();
    const issues = await importService.getImportedIssues(
      teamName as string,
      projectKey as string
    );

    logger.info('Imported issues retrieved', {
      teamName,
      projectKey,
      count: issues.length
    });

    res.json({
      success: true,
      data: issues
    });
  } catch (error: any) {
    logger.error('Failed to get imported issues', {
      error: error.message,
      query: req.query
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve imported issues'
    });
  }
});

/**
 * GET /api/import/status/:importLogId
 * Get import status by log ID
 */
router.get('/status/:importLogId', [
  param('importLogId').isInt({ min: 1 }).withMessage('Valid import log ID is required'),
  handleValidationErrors
], async (req, res) => {
  try {
    const { importLogId } = req.params;
    
    const log = await prisma.importLog.findUnique({
      where: { id: parseInt(importLogId) }
    });

    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Import log not found'
      });
    }

    logger.info('Import status retrieved', {
      importLogId,
      status: log.status
    });

    res.json({
      success: true,
      data: log
    });
  } catch (error: any) {
    logger.error('Failed to get import status', {
      error: error.message,
      importLogId: req.params.importLogId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to retrieve import status'
    });
  }
});

export default router;
