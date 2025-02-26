import sys
import json
import base64
import cv2
import numpy as np
from deepforest import main
import os
import requests
import logging
from pathlib import Path
from dotenv import load_dotenv

# Suppress DeepForest logging
logging.getLogger('deepforest').setLevel(logging.ERROR)

# Load .env file from the project root directory
project_root = Path(__file__).resolve().parent.parent.parent  # Go up 3 levels to reach project root
env_path = project_root / '.env'
load_dotenv(env_path)

# Debugging to stderr instead of stdout
print(f"Loading .env from: {env_path}", file=sys.stderr)
print(f"AIRVISUAL_API_KEY: {os.getenv('AIRVISUAL_API_KEY')}", file=sys.stderr)

# Initialize model
model = main.deepforest()
model.use_release()

def analyze_image(image_base64, lat, lon):
    temp_path = "temp_image.jpg"
    try:
        print("Starting image analysis...", file=sys.stderr)
        # Add padding if necessary
        padding = len(image_base64) % 4
        if padding:
            image_base64 += '=' * (4 - padding)
        
        print("Decoding image...", file=sys.stderr)
        image_data = base64.b64decode(image_base64)
        image_array = np.frombuffer(image_data, dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        
        if image is None:
            print("Failed to decode image", file=sys.stderr)
            return {"error": "Failed to decode image"}
        
        print(f"Image dimensions: {image.shape}", file=sys.stderr)
        
        print("Saving temporary image...", file=sys.stderr)
        cv2.imwrite(temp_path, image)
        
        print("Analyzing image with DeepForest...", file=sys.stderr)
        boxes = model.predict_image(path=temp_path)
        num_trees = len(boxes)
        print(f"Found {num_trees} trees", file=sys.stderr)
        
        # Calculate tree coverage
        height, width, _ = image.shape
        total_area = height * width
        tree_area = sum((row["xmax"] - row["xmin"]) * (row["ymax"] - row["ymin"]) for _, row in boxes.iterrows())
        tree_cover = (tree_area / total_area) * 100
        
        print("Getting air quality...", file=sys.stderr)
        api_key = os.getenv('AIRVISUAL_API_KEY')
        air_quality = get_air_quality(lat, lon, api_key)
        
        result = {
            "tree_cover_percent": tree_cover,
            "num_trees": num_trees,
            "air_quality": air_quality
        }
        return result
    except Exception as e:
        print(f"Error in analyze_image: {str(e)}", file=sys.stderr)
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

def get_air_quality(lat, lon, api_key):
    url = f'https://api.airvisual.com/v2/nearest_city?lat={lat}&lon={lon}&key={api_key}'
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return data['data'] if data['status'] == 'success' else None
    return None

if __name__ == '__main__':
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Missing parameters"}), file=sys.stderr)
        sys.exit(1)
    image_base64 = sys.argv[1]
    try:
        lat = float(sys.argv[2])
        lon = float(sys.argv[3])
    except ValueError:
        print(json.dumps({"error": "Latitude and longitude must be numbers"}))
        sys.exit(1)
        
    result = analyze_image(image_base64, lat, lon)
    print(json.dumps(result))