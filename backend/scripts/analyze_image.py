import sys
import json
import base64
import cv2
import numpy as np
from deepforest import main
import requests

# Initialize model
model = main.deepforest()
model.use_release()

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
        
        print("Saving temporary image...")
        temp_path = "temp_image.jpg"
        cv2.imwrite(temp_path, image)
        
        print("Analyzing image with DeepForest...")
        boxes = model.predict_image(path=temp_path)
        num_trees = len(boxes)
        
        print("Calculating tree cover...")
        height, width, _ = image.shape
        total_area = height * width
        tree_area = sum((row["xmax"] - row["xmin"]) * (row["ymax"] - row["ymin"]) for _, row in boxes.iterrows())
        tree_cover = (tree_area / total_area) * 100
        
        print("Getting air quality...")
        api_key = '012f8393-a199-4264-be78-89fbb395da6d'
        air_quality = get_air_quality(lat, lon, api_key)
        
        print("Analysis complete")
        return {
            "tree_cover_percent": tree_cover,
            "num_trees": num_trees,
            "air_quality": air_quality
        }
    except Exception as e:
        print(f"Error in analyze_image: {str(e)}")
        return {"error": str(e)}

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
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)