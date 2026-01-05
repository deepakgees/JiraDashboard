import React, { useState, useEffect } from 'react';
import { PlusIcon, UserIcon, ChartBarIcon, ClockIcon, ExclamationTriangleIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
  isActive: boolean;
  joinDate: string;
  lastActive: string;
  totalIssues: number;
  completedIssues: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  currentSprint: string;
  team: string;
  skills: string[];
  capacity: number; // hours per week
  allocatedHours: number;
}

interface UserPerformance {
  user: string;
  issues: number;
  storyPoints: number;
  velocity: number;
  quality: number;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    role: '',
    team: '',
    status: '',
    sprint: ''
  });
  const [performanceData, setPerformanceData] = useState<UserPerformance[]>([]);

  // Mock data - replace with actual API calls
  useEffect(() => {
    setUsers([
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@company.com',
        role: 'Team Lead',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        isActive: true,
        joinDate: '2023-01-15',
        lastActive: '2024-01-22',
        totalIssues: 45,
        completedIssues: 38,
        totalStoryPoints: 89,
        completedStoryPoints: 72,
        currentSprint: 'Sprint 1',
        team: 'Frontend Development',
        skills: ['React', 'TypeScript', 'UI/UX', 'Agile', 'Leadership'],
        capacity: 40,
        allocatedHours: 35
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane.smith@company.com',
        role: 'Senior Developer',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        isActive: true,
        joinDate: '2023-03-20',
        lastActive: '2024-01-22',
        totalIssues: 52,
        completedIssues: 45,
        totalStoryPoints: 112,
        completedStoryPoints: 98,
        currentSprint: 'Sprint 1',
        team: 'Frontend Development',
        skills: ['React', 'Vue.js', 'CSS', 'Testing', 'Performance'],
        capacity: 40,
        allocatedHours: 38
      },
      {
        id: 3,
        name: 'Mike Johnson',
        email: 'mike.johnson@company.com',
        role: 'Developer',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        isActive: true,
        joinDate: '2023-06-10',
        lastActive: '2024-01-22',
        totalIssues: 28,
        completedIssues: 22,
        totalStoryPoints: 56,
        completedStoryPoints: 43,
        currentSprint: 'Sprint 2',
        team: 'Frontend Development',
        skills: ['JavaScript', 'HTML', 'CSS', 'Git', 'Responsive Design'],
        capacity: 40,
        allocatedHours: 32
      },
      {
        id: 4,
        name: 'Sarah Wilson',
        email: 'sarah.wilson@company.com',
        role: 'Team Lead',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        isActive: true,
        joinDate: '2023-02-01',
        lastActive: '2024-01-22',
        totalIssues: 67,
        completedIssues: 58,
        totalStoryPoints: 134,
        completedStoryPoints: 112,
        currentSprint: 'Sprint 1',
        team: 'Backend Development',
        skills: ['Node.js', 'Python', 'PostgreSQL', 'AWS', 'Microservices'],
        capacity: 40,
        allocatedHours: 40
      },
      {
        id: 5,
        name: 'David Brown',
        email: 'david.brown@company.com',
        role: 'Senior Developer',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        isActive: true,
        joinDate: '2023-04-15',
        lastActive: '2024-01-22',
        totalIssues: 41,
        completedIssues: 35,
        totalStoryPoints: 78,
        completedStoryPoints: 65,
        currentSprint: 'Sprint 2',
        team: 'Backend Development',
        skills: ['Java', 'Spring Boot', 'MySQL', 'Docker', 'Kubernetes'],
        capacity: 40,
        allocatedHours: 36
      },
      {
        id: 6,
        name: 'Emily Davis',
        email: 'emily.davis@company.com',
        role: 'QA Lead',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
        isActive: true,
        joinDate: '2023-05-01',
        lastActive: '2024-01-22',
        totalIssues: 89,
        completedIssues: 82,
        totalStoryPoints: 156,
        completedStoryPoints: 145,
        currentSprint: 'Sprint 1',
        team: 'QA & Testing',
        skills: ['Manual Testing', 'Automation', 'Selenium', 'JIRA', 'Test Planning'],
        capacity: 40,
        allocatedHours: 40
      }
    ]);

    setPerformanceData([
      { user: 'John Doe', issues: 45, storyPoints: 89, velocity: 15, quality: 95 },
      { user: 'Jane Smith', issues: 52, storyPoints: 112, velocity: 18, quality: 92 },
      { user: 'Mike Johnson', issues: 28, storyPoints: 56, velocity: 12, quality: 88 },
      { user: 'Sarah Wilson', issues: 67, storyPoints: 134, velocity: 20, quality: 94 },
      { user: 'David Brown', issues: 41, storyPoints: 78, velocity: 14, quality: 90 },
      { user: 'Emily Davis', issues: 89, storyPoints: 156, velocity: 22, quality: 98 }
    ]);
  }, []);

  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.team.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply other filters
    if (selectedFilters.role) {
      filtered = filtered.filter(user => user.role === selectedFilters.role);
    }
    if (selectedFilters.team) {
      filtered = filtered.filter(user => user.team === selectedFilters.team);
    }
    if (selectedFilters.status) {
      filtered = filtered.filter(user => user.isActive === (selectedFilters.status === 'active'));
    }
    if (selectedFilters.sprint) {
      filtered = filtered.filter(user => user.currentSprint === selectedFilters.sprint);
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, selectedFilters]);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Team Lead': return 'bg-purple-100 text-purple-800';
      case 'Senior Developer': return 'bg-blue-100 text-blue-800';
      case 'Developer': return 'bg-green-100 text-green-800';
      case 'QA Lead': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const getUtilizationColor = (allocated: number, capacity: number) => {
    const percentage = (allocated / capacity) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (completed: number, total: number) => {
    if (total === 0) return 'bg-gray-500';
    const percentage = (completed / total) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const clearFilters = () => {
    setSelectedFilters({
      role: '',
      team: '',
      status: '',
      sprint: ''
    });
    setSearchTerm('');
  };

  const uniqueValues = (field: keyof User) => {
    return Array.from(new Set(users.map(user => user[field])));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage team members and track their performance
          </p>
        </div>
        <button
          onClick={() => setShowCreateUser(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Add User
        </button>
      </div>

      {/* User Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <UserIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <ClockIcon className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Issues</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.reduce((sum, u) => sum + u.totalIssues, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Story Points</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.reduce((sum, u) => sum + u.totalStoryPoints, 0)}
              </p>
            </div>
          </div>
        </div>
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
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select
              value={selectedFilters.role}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, role: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Roles</option>
              {uniqueValues('role').map(role => (
                <option key={String(role)} value={String(role)}>{String(role)}</option>
              ))}
            </select>

            <select
              value={selectedFilters.team}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, team: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Teams</option>
              {uniqueValues('team').map(team => (
                <option key={String(team)} value={String(team)}>{String(team)}</option>
              ))}
            </select>

            <select
              value={selectedFilters.status}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={selectedFilters.sprint}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, sprint: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Sprints</option>
              {uniqueValues('currentSprint').map(sprint => (
                <option key={String(sprint)} value={String(sprint)}>{String(sprint)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters */}
        <div className="mt-4 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {filteredUsers.length} of {users.length} users
          </span>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear all filters
          </button>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map(user => (
          <div
            key={user.id}
            onClick={() => setSelectedUser(user)}
            className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center space-x-4 mb-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full"
              />
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(user.isActive)}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Team and Sprint */}
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Team:</span>
                  <span className="font-medium">{user.team}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Current Sprint:</span>
                  <span className="font-medium">{user.currentSprint}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Issues Progress</span>
                  <span>{user.completedIssues}/{user.totalIssues}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(user.completedIssues, user.totalIssues)}`}
                    style={{ width: `${user.totalIssues > 0 ? (user.completedIssues / user.totalIssues * 100) : 0}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Story Points:</span>
                  <span className="ml-1 font-medium">{user.completedStoryPoints}/{user.totalStoryPoints}</span>
                </div>
                <div>
                  <span className="text-gray-500">Capacity:</span>
                  <span className="ml-1 font-medium">{user.capacity}h/week</span>
                </div>
                <div>
                  <span className="text-gray-500">Allocated:</span>
                  <span className="ml-1 font-medium">{user.allocatedHours}h/week</span>
                </div>
                <div>
                  <span className="text-gray-500">Utilization:</span>
                  <span className={`ml-1 font-medium ${getUtilizationColor(user.allocatedHours, user.capacity)}`}>
                    {Math.round((user.allocatedHours / user.capacity) * 100)}%
                  </span>
                </div>
              </div>

              {/* Skills */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Skills:</p>
                <div className="flex flex-wrap gap-1">
                  {user.skills.slice(0, 3).map((skill, index) => (
                    <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {skill}
                    </span>
                  ))}
                  {user.skills.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      +{user.skills.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* User Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Velocity & Quality */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Performance Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="user" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="velocity" fill="#3B82F6" name="Velocity" />
              <Bar dataKey="quality" fill="#10B981" name="Quality %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Issues & Story Points by User */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Issues & Story Points by User</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="user" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="issues" fill="#8B5CF6" name="Total Issues" />
              <Bar dataKey="storyPoints" fill="#F59E0B" name="Story Points" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-4">
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-20 h-20 rounded-full"
                  />
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedUser.name}</h3>
                    <p className="text-lg text-gray-600">{selectedUser.email}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-3 py-1 text-sm rounded-full ${getRoleColor(selectedUser.role)}`}>
                        {selectedUser.role}
                      </span>
                      <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedUser.isActive)}`}>
                        {selectedUser.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Information */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Personal Information</h4>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Join Date</label>
                          <p className="mt-1 text-sm text-gray-900">{new Date(selectedUser.joinDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Last Active</label>
                          <p className="mt-1 text-sm text-gray-900">{new Date(selectedUser.lastActive).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Team</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.team}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Sprint</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.currentSprint}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedUser.skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Performance Overview</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Issues Progress</span>
                          <span>{selectedUser.completedIssues}/{selectedUser.totalIssues}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(selectedUser.completedIssues, selectedUser.totalIssues)}`}
                            style={{ width: `${selectedUser.totalIssues > 0 ? (selectedUser.completedIssues / selectedUser.totalIssues * 100) : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Story Points Progress</span>
                          <span>{selectedUser.completedStoryPoints}/{selectedUser.totalStoryPoints}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(selectedUser.completedStoryPoints, selectedUser.totalStoryPoints)}`}
                            style={{ width: `${selectedUser.totalStoryPoints > 0 ? (selectedUser.completedStoryPoints / selectedUser.totalStoryPoints * 100) : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Capacity & Utilization</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Weekly Capacity</span>
                        <span className="text-lg font-bold text-gray-900">{selectedUser.capacity}h</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Allocated Hours</span>
                        <span className="text-lg font-bold text-gray-900">{selectedUser.allocatedHours}h</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Available Hours</span>
                        <span className="text-lg font-bold text-gray-900">{selectedUser.capacity - selectedUser.allocatedHours}h</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Utilization</span>
                        <span className={`text-lg font-bold ${getUtilizationColor(selectedUser.allocatedHours, selectedUser.capacity)}`}>
                          {Math.round((selectedUser.allocatedHours / selectedUser.capacity) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New User</h3>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">First Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Name</label>
                    <input
                      type="text"
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter last name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter email address"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="">Select role</option>
                      <option value="Developer">Developer</option>
                      <option value="Senior Developer">Senior Developer</option>
                      <option value="Team Lead">Team Lead</option>
                      <option value="QA Engineer">QA Engineer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Team</label>
                    <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                      <option value="">Select team</option>
                      <option value="Frontend Development">Frontend Development</option>
                      <option value="Backend Development">Backend Development</option>
                      <option value="QA & Testing">QA & Testing</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weekly Capacity (hours)</label>
                  <input
                    type="number"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="40"
                    min="1"
                    max="168"
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateUser(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Add User
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

export default Users;
