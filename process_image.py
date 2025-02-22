import sys
import json
import base64
import io
from PIL import Image
import numpy as np
from imageanalysis import analyze_image  # Assumes you have this module

def base64_to_image_array(b64_string):
    """Convert base64 string to a NumPy image array."""
    image_data = base64.b64decode(b64_string)
    image = Image.open(io.BytesIO(image_data))
    return np.array(image)

if __name__ == "__main__":
    # Expect the base64 image string to be passed as the first argument…
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No image data provided"}))
        sys.exit(1)
    image_base64 = sys.argv[1]
    try:
        image_array = base64_to_image_array(image_base64)
        # Call your image analysis function which may include:
        # - Processing via GPT Vision API
        # - Tree detection using your custom model
        # The analyze_image function is expected to return a tuple:
        # (processed_image_base64, greenspace_percentage)
        analyzed_image, greenspace_percentage = analyze_image(image_array)
        result = {
            "analyzedImage": analyzed_image,  # processed image as base64 string
            "greenspace_percentage": greenspace_percentage
        }
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1) 