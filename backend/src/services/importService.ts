import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { JiraService, JiraEpicData, JiraIssueData, JiraConfig } from './jiraService';

export interface ImportResult {
  success: boolean;
  epicsProcessed: number;
  issuesProcessed: number;
  errors: string[];
  importLogId: number;
}

export interface ImportConfig {
  id?: number;
  teamName: string;
  projectKey: string;
  jiraBaseUrl: string;
  importStartDate: Date;
  authType?: string;
  authToken?: string;
  cookies?: string;
  isActive?: boolean;
}

export class ImportService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Create or update import configuration
   */
  async saveImportConfig(config: ImportConfig): Promise<ImportConfig> {
    try {
      const savedConfig = await this.prisma.importConfig.upsert({
        where: {
          teamName_projectKey: {
            teamName: config.teamName,
            projectKey: config.projectKey
          }
        },
        update: {
          jiraBaseUrl: config.jiraBaseUrl,
          importStartDate: config.importStartDate,
          authType: config.authType || 'api',
          authToken: config.authToken,
          cookies: config.cookies,
          isActive: config.isActive ?? true,
          updatedAt: new Date()
        },
        create: {
          teamName: config.teamName,
          projectKey: config.projectKey,
          jiraBaseUrl: config.jiraBaseUrl,
          importStartDate: config.importStartDate,
          authType: config.authType || 'api',
          authToken: config.authToken,
          cookies: config.cookies,
          isActive: config.isActive ?? true
        }
      });

      logger.info('Import configuration saved', {
        teamName: config.teamName,
        projectKey: config.projectKey,
        configId: savedConfig.id
      });

      return savedConfig;
    } catch (error: any) {
      logger.error('Failed to save import configuration', {
        error: error.message,
        teamName: config.teamName,
        projectKey: config.projectKey
      });
      throw error;
    }
  }

  /**
   * Get import configuration by team and project
   */
  async getImportConfig(teamName: string, projectKey: string): Promise<ImportConfig | null> {
    try {
      const config = await this.prisma.importConfig.findUnique({
        where: {
          teamName_projectKey: {
            teamName,
            projectKey
          }
        }
      });

      return config;
    } catch (error: any) {
      logger.error('Failed to get import configuration', {
        error: error.message,
        teamName,
        projectKey
      });
      throw error;
    }
  }

  /**
   * Get all import configurations
   */
  async getAllImportConfigs(): Promise<ImportConfig[]> {
    try {
      const configs = await this.prisma.importConfig.findMany({
        orderBy: [
          { teamName: 'asc' },
          { projectKey: 'asc' }
        ]
      });

      return configs;
    } catch (error: any) {
      logger.error('Failed to get all import configurations', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create import log entry
   */
  private async createImportLog(
    teamName: string,
    projectKey: string,
    importType: string,
    status: string = 'started'
  ): Promise<number> {
    try {
      const log = await this.prisma.importLog.create({
        data: {
          teamName,
          projectKey,
          importType,
          status,
          startTime: new Date()
        }
      });

      logger.info('Import log created', {
        logId: log.id,
        teamName,
        projectKey,
        importType,
        status
      });

      return log.id;
    } catch (error: any) {
      logger.error('Failed to create import log', {
        error: error.message,
        teamName,
        projectKey,
        importType
      });
      throw error;
    }
  }

  /**
   * Update import log entry
   */
  private async updateImportLog(
    logId: number,
    status: string,
    recordsProcessed: number = 0,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.prisma.importLog.update({
        where: { id: logId },
        data: {
          status,
          endTime: new Date(),
          recordsProcessed,
          errorMessage
        }
      });

      logger.info('Import log updated', {
        logId,
        status,
        recordsProcessed,
        hasError: !!errorMessage
      });
    } catch (error: any) {
      logger.error('Failed to update import log', {
        error: error.message,
        logId,
        status
      });
    }
  }

  /**
   * Import epic data to database
   */
  private async importEpicData(epics: JiraEpicData[], teamName: string, projectKey: string): Promise<number> {
    let processedCount = 0;

    for (const epic of epics) {
      try {
        await this.prisma.jiraEpic.upsert({
          where: { jiraKey: epic.key },
          update: {
            summary: epic.summary,
            status: epic.status,
            dueDate: epic.dueDate ? new Date(epic.dueDate) : null,
            priority: epic.priority,
            fixVersions: epic.fixVersions ? epic.fixVersions.join(', ') : null,
            roughEstimate: epic.roughEstimate,
            originalEstimate: epic.originalEstimate,
            remainingEstimate: epic.remainingEstimate,
            teamName,
            projectKey,
            lastImported: new Date(),
            updatedAt: new Date()
          },
          create: {
            jiraKey: epic.key,
            summary: epic.summary,
            status: epic.status,
            dueDate: epic.dueDate ? new Date(epic.dueDate) : null,
            priority: epic.priority,
            fixVersions: epic.fixVersions ? epic.fixVersions.join(', ') : null,
            roughEstimate: epic.roughEstimate,
            originalEstimate: epic.originalEstimate,
            remainingEstimate: epic.remainingEstimate,
            teamName,
            projectKey,
            lastImported: new Date()
          }
        });

        processedCount++;
      } catch (error: any) {
        logger.error('Failed to import epic', {
          error: error.message,
          epicKey: epic.key,
          teamName,
          projectKey
        });
        throw error;
      }
    }

    logger.info('Epic data import completed', {
      processedCount,
      teamName,
      projectKey
    });

    return processedCount;
  }

  /**
   * Import issue data to database
   */
  private async importIssueData(issues: JiraIssueData[], teamName: string, projectKey: string): Promise<number> {
    let processedCount = 0;

    for (const issue of issues) {
      try {
        await this.prisma.jiraIssue.upsert({
          where: { jiraKey: issue.key },
          update: {
            issueType: issue.issueType,
            summary: issue.summary,
            status: issue.status,
            dueDate: issue.dueDate ? new Date(issue.dueDate) : null,
            created: new Date(issue.created),
            updated: new Date(issue.updated),
            resolved: issue.resolved ? new Date(issue.resolved) : null,
            resolution: issue.resolution,
            storyPoints: issue.storyPoints,
            epicLink: issue.epicLink,
            backlogPriority: issue.backlogPriority,
            sprintState: issue.sprintState,
            lastAssignedSprint: issue.lastAssignedSprint,
            sprintStartDate: issue.sprintStartDate ? new Date(issue.sprintStartDate) : null,
            sprintEndDate: issue.sprintEndDate ? new Date(issue.sprintEndDate) : null,
            teamName,
            projectKey,
            lastImported: new Date(),
            updatedAt: new Date()
          },
          create: {
            jiraKey: issue.key,
            issueType: issue.issueType,
            summary: issue.summary,
            status: issue.status,
            dueDate: issue.dueDate ? new Date(issue.dueDate) : null,
            created: new Date(issue.created),
            updated: new Date(issue.updated),
            resolved: issue.resolved ? new Date(issue.resolved) : null,
            resolution: issue.resolution,
            storyPoints: issue.storyPoints,
            epicLink: issue.epicLink,
            backlogPriority: issue.backlogPriority,
            sprintState: issue.sprintState,
            lastAssignedSprint: issue.lastAssignedSprint,
            sprintStartDate: issue.sprintStartDate ? new Date(issue.sprintStartDate) : null,
            sprintEndDate: issue.sprintEndDate ? new Date(issue.sprintEndDate) : null,
            teamName,
            projectKey,
            lastImported: new Date()
          }
        });

        processedCount++;
      } catch (error: any) {
        logger.error('Failed to import issue', {
          error: error.message,
          issueKey: issue.key,
          teamName,
          projectKey
        });
        throw error;
      }
    }

    logger.info('Issue data import completed', {
      processedCount,
      teamName,
      projectKey
    });

    return processedCount;
  }

  /**
   * Perform full data import from Jira
   */
  async performImport(
    jiraConfig: JiraConfig,
    importType: 'epic' | 'issue' | 'full' = 'full'
  ): Promise<ImportResult> {
    const { teamName, projectKey } = jiraConfig;
    const errors: string[] = [];
    let importLogId: number;
    let epicsProcessed = 0;
    let issuesProcessed = 0;

    try {
      // Create import log
      importLogId = await this.createImportLog(teamName, projectKey, importType);

      // Initialize Jira service
      const jiraService = new JiraService(jiraConfig);

      // Test connection
      const connectionTest = await jiraService.testConnection();
      if (!connectionTest.success) {
        throw new Error(`Failed to connect to Jira: ${connectionTest.message}`);
      }

      logger.info('Starting data import', {
        teamName,
        projectKey,
        importType,
        importLogId
      });

      if (importType === 'epic' || importType === 'full') {
        try {
          const epics = await jiraService.fetchEpicData();
          epicsProcessed = await this.importEpicData(epics, teamName, projectKey);
        } catch (error: any) {
          const errorMsg = `Epic import failed: ${error.message}`;
          errors.push(errorMsg);
          logger.error('Epic import error', { error: error.message });
        }
      }

      if (importType === 'issue' || importType === 'full') {
        try {
          const issues = await jiraService.fetchIssueData();
          issuesProcessed = await this.importIssueData(issues, teamName, projectKey);
        } catch (error: any) {
          const errorMsg = `Issue import failed: ${error.message}`;
          errors.push(errorMsg);
          logger.error('Issue import error', { error: error.message });
        }
      }

      // Update import log
      const success = errors.length === 0;
      await this.updateImportLog(
        importLogId,
        success ? 'completed' : 'failed',
        epicsProcessed + issuesProcessed,
        errors.length > 0 ? errors.join('; ') : undefined
      );

      logger.info('Data import completed', {
        teamName,
        projectKey,
        importType,
        success,
        epicsProcessed,
        issuesProcessed,
        errorsCount: errors.length,
        importLogId
      });

      return {
        success,
        epicsProcessed,
        issuesProcessed,
        errors,
        importLogId
      };

    } catch (error: any) {
      const errorMsg = `Import failed: ${error.message}`;
      errors.push(errorMsg);

      // Update import log with error
      if (importLogId) {
        await this.updateImportLog(
          importLogId,
          'failed',
          0,
          errorMsg
        );
      }

      logger.error('Data import failed', {
        teamName,
        projectKey,
        importType,
        error: error.message,
        importLogId
      });

      return {
        success: false,
        epicsProcessed,
        issuesProcessed,
        errors,
        importLogId: importLogId || 0
      };
    }
  }

  /**
   * Get import history for a team/project
   */
  async getImportHistory(teamName?: string, projectKey?: string, limit: number = 50): Promise<any[]> {
    try {
      const whereClause: any = {};
      
      if (teamName) {
        whereClause.teamName = teamName;
      }
      
      if (projectKey) {
        whereClause.projectKey = projectKey;
      }

      const history = await this.prisma.importLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return history;
    } catch (error: any) {
      logger.error('Failed to get import history', {
        error: error.message,
        teamName,
        projectKey
      });
      throw error;
    }
  }

  /**
   * Get imported epic data
   */
  async getImportedEpics(teamName?: string, projectKey?: string): Promise<any[]> {
    try {
      const whereClause: any = {};
      
      if (teamName) {
        whereClause.teamName = teamName;
      }
      
      if (projectKey) {
        whereClause.projectKey = projectKey;
      }

      const epics = await this.prisma.jiraEpic.findMany({
        where: whereClause,
        orderBy: { lastImported: 'desc' }
      });

      return epics;
    } catch (error: any) {
      logger.error('Failed to get imported epics', {
        error: error.message,
        teamName,
        projectKey
      });
      throw error;
    }
  }

  /**
   * Get imported issue data
   */
  async getImportedIssues(teamName?: string, projectKey?: string): Promise<any[]> {
    try {
      const whereClause: any = {};
      
      if (teamName) {
        whereClause.teamName = teamName;
      }
      
      if (projectKey) {
        whereClause.projectKey = projectKey;
      }

      const issues = await this.prisma.jiraIssue.findMany({
        where: whereClause,
        orderBy: { lastImported: 'desc' }
      });

      return issues;
    } catch (error: any) {
      logger.error('Failed to get imported issues', {
        error: error.message,
        teamName,
        projectKey
      });
      throw error;
    }
  }
}
