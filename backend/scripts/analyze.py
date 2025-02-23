import sys
import json
import base64
import cv2
import numpy as np
from deepforest import main
import requests
import tempfile
import os

# Initialize model
model = main.deepforest()
model.use_release()

def validate_image(image_path):
    try:
        img = cv2.imread(image_path)
        if img is None:
            return False, "Failed to read image"
        if len(img.shape) != 3 or img.shape[2] != 3:
            return False, "Image must be in RGB format"
        if img.shape[0] < 100 or img.shape[1] < 100:
            return False, "Image dimensions too small"
        return True, "Image valid"
    except Exception as e:
        return False, str(e)

def analyze_image(image_base64, lat, lon):
    try:
        print("Starting image analysis...")
        # Add padding if necessary
        padding = len(image_base64) % 4
        if padding:
            image_base64 += '=' * (4 - padding)
        
        print("Decoding image...")
        image_data = base64.b64decode(image_base64)
        image_array = np.frombuffer(image_data, dtype=np.uint8)
        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
        
        if image is None:
            print("Failed to decode image")
            return {"error": "Failed to decode image"}
        
        print(f"Image dimensions: {image.shape}")
        
        print("Saving temporary image...")
        temp_path = "temp_image.jpg"
        cv2.imwrite(temp_path, image)
        
        print("Analyzing image with DeepForest...")
        boxes = model.predict_image(path=temp_path)
        print(f"Found {len(boxes)} trees")
        
        # Calculate tree coverage
        height, width, _ = image.shape
        total_area = height * width
        tree_area = sum((row["xmax"] - row["xmin"]) * (row["ymax"] - row["ymin"]) for _, row in boxes.iterrows())
        tree_cover = (tree_area / total_area) * 100
        
        # Get air quality
        api_key = '012f8393-a199-4264-be78-89fbb395da6d'
        air_quality = get_air_quality(lat, lon, api_key)
        
        return {
            "tree_cover_percent": tree_cover,
            "num_trees": len(boxes),
            "air_quality": air_quality
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)

def get_air_quality(lat, lon, api_key):
    url = f'https://api.airvisual.com/v2/nearest_city?lat={lat}&lon={lon}&key={api_key}'
    response = requests.get(url)
    if response.status_code == 200:
        data = response.json()
        return data['data'] if data['status'] == 'success' else None
    return None

if __name__ == "__main__":
    try:
        image_base64 = sys.argv[1]
        lat = float(sys.argv[2])
        lon = float(sys.argv[3])
        
        result = analyze_image(image_base64, lat, lon)
        print(json.dumps(result, ensure_ascii=False))
        sys.stdout.flush()
    except Exception as e:
        print(json.dumps({"error": str(e)}, ensure_ascii=False))
        sys.stdout.flush()
        sys.exit(1)