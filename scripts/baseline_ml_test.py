"""
Script to capture empirical ML baseline outputs using the ORIGINAL implementation logic from app.py.
All models, scalers, encoders, and math are executed identically to app.py.
Outputs are saved to docs/ai/baseline_ml_results.json for mechanical parity verification.
"""

import os
import io
import json
import numpy as np
import pandas as pd
from PIL import Image
import joblib

BACKEND_DIR = os.path.join(os.path.dirname(__file__), "..", "fasal_sarthi_backend")

# -------------------------------------------------------------
# 1. CANONICAL TEST INPUTS
# -------------------------------------------------------------
CROP_INPUT = {
    "soil_ph": 6.5,
    "nitrogen_kg_ha": 80.0,
    "phosphorus_kg_ha": 40.0,
    "potassium_kg_ha": 40.0,
    "annual_rainfall_mm": 1200.0,
    "avg_temp_c": 26.0,
    "avg_humidity_pct": 80.0,
    "soil_type": "Black (Vertisol)",
    "irrigation_type": "Groundwater",
    "previous_crop": "Wheat"
}

FERTILIZER_INPUT = {
    "Temparature": 28.0,
    "Humidity": 65.0,
    "Moisture": 45.0,
    "Nitrogen": 35.0,
    "Potassium": 15.0,
    "Phosphorous": 20.0,
    "Soil_Type": "Sandy",
    "Crop_Type": "Maize"
}

IMAGE_PATH = os.path.join(BACKEND_DIR, "corn_blight.jpeg")


def run_original_disease_detection():
    # Import tensorflow inside function to ensure environment is ready
    import tensorflow as tf

    tflite_model_path = os.path.join(BACKEND_DIR, "FasalSarthi_Full_Model.tflite")
    class_names = [
        'Corn__Blight', 'Corn__Common_Rust', 'Corn___healthy', 'Corn__gray_Leaf_Spot',
        'Pepper__bell___Bacterial_spot', 'Pepper__bell___healthy', 'Potato___Early_blight',
        'Potato___Late_blight', 'Potato___healthy', 'Tomato_Bacterial_spot',
        'Tomato_Early_blight', 'Tomato_Late_blight', 'Tomato_Leaf_Mold',
        'Tomato_Septoria_leaf_spot', 'Tomato_Spider_mites_Two_spotted_spider_mite',
        'Tomato__Target_Spot', 'Tomato__Tomato_YellowLeaf__Curl_Virus',
        'Tomato__Tomato_mosaic_virus', 'Tomato_healthy'
    ]

    interpreter = tf.lite.Interpreter(model_path=tflite_model_path)
    interpreter.allocate_tensors()
    input_details = interpreter.get_input_details()
    output_details = interpreter.get_output_details()

    with open(IMAGE_PATH, "rb") as f:
        image_bytes = f.read()

    # Exact preprocessing from app.py lines 192-217
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    input_shape = input_details[0]['shape']
    target_height = input_shape[1]
    target_width = input_shape[2]
    img = img.resize((target_width, target_height))

    img_array = tf.keras.preprocessing.image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)

    input_dtype = input_details[0]['dtype']
    img_array = img_array.astype(input_dtype)

    input_scale, input_zero_point = input_details[0].get('quantization', (1.0, 0))
    if input_dtype == np.float32 and input_scale == 1.0 and input_zero_point == 0:
        img_array = img_array / 255.0

    interpreter.set_tensor(input_details[0]['index'], img_array)
    interpreter.invoke()
    predictions = interpreter.get_tensor(output_details[0]['index'])

    predicted_class_index = np.argmax(predictions[0])
    predicted_class_name = class_names[predicted_class_index]
    confidence = float(np.max(predictions[0]))

    return {
        "predicted_disease": predicted_class_name,
        "confidence": f"{confidence * 100:.2f}%",
        "predicted_class_index": int(predicted_class_index),
        "raw_confidence_float": confidence
    }


