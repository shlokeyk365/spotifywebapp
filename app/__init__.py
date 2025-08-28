from flask import Flask
from flask_session import Session
import os
from dotenv import load_dotenv

def create_app():
    """Flask application factory."""
    # Load environment variables
    load_dotenv()
    
    app = Flask(__name__)
    
    # Basic configuration
    app.config['SECRET_KEY'] = os.getenv('FLASK_SECRET_KEY', 'dev-secret-key-change-in-production')
    app.config['SESSION_TYPE'] = 'filesystem'
    app.config['SESSION_FILE_DIR'] = 'flask_session'
    
    # Initialize extensions
    Session(app)
    
    # Register blueprints/routes
    from app.routes import main_bp
    app.register_blueprint(main_bp)
    
    return app 