# Google Drive Setup Guide for WebDev Studio

## Setting up Google Drive Integration

To use Google Drive functionality in WebDev Studio, you need to set up Google API credentials:

### Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Drive API for your project

### Step 2: Create OAuth 2.0 Credentials

1. In the Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Configure the OAuth consent screen if prompted
4. Choose "Web application" as the application type
5. Add your domain to "Authorized JavaScript origins" (e.g., http://localhost:3000 for local development)
6. Copy the Client ID

### Step 3: Create an API Key

1. In the Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API key"
3. Restrict the API key to Google Drive API for security
4. Copy the API Key

### Step 4: Configure WebDev Studio

1. Open WebDev Studio
2. Go to Settings (Ctrl+,) > Google Drive tab
3. Paste your Client ID and API Key
4. Enable "Auto-Login" if you want automatic sign-in
5. Set your preferred default folder name
6. Save settings

### Step 5: Using Google Drive

1. Click the Google Drive button in the toolbar (blue Google Drive icon)
2. Sign in to your Google account
3. Grant permissions to access your Google Drive
4. Save/load projects directly to/from Google Drive

## Features

- **Auto-login**: Automatically sign in when you open the app
- **Project Management**: Save and load complete projects
- **Folder Navigation**: Browse your Google Drive folders
- **File Management**: Create folders, delete files
- **Secure Storage**: OAuth tokens stored locally for persistent sessions

## Keyboard Shortcuts

- `Ctrl+Shift+D`: Open Google Drive modal
- `Ctrl+S`: Save current file
- `Ctrl+Shift+S`: Save project to Google Drive

## Security Notes

- Your API credentials are stored locally in your browser
- OAuth tokens are managed securely by Google's authentication system
- No credentials are sent to external servers (except Google's official APIs)
- You can revoke access at any time through your Google Account settings

## Troubleshooting

**"Failed to initialize Google Drive"**
- Check that your Client ID and API Key are correct
- Ensure Google Drive API is enabled in your Google Cloud project
- Verify your domain is added to authorized origins

**"Sign in failed"**
- Clear browser cache and cookies
- Check that popup blockers are disabled
- Ensure you're using the correct Google account

**"Failed to load files"**
- Check your internet connection
- Verify you have proper permissions to access Google Drive
- Try signing out and signing back in
