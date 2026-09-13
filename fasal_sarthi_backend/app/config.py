import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))


class Config:
    """Base configuration settings."""
    SECRET_KEY = os.getenv('SECRET_KEY', 'fasal-sarthi-secret-key-change-in-prod')
    DEBUG = False
    TESTING = False

    # Supabase Auth
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

    # External APIs
    GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
    GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key={GOOGLE_API_KEY}" if GOOGLE_API_KEY else None

    OWM_API_KEY = os.getenv('OWM_API_KEY')
    OWM_API_URL = "https://api.openweathermap.org/data/2.5/weather"

    DATA_GOV_API_KEY = os.getenv('DATA_GOV_API_KEY')
    MANDI_API_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"

    # Timeouts for external requests (seconds)
    GEMINI_TIMEOUT = int(os.getenv('GEMINI_TIMEOUT', '30'))
    OWM_TIMEOUT = int(os.getenv('OWM_TIMEOUT', '10'))
    MANDI_TIMEOUT = int(os.getenv('MANDI_TIMEOUT', '15'))

    # Upload Security: Max Content Length (Default 10 MB)
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', str(10 * 1024 * 1024)))
    ALLOWED_IMAGE_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
    ALLOWED_IMAGE_FORMATS = {'JPEG', 'PNG', 'WEBP'}

    # ML Model Artifact Paths (STRICTLY FROZEN)
    TFLITE_MODEL_PATH = os.getenv('TFLITE_MODEL_PATH', os.path.join(BASE_DIR, 'FasalSarthi_Full_Model.tflite'))
    CROP_MODEL_PATH = os.getenv('CROP_MODEL_PATH', os.path.join(BASE_DIR, 'best_stacking_model_final.joblib'))
    CROP_SCALER_PATH = os.getenv('CROP_SCALER_PATH', os.path.join(BASE_DIR, 'scaler_final.joblib'))
    CROP_ENCODER_PATH = os.getenv('CROP_ENCODER_PATH', os.path.join(BASE_DIR, 'encoder_final.joblib'))
    FERT_MODEL_PATH = os.getenv('FERT_MODEL_PATH', os.path.join(BASE_DIR, 'random_forest_model.joblib'))
    FERT_COLUMNS_PATH = os.getenv('FERT_COLUMNS_PATH', os.path.join(BASE_DIR, 'model_columns.joblib'))
    FERT_ENCODER_PATH = os.getenv('FERT_ENCODER_PATH', os.path.join(BASE_DIR, 'label_encoder.joblib'))

    # Rate Limiting Configuration
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URI = os.getenv('RATELIMIT_STORAGE_URI', 'memory://')
    RATELIMIT_HEADERS_ENABLED = True
    RATELIMIT_DEFAULT = os.getenv('RATELIMIT_DEFAULT', '200 per day;50 per hour')
    RATELIMIT_ML = os.getenv('RATELIMIT_ML', '30 per minute;300 per hour')
    RATELIMIT_CHAT = os.getenv('RATELIMIT_CHAT', '15 per minute;150 per hour')
    RATELIMIT_WEATHER_MANDI = os.getenv('RATELIMIT_WEATHER_MANDI', '60 per minute;600 per hour')

    # CORS Allowlist Configuration
    CORS_ORIGINS = [
        origin.strip() for origin in os.getenv(
            'CORS_ORIGINS',
            'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000'
        ).split(',') if origin.strip()
    ]


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    RATELIMIT_ENABLED = False
    BYPASS_AUTH_FOR_TESTS = True
    CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://testserver']


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False


config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
