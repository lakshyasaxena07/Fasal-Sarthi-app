"""
Phase 4 Deterministic Backend Regression Test Suite.
Covers:
1. Absolute ML Freeze & Parity (Disease, Crop, Fertilizer 100% parity, 7 SHA256 hashes)
2. Authentication (missing, malformed, invalid, expired, valid, unconfigured 503)
3. Payload & Input Validation (missing fields, invalid values, malformed JSON, empty input, invalid categoricals, oversized upload 413, invalid format 400, corrupt image 400)
4. Infrastructure & Standard Error Handlers (/health, /ready, 404, 405, 413, 429, 500 with no stack trace)
5. External Service Resilience (timeout 504, connection error 502, malformed upstream, normal response 200)
6. Rate Limiting (tiers, 429, Retry-After header, health/ready exempt)
7. CORS Security (approved origin, unauthorized origin, preflight OPTIONS 200, no Origin)
"""

import os
import sys
import io
import json
import hashlib
from unittest.mock import patch, MagicMock
import requests

# Set up paths
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(BASE_DIR, "fasal_sarthi_backend")
sys.path.insert(0, BACKEND_DIR)

from app import create_app
from app.config import Config, TestingConfig
from app.services.disease_service import DiseaseService
from app.services.crop_service import CropService
from app.services.fertilizer_service import FertilizerService
from app.services.weather_service import WeatherService
from app.services.mandi_service import MandiService
from app.services.gemini_service import GeminiService

BASELINE_PATH = os.path.join(BASE_DIR, "docs", "ai", "baseline_ml_results.json")
IMAGE_PATH = os.path.join(BACKEND_DIR, "corn_blight.jpeg")


class Phase4RegressionConfig(TestingConfig):
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URI = "memory://"
    RATELIMIT_DEFAULT = "100 per minute"
    RATELIMIT_ML = "60 per minute"
    RATELIMIT_CHAT = "60 per minute"
    RATELIMIT_WEATHER_MANDI = "60 per minute"
    CORS_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173', 'https://fasal-sarthi.vercel.app']
    BYPASS_AUTH_FOR_TESTS = True
    MAX_CONTENT_LENGTH = 10 * 1024 * 1024


def test_1_ml_freeze_and_parity():
    print("\n--- [1] ABSOLUTE ML FREEZE & PARITY TEST ---")
    # Verify bit-for-bit SHA256 hashes against Phase 0 baseline
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
        assert os.path.exists(filepath), f"Missing frozen model file: {filename}"
        with open(filepath, 'rb') as f:
            actual_hash = hashlib.sha256(f.read()).hexdigest().upper()
        assert actual_hash == expected_hash, f"SHA256 mismatch on {filename}! Got {actual_hash}"
    print("  => PASS: All 7 frozen ML artifacts have bit-for-bit identical SHA256 hashes")

    # Verify 100% empirical parity against baseline
    with open(BASELINE_PATH, 'r') as f:
        baseline = json.load(f)
    inputs = baseline["inputs"]
    expected = baseline["outputs"]

    # Disease parity
    ds = DiseaseService()
    with open(IMAGE_PATH, 'rb') as f:
        img_bytes = f.read()
    d_res = ds.predict(img_bytes)
    assert d_res["predicted_disease"] == expected["disease"]["predicted_disease"] == "Corn__Blight"
    assert d_res["confidence"] == expected["disease"]["confidence"] == "92.14%"
    assert d_res["predicted_class_index"] == expected["disease"]["predicted_class_index"] == 0
    assert abs(d_res["raw_confidence_float"] - expected["disease"]["raw_confidence_float"]) < 1e-6
    print("  => PASS: DiseaseService: 100% parity (Corn__Blight, 92.14%)")

    # Crop parity
    cs = CropService()
    c_res = cs.recommend(inputs["crop_input"])
    assert c_res["recommended_crop"] == expected["crop"]["recommended_crop"] == "Sabziyaan"
    print("  => PASS: CropService: 100% parity (Sabziyaan)")

    # Fertilizer parity
    fs = FertilizerService()
    f_res = fs.recommend(inputs["fertilizer_input"])
    assert f_res["recommended_fertilizer"] == expected["fertilizer"]["recommended_fertilizer"] == "17-17-17"
    print("  => PASS: FertilizerService: 100% parity (17-17-17)")


