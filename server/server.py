import pandas as pd
import gc
import json
from flask import Flask, request, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
from vocab_predict import VocabPredictor
from config import HOST, PORT, VOCAB_FORMAT_PATH, VOCAB_MAP_FILE_PATH, FS_YT_FILE_PATH
print("server.py: Libraries imported.")

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")
connected_clients = {}

format = pd.read_parquet(VOCAB_FORMAT_PATH)

# TODO: Need to check if the following class instances are thread-safe or not
vocab_predictor = VocabPredictor()


@app.route('/')
def index():
    return "Flask Socket.IO Server Running"


@app.route('/api/vocab-contents', methods=['GET'])
def get_vocab_data():
    try:
        with open(VOCAB_MAP_FILE_PATH, 'r') as f:
            data = json.load(f)
        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)})


@app.route('/api/fs-contents', methods=['GET'])
def get_fs_data():
    try:
        with open(FS_YT_FILE_PATH, 'r') as f:
            data = json.load(f)
        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)})


@socketio.on("connect")
def handle_connect():
    client_id = request.sid
    connected_clients[client_id] = {
        "all_landmarks": [],
        "frame": 0
    }
    print(f"Client connected: {request.sid}")
    print(f"Total connected clients: {len(connected_clients)}")


@socketio.on("disconnect")
def handle_disconnect():
    client_id = request.sid
    connected_clients.pop(client_id, None)
    print(f"Client disconnected: {request.sid}")
    print(f"Total connected clients: {len(connected_clients)}")


@socketio.on("vocab-landmarkers")
def handle_vocab_landmarkers(results):
    try:
        if not results:
            return

        client_id = request.sid
        client_data = connected_clients.get(client_id)
        if not client_data:
            return

        client_data["frame"] += 1
        landmarks = create_vocab_framedata_df(
            results, client_data["frame"], format)
        client_data["all_landmarks"].append(landmarks)
        print("Received landmarks.")

    except Exception as e:
        print(f"Error at handle_vocab_landmarkers(): {str(e)}")


@socketio.on("vocab-predict")
def handle_vocab_predict():
    try:
        client_id = request.sid
        client_data = connected_clients.get(client_id)
        if not client_data:
            return []

        if client_data["all_landmarks"] == []:
            return []

        # Keep the following code(line) for debugging purposes
        # pd.concat(client_data["all_landmarks"]).reset_index(drop=True).to_parquet("./output/output.parquet")
        all_landmarks_df = pd.concat(
            client_data["all_landmarks"]).reset_index(drop=True)

        print("Predicting sign...")
        results = vocab_predictor.predict_sign(all_landmarks_df)

        if results is not None:
            for result in results:
                print(
                    f"Prediction result: {result['sign']}, {result['confidence'] * 100:.2f}%")

        client_data["all_landmarks"] = []
        gc.collect()
        return results

    except Exception as e:
        print(f"Error at handle_vocab_predict(): {str(e)}")
        return None


def create_vocab_framedata_df(results, frame, format):
    try:
        face = pd.DataFrame()
        pose = pd.DataFrame()
        left_hand = pd.DataFrame()
        right_hand = pd.DataFrame()

        if "faceLandmarks" in results and results["faceLandmarks"]:
            for i, point in enumerate(results["faceLandmarks"]):
                face.loc[i, ["x", "y", "z"]] = [
                    point["x"], point["y"], point["z"]]
        if "poseLandmarks" in results and results["poseLandmarks"]:
            for i, point in enumerate(results['poseLandmarks']):
                pose.loc[i, ["x", "y", "z"]] = [
                    point["x"], point["y"], point["z"]]
        if "leftHandLandmarks" in results and results["leftHandLandmarks"]:
            for i, point in enumerate(results['leftHandLandmarks']):
                left_hand.loc[i, ["x", "y", "z"]] = [
                    point["x"], point["y"], point["z"]]
        if "rightHandLandmarks" in results and results["rightHandLandmarks"]:
            for i, point in enumerate(results["rightHandLandmarks"]):
                right_hand.loc[i, ["x", "y", "z"]] = [
                    point["x"], point["y"], point["z"]]

        face = face.reset_index().rename(
            columns={"index": "landmark_index"}).assign(type="face")
        pose = pose.reset_index().rename(
            columns={"index": "landmark_index"}).assign(type="pose")
        left_hand = left_hand.reset_index().rename(
            columns={"index": "landmark_index"}).assign(type="left_hand")
        right_hand = right_hand.reset_index().rename(
            columns={"index": "landmark_index"}).assign(type="right_hand")

        landmarks = pd.concat(
            [face, left_hand, pose, right_hand]).reset_index(drop=True)
        landmarks = format.merge(
            landmarks, on=["type", "landmark_index"], how="left")
        landmarks = landmarks.assign(frame=frame)
        return landmarks

    except Exception as e:
        print(f"Error at create_vocab_framedata_df(): {str(e)}")
        return pd.DataFrame()

# NOTE: The following code is for the REST API mode insted of using SocketIO


@app.route('/api/vocab-predict', methods=['POST'])
def handle_vocab_predict():
    try:
        data = request.get_json()
        if not data or 'allLandmarks' not in data:
            return jsonify([])

        frame = 0
        all_landmarks = []
        landmarks_list = data['allLandmarks']

        if not landmarks_list:
            return jsonify([])

        # This process is a bit time-consuming, but since it is CPU-bound,
        # using Python's multithreading will not make it faster due to GIL.
        for landmarks in landmarks_list:
            frame += 1
            landmarks_df = create_vocab_framedata_df(landmarks, frame, format)
            all_landmarks.append(landmarks_df)

        results = vocab_predict(all_landmarks)
        return jsonify(results)

    except Exception as e:
        print(f"Error at handle_vocab_predict(): {str(e)}")

# NOTE: The following code is for the REST API mode insted of using SocketIO


def vocab_predict(all_landmarks):
    try:
        all_landmarks_df = pd.concat(all_landmarks).reset_index(drop=True)
        results = vocab_predictor.predict_sign(all_landmarks_df)

        if results is not None:
            for result in results:
                print(
                    f"Prediction result: {result['sign']}, {result['confidence'] * 100:.2f}%")

        gc.collect()
        return results

    except Exception as e:
        print(f"Error at vocab_predict(): {str(e)}")
        return None


if __name__ == "__main__":
    print(f"Server running on http://{HOST}:{PORT}")
    socketio.run(app, host=HOST, port=PORT, debug=False)
