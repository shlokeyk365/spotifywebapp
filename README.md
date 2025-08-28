# Vibe Projector

A fullscreen projector web app that displays current Spotify track information with animated backgrounds.

## Features

- **Spotify Integration**: OAuth authentication and real-time track data
- **Fullscreen Projector Interface**: Optimized for projector displays with dark theme
- **Animated Background Scenes**: 3 beautiful animated scenes with smooth transitions
- **Real-time Updates**: 3-second polling for current track information
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Keyboard Shortcuts**: Number keys for scenes, F key for fullscreen mode
- **Scene Persistence**: Remembers your favorite scene across sessions
- **Comprehensive Error Handling**: Graceful handling of all edge cases and network issues
- **Toast Notifications**: Unobtrusive status updates and error messages

## Quick Start

### Prerequisites

- Python 3.11+
- Spotify Developer Account
- Spotify App credentials

### Spotify App Setup

1. **Create a Spotify App**:
   - Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
   - Click "Create App"
   - Fill in app details:
     - App name: `Vibe Projector` (or your preferred name)
     - App description: `Fullscreen projector for Spotify tracks`
     - Redirect URI: `http://127.0.0.1:5000/callback`
     - Website: `http://localhost:5000`
   - Accept terms and create app

2. **Get Your Credentials**:
   - Copy your `Client ID` and `Client Secret`
   - These will be used in your `.env` file

3. **Configure Redirect URI**:
   - In your app settings, ensure the redirect URI is exactly: `http://127.0.0.1:5000/callback`
   - This must match the `SPOTIFY_REDIRECT_URI` in your `.env` file (use `127.0.0.1` not `localhost`)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd spotifywebapp
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your Spotify credentials
   ```

4. Run the application:
   ```bash
   flask run
   ```

5. Test the interface:
   - Visit `http://localhost:5000`
   - See the projector interface with animated background
   - Press 1/2/3 to switch between scenes
   - Click "Connect Spotify" to authenticate
   - Press F for fullscreen mode
   - Test error scenarios by disconnecting internet

## Environment Variables

Copy `.env.example` to `.env` and fill in:

