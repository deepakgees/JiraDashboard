import axios, { AxiosInstance, AxiosResponse } from 'axios';
import logger from '../utils/logger';

export interface JiraConfig {
  baseUrl: string;
  authToken?: string;
  cookies?: string;
  accessToken?: string; // OAuth access token
  accountId?: string; // OAuth account ID
  projectKey: string;
  teamName: string;
  importStartDate: string;
  authType: 'api' | 'cookie' | 'oauth';
}

export interface JiraEpicData {
  key: string;
  summary: string;
  status: string;
  dueDate?: string;
  priority?: string;
  fixVersions?: string[];
  roughEstimate?: number;
  originalEstimate?: number;
  remainingEstimate?: number;
}

export interface JiraIssueData {
  key: string;
  issueType: string;
  summary: string;
  status: string;
  dueDate?: string;
  created: string;
  updated: string;
  resolved?: string;
  resolution?: string;
  storyPoints?: number;
  epicLink?: string;
  backlogPriority?: number;
  sprintState?: string;
  lastAssignedSprint?: string;
  sprintStartDate?: string;
  sprintEndDate?: string;
}

export interface JiraSearchResponse {
  issues: any[];
  nextPageToken?: string;
  total?: number;
}

export class JiraService {
  private client: AxiosInstance;
  private config: JiraConfig;

  /**
   * Sanitize cookie string by removing invalid characters for HTTP headers
   * Removes newlines, carriage returns, and other control characters
   * Ensures proper semicolon-separated format
   * Strips cookie attributes (Path, Domain, Secure, HttpOnly, etc.)
   */
  private sanitizeCookieString(cookieString: string): string {
    if (!cookieString) {
      return '';
    }
    
    // Remove newlines, carriage returns, and other control characters
    // Replace line breaks with semicolons (common when copying from browser)
    let sanitized = cookieString
      .replace(/\r\n/g, '; ')  // Replace Windows line breaks with semicolon+space
      .replace(/\n/g, '; ')   // Replace Unix line breaks with semicolon+space
      .replace(/\r/g, '; ')   // Replace carriage returns with semicolon+space
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove other control characters
      .trim();                 // Remove leading/trailing whitespace
    
    // Split by semicolon and process each cookie
    const cookieParts = sanitized.split(';').map(part => part.trim()).filter(part => part);
    const validCookies: string[] = [];
    
    for (const part of cookieParts) {
      // Skip cookie attributes (Path, Domain, Secure, HttpOnly, SameSite, Expires, Max-Age)
      const lowerPart = part.toLowerCase();
      if (lowerPart.startsWith('path=') || 
          lowerPart.startsWith('domain=') || 
          lowerPart === 'secure' || 
          lowerPart === 'httponly' ||
          lowerPart.startsWith('samesite=') ||
          lowerPart.startsWith('expires=') ||
          lowerPart.startsWith('max-age=')) {
        continue; // Skip cookie attributes
      }
      
      // Only include parts that look like cookies (have = sign and value)
      if (part.includes('=') && part.split('=').length >= 2) {
        // Extract just the name=value part (in case there are attributes after =)
        const nameValue = part.split('=')[0] + '=' + part.split('=').slice(1).join('=').split(',')[0].trim();
        validCookies.push(nameValue);
      }
    }
    
    // Join valid cookies with semicolon and space
    sanitized = validCookies.join('; ');
    
    // Normalize spacing
    sanitized = sanitized
      .replace(/;\s*;/g, ';')  // Remove duplicate semicolons
      .replace(/;\s+/g, '; ')  // Ensure single space after semicolon
      .replace(/\s+;/g, '; ')   // Ensure single space before semicolon (if any)
      .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
      .trim();
    
    // Remove trailing semicolon if present
    if (sanitized.endsWith(';')) {
      sanitized = sanitized.slice(0, -1).trim();
    }
    
    return sanitized;
  }

