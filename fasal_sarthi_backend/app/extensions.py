from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from supabase import create_client, Client

cors = CORS()
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
    headers_enabled=True
)
supabase_client: Client = None


def init_supabase(app):
    global supabase_client
    url = app.config.get('SUPABASE_URL')
    key = app.config.get('SUPABASE_SERVICE_KEY')
    if not url or not key:
        app.logger.warning("SUPABASE_URL or SUPABASE_SERVICE_KEY not set; auth will fail.")
        supabase_client = None
        return None
    try:
        supabase_client = create_client(url, key)
        app.logger.info("Supabase service client initialized successfully.")
        return supabase_client
    except Exception as e:
        app.logger.error(f"Failed to initialize Supabase client: {e}")
        supabase_client = None
        return None
