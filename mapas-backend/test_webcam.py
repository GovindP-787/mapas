"""
Quick test script to verify faces using your webcam.
"""

import cv2
import requests
import numpy as np
from pathlib import Path

# Backend URL
BACKEND_URL = "http://localhost:8000"

# Customer IDs to test with
CUSTOMER_IDS = ["1", "2", "3", "4", "5"]
CUSTOMER_NAMES = {
    "1": "Forward Base Delta",
    "2": "Eastern Outpost Alpha",
    "3": "Northern Command Center",
    "4": "Central Supply Hub",
    "5": "Southern Defense Post"
}


def capture_frame_and_save(camera_index=0, num_frames=5):
    """
    Capture frames from webcam and save as temporary image.
    """
    cap = cv2.VideoCapture(camera_index)
    
    if not cap.isOpened():
        print("❌ Error: Could not open camera")
        return None
    
    print(f"\n📷 Opening camera... Capturing {num_frames} frames")
    
    frame = None
    for i in range(num_frames):
        ret, frame = cap.read()
        if not ret:
            print("❌ Error: Could not read frame")
            cap.release()
            return None
        
        # Flip for selfie view
        frame = cv2.flip(frame, 1)
        
        # Show preview
        cv2.imshow('Capture Frame (Press Q to stop early, or wait...)', frame)
        
        # Check for early exit
        if cv2.waitKey(500) & 0xFF == ord('q'):
            break
    
    cv2.destroyAllWindows()
    cap.release()
    
    return frame


def register_face_from_webcam(customer_id: str, customer_name: str):
    """Register a face from webcam for a customer."""
    print(f"\n{'='*60}")
    print(f"📝 REGISTERING FACE: {customer_id} ({customer_name})")
    print(f"{'='*60}")
    
    # Capture frame
    frame = capture_frame_and_save(num_frames=5)
    if frame is None:
        return False
    
    # Convert to JPEG bytes
    _, buffer = cv2.imencode('.jpg', frame)
    image_bytes = buffer.tobytes()
    
    # Send to backend
    try:
        print(f"\n📤 Sending image to backend...")
        response = requests.post(
            f"{BACKEND_URL}/customers/{customer_id}/register-face",
            files={"file": ("face.jpg", image_bytes, "image/jpeg")}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: {result['message']}")
            print(f"   Status: {result['status']}")
            return True
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception: {str(e)}")
        return False


def verify_face_from_webcam():
    """Verify a face from webcam against registered customers."""
    print(f"\n{'='*60}")
    print(f"✔️  VERIFYING FACE")
    print(f"{'='*60}")
    
    # Capture frame
    frame = capture_frame_and_save(num_frames=5)
    if frame is None:
        return
    
    # Convert to JPEG bytes
    _, buffer = cv2.imencode('.jpg', frame)
    image_bytes = buffer.tobytes()
    
    # Send to backend
    try:
        print(f"\n📤 Sending image to backend for verification...")
        response = requests.post(
            f"{BACKEND_URL}/verify",
            files={"file": ("face.jpg", image_bytes, "image/jpeg")}
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"\n📊 VERIFICATION RESULT:")
            print(f"   Status: {result['status']}")
            
            if result['status'] == 'AUTHORIZED':
                customer_id = result['customer_id']
                customer_name = CUSTOMER_NAMES.get(customer_id, "Unknown")
                confidence = result['confidence']
                print(f"   ✅ MATCH FOUND!")
                print(f"   Customer ID: {customer_id}")
                print(f"   Customer Name: {customer_name}")
                print(f"   Confidence: {confidence:.4f} ({confidence*100:.2f}%)")
            else:
                confidence = result['confidence']
                print(f"   ❌ NO MATCH")
                print(f"   Best match confidence: {confidence:.4f} ({confidence*100:.2f}%)")
            
            print(f"   Message: {result['message']}")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"   {response.text}")
    except Exception as e:
        print(f"❌ Exception: {str(e)}")


def check_backend_status():
    """Check if backend is running."""
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Backend is running!")
            print(f"   {result['service']} v{result['version']}")
            return True
    except:
        pass
    
    print(f"❌ Backend is not running!")
    print(f"   Start it with: cd d:\\vibe ui\\mapas-backend ; .\\.\venv\\Scripts\\python main.py")
    return False


def show_menu():
    """Display main menu."""
    print(f"\n{'='*60}")
    print("🎥 MAPAS FACE VERIFICATION TEST")
    print(f"{'='*60}")
    print("\nOptions:")
    print("  1. Register a face for a customer")
    print("  2. Verify a face against registered customers")
    print("  3. Check backend health")
    print("  4. Exit")
    print(f"\n{'='*60}")


def main():
    """Main test loop."""
    print(f"\n{'='*60}")
    print("🎥 MAPAS FACE VERIFICATION TEST")
    print(f"{'='*60}")
    
    # Check backend
    if not check_backend_status():
        print("\n⚠️  Please start the backend first!")
        return
    
    while True:
        show_menu()
        choice = input("\nEnter choice (1-4): ").strip()
        
        if choice == "1":
            print("\nSelect a customer to register:\n")
            for cid in CUSTOMER_IDS:
                print(f"  {cid}. {CUSTOMER_NAMES[cid]}")
            
            cust = input("\nEnter customer ID (1-5): ").strip()
            if cust in CUSTOMER_IDS:
                register_face_from_webcam(cust, CUSTOMER_NAMES[cust])
            else:
                print("❌ Invalid customer ID")
        
        elif choice == "2":
            verify_face_from_webcam()
        
        elif choice == "3":
            check_backend_status()
        
        elif choice == "4":
            print("\n👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Test interrupted by user")
