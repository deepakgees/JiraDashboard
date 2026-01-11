// API utility for centralized API calls
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4001';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ImportConfig {
  id?: number;
  teamName: string;
  projectKey: string;
  jiraBaseUrl: string;
  importStartDate: string;
  authType?: string;
  authToken?: string;
  cookies?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ConnectionTestResponse {
  connected: boolean;
  message: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`Making API request to: ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create and export a default instance
const apiClient = new ApiClient();
export default apiClient;

// Export specific API methods for common endpoints
export const importApi = {
  getConfigs: () => apiClient.get<ImportConfig[]>('/api/import/configs'),
  createConfig: (data: any) => apiClient.post<ImportConfig>('/api/import/configs', data),
  updateConfig: (data: any) => apiClient.put<ImportConfig>('/api/import/configs', data),
  deleteConfig: (id: string) => apiClient.delete(`/api/import/configs/${id}`),
  testConnection: (data: any) => apiClient.post<ConnectionTestResponse>('/api/import/test-connection', data),
  importCsv: async (file: File, teamName: string, projectKey: string, dataType: 'epic' | 'issue'): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('teamName', teamName);
    formData.append('projectKey', projectKey);
    formData.append('dataType', dataType);

    const url = `${API_BASE_URL}/api/import/csv`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  },
};

export const configApi = {
  getStatistics: () => apiClient.get('/api/config/statistics'),
  getTeamNames: () => apiClient.get('/api/config/team-names'),
  getProjectKeys: () => apiClient.get('/api/config/project-keys'),
};
