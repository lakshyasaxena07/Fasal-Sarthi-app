"""
Phase 2 Comprehensive Security & Regression Test Suite.
Verifies:
1. Health & Readiness probes (and rate limit exemption)
2. Strict CORS allowlisting, preflight, credentials, and unauthorized rejection
3. Upload security (size limits, empty files, non-images, corrupt images, valid images)
4. Authentication middleware (missing header, invalid format, invalid token)
5. Payload validation on ML endpoints (missing features, invalid categorical values)
6. Weather accurate location timezone calculation (IST, New York, Tokyo, London)
7. External API timeout & network failure error mapping (502 & 504)
8. Rate limiting enforcement (429 responses and Retry-After headers)
9. Empirical ML baseline parity re-verification
10. Frozen ML artifacts bit-for-bit SHA256 hash preservation
"""

import os
import sys
import io
import json
import hashlib
from datetime import datetime, timezone, timedelta
from unittest.mock import patch, MagicMock

# Setup paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(BASE_DIR, "fasal_sarthi_backend")
sys.path.insert(0, BACKEND_DIR)

from app import create_app
from app.config import Config, TestingConfig
from app.services.weather_service import WeatherService
from app.services.disease_service import DiseaseService
from app.services.crop_service import CropService
from app.services.fertilizer_service import FertilizerService

BASELINE_PATH = os.path.join(BASE_DIR, "docs", "ai", "baseline_ml_results.json")
IMAGE_PATH = os.path.join(BACKEND_DIR, "corn_blight.jpeg")


class Phase2SecurityConfig(TestingConfig):
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URI = "memory://"
    RATELIMIT_DEFAULT = "100 per minute"
    RATELIMIT_ML = "60 per minute"
    RATELIMIT_CHAT = "60 per minute"
    RATELIMIT_WEATHER_MANDI = "60 per minute"
    CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173']
    BYPASS_AUTH_FOR_TESTS = True
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024


def test_health_and_readiness(client):
    print("\n--- [1] Health & Readiness Tests ---")
    res = client.get('/health')
    assert res.status_code == 200, f"Health check failed: {res.status_code}"
    assert res.get_json()["status"] == "healthy"
    print("  => PASS: GET /health returns 200 healthy")

    res = client.get('/ready')
    assert res.status_code == 200, f"Readiness check failed: {res.status_code}"
    models = res.get_json()["models"]
    assert models["crop_model"] == "ready"
    assert models["disease_model"] == "ready"
    assert models["fertilizer_model"] == "ready"
    print("  => PASS: GET /ready returns 200 with all models ready")


def test_cors_behavior(app, client):
    print("\n--- [2] CORS Allowlist & Preflight Tests ---")
    # 1. Authorized origin
    res = client.get('/health', headers={'Origin': 'http://localhost:5173'})
    assert res.headers.get('Access-Control-Allow-Origin') == 'http://localhost:5173', \
        f"Expected allowed origin, got: {res.headers.get('Access-Control-Allow-Origin')}"
    assert res.headers.get('Access-Control-Allow-Credentials') == 'true'
    print("  => PASS: Authorized origin 'http://localhost:5173' granted access with credentials")

    # 2. Localhost 127.0.0.1 origin
    res = client.get('/health', headers={'Origin': 'http://127.0.0.1:5173'})
    assert res.headers.get('Access-Control-Allow-Origin') == 'http://127.0.0.1:5173'
    print("  => PASS: Localhost origin 'http://127.0.0.1:5173' granted access")

    # 3. Unauthorized origin
    res = client.get('/health', headers={'Origin': 'https://malicious-site.com'})
    assert 'Access-Control-Allow-Origin' not in res.headers or res.headers.get('Access-Control-Allow-Origin') != 'https://malicious-site.com', \
        "Unauthorized origin was erroneously granted access!"
    print("  => PASS: Unauthorized origin 'https://malicious-site.com' rejected")

    # 4. OPTIONS preflight
    res = client.options('/predict_disease', headers={
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization,Content-Type'
    })
    assert res.status_code == 200
    assert res.headers.get('Access-Control-Allow-Origin') == 'http://localhost:5173'
    print("  => PASS: OPTIONS preflight handled cleanly with 200 OK")

    # 5. Request without Origin header
    res = client.get('/health')
    assert res.status_code == 200
    print("  => PASS: Request without Origin processes normally (status 200)")


