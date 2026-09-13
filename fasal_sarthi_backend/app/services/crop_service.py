import os
import pandas as pd
import joblib

class CropService:
    CROP_FULL_FEATURE_NAMES = [
        'soil_ph', 'nitrogen_kg_ha', 'phosphorus_kg_ha', 'potassium_kg_ha', 'annual_rainfall_mm', 'avg_temp_c', 'avg_humidity_pct',
        'soil_type_Black (Vertisol)', 'soil_type_Laterite', 'soil_type_Loamy', 'soil_type_Red', 'soil_type_Sandy',
        'irrigation_type_Drip', 'irrigation_type_Groundwater', 'irrigation_type_Mixed', 'irrigation_type_Rainfed', 'irrigation_type_Sprinkler',
        'previous_crop_Dal', 'previous_crop_Fallow', 'previous_crop_Ganna', 'previous_crop_Makka', 'previous_crop_Moongfali', 'previous_crop_Rice', 'previous_crop_Sarson', 'previous_crop_Wheat'
    ]
    CROP_NUMERICAL_FEATURES = CROP_FULL_FEATURE_NAMES[:7]

    def __init__(self, model_path=None, scaler_path=None, encoder_path=None):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        self.model_path = model_path or os.path.join(base_dir, 'best_stacking_model_final.joblib')
        self.scaler_path = scaler_path or os.path.join(base_dir, 'scaler_final.joblib')
        self.encoder_path = encoder_path or os.path.join(base_dir, 'encoder_final.joblib')

        self.model = None
        self.scaler = None
        self.encoder = None
        self._load_artifacts()

    def _load_artifacts(self):
        self.model = joblib.load(self.model_path)
        self.scaler = joblib.load(self.scaler_path)
        self.encoder = joblib.load(self.encoder_path)

    def is_ready(self):
        return (self.model is not None and
                self.scaler is not None and
                self.encoder is not None and
                len(self.CROP_FULL_FEATURE_NAMES) == 25)

    def recommend(self, data):
        if not self.is_ready():
            raise RuntimeError("Crop Recommendation model setup incorrect or not loaded.")

        # Exact logic from app.py lines 312-363
        input_df = pd.DataFrame(columns=self.CROP_FULL_FEATURE_NAMES, index=[0]).fillna(0.0)

        numerical_values_dict = {}
        for feature_name in self.CROP_NUMERICAL_FEATURES:
            if feature_name not in data:
                raise KeyError(f"Missing input feature: {feature_name}")
            value = float(data[feature_name])
            input_df.loc[0, feature_name] = value
            numerical_values_dict[feature_name] = value

        numerical_df_for_scaling = pd.DataFrame([numerical_values_dict], columns=self.CROP_NUMERICAL_FEATURES)
        scaled_numerical_values = self.scaler.transform(numerical_df_for_scaling)
        input_df[self.CROP_NUMERICAL_FEATURES] = scaled_numerical_values

        soil_type = data.get('soil_type')
        if not soil_type:
            raise KeyError("Missing input feature: soil_type")
        soil_col_name = f'soil_type_{soil_type}'
        if soil_col_name in input_df.columns:
            input_df.loc[0, soil_col_name] = 1.0
        else:
            raise ValueError(f"Unknown/Unsupported soil_type: {soil_type}")

        irrigation_type = data.get('irrigation_type')
        if not irrigation_type:
            raise KeyError("Missing input feature: irrigation_type")
        irrigation_col_name = f'irrigation_type_{irrigation_type}'
        if irrigation_col_name in input_df.columns:
            input_df.loc[0, irrigation_col_name] = 1.0
        else:
            raise ValueError(f"Unknown/Unsupported irrigation_type: {irrigation_type}")

        previous_crop = data.get('previous_crop')
        if not previous_crop:
            raise KeyError("Missing input feature: previous_crop")
        previous_crop_col_name = f'previous_crop_{previous_crop}'
        if previous_crop_col_name in input_df.columns:
            input_df.loc[0, previous_crop_col_name] = 1.0

        input_final = input_df[self.CROP_FULL_FEATURE_NAMES]
        prediction_encoded = self.model.predict(input_final)
        predicted_crop_name = self.encoder.inverse_transform(prediction_encoded)

        return {
            "recommended_crop": str(predicted_crop_name[0])
        }
