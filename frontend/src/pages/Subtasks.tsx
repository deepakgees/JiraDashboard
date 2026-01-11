import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { 
  ArrowUpTrayIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  XMarkIcon,
  Cog6ToothIcon,
  Bars3Icon,
  ChevronUpIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import apiClient from '../utils/api';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4001';

interface PreviewData {
  totalRecords: number;
  duplicateCount: number;
  uniqueCount: number;
  invalidCount: number;
  previewRecords: Array<{
    issueKey: string;
    summary: string;
    status: string;
    assignee: string | null;
    storyPoints: number | null;
    sprints: string[];
    isDuplicate: boolean;
  }>;
}

interface Subtask {
  id: number;
  issueKey: string;
  issueId: string;
  summary: string;
  issueType: string;
  status: string;
  statusCategory: string | null;
  priority: string | null;
  resolution: string | null;
  projectKey: string;
  projectName: string | null;
  projectType: string | null;
  assignee: string | null;
  assigneeId: string | null;
  reporter: string | null;
  reporterId: string | null;
  creator: string | null;
  creatorId: string | null;
  resolvedBy: string | null;
  resolvedById: string | null;
  created: string;
  updated: string;
  lastViewed: string | null;
  resolved: string | null;
  dueDate: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  targetStart: string | null;
  targetEnd: string | null;
  parentId: string | null;
  parentKey: string | null;
  parentSummary: string | null;
  epicName: string | null;
  epicStatus: string | null;
  epicColor: string | null;
  sprints: string[];
  originalEstimate: number | null;
  remainingEstimate: number | null;
  timeSpent: number | null;
  workRatio: number | null;
  totalOriginalEstimate: number | null;
  totalRemainingEstimate: number | null;
  totalTimeSpent: number | null;
  storyPoints: number | null;
  storyPointsOriginal: number | null;
  storyPointsRemaining: number | null;
  storyPointsRough: number | null;
  storyPointsMagic: number | null;
  description: string | null;
  environment: string | null;
  components: string | null;
  labels: string | null;
  votes: number;
  securityLevel: string | null;
  watchers: string | null;
  watchersId: string | null;
  attachments: string | null;
  inwardLinksCloners: string | null;
  outwardLinksCloners: string | null;
  inwardLinksRelates: string | null;
  team: string | null;
  teamDevelopment: string | null;
  productOwner: string | null;
  category: string | null;
  complexity: string | null;
  commitment: string | null;
  customer: string | null;
  requestOrigin: string | null;
  requestType: string | null;
  issueOrigin: string | null;
  workCategory: string | null;
  checklistCompleted: string | null;
  checklistProgress: string | null;
  checklistProgressPercent: number | null;
  checklistText: string | null;
  testAutomationRequired: string | null;
  testCases: string | null;
  testPlan: string | null;
  dateApprovalDone: string | null;
  dateConceptDone: string | null;
  dateDevelopmentDone: string | null;
  dateTestDone: string | null;
  dateGoLive: string | null;
  dateApprovalProductionEnv: string | null;
  dateApprovalStagingEnv: string | null;
  dateApprovalTestEnv: string | null;
  slaStartDate: string | null;
  slaTargetDate: string | null;
  timeToFirstResponse: string | null;
  timeToResolution: string | null;
  dateOfFirstResponse: string | null;
  timeInStatus: string | null;
  comments: string | null;
}

interface ColumnConfig {
  key: string;
  label: string;
  visible: boolean;
  order: number;
}

const ITEMS_PER_PAGE = 10;

// Default column configuration
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { key: 'issueKey', label: 'Issue Key', visible: true, order: 0 },
  { key: 'summary', label: 'Summary', visible: true, order: 1 },
  { key: 'status', label: 'Status', visible: true, order: 2 },
  { key: 'statusCategory', label: 'Status Category', visible: false, order: 3 },
  { key: 'priority', label: 'Priority', visible: true, order: 4 },
  { key: 'resolution', label: 'Resolution', visible: false, order: 5 },
  { key: 'issueType', label: 'Issue Type', visible: false, order: 6 },
  { key: 'projectKey', label: 'Project Key', visible: false, order: 7 },
  { key: 'projectName', label: 'Project Name', visible: false, order: 8 },
  { key: 'assignee', label: 'Assignee', visible: true, order: 9 },
  { key: 'reporter', label: 'Reporter', visible: false, order: 10 },
  { key: 'creator', label: 'Creator', visible: false, order: 11 },
  { key: 'resolvedBy', label: 'Resolved By', visible: false, order: 12 },
  { key: 'storyPoints', label: 'Story Points', visible: true, order: 13 },
  { key: 'sprints', label: 'Sprints', visible: true, order: 14 },
  { key: 'parentKey', label: 'Parent', visible: true, order: 15 },
  { key: 'parentSummary', label: 'Parent Summary', visible: false, order: 16 },
  { key: 'epicName', label: 'Epic Name', visible: false, order: 17 },
  { key: 'epicStatus', label: 'Epic Status', visible: false, order: 18 },
  { key: 'team', label: 'Team', visible: true, order: 19 },
  { key: 'teamDevelopment', label: 'Team (Dev)', visible: false, order: 20 },
  { key: 'productOwner', label: 'Product Owner', visible: false, order: 21 },
  { key: 'created', label: 'Created', visible: true, order: 22 },
  { key: 'updated', label: 'Updated', visible: false, order: 23 },
  { key: 'resolved', label: 'Resolved', visible: false, order: 24 },
  { key: 'dueDate', label: 'Due Date', visible: true, order: 25 },
  { key: 'actualStart', label: 'Actual Start', visible: false, order: 26 },
  { key: 'actualEnd', label: 'Actual End', visible: false, order: 27 },
  { key: 'plannedStart', label: 'Planned Start', visible: false, order: 28 },
  { key: 'plannedEnd', label: 'Planned End', visible: false, order: 29 },
  { key: 'targetStart', label: 'Target Start', visible: false, order: 30 },
  { key: 'targetEnd', label: 'Target End', visible: false, order: 31 },
  { key: 'originalEstimate', label: 'Original Estimate', visible: false, order: 32 },
  { key: 'remainingEstimate', label: 'Remaining Estimate', visible: false, order: 33 },
  { key: 'timeSpent', label: 'Time Spent', visible: false, order: 34 },
  { key: 'workRatio', label: 'Work Ratio', visible: false, order: 35 },
  { key: 'components', label: 'Components', visible: false, order: 36 },
  { key: 'labels', label: 'Labels', visible: false, order: 37 },
  { key: 'category', label: 'Category', visible: false, order: 38 },
  { key: 'complexity', label: 'Complexity', visible: false, order: 39 },
  { key: 'commitment', label: 'Commitment', visible: false, order: 40 },
  { key: 'customer', label: 'Customer', visible: false, order: 41 },
  { key: 'requestOrigin', label: 'Request Origin', visible: false, order: 42 },
  { key: 'requestType', label: 'Request Type', visible: false, order: 43 },
  { key: 'issueOrigin', label: 'Issue Origin', visible: false, order: 44 },
  { key: 'workCategory', label: 'Work Category', visible: false, order: 45 },
  { key: 'checklistCompleted', label: 'Checklist Completed', visible: false, order: 46 },
  { key: 'checklistProgress', label: 'Checklist Progress', visible: false, order: 47 },
  { key: 'checklistProgressPercent', label: 'Checklist Progress %', visible: false, order: 48 },
  { key: 'testAutomationRequired', label: 'Test Automation Required', visible: false, order: 49 },
  { key: 'testCases', label: 'Test Cases', visible: false, order: 50 },
  { key: 'testPlan', label: 'Test Plan', visible: false, order: 51 },
  { key: 'dateApprovalDone', label: 'Date Approval Done', visible: false, order: 52 },
  { key: 'dateConceptDone', label: 'Date Concept Done', visible: false, order: 53 },
  { key: 'dateDevelopmentDone', label: 'Date Development Done', visible: false, order: 54 },
  { key: 'dateTestDone', label: 'Date Test Done', visible: false, order: 55 },
  { key: 'dateGoLive', label: 'Date Go Live', visible: false, order: 56 },
  { key: 'dateApprovalProductionEnv', label: 'Date Approval Production Env', visible: false, order: 57 },
  { key: 'dateApprovalStagingEnv', label: 'Date Approval Staging Env', visible: false, order: 58 },
  { key: 'dateApprovalTestEnv', label: 'Date Approval Test Env', visible: false, order: 59 },
  { key: 'slaStartDate', label: 'SLA Start Date', visible: false, order: 60 },
  { key: 'slaTargetDate', label: 'SLA Target Date', visible: false, order: 61 },
  { key: 'timeToFirstResponse', label: 'Time to First Response', visible: false, order: 62 },
  { key: 'timeToResolution', label: 'Time to Resolution', visible: false, order: 63 },
  { key: 'dateOfFirstResponse', label: 'Date of First Response', visible: false, order: 64 },
  { key: 'timeInStatus', label: 'Time in Status', visible: false, order: 65 },
  { key: 'watchers', label: 'Watchers', visible: false, order: 66 },
  { key: 'attachments', label: 'Attachments', visible: false, order: 67 },
  { key: 'inwardLinksCloners', label: 'Inward Links (Cloners)', visible: false, order: 68 },
  { key: 'outwardLinksCloners', label: 'Outward Links (Cloners)', visible: false, order: 69 },
  { key: 'inwardLinksRelates', label: 'Inward Links (Relates)', visible: false, order: 70 },
];

