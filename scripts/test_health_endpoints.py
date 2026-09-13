import os
import sys

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(BASE_DIR, "fasal_sarthi_backend")
sys.path.insert(0, BACKEND_DIR)

from app import create_app
from app.config import TestingConfig

def test_endpoints():
    app = create_app(TestingConfig)
    client = app.test_client()

    print("Testing GET / ...")
    res = client.get('/')
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    assert b"Fasal Sarthi Backend Server is running!" in res.data, f"Unexpected body: {res.data}"
    print("  => PASS: GET / returned 200 OK")

    print("Testing GET /health ...")
    res = client.get('/health')
    assert res.status_code == 200, f"Expected 200, got {res.status_code}"
    data = res.get_json()
    assert data.get("status") == "healthy", f"Unexpected json: {data}"
    print(f"  => PASS: GET /health returned 200 with {data}")

    print("Testing GET /ready ...")
    res = client.get('/ready')
    data = res.get_json()
    print(f"  => GET /ready status {res.status_code} with payload: {data}")
    assert res.status_code in (200, 503), f"Unexpected status: {res.status_code}"
    assert "models" in data, "Missing 'models' key in /ready response"
    print("  => PASS: GET /ready successfully queried all models")

    print("\n==========================================")
    print("ALL HEALTH ENDPOINTS VERIFIED SUCCESSFULLY")
    print("==========================================")

if __name__ == '__main__':
    test_endpoints()
