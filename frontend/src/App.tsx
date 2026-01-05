import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Issues from './pages/Issues';
import Sprints from './pages/Sprints';
import Teams from './pages/Teams';
import Users from './pages/Users';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';

// Jira Import Pages
import JiraEpics from './pages/JiraEpics';
import JiraIssues from './pages/JiraIssues';
import ImportLogs from './pages/ImportLogs';
import ImportConfig from './pages/ImportConfig';
import SprintPlanning from './pages/SprintPlanning';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="issues" element={<Issues />} />
              <Route path="sprints" element={<Sprints />} />
              <Route path="teams" element={<Teams />} />
              <Route path="users" element={<Users />} />
              
              {/* Jira Import Routes */}
              <Route path="jira-epics" element={<JiraEpics />} />
              <Route path="jira-issues" element={<JiraIssues />} />
              <Route path="import-logs" element={<ImportLogs />} />
              <Route path="import-config" element={<ImportConfig />} />
              <Route path="sprint-planning" element={<SprintPlanning />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
