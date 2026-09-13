from flask import Blueprint, request, jsonify, current_app
import requests
from app.extensions import limiter
from app.middleware.auth import token_required

weather_bp = Blueprint('weather', __name__)

@weather_bp.route('/get_weather', methods=['POST'])
@limiter.limit(lambda: current_app.config.get('RATELIMIT_WEATHER_MANDI', '60 per minute'))
@token_required
def get_weather():
    weather_service = getattr(current_app, 'weather_service', None)
    if not weather_service or not weather_service.api_key:
        return jsonify({"error": "Weather API is not configured on the server."}), 503

    data = request.get_json(silent=True) or {}
    city = data.get('city')
    lat = data.get('lat')
    lon = data.get('lon')

    if lat is None and lon is None and not city:
        return jsonify({"error": "City name or coordinates (lat, lon) are required"}), 400

    try:
        data, err, status_code = weather_service.get_weather(city=city, lat=lat, lon=lon)
        if err:
            return jsonify({"error": err}), status_code
        return jsonify(data), 200

    except requests.exceptions.Timeout:
        return jsonify({"error": "Weather service request timed out."}), 504
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Weather network error: {e}")
        return jsonify({"error": "Could not connect to Weather API service."}), 502
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Error during weather fetch: {e}")
        return jsonify({"error": "Failed to fetch detailed weather data"}), 500
