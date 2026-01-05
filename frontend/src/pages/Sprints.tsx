import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { PlusIcon, CalendarIcon, ClockIcon, UserGroupIcon, ChartBarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
  created: string;
  updated: string;
}

interface Sprint {
  id: number;
  name: string;
  goal: string;
  startDate: string;
  endDate: string;
  status: string;
  totalStoryPoints: number;
  completedStoryPoints: number;
  remainingDays: number;
}

interface BurndownData {
  day: string;
  remaining: number;
  ideal: number;
  actual: number;
}

const Sprints: React.FC = () => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [burndownData, setBurndownData] = useState<BurndownData[]>([]);
  const [showCreateSprint, setShowCreateSprint] = useState(false);

  // Mock data - replace with actual API calls
  useEffect(() => {
    setSprints([
      {
        id: 1,
        name: 'Sprint 1',
        goal: 'Complete user authentication and basic project setup',
        startDate: '2024-01-15',
        endDate: '2024-01-28',
        status: 'active',
        totalStoryPoints: 20,
        completedStoryPoints: 18,
        remainingDays: 3
      },
      {
        id: 2,
        name: 'Sprint 2',
        goal: 'Implement issue tracking and sprint management',
        startDate: '2024-02-01',
        endDate: '2024-02-14',
        status: 'planned',
        totalStoryPoints: 25,
        completedStoryPoints: 0,
        remainingDays: 14
      }
    ]);

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
        created: '2024-01-15',
        updated: '2024-01-20'
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
        created: '2024-01-15',
        updated: '2024-01-22'
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
        created: '2024-01-22',
        updated: '2024-01-22'
      }
    ]);

    setBurndownData([
      { day: 'Day 1', remaining: 20, ideal: 20, actual: 20 },
      { day: 'Day 2', remaining: 18, ideal: 18, actual: 18 },
      { day: 'Day 3', remaining: 16, ideal: 16, actual: 16 },
      { day: 'Day 4', remaining: 14, ideal: 14, actual: 14 },
      { day: 'Day 5', remaining: 12, ideal: 12, actual: 12 },
      { day: 'Day 6', remaining: 10, ideal: 10, actual: 10 },
      { day: 'Day 7', remaining: 8, ideal: 8, actual: 8 },
      { day: 'Day 8', remaining: 6, ideal: 6, actual: 6 },
      { day: 'Day 9', remaining: 4, ideal: 4, actual: 4 },
      { day: 'Day 10', remaining: 2, ideal: 2, actual: 2 }
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'to-do': return 'bg-gray-100 border-gray-300';
      case 'in-progress': return 'bg-blue-100 border-blue-300';
      case 'in-review': return 'bg-yellow-100 border-yellow-300';
      case 'done': return 'bg-green-100 border-green-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
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

  const columns = ['to-do', 'in-progress', 'in-review', 'done'];

  const getIssuesByStatus = (status: string) => {
    return issues.filter(issue => issue.status === status);
  };

  const handleDragStart = (e: React.DragEvent, issue: Issue) => {
    e.dataTransfer.setData('issue', JSON.stringify(issue));
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const issue = JSON.parse(e.dataTransfer.getData('issue'));
    // Update issue status - replace with API call
    setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, status } : i));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sprint Board</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your sprints and track progress with Kanban board
          </p>
        </div>
        <button
          onClick={() => setShowCreateSprint(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Sprint
        </button>
      </div>

      {/* Sprint Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Sprint</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sprints.map(sprint => (
            <div
              key={sprint.id}
              onClick={() => setSelectedSprint(sprint)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedSprint?.id === sprint.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{sprint.name}</h4>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  sprint.status === 'active' ? 'bg-green-100 text-green-800' :
                  sprint.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {sprint.status}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{sprint.goal}</p>
              <div className="flex justify-between text-sm text-gray-500">
                <span>{sprint.remainingDays} days left</span>
                <span>{sprint.completedStoryPoints}/{sprint.totalStoryPoints} SP</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedSprint && (
        <>
          {/* Sprint Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <CalendarIcon className="w-8 h-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Sprint Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedSprint.remainingDays} days</p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <ChartBarIcon className="w-8 h-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Story Points</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedSprint.completedStoryPoints}/{selectedSprint.totalStoryPoints}</p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <ClockIcon className="w-8 h-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round((selectedSprint.completedStoryPoints / selectedSprint.totalStoryPoints) * 100)}%
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <UserGroupIcon className="w-8 h-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Issues</p>
                  <p className="text-2xl font-bold text-gray-900">{issues.filter(i => i.status !== 'done').length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Burndown Chart */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Sprint Burndown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={burndownData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="ideal" stroke="#6B7280" strokeDasharray="5 5" name="Ideal" />
                <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2} name="Actual" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Kanban Board */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Issue Board</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {columns.map(column => (
                <div key={column} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 capitalize">{column.replace('-', ' ')}</h4>
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      {getIssuesByStatus(column).length}
                    </span>
                  </div>
                  <div
                    className="min-h-[400px] p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
                    onDrop={(e) => handleDrop(e, column)}
                    onDragOver={handleDragOver}
                  >
                    {getIssuesByStatus(column).map(issue => (
                      <div
                        key={issue.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, issue)}
                        className={`p-3 mb-3 bg-white rounded-lg border cursor-move ${getStatusColor(issue.status)}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{issue.key}</span>
                          <div className="flex items-center space-x-1">
                            <span className={`w-2 h-2 rounded-full ${getPriorityColor(issue.priority)}`}></span>
                            <span className="text-lg">{getTypeIcon(issue.type)}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{issue.summary}</p>
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
          </div>
        </>
      )}

      {/* Create Sprint Modal */}
      {showCreateSprint && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Sprint</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sprint Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Sprint 1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Goal</label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="What do you want to accomplish in this sprint?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateSprint(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Create Sprint
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

export default Sprints;
