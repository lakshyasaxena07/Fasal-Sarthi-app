from flask import Blueprint, request, jsonify, current_app
import requests
from app.extensions import limiter
from app.middleware.auth import token_required

chatbot_bp = Blueprint('chatbot', __name__)

@chatbot_bp.route('/sarthi_ai_chat', methods=['POST'])
@limiter.limit(lambda: current_app.config.get('RATELIMIT_CHAT', '15 per minute'))
@token_required
def chat():
    gemini_service = getattr(current_app, 'gemini_service', None)
    if not gemini_service or not gemini_service.api_key:
        return jsonify({"error": "Chatbot API key not configured."}), 503

    data = request.get_json(silent=True) or {}
    user_message = data.get('message')
    language_code = data.get('language', 'hi')
    chat_history = data.get('history', [])

    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    try:
        reply = gemini_service.generate_reply(user_message, language_code=language_code, chat_history=chat_history)
        return jsonify({"response": reply}), 200

    except requests.exceptions.Timeout:
        return jsonify({"error": "Chatbot request timed out."}), 504
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"Chatbot connection error: {e}")
        return jsonify({"error": "Could not connect to Gemini API service."}), 502
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        current_app.logger.error(f"Error during chat generation: {e}")
        return jsonify({"error": "Failed to generate AI response"}), 500