def test_upload_security(client):
    print("\n--- [3] Upload Security & Image Validation Tests ---")
    # 1. Missing file part key
    res = client.post('/predict_disease', data={})
    assert res.status_code == 400
    assert "No file part key found" in res.get_json()["error"]
    print("  => PASS: Missing file part returns 400")

    # 2. Empty filename
    res = client.post('/predict_disease', data={'file': (io.BytesIO(b''), '')})
    assert res.status_code == 400
    assert "No selected file" in res.get_json()["error"]
    print("  => PASS: Empty filename returns 400")

    # 3. Empty file content
    res = client.post('/predict_disease', data={'file': (io.BytesIO(b''), 'empty.jpg')})
    assert res.status_code == 400
    assert "Uploaded file is empty" in res.get_json()["error"]
    print("  => PASS: Empty file content returns 400")

    # 4. Unsupported file extension (.pdf)
    res = client.post('/predict_disease', data={'file': (io.BytesIO(b'%PDF-1.4...'), 'document.pdf')})
    assert res.status_code == 400
    assert "Unsupported file extension" in res.get_json()["error"]
    print("  => PASS: Non-image extension (.pdf) returns 400")

    # 5. Corrupted image bytes with spoofed extension
    garbage_bytes = b'NOT_A_REAL_IMAGE_DATA_1234567890'
    res = client.post('/predict_disease', data={'file': (io.BytesIO(garbage_bytes), 'fake.jpg')})
    assert res.status_code == 400
    assert "Corrupt or invalid image file" in res.get_json()["error"]
    print("  => PASS: Corrupted/spoofed image rejected with 400")

    # 6. Oversized payload (> 10MB)
    huge_bytes = b'X' * (10 * 1024 * 1024 + 1024)  # 10MB + 1KB
    res = client.post('/predict_disease', data={'file': (io.BytesIO(huge_bytes), 'huge.jpg')})
    assert res.status_code == 413, f"Expected 413, got {res.status_code}"
    print("  => PASS: Oversized payload (>10MB) rejected with 413")

    # 7. Valid image upload
    with open(IMAGE_PATH, 'rb') as f:
        valid_bytes = f.read()
    res = client.post('/predict_disease', data={'file': (io.BytesIO(valid_bytes), 'corn_blight.jpeg')})
    assert res.status_code == 200
    json_data = res.get_json()
    assert json_data["predicted_disease"] == "Corn__Blight"
    assert json_data["confidence"] == "92.14%"
    print("  => PASS: Valid image returns 200 with exact prediction and confidence")


def test_authentication_middleware(app):
    print("\n--- [4] Authentication Middleware Security Tests ---")
    from app import extensions
    auth_app = create_app(Config)
    client = auth_app.test_client()

    # 1. Unconfigured auth returns 503
    extensions.supabase_client = None
    res = client.post('/recommend_crop', json={"soil_ph": 6.5})
    assert res.status_code == 503
    assert "Authentication system is not configured" in res.get_json()["error"]
    print("  => PASS: Unconfigured auth system cleanly returns 503")

    # 2. Mock active Supabase client to test token verification
    mock_supabase = MagicMock()
    extensions.supabase_client = mock_supabase

    # Missing Authorization header
    res = client.post('/recommend_crop', json={"soil_ph": 6.5})
    assert res.status_code == 401
    assert "Authorization header missing" in res.get_json()["error"]
    print("  => PASS: Missing token returns 401")

    # Malformed Authorization header
    res = client.post('/recommend_crop', json={"soil_ph": 6.5}, headers={'Authorization': 'Basic dXNlcjpwYXNz'})
    assert res.status_code == 401
    assert "Invalid Authorization header format" in res.get_json()["error"]
    print("  => PASS: Malformed header returns 401")

    # Invalid Bearer token
    mock_supabase.auth.get_user.side_effect = Exception("JWT expired or invalid")
    res = client.post('/recommend_crop', json={"soil_ph": 6.5}, headers={'Authorization': 'Bearer invalid_jwt_token_123'})
    assert res.status_code == 401
    assert "Token verification failed" in res.get_json()["error"]
    print("  => PASS: Invalid token cleanly rejected with 401")

    # Valid Bearer token
    mock_user = MagicMock()
    mock_user.id = "user-12345"
    mock_user_resp = MagicMock()
    mock_user_resp.user = mock_user
    mock_supabase.auth.get_user.side_effect = None
    mock_supabase.auth.get_user.return_value = mock_user_resp

    crop_payload = {
        "soil_ph": 6.5, "nitrogen_kg_ha": 80.0, "phosphorus_kg_ha": 40.0, "potassium_kg_ha": 40.0,
        "annual_rainfall_mm": 1200.0, "avg_temp_c": 26.0, "avg_humidity_pct": 80.0,
        "soil_type": "Black (Vertisol)", "irrigation_type": "Groundwater", "previous_crop": "Wheat"
    }
    res = client.post('/recommend_crop', json=crop_payload, headers={'Authorization': 'Bearer valid_token_xyz'})
    assert res.status_code == 200
    assert res.get_json()["recommended_crop"] == "Sabziyaan"
    print("  => PASS: Valid token allows request through (200 OK)")


