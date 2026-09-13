import os
import io
import numpy as np
from PIL import Image
import tensorflow as tf

class DiseaseService:
    CLASS_NAMES = [
        'Corn__Blight', 'Corn__Common_Rust', 'Corn___healthy', 'Corn__gray_Leaf_Spot',
        'Pepper__bell___Bacterial_spot', 'Pepper__bell___healthy', 'Potato___Early_blight',
        'Potato___Late_blight', 'Potato___healthy', 'Tomato_Bacterial_spot',
        'Tomato_Early_blight', 'Tomato_Late_blight', 'Tomato_Leaf_Mold',
        'Tomato_Septoria_leaf_spot', 'Tomato_Spider_mites_Two_spotted_spider_mite',
        'Tomato__Target_Spot', 'Tomato__Tomato_YellowLeaf__Curl_Virus',
        'Tomato__Tomato_mosaic_virus', 'Tomato_healthy'
    ]

    def __init__(self, model_path=None):
        if model_path is None:
            base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
            model_path = os.path.join(base_dir, 'FasalSarthi_Full_Model.tflite')
        self.model_path = model_path
        self._interpreter = None
        self._input_details = None
        self._output_details = None
        self.loading_error = None

    def get_interpreter(self):
        if self._interpreter is not None:
            return self._interpreter
        if self.loading_error is not None:
            return None
        try:
            interpreter = tf.lite.Interpreter(model_path=self.model_path)
            interpreter.allocate_tensors()
            self._input_details = interpreter.get_input_details()
            self._output_details = interpreter.get_output_details()
            self._interpreter = interpreter
            return self._interpreter
        except Exception as e:
            self.loading_error = e
            self._interpreter = None
            return None

    def predict(self, image_bytes):
        interpreter = self.get_interpreter()
        if interpreter is None:
            raise RuntimeError(f"Disease model could not be loaded: {self.loading_error}")

        input_details = self._input_details
        output_details = self._output_details

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

        # Exact inference (no locks per constraints)
        interpreter.set_tensor(input_details[0]['index'], img_array)
        interpreter.invoke()
        predictions = interpreter.get_tensor(output_details[0]['index'])

        output_scale, output_zero_point = output_details[0].get('quantization', (1.0, 0))
        if output_details[0]['dtype'] == np.uint8:
            predictions = (predictions.astype(np.float32) - output_zero_point) * output_scale

        predicted_class_index = int(np.argmax(predictions[0]))
        if predicted_class_index >= len(self.CLASS_NAMES):
            raise ValueError(f"Predicted index {predicted_class_index} out of bounds for CLASS_NAMES")

        predicted_class_name = self.CLASS_NAMES[predicted_class_index]
        confidence = float(np.max(predictions[0]))

        return {
            "predicted_disease": predicted_class_name,
            "confidence": f"{confidence * 100:.2f}%",
            "predicted_class_index": predicted_class_index,
            "raw_confidence_float": confidence
        }
