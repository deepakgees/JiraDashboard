import express from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import logger from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

/**
 * Helper function to parse CSV
 * Handles duplicate column names (like multiple "Sprint" columns)
 */
function parseCsv(csvContent: string): any[] {
  try {
    // First, parse without columns to get raw rows
    const rawRows = parse(csvContent, {
      skip_empty_lines: true,
      trim: true,
      cast: false
    });
    
    if (rawRows.length === 0) {
      return [];
    }
    
    // Get header row
    const headerRow = rawRows[0];
    const dataRows = rawRows.slice(1);
    
    // Find all column indices that match "sprint" (case-insensitive)
    const sprintIndices: number[] = [];
    headerRow.forEach((header: string, index: number) => {
      if (header && header.toLowerCase().includes('sprint')) {
        sprintIndices.push(index);
      }
    });
    
    // Process each data row
    const records = dataRows.map((row: any[]) => {
      const record: any = {};
      
      // Map all columns to the record
      headerRow.forEach((header: string, index: number) => {
        const value = row[index] || '';
        
        // For duplicate column names, we need to handle them specially
        // Check if this is a sprint column
        if (sprintIndices.includes(index)) {
          // For sprint columns, we'll collect them separately
          // Store with a unique key that includes the index
          record[`__SPRINT_${index}__`] = value;
        } else {
          // For non-sprint columns, use the header name
          // If duplicate exists, keep the last one (standard behavior)
          record[header] = value;
        }
      });
      
      return record;
    });
    
    return records;
  } catch (error: any) {
    logger.error('CSV parsing failed', { error: error.message });
    throw new Error(`Failed to parse CSV: ${error.message}`);
  }
}

/**
 * Helper function to parse date
 */
