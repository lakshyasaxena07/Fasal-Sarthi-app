import os
from flask import Flask
from app.config import config_by_name, Config
from app.extensions import cors, limiter, init_supabase
from app.middleware.errors import register_error_handlers
from app.services import (
    DiseaseService,
    CropService,
    FertilizerService,
    WeatherService,
    MandiService,
    GeminiService
)
from app.routes import (
    health_bp,
    disease_bp,
    crop_bp,
    fertilizer_bp,
    weather_bp,
    mandi_bp,
    chatbot_bp
)


def create_app(config_class=None):
    app = Flask(__name__)

    # 1. Configuration
    if config_class is None:
        env_name = os.getenv('FLASK_ENV', 'development')
        config_class = config_by_name.get(env_name, Config)
    app.config.from_object(config_class)

    # 2. Initialize Extensions
    allowed_origins = app.config.get('CORS_ORIGINS')
    cors.init_app(
        app,
        resources={r"/*": {
            "origins": allowed_origins,
            "supports_credentials": True,
            "allow_headers": ["Content-Type", "Authorization"],
            "methods": ["GET", "POST", "OPTIONS"]
        }}
    )

    limiter.init_app(app)
    init_supabase(app)

    # 3. Initialize Services and attach to app instance
    app.disease_service = DiseaseService(model_path=app.config.get('TFLITE_MODEL_PATH'))
    app.crop_service = CropService(
        model_path=app.config.get('CROP_MODEL_PATH'),
        scaler_path=app.config.get('CROP_SCALER_PATH'),
        encoder_path=app.config.get('CROP_ENCODER_PATH')
    )
    app.fertilizer_service = FertilizerService(
        model_path=app.config.get('FERT_MODEL_PATH'),
        columns_path=app.config.get('FERT_COLUMNS_PATH'),
        encoder_path=app.config.get('FERT_ENCODER_PATH')
    )
    app.weather_service = WeatherService(
        api_key=app.config.get('OWM_API_KEY'),
        api_url=app.config.get('OWM_API_URL'),
        timeout=app.config.get('OWM_TIMEOUT', 10)
    )
    app.mandi_service = MandiService(
        api_key=app.config.get('DATA_GOV_API_KEY'),
        api_url=app.config.get('MANDI_API_URL'),
        timeout=app.config.get('MANDI_TIMEOUT', 15)
    )
    app.gemini_service = GeminiService(
        api_key=app.config.get('GOOGLE_API_KEY'),
        timeout=app.config.get('GEMINI_TIMEOUT', 30)
    )

    # 4. Register Error Handlers
    register_error_handlers(app)

    # 5. Register Blueprints
    app.register_blueprint(health_bp)
    app.register_blueprint(disease_bp)
    app.register_blueprint(crop_bp)
    app.register_blueprint(fertilizer_bp)
    app.register_blueprint(weather_bp)
    app.register_blueprint(mandi_bp)
    app.register_blueprint(chatbot_bp)

    return app