  constructor(config: JiraConfig) {
    this.config = config;
    
    const headers: any = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'JiraDashboard/1.0'
    };

    // Set authentication based on type
    if (config.authType === 'api' && config.authToken) {
      headers['Authorization'] = `Basic ${config.authToken}`;
    } else if (config.authType === 'oauth' && config.accessToken) {
      headers['Authorization'] = `Bearer ${config.accessToken}`;
    } else if (config.authType === 'cookie' && config.cookies) {
      // Sanitize cookie string to remove invalid characters
      const sanitizedCookies = this.sanitizeCookieString(config.cookies);
      
      // Validate that cookies contain at least one valid cookie (has = sign)
      if (!sanitizedCookies || !sanitizedCookies.includes('=')) {
        logger.warn('Invalid cookie format - no cookie values found', {
          cookieLength: sanitizedCookies.length,
          cookiePreview: sanitizedCookies.substring(0, 50)
        });
        throw new Error('Invalid cookie format. Cookies must be in the format "name1=value1; name2=value2"');
      }
      
      headers['Cookie'] = sanitizedCookies;
      
      // Log cookie header (first 100 chars only for security) - using info level so it shows in logs
      logger.info('Setting Cookie header for Jira authentication', {
        cookieLength: sanitizedCookies.length,
        cookieCount: sanitizedCookies.split(';').length,
        cookiePreview: sanitizedCookies.substring(0, 100) + (sanitizedCookies.length > 100 ? '...' : ''),
        hasJSESSIONID: sanitizedCookies.includes('JSESSIONID'),
        hasCloudSession: sanitizedCookies.includes('cloud.session.token'),
        cookieNames: sanitizedCookies.split(';').map(c => c.split('=')[0].trim()).filter(c => c)
      });
    }

