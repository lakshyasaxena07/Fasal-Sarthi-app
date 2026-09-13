import os
import pandas as pd
import joblib

class FertilizerService:
    NUM_FEATURES = ['Temparature', 'Humidity', 'Moisture', 'Nitrogen', 'Potassium', 'Phosphorous']
    SOIL_PREFIX = 'Soil_Type_'
    CROP_PREFIX = 'Crop_Type_'

    def __init__(self, model_path=None, columns_path=None, encoder_path=None):
        base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
        self.model_path = model_path or os.path.join(base_dir, 'random_forest_model.joblib')
        self.columns_path = columns_path or os.path.join(base_dir, 'model_columns.joblib')
        self.encoder_path = encoder_path or os.path.join(base_dir, 'label_encoder.joblib')

        self.model = None
        self.model_columns = None
        self.encoder = None
        self._load_artifacts()

    def _load_artifacts(self):
        self.model = joblib.load(self.model_path)
        self.model_columns = joblib.load(self.columns_path)
        self.encoder = joblib.load(self.encoder_path)

    def is_ready(self):
        return (self.model is not None and
                self.model_columns is not None and
                self.encoder is not None)

    def recommend(self, data):
        if not self.is_ready():
            raise RuntimeError("Fertilizer Recommendation model is not loaded.")

        # Exact logic from app.py lines 417-460
        input_data = {feat: float(data[feat]) for feat in self.NUM_FEATURES if feat in data}

        soil_type = data.get('Soil_Type')
        crop_type = data.get('Crop_Type')

        if not soil_type or not crop_type:
            raise KeyError("Missing Soil_Type or Crop_Type in input")

        input_df = pd.DataFrame(columns=self.model_columns, index=[0]).fillna(0)

        for key, value in input_data.items():
            if key in input_df.columns:
                input_df.loc[0, key] = value

        soil_col_name = self.SOIL_PREFIX + soil_type
        if soil_col_name in input_df.columns:
            input_df.loc[0, soil_col_name] = 1
        else:
            raise ValueError(f"Unknown Soil_Type: {soil_type}")

        crop_col_name = self.CROP_PREFIX + crop_type
        if crop_col_name in input_df.columns:
            input_df.loc[0, crop_col_name] = 1
        else:
            raise ValueError(f"Unknown Crop_Type: {crop_type}")

        input_final = input_df[self.model_columns]
        prediction_encoded = self.model.predict(input_final)
        predicted_fertilizer = self.encoder.inverse_transform(prediction_encoded)

        return {
            "recommended_fertilizer": str(predicted_fertilizer[0])
        }
