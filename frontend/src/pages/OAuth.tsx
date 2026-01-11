import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:4001';

interface AuthStatus {
  authenticated: boolean;
  expired?: boolean;
  hasRefreshToken?: boolean;
  expiresAt?: string;
  userEmail?: string;
  userName?: string;
  siteUrl?: string;
  cloudId?: string;
  message?: string;
}

const OAuth: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  // Check for callback parameters
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    const callbackAccountId = searchParams.get('accountId');

    if (callbackAccountId) {
      setAccountId(callbackAccountId);
      checkAuthStatus(callbackAccountId);
    }

    if (success === 'true') {
      toast.success('Successfully authenticated with Jira!');
    } else if (success === 'false' && error) {
      toast.error(`Authentication failed: ${decodeURIComponent(error)}`);
    }
  }, [searchParams]);

  // Check authentication status
  const checkAuthStatus = async (id?: string) => {
    const accountIdToCheck = id || accountId;
    if (!accountIdToCheck) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/oauth/status?accountId=${accountIdToCheck}`);
      const data = await response.json();
      setAuthStatus(data);
      if (data.authenticated && !id) {
        setAccountId(accountIdToCheck);
      }
    } catch (error: any) {
      console.error('Failed to check auth status:', error);
      toast.error('Failed to check authentication status');
    }
  };

  // Initiate OAuth flow
  const handleAuthorize = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/oauth/authorize`);
      const data = await response.json();

      if (data.success && data.authorizationUrl) {
        // Redirect to Atlassian authorization page
        window.location.href = data.authorizationUrl;
      } else {
        toast.error(data.error || 'Failed to initiate OAuth flow');
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Failed to initiate OAuth:', error);
      toast.error('Failed to initiate OAuth flow');
      setLoading(false);
    }
  };

  // Refresh token
  const handleRefresh = async () => {
    if (!accountId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/oauth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Token refreshed successfully');
        checkAuthStatus();
      } else {
        toast.error(data.error || 'Failed to refresh token');
      }
    } catch (error: any) {
      console.error('Failed to refresh token:', error);
      toast.error('Failed to refresh token');
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    if (!accountId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/oauth/logout`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accountId }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Logged out successfully');
        setAuthStatus(null);
        setAccountId(null);
      } else {
        toast.error(data.error || 'Failed to logout');
      }
    } catch (error: any) {
      console.error('Failed to logout:', error);
      toast.error('Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Jira OAuth Authentication
            </h1>
            <p className="text-gray-600">
              Connect your Jira account using OAuth 2.0 (3LO)
            </p>
          </div>

          {/* Authentication Status */}
          {authStatus && (
            <div className="mb-6 p-4 rounded-lg border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Authentication Status
                </h2>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    authStatus.authenticated
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {authStatus.authenticated ? 'Authenticated' : 'Not Authenticated'}
                </span>
              </div>

              {authStatus.authenticated ? (
                <div className="space-y-2 text-sm text-gray-700">
                  {authStatus.userEmail && (
                    <div>
                      <span className="font-medium">Email:</span> {authStatus.userEmail}
                    </div>
                  )}
                  {authStatus.userName && (
                    <div>
                      <span className="font-medium">Name:</span> {authStatus.userName}
                    </div>
                  )}
                  {authStatus.siteUrl && (
                    <div>
                      <span className="font-medium">Site URL:</span>{' '}
                      <a
                        href={authStatus.siteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {authStatus.siteUrl}
                      </a>
                    </div>
                  )}
                  {authStatus.expiresAt && (
                    <div>
                      <span className="font-medium">Expires:</span>{' '}
                      {new Date(authStatus.expiresAt).toLocaleString()}
                    </div>
                  )}
                  {authStatus.expired && (
                    <div className="text-orange-600 font-medium">
                      Token expired, but refresh token available
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-gray-600">
                  {authStatus.message || 'Please authenticate to continue'}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            {!authStatus?.authenticated ? (
              <button
                onClick={handleAuthorize}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Connecting...' : 'Connect with Jira'}
              </button>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={handleRefresh}
                  disabled={loading || !authStatus.hasRefreshToken}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Refreshing...' : 'Refresh Token'}
                </button>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Logging out...' : 'Logout'}
                </button>
              </div>
            )}

            <button
              onClick={() => navigate('/')}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">How it works:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Click "Connect with Jira" to start the OAuth flow</li>
              <li>You'll be redirected to Atlassian to authorize the app</li>
              <li>After authorization, you'll be redirected back here</li>
              <li>Your access token will be stored securely for API calls</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OAuth;