function parseDate(dateString: string | undefined): Date | null {
  if (!dateString || dateString.trim() === '') {
    return null;
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
}

/**
 * Helper function to collect all sprint values from CSV record
 * Finds all columns that contain "sprint" (case-insensitive) and collects non-empty values
 * Handles duplicate "Sprint" column names by checking both regular keys and special __SPRINT_*__ keys
 */
function collectSprints(record: any): string[] {
  const sprints: string[] = [];
  
  if (!record || typeof record !== 'object') {
    return sprints;
  }
  
  // First, collect from special __SPRINT_*__ keys (for duplicate columns)
  for (const key in record) {
    if (key && key.startsWith('__SPRINT_') && key.endsWith('__')) {
      const value = record[key];
      if (value != null && value !== '' && typeof value === 'string') {
        const trimmedValue = value.trim();
        if (trimmedValue && !sprints.includes(trimmedValue)) {
          sprints.push(trimmedValue);
        }
      }
    }
  }
  
  // Also check for regular keys that contain "sprint" (case-insensitive)
  // This handles cases where there's only one sprint column or other variations
  for (const key in record) {
    // Skip the special __SPRINT_*__ keys we already processed
    if (key && !key.startsWith('__SPRINT_') && key.toLowerCase().includes('sprint')) {
      const value = record[key];
      // Only add non-empty values
      if (value != null && value !== '') {
        // Handle both string and array values
        if (typeof value === 'string' && value.trim() !== '') {
          const trimmedValue = value.trim();
          if (trimmedValue && !sprints.includes(trimmedValue)) {
            sprints.push(trimmedValue);
          }
        } else if (Array.isArray(value)) {
          // If value is already an array, add each non-empty element
          for (const item of value) {
            if (item != null && item !== '' && typeof item === 'string') {
              const trimmedItem = item.trim();
              if (trimmedItem && !sprints.includes(trimmedItem)) {
                sprints.push(trimmedItem);
              }
            }
          }
        }
      }
    }
  }
  
  return sprints;
}

/**
 * Helper function to parse number
 */
function parseNumber(value: string | undefined): number | null {
  if (!value || value.trim() === '') {
    return null;
  }
  const parsed = parseFloat(value.trim());
  return isNaN(parsed) ? null : parsed;
}

/**
 * GET /api/data/epics
 * Get all epics
 */
router.get('/epics', async (req, res) => {
  try {
    const epics = await prisma.epic.findMany({
      orderBy: { created: 'desc' },
      take: 1000 // Limit to prevent huge responses
    });
    res.json({ success: true, data: epics });
  } catch (error: any) {
    logger.error('Failed to fetch epics', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/data/epics/upload
 * Upload CSV file and import epics
 */
router.post('/epics/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'CSV file is required' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parseCsv(csvContent);
    
    let processed = 0;
    let errors: string[] = [];

    for (const record of records) {
      try {
        // Map CSV columns to database fields
        const epicData: any = {
          issueKey: record['Issue key'] || record['Issue Key'] || record['Issue_key'],
          issueId: record['Issue id'] || record['Issue Id'] || record['Issue_id'],
          summary: record['Summary'] || '',
          issueType: record['Issue Type'] || record['Issue_Type'] || 'Epic',
          status: record['Status'] || '',
          statusCategory: record['Status Category'] || record['Status_Category'] || null,
          priority: record['Priority'] || null,
          resolution: record['Resolution'] || null,
          projectKey: record['Project key'] || record['Project Key'] || record['Project_key'] || '',
          projectName: record['Project name'] || record['Project Name'] || record['Project_name'] || null,
          projectType: record['Project type'] || record['Project Type'] || record['Project_type'] || null,
          projectLead: record['Project lead'] || record['Project Lead'] || record['Project_lead'] || null,
          projectLeadId: record['Project lead id'] || record['Project Lead Id'] || record['Project_lead_id'] || null,
          assignee: record['Assignee'] || null,
          assigneeId: record['Assignee Id'] || record['Assignee_Id'] || null,
          reporter: record['Reporter'] || null,
          reporterId: record['Reporter Id'] || record['Reporter_Id'] || null,
          creator: record['Creator'] || null,
          creatorId: record['Creator Id'] || record['Creator_Id'] || null,
          created: parseDate(record['Created']) || new Date(),
          updated: parseDate(record['Updated']) || new Date(),
          lastViewed: parseDate(record['Last Viewed'] || record['Last_Viewed']),
          resolved: parseDate(record['Resolved']),
          dueDate: parseDate(record['Due date'] || record['Due_date']),
          epicName: record['Epic Name'] || record['Epic_Name'] || record['Custom field (Epic Name)'] || null,
          epicStatus: record['Epic Status'] || record['Epic_Status'] || record['Custom field (Epic Status)'] || null,
          epicColor: record['Epic Color'] || record['Epic_Color'] || record['Custom field (Epic Color)'] || null,
          originalEstimate: parseNumber(record['Original estimate'] || record['Original_estimate']),
          remainingEstimate: parseNumber(record['Remaining Estimate'] || record['Remaining_Estimate']),
          timeSpent: parseNumber(record['Time Spent'] || record['Time_Spent']),
          workRatio: parseNumber(record['Work Ratio'] || record['Work_Ratio']),
          storyPoints: parseNumber(record['Story Points'] || record['Story_Points']),
          storyPointsOriginal: parseNumber(record['Story Points (original estimation)'] || record['Story_Points_Original']),
          storyPointsRemaining: parseNumber(record['Story Points (remaining estimation)'] || record['Story_Points_Remaining']),
          storyPointsRough: parseNumber(record['Story Points (rough estimation)'] || record['Story_Points_Rough']),
          description: record['Description'] || null,
          environment: record['Environment'] || null,
          fixVersions: record['Fix Versions'] || record['Fix_Versions'] || null,
          components: record['Components'] || null,
          labels: record['Labels'] || null,
          votes: parseNumber(record['Votes']) || 0,
          team: record['Team'] || record['Custom field (Team)'] || null,
          teamDevelopment: record['Team (Development)'] || record['Custom field (Team (Development))'] || null,
          productOwner: record['Product Owner'] || record['Custom field (Product owner)'] || null,
          category: record['Category'] || record['Custom field (Category)'] || null,
          complexity: record['Complexity'] || record['Custom field (Complexity)'] || null,
          commitment: record['Committment'] || record['Custom field (Committment)'] || null,
          customer: record['Customer'] || record['Custom field (Customer)'] || null,
          requestOrigin: record['Request Origin'] || record['Custom field (Request Origin)'] || null,
          requestType: record['Request Type'] || record['Custom field (Request Type)'] || null,
        };

        if (!epicData.issueKey || !epicData.summary || !epicData.status) {
          errors.push(`Row missing required fields: ${epicData.issueKey || 'unknown'}`);
          continue;
        }

        await prisma.epic.upsert({
          where: { issueKey: epicData.issueKey },
          update: epicData,
          create: epicData,
        });

        processed++;
      } catch (error: any) {
        errors.push(`Failed to import epic: ${error.message}`);
        logger.error('Failed to import epic row', { error: error.message, record });
      }
    }

    res.json({
      success: true,
      data: {
        processed,
        errors: errors.slice(0, 10), // Limit errors returned
        totalErrors: errors.length
      }
    });
  } catch (error: any) {
    logger.error('CSV import failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/data/stories
 * Get all stories
 */
router.get('/stories', async (req, res) => {
  try {
    const stories = await prisma.story.findMany({
      orderBy: { created: 'desc' },
      take: 1000
    });
    
    // Debug: Log sprints data for first few stories
    if (stories.length > 0) {
      const sampleStories = stories.slice(0, 3).map((s: any) => ({
        issueKey: s.issueKey,
        sprints: s.sprints,
        sprintsType: typeof s.sprints,
        isArray: Array.isArray(s.sprints),
        sprintsLength: Array.isArray(s.sprints) ? s.sprints.length : 'N/A',
        sprintsRaw: JSON.stringify(s.sprints),
        hasSprints: s.sprints !== null && s.sprints !== undefined
      }));
      logger.info('Sample sprints data from database', { sampleStories });
    }
    
    // Ensure sprints is always an array (handle potential null/undefined)
    const storiesWithSprints = stories.map((story: any) => {
      let sprintsArray: string[] = [];
      
      // Check if sprints field exists and has data
      if (story.sprints !== null && story.sprints !== undefined) {
        if (Array.isArray(story.sprints)) {
          // Filter out empty strings
          sprintsArray = story.sprints
            .map((s: any) => String(s).trim())
            .filter((s: string) => s !== '');
        } else if (typeof story.sprints === 'string') {
          // Handle string representation of array
          const trimmed = story.sprints.trim();
          if (trimmed) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) {
                sprintsArray = parsed
                  .map((s: any) => String(s).trim())
                  .filter((s: string) => s !== '');
              } else {
                sprintsArray = [trimmed];
              }
            } catch {
              // If not JSON, treat as single value
              sprintsArray = [trimmed];
            }
          }
        }
      }
      
      return {
        ...story,
        sprints: sprintsArray
      };
    });
    
    res.json({ success: true, data: storiesWithSprints });
  } catch (error: any) {
    logger.error('Failed to fetch stories', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/data/stories/preview
 * Preview CSV file and analyze duplicates
 */
router.post('/stories/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'CSV file is required' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parseCsv(csvContent);
    
    // Get all existing issue keys from database
    const existingStories = await prisma.story.findMany({
      select: { issueKey: true }
    });
    const existingIssueKeys = new Set(existingStories.map(s => s.issueKey));
    
    // Analyze records
    const previewRecords: any[] = [];
    let duplicateCount = 0;
    let uniqueCount = 0;
    let invalidCount = 0;
    
    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      const issueKey = record['Issue key'] || record['Issue Key'] || record['Issue_key'];
      const summary = record['Summary'] || '';
      const status = record['Status'] || '';
      
      // Check if record has required fields
      if (!issueKey || !summary || !status) {
        invalidCount++;
        continue;
      }
      
      const isDuplicate = existingIssueKeys.has(issueKey);
      if (isDuplicate) {
        duplicateCount++;
      } else {
        uniqueCount++;
      }
      
      // Prepare preview data (limit to first 50 records for preview)
      if (previewRecords.length < 50) {
        previewRecords.push({
          issueKey,
          summary: summary.length > 100 ? summary.substring(0, 100) + '...' : summary,
          status,
          assignee: record['Assignee'] || null,
          storyPoints: parseNumber(record['Story Points'] || record['Story_Points'] || record['Custom field (Story Points)']),
          sprints: collectSprints(record),
          isDuplicate
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        totalRecords: records.length,
        duplicateCount,
        uniqueCount,
        invalidCount,
        previewRecords
      }
    });
  } catch (error: any) {
    logger.error('Failed to preview stories', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/data/stories/upload
 * Upload CSV file and import stories
 */
router.post('/stories/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'CSV file is required' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parseCsv(csvContent);
    
    let processed = 0;
    let errors: string[] = [];

    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      const rowNumber = index + 2; // +2 because CSV rows are 1-indexed and we skip the header
      let storyData: any = null;
      
      try {
        storyData = {
          issueKey: record['Issue key'] || record['Issue Key'] || record['Issue_key'],
          issueId: record['Issue id'] || record['Issue Id'] || record['Issue_id'],
          summary: record['Summary'] || '',
          issueType: record['Issue Type'] || record['Issue_Type'] || 'Story',
          status: record['Status'] || '',
          statusCategory: record['Status Category'] || record['Status_Category'] || null,
          priority: record['Priority'] || null,
          resolution: record['Resolution'] || null,
          projectKey: record['Project key'] || record['Project Key'] || record['Project_key'] || '',
          projectName: record['Project name'] || record['Project Name'] || record['Project_name'] || null,
          projectType: record['Project type'] || record['Project Type'] || record['Project_type'] || null,
          projectLead: record['Project lead'] || record['Project Lead'] || record['Project_lead'] || null,
          projectLeadId: record['Project lead id'] || record['Project Lead Id'] || record['Project_lead_id'] || null,
          assignee: record['Assignee'] || null,
          assigneeId: record['Assignee Id'] || record['Assignee_Id'] || null,
          reporter: record['Reporter'] || null,
          reporterId: record['Reporter Id'] || record['Reporter_Id'] || null,
          creator: record['Creator'] || null,
          creatorId: record['Creator Id'] || record['Creator_Id'] || null,
          resolvedBy: record['Resolved by'] || record['Resolved By'] || record['Resolved_by'] || null,
          resolvedById: record['Resolved by)Id'] || record['Resolved_By_Id'] || null,
          created: parseDate(record['Created']) || new Date(),
          updated: parseDate(record['Updated']) || new Date(),
          lastViewed: parseDate(record['Last Viewed'] || record['Last_Viewed']),
          resolved: parseDate(record['Resolved']),
          dueDate: parseDate(record['Due date'] || record['Due_date']),
          actualStart: parseDate(record['Custom field (Actual start)'] || record['Actual_start']),
          actualEnd: parseDate(record['Custom field (Actual end)'] || record['Actual_end']),
          plannedStart: parseDate(record['Custom field (Planned start)'] || record['Planned_start']),
          plannedEnd: parseDate(record['Custom field (Planned end)'] || record['Planned_end']),
          targetStart: parseDate(record['Custom field (Target start)'] || record['Target_start']),
          targetEnd: parseDate(record['Custom field (Target end)'] || record['Target_end']),
          parentId: record['Parent'] || record['Parent Id'] || null,
          parentKey: record['Parent key'] || record['Parent Key'] || record['Parent_key'] || null,
          parentSummary: record['Parent summary'] || record['Parent Summary'] || record['Parent_summary'] || null,
          epicName: record['Epic Name'] || record['Custom field (Epic Name)'] || null,
          epicStatus: record['Epic Status'] || record['Custom field (Epic Status)'] || null,
          epicColor: record['Epic Color'] || record['Custom field (Epic Color)'] || null,
          sprints: collectSprints(record),
          originalEstimate: parseNumber(record['Original estimate'] || record['Original_estimate']),
          remainingEstimate: parseNumber(record['Remaining Estimate'] || record['Remaining_Estimate']),
          timeSpent: parseNumber(record['Time Spent'] || record['Time_Spent']),
          workRatio: parseNumber(record['Work Ratio'] || record['Work_Ratio']),
          totalOriginalEstimate: parseNumber(record['Σ Original Estimate'] || record['Total_Original_Estimate']),
          totalRemainingEstimate: parseNumber(record['Σ Remaining Estimate'] || record['Total_Remaining_Estimate']),
          totalTimeSpent: parseNumber(record['Σ Time Spent'] || record['Total_Time_Spent']),
          storyPoints: parseNumber(record['Story Points'] || record['Story_Points'] || record['Custom field (Story Points)']),
          storyPointsOriginal: parseNumber(record['Story Points (original estimation)'] || record['Custom field (Story Points (original estimation))']),
          storyPointsRemaining: parseNumber(record['Story Points (remaining estimation)'] || record['Custom field (Story Points (remaining estimation))']),
          storyPointsRough: parseNumber(record['Story Points (rough estimation)'] || record['Custom field (Story Points (rough estimation))']),
          storyPointsMagic: parseNumber(record['Story Points (magic estimation)'] || record['Custom field (Story Points (magic estimation))']),
          description: record['Description'] || null,
          environment: record['Environment'] || null,
          components: record['Components'] || null,
          labels: record['Labels'] || null,
          votes: parseNumber(record['Votes']) || 0,
          securityLevel: record['Security Level'] || record['Security_Level'] || null,
          attachments: record['Attachment'] || record['Attachments'] || null,
          inwardLinks: record['Inward issue link (Cloners)'] || null,
          outwardLinks: record['Outward issue link (Cloners)'] || null,
          team: record['Team'] || record['Custom field (Team)'] || null,
          teamDevelopment: record['Team (Development)'] || record['Custom field (Team (Development))'] || null,
          productOwner: record['Product Owner'] || record['Custom field (Product owner)'] || null,
          category: record['Category'] || record['Custom field (Category)'] || null,
          complexity: record['Complexity'] || record['Custom field (Complexity)'] || null,
          commitment: record['Committment'] || record['Custom field (Committment)'] || null,
          customer: record['Customer'] || record['Custom field (Customer)'] || null,
          requestOrigin: record['Request Origin'] || record['Custom field (Request Origin)'] || null,
          requestType: record['Request Type'] || record['Custom field (Request Type)'] || null,
          issueOrigin: record['Issue origin'] || record['Custom field (Issue origin)'] || null,
          workCategory: record['Work category'] || record['Custom field (Work category)'] || null,
          checklistCompleted: record['Custom field (Checklist Completed)'] || null,
          checklistProgress: record['Custom field (Checklist Progress)'] || null,
          checklistProgressPercent: parseNumber(record['Custom field (Checklist Progress %)']),
          checklistText: record['Custom field (Checklist Text)'] || null,
          testAutomationRequired: record['Custom field (Test automation required)'] || null,
          testCases: record['Custom field (Test cases)'] || null,
          testPlan: record['Custom field (Test plan)'] || null,
          dateApprovalDone: parseDate(record['Custom field (Date (Approval done))']),
          dateConceptDone: parseDate(record['Custom field (Date (Concept done))']),
          dateDevelopmentDone: parseDate(record['Custom field (Date (Development done))']),
          dateTestDone: parseDate(record['Custom field (Date (Test done))']),
          dateGoLive: parseDate(record['Custom field (Date (Go Live))']),
          comments: record['Comment'] || record['Comments'] || null,
        };

        if (!storyData.issueKey || !storyData.summary || !storyData.status) {
          errors.push(`Row missing required fields: ${storyData.issueKey || 'unknown'}`);
          continue;
        }

        await prisma.story.upsert({
          where: { issueKey: storyData.issueKey },
          update: storyData,
          create: storyData,
        });

        processed++;
      } catch (error: any) {
        const issueKey = storyData?.issueKey || record['Issue key'] || record['Issue Key'] || record['Issue_key'] || 'unknown';
        const errorMessage = error.message || 'Unknown error';
        const errorStack = error.stack || '';
        
        // Extract Prisma-specific error details if available
        const prismaErrorCode = error.code || null;
        const prismaMeta = error.meta || null;
        
        const errorDetails = `Row ${rowNumber} (Issue: ${issueKey}): ${errorMessage}${prismaErrorCode ? ` [Code: ${prismaErrorCode}]` : ''}`;
        errors.push(errorDetails);
        
        // Build comprehensive error message string since logger only outputs message, not metadata
        const summary = record['Summary'] || 'N/A';
        const status = record['Status'] || 'N/A';
        const sprints = storyData?.sprints || [];
        const metaInfo = prismaMeta ? ` | Meta: ${JSON.stringify(prismaMeta)}` : '';
        const stackInfo = errorStack ? ` | Stack: ${errorStack.split('\n')[0]}` : '';
        
        const detailedErrorMsg = `Failed to import story row | Row: ${rowNumber} | Issue: ${issueKey} | Summary: ${summary} | Status: ${status} | Error: ${errorMessage}${prismaErrorCode ? ` | Code: ${prismaErrorCode}` : ''}${metaInfo}${stackInfo} | Sprints: ${JSON.stringify(sprints)}`;
        
        logger.error(detailedErrorMsg);
      }
    }

    res.json({
      success: true,
      data: {
        processed,
        errors: errors.slice(0, 10),
        totalErrors: errors.length
      }
    });
  } catch (error: any) {
    logger.error('CSV import failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/data/subtasks
 * Get all subtasks
 */
router.get('/subtasks', async (req, res) => {
  try {
    const subtasks = await prisma.subtask.findMany({
      orderBy: { created: 'desc' },
      take: 1000
    });
    
    // Ensure sprints is always an array (handle potential null/undefined)
    const subtasksWithSprints = subtasks.map((subtask: any) => {
      let sprintsArray: string[] = [];
      
      // Check if sprints field exists and has data
      if (subtask.sprints !== null && subtask.sprints !== undefined) {
        if (Array.isArray(subtask.sprints)) {
          // Filter out empty strings
          sprintsArray = subtask.sprints
            .map((s: any) => String(s).trim())
            .filter((s: string) => s !== '');
        } else if (typeof subtask.sprints === 'string') {
          // Handle string representation of array
          const trimmed = subtask.sprints.trim();
          if (trimmed) {
            try {
              const parsed = JSON.parse(trimmed);
              if (Array.isArray(parsed)) {
                sprintsArray = parsed
                  .map((s: any) => String(s).trim())
                  .filter((s: string) => s !== '');
              } else {
                sprintsArray = [trimmed];
              }
            } catch {
              // If not JSON, treat as single value
              sprintsArray = [trimmed];
            }
          }
        }
      }
      
      return {
        ...subtask,
        sprints: sprintsArray
      };
    });
    
    res.json({ success: true, data: subtasksWithSprints });
  } catch (error: any) {
    logger.error('Failed to fetch subtasks', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/data/subtasks/preview
 * Preview CSV file and analyze duplicates
 */
router.post('/subtasks/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'CSV file is required' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parseCsv(csvContent);
    
    // Get all existing issue keys from database
    const existingSubtasks = await prisma.subtask.findMany({
      select: { issueKey: true }
    });
    const existingIssueKeys = new Set(existingSubtasks.map(s => s.issueKey));
    
    // Analyze records
    const previewRecords: any[] = [];
    let duplicateCount = 0;
    let uniqueCount = 0;
    let invalidCount = 0;
    
    for (let index = 0; index < records.length; index++) {
      const record = records[index];
      const issueKey = record['Issue key'] || record['Issue Key'] || record['Issue_key'];
      const summary = record['Summary'] || '';
      const status = record['Status'] || '';
      
      // Check if record has required fields
      if (!issueKey || !summary || !status) {
        invalidCount++;
        continue;
      }
      
      const isDuplicate = existingIssueKeys.has(issueKey);
      if (isDuplicate) {
        duplicateCount++;
      } else {
        uniqueCount++;
      }
      
      // Prepare preview data (limit to first 50 records for preview)
      if (previewRecords.length < 50) {
        previewRecords.push({
          issueKey,
          summary: summary.length > 100 ? summary.substring(0, 100) + '...' : summary,
          status,
          assignee: record['Assignee'] || null,
          storyPoints: parseNumber(record['Story Points'] || record['Story_Points'] || record['Custom field (Story Points)']),
          sprints: collectSprints(record),
          isDuplicate
        });
      }
    }
    
    res.json({
      success: true,
      data: {
        totalRecords: records.length,
        duplicateCount,
        uniqueCount,
        invalidCount,
        previewRecords
      }
    });
  } catch (error: any) {
    logger.error('Failed to preview subtasks', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/data/subtasks/upload
 * Upload CSV file and import subtasks
 */
router.post('/subtasks/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'CSV file is required' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parseCsv(csvContent);
    
    let processed = 0;
    let errors: string[] = [];

    for (const record of records) {
      try {
        const subtaskData: any = {
          issueKey: record['Issue key'] || record['Issue Key'] || record['Issue_key'],
          issueId: record['Issue id'] || record['Issue Id'] || record['Issue_id'],
          summary: record['Summary'] || '',
          issueType: record['Issue Type'] || record['Issue_Type'] || 'Sub-Task',
          status: record['Status'] || '',
          statusCategory: record['Status Category'] || record['Status_Category'] || null,
          priority: record['Priority'] || null,
          resolution: record['Resolution'] || null,
          projectKey: record['Project key'] || record['Project Key'] || record['Project_key'] || '',
          projectName: record['Project name'] || record['Project Name'] || record['Project_name'] || null,
          projectType: record['Project type'] || record['Project Type'] || record['Project_type'] || null,
          projectLead: record['Project lead'] || record['Project Lead'] || record['Project_lead'] || null,
          projectLeadId: record['Project lead id'] || record['Project Lead Id'] || record['Project_lead_id'] || null,
          assignee: record['Assignee'] || null,
          assigneeId: record['Assignee Id'] || record['Assignee_Id'] || null,
          reporter: record['Reporter'] || null,
          reporterId: record['Reporter Id'] || record['Reporter_Id'] || null,
          creator: record['Creator'] || null,
          creatorId: record['Creator Id'] || record['Creator_Id'] || null,
          resolvedBy: record['Resolved by'] || record['Resolved By'] || record['Resolved_by'] || null,
          resolvedById: record['Resolved by)Id'] || record['Resolved_By_Id'] || null,
          created: parseDate(record['Created']) || new Date(),
          updated: parseDate(record['Updated']) || new Date(),
          lastViewed: parseDate(record['Last Viewed'] || record['Last_Viewed']),
          resolved: parseDate(record['Resolved']),
          dueDate: parseDate(record['Due date'] || record['Due_date']),
          actualStart: parseDate(record['Custom field (Actual start)'] || record['Actual_start']),
          actualEnd: parseDate(record['Custom field (Actual end)'] || record['Actual_end']),
          plannedStart: parseDate(record['Custom field (Planned start)'] || record['Planned_start']),
          plannedEnd: parseDate(record['Custom field (Planned end)'] || record['Planned_end']),
          targetStart: parseDate(record['Custom field (Target start)'] || record['Target_start']),
          targetEnd: parseDate(record['Custom field (Target end)'] || record['Target_end']),
          parentId: record['Parent'] || record['Parent Id'] || null,
          parentKey: record['Parent key'] || record['Parent Key'] || record['Parent_key'] || null,
          parentSummary: record['Parent summary'] || record['Parent Summary'] || record['Parent_summary'] || null,
          epicName: record['Epic Name'] || record['Custom field (Epic Name)'] || null,
          epicStatus: record['Epic Status'] || record['Custom field (Epic Status)'] || null,
          epicColor: record['Epic Color'] || record['Custom field (Epic Color)'] || null,
          sprints: collectSprints(record),
          originalEstimate: parseNumber(record['Original estimate'] || record['Original_estimate']),
          remainingEstimate: parseNumber(record['Remaining Estimate'] || record['Remaining_Estimate']),
          timeSpent: parseNumber(record['Time Spent'] || record['Time_Spent']),
          workRatio: parseNumber(record['Work Ratio'] || record['Work_Ratio']),
          totalOriginalEstimate: parseNumber(record['Σ Original Estimate'] || record['Total_Original_Estimate']),
          totalRemainingEstimate: parseNumber(record['Σ Remaining Estimate'] || record['Total_Remaining_Estimate']),
          totalTimeSpent: parseNumber(record['Σ Time Spent'] || record['Total_Time_Spent']),
          storyPoints: parseNumber(record['Story Points'] || record['Story_Points'] || record['Custom field (Story Points)']),
          storyPointsOriginal: parseNumber(record['Story Points (original estimation)'] || record['Custom field (Story Points (original estimation))']),
          storyPointsRemaining: parseNumber(record['Story Points (remaining estimation)'] || record['Custom field (Story Points (remaining estimation))']),
          storyPointsRough: parseNumber(record['Story Points (rough estimation)'] || record['Custom field (Story Points (rough estimation))']),
          storyPointsMagic: parseNumber(record['Story Points (magic estimation)'] || record['Custom field (Story Points (magic estimation))']),
          description: record['Description'] || null,
          environment: record['Environment'] || null,
          components: record['Components'] || null,
          labels: record['Labels'] || null,
          votes: parseNumber(record['Votes']) || 0,
          securityLevel: record['Security Level'] || record['Security_Level'] || null,
          watchers: record['Watchers'] || null,
          watchersId: record['Watchers Id'] || record['Watchers_Id'] || null,
          attachments: record['Attachment'] || record['Attachments'] || null,
          inwardLinksCloners: record['Inward issue link (Cloners)'] || null,
          outwardLinksCloners: record['Outward issue link (Cloners)'] || null,
          inwardLinksRelates: record['Inward issue link (Relates)'] || null,
          team: record['Team'] || record['Custom field (Team)'] || null,
          teamDevelopment: record['Team (Development)'] || record['Custom field (Team (Development))'] || null,
          productOwner: record['Product Owner'] || record['Custom field (Product owner)'] || null,
          category: record['Category'] || record['Custom field (Category)'] || null,
          complexity: record['Complexity'] || record['Custom field (Complexity)'] || null,
          commitment: record['Committment'] || record['Custom field (Committment)'] || null,
          customer: record['Customer'] || record['Custom field (Customer)'] || null,
          requestOrigin: record['Request Origin'] || record['Custom field (Request Origin)'] || null,
          requestType: record['Request Type'] || record['Custom field (Request Type)'] || null,
          issueOrigin: record['Issue origin'] || record['Custom field (Issue origin)'] || null,
          workCategory: record['Work category'] || record['Custom field (Work category)'] || null,
          checklistCompleted: record['Custom field (Checklist Completed)'] || null,
          checklistProgress: record['Custom field (Checklist Progress)'] || null,
          checklistProgressPercent: parseNumber(record['Custom field (Checklist Progress %)']),
          checklistText: record['Custom field (Checklist Text)'] || null,
          testAutomationRequired: record['Custom field (Test automation required)'] || null,
          testCases: record['Custom field (Test cases)'] || null,
          testPlan: record['Custom field (Test plan)'] || null,
          dateApprovalDone: parseDate(record['Custom field (Date (Approval done))']),
          dateConceptDone: parseDate(record['Custom field (Date (Concept done))']),
          dateDevelopmentDone: parseDate(record['Custom field (Date (Development done))']),
          dateTestDone: parseDate(record['Custom field (Date (Test done))']),
          dateGoLive: parseDate(record['Custom field (Date (Go Live))']),
          dateApprovalProductionEnv: parseDate(record['Custom field (Date (Approval Production Env))']),
          dateApprovalStagingEnv: parseDate(record['Custom field (Date (Approval Staging Env))']),
          dateApprovalTestEnv: parseDate(record['Custom field (Date (Approval Test Env))']),
          slaStartDate: parseDate(record['Custom field (SLA Start date)']),
          slaTargetDate: parseDate(record['Custom field (SLA Target date)']),
          timeToFirstResponse: record['Custom field (Time to first response)'] || null,
          timeToResolution: record['Custom field (Time to resolution)'] || null,
          dateOfFirstResponse: parseDate(record['Custom field ([CHART] Date of First Response)']),
          timeInStatus: record['Custom field ([CHART] Time in Status)'] || null,
          comments: record['Comment'] || record['Comments'] || null,
        };

        if (!subtaskData.issueKey || !subtaskData.summary || !subtaskData.status) {
          errors.push(`Row missing required fields: ${subtaskData.issueKey || 'unknown'}`);
          continue;
        }

        await prisma.subtask.upsert({
          where: { issueKey: subtaskData.issueKey },
          update: subtaskData,
          create: subtaskData,
        });

        processed++;
      } catch (error: any) {
        errors.push(`Failed to import subtask: ${error.message}`);
        logger.error('Failed to import subtask row', { error: error.message });
      }
    }

    res.json({
      success: true,
      data: {
        processed,
        errors: errors.slice(0, 10),
        totalErrors: errors.length
      }
    });
  } catch (error: any) {
    logger.error('CSV import failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/data/bugs
 * Get all bugs
 */
router.get('/bugs', async (req, res) => {
  try {
    const bugs = await prisma.bugNewDev.findMany({
      orderBy: { created: 'desc' },
      take: 1000
    });
    
    // Ensure sprints is always an array (handle potential null/undefined)
    const bugsWithSprints = bugs.map((bug: any) => {
      let sprintsArray: string[] = [];
      
      // Check if sprints field exists and has data
      if (bug.sprints !== null && bug.sprints !== undefined) {
        if (Array.isArray(bug.sprints)) {
          sprintsArray = bug.sprints.filter((s: any) => s && s.trim() !== '');
        } else if (typeof bug.sprints === 'string') {
          try {
            const parsed = JSON.parse(bug.sprints);
            if (Array.isArray(parsed)) {
              sprintsArray = parsed.filter((s: any) => s && s.trim() !== '');
            } else {
              sprintsArray = bug.sprints.trim() ? [bug.sprints] : [];
            }
          } catch {
            sprintsArray = bug.sprints.trim() ? [bug.sprints] : [];
          }
        }
      }
      
      return {
        ...bug,
        sprints: sprintsArray
      };
    });
    
    logger.info('Bugs data fetched successfully', { count: bugsWithSprints.length });
    res.json({ success: true, data: bugsWithSprints });
  } catch (error: any) {
    logger.error('Failed to fetch bugs', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/data/bugs/preview
 * Preview CSV file and analyze duplicates
 */
router.post('/bugs/preview', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'CSV file is required' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parseCsv(csvContent);
    
    // Get all existing issue keys from database
    const existingBugs = await prisma.bugNewDev.findMany({
      select: { issueKey: true }
    });
    const existingIssueKeys = new Set(existingBugs.map(b => b.issueKey));
    
    // Analyze records
    const previewRecords: any[] = [];
    let duplicateCount = 0;
    let uniqueCount = 0;
    let invalidCount = 0;
    
    for (let index = 0; index < Math.min(records.length, 50); index++) {
      const record = records[index];
      const issueKey = record['Issue key'] || record['Issue Key'] || record['Issue_key'];
      
      if (!issueKey) {
        invalidCount++;
        continue;
      }
      
      const isDuplicate = existingIssueKeys.has(issueKey);
      if (isDuplicate) {
        duplicateCount++;
      } else {
        uniqueCount++;
      }
      
      previewRecords.push({
        issueKey,
        summary: record['Summary'] || '',
        status: record['Status'] || '',
        assignee: record['Assignee'] || null,
        storyPoints: parseNumber(record['Story Points'] || record['Story_Points'] || record['Custom field (Story Points)']) || null,
        sprints: collectSprints(record),
        isDuplicate
      });
    }
    
    // Count remaining records
    for (let index = 50; index < records.length; index++) {
      const record = records[index];
      const issueKey = record['Issue key'] || record['Issue Key'] || record['Issue_key'];
      
      if (!issueKey) {
        invalidCount++;
        continue;
      }
      
      const isDuplicate = existingIssueKeys.has(issueKey);
      if (isDuplicate) {
        duplicateCount++;
      } else {
        uniqueCount++;
      }
    }
    
    res.json({
      success: true,
      data: {
        totalRecords: records.length,
        duplicateCount,
        uniqueCount,
        invalidCount,
        previewRecords
      }
    });
  } catch (error: any) {
    logger.error('Failed to preview bugs', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/data/bugs/upload
 * Upload CSV file and import bugs
 */
router.post('/bugs/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'CSV file is required' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const records = parseCsv(csvContent);
    
    let processed = 0;
    let errors: string[] = [];

    for (const record of records) {
      try {
        const bugData: any = {
          issueKey: record['Issue key'] || record['Issue Key'] || record['Issue_key'],
          issueId: record['Issue id'] || record['Issue Id'] || record['Issue_id'],
          summary: record['Summary'] || '',
          issueType: record['Issue Type'] || record['Issue_Type'] || 'Bug (new development)',
          status: record['Status'] || '',
          statusCategory: record['Status Category'] || record['Status_Category'] || null,
          priority: record['Priority'] || null,
          resolution: record['Resolution'] || null,
          projectKey: record['Project key'] || record['Project Key'] || record['Project_key'] || '',
          projectName: record['Project name'] || record['Project Name'] || record['Project_name'] || null,
          projectType: record['Project type'] || record['Project Type'] || record['Project_type'] || null,
          projectLead: record['Project lead'] || record['Project Lead'] || record['Project_lead'] || null,
          projectLeadId: record['Project lead id'] || record['Project Lead Id'] || record['Project_lead_id'] || null,
          assignee: record['Assignee'] || null,
          assigneeId: record['Assignee Id'] || record['Assignee_Id'] || null,
          reporter: record['Reporter'] || null,
          reporterId: record['Reporter Id'] || record['Reporter_Id'] || null,
          creator: record['Creator'] || null,
          creatorId: record['Creator Id'] || record['Creator_Id'] || null,
          resolvedBy: record['Resolved by'] || record['Resolved By'] || record['Resolved_by'] || null,
          resolvedById: record['Resolved by)Id'] || record['Resolved_By_Id'] || null,
          created: parseDate(record['Created']) || new Date(),
          updated: parseDate(record['Updated']) || new Date(),
          lastViewed: parseDate(record['Last Viewed'] || record['Last_Viewed']),
          resolved: parseDate(record['Resolved']),
          dueDate: parseDate(record['Due date'] || record['Due_date']),
          actualStart: parseDate(record['Custom field (Actual start)'] || record['Actual_start']),
          actualEnd: parseDate(record['Custom field (Actual end)'] || record['Actual_end']),
          plannedStart: parseDate(record['Custom field (Planned start)'] || record['Planned_start']),
          plannedEnd: parseDate(record['Custom field (Planned end)'] || record['Planned_end']),
          targetStart: parseDate(record['Custom field (Target start)'] || record['Target_start']),
          targetEnd: parseDate(record['Custom field (Target end)'] || record['Target_end']),
          parentId: record['Parent'] || record['Parent Id'] || null,
          parentKey: record['Parent key'] || record['Parent Key'] || record['Parent_key'] || null,
          parentSummary: record['Parent summary'] || record['Parent Summary'] || record['Parent_summary'] || null,
          epicName: record['Epic Name'] || record['Custom field (Epic Name)'] || null,
          epicStatus: record['Epic Status'] || record['Custom field (Epic Status)'] || null,
          epicColor: record['Epic Color'] || record['Custom field (Epic Color)'] || null,
          sprints: collectSprints(record),
          originalEstimate: parseNumber(record['Original estimate'] || record['Original_estimate']),
          remainingEstimate: parseNumber(record['Remaining Estimate'] || record['Remaining_Estimate']),
          timeSpent: parseNumber(record['Time Spent'] || record['Time_Spent']),
          workRatio: parseNumber(record['Work Ratio'] || record['Work_Ratio']),
          totalOriginalEstimate: parseNumber(record['Σ Original Estimate'] || record['Total_Original_Estimate']),
          totalRemainingEstimate: parseNumber(record['Σ Remaining Estimate'] || record['Total_Remaining_Estimate']),
          totalTimeSpent: parseNumber(record['Σ Time Spent'] || record['Total_Time_Spent']),
          storyPoints: parseNumber(record['Story Points'] || record['Story_Points'] || record['Custom field (Story Points)']),
          storyPointsOriginal: parseNumber(record['Story Points (original estimation)'] || record['Custom field (Story Points (original estimation))']),
          storyPointsRemaining: parseNumber(record['Story Points (remaining estimation)'] || record['Custom field (Story Points (remaining estimation))']),
          storyPointsRough: parseNumber(record['Story Points (rough estimation)'] || record['Custom field (Story Points (rough estimation))']),
          storyPointsMagic: parseNumber(record['Story Points (magic estimation)'] || record['Custom field (Story Points (magic estimation))']),
          description: record['Description'] || null,
          environment: record['Environment'] || null,
          components: record['Components'] || null,
          labels: record['Labels'] || null,
          votes: parseNumber(record['Votes']) || 0,
          securityLevel: record['Security Level'] || record['Security_Level'] || null,
          attachments: record['Attachment'] || record['Attachments'] || null,
          team: record['Team'] || record['Custom field (Team)'] || null,
          teamDevelopment: record['Team (Development)'] || record['Custom field (Team (Development))'] || null,
          productOwner: record['Product Owner'] || record['Custom field (Product owner)'] || null,
          category: record['Category'] || record['Custom field (Category)'] || null,
          complexity: record['Complexity'] || record['Custom field (Complexity)'] || null,
          commitment: record['Committment'] || record['Custom field (Committment)'] || null,
          customer: record['Customer'] || record['Custom field (Customer)'] || null,
          requestOrigin: record['Request Origin'] || record['Custom field (Request Origin)'] || null,
          requestType: record['Request Type'] || record['Custom field (Request Type)'] || null,
          issueOrigin: record['Issue origin'] || record['Custom field (Issue origin)'] || null,
          workCategory: record['Work category'] || record['Custom field (Work category)'] || null,
          checklistCompleted: record['Custom field (Checklist Completed)'] || null,
          checklistProgress: record['Custom field (Checklist Progress)'] || null,
          checklistProgressPercent: parseNumber(record['Custom field (Checklist Progress %)']),
          checklistText: record['Custom field (Checklist Text)'] || null,
          testAutomationRequired: record['Custom field (Test automation required)'] || null,
          testCases: record['Custom field (Test cases)'] || null,
          testPlan: record['Custom field (Test plan)'] || null,
          affectedArtifacts: record['Custom field (Affected artifacts)'] || null,
          affectedHardware: record['Custom field (Affected hardware)'] || null,
          affectedServices: record['Custom field (Affected services)'] || null,
          incidentId: record['Custom field (Incident ID)'] || null,
          incidentActive: record['Custom field (Incident active)'] || null,
          majorIncident: record['Custom field (Major incident)'] || null,
          vulnerability: record['Custom field (Vulnerability)'] || null,
          dateApprovalDone: parseDate(record['Custom field (Date (Approval done))']),
          dateConceptDone: parseDate(record['Custom field (Date (Concept done))']),
          dateDevelopmentDone: parseDate(record['Custom field (Date (Development done))']),
          dateTestDone: parseDate(record['Custom field (Date (Test done))']),
          dateGoLive: parseDate(record['Custom field (Date (Go Live))']),
          dateApprovalProductionEnv: parseDate(record['Custom field (Date (Approval Production Env))']),
          dateApprovalStagingEnv: parseDate(record['Custom field (Date (Approval Staging Env))']),
          dateApprovalTestEnv: parseDate(record['Custom field (Date (Approval Test Env))']),
          slaStartDate: parseDate(record['Custom field (SLA Start date)']),
          slaTargetDate: parseDate(record['Custom field (SLA Target date)']),
          timeToFirstResponse: record['Custom field (Time to first response)'] || null,
          timeToResolution: record['Custom field (Time to resolution)'] || null,
          dateOfFirstResponse: parseDate(record['Custom field ([CHART] Date of First Response)']),
          timeInStatus: record['Custom field ([CHART] Time in Status)'] || null,
          satisfactionRating: record['Satisfaction rating'] || record['Custom field (Satisfaction rating)'] || null,
          satisfactionDate: parseDate(record['Custom field (Satisfaction date)']),
          sentiment: record['Custom field (Sentiment)'] || null,
          solutionApproach: record['Custom field (Solution approach)'] || null,
          solutionProposal: record['Custom field (Solution proposal)'] || null,
          solutionQuality: record['Custom field (Solution quality)'] || null,
          comments: record['Comment'] || record['Comments'] || null,
        };

        if (!bugData.issueKey || !bugData.summary || !bugData.status) {
          errors.push(`Row missing required fields: ${bugData.issueKey || 'unknown'}`);
          continue;
        }

        await prisma.bugNewDev.upsert({
          where: { issueKey: bugData.issueKey },
          update: bugData,
          create: bugData,
        });

        processed++;
      } catch (error: any) {
        errors.push(`Failed to import bug: ${error.message}`);
        logger.error('Failed to import bug row', { error: error.message });
      }
    }

    res.json({
      success: true,
      data: {
        processed,
        errors: errors.slice(0, 10),
        totalErrors: errors.length
      }
    });
  } catch (error: any) {
    logger.error('CSV import failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/data/sprints
 * Get all unique sprints
 */
router.get('/sprints', async (req, res) => {
  try {
    // Get all sprints from stories, subtasks, and bugs
    const [stories, subtasks, bugs] = await Promise.all([
      prisma.story.findMany({ select: { sprints: true } }),
      prisma.subtask.findMany({ select: { sprints: true } }),
      prisma.bugNewDev.findMany({ select: { sprints: true } })
    ]);

    // Collect all unique sprints
    const sprintSet = new Set<string>();
    
    [...stories, ...subtasks, ...bugs].forEach(item => {
      if (item.sprints && Array.isArray(item.sprints)) {
        item.sprints.forEach((sprint: string) => {
          if (sprint && sprint.trim()) {
            sprintSet.add(sprint.trim());
          }
        });
      }
    });

    const sprints = Array.from(sprintSet).sort();
    
    res.json({ success: true, data: sprints });
  } catch (error: any) {
    logger.error('Failed to fetch sprints', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/data/sprints/:sprintName/statistics
 * Get statistics for a specific sprint
 */
router.get('/sprints/:sprintName/statistics', async (req, res) => {
  try {
    const sprintName = decodeURIComponent(req.params.sprintName);
    
    // Get all tickets that contain this sprint
    const [stories, subtasks, bugs] = await Promise.all([
      prisma.story.findMany({
        where: {
          sprints: {
            has: sprintName
          }
        }
      }),
      prisma.subtask.findMany({
        where: {
          sprints: {
            has: sprintName
          }
        }
      }),
      prisma.bugNewDev.findMany({
        where: {
          sprints: {
            has: sprintName
          }
        }
      })
    ]);

    // Calculate statistics
    const totalTickets = stories.length + subtasks.length + bugs.length;
    
    // Status breakdown
    const statusBreakdown: Record<string, number> = {};
    [...stories, ...subtasks, ...bugs].forEach(ticket => {
      const status = ticket.status || 'Unknown';
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });

    // Type breakdown
    const typeBreakdown = {
      stories: stories.length,
      subtasks: subtasks.length,
      bugs: bugs.length
    };

    // Story points
    const totalStoryPoints = [...stories, ...subtasks, ...bugs]
      .reduce((sum, ticket) => sum + (ticket.storyPoints || 0), 0);

    // Assignee breakdown
    const assigneeBreakdown: Record<string, number> = {};
    [...stories, ...subtasks, ...bugs].forEach(ticket => {
      const assignee = ticket.assignee || 'Unassigned';
      assigneeBreakdown[assignee] = (assigneeBreakdown[assignee] || 0) + 1;
    });

    // Team breakdown
    const teamBreakdown: Record<string, number> = {};
    [...stories, ...subtasks, ...bugs].forEach(ticket => {
      const team = ticket.team || 'No Team';
      teamBreakdown[team] = (teamBreakdown[team] || 0) + 1;
    });

    // Priority breakdown
    const priorityBreakdown: Record<string, number> = {};
    [...stories, ...subtasks, ...bugs].forEach(ticket => {
      const priority = ticket.priority || 'No Priority';
      priorityBreakdown[priority] = (priorityBreakdown[priority] || 0) + 1;
    });

    // Resolution breakdown (for bugs)
    const resolutionBreakdown: Record<string, number> = {};
    bugs.forEach(bug => {
      const resolution = bug.resolution || 'Unresolved';
      resolutionBreakdown[resolution] = (resolutionBreakdown[resolution] || 0) + 1;
    });

    // Dates
    const createdDates = [...stories, ...subtasks, ...bugs]
      .map(t => t.created)
      .filter(d => d)
      .sort();
    const resolvedDates = [...stories, ...subtasks, ...bugs]
      .map(t => (t as any).resolved)
      .filter(d => d)
      .sort();

    const earliestCreated = createdDates.length > 0 ? createdDates[0] : null;
    const latestCreated = createdDates.length > 0 ? createdDates[createdDates.length - 1] : null;
    const earliestResolved = resolvedDates.length > 0 ? resolvedDates[0] : null;
    const latestResolved = resolvedDates.length > 0 ? resolvedDates[resolvedDates.length - 1] : null;

    res.json({
      success: true,
      data: {
        sprintName,
        totalTickets,
        typeBreakdown,
        statusBreakdown,
        priorityBreakdown,
        resolutionBreakdown,
        assigneeBreakdown,
        teamBreakdown,
        totalStoryPoints,
        dates: {
          earliestCreated,
          latestCreated,
          earliestResolved,
          latestResolved
        },
        tickets: {
          stories: stories.map(s => ({
            issueKey: s.issueKey,
            summary: s.summary,
            status: s.status,
            assignee: s.assignee,
            storyPoints: s.storyPoints,
            priority: s.priority
          })),
          subtasks: subtasks.map(s => ({
            issueKey: s.issueKey,
            summary: s.summary,
            status: s.status,
            assignee: s.assignee,
            storyPoints: s.storyPoints,
            priority: s.priority
          })),
          bugs: bugs.map(b => ({
            issueKey: b.issueKey,
            summary: b.summary,
            status: b.status,
            assignee: b.assignee,
            storyPoints: b.storyPoints,
            priority: b.priority,
            resolution: b.resolution
          }))
        }
      }
    });
  } catch (error: any) {
    logger.error('Failed to fetch sprint statistics', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;

