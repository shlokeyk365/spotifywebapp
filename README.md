# Vibe Projector

A fullscreen projector web app that displays current Spotify track information with animated backgrounds.

## Features

- **Spotify Integration**: OAuth authentication and real-time track data
- **Animated Backgrounds**: Multiple visual scenes (Gradient, Blobs, Stripes)
- **Fullscreen Mode**: Optimized for projector displays
- **Real-time Updates**: 3-second polling for current track information

## Quick Start

### Prerequisites

- Python 3.11+
- Spotify Developer Account
- Spotify App credentials

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

5. Test the health endpoint:
   ```bash
   curl http://localhost:5000/healthz
   # Should return: {"status": "ok"}
   ```

## Environment Variables

Copy `.env.example` to `.env` and fill in:

- `FLASK_SECRET_KEY`: Secret key for Flask sessions
- `SPOTIFY_CLIENT_ID`: Your Spotify app client ID
- `SPOTIFY_CLIENT_SECRET`: Your Spotify app client secret
- `SPOTIFY_REDIRECT_URI`: OAuth redirect URI (default: http://localhost:5000/callback)

## Development

- **Backend**: Flask with app factory pattern
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Authentication**: Spotify OAuth with session storage
- **Polling**: 3-second intervals for track updates

## Project Structure

```
spotifywebapp/
├── app/
│   ├── __init__.py      # Flask app factory
│   └── routes.py        # Route definitions
├── templates/            # HTML templates
├── static/              # CSS, JS, images
├── requirements.txt      # Python dependencies
├── .env.example         # Environment variables template
└── README.md            # This file
```

## Next Steps

- [ ] Spotify OAuth implementation
- [ ] Now Playing endpoint
- [ ] Frontend projector interface
- [ ] Animated backgrounds
- [ ] Error handling and edge cases 