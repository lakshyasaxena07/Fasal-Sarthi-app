from flask import Blueprint, request, jsonify, current_app
from app.extensions import limiter
from app.middleware.auth import token_required

fertilizer_bp = Blueprint('fertilizer', __name__)

@fertilizer_bp.route('/recommend_fertilizer', methods=['POST'])
@limiter.limit(lambda: current_app.config.get('RATELIMIT_ML', '30 per minute'))
@token_required
def recommend_fertilizer():
    fertilizer_service = getattr(current_app, 'fertilizer_service', None)
    if not fertilizer_service or not fertilizer_service.is_ready():
        return jsonify({"error": "Fertilizer Recommendation model is not loaded."}), 500

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Missing JSON request body"}), 400

    try:
        result = fertilizer_service.recommend(data)
        return jsonify(result), 200
    except KeyError as e:
        return jsonify({"error": f"Missing input value: {str(e).strip(chr(39))}"}), 400
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Error during fertilizer recommendation: {e}")
        return jsonify({"error": "Failed to recommend fertilizer"}), 500
