from flask import Blueprint, jsonify

main_bp = Blueprint('main', __name__)

@main_bp.route('/healthz')
def health_check():
    """Health check endpoint for monitoring."""
    return jsonify({"status": "ok"}), 200

@main_bp.route('/')
def index():
    """Main projector page - placeholder for now."""
    return "Vibe Projector - Coming Soon", 200 