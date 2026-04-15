import requests
import os

# --- Configuration ---
# Your live Render backend URL
url = "https://fasal-sarthi-backend.onrender.com/predict_disease"

# Full path to your test image file on your computer
# IMPORTANT: Replace with the correct path to your image
# image_path = r"\corn_blight.jpeg"
image_path = r"C:\Users\rouna\OneDrive\Desktop\minor projecr\fasal_sarthi_backend\corn_blight.jpeg"

# --- Check if image exists ---
if not os.path.exists(image_path):
    print(f"ERROR: Image file not found at: {image_path}")
else:
    print(f"Found image file: {image_path}")
    # --- Prepare the file for upload ---
    files = {'file': (os.path.basename(image_path), open(image_path, 'rb'), 'image/jpeg')}
    #                   ^ Key must be 'file'         ^ Open in binary read mode

    # --- Send the request ---
    try:
        print(f"Sending POST request to {url}...")
        response = requests.post(url, files=files, timeout=120) # Added timeout

        # --- Print the response ---
        print(f"\nStatus Code: {response.status_code}")
        try:
            # Try to print JSON response if successful
            print("Response JSON:")
            print(response.json())
        except requests.exceptions.JSONDecodeError:
            # Print raw text if not JSON (e.g., HTML error page)
            print("Response Text (Not JSON):")
            print(response.text)

    except requests.exceptions.RequestException as e:
        print(f"\nREQUEST FAILED: {e}")

    finally:
        # Close the file handle (important)
        if 'file' in files:
             files['file'][1].close()