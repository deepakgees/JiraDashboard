import React, { useState, useEffect } from 'react';

interface SprintData {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  goal?: string;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

interface TeamData {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface SprintPlanningData {
  selectedSprint: SprintData | null;
  teamData: TeamData[];
  sprintCapacity: {
    teamMember: string;
    capacity: number;
    availability: number;
  }[];
  sprintMetrics: {
    totalStoryPoints: number;
    completedStoryPoints: number;
    remainingStoryPoints: number;
    velocity: number;
  };
}

const SprintPlanning: React.FC = () => {
  const [sprints, setSprints] = useState<SprintData[]>([]);
  const [teams, setTeams] = useState<TeamData[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<SprintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [planningData, setPlanningData] = useState<SprintPlanningData>({
    selectedSprint: null,
    teamData: [],
    sprintCapacity: [],
    sprintMetrics: {
      totalStoryPoints: 0,
      completedStoryPoints: 0,
      remainingStoryPoints: 0,
      velocity: 0
    }
  });

  useEffect(() => {
    fetchSprints();
    fetchTeams();
  }, []);

  const fetchSprints = async () => {
    try {
      const response = await fetch('/api/sprints');
      const data = await response.json();

      if (data.success) {
        setSprints(data.data);
        // Select the first active sprint by default
        const activeSprint = data.data.find((sprint: SprintData) => sprint.status === 'active');
        if (activeSprint) {
          setSelectedSprint(activeSprint);
          setPlanningData(prev => ({ ...prev, selectedSprint: activeSprint }));
        }
      } else {
        setError(data.error || 'Failed to fetch sprints');
      }
    } catch (err) {
      setError('Error fetching sprints');
      console.error('Error fetching sprints:', err);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      const data = await response.json();

      if (data.success) {
        setTeams(data.data);
        setPlanningData(prev => ({ ...prev, teamData: data.data }));
      } else {
        setError(data.error || 'Failed to fetch teams');
      }
    } catch (err) {
      setError('Error fetching teams');
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSprintMetrics = async (sprintId: number) => {
    try {
      // This would typically fetch from a dedicated sprint metrics endpoint
      // For now, we'll simulate the data
      const mockMetrics = {
        totalStoryPoints: Math.floor(Math.random() * 100) + 50,
        completedStoryPoints: Math.floor(Math.random() * 50) + 20,
        remainingStoryPoints: Math.floor(Math.random() * 30) + 10,
        velocity: Math.floor(Math.random() * 20) + 15
      };

      setPlanningData(prev => ({
        ...prev,
        sprintMetrics: mockMetrics
      }));
    } catch (err) {
      console.error('Error fetching sprint metrics:', err);
    }
  };

  const handleSprintChange = (sprintId: string) => {
    const sprint = sprints.find(s => s.id === parseInt(sprintId));
    if (sprint) {
      setSelectedSprint(sprint);
      setPlanningData(prev => ({ ...prev, selectedSprint: sprint }));
      fetchSprintMetrics(sprint.id);
    }
  };

  const getSprintStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'planned':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const calculateSprintProgress = () => {
    if (planningData.sprintMetrics.totalStoryPoints === 0) return 0;
    return Math.round((planningData.sprintMetrics.completedStoryPoints / planningData.sprintMetrics.totalStoryPoints) * 100);
  };

  const getSprintDuration = () => {
    if (!selectedSprint) return 0;
    const start = new Date(selectedSprint.startDate);
    const end = new Date(selectedSprint.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
            <h1 className="text-3xl font-bold text-gray-900">Sprint Planning</h1>
            <p className="text-gray-600 mt-2">Sprint planning and capacity management</p>
          </div>
        </div>

        {/* Sprint Selection */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Select Sprint</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sprint
              </label>
              <select
                value={selectedSprint?.id || ''}
                onChange={(e) => handleSprintChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a sprint</option>
                {sprints.map(sprint => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name} ({sprint.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Sprint Information */}
        {selectedSprint && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Sprint Details</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-600">Name:</span>
                  <p className="text-lg font-semibold text-gray-900">{selectedSprint.name}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSprintStatusColor(selectedSprint.status)}`}>
                    {selectedSprint.status}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Duration:</span>
                  <p className="text-gray-900">{getSprintDuration()} days</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Start Date:</span>
                  <p className="text-gray-900">{new Date(selectedSprint.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">End Date:</span>
                  <p className="text-gray-900">{new Date(selectedSprint.endDate).toLocaleDateString()}</p>
                </div>
                {selectedSprint.goal && (
                  <div>
                    <span className="text-sm font-medium text-gray-600">Goal:</span>
                    <p className="text-gray-900">{selectedSprint.goal}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Sprint Metrics</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Story Points</span>
                    <span className="font-semibold">{planningData.sprintMetrics.totalStoryPoints}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completed</span>
                    <span className="font-semibold">{planningData.sprintMetrics.completedStoryPoints}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${calculateSprintProgress()}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Remaining</span>
                    <span className="font-semibold">{planningData.sprintMetrics.remainingStoryPoints}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div 
                      className="bg-yellow-600 h-2 rounded-full" 
                      style={{ width: `${100 - calculateSprintProgress()}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Velocity</span>
                    <span className="font-semibold">{planningData.sprintMetrics.velocity} SP</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Team Capacity</h3>
              <div className="space-y-3">
                {teams.map(team => (
                  <div key={team.id} className="border rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{team.name}</span>
                      <span className="text-sm text-gray-600">Active</span>
                    </div>
                    {team.description && (
                      <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                    )}
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Capacity</span>
                        <span>80%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                        <div className="bg-blue-600 h-1 rounded-full" style={{ width: '80%' }}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Sprint Planning Tools */}
        {selectedSprint && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Sprint Planning Tools</h3>
              <div className="space-y-4">
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  View Sprint Issues
                </button>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500">
                  Capacity Planning
                </button>
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500">
                  Burndown Chart
                </button>
                <button className="w-full px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500">
                  Velocity Tracking
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-4">
                <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500">
                  Add Issues to Sprint
                </button>
                <button className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  Update Sprint Goal
                </button>
                <button className="w-full px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500">
                  Sprint Retrospective
                </button>
                <button className="w-full px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500">
                  Export Sprint Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* No Sprint Selected */}
        {!selectedSprint && (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <div className="text-gray-500 text-lg">No sprint selected</div>
            <div className="text-gray-400 text-sm mt-2">
              Select a sprint from the dropdown above to view planning information
            </div>
          </div>
        )}
      </div>
  );
};

export default SprintPlanning;
