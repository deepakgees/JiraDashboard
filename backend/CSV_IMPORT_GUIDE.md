# CSV Import Guide

This guide explains how to export data from Jira as CSV and import it into the dashboard.

## Overview

The CSV import feature allows you to:
- Export data directly from Jira as CSV files
- Import epics and issues without needing API authentication
- Work around authentication issues with the Jira API
- Import data in batches

## How to Export from Jira

### Step 1: Navigate to Your Jira Project
1. Log into your Jira instance
2. Go to your project (e.g., `https://your-domain.atlassian.net/browse/PROJ`)

### Step 2: Access Issues
1. Click on **Issues** in the left sidebar
2. Use filters to find the issues/epics you want to export
   - For Epics: Filter by `issuetype = Epic`
   - For Issues: Filter by `issuetype in (Task, Story, Bug)`

### Step 3: Export as CSV
1. Once you have the filtered list, click the **...** (three dots) menu at the top right
2. Select **Export** → **Export CSV**
3. The CSV file will download to your computer

### Step 4: Prepare the CSV File
1. Open the downloaded CSV file in Excel or a text editor
2. Ensure the following columns are present (see Required Columns below)
3. If needed, rename columns to match the required format
4. Save the file

## Required CSV Columns

### For Epics

**Required columns:**
- `jiraKey` - The epic key (e.g., "PROJ-123")
- `summary` - Epic summary/title
- `status` - Current status

**Optional columns:**
- `dueDate` - Due date (format: YYYY-MM-DD)
- `priority` - Priority level
- `fixVersions` - Fix versions (comma-separated)
- `roughEstimate` - Rough estimate (number)
- `originalEstimate` - Original estimate (number)
- `remainingEstimate` - Remaining estimate (number)

**Example Epic CSV:**
```csv
jiraKey,summary,status,dueDate,priority,roughEstimate
PROJ-123,Epic Title,In Progress,2024-12-31,High,5
PROJ-124,Another Epic,Done,2024-11-30,Medium,8
```

### For Issues

**Required columns:**
- `jiraKey` - The issue key (e.g., "PROJ-456")
- `issueType` - Issue type (e.g., "Task", "Story", "Bug")
- `summary` - Issue summary/title
- `status` - Current status
- `created` - Creation date (format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
- `updated` - Last update date (format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)

**Optional columns:**
- `dueDate` - Due date (format: YYYY-MM-DD)
- `resolved` - Resolution date (format: YYYY-MM-DD)
- `resolution` - Resolution type
- `storyPoints` - Story points (number)
- `epicLink` - Parent epic key
- `backlogPriority` - Backlog priority (number)
- `sprintState` - Sprint state (e.g., "active", "closed", "future")
- `lastAssignedSprint` - Sprint name
- `sprintStartDate` - Sprint start date (format: YYYY-MM-DD)
- `sprintEndDate` - Sprint end date (format: YYYY-MM-DD)

**Example Issue CSV:**
```csv
jiraKey,issueType,summary,status,created,updated,storyPoints,epicLink
PROJ-456,Story,User Story Title,In Progress,2024-01-15,2024-01-20,3,PROJ-123
PROJ-457,Task,Task Title,To Do,2024-01-16,2024-01-16,2,PROJ-123
```

## How to Import CSV

### Step 1: Access CSV Import Page
1. Log into the dashboard
2. Navigate to **CSV Import** from the sidebar (under Jira Import section)

### Step 2: Fill in Import Details
1. **Team Name**: Enter your team name (e.g., "Crank", "Marvin", "CodeRed")
2. **Project Key**: Enter your Jira project key (e.g., "SAPRM")
3. **Data Type**: Select either "Epic" or "Issue"
4. **CSV File**: Click "Choose File" and select your CSV file

### Step 3: Import
1. Click **Import CSV** button
2. Wait for the import to complete
3. Review the results:
   - Success message with number of records processed
   - Any errors that occurred during import

### Step 4: Verify Import
1. Go to **Jira Epics** or **Jira Issues** page
2. Filter by your team name and project key
3. Verify that your data appears correctly

## Date Format Guidelines

The CSV import supports multiple date formats:
- `YYYY-MM-DD` (e.g., 2024-01-15)
- `YYYY-MM-DDTHH:mm:ss` (e.g., 2024-01-15T10:30:00)
- `MM/DD/YYYY` (e.g., 01/15/2024)
- `MM-DD-YYYY` (e.g., 01-15-2024)

**Recommendation**: Use `YYYY-MM-DD` format for best compatibility.

## Common Issues and Solutions

### Issue: "Row missing required fields"
**Solution**: Ensure all required columns are present and have values. Check for empty rows.

### Issue: "Invalid date format"
**Solution**: Verify date columns use one of the supported formats. Ensure dates are not empty for required date fields.

### Issue: "Failed to import"
**Solution**: 
- Check that the CSV file is not corrupted
- Verify column names match exactly (case-sensitive)
- Ensure numeric fields contain valid numbers or are empty
- Check the error message for specific row issues

### Issue: "CSV file is required"
**Solution**: Make sure you selected a file before clicking Import.

## Tips for Best Results

1. **Export in Batches**: If you have many issues, export and import in smaller batches (e.g., 100-200 records at a time)

2. **Clean Your Data**: Before importing:
   - Remove any empty rows
   - Ensure required fields are filled
   - Check for special characters that might cause issues

3. **Verify Column Names**: Column names must match exactly (case-sensitive):
   - `jiraKey` (not `Jira Key` or `jira_key`)
   - `issueType` (not `Issue Type` or `issue_type`)

4. **Handle Duplicates**: The import uses `upsert` logic - if an epic/issue with the same `jiraKey` already exists, it will be updated rather than creating a duplicate.

5. **Test with Small Files First**: Start with a small CSV file (5-10 records) to verify everything works before importing large datasets.

## File Size Limits

- Maximum file size: 10 MB
- Recommended: Keep files under 5 MB for best performance
- For large datasets, split into multiple files

## Next Steps After Import

After successfully importing your CSV:
1. View imported data in **Jira Epics** or **Jira Issues** pages
2. Use the data for sprint planning in **Sprint Planning** page
3. Track import history in **Import Logs** page

## Support

If you encounter issues:
1. Check the error message for specific details
2. Review the CSV file format against the required columns
3. Verify your team name and project key are correct
4. Check the backend logs for detailed error information

