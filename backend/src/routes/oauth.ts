import express from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';
import {
  generateAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  getUserInfo,
  getAccessibleSites,
  saveTokens,
  getValidAccessToken,
  getTokenRecord,
  deleteTokens,
  refreshTokenForAccount,
} from '../services/oauthService';

const router = express.Router();

// Store state values temporarily (in production, use Redis or similar)
const stateStore = new Map<string, { timestamp: number }>();

/**
 * GET /api/oauth/authorize
 * Initiate OAuth flow - redirects to Atlassian authorization
 */
router.get('/authorize', (req, res) => {
  try {
    // Generate a random state value for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');
    
    // Store state with timestamp (expires after 10 minutes)
    stateStore.set(state, { timestamp: Date.now() });
    
    // Clean up old states (older than 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [key, value] of stateStore.entries()) {
      if (value.timestamp < tenMinutesAgo) {
        stateStore.delete(key);
      }
    }

    const authUrl = generateAuthorizationUrl(state);
    
    logger.info('OAuth authorization initiated', { state: state.substring(0, 8) + '...' });
    
    res.json({
      success: true,
      authorizationUrl: authUrl,
      state,
    });
  } catch (error: any) {
    logger.error('Failed to generate authorization URL', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to initiate OAuth flow',
    });
  }
});

/**
 * GET /api/oauth/callback
 * Handle OAuth callback - exchange code for tokens
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Check for errors from Atlassian
    if (error) {
      logger.error('OAuth callback error', { error, state });
      return res.status(400).json({
        success: false,
        error: `Authorization failed: ${error}`,
      });
    }

    // Validate state
    if (!state || typeof state !== 'string') {
      logger.error('OAuth callback missing state');
      return res.status(400).json({
        success: false,
        error: 'Missing state parameter',
      });
    }

    // Verify state exists and is not expired
    const stateRecord = stateStore.get(state);
    if (!stateRecord) {
      logger.error('OAuth callback invalid state', { state: state.substring(0, 8) + '...' });
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired state parameter',
      });
    }

    // Remove used state
    stateStore.delete(state);

    // Validate code
    if (!code || typeof code !== 'string') {
      logger.error('OAuth callback missing code');
      return res.status(400).json({
        success: false,
        error: 'Missing authorization code',
      });
    }

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForToken(code);

    // Get user information
    const userInfo = await getUserInfo(tokenResponse.access_token);

    // Get accessible sites
    const sites = await getAccessibleSites(tokenResponse.access_token);
    
    // Use the first Jira site (or you can let user choose)
    const jiraSite = sites.find((site: any) => site.scopes?.includes('read:jira-work') || site.scopes?.includes('write:jira-work'));
    
    if (!jiraSite) {
      logger.warn('No Jira site found in accessible resources', { sitesCount: sites.length });
    }

    // Save tokens
    await saveTokens(
      userInfo.account_id,
      tokenResponse,
      userInfo,
      jiraSite?.id,
      jiraSite?.url
    );

    logger.info('OAuth tokens saved successfully', {
      accountId: userInfo.account_id,
      email: userInfo.email,
      siteUrl: jiraSite?.url,
    });

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
    res.redirect(`${frontendUrl}/oauth/callback?success=true&accountId=${userInfo.account_id}`);
  } catch (error: any) {
    logger.error('OAuth callback failed', { error: error.message, stack: error.stack });
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4000';
    res.redirect(`${frontendUrl}/oauth/callback?success=false&error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * GET /api/oauth/status
 * Get current OAuth authentication status
 */
router.get('/status', async (req, res) => {
  try {
    const accountId = req.query.accountId as string;

    if (!accountId) {
      return res.json({
        authenticated: false,
        message: 'No account ID provided',
      });
    }

    const tokenRecord = await getTokenRecord(accountId);

    if (!tokenRecord) {
      return res.json({
        authenticated: false,
        message: 'No tokens found for this account',
      });
    }

    const isExpired = tokenRecord.expiresAt < new Date();
    const hasRefreshToken = !!tokenRecord.refreshToken;

    return res.json({
      authenticated: !isExpired || hasRefreshToken,
      expired: isExpired,
      hasRefreshToken,
      expiresAt: tokenRecord.expiresAt,
      userEmail: tokenRecord.userEmail,
      userName: tokenRecord.userName,
      siteUrl: tokenRecord.siteUrl,
      cloudId: tokenRecord.cloudId,
    });
  } catch (error: any) {
    logger.error('Failed to get OAuth status', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/oauth/refresh
 * Manually refresh access token
 */
router.post('/refresh', async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required',
      });
    }

    const tokenResponse = await refreshTokenForAccount(accountId);

    logger.info('Token refreshed successfully', { accountId });

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      expiresAt: new Date(Date.now() + (tokenResponse.expires_in * 1000)),
    });
  } catch (error: any) {
    logger.error('Failed to refresh token', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to refresh token',
    });
  }
});

/**
 * DELETE /api/oauth/logout
 * Revoke and delete OAuth tokens
 */
router.delete('/logout', async (req, res) => {
  try {
    const { accountId } = req.body;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required',
      });
    }

    await deleteTokens(accountId);

    logger.info('OAuth tokens revoked', { accountId });

    res.json({
      success: true,
      message: 'Tokens revoked successfully',
    });
  } catch (error: any) {
    logger.error('Failed to revoke tokens', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to revoke tokens',
    });
  }
});

/**
 * GET /api/oauth/token
 * Get valid access token for making API calls
 */
router.get('/token', async (req, res) => {
  try {
    const accountId = req.query.accountId as string;

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Account ID is required',
      });
    }

    const accessToken = await getValidAccessToken(accountId);

    if (!accessToken) {
      return res.status(404).json({
        success: false,
        error: 'No valid access token found. Please re-authenticate.',
      });
    }

    // Return token info (not the actual token for security)
    const tokenRecord = await getTokenRecord(accountId);
    
    res.json({
      success: true,
      hasToken: true,
      expiresAt: tokenRecord?.expiresAt,
      siteUrl: tokenRecord?.siteUrl,
      cloudId: tokenRecord?.cloudId,
    });
  } catch (error: any) {
    logger.error('Failed to get access token', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;

