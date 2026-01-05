# Jira Import Functionality

This document describes the Jira import functionality that replicates the Excel macro behavior in the backend application.

## Overview

The Jira import system allows you to:
- Import Epic and Issue data from Jira using JQL queries
- Store imported data in PostgreSQL database
- Manage import configurations for different teams and projects
- Track import history and statistics
- Test Jira connections before importing

## Database Schema

### New Tables Added

#### `import_configs`
Stores import configuration for each team/project combination:
- `id`: Primary key
- `teamName`: Team name (e.g., "Crank", "Marvin", "CodeRed")
- `projectKey`: Jira project key (e.g., "SAPRM")
- `jiraBaseUrl`: Jira instance URL
- `importStartDate`: Start date for data import
- `isActive`: Whether configuration is active
- `createdAt`, `updatedAt`: Timestamps

#### `jira_epics`
Stores imported Epic data:
- `id`: Primary key
- `jiraKey`: Epic key from Jira (e.g., "SAPRM-123")
- `summary`: Epic summary
- `status`: Epic status
- `dueDate`: Due date
- `priority`: Priority level
- `fixVersions`: Comma-separated fix versions
- `roughEstimate`, `originalEstimate`, `remainingEstimate`: Story points
- `teamName`, `projectKey`: Team and project identifiers
- `lastImported`: Last import timestamp

#### `jira_issues`
Stores imported Issue data:
- `id`: Primary key
- `jiraKey`: Issue key from Jira (e.g., "SAPRM-456")
- `issueType`: Issue type (Task, Story, Bug, etc.)
- `summary`: Issue summary
- `status`: Issue status
- `dueDate`: Due date
- `created`, `updated`, `resolved`: Timestamps
- `resolution`: Resolution type
- `storyPoints`: Story points
- `epicLink`: Link to parent epic
- `backlogPriority`: Backlog priority
- `sprintState`: Sprint state (active, closed, future, backlog)
- `lastAssignedSprint`: Name of last assigned sprint
- `sprintStartDate`, `sprintEndDate`: Sprint dates
- `teamName`, `projectKey`: Team and project identifiers
- `lastImported`: Last import timestamp

#### `import_logs`
Tracks import activities:
- `id`: Primary key
- `teamName`, `projectKey`: Team and project identifiers
- `importType`: Type of import (epic, issue, full)
- `status`: Import status (started, completed, failed)
- `startTime`, `endTime`: Import timestamps
- `recordsProcessed`: Number of records processed
- `errorMessage`: Error message if failed
- `createdAt`: Log creation timestamp

## API Endpoints

### Import Management

#### `POST /api/import/start`
Start data import from Jira.

**Request Body:**
```json
{
  "teamName": "Crank",
  "projectKey": "SAPRM",
  "jiraBaseUrl": "https://msggroup.atlassian.net",
  "email": "user@example.com",
  "apiToken": "your-api-token",
  "importStartDate": "2024-01-01T00:00:00.000Z",
  "importType": "full"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "importLogId": 123,
    "epicsProcessed": 45,
    "issuesProcessed": 234,
    "errors": []
  }
}
```

#### `POST /api/import/test-connection`
Test Jira connection before importing.

**Request Body:**
```json
{
  "jiraBaseUrl": "https://msggroup.atlassian.net",
  "email": "user@example.com",
  "apiToken": "your-api-token"
}
```

#### `GET /api/import/history`
Get import history with optional filters.

**Query Parameters:**
- `teamName` (optional): Filter by team name
- `projectKey` (optional): Filter by project key
- `limit` (optional): Number of records to return (default: 50, max: 100)

#### `GET /api/import/status/:importLogId`
Get status of specific import by log ID.

#### `GET /api/import/epics`
Get imported epic data.

**Query Parameters:**
- `teamName` (optional): Filter by team name
- `projectKey` (optional): Filter by project key

#### `GET /api/import/issues`
Get imported issue data.

**Query Parameters:**
- `teamName` (optional): Filter by team name
- `projectKey` (optional): Filter by project key

### Configuration Management

#### `GET /api/config/teams`
Get all team configurations.

#### `GET /api/config/teams/:teamName`
Get specific team configuration.

#### `GET /api/config/team-names`
Get available team names.