    this.client = axios.create({
      baseURL: config.baseUrl,
      headers,
      timeout: 30000,
      // Note: withCredentials is browser-only and doesn't work in Node.js
      // For server-side requests, we use the Cookie header directly
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        const logData: any = {
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          authType: this.config.authType
        };
        
        // Log cookie header info (not the actual value for security)
        if (config.headers && config.headers['Cookie']) {
          const cookieHeader = config.headers['Cookie'] as string;
          logData.hasCookieHeader = true;
          logData.cookieHeaderLength = cookieHeader.length;
          logData.cookieHeaderPreview = cookieHeader.substring(0, 50) + (cookieHeader.length > 50 ? '...' : '');
        }
        
        // Log authorization header info (not the actual value for security)
        if (config.headers && config.headers['Authorization']) {
          logData.hasAuthHeader = true;
        }
        
        // Use info level for request logging so it shows in logs
        logger.info('Jira API Request', JSON.stringify(logData));
        return config;
      },
      (error) => {
        logger.error('Jira API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        logger.debug('Jira API Response', {
          status: response.status,
          url: response.config.url,
          dataSize: JSON.stringify(response.data).length
        });
        return response;
      },
      (error) => {
        const errorLog: any = {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          baseURL: error.config?.baseURL,
          method: error.config?.method?.toUpperCase(),
          message: error.message,
          authType: this.config.authType
        };
        
        // Log request headers info (for debugging)
        if (error.config?.headers) {
          const headers = error.config.headers;
          if (headers['Cookie']) {
            const cookieHeader = headers['Cookie'] as string;
            errorLog.cookieHeaderLength = cookieHeader.length;
            errorLog.cookieHeaderPreview = cookieHeader.substring(0, 100) + (cookieHeader.length > 100 ? '...' : '');
            errorLog.cookieCount = cookieHeader.split(';').length;
            errorLog.cookieNames = cookieHeader.split(';').map(c => c.split('=')[0].trim()).filter(c => c);
          }
          if (headers['Authorization']) {
            errorLog.hasAuthHeader = true;
          }
        }
        
        // Log response data if available (might contain error details)
        if (error.response?.data) {
          errorLog.responseDataPreview = JSON.stringify(error.response.data).substring(0, 200);
        }
        
        logger.error('Jira API Response Error', JSON.stringify(errorLog));
        return Promise.reject(error);
      }
    );
  }

  /**
   * Test the Jira connection and authentication
   */
  async testConnection(): Promise<{ success: boolean; message: string; user?: any }> {
    try {
      const response = await this.client.get('/rest/api/3/myself');
      logger.info('Jira connection test successful', {
        user: response.data.displayName,
        email: response.data.emailAddress,
        authType: this.config.authType
      });
      return {
        success: true,
        message: `Connected successfully as ${response.data.displayName}`,
        user: response.data
      };
    } catch (error: any) {
      // Enhanced error logging for debugging
      const errorDetails: any = {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        authType: this.config.authType,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      };
      
      // Log request headers info (for debugging cookie issues)
      if (error.config?.headers) {
        const headers = error.config.headers;
        if (headers['Cookie']) {
          const cookieHeader = headers['Cookie'] as string;
          errorDetails.cookieHeaderLength = cookieHeader.length;
          errorDetails.cookieHeaderPreview = cookieHeader.substring(0, 50) + (cookieHeader.length > 50 ? '...' : '');
        }
        if (headers['Authorization']) {
          errorDetails.hasAuthHeader = true;
        }
      }
      
      // Log response headers if available (might contain clues about auth failure)
      if (error.response?.headers) {
        errorDetails.responseHeaders = Object.keys(error.response.headers);
      }
      
      logger.error('Jira connection test failed', errorDetails);
      
      let message = 'Connection failed';
      if (error.response?.status === 401) {
        if (this.config.authType === 'cookie') {
          message = 'Invalid or expired cookies. Please refresh your browser session and copy new cookies. Make sure you copied all cookies from your browser, including session cookies like JSESSIONID.';
        } else {
          message = 'Invalid API credentials. Please check your email and API token.';
        }
      } else if (error.response?.status === 403) {
        message = 'Access forbidden. Please check your permissions.';
      } else if (error.code === 'ECONNREFUSED') {
        message = 'Cannot connect to Jira server. Please check the URL.';
      }
      
      return {
        success: false,
        message: `${message} (Status: ${error.response?.status || 'Unknown'})`
      };
    }
  }

  /**
   * Build JQL query for epics based on configuration
   */
  private buildEpicJQL(): string {
    const { projectKey, teamName, importStartDate } = this.config;
    
    return `project = "${projectKey}" AND "Team (Development)[Dropdown]" in ("${teamName}") AND (resolutiondate >= ${importStartDate} OR resolutiondate IS EMPTY) AND issuetype = Epic ORDER BY Rank ASC`;
  }

  /**
   * Build JQL query for issues based on configuration
   */
  private buildIssueJQL(): string {
    const { projectKey, teamName, importStartDate } = this.config;
    
    return `project = "${projectKey}" AND "Team (Development)[Dropdown]" in ("${teamName}") AND (resolutiondate >= ${importStartDate} OR resolutiondate IS EMPTY) AND issuetype in (Task, Story, "Bug (new development)", Bug) ORDER BY Rank ASC`;
  }

  /**
   * Search Jira using JQL with pagination support
   */
  private async searchJira(jql: string, nextPageToken?: string): Promise<JiraSearchResponse> {
    const requestBody: any = {
      jql,
      maxResults: 100,
      fields: [
        'key', 'summary', 'status', 'duedate', 'priority', 'customfield_10112',
        'fixVersions', 'customfield_10192', 'customfield_10193', 'customfield_10194',
        'issuetype', 'created', 'updated', 'resolutiondate', 'resolution',
        'customfield_10033', 'customfield_10014', 'customfield_10019', 'customfield_10020'
      ]
    };

    if (nextPageToken) {
      requestBody.nextPageToken = nextPageToken;
    }

    try {
      const response: AxiosResponse = await this.client.post('/rest/api/3/search/jql', requestBody);
      return response.data;
    } catch (error: any) {
      logger.error('Jira search failed', {
        jql,
        error: error.message,
        status: error.response?.status
      });
      throw error;
    }
  }

  /**
   * Extract epic data from Jira issue object
   */
  private extractEpicData(issue: any): JiraEpicData {
    const fields = issue.fields;
    
    // Extract fix versions
    let fixVersions: string[] = [];
    if (fields.fixVersions && Array.isArray(fields.fixVersions)) {
      fixVersions = fields.fixVersions.map((version: any) => version.name);
    }

    return {
      key: issue.key,
      summary: fields.summary || '',
      status: fields.status?.name || '',
      dueDate: fields.duedate || undefined,
      priority: fields.priority?.name || undefined,
      fixVersions: fixVersions.length > 0 ? fixVersions : undefined,
      roughEstimate: fields.customfield_10192 || undefined,
      originalEstimate: fields.customfield_10193 || undefined,
      remainingEstimate: fields.customfield_10194 || undefined
    };
  }

  /**
   * Extract issue data from Jira issue object
   */
  private extractIssueData(issue: any): JiraIssueData {
    const fields = issue.fields;
    
    // Extract sprint information
    let sprintState: string | undefined;
    let lastAssignedSprint: string | undefined;
    let sprintStartDate: string | undefined;
    let sprintEndDate: string | undefined;

    if (fields.customfield_10020 && Array.isArray(fields.customfield_10020)) {
      // Find the most recent sprint
      const sprints = fields.customfield_10020;
      let lastSprint = sprints[0];
      
      for (const sprint of sprints) {
        if (sprint.startDate && lastSprint.startDate && sprint.startDate > lastSprint.startDate) {
          lastSprint = sprint;
        }
      }

      sprintState = lastSprint.state;
      lastAssignedSprint = lastSprint.name;
      sprintStartDate = lastSprint.startDate;
      sprintEndDate = lastSprint.endDate;
    } else {
      sprintState = 'backlog';
    }

    return {
      key: issue.key,
      issueType: fields.issuetype?.name || '',
      summary: fields.summary || '',
      status: fields.status?.name || '',
      dueDate: fields.duedate || undefined,
      created: fields.created ? fields.created.substring(0, 10) : '',
      updated: fields.updated ? fields.updated.substring(0, 10) : '',
      resolved: fields.resolutiondate ? fields.resolutiondate.substring(0, 10) : undefined,
      resolution: fields.resolution?.name || undefined,
      storyPoints: fields.customfield_10033 || undefined,
      epicLink: fields.customfield_10014 || undefined,
      backlogPriority: fields.customfield_10019 || undefined,
      sprintState,
      lastAssignedSprint,
      sprintStartDate,
      sprintEndDate
    };
  }

  /**
   * Fetch all epic data with pagination
   */
  async fetchEpicData(): Promise<JiraEpicData[]> {
    const jql = this.buildEpicJQL();
    const epics: JiraEpicData[] = [];
    let nextPageToken: string | undefined;
    let pageCount = 0;

    logger.info('Starting epic data fetch', { jql });

    do {
      pageCount++;
      
      // Safety limit to prevent infinite loops
      if (pageCount > 50) {
        logger.warn('Epic fetch stopped after 50 pages (more than 5000 epics)');
        break;
      }

      try {
        const response = await this.searchJira(jql, nextPageToken);
        
        if (!response.issues || response.issues.length === 0) {
          break;
        }

        // Extract epic data from each issue
        for (const issue of response.issues) {
          const epicData = this.extractEpicData(issue);
          epics.push(epicData);
        }

        logger.debug('Epic page processed', {
          page: pageCount,
          issuesInPage: response.issues.length,
          totalEpics: epics.length
        });

        // Check for next page
        if (response.nextPageToken) {
          nextPageToken = response.nextPageToken;
          if (nextPageToken === '') {
            break;
          }
        } else {
          break;
        }

      } catch (error: any) {
        logger.error('Error fetching epic page', {
          page: pageCount,
          error: error.message
        });
        throw error;
      }

    } while (nextPageToken);

    logger.info('Epic data fetch completed', {
      totalEpics: epics.length,
      pagesProcessed: pageCount
    });

    return epics;
  }

  /**
   * Fetch all issue data with pagination
   */
  async fetchIssueData(): Promise<JiraIssueData[]> {
    const jql = this.buildIssueJQL();
    const issues: JiraIssueData[] = [];
    let nextPageToken: string | undefined;
    let pageCount = 0;

    logger.info('Starting issue data fetch', { jql });

    do {
      pageCount++;
      
      // Safety limit to prevent infinite loops
      if (pageCount > 50) {
        logger.warn('Issue fetch stopped after 50 pages (more than 5000 issues)');
        break;
      }

      try {
        const response = await this.searchJira(jql, nextPageToken);
        
        if (!response.issues || response.issues.length === 0) {
          break;
        }

        // Extract issue data from each issue
        for (const issue of response.issues) {
          const issueData = this.extractIssueData(issue);
          issues.push(issueData);
        }

        logger.debug('Issue page processed', {
          page: pageCount,
          issuesInPage: response.issues.length,
          totalIssues: issues.length
        });

        // Check for next page
        if (response.nextPageToken) {
          nextPageToken = response.nextPageToken;
          if (nextPageToken === '') {
            break;
          }
        } else {
          break;
        }

      } catch (error: any) {
        logger.error('Error fetching issue page', {
          page: pageCount,
          error: error.message
        });
        throw error;
      }

    } while (nextPageToken);

    logger.info('Issue data fetch completed', {
      totalIssues: issues.length,
      pagesProcessed: pageCount
    });

    return issues;
  }

  /**
   * Fetch both epic and issue data
   */
  async fetchAllData(): Promise<{ epics: JiraEpicData[]; issues: JiraIssueData[] }> {
    logger.info('Starting full data import', {
      teamName: this.config.teamName,
      projectKey: this.config.projectKey
    });

    const [epics, issues] = await Promise.all([
      this.fetchEpicData(),
      this.fetchIssueData()
    ]);

    logger.info('Full data import completed', {
      epicsCount: epics.length,
      issuesCount: issues.length
    });

    return { epics, issues };
  }
}

