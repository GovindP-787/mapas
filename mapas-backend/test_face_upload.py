import requests
import base64
import json

# Test the face upload endpoint
def test_face_upload():
    # Create a simple valid 1x1 black PNG image
    png_data = bytes([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
        0x00, 0x00, 0x00, 0x0D,  # IHDR chunk size
        0x49, 0x48, 0x44, 0x52,  # IHDR
        0x00, 0x00, 0x00, 0x01,  # Width: 1
        0x00, 0x00, 0x00, 0x01,  # Height: 1  
        0x08, 0x02,              # Bit depth: 8, Color type: 2 (RGB)
        0x00, 0x00, 0x00,        # Compression, filter, interlace
        0x90, 0x77, 0x53, 0xDE,  # CRC
        0x00, 0x00, 0x00, 0x0C,  # IDAT chunk size
        0x49, 0x44, 0x41, 0x54,  # IDAT
        0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00,  # Image data
        0x02, 0x00, 0x01, 0xE2, 0x21, 0xBC, 0x33,  # CRC
        0x00, 0x00, 0x00, 0x00,  # IEND chunk size  
        0x49, 0x45, 0x4E, 0x44,  # IEND
        0xAE, 0x42, 0x60, 0x82   # CRC
    ])
    
    customer_id = "6993fff5a74e9dbabc891ff7"  # Ghoxt
    
    url = f"http://localhost:8000/customers/{customer_id}/upload-face"
    
    files = {
        'face_image': ('test.png', png_data, 'image/png')
    }
    
    try:
        response = requests.post(url, files=files)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ Face upload successful!")
        elif response.status_code == 400:
            print("⚠️  Expected: No face detected (test image)")
        else:
            print("❌ Face upload failed")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    test_face_upload()