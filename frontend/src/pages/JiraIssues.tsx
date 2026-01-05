import React, { useState, useEffect } from 'react';

interface JiraIssue {
  id: number;
  jiraKey: string;
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
  teamName: string;
  projectKey: string;
  lastImported: string;
}

const JiraIssues: React.FC = () => {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    teamName: '',
    projectKey: '',
    status: '',
    issueType: '',
    sprintState: ''
  });
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);

  useEffect(() => {
    fetchIssues();
    fetchAvailableOptions();
  }, []);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.teamName) params.append('teamName', filters.teamName);
      if (filters.projectKey) params.append('projectKey', filters.projectKey);

      const response = await fetch(`/api/import/issues?${params}`);
      const data = await response.json();

      if (data.success) {
        let filteredIssues = data.data;

        // Apply client-side filters
        if (filters.status) {
          filteredIssues = filteredIssues.filter((issue: JiraIssue) => 
            issue.status.toLowerCase().includes(filters.status.toLowerCase())
          );
        }
        if (filters.issueType) {
          filteredIssues = filteredIssues.filter((issue: JiraIssue) => 
            issue.issueType.toLowerCase().includes(filters.issueType.toLowerCase())
          );
        }
        if (filters.sprintState) {
          filteredIssues = filteredIssues.filter((issue: JiraIssue) => 
            issue.sprintState?.toLowerCase().includes(filters.sprintState.toLowerCase())
          );
        }

        setIssues(filteredIssues);
      } else {
        setError(data.error || 'Failed to fetch issues');
      }
    } catch (err) {
      setError('Error fetching issues');
      console.error('Error fetching issues:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableOptions = async () => {
    try {
      const [teamsResponse, projectsResponse] = await Promise.all([
        fetch('/api/config/team-names'),
        fetch('/api/config/project-keys')
      ]);

      const teamsData = await teamsResponse.json();
      const projectsData = await projectsResponse.json();

      if (teamsData.success) setAvailableTeams(teamsData.data);
      if (projectsData.success) setAvailableProjects(projectsData.data);
    } catch (err) {
      console.error('Error fetching available options:', err);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchIssues();
  };

  const clearFilters = () => {
    setFilters({
      teamName: '',
      projectKey: '',
      status: '',
      issueType: '',
      sprintState: ''
    });
    fetchIssues();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
      case 'completed':
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'to do':
      case 'open':
        return 'bg-gray-100 text-gray-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'in review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIssueTypeColor = (issueType: string) => {
    switch (issueType.toLowerCase()) {
      case 'story':
        return 'bg-blue-100 text-blue-800';
      case 'task':
        return 'bg-green-100 text-green-800';
      case 'bug':
        return 'bg-red-100 text-red-800';
      case 'epic':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSprintStateColor = (sprintState?: string) => {
    if (!sprintState) return 'bg-gray-100 text-gray-800';
    
    switch (sprintState.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'future':
        return 'bg-blue-100 text-blue-800';
      case 'backlog':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Jira Issues</h1>
            <p className="text-gray-600 mt-2">Imported Issue data from Jira</p>
          </div>
          <div className="text-sm text-gray-500">
            Total Issues: {issues.length}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Name
              </label>
              <select
                value={filters.teamName}
                onChange={(e) => handleFilterChange('teamName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Teams</option>
                {availableTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Key
              </label>
              <select
                value={filters.projectKey}
                onChange={(e) => handleFilterChange('projectKey', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Projects</option>
                {availableProjects.map(project => (
                  <option key={project} value={project}>{project}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <input
                type="text"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                placeholder="Filter by status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Issue Type
              </label>
              <input
                type="text"
                value={filters.issueType}
                onChange={(e) => handleFilterChange('issueType', e.target.value)}
                placeholder="Filter by type"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sprint State
              </label>
              <input
                type="text"
                value={filters.sprintState}
                onChange={(e) => handleFilterChange('sprintState', e.target.value)}
                placeholder="Filter by sprint state"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={applyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Issues Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sprint State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Story Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Epic Link
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resolved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {issues.map((issue) => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        {issue.jiraKey}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getIssueTypeColor(issue.issueType)}`}>
                        {issue.issueType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={issue.summary}>
                        {issue.summary}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                        {issue.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSprintStateColor(issue.sprintState)}`}>
                        {issue.sprintState || 'backlog'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {issue.storyPoints || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {issue.epicLink ? (
                        <span className="text-blue-600">{issue.epicLink}</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(issue.created).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {issue.resolved ? new Date(issue.resolved).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {issue.teamName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {issues.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No issues found</div>
              <div className="text-gray-400 text-sm mt-2">
                Try adjusting your filters or import some data first
              </div>
            </div>
          )}
        </div>

        {/* Sprint Information Panel */}
        {issues.some(issue => issue.lastAssignedSprint) && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Sprint Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {issues
                .filter(issue => issue.lastAssignedSprint)
                .slice(0, 10)
                .map((issue) => (
                  <div key={issue.id} className="border rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-900">{issue.jiraKey}</div>
                    <div className="text-sm text-gray-600 mt-1">{issue.lastAssignedSprint}</div>
                    {issue.sprintStartDate && issue.sprintEndDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(issue.sprintStartDate).toLocaleDateString()} - {new Date(issue.sprintEndDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
  );
};

export default JiraIssues;
