import React, { useState, useEffect } from 'react';
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Issue {
  id: number;
  key: string;
  summary: string;
  type: string;
  priority: string;
  status: string;
  storyPoints: number;
  assignee: string;
  reporter: string;
  project: string;
  sprint: string;
  created: string;
  updated: string;
  description: string;
}

const Issues: React.FC = () => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [filteredIssues, setFilteredIssues] = useState<Issue[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    type: '',
    priority: '',
    status: '',
    assignee: '',
    project: '',
    sprint: ''
  });
  const [showCreateIssue, setShowCreateIssue] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  // Mock data - replace with actual API calls
  useEffect(() => {
    setIssues([
      {
        id: 1,
        key: 'PROJ-101',
        summary: 'Implement user login functionality',
        type: 'story',
        priority: 'high',
        status: 'done',
        storyPoints: 5,
        assignee: 'John Doe',
        reporter: 'Jane Smith',
        project: 'User Management',
        sprint: 'Sprint 1',
        created: '2024-01-15',
        updated: '2024-01-20',
        description: 'Create a secure user authentication system with login/logout functionality'
      },
      {
        id: 2,
        key: 'PROJ-102',
        summary: 'Create project creation form',
        type: 'story',
        priority: 'medium',
        status: 'in-progress',
        storyPoints: 3,
        assignee: 'Mike Johnson',
        reporter: 'Jane Smith',
        project: 'Project Management',
        sprint: 'Sprint 1',
        created: '2024-01-15',
        updated: '2024-01-22',
        description: 'Build a form for creating new projects with validation'
      },
      {
        id: 3,
        key: 'PROJ-103',
        summary: 'Fix authentication bug',
        type: 'bug',
        priority: 'critical',
        status: 'to-do',
        storyPoints: 2,
        assignee: 'John Doe',
        reporter: 'Mike Johnson',
        project: 'User Management',
        sprint: 'Sprint 2',
        created: '2024-01-22',
        updated: '2024-01-22',
        description: 'Users are getting logged out unexpectedly after 5 minutes'
      },
      {
        id: 4,
        key: 'PROJ-104',
        summary: 'Add email notifications',
        type: 'story',
        priority: 'medium',
        status: 'to-do',
        storyPoints: 4,
        assignee: 'Sarah Wilson',
        reporter: 'Jane Smith',
        project: 'Communication',
        sprint: 'Sprint 2',
        created: '2024-01-23',
        updated: '2024-01-23',
        description: 'Implement email notifications for issue updates and sprint reminders'
      }
    ]);
  }, []);

  useEffect(() => {
    let filtered = issues;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(issue =>
        issue.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        issue.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply other filters
    Object.entries(selectedFilters).forEach(([key, value]) => {
      if (value && key !== 'assignee' && key !== 'project' && key !== 'sprint') {
        filtered = filtered.filter(issue => issue[key as keyof Issue] === value);
      }
    });

    if (selectedFilters.assignee) {
      filtered = filtered.filter(issue => issue.assignee === selectedFilters.assignee);
    }

    if (selectedFilters.project) {
      filtered = filtered.filter(issue => issue.project === selectedFilters.project);
    }

    if (selectedFilters.sprint) {
      filtered = filtered.filter(issue => issue.sprint === selectedFilters.sprint);
    }

    setFilteredIssues(filtered);
  }, [issues, searchTerm, selectedFilters]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'to-do': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'in-review': return 'bg-yellow-100 text-yellow-800';
      case 'done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'story': return '📖';
      case 'bug': return '🐛';
      case 'task': return '📋';
      case 'epic': return '🎯';
      default: return '📄';
    }
  };

  const clearFilters = () => {
    setSelectedFilters({
      type: '',
      priority: '',
      status: '',
      assignee: '',
      project: '',
      sprint: ''
    });
    setSearchTerm('');
  };

  const uniqueValues = (field: keyof Issue) => {
    return Array.from(new Set(issues.map(issue => issue[field])));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Issues</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage and track all project issues and tasks
          </p>
        </div>
        <button
          onClick={() => setShowCreateIssue(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Issue
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                viewMode === 'list'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setViewMode('board')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                viewMode === 'board'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Board
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <select
            value={selectedFilters.type}
            onChange={(e) => setSelectedFilters(prev => ({ ...prev, type: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Types</option>
            {uniqueValues('type').map(type => (
              <option key={String(type)} value={String(type)}>{String(type)}</option>
            ))}
          </select>

          <select
            value={selectedFilters.priority}
            onChange={(e) => setSelectedFilters(prev => ({ ...prev, priority: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Priorities</option>
            {uniqueValues('priority').map(priority => (
              <option key={String(priority)} value={String(priority)}>{String(priority)}</option>
            ))}
          </select>

          <select
            value={selectedFilters.status}
            onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Statuses</option>
            {uniqueValues('status').map(status => (
              <option key={String(status)} value={String(status)}>{String(status)}</option>
            ))}
          </select>

          <select
            value={selectedFilters.assignee}
            onChange={(e) => setSelectedFilters(prev => ({ ...prev, assignee: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Assignees</option>
            {uniqueValues('assignee').map(assignee => (
              <option key={String(assignee)} value={String(assignee)}>{String(assignee)}</option>
            ))}
          </select>

          <select
            value={selectedFilters.project}
            onChange={(e) => setSelectedFilters(prev => ({ ...prev, project: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Projects</option>
            {uniqueValues('project').map(project => (
              <option key={String(project)} value={String(project)}>{String(project)}</option>
            ))}
          </select>

          <select
            value={selectedFilters.sprint}
            onChange={(e) => setSelectedFilters(prev => ({ ...prev, sprint: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="">All Sprints</option>
            {uniqueValues('sprint').map(sprint => (
              <option key={String(sprint)} value={String(sprint)}>{String(sprint)}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {filteredIssues.length} of {issues.length} issues
          </span>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Issues List */}
      {viewMode === 'list' && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Story Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredIssues.map(issue => (
                  <tr key={issue.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{issue.key}</div>
                        <div className="text-sm text-gray-500">{issue.summary}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getTypeIcon(issue.type)}</span>
                        <span className="text-sm text-gray-900 capitalize">{issue.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)} text-white`}>
                        {issue.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(issue.status)}`}>
                        {issue.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {issue.assignee}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {issue.storyPoints} SP
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedIssue(issue)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issues Board View */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {['to-do', 'in-progress', 'in-review', 'done'].map(status => (
            <div key={status} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900 capitalize">{status.replace('-', ' ')}</h3>
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  {filteredIssues.filter(issue => issue.status === status).length}
                </span>
              </div>
              <div className="space-y-3">
                {filteredIssues
                  .filter(issue => issue.status === status)
                  .map(issue => (
                    <div
                      key={issue.id}
                      className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">{issue.key}</span>
                        <div className="flex items-center space-x-1">
                          <span className={`w-2 h-2 rounded-full ${getPriorityColor(issue.priority)}`}></span>
                          <span className="text-lg">{getTypeIcon(issue.type)}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{issue.summary}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{issue.assignee}</span>
                        <span>{issue.storyPoints} SP</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issue Detail Modal */}
      {selectedIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-medium text-gray-900">{selectedIssue.key}</h3>
                <button
                  onClick={() => setSelectedIssue(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Summary</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedIssue.summary}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedIssue.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedIssue.type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedIssue.priority}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{selectedIssue.status.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Story Points</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedIssue.storyPoints} SP</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assignee</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedIssue.assignee}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reporter</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedIssue.reporter}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Project</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedIssue.project}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Sprint</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedIssue.sprint}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Issue Modal */}
      {showCreateIssue && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Issue</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Summary</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Brief description of the issue"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={4}
                    placeholder="Detailed description of the issue"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="story">Story</option>
                      <option value="bug">Bug</option>
                      <option value="task">Task</option>
                      <option value="epic">Epic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Priority</label>
                    <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Story Points</label>
                    <input
                      type="number"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assignee</label>
                    <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="">Unassigned</option>
                      <option value="John Doe">John Doe</option>
                      <option value="Jane Smith">Jane Smith</option>
                      <option value="Mike Johnson">Mike Johnson</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateIssue(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Create Issue
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Issues;
