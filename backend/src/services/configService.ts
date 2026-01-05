import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';

export interface TeamConfig {
  id?: number;
  name: string;
  description?: string;
  jiraProjectKey: string;
  jiraBaseUrl: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ImportSettings {
  defaultImportStartDate: Date;
  maxRecordsPerImport: number;
  importTimeoutMinutes: number;
  retryAttempts: number;
  isAutoImportEnabled: boolean;
  autoImportIntervalHours: number;
}

export class ConfigService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Get all team configurations
   */
  async getTeamConfigs(): Promise<TeamConfig[]> {
    try {
      const configs = await this.prisma.importConfig.findMany({
        where: { isActive: true },
        orderBy: [
          { teamName: 'asc' },
          { projectKey: 'asc' }
        ]
      });

      // Transform to TeamConfig format
      const teamConfigs: TeamConfig[] = configs.map(config => ({
        id: config.id,
        name: config.teamName,
        jiraProjectKey: config.projectKey,
        jiraBaseUrl: config.jiraBaseUrl,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      }));

      logger.info('Team configurations retrieved', {
        count: teamConfigs.length
      });

      return teamConfigs;
    } catch (error: any) {
      logger.error('Failed to get team configurations', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get team configuration by name
   */
  async getTeamConfig(teamName: string): Promise<TeamConfig | null> {
    try {
      const config = await this.prisma.importConfig.findFirst({
        where: {
          teamName,
          isActive: true
        }
      });

      if (!config) {
        return null;
      }

      const teamConfig: TeamConfig = {
        id: config.id,
        name: config.teamName,
        jiraProjectKey: config.projectKey,
        jiraBaseUrl: config.jiraBaseUrl,
        isActive: config.isActive,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      };

      logger.info('Team configuration retrieved', {
        teamName,
        configId: config.id
      });

      return teamConfig;
    } catch (error: any) {
      logger.error('Failed to get team configuration', {
        error: error.message,
        teamName
      });
      throw error;
    }
  }

  /**
   * Get available team names
   */
  async getAvailableTeamNames(): Promise<string[]> {
    try {
      const configs = await this.prisma.importConfig.findMany({
        where: { isActive: true },
        select: { teamName: true },
        distinct: ['teamName'],
        orderBy: { teamName: 'asc' }
      });

      const teamNames = configs.map(config => config.teamName);

      logger.info('Available team names retrieved', {
        count: teamNames.length,
        teams: teamNames
      });

      return teamNames;
    } catch (error: any) {
      logger.error('Failed to get available team names', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get available project keys
   */
  async getAvailableProjectKeys(): Promise<string[]> {
    try {
      const configs = await this.prisma.importConfig.findMany({
        where: { isActive: true },
        select: { projectKey: true },
        distinct: ['projectKey'],
        orderBy: { projectKey: 'asc' }
      });

      const projectKeys = configs.map(config => config.projectKey);

      logger.info('Available project keys retrieved', {
        count: projectKeys.length,
        projects: projectKeys
      });

      return projectKeys;
    } catch (error: any) {
      logger.error('Failed to get available project keys', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get import statistics
   */
  async getImportStatistics(): Promise<{
    totalImports: number;
    successfulImports: number;
    failedImports: number;
    lastImportDate: Date | null;
    totalEpics: number;
    totalIssues: number;
    activeTeams: number;
  }> {
    try {
      // Get import log statistics
      const [totalImports, successfulImports, failedImports, lastImport] = await Promise.all([
        this.prisma.importLog.count(),
        this.prisma.importLog.count({ where: { status: 'completed' } }),
        this.prisma.importLog.count({ where: { status: 'failed' } }),
        this.prisma.importLog.findFirst({
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        })
      ]);

      // Get data statistics
      const [totalEpics, totalIssues, activeTeams] = await Promise.all([
        this.prisma.jiraEpic.count(),
        this.prisma.jiraIssue.count(),
        this.prisma.importConfig.count({ where: { isActive: true } })
      ]);

      const statistics = {
        totalImports,
        successfulImports,
        failedImports,
        lastImportDate: lastImport?.createdAt || null,
        totalEpics,
        totalIssues,
        activeTeams
      };

      logger.info('Import statistics retrieved', statistics);

      return statistics;
    } catch (error: any) {
      logger.error('Failed to get import statistics', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get recent import activity
   */
  async getRecentImportActivity(limit: number = 10): Promise<any[]> {
    try {
      const recentImports = await this.prisma.importLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        select: {
          id: true,
          teamName: true,
          projectKey: true,
          importType: true,
          status: true,
          startTime: true,
          endTime: true,
          recordsProcessed: true,
          errorMessage: true,
          createdAt: true
        }
      });

      logger.info('Recent import activity retrieved', {
        count: recentImports.length,
        limit
      });

      return recentImports;
    } catch (error: any) {
      logger.error('Failed to get recent import activity', {
        error: error.message,
        limit
      });
      throw error;
    }
  }

  /**
   * Get team-specific statistics
   */
  async getTeamStatistics(teamName: string): Promise<{
    totalImports: number;
    successfulImports: number;
    failedImports: number;
    lastImportDate: Date | null;
    totalEpics: number;
    totalIssues: number;
    projectKeys: string[];
  }> {
    try {
      // Get import log statistics for team
      const [totalImports, successfulImports, failedImports, lastImport] = await Promise.all([
        this.prisma.importLog.count({ where: { teamName } }),
        this.prisma.importLog.count({ where: { teamName, status: 'completed' } }),
        this.prisma.importLog.count({ where: { teamName, status: 'failed' } }),
        this.prisma.importLog.findFirst({
          where: { teamName },
          orderBy: { createdAt: 'desc' },
          select: { createdAt: true }
        })
      ]);

      // Get data statistics for team
      const [totalEpics, totalIssues, projectKeys] = await Promise.all([
        this.prisma.jiraEpic.count({ where: { teamName } }),
        this.prisma.jiraIssue.count({ where: { teamName } }),
        this.prisma.importConfig.findMany({
          where: { teamName, isActive: true },
          select: { projectKey: true },
          distinct: ['projectKey']
        }).then(configs => configs.map(config => config.projectKey))
      ]);

      const statistics = {
        totalImports,
        successfulImports,
        failedImports,
        lastImportDate: lastImport?.createdAt || null,
        totalEpics,
        totalIssues,
        projectKeys
      };

      logger.info('Team statistics retrieved', {
        teamName,
        ...statistics
      });

      return statistics;
    } catch (error: any) {
      logger.error('Failed to get team statistics', {
        error: error.message,
        teamName
      });
      throw error;
    }
  }

  /**
   * Get default import settings (can be extended to store in database)
   */
  getDefaultImportSettings(): ImportSettings {
    return {
      defaultImportStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      maxRecordsPerImport: 5000,
      importTimeoutMinutes: 30,
      retryAttempts: 3,
      isAutoImportEnabled: false,
      autoImportIntervalHours: 24
    };
  }

  /**
   * Validate team configuration
   */
  validateTeamConfig(config: Partial<TeamConfig>): string[] {
    const errors: string[] = [];

    if (!config.name || config.name.trim() === '') {
      errors.push('Team name is required');
    }

    if (!config.jiraProjectKey || config.jiraProjectKey.trim() === '') {
      errors.push('Jira project key is required');
    }

    if (!config.jiraBaseUrl || config.jiraBaseUrl.trim() === '') {
      errors.push('Jira base URL is required');
    } else if (!config.jiraBaseUrl.startsWith('http')) {
      errors.push('Jira base URL must start with http or https');
    }

    return errors;
  }

  /**
   * Get configuration summary for dashboard
   */
  async getConfigurationSummary(): Promise<{
    totalTeams: number;
    totalProjects: number;
    activeConfigurations: number;
    lastConfigurationUpdate: Date | null;
    teamsWithRecentImports: number;
  }> {
    try {
      const [totalTeams, totalProjects, activeConfigurations, lastConfigUpdate, recentImports] = await Promise.all([
        this.prisma.importConfig.findMany({
          select: { teamName: true },
          distinct: ['teamName']
        }).then(configs => configs.length),
        
        this.prisma.importConfig.findMany({
          select: { projectKey: true },
          distinct: ['projectKey']
        }).then(configs => configs.length),
        
        this.prisma.importConfig.count({ where: { isActive: true } }),
        
        this.prisma.importConfig.findFirst({
          orderBy: { updatedAt: 'desc' },
          select: { updatedAt: true }
        }),
        
        this.prisma.importLog.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
            }
          },
          select: { teamName: true },
          distinct: ['teamName']
        }).then(logs => logs.length)
      ]);

      const summary = {
        totalTeams,
        totalProjects,
        activeConfigurations,
        lastConfigurationUpdate: lastConfigUpdate?.updatedAt || null,
        teamsWithRecentImports: recentImports
      };

      logger.info('Configuration summary retrieved', summary);

      return summary;
    } catch (error: any) {
      logger.error('Failed to get configuration summary', {
        error: error.message
      });
      throw error;
    }
  }
}
