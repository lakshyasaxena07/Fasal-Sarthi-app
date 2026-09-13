from functools import wraps
from flask import request, jsonify, g, current_app
from app.extensions import supabase_client

def token_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # In testing mode without auth configured, allow testing bypass if explicitly configured
        if current_app.config.get('TESTING') and current_app.config.get('BYPASS_AUTH_FOR_TESTS'):
            g.user = {"id": "test-user-id", "email": "test@example.com"}
            return f(*args, **kwargs)

        from app import extensions
        client = extensions.supabase_client
        if not client:
            return jsonify({"error": "Authentication system is not configured."}), 503

        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({"error": "Authorization header missing."}), 401

        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({"error": "Invalid Authorization header format. Must be 'Bearer <token>'."}), 401

        jwt_token = parts[1]

        try:
            user_response = client.auth.get_user(jwt_token)
            user = user_response.user
            if not user:
                return jsonify({"error": "Invalid or expired token."}), 401
            g.user = user
        except Exception as e:
            current_app.logger.warning(f"Token verification error: {e}")
            return jsonify({"error": "Token verification failed. Invalid or expired token."}), 401

        return f(*args, **kwargs)
    return decorated_function
