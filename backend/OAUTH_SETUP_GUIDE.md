# Jira OAuth 2.0 (3LO) Setup Guide

This guide explains how to set up and use OAuth 2.0 (3LO) authentication for accessing Jira APIs.

## Overview

OAuth 2.0 (3LO) allows your application to access Jira APIs on behalf of users without storing their passwords. The flow involves:

1. User clicks "Connect with Jira" on the frontend
2. User is redirected to Atlassian to authorize the app
3. User grants permissions
4. User is redirected back with an authorization code
5. Backend exchanges code for access and refresh tokens
6. Tokens are stored securely (encrypted) in the database
7. Access token is used for API calls until it expires
8. Refresh token is used to get new access tokens

## Prerequisites

1. An Atlassian Developer account
2. A registered OAuth 2.0 app in the [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)

## Step 1: Create OAuth App in Atlassian Developer Console

1. Go to https://developer.atlassian.com/console/myapps/
2. Click **Create** → **New app**
3. Choose **OAuth 2.0 (3LO)** integration
4. Fill in app details:
   - **App name**: Your app name
   - **App logo**: (optional)
   - **App description**: (optional)
5. Configure **Authorization**:
   - **Callback URL**: `http://localhost:4000/oauth/callback` (for development)
   - For production, use your production URL
6. Add **Permissions** (APIs):
   - Add **Jira API**
   - Select required scopes:
     - `read:jira-work` - Read Jira issues, projects, etc.
     - `read:jira-user` - Read user information
     - `write:jira-work` - Create/update Jira issues (if needed)
     - `offline_access` - Get refresh token for long-term access
7. Save your **Client ID** and **Client Secret**

## Step 2: Configure Environment Variables

Add the following to your `.env` file in the `backend` directory:

```env
# Jira OAuth 2.0 (3LO) Configuration
JIRA_OAUTH_CLIENT_ID=your-client-id-here
JIRA_OAUTH_CLIENT_SECRET=your-client-secret-here
JIRA_OAUTH_CALLBACK_URL=http://localhost:4000/oauth/callback
JIRA_OAUTH_SCOPES=read:jira-work read:jira-user write:jira-work offline_access

# OAuth Token Encryption Key (32 bytes hex string)
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
OAUTH_ENCRYPTION_KEY=your-32-byte-hex-encryption-key-here
```

### Generate Encryption Key

Run this command to generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important**: Store this key securely. If you lose it, all encrypted tokens will be unusable. In production, use a secure secret management system.

## Step 3: Update Database Schema

Run Prisma migrations to add the OAuth token table:

```bash
cd backend
npm run db:push
```

Or if using migrations:

```bash
npm run db:migrate
```

## Step 4: Start the Application

1. Start the backend:
```bash
cd backend
npm run dev
```

2. Start the frontend:
```bash
cd frontend
npm start
```

## Step 5: Use OAuth Authentication

1. Navigate to `http://localhost:4000/oauth` in your browser
2. Click **"Connect with Jira"**
3. You'll be redirected to Atlassian
4. Log in and authorize the app
5. You'll be redirected back to the app
6. Your tokens are now stored and ready to use

## API Endpoints

### Backend OAuth Endpoints

- `GET /api/oauth/authorize` - Get authorization URL
- `GET /api/oauth/callback` - Handle OAuth callback (called by Atlassian)
- `GET /api/oauth/status?accountId={id}` - Check authentication status
- `POST /api/oauth/refresh` - Manually refresh access token
- `DELETE /api/oauth/logout` - Revoke and delete tokens
- `GET /api/oauth/token?accountId={id}` - Get token info (for API calls)

### Using OAuth Tokens with JiraService

To use OAuth tokens with the JiraService:

```typescript
import { JiraService } from './services/jiraService';
import { getValidAccessToken } from './services/oauthService';

const accountId = 'user-account-id';
const accessToken = await getValidAccessToken(accountId);

if (accessToken) {
  const jiraService = new JiraService({
    baseUrl: 'https://your-domain.atlassian.net',
    accessToken: accessToken,
    accountId: accountId,
    projectKey: 'PROJECT',
    teamName: 'Team Name',
    importStartDate: '2024-01-01',
    authType: 'oauth',
  });
  
  // Use the service...
}
```

## Token Management

### Automatic Token Refresh

The `getValidAccessToken()` function automatically refreshes expired tokens if a refresh token is available. You don't need to manually refresh tokens in most cases.

### Manual Token Refresh

If you need to manually refresh a token:

```typescript
import { refreshTokenForAccount } from './services/oauthService';

await refreshTokenForAccount(accountId);
```

### Token Expiration

- **Access tokens** expire after a certain period (typically 1 hour)
- **Refresh tokens** expire after 90 days of inactivity
- When a refresh token expires, the user must re-authenticate

## Security Considerations

1. **Encryption Key**: Never commit the encryption key to version control
2. **Client Secret**: Keep the client secret secure
3. **HTTPS**: Always use HTTPS in production
4. **Token Storage**: Tokens are encrypted at rest in the database
5. **State Parameter**: The OAuth flow uses state for CSRF protection

## Troubleshooting

### "Invalid or expired state parameter"

- The state parameter expires after 10 minutes
- Try initiating the OAuth flow again

### "Failed to exchange authorization code"

- Check that your callback URL matches exactly in the Atlassian Developer Console
- Verify your client ID and secret are correct
- Ensure the authorization code hasn't expired (codes expire quickly)

### "No valid access token found"

- The token may have expired and refresh failed
- User may need to re-authenticate
- Check that refresh token is available

### "OAUTH_ENCRYPTION_KEY is not set"

- Set the `OAUTH_ENCRYPTION_KEY` environment variable
- Generate a new key using the command above
- **Warning**: Changing the encryption key will make existing tokens unusable

## Production Deployment

1. Update callback URL in Atlassian Developer Console to production URL
2. Set all environment variables in your production environment
3. Use a secure secret management system for sensitive values
4. Ensure HTTPS is enabled
5. Set `NODE_ENV=production` to enforce encryption key requirement

## Additional Resources

- [Atlassian OAuth 2.0 Documentation](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/)
- [Jira REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)

