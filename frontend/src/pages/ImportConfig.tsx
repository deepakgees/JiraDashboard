import React, { useState, useEffect } from 'react';
import { importApi, ImportConfig as ImportConfigType, ConnectionTestResponse } from '../utils/api';

// Use the types from the API utility
type ImportConfigData = ImportConfigType;
type ConnectionTest = ConnectionTestResponse;

const ImportConfig: React.FC = () => {
  const [configs, setConfigs] = useState<ImportConfigData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ImportConfigData | null>(null);
  const [connectionTest, setConnectionTest] = useState<ConnectionTest | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);

  const [formData, setFormData] = useState({
    teamName: '',
    projectKey: '',
    jiraBaseUrl: '',
    authType: 'api',
    email: '',
    apiToken: '',
    cookies: '',
    importStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    isActive: true
  });

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const data = await importApi.getConfigs();

      if (data.success && data.data) {
        setConfigs(data.data);
      } else {
        setError(data.error || 'Failed to fetch configurations');
      }
    } catch (err) {
      setError('Error fetching configurations');
      console.error('Error fetching configurations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const configData = {
        teamName: formData.teamName,
        projectKey: formData.projectKey,
        jiraBaseUrl: formData.jiraBaseUrl,
        importStartDate: new Date(formData.importStartDate).toISOString(),
        authType: formData.authType,
        authToken: formData.authType === 'api' ? btoa(`${formData.email}:${formData.apiToken}`) : undefined,
        cookies: formData.authType === 'cookie' ? formData.cookies : undefined,
        isActive: formData.isActive
      };

      console.log('Sending config data:', configData);
      
      const data = await importApi.createConfig(configData);
      console.log('Response data:', data);

      if (data.success) {
        setShowForm(false);
        setEditingConfig(null);
        resetForm();
        fetchConfigs();
        setError(null);
      } else {
        setError(data.error || 'Failed to save configuration');
      }
    } catch (err) {
      setError('Error saving configuration');
      console.error('Error saving configuration:', err);
    }
  };

  const testConnection = async () => {
    if (!formData.jiraBaseUrl) {
      setError('Please fill in Jira URL to test connection');
      return;
    }

    if (formData.authType === 'api' && (!formData.email || !formData.apiToken)) {
      setError('Please fill in email and API token for API authentication');
      return;
    }

    if (formData.authType === 'cookie' && !formData.cookies) {
      setError('Please fill in cookies for cookie authentication');
      return;
    }

    try {
      setTestingConnection(true);
      setConnectionTest(null);

      const requestBody: any = {
        jiraBaseUrl: formData.jiraBaseUrl,
        authType: formData.authType
      };

      if (formData.authType === 'api') {
        requestBody.email = formData.email;
        requestBody.apiToken = formData.apiToken;
      } else {
        requestBody.cookies = formData.cookies;
      }

      console.log('Sending test connection data:', requestBody);
      
      const data = await importApi.testConnection(requestBody);
      console.log('Test connection response data:', data);
      
      if (data.success && data.data) {
        setConnectionTest({
          connected: data.data.connected,
          message: data.data.message
        });
      } else {
        setConnectionTest({
          connected: false,
          message: data.error || 'Connection test failed'
        });
      }

      if (!data.success || !data.data?.connected) {
        setError(data.error || data.data?.message || 'Connection test failed');
      } else {
        setError(null);
      }
    } catch (err) {
      setConnectionTest({
        connected: false,
        message: 'Connection test failed'
      });
      setError('Error testing connection');
      console.error('Error testing connection:', err);
    } finally {
      setTestingConnection(false);
    }
  };

  const resetForm = () => {
    setFormData({
      teamName: '',
      projectKey: '',
      jiraBaseUrl: '',
      authType: 'api',
      email: '',
      apiToken: '',
      cookies: '',
      importStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true
    });
    setConnectionTest(null);
  };

  const handleEdit = (config: ImportConfigData) => {
    setEditingConfig(config);
    setFormData({
      teamName: config.teamName,
      projectKey: config.projectKey,
      jiraBaseUrl: config.jiraBaseUrl,
      authType: config.authType || 'api',
      email: '',
      apiToken: '',
      cookies: '',
      importStartDate: new Date(config.importStartDate).toISOString().split('T')[0],
      isActive: config.isActive
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingConfig(null);
    resetForm();
    setError(null);
    setConnectionTest(null);
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
            <h1 className="text-3xl font-bold text-gray-900">Import Configuration</h1>
            <p className="text-gray-600 mt-2">Manage Jira import settings for teams and projects</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Configuration
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Connection Test Result */}
        {connectionTest && (
          <div className={`px-4 py-3 rounded ${
            connectionTest.connected 
              ? 'bg-green-100 border border-green-400 text-green-700'
              : 'bg-red-100 border border-red-400 text-red-700'
          }`}>
            {connectionTest.message}
          </div>
        )}

        {/* Configuration Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">
              {editingConfig ? 'Edit Configuration' : 'Add New Configuration'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    name="teamName"
                    value={formData.teamName}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Crank, Marvin, CodeRed"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Key *
                  </label>
                  <input
                    type="text"
                    name="projectKey"
                    value={formData.projectKey}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., SAPRM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jira Base URL *
                  </label>
                  <input
                    type="url"
                    name="jiraBaseUrl"
                    value={formData.jiraBaseUrl}
                    onChange={handleInputChange}
                    required
                    placeholder="https://your-domain.atlassian.net"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Authentication Type *
                  </label>
                  <select
                    name="authType"
                    value={formData.authType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="api">API Key</option>
                    <option value="cookie">Browser Cookies</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Import Start Date *
                  </label>
                  <input
                    type="date"
                    name="importStartDate"
                    value={formData.importStartDate}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* API Authentication Fields */}
                {formData.authType === 'api' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required={formData.authType === 'api'}
                        placeholder="your-email@domain.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        API Token *
                      </label>
                      <input
                        type="password"
                        name="apiToken"
                        value={formData.apiToken}
                        onChange={handleInputChange}
                        required={formData.authType === 'api'}
                        placeholder="Your Jira API token"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {/* Cookie Authentication Fields */}
                {formData.authType === 'cookie' && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Browser Cookies *
                    </label>
                    <textarea
                      name="cookies"
                      value={formData.cookies}
                      onChange={handleInputChange}
                      required={formData.authType === 'cookie'}
                      placeholder="Copy cookies from your browser's developer tools (F12 → Application → Cookies)"
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      <strong>How to get cookies:</strong>
                      <br />
                      1. Open Jira in your browser and log in
                      <br />
                      2. Press F12 to open Developer Tools
                      <br />
                      3. Go to Application/Storage → Cookies → your-jira-domain
                      <br />
                      4. Copy all cookie values (name=value; name2=value2; ...)
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {editingConfig ? 'Update Configuration' : 'Save Configuration'}
                </button>
                
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testingConnection || !formData.jiraBaseUrl || 
                    (formData.authType === 'api' && (!formData.email || !formData.apiToken)) ||
                    (formData.authType === 'cookie' && !formData.cookies)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {testingConnection ? 'Testing...' : 'Test Connection'}
                </button>
                
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Configurations Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Team Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jira URL
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auth Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Import Start Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {configs.map((config) => (
                  <tr key={config.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {config.teamName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {config.projectKey}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <a 
                        href={config.jiraBaseUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {config.jiraBaseUrl}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        config.authType === 'cookie' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {config.authType === 'cookie' ? 'Cookies' : 'API Key'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(config.importStartDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        config.isActive 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {config.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {config.updatedAt ? new Date(config.updatedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(config)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {configs.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No configurations found</div>
              <div className="text-gray-400 text-sm mt-2">
                Add a configuration to start importing data from Jira
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default ImportConfig;
