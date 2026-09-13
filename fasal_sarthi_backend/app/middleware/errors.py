from flask import jsonify

def register_error_handlers(app):
    @app.errorhandler(400)
    def bad_request(error):
        message = getattr(error, 'description', 'Bad Request')
        return jsonify({"error": message}), 400

    @app.errorhandler(401)
    def unauthorized(error):
        message = getattr(error, 'description', 'Unauthorized')
        return jsonify({"error": message}), 401

    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({"error": "Forbidden"}), 403

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({"error": "File size exceeds maximum permitted limit (10MB)"}), 413

    @app.errorhandler(429)
    def ratelimit_handler(e):
        response = jsonify({
            "error": "Rate limit exceeded. Please retry shortly.",
            "message": str(getattr(e, 'description', 'Too Many Requests'))
        })
        response.status_code = 429
        retry_after = getattr(e, 'retry_after', None)
        if retry_after is not None:
            response.headers['Retry-After'] = str(retry_after)
        return response

    @app.errorhandler(500)
    def internal_server_error(error):
        app.logger.error(f"Internal server error: {error}")
        return jsonify({"error": "Internal server error occurred."}), 500

    @app.errorhandler(502)
    def bad_gateway(error):
        return jsonify({"error": "Upstream service error."}), 502

    @app.errorhandler(504)
    def gateway_timeout(error):
        return jsonify({"error": "Upstream service timed out."}), 504