- `FLASK_SECRET_KEY`: Secret key for Flask sessions
- `SPOTIFY_CLIENT_ID`: Your Spotify app client ID
- `SPOTIFY_CLIENT_SECRET`: Your Spotify app client secret
   - `SPOTIFY_REDIRECT_URI`: OAuth redirect URI (default: http://127.0.0.1:5000/callback)

## OAuth Flow

The app implements the Spotify OAuth 2.0 Authorization Code flow:

1. **Login** (`/login`): Redirects to Spotify authorization
2. **Callback** (`/callback`): Handles Spotify response and stores tokens
3. **Session Management**: Tokens stored securely in Flask session
4. **Token Refresh**: Automatic refresh with retry logic
5. **Logout** (`/logout`): Clears session and tokens

### Security Features

- **State Parameter**: CSRF protection using random state tokens
- **Session Storage**: Server-side token storage (never exposed to browser)
- **Token Expiration**: Automatic refresh before expiration
- **Error Handling**: Graceful fallback for token failures

## API Endpoints

### Authentication & OAuth
- `GET /` - Main projector page (requires authentication)
- `GET /login` - Initiate Spotify OAuth flow
- `GET /callback` - OAuth callback handler
- `GET /logout` - Clear session and logout
- `GET /auth/status` - Authentication status and token info

### Data & Status
- `GET /healthz` - Health check endpoint
- `GET /nowplaying` - Current track information

## Now Playing Endpoint

The `/nowplaying` endpoint provides real-time track information from Spotify:

### Authentication Required
- Returns `401 Unauthorized` if no valid session tokens
- Automatically refreshes expired tokens with retry logic

### Response Format

**When track is playing:**
```json
{
  "isPlaying": true,
  "title": "Song Title",
  "artist": "Artist Name",
  "coverUrl": "https://i.scdn.co/image/...",
  "deviceName": "Device Name",
  "progressMs": 45000,
  "durationMs": 180000
}
```

**When paused or nothing playing:**
```json
{
  "isPlaying": false,
  "title": null,
  "artist": null,
  "coverUrl": null,
  "deviceName": null,
  "progressMs": 0,
  "durationMs": 0
}
```

**Error responses:**
```json
{
  "error": "unauthorized"
}
```

### Error Handling

- **401 Unauthorized**: No valid session or token refresh failed
- **503 Service Unavailable**: Network or Spotify API errors
- **500 Internal Server Error**: Unexpected errors

The endpoint automatically handles:
- Token expiration and refresh
- Spotify API rate limits
- Network connectivity issues
- Various playback states (playing, paused, stopped)

## User Interface

### Projector Interface
The main interface is designed for fullscreen projector use with:

- **Dark Theme**: Optimized for low-light environments
- **Large Typography**: Readable from a distance
- **Status Badges**: Real-time playback status indicators
- **Progress Bars**: Visual track progress with time display
- **Cover Art**: High-quality album artwork display
- **Device Info**: Shows which Spotify device is active

### Animated Background Scenes
Three beautiful animated scenes to choose from:

1. **Gradient Scene** (Key 1): Smooth color-shifting gradient background
2. **Blobs Scene** (Key 2): Drifting, colorful blob animations
3. **Galaxy Scene** (Key 3): Space-themed stripes with floating particles

**Scene Features:**
- **Instant Switching**: Press 1/2/3 to change scenes immediately
- **Smooth Transitions**: Elegant fade effects between scenes
- **Persistence**: Your chosen scene is remembered across sessions
- **Responsive**: All scenes adapt to different screen sizes
- **Performance Optimized**: Smooth 60fps animations

### Interactive Features
- **Scene Switching**: Number keys 1/2/3 for instant scene changes
- **Fullscreen Mode**: F key or click button to enter fullscreen
- **Real-time Updates**: UI updates every 3 seconds automatically
- **Responsive Design**: Adapts to different screen sizes
- **Loading States**: Smooth transitions and loading indicators
- **Error Handling**: User-friendly error messages and retry options

### Error Handling & Edge Cases
The app gracefully handles all error scenarios with user-friendly feedback:

#### **Toast Notification System**
- **Success (Green)**: Positive status updates and confirmations
- **Error (Red)**: Critical errors requiring user attention
- **Warning (Orange)**: Warnings and retry attempts
- **Info (Blue)**: General information and status updates

#### **Network Error Management**
- **Automatic Detection**: Detects network connectivity issues
- **Retry Logic**: Exponential backoff retry with 3 attempts
- **User Feedback**: Clear status messages and progress indicators
- **Recovery**: Automatic recovery when network is restored

#### **Authentication Error Handling**
- **Token Expiration**: Graceful handling with login prompts
- **Session Management**: Secure token storage and refresh
- **User Guidance**: Clear instructions for re-authentication

#### **Playback State Management**
- **Playing**: Full track information with progress
- **Paused**: Track info with paused status indicator
- **Nothing Playing**: Placeholder content with music icon
- **Device Changes**: Automatic device information updates

### Keyboard Shortcuts
- **1**: Switch to Gradient scene
- **2**: Switch to Blobs scene  
- **3**: Switch to Galaxy scene
- **F**: Toggle fullscreen mode
- **Click**: Enter fullscreen (mobile-friendly)

### UI States
1. **Loading**: Initial connection to Spotify
2. **Unauthorized**: Connect Spotify button displayed
3. **No Track**: Placeholder content with music icon
4. **Playing**: Full track information with progress bar
5. **Paused**: Track info with paused status
6. **Error**: Error overlay with retry option
7. **Network Error**: Network status with retry indicators

## Development

- **Backend**: Flask with app factory pattern
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Authentication**: Spotify OAuth with session storage
- **Polling**: 3-second intervals for track updates
- **Responsive**: Mobile-first CSS with media queries
- **Animations**: CSS animations and JavaScript transitions
- **Storage**: localStorage for user preferences
- **Error Handling**: Comprehensive edge case management
- **Network Resilience**: Automatic retry and recovery logic

## Project Structure

```
spotifywebapp/
├── app/
│   ├── __init__.py      # Flask app factory
│   ├── routes.py        # Route definitions (OAuth + main + nowplaying)
│   └── spotify.py       # Spotify OAuth helpers + API functions
├── templates/
│   └── index.html       # Main projector interface with scenes + toast system
├── static/
│   ├── css/
│   │   ├── style.css    # Dark theme styles + responsive design + toast system
│   │   └── scenes.css   # Animated background scenes
│   ├── js/
│   │   └── app.js       # Frontend logic + polling + scene management + error handling
│   └── images/          # Static images and placeholders
├── requirements.txt      # Python dependencies
├── .env.example         # Environment variables template
└── README.md            # This file
```

## Troubleshooting

### Common Issues

1. **"OAuth configuration error"**:
   - Check that `SPOTIFY_CLIENT_ID` is set in `.env`
   - Verify your Spotify app is properly configured

2. **"Invalid state parameter"**:
   - This is a security feature - try logging in again
   - Clear browser cookies if issue persists

3. **"Token exchange failed"**:
   - Verify `SPOTIFY_CLIENT_SECRET` is correct
   - Check that redirect URI matches exactly in Spotify app settings

4. **Session not persisting**:
   - Ensure `FLASK_SECRET_KEY` is set
   - Check that `flask_session/` directory is writable

5. **"/nowplaying returns 401"**:
   - Check if you're logged in with Spotify
   - Verify tokens haven't expired
   - Try logging out and back in

6. **Frontend not updating**:
   - Check browser console for JavaScript errors
   - Verify the app is running and accessible
   - Check network tab for API request failures

7. **Scenes not switching**:
   - Check browser console for JavaScript errors
   - Verify scenes.css is being loaded
   - Try refreshing the page

8. **Network errors persist**:
   - Check internet connection
   - Verify firewall settings
   - Check browser network tab for failed requests

### Testing OAuth

- Use the `/auth/status` endpoint to check token validity
- Monitor Flask logs for detailed error messages
- Test with a fresh browser session to avoid cached tokens

### Testing Now Playing

- Ensure you have an active Spotify session
- Try playing/pausing music to test different states
- Check the response format matches the documentation
- Verify error handling with invalid tokens

### Testing Frontend

- Check that all static files are being served
- Verify JavaScript console for any errors
- Test fullscreen functionality (F key + click)
- Test responsive design on different screen sizes

### Testing Scenes

- Press 1/2/3 to switch between scenes
- Check that scene transitions are smooth
- Verify scene persistence after page refresh
- Test scene switching in fullscreen mode

### Testing Error Handling

- **Network Errors**: Disconnect internet to test network error handling
- **Authentication Errors**: Let tokens expire to test auth error handling
- **Playback States**: Pause/play music to test status updates
- **Toast Notifications**: Check all notification types appear correctly
- **Retry Logic**: Verify automatic retry with exponential backoff
- **Error Recovery**: Test recovery when network is restored

## Next Steps

- [x] Project scaffolding and configuration
- [x] Spotify OAuth implementation
- [x] Now Playing endpoint
- [x] Frontend projector interface
- [x] Animated backgrounds and scene management
- [x] Comprehensive error handling and edge cases 