import io
from flask import Blueprint, request, jsonify, current_app
from PIL import Image
from app.extensions import limiter
from app.middleware.auth import token_required

disease_bp = Blueprint('disease', __name__)

@disease_bp.route('/predict_disease', methods=['POST'])
@limiter.limit(lambda: current_app.config.get('RATELIMIT_ML', '30 per minute'))
@token_required
def predict_disease():
    disease_service = getattr(current_app, 'disease_service', None)
    if not disease_service:
        return jsonify({"error": "Disease model service is not available."}), 503

    if 'file' not in request.files:
        return jsonify({"error": "No file part key found"}), 400

    file = request.files.get('file')
    if not file or not file.filename:
        return jsonify({"error": "No selected file"}), 400

    # 1. Filename extension validation
    allowed_exts = current_app.config.get('ALLOWED_IMAGE_EXTENSIONS', {'jpg', 'jpeg', 'png', 'webp'})
    filename = file.filename.lower()
    if '.' not in filename or filename.rsplit('.', 1)[1] not in allowed_exts:
        return jsonify({"error": "Unsupported file extension. Allowed extensions: jpg, jpeg, png, webp"}), 400

    # 2. File size / empty content check
    image_bytes = file.read()
    if not image_bytes or len(image_bytes) == 0:
        return jsonify({"error": "Uploaded file is empty"}), 400

    # 3. Magic bytes / PIL format and corruption validation
    allowed_formats = current_app.config.get('ALLOWED_IMAGE_FORMATS', {'JPEG', 'PNG', 'WEBP'})
    try:
        with Image.open(io.BytesIO(image_bytes)) as test_img:
            test_img.verify()
            img_format = test_img.format
    except Exception:
        return jsonify({"error": "Corrupt or invalid image file"}), 400

    if not img_format or img_format.upper() not in allowed_formats:
        return jsonify({"error": f"Unsupported image format '{img_format}'. Supported formats: JPEG, PNG, WEBP"}), 400

    # 4. Exact frozen ML inference
    try:
        result = disease_service.predict(image_bytes)
        return jsonify({
            "predicted_disease": result["predicted_disease"],
            "confidence": result["confidence"]
        }), 200

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except RuntimeError as e:
        return jsonify({"error": f"Model error: {e}"}), 503
    except Exception as e:
        current_app.logger.error(f"Prediction error: {e}")
        return jsonify({"error": "Error processing image with disease model"}), 500
