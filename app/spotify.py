import os
import requests
from urllib.parse import urlencode
import base64
import secrets
import time

# Spotify OAuth Configuration
SPOTIFY_CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
SPOTIFY_CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')
SPOTIFY_REDIRECT_URI = os.getenv('SPOTIFY_REDIRECT_URI', 'http://127.0.0.1:5000/callback')

# Spotify API endpoints
SPOTIFY_AUTH_URL = 'https://accounts.spotify.com/authorize'
SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
SPOTIFY_NOW_PLAYING_URL = 'https://api.spotify.com/v1/me/player/currently-playing'

def get_authorize_url(state):
    """
    Build Spotify authorization URL for OAuth flow.
    
    Args:
        state (str): Random state parameter for security
        
    Returns:
        str: Complete authorization URL
    """
    if not SPOTIFY_CLIENT_ID:
        raise ValueError("SPOTIFY_CLIENT_ID not configured")
    
    params = {
        'client_id': SPOTIFY_CLIENT_ID,
        'response_type': 'code',
        'redirect_uri': SPOTIFY_REDIRECT_URI,
        'state': state,
        'scope': 'user-read-currently-playing user-read-playback-state'
    }
    
    return f"{SPOTIFY_AUTH_URL}?{urlencode(params)}"

def exchange_code_for_token(code):
    """
    Exchange authorization code for access and refresh tokens.
    
    Args:
        code (str): Authorization code from Spotify callback
        
    Returns:
        dict: Token response with access_token, refresh_token, expires_in
    """
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        raise ValueError("Spotify credentials not configured")
    
    # Prepare authorization header
    credentials = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    
    headers = {
        'Authorization': f'Basic {encoded_credentials}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    data = {
        'grant_type': 'authorization_code',
        'code': code,
        'redirect_uri': SPOTIFY_REDIRECT_URI
    }
    
    response = requests.post(SPOTIFY_TOKEN_URL, headers=headers, data=data)
    
    if response.status_code != 200:
        raise Exception(f"Token exchange failed: {response.status_code} - {response.text}")
    
    return response.json()

def refresh_access_token(refresh_token):
    """
    Refresh expired access token using refresh token.
    
    Args:
        refresh_token (str): Valid refresh token
        
    Returns:
        dict: New token response with access_token, expires_in
    """
    if not SPOTIFY_CLIENT_ID or not SPOTIFY_CLIENT_SECRET:
        raise ValueError("Spotify credentials not configured")
    
    # Prepare authorization header
    credentials = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
    encoded_credentials = base64.b64encode(credentials.encode()).decode()
    
    headers = {
        'Authorization': f'Basic {encoded_credentials}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    data = {
        'grant_type': 'refresh_token',
        'refresh_token': refresh_token
    }
    
    response = requests.post(SPOTIFY_TOKEN_URL, headers=headers, data=data)
    
    if response.status_code != 200:
        raise Exception(f"Token refresh failed: {response.status_code} - {response.text}")
    
    return response.json()

def is_token_expired(token_data):
    """
    Check if access token is expired or will expire soon.
    
    Args:
        token_data (dict): Token data from session
        
    Returns:
        bool: True if token is expired or expires within 60 seconds
    """
    if not token_data or 'expires_at' not in token_data:
        return True
    
    current_time = int(time.time())
    # Consider token expired if it expires within 60 seconds
    return current_time >= (token_data['expires_at'] - 60)

def refresh_token_if_needed(token_data):
    """
    Refresh access token if it's expired, with one retry attempt.
    
    Args:
        token_data (dict): Current token data from session
        
    Returns:
        dict: Updated token data (original if refresh not needed)
        
    Raises:
        Exception: If token refresh fails after retry
    """
    if not is_token_expired(token_data):
        return token_data
    
    if not token_data or 'refresh_token' not in token_data:
        raise Exception("No refresh token available")
    
    try:
        # First attempt
        new_tokens = refresh_access_token(token_data['refresh_token'])
        
        # Update token data
        updated_tokens = {
            'access_token': new_tokens['access_token'],
            'refresh_token': new_tokens.get('refresh_token', token_data['refresh_token']),
            'expires_in': new_tokens['expires_in'],
            'expires_at': int(time.time()) + new_tokens['expires_in']
        }
        
        return updated_tokens
        
    except Exception as e:
        # Retry once
        try:
            new_tokens = refresh_access_token(token_data['refresh_token'])
            
            updated_tokens = {
                'access_token': new_tokens['access_token'],
                'refresh_token': new_tokens.get('refresh_token', token_data['refresh_token']),
                'expires_in': new_tokens['expires_in'],
                'expires_at': int(time.time()) + new_tokens['expires_in']
            }
            
            return updated_tokens
            
        except Exception as retry_error:
            raise Exception(f"Token refresh failed after retry: {retry_error}") 

def get_now_playing(access_token):
    """
    Get current track information from Spotify.
    
    Args:
        access_token (str): Valid Spotify access token
        
    Returns:
        dict: Track information or None if nothing playing
        
    Raises:
        Exception: If API request fails
    """
    headers = {
        'Authorization': f'Bearer {access_token}'
    }
    
    try:
        response = requests.get(SPOTIFY_NOW_PLAYING_URL, headers=headers)
        
        if response.status_code == 204:
            # No content - nothing currently playing
            return {
                "isPlaying": False,
                "title": None,
                "artist": None,
                "coverUrl": None,
                "deviceName": None,
                "progressMs": 0,
                "durationMs": 0
            }
        
        if response.status_code == 200:
            data = response.json()
            
            if not data or 'item' not in data:
                # No track data
                return {
                    "isPlaying": False,
                    "title": None,
                    "artist": None,
                    "coverUrl": None,
                    "deviceName": None,
                    "progressMs": 0,
                    "durationMs": 0
                }
            
            track = data['item']
            is_playing = data.get('is_playing', False)
            
            # Extract track information
            title = track.get('name', 'Unknown Track')
            
            # Get artist(s) - handle multiple artists
            artists = track.get('artists', [])
            if artists:
                artist = ', '.join([artist.get('name', 'Unknown Artist') for artist in artists])
            else:
                artist = 'Unknown Artist'
            
            # Get cover image URL
            album = track.get('album', {})
            images = album.get('images', [])
            cover_url = images[0].get('url') if images else None
            
            # Get device information
            device = data.get('device', {})
            device_name = device.get('name', 'Unknown Device')
            
            # Get progress and duration
            progress_ms = data.get('progress_ms', 0)
            duration_ms = track.get('duration_ms', 0)
            
            return {
                "isPlaying": is_playing,
                "title": title,
                "artist": artist,
                "coverUrl": cover_url,
                "deviceName": device_name,
                "progressMs": progress_ms,
                "durationMs": duration_ms
            }
        
        elif response.status_code == 401:
            # Unauthorized - token expired or invalid
            raise Exception("Token expired or invalid")
        
        else:
            # Other API errors
            raise Exception(f"Spotify API error: {response.status_code} - {response.text}")
            
    except requests.exceptions.RequestException as e:
        raise Exception(f"Network error: {str(e)}")
    except Exception as e:
        raise Exception(f"Unexpected error: {str(e)}") 