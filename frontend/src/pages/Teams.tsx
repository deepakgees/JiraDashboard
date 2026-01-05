import React, { useState, useEffect } from 'react';
import { PlusIcon, UserGroupIcon, ChartBarIcon, ClockIcon, ExclamationTriangleIcon, UserIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
  isActive: boolean;
  capacity: number; // hours per week
  allocatedHours: number;
  skills: string[];
  joinDate: string;
  lastActive: string;
}

interface Team {
  id: number;
  name: string;
  description: string;
  lead: string;
  members: TeamMember[];
  totalCapacity: number;
  allocatedCapacity: number;
  projects: string[];
  status: 'active' | 'inactive' | 'archived';
  createdAt: string;
}

interface TeamPerformance {
  team: string;
  velocity: number;
  quality: number;
  capacity: number;
  utilization: number;
}

const Teams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [performanceData, setPerformanceData] = useState<TeamPerformance[]>([]);

  // Mock data - replace with actual API calls
  useEffect(() => {
    setTeams([
      {
        id: 1,
        name: 'Frontend Development',
        description: 'Responsible for user interface and user experience development',
        lead: 'John Doe',
        members: [
          {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@company.com',
            role: 'Team Lead',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            isActive: true,
            capacity: 40,
            allocatedHours: 35,
            skills: ['React', 'TypeScript', 'UI/UX', 'Agile'],
            joinDate: '2023-01-15',
            lastActive: '2024-01-22'
          },
          {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@company.com',
            role: 'Senior Developer',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            isActive: true,
            capacity: 40,
            allocatedHours: 38,
            skills: ['React', 'Vue.js', 'CSS', 'Testing'],
            joinDate: '2023-03-20',
            lastActive: '2024-01-22'
          },
          {
            id: 3,
            name: 'Mike Johnson',
            email: 'mike.johnson@company.com',
            role: 'Developer',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            isActive: true,
            capacity: 40,
            allocatedHours: 32,
            skills: ['JavaScript', 'HTML', 'CSS', 'Git'],
            joinDate: '2023-06-10',
            lastActive: '2024-01-22'
          }
        ],
        totalCapacity: 120,
        allocatedCapacity: 105,
        projects: ['User Management System', 'Project Portal'],
        status: 'active',
        createdAt: '2023-01-15'
      },
      {
        id: 2,
        name: 'Backend Development',
        description: 'Handles server-side logic, databases, and API development',
        lead: 'Sarah Wilson',
        members: [
          {
            id: 4,
            name: 'Sarah Wilson',
            email: 'sarah.wilson@company.com',
            role: 'Team Lead',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
            isActive: true,
            capacity: 40,
            allocatedHours: 40,
            skills: ['Node.js', 'Python', 'PostgreSQL', 'AWS'],
            joinDate: '2023-02-01',
            lastActive: '2024-01-22'
          },
          {
            id: 5,
            name: 'David Brown',
            email: 'david.brown@company.com',
            role: 'Senior Developer',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
            isActive: true,
            capacity: 40,
            allocatedHours: 36,
            skills: ['Java', 'Spring Boot', 'MySQL', 'Docker'],
            joinDate: '2023-04-15',
            lastActive: '2024-01-22'
          }
        ],
        totalCapacity: 80,
        allocatedCapacity: 76,
        projects: ['User Management System', 'API Gateway'],
        status: 'active',
        createdAt: '2023-02-01'
      },
      {
        id: 3,
        name: 'QA & Testing',
        description: 'Ensures quality and reliability of all software products',
        lead: 'Emily Davis',
        members: [
          {
            id: 6,
            name: 'Emily Davis',
            email: 'emily.davis@company.com',
            role: 'QA Lead',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
            isActive: true,
            capacity: 40,
            allocatedHours: 40,
            skills: ['Manual Testing', 'Automation', 'Selenium', 'JIRA'],
            joinDate: '2023-05-01',
            lastActive: '2024-01-22'
          }
        ],
        totalCapacity: 40,
        allocatedCapacity: 40,
        projects: ['All Projects'],
        status: 'active',
        createdAt: '2023-05-01'
      }
    ]);

    setPerformanceData([
      { team: 'Frontend', velocity: 15, quality: 95, capacity: 120, utilization: 87.5 },
      { team: 'Backend', velocity: 18, quality: 92, capacity: 80, utilization: 95 },
      { team: 'QA', velocity: 12, quality: 98, capacity: 40, utilization: 100 }
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Team Lead': return 'bg-purple-100 text-purple-800';
      case 'Senior Developer': return 'bg-blue-100 text-blue-800';
      case 'Developer': return 'bg-green-100 text-green-800';
      case 'QA Lead': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCapacityColor = (allocated: number, total: number) => {
    const percentage = (allocated / total) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your development teams and track their performance
          </p>
        </div>
        <button
          onClick={() => setShowCreateTeam(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Team
        </button>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Teams</p>
              <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <UserIcon className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">
                {teams.reduce((sum, team) => sum + team.members.length, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <ClockIcon className="w-8 h-8 text-yellow-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900">
                {teams.reduce((sum, team) => sum + team.totalCapacity, 0)}h/week
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-purple-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Utilization</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(teams.reduce((sum, team) => sum + (team.allocatedCapacity / team.totalCapacity * 100), 0) / teams.length)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map(team => (
          <div
            key={team.id}
            onClick={() => setSelectedTeam(team)}
            className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{team.name}</h3>
                <p className="text-sm text-gray-500">Led by {team.lead}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(team.status)}`}>
                {team.status}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{team.description}</p>
            
            <div className="space-y-3">
              {/* Capacity Bar */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Capacity Utilization</span>
                  <span>{Math.round((team.allocatedCapacity / team.totalCapacity) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getCapacityColor(team.allocatedCapacity, team.totalCapacity)}`}
                    style={{ width: `${(team.allocatedCapacity / team.totalCapacity) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Team Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Members:</span>
                  <span className="ml-1 font-medium">{team.members.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Projects:</span>
                  <span className="ml-1 font-medium">{team.projects.length}</span>
                </div>
                <div>
                  <span className="text-gray-500">Capacity:</span>
                  <span className="ml-1 font-medium">{team.totalCapacity}h/week</span>
                </div>
                <div>
                  <span className="text-gray-500">Allocated:</span>
                  <span className="ml-1 font-medium">{team.allocatedCapacity}h/week</span>
                </div>
              </div>

              {/* Team Members Preview */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Team Members:</p>
                <div className="flex -space-x-2">
                  {team.members.slice(0, 4).map(member => (
                    <div
                      key={member.id}
                      className="w-8 h-8 rounded-full border-2 border-white overflow-hidden"
                      title={member.name}
                    >
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {team.members.length > 4 && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs text-gray-600">
                      +{team.members.length - 4}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Team Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Velocity & Quality */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Team Performance Metrics</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="velocity" fill="#3B82F6" name="Velocity" />
              <Bar dataKey="quality" fill="#10B981" name="Quality %" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Capacity Utilization */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Capacity Utilization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="team" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="capacity" fill="#8B5CF6" name="Total Capacity" />
              <Bar dataKey="utilization" fill="#F59E0B" name="Utilization %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Team Detail Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedTeam.name}</h3>
                  <p className="text-lg text-gray-600">Led by {selectedTeam.lead}</p>
                </div>
                <button
                  onClick={() => setSelectedTeam(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Team Information */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Team Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedTeam.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedTeam.status)}`}>
                            {selectedTeam.status}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Created</label>
                          <p className="mt-1 text-sm text-gray-900">{new Date(selectedTeam.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Capacity Overview</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Total Capacity</span>
                        <span className="text-lg font-bold text-gray-900">{selectedTeam.totalCapacity}h/week</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Allocated</span>
                        <span className="text-lg font-bold text-gray-900">{selectedTeam.allocatedCapacity}h/week</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Available</span>
                        <span className="text-lg font-bold text-gray-900">{selectedTeam.totalCapacity - selectedTeam.allocatedCapacity}h/week</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Utilization</span>
                        <span className={`text-lg font-bold ${getUtilizationColor((selectedTeam.allocatedCapacity / selectedTeam.totalCapacity) * 100)}`}>
                          {Math.round((selectedTeam.allocatedCapacity / selectedTeam.totalCapacity) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Projects</h4>
                    <div className="space-y-2">
                      {selectedTeam.projects.map((project, index) => (
                        <div key={index} className="p-2 bg-blue-50 rounded text-sm text-blue-700">
                          {project}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="lg:col-span-2">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-medium text-gray-900">Team Members ({selectedTeam.members.length})</h4>
                    <button
                      onClick={() => setShowAddMember(true)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add Member
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {selectedTeam.members.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-12 h-12 rounded-full"
                          />
                          <div>
                            <h5 className="font-medium text-gray-900">{member.name}</h5>
                            <p className="text-sm text-gray-500">{member.email}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role)}`}>
                                {member.role}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {member.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            <div>Capacity: {member.capacity}h/week</div>
                            <div>Allocated: {member.allocatedHours}h/week</div>
                            <div className={`font-medium ${getUtilizationColor((member.allocatedHours / member.capacity) * 100)}`}>
                              {Math.round((member.allocatedHours / member.capacity) * 100)}% utilized
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Team</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Team Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter team name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Describe your team's purpose and responsibilities"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Team Lead</label>
                  <select className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2">
                    <option value="">Select team lead</option>
                    <option value="John Doe">John Doe</option>
                    <option value="Jane Smith">Jane Smith</option>
                    <option value="Sarah Wilson">Sarah Wilson</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateTeam(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Create Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Team Member</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Member Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter member name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter email address"
                  />
                </div>
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
                    onClick={() => setShowAddMember(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Add Member
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

export default Teams;