/**
 * Create a base64 encoded auth token from email and API token
 */
export function createAuthToken(email: string, apiToken: string): string {
  const credentials = `${email}:${apiToken}`;
  return Buffer.from(credentials).toString('base64');
}

/**
 * Validate Jira configuration
 */
export function validateJiraConfig(config: Partial<JiraConfig>): string[] {
  const errors: string[] = [];

  if (!config.baseUrl) {
    errors.push('Jira base URL is required');
  } else if (!config.baseUrl.startsWith('http')) {
    errors.push('Jira base URL must start with http or https');
  }

  // Validate authentication based on auth type
  if (config.authType === 'api') {
    if (!config.authToken) {
      errors.push('Authentication token is required for API authentication');
    }
  } else if (config.authType === 'oauth') {
    if (!config.accessToken && !config.accountId) {
      errors.push('Access token or account ID is required for OAuth authentication');
    }
  } else if (config.authType === 'cookie') {
    if (!config.cookies) {
      errors.push('Cookies are required for cookie authentication');
    }
  } else {
    // Default to API auth for backward compatibility
    if (!config.authToken) {
      errors.push('Authentication token is required');
    }
  }

  if (!config.projectKey) {
    errors.push('Project key is required');
  }

  if (!config.teamName) {
    errors.push('Team name is required');
  }

  if (!config.importStartDate) {
    errors.push('Import start date is required');
  } else {
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(config.importStartDate)) {
      errors.push('Import start date must be in YYYY-MM-DD format');
    }
  }

  return errors;
}
