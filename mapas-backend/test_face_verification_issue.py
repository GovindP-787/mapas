#!/usr/bin/env python3
"""
Debug face verification issues
"""
import requests
import json
from services.face_service import face_service

def test_customers_with_faces():
    """Check how many customers have face embeddings"""
    try:
        response = requests.get('http://localhost:8001/face-customers')
        if response.status_code == 200:
            data = response.json()
            customers = data.get('customers', [])
            customers_with_faces = [c for c in customers if c.get('face_embedding')]
            
            print(f"=== CUSTOMER FACE DATA ===")
            print(f"Total customers: {len(customers)}")
            print(f"Customers with face embeddings: {len(customers_with_faces)}")
            
            for customer in customers_with_faces:
                print(f"  - {customer.get('name', 'Unknown')} (ID: {customer.get('id', 'N/A')})")
            
            # Check in-memory embeddings
            in_memory_embeddings = face_service.get_registered_customers()
            print(f"In-memory face embeddings: {len(in_memory_embeddings)}")
            for customer_id in in_memory_embeddings:
                print(f"  - Customer ID: {customer_id}")
                
        else:
            print(f"Failed to get customers: {response.status_code}")
            
    except Exception as e:
        print(f"Error checking customers: {e}")

def test_face_service_config():
    """Check face service configuration"""
    print(f"\n=== FACE SERVICE CONFIG ===")
    
    # Check which model is loaded
    if face_service.model is not None:
        print("✅ InsightFace model loaded")
        try:
            print(f"Model type: {type(face_service.model)}")
        except:
            pass
    else:
        print("⚠️  Using OpenCV fallback (Haar Cascade)")
        
    # Check verification threshold
    from config import settings
    print(f"Verification threshold: {settings.FACE_VERIFICATION_THRESHOLD}")
    print(f"Detection threshold: {settings.FACE_DETECTION_THRESHOLD}")

def test_verification_with_debug():
    """Test verification process with debug info"""
    print(f"\n=== VERIFICATION TEST ===")
    
    # Get customers with faces
    try:
        response = requests.get('http://localhost:8001/face-customers')
        data = response.json()
        customers_with_faces = [c for c in data.get('customers', []) if c.get('face_embedding')]
        
        if customers_with_faces:
            customer = customers_with_faces[0]
            print(f"Testing with customer: {customer.get('name')} (ID: {customer.get('id')})")
            
            # Simulate a verification request
            print("📝 To test verification:")
            print("1. Go to face verification page")
            print("2. Select this customer")
            print("3. Capture your face")
            print("4. Check browser console and backend logs")
            
        else:
            print("❌ No customers with face embeddings found!")
            print("💡 You need to:")
            print("1. Go to customer enrollment page")
            print("2. Add a customer")
            print("3. Upload a face photo for that customer")
            print("4. Then try verification")
            
    except Exception as e:
        print(f"Error in verification test: {e}")

if __name__ == "__main__":
    test_customers_with_faces()
    test_face_service_config()
    test_verification_with_debug()