import React, { useState, useEffect } from 'react';

interface JiraEpic {
  id: number;
  jiraKey: string;
  summary: string;
  status: string;
  dueDate?: string;
  priority?: string;
  fixVersions?: string;
  roughEstimate?: number;
  originalEstimate?: number;
  remainingEstimate?: number;
  teamName: string;
  projectKey: string;
  lastImported: string;
}

const JiraEpics: React.FC = () => {
  const [epics, setEpics] = useState<JiraEpic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    teamName: '',
    projectKey: '',
    status: '',
    priority: ''
  });
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);
  const [availableProjects, setAvailableProjects] = useState<string[]>([]);

  useEffect(() => {
    fetchEpics();
    fetchAvailableOptions();
  }, []);

  const fetchEpics = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.teamName) params.append('teamName', filters.teamName);
      if (filters.projectKey) params.append('projectKey', filters.projectKey);

      const response = await fetch(`/api/import/epics?${params}`);
      const data = await response.json();

      if (data.success) {
        let filteredEpics = data.data;

        // Apply client-side filters
        if (filters.status) {
          filteredEpics = filteredEpics.filter((epic: JiraEpic) => 
            epic.status.toLowerCase().includes(filters.status.toLowerCase())
          );
        }
        if (filters.priority) {
          filteredEpics = filteredEpics.filter((epic: JiraEpic) => 
            epic.priority?.toLowerCase().includes(filters.priority.toLowerCase())
          );
        }

        setEpics(filteredEpics);
      } else {
        setError(data.error || 'Failed to fetch epics');
      }
    } catch (err) {
      setError('Error fetching epics');
      console.error('Error fetching epics:', err);
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
    fetchEpics();
  };

  const clearFilters = () => {
    setFilters({
      teamName: '',
      projectKey: '',
      status: '',
      priority: ''
    });
    fetchEpics();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'to do':
      case 'open':
        return 'bg-gray-100 text-gray-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'bg-gray-100 text-gray-800';
    
    switch (priority.toLowerCase()) {
      case 'highest':
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
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
            <h1 className="text-3xl font-bold text-gray-900">Jira Epics</h1>
            <p className="text-gray-600 mt-2">Imported Epic data from Jira</p>
          </div>
          <div className="text-sm text-gray-500">
            Total Epics: {epics.length}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                Priority
              </label>
              <input
                type="text"
                value={filters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                placeholder="Filter by priority"
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

        {/* Epics Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Epic Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Summary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Story Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fix Versions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Imported
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {epics.map((epic) => (
                  <tr key={epic.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-blue-600">
                        {epic.jiraKey}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate" title={epic.summary}>
                        {epic.summary}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(epic.status)}`}>
                        {epic.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {epic.priority && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(epic.priority)}`}>
                          {epic.priority}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {epic.dueDate ? new Date(epic.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        {epic.roughEstimate && (
                          <div>Rough: {epic.roughEstimate}</div>
                        )}
                        {epic.originalEstimate && (
                          <div>Original: {epic.originalEstimate}</div>
                        )}
                        {epic.remainingEstimate && (
                          <div>Remaining: {epic.remainingEstimate}</div>
                        )}
                        {!epic.roughEstimate && !epic.originalEstimate && !epic.remainingEstimate && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {epic.fixVersions || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {epic.teamName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(epic.lastImported).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {epics.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No epics found</div>
              <div className="text-gray-400 text-sm mt-2">
                Try adjusting your filters or import some data first
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default JiraEpics;