def test_payload_validation(client):
    print("\n--- [5] Payload Validation Tests ---")
    # Crop Recommendation
    res = client.post('/recommend_crop', json={})
    assert res.status_code == 400
    print("  => PASS: Empty crop body returns 400")

    res = client.post('/recommend_crop', json={"soil_ph": 6.5, "nitrogen_kg_ha": 50})
    assert res.status_code == 400
    assert "Missing input feature" in res.get_json()["error"]
    print("  => PASS: Missing numerical feature in crop body returns 400")

    # Invalid soil type
    res = client.post('/recommend_crop', json={
        "soil_ph": 6.5, "nitrogen_kg_ha": 80.0, "phosphorus_kg_ha": 40.0, "potassium_kg_ha": 40.0,
        "annual_rainfall_mm": 1200.0, "avg_temp_c": 26.0, "avg_humidity_pct": 80.0,
        "soil_type": "MartianSoil", "irrigation_type": "Groundwater", "previous_crop": "Wheat"
    })
    assert res.status_code == 400
    assert "Unknown/Unsupported soil_type" in res.get_json()["error"]
    print("  => PASS: Invalid categorical soil type returns 400")

    # Fertilizer Recommendation
    res = client.post('/recommend_fertilizer', json={})
    assert res.status_code == 400
    print("  => PASS: Empty fertilizer body returns 400")

    res = client.post('/recommend_fertilizer', json={
        "Temparature": 28.0, "Humidity": 65.0, "Moisture": 45.0, "Nitrogen": 35.0,
        "Potassium": 15.0, "Phosphorous": 20.0, "Soil_Type": "InvalidSoil", "Crop_Type": "Maize"
    })
    assert res.status_code == 400
    assert "Unknown Soil_Type" in res.get_json()["error"]
    print("  => PASS: Invalid categorical Soil_Type returns 400")


def test_weather_timezone_accuracy():
    print("\n--- [6] Weather Timezone Accuracy Tests (Non-IST Locations) ---")
    service = WeatherService(api_key="mock-key")

    # Timestamp representing 2026-04-15 12:00:00 UTC
    fixed_utc_epoch = 1776254400  # 12:00 PM UTC

    mock_response = MagicMock()
    mock_response.status_code = 200

    # Test 1: New York (EDT, UTC-4 = -14400 seconds)
    mock_response.json.return_value = {
        "cod": 200,
        "name": "New York",
        "timezone": -14400,
        "main": {"temp": 18.0},
        "sys": {"country": "US", "sunrise": fixed_utc_epoch, "sunset": fixed_utc_epoch + 43200},
        "weather": [{"description": "clear sky"}]
    }
    with patch("requests.get", return_value=mock_response):
        data, err, code = service.get_weather(city="New York")
        assert code == 200
        # 12:00 PM UTC - 4h = 08:00 AM NY local time
        assert data["sunrise"] == "08:00 AM", f"Expected 08:00 AM for New York, got {data['sunrise']}"
        print(f"  => PASS: New York (UTC-4) sunrise correctly calculated: {data['sunrise']}")

    # Test 2: Tokyo (JST, UTC+9 = +32400 seconds)
    mock_response.json.return_value = {
        "cod": 200,
        "name": "Tokyo",
        "timezone": 32400,
        "main": {"temp": 22.0},
        "sys": {"country": "JP", "sunrise": fixed_utc_epoch, "sunset": fixed_utc_epoch + 43200},
        "weather": [{"description": "sunny"}]
    }
    with patch("requests.get", return_value=mock_response):
        data, err, code = service.get_weather(city="Tokyo")
        assert code == 200
        # 12:00 PM UTC + 9h = 09:00 PM Tokyo local time
        assert data["sunrise"] == "09:00 PM", f"Expected 09:00 PM for Tokyo, got {data['sunrise']}"
        print(f"  => PASS: Tokyo (UTC+9) sunrise correctly calculated: {data['sunrise']}")

    # Test 3: London (UTC+0 = 0 seconds)
    mock_response.json.return_value = {
        "cod": 200,
        "name": "London",
        "timezone": 0,
        "main": {"temp": 14.0},
        "sys": {"country": "GB", "sunrise": fixed_utc_epoch, "sunset": fixed_utc_epoch + 43200},
        "weather": [{"description": "cloudy"}]
    }
    with patch("requests.get", return_value=mock_response):
        data, err, code = service.get_weather(city="London")
        assert code == 200
        # 12:00 PM UTC = 12:00 PM London local time
        assert data["sunrise"] == "12:00 PM", f"Expected 12:00 PM for London, got {data['sunrise']}"
        print(f"  => PASS: London (UTC+0) sunrise correctly calculated: {data['sunrise']}")