def test_2_authentication():
    print("\n--- [2] AUTHENTICATION DETERMINISTIC SUITE ---")
    from app import extensions
    auth_app = create_app(Config)
    client = auth_app.test_client()

    # 1. Unconfigured auth -> 503
    extensions.supabase_client = None
    res = client.post('/recommend_crop', json={"soil_ph": 6.5})
    assert res.status_code == 503
    assert "Authentication system is not configured" in res.get_json()["error"]
    print("  => PASS: Unconfigured auth returns 503")

    # Mock Supabase client
    mock_supabase = MagicMock()
    extensions.supabase_client = mock_supabase

    # 2. Missing token -> 401
    res = client.post('/recommend_crop', json={"soil_ph": 6.5})
    assert res.status_code == 401
    assert "Authorization header missing" in res.get_json()["error"]
    print("  => PASS: Missing token returns 401")

    # 3. Malformed token (missing Bearer prefix) -> 401
    res = client.post('/recommend_crop', json={"soil_ph": 6.5}, headers={'Authorization': 'Token xyz123'})
    assert res.status_code == 401
    assert "Invalid Authorization header format" in res.get_json()["error"]
    print("  => PASS: Malformed token returns 401")

    # 4. Invalid token -> 401
    mock_supabase.auth.get_user.side_effect = Exception("Signature verification failed")
    res = client.post('/recommend_crop', json={"soil_ph": 6.5}, headers={'Authorization': 'Bearer invalid.token.xyz'})
    assert res.status_code == 401
    assert "Token verification failed" in res.get_json()["error"]
    print("  => PASS: Invalid token returns 401")

    # 5. Expired token (returns no user) -> 401
    mock_supabase.auth.get_user.side_effect = None
    mock_user_resp_expired = MagicMock()
    mock_user_resp_expired.user = None
    mock_supabase.auth.get_user.return_value = mock_user_resp_expired
    res = client.post('/recommend_crop', json={"soil_ph": 6.5}, headers={'Authorization': 'Bearer expired.token.xyz'})
    assert res.status_code == 401
    assert "Invalid or expired token" in res.get_json()["error"]
    print("  => PASS: Expired token returns 401")

    # 6. Valid token -> 200
    mock_user = MagicMock()
    mock_user.id = "valid-farmer-uuid-001"
    mock_user_resp = MagicMock()
    mock_user_resp.user = mock_user
    mock_supabase.auth.get_user.return_value = mock_user_resp

    crop_payload = {
        "soil_ph": 6.5, "nitrogen_kg_ha": 80.0, "phosphorus_kg_ha": 40.0, "potassium_kg_ha": 40.0,
        "annual_rainfall_mm": 1200.0, "avg_temp_c": 26.0, "avg_humidity_pct": 80.0,
        "soil_type": "Black (Vertisol)", "irrigation_type": "Groundwater", "previous_crop": "Wheat"
    }
    res = client.post('/recommend_crop', json=crop_payload, headers={'Authorization': 'Bearer valid.jwt.token'})
    assert res.status_code == 200
    assert res.get_json()["recommended_crop"] == "Sabziyaan"
    print("  => PASS: Valid token allows request through (200 OK)")