const STORAGE_KEY = 'subtasks-column-config';

const Subtasks: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [showColumnConfig, setShowColumnConfig] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    // Load from localStorage or use defaults
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const savedColumns = JSON.parse(saved) as ColumnConfig[];
        // Merge with defaults to include any new columns
        const savedKeys = new Set(savedColumns.map(col => col.key));
        const mergedColumns = [...savedColumns];
        
        // Add any new columns from defaults that weren't in saved config
        DEFAULT_COLUMNS.forEach(defaultCol => {
          if (!savedKeys.has(defaultCol.key)) {
            mergedColumns.push(defaultCol);
          }
        });
        
        // Update order to match defaults for new columns
        return mergedColumns.map(col => {
          const defaultCol = DEFAULT_COLUMNS.find(dc => dc.key === col.key);
          return {
            ...col,
            order: defaultCol ? defaultCol.order : col.order,
            label: defaultCol ? defaultCol.label : col.label
          };
        }).sort((a, b) => {
          // First sort by order from defaults, then by saved order
          const aDefault = DEFAULT_COLUMNS.find(dc => dc.key === a.key);
          const bDefault = DEFAULT_COLUMNS.find(dc => dc.key === b.key);
          if (aDefault && bDefault) {
            return aDefault.order - bDefault.order;
          }
          return a.order - b.order;
        }).map((col, index) => ({ ...col, order: index }));
      } catch {
        return DEFAULT_COLUMNS;
      }
    }
    return DEFAULT_COLUMNS;
  });

  // Fetch subtasks
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subtasks'],
    queryFn: async () => {
      const response = await apiClient.get<Subtask[]>('/api/data/subtasks');
      return response.data || [];
    },
  });

  // Handle file preview
  const handleFilePreview = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsPreviewing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/data/subtasks/preview`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setPreviewData(result.data);
        setShowPreviewDialog(true);
      } else {
        toast.error(result.error || 'Preview failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Preview failed');
    } finally {
      setIsPreviewing(false);
    }
  };

  // Handle actual file upload (after preview confirmation)
  const handleFileUpload = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsUploading(true);
    setShowPreviewDialog(false);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/data/subtasks/upload`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Successfully imported ${result.data.processed} subtasks`);
        setFile(null);
        setPreviewData(null);
        refetch();
      } else {
        toast.error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      toast.error(error.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const subtasks = data || [];
  
  // Pagination calculations
  const totalPages = Math.ceil(subtasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSubtasks = subtasks.slice(startIndex, endIndex);
  
  // Reset to page 1 when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [subtasks.length]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Save column configuration to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);

  // Column configuration handlers
  const toggleColumnVisibility = (key: string) => {
    setColumns(prev => 
      prev.map(col => 
        col.key === key ? { ...col, visible: !col.visible } : col
      )
    );
  };

  const moveColumn = (key: string, direction: 'up' | 'down') => {
    setColumns(prev => {
      const newColumns = [...prev];
      const index = newColumns.findIndex(col => col.key === key);
      
      if (direction === 'up' && index > 0) {
        [newColumns[index], newColumns[index - 1]] = [newColumns[index - 1], newColumns[index]];
      } else if (direction === 'down' && index < newColumns.length - 1) {
        [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
      }
      
      // Update order values
      return newColumns.map((col, i) => ({ ...col, order: i }));
    });
  };

  const resetColumns = () => {
    setColumns(DEFAULT_COLUMNS);
    toast.success('Column configuration reset to defaults');
  };

  // Get visible columns sorted by order
  const visibleColumns = columns
    .filter(col => col.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Subtasks</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowColumnConfig(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            title="Configure columns"
          >
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            Columns
          </button>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              Select CSV
            </span>
          </label>
          {file && (
            <button
              onClick={handleFilePreview}
              disabled={isPreviewing || isUploading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              {isPreviewing ? 'Analyzing...' : isUploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          )}
        </div>
      </div>

      {file && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <p className="text-sm text-blue-800">
            Selected file: <strong>{file.name}</strong>
          </p>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading subtasks...</div>
        ) : subtasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No subtasks found. Upload a CSV file to get started.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {visibleColumns.map((col) => (
                    <th 
                      key={col.key}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedSubtasks.map((subtask) => (
                  <tr key={subtask.id} className="hover:bg-gray-50">
                    {visibleColumns.map((col) => {
                      let content: React.ReactNode;
                      const value = (subtask as any)[col.key];
                      
                      // Helper to format dates
                      const formatDate = (dateStr: string | null | undefined): string => {
                        if (!dateStr) return '-';
                        try {
                          return new Date(dateStr).toLocaleDateString();
                        } catch {
                          return dateStr;
                        }
                      };
                      
                      // Helper to format numbers
                      const formatNumber = (num: number | null | undefined): string => {
                        if (num === null || num === undefined) return '-';
                        return num.toString();
                      };
                      
                      switch (col.key) {
                        case 'issueKey':
                          content = <span className="text-sm font-medium text-gray-900">{subtask.issueKey}</span>;
                          break;
                        case 'summary':
                          content = <span className="text-sm text-gray-900 max-w-md truncate" title={subtask.summary}>{subtask.summary}</span>;
                          break;
                        case 'status':
                          content = (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              {subtask.status}
                            </span>
                          );
                          break;
                        case 'sprints':
                          // Handle sprints array - could be array, string, or null
                          let sprintsDisplay = '-';
                          if (value) {
                            if (Array.isArray(value)) {
                              sprintsDisplay = value.length > 0 ? value.join(', ') : '-';
                            } else if (typeof value === 'string') {
                              // Handle case where it might be a string representation
                              try {
                                const parsed = JSON.parse(value);
                                sprintsDisplay = Array.isArray(parsed) && parsed.length > 0 
                                  ? parsed.join(', ') 
                                  : value;
                              } catch {
                                sprintsDisplay = value || '-';
                              }
                            } else {
                              sprintsDisplay = String(value);
                            }
                          }
                          content = (
                            <span className="text-sm text-gray-500" title={sprintsDisplay !== '-' ? sprintsDisplay : undefined}>
                              {sprintsDisplay}
                            </span>
                          );
                          break;
                        case 'created':
                        case 'updated':
                        case 'resolved':
                        case 'dueDate':
                        case 'actualStart':
                        case 'actualEnd':
                        case 'plannedStart':
                        case 'plannedEnd':
                        case 'targetStart':
                        case 'targetEnd':
                        case 'dateApprovalDone':
                        case 'dateConceptDone':
                        case 'dateDevelopmentDone':
                        case 'dateTestDone':
                        case 'dateGoLive':
                        case 'dateApprovalProductionEnv':
                        case 'dateApprovalStagingEnv':
                        case 'dateApprovalTestEnv':
                        case 'slaStartDate':
                        case 'slaTargetDate':
                        case 'dateOfFirstResponse':
                        case 'lastViewed':
                          content = <span className="text-sm text-gray-500">{formatDate(value)}</span>;
                          break;
                        case 'storyPoints':
                        case 'storyPointsOriginal':
                        case 'storyPointsRemaining':
                        case 'storyPointsRough':
                        case 'storyPointsMagic':
                        case 'originalEstimate':
                        case 'remainingEstimate':
                        case 'timeSpent':
                        case 'totalOriginalEstimate':
                        case 'totalRemainingEstimate':
                        case 'totalTimeSpent':
                        case 'workRatio':
                        case 'checklistProgressPercent':
                        case 'votes':
                          content = <span className="text-sm text-gray-500">{formatNumber(value)}</span>;
                          break;
                        case 'description':
                        case 'checklistText':
                        case 'comments':
                        case 'environment':
                          content = (
                            <span className="text-sm text-gray-500 max-w-md truncate" title={value || undefined}>
                              {value || '-'}
                            </span>
                          );
                          break;
                        default:
                          // Handle all other string/null fields
                          if (value === null || value === undefined || value === '') {
                            content = <span className="text-sm text-gray-500">-</span>;
                          } else if (typeof value === 'boolean') {
                            content = <span className="text-sm text-gray-500">{value ? 'Yes' : 'No'}</span>;
                          } else {
                            content = <span className="text-sm text-gray-500">{String(value)}</span>;
                          }
                      }
                      
                      const isLongText = ['summary', 'description', 'checklistText', 'comments', 'environment'].includes(col.key);
                      
                      return (
                        <td 
                          key={col.key}
                          className={`px-6 py-4 ${
                            isLongText ? '' : 'whitespace-nowrap'
                          }`}
                        >
                          {content}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        {!isLoading && subtasks.length > 0 && totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(endIndex, subtasks.length)}</span> of{' '}
                  <span className="font-medium">{subtasks.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current page
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span
                          key={page}
                          className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                        >
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Column Configuration Modal */}
      {showColumnConfig && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" onClick={() => setShowColumnConfig(false)}>
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Configure Columns</h3>
              <button
                onClick={() => setShowColumnConfig(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {columns.sort((a, b) => a.order - b.order).map((col, index) => (
                <div 
                  key={col.key}
                  className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
                >
                  <div className="flex items-center flex-1">
                    <Bars3Icon className="h-5 w-5 text-gray-400 mr-2" />
                    <label className="flex items-center cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={col.visible}
                        onChange={() => toggleColumnVisibility(col.key)}
                        className="mr-3 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700">{col.label}</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveColumn(col.key, 'up')}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ChevronUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => moveColumn(col.key, 'down')}
                      disabled={index === columns.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ChevronDownIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={resetColumns}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Reset
              </button>
              <button
                onClick={() => setShowColumnConfig(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      {showPreviewDialog && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Upload Preview</h2>
              <button
                onClick={() => {
                  setShowPreviewDialog(false);
                  setPreviewData(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="px-6 py-4 flex-1 overflow-y-auto">
              {/* Summary Statistics */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-600">Total Records</div>
                  <div className="text-2xl font-bold text-blue-900">{previewData.totalRecords}</div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-green-600">Unique (New)</div>
                  <div className="text-2xl font-bold text-green-900">{previewData.uniqueCount}</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-yellow-600">Duplicates</div>
                  <div className="text-2xl font-bold text-yellow-900">{previewData.duplicateCount}</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-red-600">Invalid</div>
                  <div className="text-2xl font-bold text-red-900">{previewData.invalidCount}</div>
                </div>
              </div>

              {/* Preview Table */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Preview (showing first {previewData.previewRecords.length} records)
                </h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Key</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Summary</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Story Points</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sprints</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.previewRecords.map((record, index) => (
                        <tr key={index} className={record.isDuplicate ? 'bg-yellow-50' : ''}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{record.issueKey}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{record.summary}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{record.status}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{record.assignee || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{record.storyPoints || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {record.sprints.length > 0 ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {record.sprints.join(', ')}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {record.isDuplicate ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Duplicate
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                New
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Duplicate records will be updated with new data. Unique records will be created. Invalid records (missing required fields) will be skipped.
                </p>
              </div>
            </div>

            {/* Dialog Actions */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowPreviewDialog(false);
                  setPreviewData(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFileUpload}
                disabled={isUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
              >
                {isUploading ? 'Uploading...' : 'Confirm Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subtasks;

