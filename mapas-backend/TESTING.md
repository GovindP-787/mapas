# API Testing Guide

Complete guide for testing the MAPAS Food Delivery Backend.

## Prerequisites

- Backend running on `http://localhost:8000`
- Test images available
- curl, Postman, or Python requests installed

---

## Manual Testing with curl

### Test 1: Health Check
```bash
curl http://localhost:8000/health
```

Expected Response:
```json
{
  "status": "healthy",
  "service": "MAPAS Food Delivery Backend",
  "version": "1.0.0"
}
```

---

### Test 2: Get All Customers
```bash
curl http://localhost:8000/customers
```

Expected Response: Array of 5 customers with their details

---

### Test 3: Get Specific Customer
```bash
curl http://localhost:8000/customers/1
```

Expected Response:
```json
{
  "id": "1",
  "name": "Forward Base Delta",
  "phone": "555-0101",
  "address": "34.4211° N, 112.1832° W",
  "order_id": "#RAT-SUP-882",
  "order_contents": "MRE Rations (Type C) x20",
  "drop_coordinates": "34.4211° N, 112.1832° W",
  "status": "pending",
  "created_at": "2024-02-12T..."
}
```

---

### Test 4: Register Customer Face
```bash
curl -X POST "http://localhost:8000/customers/1/register-face" \
  -F "file=@face_sample.jpg"
```

Expected Response (Success):
```json
{
  "status": "SUCCESS",
  "message": "Face registered for customer 1",
  "customer_id": "1",
  "embedding_stored": true
}
```

Expected Response (No Face Detected):
```json
{
  "status": "FAILED",
  "message": "No face detected in image",
  "customer_id": "1",
  "embedding_stored": false
}
```

---

### Test 5: Verify Face (Matching)
```bash
# Use same image as registration for positive match
curl -X POST "http://localhost:8000/verify" \
  -F "file=@face_sample.jpg"
```

Expected Response (Match Found):
```json
{
  "status": "AUTHORIZED",
  "customer_id": "1",
  "confidence": 0.92,
  "message": "Face verified for Forward Base Delta"
}
```

---

### Test 6: Verify Face (Non-Matching)
```bash
# Use different face image
curl -X POST "http://localhost:8000/verify" \
  -F "file=@different_face.jpg"
```

Expected Response (No Match):
```json
{
  "status": "UNAUTHORIZED",
  "customer_id": null,
  "confidence": 0.25,
  "message": "Face not recognized. Access denied."
}
```

---

### Test 7: Get Registered Customers (Admin)
```bash
curl http://localhost:8000/admin/registered-customers
```

Expected Response:
```json
{
  "count": 2,
  "customer_ids": ["1", "2"]
}
```

---

### Test 8: Remove Customer Face (Admin)
```bash
curl -X DELETE "http://localhost:8000/admin/customers/1/face"
```

Expected Response:
```json
{
  "status": "SUCCESS",
  "message": "Face removed for customer 1"
}
```

---

## Testing with Python

### Setup
```python
import requests
from pathlib import Path

BASE_URL = "http://localhost:8000"

def register_face(customer_id: str, image_path: str):
    """Register a customer's face"""
    with open(image_path, "rb") as f:
        files = {"file": f}
        response = requests.post(
            f"{BASE_URL}/customers/{customer_id}/register-face",
            files=files
        )
    return response.json()

def verify_face(image_path: str):
    """Verify a face"""
    with open(image_path, "rb") as f:
        files = {"file": f}
        response = requests.post(
            f"{BASE_URL}/verify",
            files=files
        )
    return response.json()

def get_customers():
    """Get all customers"""
    response = requests.get(f"{BASE_URL}/customers")
    return response.json()
```

### Test Script
```python
# Get customers
print("📋 Getting customers...")
customers = get_customers()
print(f"   Found {len(customers)} customers")

# Register faces
print("\n📸 Registering faces...")
result = register_face("1", "face_sample.jpg")
print(f"   Status: {result['status']}")

# Verify face
print("\n✓ Verifying face...")
result = verify_face("face_sample.jpg")
print(f"   Status: {result['status']}")
print(f"   Customer: {result.get('customer_id')}")
print(f"   Confidence: {result['confidence']:.2%}")
```

---

## Testing with Postman

### 1. Create Collection
- New > Collection
- Name: "MAPAS Backend"

### 2. Add Requests

#### GET /health
- Method: GET
- URL: `http://localhost:8000/health`
- Click Send

#### POST /customers/{customer_id}/register-face
- Method: POST
- URL: `http://localhost:8000/customers/1/register-face`
- Body > form-data
  - Key: `file`, Type: `File`
  - Select image file
- Click Send