#### `GET /api/config/project-keys`
Get available project keys.

#### `GET /api/config/statistics`
Get overall import statistics.

#### `GET /api/config/statistics/:teamName`
Get team-specific statistics.

#### `GET /api/config/recent-activity`
Get recent import activity.

#### `GET /api/config/summary`
Get configuration summary for dashboard.

#### `GET /api/config/import-settings`
Get default import settings.

## JQL Queries

The system uses the following JQL queries to fetch data from Jira:

### Epic Query
```jql
project = "SAP Reinsurance Management for SAP S/4HANA" 
AND "Team (Development)[Dropdown]" in ("{teamName}") 
AND (resolutiondate >= {importStartDate} OR resolutiondate IS EMPTY) 
AND issuetype = Epic 
ORDER BY Rank ASC
```

### Issue Query
```jql
project = "SAP Reinsurance Management for SAP S/4HANA" 
AND "Team (Development)[Dropdown]" in ("{teamName}") 
AND (resolutiondate >= {importStartDate} OR resolutiondate IS EMPTY) 
AND issuetype in (Task, Story, "Bug (new development)", Bug) 
ORDER BY Rank ASC
```

## Custom Fields Mapping

The system maps the following Jira custom fields:

| Custom Field ID | Description | Usage |
|----------------|-------------|-------|
| `customfield_10112` | Team field | Used in JQL filter |
| `customfield_10192` | Rough Estimate (SP) | Epic rough estimate |
| `customfield_10193` | Original Estimate (SP) | Epic original estimate |
| `customfield_10194` | Remaining Estimate (SP) | Epic remaining estimate |
| `customfield_10033` | Story Points | Issue story points |
| `customfield_10014` | Epic Link | Link to parent epic |
| `customfield_10019` | Backlog Priority | Issue backlog priority |
| `customfield_10020` | Sprint | Sprint information |

## Authentication

The system uses Basic Authentication with Jira API tokens:
1. Create an API token in Jira
2. Use email and API token to create base64 encoded credentials
3. Include in Authorization header: `Basic {base64(email:apiToken)}`

## Error Handling

The system includes comprehensive error handling:
- Connection testing before import
- Validation of configuration parameters
- Detailed error logging
- Import status tracking
- Retry mechanisms for failed requests

## Usage Examples

### 1. Test Connection
```bash
curl -X POST http://localhost:4001/api/import/test-connection \
  -H "Content-Type: application/json" \
  -d '{
    "jiraBaseUrl": "https://msggroup.atlassian.net",
    "email": "your-email@example.com",
    "apiToken": "your-api-token"
  }'
```

### 2. Start Full Import
```bash
curl -X POST http://localhost:4001/api/import/start \
  -H "Content-Type: application/json" \
  -d '{
    "teamName": "Crank",
    "projectKey": "SAPRM",
    "jiraBaseUrl": "https://msggroup.atlassian.net",
    "email": "your-email@example.com",
    "apiToken": "your-api-token",
    "importStartDate": "2024-01-01T00:00:00.000Z",
    "importType": "full"
  }'
```

### 3. Get Import History
```bash
curl http://localhost:4001/api/import/history?teamName=Crank&limit=10
```

### 4. Get Team Statistics
```bash
curl http://localhost:4001/api/config/statistics/Crank
```

## Migration

To apply the database changes:

```bash
cd backend
npm run db:push
```

This will create the new tables in your PostgreSQL database.

## Environment Variables

Make sure to set the following environment variables:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/jira_dashboard"
NODE_ENV="development"
PORT=4001
```

## Logging

The system uses Winston for logging with the following levels:
- `info`: General information about imports and operations
- `debug`: Detailed debugging information
- `error`: Error conditions and failures
- `warn`: Warning conditions

Logs are written to:
- Console (development)
- Files in `logs/` directory (production)

## Performance Considerations

- Imports are paginated (100 records per page)
- Maximum 50 pages per import (5000 records)
- Connection timeout: 30 seconds
- Comprehensive error handling and logging
- Database upsert operations for efficient data updates

## Security

- API tokens are not stored in the database
- Authentication is required for all import operations
- Input validation on all endpoints
- SQL injection protection through Prisma ORM
- CORS configuration for frontend access
