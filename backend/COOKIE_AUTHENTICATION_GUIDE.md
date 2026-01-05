# Cookie Authentication Guide for Jira

This guide explains how to use browser cookies for Jira authentication when API keys are not available or working.

## Why Use Cookie Authentication?

- **API Key Issues**: When Jira API keys don't work due to permissions or configuration issues
- **Browser Access**: You can access Jira through the browser but not via API
- **Session Reuse**: Leverage your existing browser session for data import

## How to Get Browser Cookies

### Step 1: Log into Jira
1. Open your web browser
2. Navigate to your Jira instance (e.g., `https://your-domain.atlassian.net`)
3. Log in with your credentials

### Step 2: Open Developer Tools
1. Press `F12` (or `Ctrl+Shift+I` on Windows/Linux, `Cmd+Option+I` on Mac)
2. This opens the browser's Developer Tools

### Step 3: Navigate to Cookies
1. Click on the **Application** tab (Chrome) or **Storage** tab (Firefox)
2. In the left sidebar, expand **Cookies**
3. Click on your Jira domain (e.g., `https://your-domain.atlassian.net`)

### Step 4: Copy Cookie Values
1. You'll see a list of cookies with Name and Value columns
2. Copy the **entire cookie string** in this format:
   ```
   name1=value1; name2=value2; name3=value3
   ```
3. **Important**: Copy ALL cookies, not just one

### Example Cookie String
```
atlassian.xsrf.token=abc123; JSESSIONID=xyz789; cloud.session.token=def456; atlassian.meta.session=ghi789
```

## Using Cookie Authentication in the Dashboard

### Step 1: Access Import Configuration
1. Go to the **Import Config** page in the dashboard
2. Click **Add Configuration** or edit an existing one

### Step 2: Select Authentication Type
1. In the **Authentication Type** dropdown, select **"Browser Cookies"**
2. This will show the cookie input field

### Step 3: Enter Cookie Data
1. Paste your copied cookie string into the **Browser Cookies** field
2. Fill in other required fields (Team Name, Project Key, Jira URL, etc.)

### Step 4: Test Connection
1. Click **Test Connection** to verify the cookies work
2. If successful, you'll see a green success message
3. If failed, you may need to refresh your browser session and copy new cookies

### Step 5: Save Configuration
1. Click **Save Configuration** to store the settings
2. The configuration will now use cookie authentication for imports

## Important Notes

### Cookie Expiration
- **Browser cookies expire** when your browser session ends
- **Refresh cookies regularly** by logging out and back into Jira
- **Copy new cookies** when the old ones stop working

### Security Considerations
- **Cookies contain session information** - treat them like passwords
- **Don't share cookies** with others
- **Use HTTPS** for your Jira instance when possible

### Common Issues

#### "Invalid or expired cookies" Error
- **Solution**: Log out of Jira, log back in, and copy fresh cookies
- **Cause**: Cookies have expired or been invalidated

#### "Access forbidden" Error
- **Solution**: Ensure you have proper permissions in Jira
- **Cause**: Your account doesn't have API access rights

#### "Cannot connect to Jira server" Error
- **Solution**: Check the Jira Base URL is correct
- **Cause**: Wrong URL or network connectivity issues

## Cookie Format Requirements

### Correct Format
```
cookie1=value1; cookie2=value2; cookie3=value3
```

### Incorrect Formats
```
cookie1=value1 cookie2=value2  // Missing semicolons
cookie1=value1; cookie2=value2;  // Trailing semicolon
cookie1=value1;cookie2=value2   // Missing spaces
```

## Troubleshooting

### Step-by-Step Debugging

1. **Verify Jira Access**
   - Can you access Jira in your browser?
   - Are you logged in successfully?

2. **Check Cookie Format**
   - Are cookies separated by semicolons and spaces?
   - Did you copy ALL cookies, not just one?

3. **Test Connection**
   - Use the "Test Connection" button
   - Check the error message for specific issues

4. **Refresh Session**
   - Log out of Jira completely
   - Log back in
   - Copy fresh cookies

### Browser-Specific Instructions

#### Chrome
1. F12 → Application → Cookies → your-domain
2. Copy all cookie values

#### Firefox
1. F12 → Storage → Cookies → your-domain
2. Copy all cookie values

#### Safari
1. Develop menu → Show Web Inspector → Storage → Cookies
2. Copy all cookie values

#### Edge
1. F12 → Application → Cookies → your-domain
2. Copy all cookie values

## Best Practices

1. **Regular Updates**: Refresh cookies weekly or when imports fail
2. **Secure Storage**: Don't store cookies in plain text files
3. **Test First**: Always test connection before running imports
4. **Monitor Logs**: Check import logs for authentication errors
5. **Backup Method**: Keep API key authentication as backup if possible

## Alternative: Automated Cookie Refresh

For production use, consider implementing:
- **Automated cookie refresh** using browser automation
- **Session management** to handle cookie expiration
- **Fallback mechanisms** when cookies fail

## Support

If you continue to have issues:
1. Check the backend logs for detailed error messages
2. Verify your Jira instance supports the REST API
3. Ensure your account has proper permissions
4. Try the API key method as an alternative

Remember: Cookie authentication is a workaround for when API keys don't work. For production systems, API keys are generally more reliable and secure.
