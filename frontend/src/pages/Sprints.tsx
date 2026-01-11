import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../utils/api';

interface SprintStatistics {
  sprintName: string;
  totalTickets: number;
  typeBreakdown: {
    stories: number;
    subtasks: number;
    bugs: number;
  };
  statusBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  resolutionBreakdown: Record<string, number>;
  assigneeBreakdown: Record<string, number>;
  teamBreakdown: Record<string, number>;
  totalStoryPoints: number;
  dates: {
    earliestCreated: string | null;
    latestCreated: string | null;
    earliestResolved: string | null;
    latestResolved: string | null;
  };
  tickets: {
    stories: Array<{
      issueKey: string;
      summary: string;
      status: string;
      assignee: string | null;
      storyPoints: number | null;
      priority: string | null;
    }>;
    subtasks: Array<{
      issueKey: string;
      summary: string;
      status: string;
      assignee: string | null;
      storyPoints: number | null;
      priority: string | null;
    }>;
    bugs: Array<{
      issueKey: string;
      summary: string;
      status: string;
      assignee: string | null;
      storyPoints: number | null;
      priority: string | null;
      resolution: string | null;
    }>;
  };
}

const Sprints: React.FC = () => {
  const [selectedSprint, setSelectedSprint] = useState<string>('');

  // Fetch all sprints
  const { data: sprints, isLoading: isLoadingSprints } = useQuery({
    queryKey: ['sprints'],
    queryFn: async () => {
      const response = await apiClient.get<string[]>('/api/data/sprints');
      return response.data || [];
    },
  });

  // Fetch sprint statistics
  const { data: statistics, isLoading: isLoadingStats } = useQuery({
    queryKey: ['sprint-statistics', selectedSprint],
    queryFn: async () => {
      if (!selectedSprint) return null;
      const response = await apiClient.get<SprintStatistics>(
        `/api/data/sprints/${encodeURIComponent(selectedSprint)}/statistics`
      );
      return response.data;
    },
    enabled: !!selectedSprint,
  });

  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Sprints</h1>
      </div>

      {/* Sprint Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <label htmlFor="sprint-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Sprint
        </label>
        <select
          id="sprint-select"
          value={selectedSprint}
          onChange={(e) => setSelectedSprint(e.target.value)}
          className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          disabled={isLoadingSprints}
        >
          <option value="">-- Select a sprint --</option>
          {sprints?.map((sprint) => (
            <option key={sprint} value={sprint}>
              {sprint}
            </option>
          ))}
        </select>
      </div>

      {/* Statistics Display */}
      {selectedSprint && statistics && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Total Tickets</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">{statistics.totalTickets}</div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Total Story Points</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">
                {statistics.totalStoryPoints.toFixed(1)}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Stories</div>
              <div className="mt-2 text-3xl font-bold text-blue-600">{statistics.typeBreakdown.stories}</div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Subtasks</div>
              <div className="mt-2 text-3xl font-bold text-green-600">{statistics.typeBreakdown.subtasks}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500 mb-2">Bugs</div>
              <div className="text-3xl font-bold text-red-600">{statistics.typeBreakdown.bugs}</div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500 mb-2">Earliest Created</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatDate(statistics.dates.earliestCreated)}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500 mb-2">Latest Resolved</div>
              <div className="text-lg font-semibold text-gray-900">
                {formatDate(statistics.dates.latestResolved)}
              </div>
            </div>
          </div>

          {/* Breakdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(statistics.statusBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{status}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full"
                            style={{
                              width: `${(count / statistics.totalTickets) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Priority Breakdown */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Breakdown</h3>
              <div className="space-y-2">
                {Object.entries(statistics.priorityBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([priority, count]) => (
                    <div key={priority} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{priority}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-yellow-500 h-2 rounded-full"
                            style={{
                              width: `${(count / statistics.totalTickets) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Assignee Breakdown */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignee Breakdown</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(statistics.assigneeBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([assignee, count]) => (
                    <div key={assignee} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{assignee}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${(count / statistics.totalTickets) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Team Breakdown */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Breakdown</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(statistics.teamBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([team, count]) => (
                    <div key={team} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{team}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{
                              width: `${(count / statistics.totalTickets) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Resolution Breakdown (for bugs) */}
            {Object.keys(statistics.resolutionBreakdown).length > 0 && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Resolution Breakdown (Bugs)</h3>
                <div className="space-y-2">
                  {Object.entries(statistics.resolutionBreakdown)
                    .sort(([, a], [, b]) => b - a)
                    .map(([resolution, count]) => (
                      <div key={resolution} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">{resolution}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-red-500 h-2 rounded-full"
                              style={{
                                width: `${(count / statistics.typeBreakdown.bugs) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Tickets List */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets in Sprint</h3>
            <div className="space-y-4">
              {/* Stories */}
              {statistics.tickets.stories.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-blue-600 mb-2">
                    Stories ({statistics.tickets.stories.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Key</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Summary</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Story Points</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {statistics.tickets.stories.map((story) => (
                          <tr key={story.issueKey} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {story.issueKey}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 max-w-md truncate" title={story.summary}>
                              {story.summary}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {story.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {story.assignee || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {story.storyPoints || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {story.priority || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Subtasks */}
              {statistics.tickets.subtasks.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-green-600 mb-2">
                    Subtasks ({statistics.tickets.subtasks.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Key</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Summary</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Story Points</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {statistics.tickets.subtasks.map((subtask) => (
                          <tr key={subtask.issueKey} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {subtask.issueKey}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 max-w-md truncate" title={subtask.summary}>
                              {subtask.summary}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {subtask.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {subtask.assignee || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {subtask.storyPoints || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {subtask.priority || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bugs */}
              {statistics.tickets.bugs.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-red-600 mb-2">
                    Bugs ({statistics.tickets.bugs.length})
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Key</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Summary</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignee</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Story Points</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resolution</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {statistics.tickets.bugs.map((bug) => (
                          <tr key={bug.issueKey} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {bug.issueKey}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 max-w-md truncate" title={bug.summary}>
                              {bug.summary}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                {bug.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {bug.assignee || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {bug.storyPoints || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {bug.priority || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {bug.resolution || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {selectedSprint && isLoadingStats && (
        <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
          Loading statistics...
        </div>
      )}

      {/* No Sprint Selected */}
      {!selectedSprint && (
        <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
          Please select a sprint to view statistics
        </div>
      )}
    </div>
  );
};

export default Sprints;

