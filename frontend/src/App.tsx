import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';

// Data Pages
import Epics from './pages/Epics';
import Stories from './pages/Stories';
import Subtasks from './pages/Subtasks';
import Bugs from './pages/Bugs';
import Sprints from './pages/Sprints';
import OAuth from './pages/OAuth';

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
            <Route path="/" element={<Layout />}>
              <Route index element={<Epics />} />
              <Route path="epics" element={<Epics />} />
              <Route path="stories" element={<Stories />} />
              <Route path="subtasks" element={<Subtasks />} />
              <Route path="bugs" element={<Bugs />} />
              <Route path="sprints" element={<Sprints />} />
            </Route>
            <Route path="/oauth" element={<OAuth />} />
            <Route path="/oauth/callback" element={<OAuth />} />
          </Routes>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
