#!/usr/bin/env python3
"""
Test verification with detailed debug output
"""
import requests
import json

def test_verification_debug():
    """Test verification with debug output"""
    print("=== VERIFICATION DEBUG TEST ===")
    
    # Check backend status
    try:
        response = requests.get('http://localhost:8002/ready')
        print(f"Backend ready status: {response.status_code}")
        print(f"Ready response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Backend not accessible: {e}")
        return
    
    # Get customers with faces
    try:
        response = requests.get('http://localhost:8002/face-customers')
        data = response.json()
        customers = data.get('customers', [])
        customers_with_faces = [c for c in customers if c.get('face_embedding')]
        
        print(f"\nCustomers with face embeddings: {len(customers_with_faces)}")
        for customer in customers_with_faces:
            print(f"  - {customer.get('name')} (ID: {customer.get('id')})")
            
    except Exception as e:
        print(f"Error getting customers: {e}")
        return
    
    # Print troubleshooting steps
    print(f"\n=== TROUBLESHOOTING STEPS ===")
    print("1. Make sure backend loaded embeddings on startup")
    print("2. Check verification threshold (now set to 0.35)")
    print("3. Test with a customer that has a face embedding")
    print("4. Use browser dev tools to see verification API calls")
    print("5. Check backend logs for detailed face detection info")
    
    print(f"\n=== VERIFICATION PROCESS ===")
    print("When you test verification:")
    print("- Frontend captures image from video")
    print("- Sends to /verify endpoint") 
    print("- Backend extracts face embedding")
    print("- Compares with stored embeddings")
    print("- Returns match if similarity > 0.35")

if __name__ == "__main__":
    test_verification_debug()