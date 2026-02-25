# MAPAS Food Delivery Backend

A production-ready face detection and verification backend for the MAPAS food delivery system using InsightFace and FastAPI.

## Features

- **Face Detection & Embedding**: Uses InsightFace buffalo_l model for accurate face embedding extraction
- **Face Verification**: Cosine similarity-based authentication with configurable threshold
- **Customer Management**: RESTful API for customer registration and face enrollment
- **CORS Enabled**: Ready for frontend integration
- **Production-Ready**: Modular, tested, and documented code
- **CPU-Based**: No GPU required (uses CPUExecutionProvider)

## Requirements

- Python 3.10+
- pip (Python package manager)

## Project Structure

```
mapas-backend/
├── main.py                 # FastAPI application with all endpoints
├── config.py              # Configuration management
├── models.py              # Pydantic data models
├── utils.py               # Helper functions (image processing, similarity)
├── services/
│   ├── __init__.py
│   └── face_service.py    # InsightFace integration (singleton pattern)
├── requirements.txt       # Dependencies
├── .env                   # Environment variables
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## Installation & Setup

### Step 1: Create Virtual Environment

```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 2: Upgrade pip

```bash
pip install --upgrade pip
```

### Step 3: Install Dependencies

```bash
pip install -r requirements.txt
```

This installs:
- **fastapi** - Web framework
- **uvicorn** - ASGI server
- **insightface** - Face detection & embedding
- **onnxruntime** - Model inference engine
- **opencv-python** - Image processing
- **numpy** - Numerical computing
- **scipy** - Scientific computing (cosine similarity)
- **python-multipart** - File upload handling
- **python-dotenv** - Environment variable management
- **pydantic** - Data validation

### Step 4: Run the Backend

```bash
# Development mode (with auto-reload)
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The backend will start at `http://localhost:8000`

## API Endpoints

### Health Checks

#### Get Health Status
```
GET /health
```
Response:
```json
{
  "status": "healthy",
  "service": "MAPAS Food Delivery Backend",
  "version": "1.0.0"
}
```

#### Get Readiness Status
```
GET /ready
```

### Customer Management

#### Get All Customers
```
GET /customers
```
Returns list of all customers with their details.

#### Get Specific Customer
```
GET /customers/{customer_id}
```

#### Register Customer Face
```
POST /customers/{customer_id}/register-face
```
**Request**: Multipart form with image file
```bash
curl -X POST "http://localhost:8000/customers/1/register-face" \
  -H "accept: application/json" \
  -F "file=@customer_face.jpg"
```

**Response**:
```json
{
  "status": "SUCCESS",
  "message": "Face registered for customer 1",
  "customer_id": "1",
  "embedding_stored": true
}
```

### Face Verification

#### Verify Customer Face
```
POST /verify
```
**Request**: Multipart form with image file
```bash
curl -X POST "http://localhost:8000/verify" \
  -H "accept: application/json" \
  -F "file=@face_to_verify.jpg"
```

**Response (Authorized)**:
```json
{
  "status": "AUTHORIZED",
  "customer_id": "1",
  "confidence": 0.92,
  "message": "Face verified for Forward Base Delta"
}
```

**Response (Unauthorized)**:
```json
{
  "status": "UNAUTHORIZED",
  "customer_id": null,
  "confidence": 0.35,
  "message": "Face not recognized. Access denied."
}
```

### Admin Endpoints

#### Get Registered Customers
```
GET /admin/registered-customers
```
Returns list of customers with registered faces.

#### Remove Customer Face
```
DELETE /admin/customers/{customer_id}/face
```

## Configuration

Edit `.env` to customize:

```env
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=False

# Face Verification (0.0-1.0, higher = stricter)
FACE_DETECTION_THRESHOLD=0.5
FACE_VERIFICATION_THRESHOLD=0.45    # Default threshold for matching

# CORS Origins (comma-separated)
CORS_ORIGINS=http://localhost:3000,http://localhost:8000

# InsightFace Model (buffalo_l recommended)
INSIGHTFACE_MODEL=buffalo_l
```

