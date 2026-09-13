"""
Phase 3 Verification Script: Frontend Architecture, Security, Mandi Auth, and ML Integrity.
"""

import os
import sys
import re
import json
import hashlib
from unittest.mock import patch, MagicMock

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(BASE_DIR, "fasal_sarthi_backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "fasal_sarthi_frontend")
SRC_DIR = os.path.join(FRONTEND_DIR, "src")
BASELINE_PATH = os.path.join(BASE_DIR, "docs", "ai", "baseline_ml_results.json")

sys.path.insert(0, BACKEND_DIR)
sys.path.insert(0, BASE_DIR)

from app import create_app
from app.config import TestingConfig


def test_mandi_auth_flow():
    print("\n--- [1] Mandi Authentication & Ingress Flow Tests ---")
    class MandiAuthConfig(TestingConfig):
        BYPASS_AUTH_FOR_TESTS = False
        SUPABASE_URL = "https://mock-project.supabase.co"
        SUPABASE_SERVICE_KEY = "mock-service-key"
        MANDI_API_KEY = "mock-api-key"

    app = create_app(MandiAuthConfig)
    client = app.test_client()

    from app import extensions
    mock_supabase = MagicMock()
    extensions.supabase_client = mock_supabase

    payload = {"state": "Madhya Pradesh", "commodity": "Wheat"}

    # 1. Unauthenticated request (Missing Authorization header) -> 401
    res = client.post('/get_mandi_prices', json=payload)
    assert res.status_code == 401, f"Expected 401 for unauthenticated request, got {res.status_code}"
    assert "Authorization header missing" in res.get_json()["error"]
    print("  => PASS: Missing token returns 401 Unauthorized")

    # 2. Malformed Authorization header -> 401
    res = client.post('/get_mandi_prices', json=payload, headers={'Authorization': 'Basic 12345'})
    assert res.status_code == 401
    assert "Invalid Authorization header format" in res.get_json()["error"]
    print("  => PASS: Malformed header returns 401 Unauthorized")

    # 3. Invalid/Expired Token -> 401
    mock_supabase.auth.get_user.side_effect = Exception("JWT expired")
    res = client.post('/get_mandi_prices', json=payload, headers={'Authorization': 'Bearer expired_token_xyz'})
    assert res.status_code == 401
    assert "Token verification failed" in res.get_json()["error"]
    print("  => PASS: Expired/invalid token rejected with 401 Unauthorized")

    # 4. Valid Session Token -> 200 OK
    mock_user = MagicMock()
    mock_user.id = "farmer-user-456"
    mock_resp = MagicMock()
    mock_resp.user = mock_user
    mock_supabase.auth.get_user.side_effect = None
    mock_supabase.auth.get_user.return_value = mock_resp

    mock_mandi_response = MagicMock()
    mock_mandi_response.status_code = 200
    mock_mandi_response.json.return_value = {
        "records": [
            {
                "state": "Madhya Pradesh",
                "district": "Bhopal",
                "market": "Bhopal",
                "commodity": "Wheat",
                "modal_price": "2400",
                "min_price": "2300",
                "max_price": "2500",
                "arrival_date": "15/04/2026"
            }
        ]
    }

    with patch("requests.get", return_value=mock_mandi_response):
        client.application.mandi_service.api_key = "mock-api-key"
        res = client.post('/get_mandi_prices', json=payload, headers={'Authorization': 'Bearer valid_farmer_jwt'})
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.get_json()
        assert isinstance(data, list)
        assert len(data) == 1
        assert data[0]["mandi"] == "Bhopal"
        assert data[0]["price"] == "2400"
        print("  => PASS: Valid authenticated session passes token through and returns 200 OK")


def test_frontend_architecture_contracts():
    print("\n--- [2] Frontend Architecture & Code Contract Tests ---")

    # 1. MandiProvider checks user before querying
    mandi_provider_path = os.path.join(SRC_DIR, "Context", "MandiProvider.jsx")
    with open(mandi_provider_path, 'r', encoding='utf-8') as f:
        mandi_code = f.read()
    assert "useUser" in mandi_code, "MandiProvider must import useUser"
    assert "if (!user)" in mandi_code, "MandiProvider must guard with if (!user)"
    assert "fetchMandiPrices" in mandi_code, "MandiProvider must use centralized mandiApi"
    print("  => PASS: MandiProvider strictly guarded by user session check")

    # 2. Profile Creation has no window.location.reload()
    create_profile_path = os.path.join(SRC_DIR, "pages", "CreateProfilePage.jsx")
    with open(create_profile_path, 'r', encoding='utf-8') as f:
        create_profile_code = f.read()
    assert "window.location.reload" not in create_profile_code, "CreateProfilePage must not contain window.location.reload()"
    assert "updateProfileState" in create_profile_code, "CreateProfilePage must call updateProfileState"
    assert "navigate('/dashboard'" in create_profile_code or 'navigate("/dashboard"' in create_profile_code, "CreateProfilePage must navigate to dashboard"
    print("  => PASS: Profile creation uses state update & normal navigation without reload")

    # 3. UserProvider exposes updateProfileState
    user_provider_path = os.path.join(SRC_DIR, "Context", "UserProvider.jsx")
    with open(user_provider_path, 'r', encoding='utf-8') as f:
        user_provider_code = f.read()
    assert "updateProfileState" in user_provider_code, "UserProvider must export updateProfileState"
    assert "refreshProfile" in user_provider_code, "UserProvider must export refreshProfile"
    print("  => PASS: UserProvider provides updateProfileState and refreshProfile")

    # 4. Object URL lifecycle in ScanPage
    scan_page_path = os.path.join(SRC_DIR, "pages", "ScanPage.jsx")
    with open(scan_page_path, 'r', encoding='utf-8') as f:
        scan_code = f.read()
    assert "URL.revokeObjectURL" in scan_code, "ScanPage must revoke Object URLs"
    assert "diseaseApi" in scan_code, "ScanPage must use centralized diseaseApi"
    print("  => PASS: ScanPage properly revokes Object URLs and uses centralized diseaseApi")

    # 5. Centralized API files existence
    api_dir = os.path.join(SRC_DIR, "api")
    expected_api_files = [
        "client.js", "disease.js", "crop.js", "fertilizer.js", "weather.js", "mandi.js", "chatbot.js", "index.js"
    ]
    for api_file in expected_api_files:
        p = os.path.join(api_dir, api_file)
        assert os.path.exists(p), f"Missing centralized API file: {api_file}"
    print(f"  => PASS: All {len(expected_api_files)} centralized API modules verified present")

    # 6. Dead duplicate assets directory does not exist
    assests_dir = os.path.join(SRC_DIR, "assests")
    assert not os.path.exists(assests_dir), "Duplicate src/assests directory must be deleted"
    print("  => PASS: Duplicate src/assests directory confirmed deleted")

    # 7. Firebase removed from package.json
    pkg_json_path = os.path.join(FRONTEND_DIR, "package.json")
    with open(pkg_json_path, 'r', encoding='utf-8') as f:
        pkg_data = json.load(f)
    assert "firebase" not in pkg_data.get("dependencies", {}), "firebase must be removed from package.json"
    print("  => PASS: Firebase successfully removed from frontend dependencies")


def test_secret_and_url_hygiene():
    print("\n--- [3] Secret & URL Hygiene Audit Tests ---")
    # 1. No SUPABASE_SERVICE_KEY in frontend
    for root, _, files in os.walk(FRONTEND_DIR):
        if "node_modules" in root or "dist" in root or ".git" in root:
            continue
        for file in files:
            if file.endswith(('.js', '.jsx', '.json', '.html', '.env')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    assert "SUPABASE_SERVICE" not in content, f"Secret leak found in {filepath}!"

    print("  => PASS: Zero Supabase service-role keys in frontend codebase")

    # 2. VITE_API_BASE_URL only referenced in client.js
    occurrences = []
    for root, _, files in os.walk(SRC_DIR):
        for file in files:
            if file.endswith(('.js', '.jsx')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    if "VITE_API_BASE_URL" in content:
                        rel = os.path.relpath(filepath, SRC_DIR)
                        occurrences.append(rel)

    assert occurrences == [os.path.join("api", "client.js")], f"Unexpected VITE_API_BASE_URL in: {occurrences}"
    print("  => PASS: VITE_API_BASE_URL strictly centralized to src/api/client.js")


def test_ml_freeze_and_parity():
    print("\n--- [4] ML Freeze & Baseline Parity Verification ---")
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
        assert actual_hash == expected_hash, f"Hash mismatch on {filename}!"
    print("  => PASS: All 7 ML model artifact hashes bit-for-bit identical")


def main():
    print("=======================================================")
    print("STARTING PHASE 3 VERIFICATION TEST SUITE")
    print("=======================================================")

    test_mandi_auth_flow()
    test_frontend_architecture_contracts()
    test_secret_and_url_hygiene()
    test_ml_freeze_and_parity()

    print("\n=======================================================")
    print("ALL PHASE 3 VERIFICATION CHECKS PASSED (100%)")
    print("=======================================================")


if __name__ == '__main__':
    main()
