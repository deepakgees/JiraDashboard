import React, { useState, useEffect } from 'react';
import { PlusIcon, ChartBarIcon, UserGroupIcon, CalendarIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface Project {
  id: number;
  name: string;
  key: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string;
  totalIssues: number;
  completedIssues: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
  teamSize: number;
  progress: number;
  health: 'healthy' | 'at-risk' | 'critical';
}

interface ProjectMetrics {
  project: string;
  issues: number;
  storyPoints: number;
  velocity: number;
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [metricsData, setMetricsData] = useState<ProjectMetrics[]>([]);

  // Mock data - replace with actual API calls
  useEffect(() => {
    setProjects([
      {
        id: 1,
        name: 'User Management System',
        key: 'UMS',
        description: 'Complete user authentication and authorization system',
        status: 'active',
        startDate: '2024-01-01',
        endDate: '2024-06-30',
        totalIssues: 45,
        completedIssues: 32,
        totalStoryPoints: 89,
        completedStoryPoints: 67,
        teamSize: 6,
        progress: 75,
        health: 'healthy'
      },
      {
        id: 2,
        name: 'Project Management Portal',
        key: 'PMP',
        description: 'Web-based project management and collaboration platform',
        status: 'active',
        startDate: '2024-02-01',
        endDate: '2024-08-31',
        totalIssues: 67,
        completedIssues: 28,
        totalStoryPoints: 134,
        completedStoryPoints: 45,
        teamSize: 8,
        progress: 34,
        health: 'at-risk'
      },
      {
        id: 3,
        name: 'Mobile App Development',
        key: 'MAD',
        description: 'Cross-platform mobile application for field workers',
        status: 'planning',
        startDate: '2024-04-01',
        endDate: '2024-12-31',
        totalIssues: 0,
        completedIssues: 0,
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        teamSize: 5,
        progress: 0,
        health: 'healthy'
      }
    ]);

    setMetricsData([
      { project: 'UMS', issues: 45, storyPoints: 89, velocity: 15 },
      { project: 'PMP', issues: 67, storyPoints: 134, velocity: 12 },
      { project: 'MAD', issues: 0, storyPoints: 0, velocity: 0 }
    ]);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'planning': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'on-hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'bg-green-500';
      case 'at-risk': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your projects and track their progress
          </p>
        </div>
        <button
          onClick={() => setShowCreateProject(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create Project
        </button>
      </div>

      {/* Project Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <ChartBarIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-green-500" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {projects.filter(p => p.status === 'active').length}
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
                {projects.reduce((sum, p) => sum + p.totalIssues, 0)}
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
                {projects.reduce((sum, p) => sum + p.totalStoryPoints, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map(project => (
          <div
            key={project.id}
            onClick={() => setSelectedProject(project)}
            className="bg-white shadow rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                <p className="text-sm text-gray-500">{project.key}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{project.description}</p>
            
            <div className="space-y-3">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.progress)}`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Issues:</span>
                  <span className="ml-1 font-medium">{project.completedIssues}/{project.totalIssues}</span>
                </div>
                <div>
                  <span className="text-gray-500">Story Points:</span>
                  <span className="ml-1 font-medium">{project.completedStoryPoints}/{project.totalStoryPoints}</span>
                </div>
                <div>
                  <span className="text-gray-500">Team Size:</span>
                  <span className="ml-1 font-medium">{project.teamSize}</span>
                </div>
                <div>
                  <span className="text-gray-500">Health:</span>
                  <div className="flex items-center ml-1">
                    <span className={`w-2 h-2 rounded-full ${getHealthColor(project.health)} mr-1`}></span>
                    <span className="font-medium capitalize">{project.health}</span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                  <span>End: {new Date(project.endDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Project Metrics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Issues by Project */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Issues by Project</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="project" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="issues" fill="#3B82F6" name="Total Issues" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Story Points by Project */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Story Points by Project</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="project" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="storyPoints" fill="#10B981" name="Story Points" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedProject.name}</h3>
                  <p className="text-lg text-gray-600">{selectedProject.key}</p>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Project Details */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Project Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedProject.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Status</label>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedProject.status)}`}>
                            {selectedProject.status}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Health</label>
                          <div className="flex items-center">
                            <span className={`w-3 h-3 rounded-full ${getHealthColor(selectedProject.health)} mr-2`}></span>
                            <span className="text-sm font-medium capitalize">{selectedProject.health}</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Start Date</label>
                          <p className="mt-1 text-sm text-gray-900">{new Date(selectedProject.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">End Date</label>
                          <p className="mt-1 text-sm text-gray-900">{new Date(selectedProject.endDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Progress Metrics</h4>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Overall Progress</span>
                          <span>{selectedProject.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(selectedProject.progress)}`}
                            style={{ width: `${selectedProject.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{selectedProject.completedIssues}</p>
                          <p className="text-sm text-blue-600">Completed Issues</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{selectedProject.completedStoryPoints}</p>
                          <p className="text-sm text-green-600">Completed SP</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Team and Timeline */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Team Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Team Size</span>
                        <span className="text-lg font-bold text-gray-900">{selectedProject.teamSize}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Total Issues</span>
                        <span className="text-lg font-bold text-gray-900">{selectedProject.totalIssues}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Total Story Points</span>
                        <span className="text-lg font-bold text-gray-900">{selectedProject.totalStoryPoints}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Timeline</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Project Duration</span>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.ceil((new Date(selectedProject.endDate).getTime() - new Date(selectedProject.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Days Remaining</span>
                        <span className="text-sm font-medium text-gray-900">
                          {Math.max(0, Math.ceil(
                            (new Date(selectedProject.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                          ))} days
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      View Project Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Project</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Name</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Key</label>
                  <input
                    type="text"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="PROJ"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    rows={3}
                    placeholder="Describe your project"
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
                    onClick={() => setShowCreateProject(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    Create Project
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

export default Projects;
