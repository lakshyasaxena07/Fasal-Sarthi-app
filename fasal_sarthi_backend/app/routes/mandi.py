from flask import Blueprint, request, jsonify, current_app
import requests
from app.extensions import limiter
from app.middleware.auth import token_required

mandi_bp = Blueprint('mandi', __name__)

@mandi_bp.route('/get_mandi_prices', methods=['POST'])
@limiter.limit(lambda: current_app.config.get('RATELIMIT_WEATHER_MANDI', '60 per minute'))
@token_required
def get_mandi_prices():
    mandi_service = getattr(current_app, 'mandi_service', None)
    if not mandi_service or not mandi_service.api_key:
        return jsonify({"error": "Mandi API key is not configured on the server."}), 503

    data = request.get_json(silent=True) or {}
    state = data.get('state')
    commodity = data.get('commodity')
    district = data.get('district')

    if not state or not commodity:
        return jsonify({"error": "State and commodity are required."}), 400

    try:
        prices, err, status_code = mandi_service.get_prices(state, commodity, district=district)
        if err:
            return jsonify({"error": err}), status_code
        return jsonify(prices), 200

    except requests.exceptions.Timeout:
        return jsonify({"error": "Mandi service request timed out."}), 504
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Mandi API Request Exception: {e}")
        return jsonify({"error": "Could not connect to Mandi API service."}), 502
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Mandi Data Processing Error: {e}")
        return jsonify({"error": "Error processing Mandi data."}), 500