def test_3_validation(client):
    print("\n--- [3] PAYLOAD & INPUT VALIDATION SUITE ---")
    # 1. Missing fields (Crop)
    res = client.post('/recommend_crop', json={"soil_ph": 6.5, "nitrogen_kg_ha": 50})
    assert res.status_code == 400
    assert "Missing input feature" in res.get_json()["error"]
    print("  => PASS: Missing fields returns 400")

    # 2. Invalid numeric fields (string passed where float expected)
    res = client.post('/recommend_crop', json={
        "soil_ph": "not_a_number", "nitrogen_kg_ha": 80.0, "phosphorus_kg_ha": 40.0, "potassium_kg_ha": 40.0,
        "annual_rainfall_mm": 1200.0, "avg_temp_c": 26.0, "avg_humidity_pct": 80.0,
        "soil_type": "Black (Vertisol)", "irrigation_type": "Groundwater", "previous_crop": "Wheat"
    })
    assert res.status_code == 400
    assert "Invalid input value" in res.get_json()["error"]
    print("  => PASS: Invalid numeric field returns 400")

    # 3. Malformed JSON body
    res = client.post('/recommend_crop', data="not json at all", content_type='application/json')
    assert res.status_code == 400
    print("  => PASS: Malformed JSON body returns 400")

    # 4. Empty input body
    res = client.post('/recommend_crop', json={})
    assert res.status_code == 400
    print("  => PASS: Empty input body returns 400")

    # 5. Invalid categorical values (Crop & Fertilizer)
    res = client.post('/recommend_crop', json={
        "soil_ph": 6.5, "nitrogen_kg_ha": 80.0, "phosphorus_kg_ha": 40.0, "potassium_kg_ha": 40.0,
        "annual_rainfall_mm": 1200.0, "avg_temp_c": 26.0, "avg_humidity_pct": 80.0,
        "soil_type": "UnknownSoilType99", "irrigation_type": "Groundwater", "previous_crop": "Wheat"
    })
    assert res.status_code == 400
    assert "Unknown/Unsupported soil_type" in res.get_json()["error"]
    print("  => PASS: Invalid categorical soil_type returns 400")

    res = client.post('/recommend_fertilizer', json={
        "Temparature": 28.0, "Humidity": 65.0, "Moisture": 45.0, "Nitrogen": 35.0,
        "Potassium": 15.0, "Phosphorous": 20.0, "Soil_Type": "InvalidType", "Crop_Type": "Maize"
    })
    assert res.status_code == 400
    assert "Unknown Soil_Type" in res.get_json()["error"]
    print("  => PASS: Invalid categorical Soil_Type for fertilizer returns 400")

    # 6. Oversized upload (> 10MB) -> 413
    huge_bytes = b'X' * (10 * 1024 * 1024 + 2048)
    res = client.post('/predict_disease', data={'file': (io.BytesIO(huge_bytes), 'huge.jpg')})
    assert res.status_code == 413
    assert "exceeds maximum permitted limit" in res.get_json()["error"]
    print("  => PASS: Oversized upload returns 413 JSON")

    # 7. Invalid image extension (.pdf)
    res = client.post('/predict_disease', data={'file': (io.BytesIO(b'%PDF-1.5'), 'malicious.pdf')})
    assert res.status_code == 400
    assert "Unsupported file extension" in res.get_json()["error"]
    print("  => PASS: Invalid image extension (.pdf) returns 400")

    # 8. Corrupt image (fake extension, garbage content)
    res = client.post('/predict_disease', data={'file': (io.BytesIO(b'NOT_AN_IMAGE_DATA'), 'fake.jpg')})
    assert res.status_code == 400
    assert "Corrupt or invalid image file" in res.get_json()["error"]
    print("  => PASS: Corrupt image returns 400")


