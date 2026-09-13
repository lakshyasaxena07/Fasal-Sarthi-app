from flask import Blueprint, jsonify, current_app
from app.extensions import limiter

health_bp = Blueprint('health', __name__)

@health_bp.route('/', methods=['GET'])
@limiter.exempt
def index():
    return "Fasal Sarthi Backend Server is running!"

@health_bp.route('/health', methods=['GET'])
@limiter.exempt
def health():
    return jsonify({
        "status": "healthy"
    }), 200

@health_bp.route('/ready', methods=['GET'])
@limiter.exempt
def ready():
    from app.services import DiseaseService, CropService, FertilizerService

    models_status = {}
    try:
        ds = DiseaseService(model_path=current_app.config.get('TFLITE_MODEL_PATH'))
        interp = ds.get_interpreter()
        models_status["disease_model"] = "ready" if interp is not None else "failed"
    except Exception as e:
        models_status["disease_model"] = f"error: {e}"

    try:
        cs = CropService(
            model_path=current_app.config.get('CROP_MODEL_PATH'),
            scaler_path=current_app.config.get('CROP_SCALER_PATH'),
            encoder_path=current_app.config.get('CROP_ENCODER_PATH')
        )
        models_status["crop_model"] = "ready" if cs.is_ready() else "failed"
    except Exception as e:
        models_status["crop_model"] = f"error: {e}"

    try:
        fs = FertilizerService(
            model_path=current_app.config.get('FERT_MODEL_PATH'),
            columns_path=current_app.config.get('FERT_COLUMNS_PATH'),
            encoder_path=current_app.config.get('FERT_ENCODER_PATH')
        )
        models_status["fertilizer_model"] = "ready" if fs.is_ready() else "failed"
    except Exception as e:
        models_status["fertilizer_model"] = f"error: {e}"

    all_ready = all(status == "ready" for status in models_status.values())
    status_code = 200 if all_ready else 503

    return jsonify({
        "status": "ready" if all_ready else "not_ready",
        "models": models_status
    }), status_code