def test_external_resilience_and_errors(client):
    print("\n--- [7] External API Resilience & Error Mapping Tests ---")
    import requests

    # Set mock keys so service reaches downstream requests call instead of 503 unconfigured
    client.application.weather_service.api_key = "mock-key"
    client.application.mandi_service.api_key = "mock-key"
    client.application.gemini_service.api_key = "mock-key"

    # 1. Weather Upstream Timeout -> 504 Gateway Timeout
    with patch("requests.get", side_effect=requests.exceptions.Timeout("Read timeout")):
        res = client.post('/get_weather', json={"city": "Delhi"})
        assert res.status_code == 504
        assert "timed out" in res.get_json()["error"]
        print("  => PASS: Weather upstream timeout cleanly mapped to 504 Gateway Timeout")

    # 2. Weather Upstream Connection Error -> 502 Bad Gateway
    with patch("requests.get", side_effect=requests.exceptions.ConnectionError("Connection refused")):
        res = client.post('/get_weather', json={"city": "Delhi"})
        assert res.status_code == 502
        assert "Could not connect" in res.get_json()["error"]
        print("  => PASS: Weather upstream connection error cleanly mapped to 502 Bad Gateway")

    # 3. Mandi Upstream Timeout -> 504
    with patch("requests.get", side_effect=requests.exceptions.Timeout("Mandi timeout")):
        res = client.post('/get_mandi_prices', json={"state": "Haryana", "commodity": "Wheat"})
        assert res.status_code == 504
        print("  => PASS: Mandi upstream timeout cleanly mapped to 504 Gateway Timeout")

    # 4. Chatbot Upstream Timeout -> 504
    with patch("requests.post", side_effect=requests.exceptions.Timeout("Gemini timeout")):
        res = client.post('/sarthi_ai_chat', json={"message": "Kheti ke baare mein batao"})
        assert res.status_code == 504
        print("  => PASS: Chatbot upstream timeout cleanly mapped to 504 Gateway Timeout")


def test_rate_limiting():
    print("\n--- [8] Rate Limiting & 429 Retry-After Tests ---")
    class LowRateLimitConfig(TestingConfig):
        RATELIMIT_ENABLED = True
        RATELIMIT_STORAGE_URI = "memory://"
        RATELIMIT_DEFAULT = "100 per minute"
        RATELIMIT_ML = "2 per minute"
        BYPASS_AUTH_FOR_TESTS = True

    rate_app = create_app(LowRateLimitConfig)
    rate_client = rate_app.test_client()

    crop_payload = {
        "soil_ph": 6.5, "nitrogen_kg_ha": 80.0, "phosphorus_kg_ha": 40.0, "potassium_kg_ha": 40.0,
        "annual_rainfall_mm": 1200.0, "avg_temp_c": 26.0, "avg_humidity_pct": 80.0,
        "soil_type": "Black (Vertisol)", "irrigation_type": "Groundwater", "previous_crop": "Wheat"
    }

    res1 = rate_client.post('/recommend_crop', json=crop_payload)
    res2 = rate_client.post('/recommend_crop', json=crop_payload)
    assert res1.status_code == 200
    assert res2.status_code == 200
    print("  => 2 requests within limit allowed (200 OK)")

    # 3rd request should exceed the limit
    res3 = rate_client.post('/recommend_crop', json=crop_payload)
    assert res3.status_code == 429, f"Expected 429, got {res3.status_code}"
    json_data = res3.get_json()
    assert "Rate limit exceeded" in json_data["error"]
    assert 'Retry-After' in res3.headers
    print(f"  => PASS: 3rd request rejected with 429, Retry-After header: {res3.headers.get('Retry-After')}")

    # Health endpoints MUST remain exempt even when client is rate limited!
    res_health = rate_client.get('/health')
    assert res_health.status_code == 200
    print("  => PASS: /health remains 200 OK and exempt while client is rate-limited")


