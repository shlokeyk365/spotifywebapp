from flask import Blueprint, jsonify, redirect, request, session, url_for, render_template
import secrets
import time
from app.spotify import (
    get_authorize_url, 
    exchange_code_for_token, 
    refresh_token_if_needed,
    get_now_playing
)

main_bp = Blueprint('main', __name__)

@main_bp.route('/healthz')
def health_check():
    """Health check endpoint for monitoring."""
    return jsonify({"status": "ok"}), 200

@main_bp.route('/')
def index():
    """Main projector page."""
    return render_template('index.html')

@main_bp.route('/login')
def login():
    """Redirect user to Spotify OAuth authorization."""
    # Generate random state parameter for security
    state = secrets.token_urlsafe(32)
    session['oauth_state'] = state
    
    try:
        # Get Spotify authorization URL
        auth_url = get_authorize_url(state)
        return redirect(auth_url)
    except Exception as e:
        return jsonify({"error": f"OAuth configuration error: {str(e)}"}), 500

@main_bp.route('/callback')
def callback():
    """Handle Spotify OAuth callback and exchange code for tokens."""
    # Verify state parameter to prevent CSRF attacks
    if request.args.get('state') != session.get('oauth_state'):
        return jsonify({"error": "Invalid state parameter"}), 400
    
    # Check for authorization code
    code = request.args.get('code')
    if not code:
        error = request.args.get('error')
        return jsonify({"error": f"Authorization failed: {error}"}), 400
    
    try:
        # Exchange authorization code for tokens
        token_response = exchange_code_for_token(code)
        
        # Store tokens in session with expiration tracking
        session['spotify_tokens'] = {
            'access_token': token_response['access_token'],
            'refresh_token': token_response['refresh_token'],
            'expires_in': token_response['expires_in'],
            'expires_at': int(time.time()) + token_response['expires_in']
        }
        
        # Clear OAuth state
        session.pop('oauth_state', None)
        
        # Redirect to main page
        return redirect(url_for('main.index'))
        
    except Exception as e:
        return jsonify({"error": f"Token exchange failed: {str(e)}"}), 500

@main_bp.route('/logout')
def logout():
    """Clear user session and redirect to home."""
    # Clear all session data
    session.clear()
    return redirect(url_for('main.index'))

@main_bp.route('/auth/status')
def auth_status():
    """Check authentication status and token validity."""
    if 'spotify_tokens' not in session:
        return jsonify({"authenticated": False}), 200
    
    try:
        # Check if token needs refresh
        tokens = refresh_token_if_needed(session['spotify_tokens'])
        
        # Update session if tokens were refreshed
        if tokens != session['spotify_tokens']:
            session['spotify_tokens'] = tokens
        
        return jsonify({
            "authenticated": True,
            "token_expires_in": tokens['expires_at'] - int(time.time())
        }), 200
        
    except Exception as e:
        # Clear invalid tokens
        session.pop('spotify_tokens', None)
        return jsonify({
            "authenticated": False,
            "error": "Token refresh failed"
        }), 401 

@main_bp.route('/nowplaying')
def now_playing():
    """Get current track information from Spotify."""
    # Check if user is authenticated
    if 'spotify_tokens' not in session:
        return jsonify({"error": "unauthorized"}), 401
    
    try:
        # Get tokens and refresh if needed
        tokens = refresh_token_if_needed(session['spotify_tokens'])
        
        # Update session if tokens were refreshed
        if tokens != session['spotify_tokens']:
            session['spotify_tokens'] = tokens
        
        # Get current track information
        track_info = get_now_playing(tokens['access_token'])
        
        return jsonify(track_info), 200
        
    except Exception as e:
        error_message = str(e)
        
        # Handle specific error cases
        if "Token expired or invalid" in error_message:
            # Try to refresh token once more
            try:
                if 'spotify_tokens' in session and 'refresh_token' in session['spotify_tokens']:
                    new_tokens = refresh_token_if_needed(session['spotify_tokens'])
                    session['spotify_tokens'] = new_tokens
                    
                    # Retry the request
                    track_info = get_now_playing(new_tokens['access_token'])
                    return jsonify(track_info), 200
                    
            except Exception as refresh_error:
                # Clear invalid tokens and return error
                session.pop('spotify_tokens', None)
                return jsonify({"error": "token_refresh_failed"}), 401
        
        # For other errors, return appropriate status
        if "unauthorized" in error_message.lower():
            session.pop('spotify_tokens', None)
            return jsonify({"error": "unauthorized"}), 401
        elif "network error" in error_message.lower():
            return jsonify({"error": "network_error"}), 503
        else:
            return jsonify({"error": "spotify_api_error"}), 500 