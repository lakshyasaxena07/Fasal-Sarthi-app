"""
Empirical verification script to test that mechanically extracted ML services
produce 100% identical outputs to the original implementation baseline.
"""

import os
import sys
import json

# Add backend directory to sys.path
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND_DIR = os.path.join(BASE_DIR, "fasal_sarthi_backend")
sys.path.insert(0, BACKEND_DIR)
sys.path.insert(0, BASE_DIR)

from app.services.disease_service import DiseaseService
from app.services.crop_service import CropService
from app.services.fertilizer_service import FertilizerService

BASELINE_PATH = os.path.join(BASE_DIR, "docs", "ai", "baseline_ml_results.json")
IMAGE_PATH = os.path.join(BACKEND_DIR, "corn_blight.jpeg")


def main():
    print("--- Running ML Parity Verification ---")
    if not os.path.exists(BASELINE_PATH):
        print(f"FATAL: Baseline file not found at {BASELINE_PATH}")
        sys.exit(1)

    with open(BASELINE_PATH, "r") as f:
        baseline = json.load(f)

    inputs = baseline["inputs"]
    expected = baseline["outputs"]

    # 1. Disease Service Test
    print("[1/3] Testing DiseaseService...")
    disease_service = DiseaseService()
    with open(IMAGE_PATH, "rb") as f:
        image_bytes = f.read()

    disease_result = disease_service.predict(image_bytes)
    print(f"  Extracted output: {disease_result}")
    print(f"  Baseline output:  {expected['disease']}")

    assert disease_result["predicted_disease"] == expected["disease"]["predicted_disease"], \
        f"Disease mismatch: {disease_result['predicted_disease']} != {expected['disease']['predicted_disease']}"
    assert disease_result["confidence"] == expected["disease"]["confidence"], \
        f"Confidence mismatch: {disease_result['confidence']} != {expected['disease']['confidence']}"
    assert disease_result["predicted_class_index"] == expected["disease"]["predicted_class_index"], \
        f"Index mismatch: {disease_result['predicted_class_index']} != {expected['disease']['predicted_class_index']}"
    assert abs(disease_result["raw_confidence_float"] - expected["disease"]["raw_confidence_float"]) < 1e-6, \
        f"Raw float mismatch: {disease_result['raw_confidence_float']} vs {expected['disease']['raw_confidence_float']}"
    print("  => DiseaseService: 100% PARITY CONFIRMED")

    # 2. Crop Service Test
    print("[2/3] Testing CropService...")
    crop_service = CropService()
    crop_result = crop_service.recommend(inputs["crop_input"])
    print(f"  Extracted output: {crop_result}")
    print(f"  Baseline output:  {expected['crop']}")

    assert crop_result["recommended_crop"] == expected["crop"]["recommended_crop"], \
        f"Crop mismatch: {crop_result['recommended_crop']} != {expected['crop']['recommended_crop']}"
    print("  => CropService: 100% PARITY CONFIRMED")

    # 3. Fertilizer Service Test
    print("[3/3] Testing FertilizerService...")
    fert_service = FertilizerService()
    fert_result = fert_service.recommend(inputs["fertilizer_input"])
    print(f"  Extracted output: {fert_result}")
    print(f"  Baseline output:  {expected['fertilizer']}")

    assert fert_result["recommended_fertilizer"] == expected["fertilizer"]["recommended_fertilizer"], \
        f"Fertilizer mismatch: {fert_result['recommended_fertilizer']} != {expected['fertilizer']['recommended_fertilizer']}"
    print("  => FertilizerService: 100% PARITY CONFIRMED")

    print("\n==========================================")
    print("ALL ML SERVICES SHOW 100% EMPIRICAL PARITY")
    print("==========================================")


if __name__ == "__main__":
    main()
