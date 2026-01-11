import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Encryption key from environment (should be 32 bytes for AES-256)
// WARNING: If not set, a random key will be generated on each restart, making stored tokens unusable
const ENCRYPTION_KEY = process.env.OAUTH_ENCRYPTION_KEY || (() => {
  if (process.env.NODE_ENV === 'production') {
    logger.error('OAUTH_ENCRYPTION_KEY is not set in production! Tokens cannot be encrypted/decrypted.');
    throw new Error('OAUTH_ENCRYPTION_KEY environment variable is required in production');
  }
  logger.warn('OAUTH_ENCRYPTION_KEY not set, using random key. Tokens will be lost on restart!');
  return crypto.randomBytes(32).toString('hex');
})();
const ALGORITHM = 'aes-256-cbc';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
}

interface UserInfo {
  account_id: string;
  email?: string;
  name?: string;
  picture?: string;
}

/**
 * Encrypt sensitive data
 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.substring(0, 32), 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.substring(0, 32), 'hex'), iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Generate authorization URL for OAuth 2.0 (3LO)
 */
export function generateAuthorizationUrl(state: string): string {
  const clientId = process.env.JIRA_OAUTH_CLIENT_ID;
  const callbackUrl = process.env.JIRA_OAUTH_CALLBACK_URL || 'http://localhost:4000/oauth/callback';
  const scopes = process.env.JIRA_OAUTH_SCOPES || 'read:jira-work read:jira-user write:jira-work offline_access';

  if (!clientId) {
    throw new Error('JIRA_OAUTH_CLIENT_ID is not configured');
  }

  const params = new URLSearchParams({
    audience: 'api.atlassian.com',
    client_id: clientId,
    scope: scopes,
    redirect_uri: callbackUrl,
    state: state,
    response_type: 'code',
    prompt: 'consent',
  });

  return `https://auth.atlassian.com/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const clientId = process.env.JIRA_OAUTH_CLIENT_ID;
  const clientSecret = process.env.JIRA_OAUTH_CLIENT_SECRET;
  const callbackUrl = process.env.JIRA_OAUTH_CALLBACK_URL || 'http://localhost:4000/oauth/callback';

  if (!clientId || !clientSecret) {
    throw new Error('JIRA_OAUTH_CLIENT_ID or JIRA_OAUTH_CLIENT_SECRET is not configured');
  }

  try {
    const response = await axios.post('https://auth.atlassian.com/oauth/token', {
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: callbackUrl,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to exchange code for token', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(`Failed to exchange authorization code: ${error.response?.data?.error_description || error.message}`);
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenResponse> {
  const clientId = process.env.JIRA_OAUTH_CLIENT_ID;
  const clientSecret = process.env.JIRA_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('JIRA_OAUTH_CLIENT_ID or JIRA_OAUTH_CLIENT_SECRET is not configured');
  }

  try {
    const response = await axios.post('https://auth.atlassian.com/oauth/token', {
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to refresh token', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    throw new Error(`Failed to refresh token: ${error.response?.data?.error_description || error.message}`);
  }
}

/**
 * Get user information from Atlassian
 */
export async function getUserInfo(accessToken: string): Promise<UserInfo> {
  try {
    const response = await axios.get('https://api.atlassian.com/me', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to get user info', {
      error: error.message,
      status: error.response?.status,
    });
    throw new Error(`Failed to get user information: ${error.message}`);
  }
}

/**
 * Get accessible Jira sites for the user
 */
export async function getAccessibleSites(accessToken: string): Promise<any[]> {
  try {
    const response = await axios.get('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
    });

    return response.data;
  } catch (error: any) {
    logger.error('Failed to get accessible sites', {
      error: error.message,
      status: error.response?.status,
    });
    throw new Error(`Failed to get accessible sites: ${error.message}`);
  }
}

/**
 * Save OAuth tokens to database
 */
export async function saveTokens(
  accountId: string,
  tokenResponse: TokenResponse,
  userInfo?: UserInfo,
  cloudId?: string,
  siteUrl?: string
): Promise<void> {
  const expiresAt = new Date(Date.now() + (tokenResponse.expires_in * 1000));

  const encryptedAccessToken = encrypt(tokenResponse.access_token);
  const encryptedRefreshToken = tokenResponse.refresh_token ? encrypt(tokenResponse.refresh_token) : null;

  await prisma.oAuthToken.upsert({
    where: { accountId },
    update: {
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
      scope: tokenResponse.scope,
      cloudId: cloudId || undefined,
      siteUrl: siteUrl || undefined,
      userAccountId: userInfo?.account_id,
      userEmail: userInfo?.email,
      userName: userInfo?.name,
      updatedAt: new Date(),
    },
    create: {
      accountId,
      accessToken: encryptedAccessToken,
      refreshToken: encryptedRefreshToken,
      expiresAt,
      scope: tokenResponse.scope,
      cloudId: cloudId || undefined,
      siteUrl: siteUrl || undefined,
      userAccountId: userInfo?.account_id,
      userEmail: userInfo?.email,
      userName: userInfo?.name,
    },
  });

  logger.info('OAuth tokens saved', { accountId, hasRefreshToken: !!tokenResponse.refresh_token });
}

/**
 * Get valid access token for account
 */
export async function getValidAccessToken(accountId: string): Promise<string | null> {
  const tokenRecord = await prisma.oAuthToken.findUnique({
    where: { accountId },
  });

  if (!tokenRecord) {
    return null;
  }

  // Check if token is expired
  if (tokenRecord.expiresAt < new Date()) {
    // Try to refresh if we have a refresh token
    if (tokenRecord.refreshToken) {
      try {
        const decryptedRefreshToken = decrypt(tokenRecord.refreshToken);
        const tokenResponse = await refreshAccessToken(decryptedRefreshToken);
        
        // Update tokens
        await saveTokens(accountId, tokenResponse);
        
        // Return new access token
        const updatedRecord = await prisma.oAuthToken.findUnique({
          where: { accountId },
        });
        return updatedRecord ? decrypt(updatedRecord.accessToken) : null;
      } catch (error: any) {
        logger.error('Failed to refresh expired token', {
          accountId,
          error: error.message,
        });
        return null;
      }
    } else {
      logger.warn('Access token expired and no refresh token available', { accountId });
      return null;
    }
  }

  return decrypt(tokenRecord.accessToken);
}

/**
 * Get OAuth token record
 */
export async function getTokenRecord(accountId: string) {
  return prisma.oAuthToken.findUnique({
    where: { accountId },
  });
}

/**
 * Refresh token for a specific account
 */
export async function refreshTokenForAccount(accountId: string): Promise<TokenResponse> {
  const tokenRecord = await getTokenRecord(accountId);

  if (!tokenRecord || !tokenRecord.refreshToken) {
    throw new Error('No refresh token found for this account');
  }

  const decryptedRefreshToken = decrypt(tokenRecord.refreshToken);
  const tokenResponse = await refreshAccessToken(decryptedRefreshToken);

  // Update tokens
  await saveTokens(accountId, tokenResponse);

  return tokenResponse;
}

/**
 * Delete OAuth tokens
 */
export async function deleteTokens(accountId: string): Promise<void> {
  await prisma.oAuthToken.delete({
    where: { accountId },
  });
  logger.info('OAuth tokens deleted', { accountId });
}

