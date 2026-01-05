import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { CalendarIcon, ClockIcon, UserGroupIcon, ChartBarIcon, ExclamationTriangleIcon, CheckCircleIcon, DocumentTextIcon, ClipboardDocumentListIcon, CogIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalProjects: number;
  activeIssues: number;
  activeSprints: number;
  teamMembers: number;
  completedIssues: number;
  overdueIssues: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
}

interface JiraImportStats {
  totalImports: number;
  successfulImports: number;
  failedImports: number;
  lastImportDate: string | null;
  totalEpics: number;
  totalIssues: number;
  activeTeams: number;
}

interface SprintProgress {
  name: string;
  planned: number;
  completed: number;
  remaining: number;
}

interface IssueStatus {
  status: string;
  count: number;
  color: string;
}

interface VelocityData {
  sprint: string;
  planned: number;
  completed: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeIssues: 0,
    activeSprints: 0,
    teamMembers: 0,
    completedIssues: 0,
    overdueIssues: 0,
    totalStoryPoints: 0,
    completedStoryPoints: 0
  });

  const [sprintProgress, setSprintProgress] = useState<SprintProgress[]>([]);
  const [issueStatus, setIssueStatus] = useState<IssueStatus[]>([]);
  const [velocityData, setVelocityData] = useState<VelocityData[]>([]);
  const [jiraStats, setJiraStats] = useState<JiraImportStats>({
    totalImports: 0,
    successfulImports: 0,
    failedImports: 0,
    lastImportDate: null,
    totalEpics: 0,
    totalIssues: 0,
    activeTeams: 0
  });

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate API calls
    setStats({
      totalProjects: 5,
      activeIssues: 23,
      activeSprints: 2,
      teamMembers: 12,
      completedIssues: 45,
      overdueIssues: 3,
      totalStoryPoints: 89,
      completedStoryPoints: 67
    });

    // Fetch Jira import statistics
    fetchJiraStats();

    setSprintProgress([
      { name: 'Sprint 1', planned: 20, completed: 18, remaining: 2 },
      { name: 'Sprint 2', planned: 25, completed: 15, remaining: 10 },
      { name: 'Sprint 3', planned: 22, completed: 0, remaining: 22 }
    ]);

    setIssueStatus([
      { status: 'To Do', count: 8, color: '#3B82F6' },
      { status: 'In Progress', count: 12, color: '#F59E0B' },
      { status: 'In Review', count: 5, color: '#8B5CF6' },
      { status: 'Done', count: 45, color: '#10B981' }
    ]);

    setVelocityData([
      { sprint: 'Sprint 1', planned: 20, completed: 18 },
      { sprint: 'Sprint 2', planned: 25, completed: 15 },
      { sprint: 'Sprint 3', planned: 22, completed: 0 }
    ]);
  }, []);

  const fetchJiraStats = async () => {
    try {
      const response = await fetch('/api/config/statistics');
      const data = await response.json();
      
      if (data.success) {
        setJiraStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching Jira statistics:', error);
    }
  };

  const completionRate = stats.totalStoryPoints > 0 ? (stats.completedStoryPoints / stats.totalStoryPoints * 100).toFixed(1) : '0';
  const overdueRate = stats.activeIssues > 0 ? (stats.overdueIssues / stats.activeIssues * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">SAP RM Agile Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Comprehensive view of your projects, sprints, and team performance metrics
        </p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-blue-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Projects</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.totalProjects}</dd>
                  <dd className="text-sm text-gray-500">Currently running</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-green-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Issues</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.activeIssues}</dd>
                  <dd className="text-sm text-gray-500">{stats.completedIssues} completed</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-yellow-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Sprints</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.activeSprints}</dd>
                  <dd className="text-sm text-gray-500">In progress</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg border-l-4 border-purple-500">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="w-8 h-8 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Team Members</dt>
                  <dd className="text-2xl font-bold text-gray-900">{stats.teamMembers}</dd>
                  <dd className="text-sm text-gray-500">Active contributors</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Metrics */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Story Points Progress</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Completed</span>
              <span className="font-medium">{stats.completedStoryPoints} / {stats.totalStoryPoints}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${completionRate}%` }}
              ></div>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-green-600">{completionRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Issue Status Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Overdue Issues</span>
              <span className="font-medium text-red-600">{stats.overdueIssues}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${overdueRate}%` }}
              ></div>
            </div>
            <div className="text-center">
              <span className="text-sm text-gray-500">{overdueRate}% of active issues</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sprint Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">On Track</span>
              <span className="font-medium text-green-600">
                {sprintProgress.filter(s => s.remaining <= 2).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">At Risk</span>
              <span className="font-medium text-yellow-600">
                {sprintProgress.filter(s => s.remaining > 2 && s.remaining <= 5).length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Critical</span>
              <span className="font-medium text-red-600">
                {sprintProgress.filter(s => s.remaining > 5).length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sprint Progress Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sprint Progress</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sprintProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="planned" fill="#3B82F6" name="Planned" />
              <Bar dataKey="completed" fill="#10B981" name="Completed" />
              <Bar dataKey="remaining" fill="#F59E0B" name="Remaining" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Issue Status Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Issue Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={issueStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {issueStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Velocity Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Team Velocity Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={velocityData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="sprint" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="planned" stroke="#3B82F6" strokeWidth={2} name="Planned SP" />
            <Line type="monotone" dataKey="completed" stroke="#10B981" strokeWidth={2} name="Completed SP" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Jira Import Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Jira Import Status</h3>
          <Link 
            to="/import-config" 
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Manage Import Settings →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <DocumentTextIcon className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-900">Imported Epics</p>
                <p className="text-2xl font-bold text-blue-600">{jiraStats.totalEpics}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <ClipboardDocumentListIcon className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-900">Imported Issues</p>
                <p className="text-2xl font-bold text-green-600">{jiraStats.totalIssues}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <UserGroupIcon className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-900">Active Teams</p>
                <p className="text-2xl font-bold text-purple-600">{jiraStats.activeTeams}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <ClockIcon className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-900">Total Imports</p>
                <p className="text-2xl font-bold text-yellow-600">{jiraStats.totalImports}</p>
              </div>
            </div>
          </div>
        </div>

        {jiraStats.lastImportDate && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Last import: {new Date(jiraStats.lastImportDate).toLocaleString()}
            </p>
          </div>
        )}

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link 
            to="/jira-epics" 
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            View Epics
          </Link>
          <Link 
            to="/jira-issues" 
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <ClipboardDocumentListIcon className="w-5 h-5 mr-2" />
            View Issues
          </Link>
          <Link 
            to="/import-logs" 
            className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
          >
            <ClockIcon className="w-5 h-5 mr-2" />
            Import Logs
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <ChartBarIcon className="w-5 h-5 mr-2" />
            Create Sprint
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
            <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
            Add Issue
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
            <UserGroupIcon className="w-5 h-5 mr-2" />
            Manage Team
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700">
            <ClockIcon className="w-5 h-5 mr-2" />
            Log Time
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
