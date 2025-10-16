print("vocab_predict.py: Importing libraries...")
import pandas as pd
import numpy as np
import json
from tensorflow.lite.python.interpreter import Interpreter
from config import VOCAB_MAP_FILE_PATH, VOCAB_MODEL_FILE_PATH
print("vocab_predict.py: Libraries imported.")

ROWS_PER_FRAME = 543 # Number of landmarks per frame

class VocabPredictor:       
    def __init__(self):
        self.interpreter = Interpreter(model_path=VOCAB_MODEL_FILE_PATH)
        self.prediction_fn = self.interpreter.get_signature_runner("serving_default")
        self.ORD2SIGN = None

        with open(VOCAB_MAP_FILE_PATH, 'r') as json_file:
            self.ORD2SIGN = json.load(json_file)
            self.ORD2SIGN = {int(k): v["sign"] for k, v in self.ORD2SIGN.items()}

    def load_relevant_data_subset(self, df):
        data_columns = ['x', 'y', 'z']
        data = df[data_columns]
        n_frames = int(len(data) / ROWS_PER_FRAME)
        data = data.values.reshape(n_frames, ROWS_PER_FRAME, len(data_columns))
        return data.astype(np.float32)
   
    def predict_sign(self, df):
        xyz_np = self.load_relevant_data_subset(df)
        prediction = self.prediction_fn(inputs=xyz_np)
        outputs = pd.Series(prediction['outputs'])

        if outputs.isna().all():
            return None, None
        
        predicted_sign_ords = outputs.fillna(-np.inf).argsort()[::-1][:10]

        results = []
        for i in predicted_sign_ords:
            results.append({
                "sign_id": i,
                "sign": self.ORD2SIGN[i],
                "confidence": float(outputs[i])
            })
        return results
        
if __name__ == "__main__":
    print("Predicting sign...")
    predictor = VocabPredictor()
    results = predictor.predict_sign()
    if results is not None:
        for result in results:
            print(f"Prediction result: {result['sign_id']}, {result['sign']}, {result['confidence'] * 100:.2f}%")
