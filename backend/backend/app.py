import os
from flask import Flask, request, jsonify, send_from_directory
import base64
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = "saved_images"
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


@app.route("/save-image", methods=["POST"])
def save_image():
    data = request.json
    image_data = data["image"]
    class_name = data["className"]

    header, encoded = image_data.split(",", 1)
    image_data = base64.b64decode(encoded)

    existing_images = [img for img in os.listdir(UPLOAD_FOLDER) if img.startswith(class_name)]
    image_count = len(existing_images) + 1

    file_name = f"{class_name}_{image_count}.png"
    file_path = os.path.join(UPLOAD_FOLDER, file_name)

    with open(file_path, "wb") as f:
        f.write(image_data)

    return jsonify({"success": True, "file_name": file_name})

@app.route("/get-images", methods=["GET"])
def get_images():
    images = os.listdir(UPLOAD_FOLDER)
    return jsonify({"images": images})

@app.route("/saved_images/<path:filename>")
def serve_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