def run_original_crop_recommendation():
    crop_full_feature_names = [
        'soil_ph', 'nitrogen_kg_ha', 'phosphorus_kg_ha', 'potassium_kg_ha', 'annual_rainfall_mm', 'avg_temp_c', 'avg_humidity_pct',
        'soil_type_Black (Vertisol)', 'soil_type_Laterite', 'soil_type_Loamy', 'soil_type_Red', 'soil_type_Sandy',
        'irrigation_type_Drip', 'irrigation_type_Groundwater', 'irrigation_type_Mixed', 'irrigation_type_Rainfed', 'irrigation_type_Sprinkler',
        'previous_crop_Dal', 'previous_crop_Fallow', 'previous_crop_Ganna', 'previous_crop_Makka', 'previous_crop_Moongfali', 'previous_crop_Rice', 'previous_crop_Sarson', 'previous_crop_Wheat'
    ]
    crop_numerical_features = crop_full_feature_names[:7]

    crop_model_stacking = joblib.load(os.path.join(BACKEND_DIR, "best_stacking_model_final.joblib"))
    crop_scaler = joblib.load(os.path.join(BACKEND_DIR, "scaler_final.joblib"))
    crop_encoder_final = joblib.load(os.path.join(BACKEND_DIR, "encoder_final.joblib"))

    # Exact logic from app.py lines 313-363
    input_df = pd.DataFrame(columns=crop_full_feature_names, index=[0]).fillna(0.0)

    numerical_values_dict = {}
    for feature_name in crop_numerical_features:
        value = float(CROP_INPUT[feature_name])
        input_df.loc[0, feature_name] = value
        numerical_values_dict[feature_name] = value

    numerical_df_for_scaling = pd.DataFrame([numerical_values_dict], columns=crop_numerical_features)
    scaled_numerical_values = crop_scaler.transform(numerical_df_for_scaling)
    input_df[crop_numerical_features] = scaled_numerical_values

    soil_col_name = f"soil_type_{CROP_INPUT['soil_type']}"
    if soil_col_name in input_df.columns:
        input_df.loc[0, soil_col_name] = 1.0

    irrigation_col_name = f"irrigation_type_{CROP_INPUT['irrigation_type']}"
    if irrigation_col_name in input_df.columns:
        input_df.loc[0, irrigation_col_name] = 1.0

    previous_crop_col_name = f"previous_crop_{CROP_INPUT['previous_crop']}"
    if previous_crop_col_name in input_df.columns:
        input_df.loc[0, previous_crop_col_name] = 1.0

    input_final = input_df[crop_full_feature_names]
    prediction_encoded = crop_model_stacking.predict(input_final)
    predicted_crop_name = crop_encoder_final.inverse_transform(prediction_encoded)

    return {
        "recommended_crop": str(predicted_crop_name[0])
    }


def run_original_fertilizer_recommendation():
    fert_model = joblib.load(os.path.join(BACKEND_DIR, "random_forest_model.joblib"))
    fert_model_columns = joblib.load(os.path.join(BACKEND_DIR, "model_columns.joblib"))
    fert_encoder = joblib.load(os.path.join(BACKEND_DIR, "label_encoder.joblib"))

    num_features = ['Temparature', 'Humidity', 'Moisture', 'Nitrogen', 'Potassium', 'Phosphorous']
    soil_prefix = 'Soil_Type_'
    crop_prefix = 'Crop_Type_'

    # Exact logic from app.py lines 418-461
    input_data = {feat: float(FERTILIZER_INPUT[feat]) for feat in num_features if feat in FERTILIZER_INPUT}
    input_df = pd.DataFrame(columns=fert_model_columns, index=[0]).fillna(0)

    for key, value in input_data.items():
        if key in input_df.columns:
            input_df.loc[0, key] = value

    soil_col_name = soil_prefix + FERTILIZER_INPUT['Soil_Type']
    if soil_col_name in input_df.columns:
        input_df.loc[0, soil_col_name] = 1

    crop_col_name = crop_prefix + FERTILIZER_INPUT['Crop_Type']
    if crop_col_name in input_df.columns:
        input_df.loc[0, crop_col_name] = 1

    input_final = input_df[fert_model_columns]
    prediction_encoded = fert_model.predict(input_final)
    predicted_fertilizer = fert_encoder.inverse_transform(prediction_encoded)

    return {
        "recommended_fertilizer": str(predicted_fertilizer[0])
    }


if __name__ == "__main__":
    print("--- Capturing ML Baselines ---")
    disease_result = run_original_disease_detection()
    print("Disease baseline:", disease_result)

    crop_result = run_original_crop_recommendation()
    print("Crop baseline:", crop_result)

    fertilizer_result = run_original_fertilizer_recommendation()
    print("Fertilizer baseline:", fertilizer_result)

    baseline_data = {
        "inputs": {
            "disease_test_image": os.path.basename(IMAGE_PATH),
            "crop_input": CROP_INPUT,
            "fertilizer_input": FERTILIZER_INPUT
        },
        "outputs": {
            "disease": disease_result,
            "crop": crop_result,
            "fertilizer": fertilizer_result
        }
    }

    out_path = os.path.join(os.path.dirname(__file__), "..", "docs", "ai", "baseline_ml_results.json")
    with open(out_path, "w") as f:
        json.dump(baseline_data, f, indent=2)
    print(f"ML baseline successfully saved to {out_path}")