def test_4_infrastructure_and_errors(client):
    print("\n--- [4] INFRASTRUCTURE & ERROR HANDLERS SUITE ---")
    # 1. /health -> 200
    res = client.get('/health')
    assert res.status_code == 200
    assert res.get_json()["status"] == "healthy"
    print("  => PASS: GET /health returns 200 healthy")

    # 2. /ready -> 200
    res = client.get('/ready')
    assert res.status_code == 200
    models = res.get_json()["models"]
    assert models["crop_model"] == "ready"
    assert models["disease_model"] == "ready"
    assert models["fertilizer_model"] == "ready"
    print("  => PASS: GET /ready returns 200 with all 3 models ready")

    # 3. 404 handler
    res = client.get('/api/non_existent_route_12345')
    assert res.status_code == 404
    assert res.get_json()["error"] == "Resource not found"
    print("  => PASS: 404 cleanly handled with standard JSON payload")

    # 4. 405 handler (GET on POST-only endpoint)
    res = client.get('/recommend_crop')
    assert res.status_code == 405
    assert res.get_json()["error"] == "Method not allowed"
    print("  => PASS: 405 cleanly handled with standard JSON payload")

    # 5. 500 handler (verify NO stack trace leaked)
    with patch.object(client.application.crop_service, 'recommend', side_effect=Exception("Database or internal crash")):
        crop_payload = {
            "soil_ph": 6.5, "nitrogen_kg_ha": 80.0, "phosphorus_kg_ha": 40.0, "potassium_kg_ha": 40.0,
            "annual_rainfall_mm": 1200.0, "avg_temp_c": 26.0, "avg_humidity_pct": 80.0,
            "soil_type": "Black (Vertisol)", "irrigation_type": "Groundwater", "previous_crop": "Wheat"
        }
        res = client.post('/recommend_crop', json=crop_payload)
        assert res.status_code == 500
        json_data = res.get_json()
        assert "internal error" in json_data["error"].lower()
        # Ensure raw stack trace strings are NOT in response body
        assert "Traceback" not in str(res.data)
        assert "Database or internal crash" not in str(res.data)
        print("  => PASS: 500 cleanly handled without exposing stack trace")


def test_5_external_services(client):
    print("\n--- [5] EXTERNAL SERVICES RESILIENCE & ERROR MAPPING ---")
    client.application.weather_service.api_key = "mock-key"
    client.application.mandi_service.api_key = "mock-key"
    client.application.gemini_service.api_key = "mock-key"

    # 1. Timeout -> 504
    with patch("requests.get", side_effect=requests.exceptions.Timeout("Read timeout")):
        res = client.post('/get_weather', json={"city": "Delhi"})
        assert res.status_code == 504
        assert "timed out" in res.get_json()["error"]
        print("  => PASS: Upstream timeout mapped to 504 Gateway Timeout")

    # 2. Connection error -> 502
    with patch("requests.get", side_effect=requests.exceptions.ConnectionError("Connection refused")):
        res = client.post('/get_weather', json={"city": "Delhi"})
        assert res.status_code == 502
        assert "Could not connect" in res.get_json()["error"]
        print("  => PASS: Upstream connection error mapped to 502 Bad Gateway")

    # 3. Upstream API error response (e.g. city not found 404)
    mock_bad_resp = MagicMock()
    mock_bad_resp.status_code = 404
    mock_bad_resp.json.return_value = {"cod": 404, "message": "city not found"}
    with patch("requests.get", return_value=mock_bad_resp):
        res = client.post('/get_weather', json={"city": "NonExistentCityXYZ"})
        assert res.status_code == 404
        assert "city not found" in res.get_json()["error"]
        print("  => PASS: Upstream API error response cleanly handled (404)")

    # 4. Normal response -> 200
    mock_good_resp = MagicMock()
    mock_good_resp.status_code = 200
    mock_good_resp.json.return_value = {
        "cod": 200,
        "name": "Delhi",
        "timezone": 19800,
        "main": {"temp": 30.5, "humidity": 55, "pressure": 1012},
        "weather": [{"description": "clear sky", "icon": "01d"}],
        "wind": {"speed": 3.6},
        "sys": {"country": "IN", "sunrise": 1713141600, "sunset": 1713187200}
    }
    with patch("requests.get", return_value=mock_good_resp):
        res = client.post('/get_weather', json={"city": "Delhi"})
        assert res.status_code == 200
        assert res.get_json()["city"] == "Delhi"
        assert res.get_json()["temperature"] == 30.5
        print("  => PASS: Normal upstream response returns 200 OK")


