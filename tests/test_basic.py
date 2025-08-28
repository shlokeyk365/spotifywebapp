"""
Basic smoke tests for Vibe Projector application.
Tests core functionality without requiring Spotify credentials.
"""

import pytest
import json
from app import create_app


@pytest.fixture
def app():
    """Create and configure a new app instance for each test."""
    app = create_app()
    app.config['TESTING'] = True
    app.config['SECRET_KEY'] = 'test-secret-key'
    return app


@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create a test runner for the app's Click commands."""
    return app.test_cli_runner()


class TestBasicEndpoints:
    """Test basic application endpoints."""
    
    def test_health_endpoint(self, client):
        """Test that /healthz returns 200 OK with correct JSON."""
        response = client.get('/healthz')
        
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        
        data = json.loads(response.data)
        assert data['status'] == 'ok'
    
    def test_root_endpoint_returns_html(self, client):
        """Test that / returns HTML content."""
        response = client.get('/')
        
        assert response.status_code == 200
        assert 'text/html' in response.content_type
        assert 'Vibe Projector' in response.data.decode('utf-8')
    
    def test_nowplaying_unauthorized(self, client):
        """Test that /nowplaying returns 401 without authentication."""
        response = client.get('/nowplaying')
        
        assert response.status_code == 401
        assert response.content_type == 'application/json'
        
        data = json.loads(response.data)
        assert data['error'] == 'unauthorized'
    
    def test_login_redirects_to_spotify(self, client):
        """Test that /login redirects to Spotify OAuth."""
        response = client.get('/login', follow_redirects=False)
        
        # Should redirect to Spotify OAuth
        assert response.status_code in [302, 303]
        assert 'accounts.spotify.com' in response.location
    
    def test_logout_redirects_to_root(self, client):
        """Test that /logout redirects to root page."""
        response = client.get('/logout', follow_redirects=False)
        
        # Should redirect to root
        assert response.status_code in [302, 303]
        assert response.location == '/'
    
    def test_auth_status_unauthorized(self, client):
        """Test that /auth/status returns 200 with unauthenticated status."""
        response = client.get('/auth/status')
        
        assert response.status_code == 200
        assert response.content_type == 'application/json'
        
        data = json.loads(response.data)
        assert data['authenticated'] == False


class TestAppConfiguration:
    """Test application configuration and setup."""
    
    def test_app_creation(self, app):
        """Test that the Flask app can be created successfully."""
        assert app is not None
        assert app.config['TESTING'] == True
    
    def test_app_has_required_extensions(self, app):
        """Test that required Flask extensions are initialized."""
        # Check that Flask-Session is configured
        assert 'SESSION_TYPE' in app.config
        assert app.config['SESSION_TYPE'] == 'filesystem'
    
    def test_app_has_secret_key(self, app):
        """Test that the app has a secret key configured."""
        assert app.config['SECRET_KEY'] is not None
        assert len(app.config['SECRET_KEY']) > 0


class TestStaticFiles:
    """Test that static files are accessible."""
    
    def test_css_files_accessible(self, client):
        """Test that CSS files can be accessed."""
        response = client.get('/static/css/style.css')
        assert response.status_code == 200
        assert 'text/css' in response.content_type
        
        response = client.get('/static/css/scenes.css')
        assert response.status_code == 200
        assert 'text/css' in response.content_type
    
    def test_js_files_accessible(self, client):
        """Test that JavaScript files can be accessed."""
        response = client.get('/static/js/app.js')
        assert response.status_code == 200
        assert 'application/javascript' in response.content_type
    
    def test_template_rendering(self, client):
        """Test that the main template renders correctly."""
        response = client.get('/')
        
        assert response.status_code == 200
        content = response.data.decode('utf-8')
        
        # Check for key HTML elements
        assert 'id="projector"' in content
        assert 'id="main-card"' in content
        assert 'id="toast-container"' in content
        assert 'id="scene-container"' in content
        
        # Check for CSS and JS includes
        assert 'style.css' in content
        assert 'scenes.css' in content
        assert 'app.js' in content


class TestErrorHandling:
    """Test application error handling."""
    
    def test_404_handling(self, client):
        """Test that 404 errors are handled gracefully."""
        response = client.get('/nonexistent-endpoint')
        assert response.status_code == 404
    
    def test_method_not_allowed(self, client):
        """Test that unsupported HTTP methods return 405."""
        response = client.post('/healthz')
        assert response.status_code == 405


if __name__ == '__main__':
    pytest.main([__file__]) 