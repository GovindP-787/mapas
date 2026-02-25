# MAPAS Backend - Quick Reference Guide

## Quick Start

### 1. First Time Setup (Windows)
```batch
setup.bat
```

### 1. First Time Setup (Linux/macOS)
```bash
chmod +x setup.sh
./setup.sh
```

### 2. Run Backend
```bash
python main.py
```

Backend starts at: `http://localhost:8000`

---

## API Quick Reference

### Register Customer Face
**Endpoint**: `POST /customers/{customer_id}/register-face`

```bash
curl -X POST "http://localhost:8000/customers/1/register-face" \
  -F "file=@path/to/face.jpg"
```

**Success Response**:
```json
{
  "status": "SUCCESS",
  "message": "Face registered for customer 1",
  "customer_id": "1",
  "embedding_stored": true
}
```

---

### Verify Customer Face
**Endpoint**: `POST /verify`

```bash
curl -X POST "http://localhost:8000/verify" \
  -F "file=@path/to/face.jpg"
```

**Success Response (Match Found)**:
```json
{
  "status": "AUTHORIZED",
  "customer_id": "1",
  "confidence": 0.92,
  "message": "Face verified for Forward Base Delta"
}
```

**Failure Response (No Match)**:
```json
{
  "status": "UNAUTHORIZED",
  "customer_id": null,
  "confidence": 0.35,
  "message": "Face not recognized. Access denied."
}
```

---

### Get All Customers
**Endpoint**: `GET /customers`

```bash
curl "http://localhost:8000/customers"
```

---

### Get Specific Customer
**Endpoint**: `GET /customers/{customer_id}`

```bash
curl "http://localhost:8000/customers/1"
```

---

### Get Registered Customers (Admin)
**Endpoint**: `GET /admin/registered-customers`

```bash
curl "http://localhost:8000/admin/registered-customers"
```

---

### Remove Customer Face (Admin)
**Endpoint**: `DELETE /admin/customers/{customer_id}/face`

```bash
curl -X DELETE "http://localhost:8000/admin/customers/1/face"
```

---

## Python Integration

### Register Face
```python
import requests

with open("face.jpg", "rb") as f:
    response = requests.post(
        "http://localhost:8000/customers/1/register-face",
        files={"file": f}
    )
    print(response.json())
```

### Verify Face
```python
import requests

with open("test_face.jpg", "rb") as f:
    response = requests.post(
        "http://localhost:8000/verify",
        files={"file": f}
    )
    result = response.json()
    
    if result["status"] == "AUTHORIZED":
        print(f"✓ Customer {result['customer_id']} verified")
        print(f"  Confidence: {result['confidence']:.2%}")
    else:
        print("✗ Face not recognized")
```

---

## JavaScript/Next.js Integration

### Register Face
```javascript
async function registerCustomerFace(customerId, file) {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(
    `http://localhost:8000/customers/${customerId}/register-face`,
    {
      method: "POST",
      body: formData
    }
  );
  
  return response.json();
}
```

### Verify Face
```javascript
async function verifyFace(file) {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await fetch(
    "http://localhost:8000/verify",
    {
      method: "POST",
      body: formData
    }
  );
  
  return response.json();
}

// Usage
const result = await verifyFace(imageFile);

if (result.status === "AUTHORIZED") {
  console.log(`✓ Customer ${result.customer_id} authorized`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
} else {
  console.log("✗ Access denied - face not recognized");
}
```

---

## Configuration

Edit `.env` to adjust:

```env
# Verification threshold (0.0-1.0)
# Higher = stricter matching
FACE_VERIFICATION_THRESHOLD=0.45

# Server port
PORT=8000

# Frontend CORS origins
CORS_ORIGINS=http://localhost:3000,http://localhost:8000
```

---

## Interactive API Documentation

Open in browser: `http://localhost:8000/docs`

Allows testing all endpoints with Swagger UI

---

## Common Issues

### ImportError: No module named 'insightface'
```bash
pip install -r requirements.txt
```

### Port 8000 already in use
```bash
# Change port in .env
PORT=8001
```

### CORS errors when calling from frontend
Add frontend origin to `.env`:
```env
CORS_ORIGINS=http://localhost:3000,http://your-domain.com
```

### Face not detected in image
- Image quality too low
- Face too small or too far away
- Face partially hidden (wearing sunglasses, mask, etc.)
- Lighting too dark

---

## Performance Tips

1. **Image Optimization**: Keep image sizes reasonable (< 2MB)
2. **Batch Operations**: Register faces in advance, not during delivery
3. **Threshold Tuning**: Adjust `FACE_VERIFICATION_THRESHOLD` based on your needs
   - Lower (0.40): More lenient, faster access, more false positives
   - Higher (0.50): Stricter, slower access, fewer false positives

---

## Production Deployment

### Using Gunicorn
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Using Docker
```bash
docker build -t mapas-backend .
docker run -p 8000:8000 mapas-backend
```

---

## Support

For more details, see `README.md`