def test_6_rate_limiting():
    print("\n--- [6] RATE LIMITING & TIER ENFORCEMENT ---")
    class LowLimitConfig(TestingConfig):
        RATELIMIT_ENABLED = True
        RATELIMIT_STORAGE_URI = "memory://"
        RATELIMIT_DEFAULT = "100 per minute"
        RATELIMIT_ML = "2 per minute"
        BYPASS_AUTH_FOR_TESTS = True

    rate_app = create_app(LowLimitConfig)
    rate_client = rate_app.test_client()

    crop_payload = {
        "soil_ph": 6.5, "nitrogen_kg_ha": 80.0, "phosphorus_kg_ha": 40.0, "potassium_kg_ha": 40.0,
        "annual_rainfall_mm": 1200.0, "avg_temp_c": 26.0, "avg_humidity_pct": 80.0,
        "soil_type": "Black (Vertisol)", "irrigation_type": "Groundwater", "previous_crop": "Wheat"
    }

    # Request 1 & 2 pass
    r1 = rate_client.post('/recommend_crop', json=crop_payload)
    r2 = rate_client.post('/recommend_crop', json=crop_payload)
    assert r1.status_code == 200
    assert r2.status_code == 200

    # Request 3 triggers 429
    r3 = rate_client.post('/recommend_crop', json=crop_payload)
    assert r3.status_code == 429
    assert "Rate limit exceeded" in r3.get_json()["error"]
    assert 'Retry-After' in r3.headers
    print(f"  => PASS: Rate limit triggers 429 with Retry-After: {r3.headers.get('Retry-After')}")

    # Health and ready remain available
    h_res = rate_client.get('/health')
    assert h_res.status_code == 200
    ready_res = rate_client.get('/ready')
    assert ready_res.status_code == 200
    print("  => PASS: /health and /ready remain accessible and exempt during rate limit block")


def test_7_cors_security(client):
    print("\n--- [7] CORS STRICT ALLOWLIST & PREFLIGHT ---")
    # 1. Approved origin
    res = client.get('/health', headers={'Origin': 'http://localhost:5173'})
    assert res.headers.get('Access-Control-Allow-Origin') == 'http://localhost:5173'
    assert res.headers.get('Access-Control-Allow-Credentials') == 'true'
    print("  => PASS: Approved origin granted access with credentials")

    # 2. Production Vercel origin
    res = client.get('/health', headers={'Origin': 'https://fasal-sarthi.vercel.app'})
    assert res.headers.get('Access-Control-Allow-Origin') == 'https://fasal-sarthi.vercel.app'
    print("  => PASS: Production Vercel origin granted access")

    # 3. Unauthorized origin
    res = client.get('/health', headers={'Origin': 'https://attacker.evil.com'})
    assert 'Access-Control-Allow-Origin' not in res.headers or res.headers.get('Access-Control-Allow-Origin') != 'https://attacker.evil.com'
    print("  => PASS: Unauthorized origin rejected")

    # 4. Preflight OPTIONS
    res = client.options('/predict_disease', headers={
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization,Content-Type'
    })
    assert res.status_code == 200
    assert res.headers.get('Access-Control-Allow-Origin') == 'http://localhost:5173'
    print("  => PASS: Preflight OPTIONS request returns 200 with CORS headers")

    # 5. Request without Origin header
    res = client.get('/health')
    assert res.status_code == 200
    print("  => PASS: Request without Origin processes normally")


def main():
    print("=================================================================")
    print("PHASE 4 COMPREHENSIVE BACKEND REGRESSION & SECURITY TEST SUITE")
    print("=================================================================")

    app = create_app(Phase4RegressionConfig)
    client = app.test_client()

    test_1_ml_freeze_and_parity()
    test_2_authentication()
    test_3_validation(client)
    test_4_infrastructure_and_errors(client)
    test_5_external_services(client)
    test_6_rate_limiting()
    test_7_cors_security(client)

    print("\n=================================================================")
    print("ALL PHASE 4 BACKEND REGRESSION & SECURITY CHECKS PASSED (100%)")
    print("=================================================================")


if __name__ == '__main__':
    main()