## Technical Details

### InsightFace Integration

- **Model**: Buffalo_l (best accuracy, ~100MB)
- **Execution**: CPU-based (CPUExecutionProvider)
- **Detection Size**: 640x640 (configurable)
- **Embedding Dimension**: 512-dimensional vectors
- **Similarity Metric**: Cosine similarity
- **Threshold**: 0.45 (configurable, 0-1 range)

### Face Verification Algorithm

1. Extract embedding from provided image
2. Compare against all registered customer embeddings
3. Calculate cosine similarity for each comparison
4. Return best match if similarity ≥ threshold
5. Return UNAUTHORIZED if no match found

### Service Architecture

#### Singleton Pattern
The `FaceService` is implemented as a singleton to ensure:
- Model loads only once at startup
- Shared embedding storage across requests
- Thread-safe operations

#### In-Memory Embedding Storage
Customer face embeddings are stored in a Python dictionary:
```python
{
    "customer_1": numpy_array(512,),
    "customer_2": numpy_array(512,),
    ...
}
```

**For Production**: Replace with persistent database (PostgreSQL, MongoDB, etc.)

## Image Processing

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- BMP (.bmp)
- Other OpenCV-supported formats

### Automatic Processing
- Decodes image bytes without saving files
- Automatic resizing (max 1280px)
- BGR color space handling
- Face detection with configurable size

## Error Handling

All endpoints return standard error responses:

```json
{
  "status": "ERROR",
  "message": "Descriptive error message",
  "error_code": 400
}
```

## CORS Configuration

By default, CORS is enabled for:
- `http://localhost:3000` (Next.js frontend)
- `http://localhost:8000` (Testing)

Modify `CORS_ORIGINS` in `.env` for production domains.

## Testing the API

### Interactive Documentation
Open `http://localhost:8000/docs` in your browser for Swagger UI

### Manual Testing with curl

```bash
# Register a customer face
curl -X POST "http://localhost:8000/customers/1/register-face" \
  -F "file=@face.jpg"

# Verify face
curl -X POST "http://localhost:8000/verify" \
  -F "file=@test_face.jpg"

# Get customers
curl "http://localhost:8000/customers"
```

### Using Python Requests

```python
import requests

# Register face
with open("face.jpg", "rb") as f:
    files = {"file": f}
    response = requests.post(
        "http://localhost:8000/customers/1/register-face",
        files=files
    )
    print(response.json())

# Verify face
with open("test_face.jpg", "rb") as f:
    files = {"file": f}
    response = requests.post(
        "http://localhost:8000/verify",
        files=files
    )
    print(response.json())
```

## Performance Notes

- **First Request**: Slower due to model loading (~2-3 seconds)
- **Subsequent Requests**: ~100-300ms depending on image size
- **Memory**: ~200MB (model + overhead)
- **CPU Usage**: Moderate during inference

## Production Deployment

### Gunicorn with Uvicorn Workers
```bash
pip install gunicorn
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker Example (Dockerfile)
```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Management
- Use separate `.env.production` for production settings
- Never commit `.env` files to version control
- Use secrets management (AWS Secrets, HashiCorp Vault, etc.)

## Troubleshooting

### InsightFace Model Download Issues
```bash
# Force download models
python -c "import insightface; insightface.app.FaceAnalysis(name='buffalo_l').prepare(ctx_id=-1, det_size=(640, 640))"
```

### ONNX Runtime Issues
```bash
# Reinstall onnxruntime
pip install --force-reinstall onnxruntime
```

### Image Decoding Errors
- Ensure image is valid and not corrupted
- Check file is actually an image (check MIME type)
- Try different image formats

## Future Enhancements

- [ ] Persistent database integration (PostgreSQL)
- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] Model versioning with MLOps integration
- [ ] API authentication/authorization
- [ ] Rate limiting
- [ ] Caching layer (Redis)
- [ ] Logging and monitoring
- [ ] Batch face verification
- [ ] Support for multiple faces per customer

## License

Proprietary - MAPAS Project

## Support

For issues or questions, contact the development team.