#### POST /verify
- Method: POST
- URL: `http://localhost:8000/verify`
- Body > form-data
  - Key: `file`, Type: `File`
  - Select image file
- Click Send

---

## Interactive Testing (Swagger UI)

1. Open `http://localhost:8000/docs` in browser
2. Click on endpoint to expand
3. Click "Try it out"
4. Fill in parameters
5. Click "Execute"

---

## Error Scenarios to Test

### 1. Invalid Image File
```bash
curl -X POST "http://localhost:8000/customers/1/register-face" \
  -F "file=@document.pdf"
```

Expected: `400 Bad Request` - "Uploaded file must be an image"

---

### 2. Invalid Customer ID
```bash
curl -X POST "http://localhost:8000/customers/999/register-face" \
  -F "file=@face.jpg"
```

Expected: `404 Not Found` - "Customer 999 not found"

---

### 3. Empty File
```bash
touch empty.jpg
curl -X POST "http://localhost:8000/customers/1/register-face" \
  -F "file=@empty.jpg"
```

Expected: `400 Bad Request` - "Image file is empty"

---

### 4. No Face in Image
```bash
# Use landscape/object image
curl -X POST "http://localhost:8000/customers/1/register-face" \
  -F "file=@landscape.jpg"
```

Expected: `200 OK` with `"embedding_stored": false`

---

## Performance Testing

### Register Multiple Faces
```python
import time
import requests

customer_ids = ["1", "2", "3", "4", "5"]
image_path = "face_sample.jpg"

for customer_id in customer_ids:
    start = time.time()
    with open(image_path, "rb") as f:
        files = {"file": f}
        response = requests.post(
            f"http://localhost:8000/customers/{customer_id}/register-face",
            files=files
        )
    elapsed = time.time() - start
    print(f"Customer {customer_id}: {elapsed:.2f}s - {response.json()['status']}")
```

### Verify at Scale
```python
import time
import requests
from concurrent.futures import ThreadPoolExecutor

def verify_once(image_path, iteration):
    start = time.time()
    with open(image_path, "rb") as f:
        files = {"file": f}
        response = requests.post(
            "http://localhost:8000/verify",
            files=files
        )
    elapsed = time.time() - start
    return elapsed, response.json()['status']

with ThreadPoolExecutor(max_workers=5) as executor:
    futures = [
        executor.submit(verify_once, "face_sample.jpg", i)
        for i in range(10)
    ]
    
    for i, future in enumerate(futures):
        elapsed, status = future.result()
        print(f"Request {i+1}: {elapsed:.2f}s - {status}")
```

---

## Confidence Score Analysis

Test threshold boundaries:

```python
import requests

def test_threshold(image_path, threshold):
    """Test with different thresholds"""
    with open(image_path, "rb") as f:
        files = {"file": f}
        response = requests.post(
            "http://localhost:8000/verify",
            files=files
        )
    
    result = response.json()
    confidence = result.get('confidence', 0)
    
    # Manually check against threshold
    if confidence >= threshold:
        print(f"✓ Confidence {confidence:.3f} >= {threshold} → AUTHORIZED")
    else:
        print(f"✗ Confidence {confidence:.3f} < {threshold} → UNAUTHORIZED")

# Test with different images
print("Testing with same person (different photo):")
test_threshold("face_sample_v2.jpg", 0.45)

print("\nTesting with different person:")
test_threshold("different_person.jpg", 0.45)
```

---

## Debugging

### Enable Debug Logging
Edit `.env`:
```env
DEBUG=True
```

Restart backend to see verbose logs

### Check Service Status
```bash
# Backend is running
curl http://localhost:8000/ready

# Face service loaded
curl http://localhost:8000/admin/registered-customers
```

### Test InsightFace Directly
```python
from services.face_service import face_service
import cv2

# Load image
img = cv2.imread("face.jpg")

# Get faces
faces = face_service.model.get(img)
print(f"Detected {len(faces)} face(s)")

if len(faces) > 0:
    face = faces[0]
    print(f"Embedding shape: {face.embedding.shape}")
    print(f"Confidence: {face.det_score}")
```

---

## Test Checklist

- [ ] Health check passes
- [ ] All customers retrievable
- [ ] Registration stores embedding
- [ ] Verification finds registered face
- [ ] Different face not authorized
- [ ] Invalid image rejected
- [ ] Missing customer returns 404
- [ ] Concurrent requests work
- [ ] Confidence scores reasonable (0.8+)
- [ ] Error responses properly formatted

---

## Success Criteria

✓ Backend responds in < 500ms for verify requests
✓ Confidence scores consistent across repeated calls
✓ No false negatives for same person
✓ Few false positives for different people
✓ Memory stable during extended testing
✓ CORS working for frontend requests
