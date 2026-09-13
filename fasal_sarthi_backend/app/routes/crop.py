from flask import Blueprint, request, jsonify, current_app
from app.extensions import limiter
from app.middleware.auth import token_required

crop_bp = Blueprint('crop', __name__)

@crop_bp.route('/recommend_crop', methods=['POST'])
@limiter.limit(lambda: current_app.config.get('RATELIMIT_ML', '30 per minute'))
@token_required
def recommend_crop():
    crop_service = getattr(current_app, 'crop_service', None)
    if not crop_service or not crop_service.is_ready():
        return jsonify({"error": "Crop Recommendation model setup incorrect or not loaded."}), 500

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Missing JSON request body"}), 400

    try:
        result = crop_service.recommend(data)
        return jsonify(result), 200
    except KeyError as e:
        return jsonify({"error": f"Missing input feature: {str(e).strip(chr(39))}"}), 400
    except ValueError as e:
        return jsonify({"error": f"Invalid input value: {str(e)}"}), 400
    except Exception as e:
        current_app.logger.error(f"Error during crop recommendation: {e}")
        return jsonify({"error": "Failed to recommend crop due to an internal error."}), 500