def test_ml_parity_and_hashes():
    print("\n--- [9] ML Baseline Parity & Hash Verification ---")
    with open(BASELINE_PATH, 'r') as f:
        baseline = json.load(f)

    inputs = baseline["inputs"]
    expected = baseline["outputs"]

    # Disease
    ds = DiseaseService()
    with open(IMAGE_PATH, 'rb') as f:
        img_bytes = f.read()
    d_out = ds.predict(img_bytes)
    assert d_out["predicted_disease"] == expected["disease"]["predicted_disease"]
    assert d_out["confidence"] == expected["disease"]["confidence"]
    assert d_out["predicted_class_index"] == expected["disease"]["predicted_class_index"]
    assert abs(d_out["raw_confidence_float"] - expected["disease"]["raw_confidence_float"]) < 1e-6
    print("  => PASS: DiseaseService maintains 100% baseline parity")

    # Crop
    cs = CropService()
    c_out = cs.recommend(inputs["crop_input"])
    assert c_out["recommended_crop"] == expected["crop"]["recommended_crop"]
    print("  => PASS: CropService maintains 100% baseline parity")

    # Fertilizer
    fs = FertilizerService()
    f_out = fs.recommend(inputs["fertilizer_input"])
    assert f_out["recommended_fertilizer"] == expected["fertilizer"]["recommended_fertilizer"]
    print("  => PASS: FertilizerService maintains 100% baseline parity")

    # Bit-for-bit SHA256 hashes
    expected_hashes = {
        'best_stacking_model_final.joblib': 'FA8275E1A968E7F6B18F6F76D93887A5950603F9B745BB047C15B7997C80CCB4',
        'encoder_final.joblib': '1B343114927FC6DAE5106E46D33A3B7EC3BC9277661C8709C6A8F23E008AD9CE',
        'label_encoder.joblib': '3B48DDFDC51883D663EF327E9FD9621035F50E9E7B011B3449AC07A722841AE8',
        'model_columns.joblib': '905B820ECE8A34FC6EB03EAE1BD6E96C2404D9839456D5562608AE192AB7DDDA',
        'random_forest_model.joblib': '42054E32328769AAC82DBBBDD1D662BA0C36468E770D106E71AD2BBB018736AC',
        'scaler_final.joblib': '7F3A7749BF6D88537BEED79D7ABB4835E53827E45A7E3D1B11CB13F979690E98',
        'FasalSarthi_Full_Model.tflite': 'D18162273F2BA7026A7828ECA81B9944F58579CD1444240E19107CB9864317A2'
    }

    for filename, expected_hash in expected_hashes.items():
        filepath = os.path.join(BACKEND_DIR, filename)
        with open(filepath, 'rb') as f:
            actual_hash = hashlib.sha256(f.read()).hexdigest().upper()
        assert actual_hash == expected_hash, f"Hash mismatch on frozen artifact {filename}!"
    print("  => PASS: All 7 frozen ML artifact hashes verified bit-for-bit identical")


def main():
    print("=======================================================")
    print("STARTING PHASE 2 COMPREHENSIVE SECURITY TEST SUITE")
    print("=======================================================")

    app = create_app(Phase2SecurityConfig)
    client = app.test_client()

    test_health_and_readiness(client)
    test_cors_behavior(app, client)
    test_upload_security(client)
    test_authentication_middleware(app)
    test_payload_validation(client)
    test_weather_timezone_accuracy()
    test_external_resilience_and_errors(client)
    test_rate_limiting()
    test_ml_parity_and_hashes()

    print("\n=======================================================")
    print("ALL PHASE 2 SECURITY & REGRESSION CHECKS PASSED (100%)")
    print("=======================================================")


if __name__ == '__main__':
    main()
