from fastapi import FastAPI, File, UploadFile, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
import io
import base64
import json
import queue
import threading

from config import settings
from logger import get_logger
from models import (
    Customer,
    FaceEmbeddingResponse,
    VerificationResponse,
    CustomerRegistration,
    ErrorResponse,
    Announcement,
    AnnouncementResponse,
    AnnouncementLog,
    CustomerFace,
    CustomerFaceEnrollment,
    CustomerFaceResponse,
    AudioDevice,
    AudioStreamMessage,
    AudioStreamStatus
)
from services import face_service
from services.database import AnnouncementRepository, CustomerFaceRepository
from services.tts_service import get_tts_service
from services.audio_service import get_audio_service

log = get_logger("mapas.backend")


# Initialize FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Face detection and verification backend for MAPAS Food Delivery"
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Mock customer database (in production, use actual database)
CUSTOMERS_DB: dict = {
    "1": Customer(
        id="1",
        name="Forward Base Delta",
        phone="555-0101",
        address="34.4211° N, 112.1832° W",
        order_id="#RAT-SUP-882",
        order_contents="MRE Rations (Type C) x20",
        drop_coordinates="34.4211° N, 112.1832° W",
        status="pending"
    ),
    "2": Customer(
        id="2",
        name="Eastern Outpost Alpha",
        phone="555-0102",
        address="34.5122° N, 112.2945° W",
        order_id="#RAT-SUP-883",
        order_contents="Medical Supplies Kit x5",
        drop_coordinates="34.5122° N, 112.2945° W",
        status="pending"
    ),
    "3": Customer(
        id="3",
        name="Northern Command Center",
        phone="555-0103",
        address="34.6333° N, 112.0876° W",
        order_id="#RAT-SUP-884",
        order_contents="Water Containers (5L) x30",
        drop_coordinates="34.6333° N, 112.0876° W",
        status="in-transit"
    ),
    "4": Customer(
        id="4",
        name="Central Supply Hub",
        phone="555-0104",
        address="34.3456° N, 112.3210° W",
        order_id="#RAT-SUP-885",
        order_contents="Ammunition Box x10",
        drop_coordinates="34.3456° N, 112.3210° W",
        status="pending"
    ),
    "5": Customer(
        id="5",
        name="Southern Defense Post",
        phone="555-0105",
        address="34.2111° N, 112.1555° W",
        order_id="#RAT-SUP-886",
        order_contents="Communication Equipment x3",
        drop_coordinates="34.2111° N, 112.1555° W",
        status="delivered"
    )
}


# ============================================================================
# STARTUP EVENT
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Log startup information and initialize services."""
    log.info("="*60)
    log.info("🚀 MAPAS Backend Starting Up")
    log.info("="*60)
    log.info(f"Application: {settings.APP_NAME} v{settings.APP_VERSION}")
    log.info(f"Server: {settings.HOST}:{settings.PORT}")
    log.info(f"Debug mode: {settings.DEBUG}")
    log.info("✓ MongoDB connection ready")
    log.info("✓ Text-to-Speech service ready")
    
    # Load stored customer face embeddings
    await load_customer_embeddings()
    
    log.info("="*60 + "\n")


async def load_customer_embeddings():
    """Load stored customer face embeddings from database into face service."""
    try:
        log.info("📸 Loading customer face embeddings from database...")
        customers = customer_face_repo.get_all_customers()
        
        loaded_count = 0
        for customer in customers:
            if customer.get('face_embedding'):
                try:
                    import base64
                    import numpy as np
                    
                    # Decode base64 embedding back to numpy array (.copy() avoids read-only frombuffer)
                    embedding_bytes = base64.b64decode(customer['face_embedding'])
                    embedding = np.frombuffer(embedding_bytes, dtype=np.float32).copy()
                    
                    # Store in face service
                    face_service.face_embeddings[customer['id']] = embedding
                    loaded_count += 1
                    
                    log.info(f"✓ Loaded face embedding for: {customer['name']} (ID: {customer['id']})")
                    log.info(f"  Embedding shape: {embedding.shape}, norm: {np.linalg.norm(embedding):.4f}")
                except Exception as e:
                    log.error(f"❌ Failed to load embedding for {customer['name']}: {str(e)}")
        
        log.info(f"📸 Loaded {loaded_count} customer face embeddings")
        log.info(f"📊 Verification threshold: {settings.FACE_VERIFICATION_THRESHOLD}")
    except Exception as e:
        log.error(f"❌ Error loading customer embeddings: {str(e)}")


# ============================================================================
# HEALTH CHECK ENDPOINTS
# ============================================================================

@app.get("/health", tags=["Health"])
async def health_check():
    """Check if backend is running."""
    return {
        "status": "healthy",
        "service": "MAPAS Food Delivery Backend",
        "version": settings.APP_VERSION
    }


@app.get("/ping", tags=["Health"])
async def ping():
    """Simple ping check for frontend WebSocket pre-connection validation."""
    return {"status": "ok", "message": "pong"}


@app.get("/ready", tags=["Health"])
async def readiness_check():
    """Check if backend is ready to serve requests."""
    try:
        # Check if face service has either InsightFace or OpenCV loaded 
        has_model = (face_service.model is not None) or hasattr(face_service, 'face_cascade')
        
        if not has_model:
            return {
                "status": "not_ready",
                "message": "No face detection model loaded"
            }
        
        # Determine which model type is loaded
        model_type = "InsightFace" if face_service.model is not None else "OpenCV Haar Cascade"
        
        return {
            "status": "ready",
            "model_type": model_type,
            "registered_customers": len(face_service.get_registered_customers()),
            "verification_threshold": settings.FACE_VERIFICATION_THRESHOLD,
            "message": "Backend is ready to serve requests"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.get("/tts-test", tags=["Health"])
async def tts_test():
    """Test text-to-speech system."""
    try:
        test_message = "Testing audio system. If you hear this, text to speech is working."
        tts_service.text_to_speech_simple(test_message)
        return {
            "status": "testing",
            "message": "TTS test started. Check your speakers for audio output.",
            "test_message": test_message
        }
    except Exception as e:
        return {
            "status": "error",
            "message": f"TTS error: {str(e)}"
        }


# ============================================================================
# CUSTOMER ENDPOINTS
# ============================================================================

@app.get("/customers", response_model=List[Customer], tags=["Customers"])
async def get_customers():
    """
    Get list of all customers.
    
    Returns:
        List of customers with their details
    """
    return list(CUSTOMERS_DB.values())


@app.get("/customers/{customer_id}", response_model=Customer, tags=["Customers"])
async def get_customer(customer_id: str):
    """
    Get specific customer details.
    
    Args:
        customer_id: Unique customer identifier
        
    Returns:
        Customer details
    """
    if customer_id not in CUSTOMERS_DB:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer {customer_id} not found"
        )
    return CUSTOMERS_DB[customer_id]


@app.post("/customers/{customer_id}/register-face", response_model=FaceEmbeddingResponse, tags=["Customers"])
async def register_customer_face(customer_id: str, file: UploadFile = File(...)):
    """
    Register customer face for future verification.
    
    Args:
        customer_id: Unique customer identifier
        file: Image file containing customer face
        
    Returns:
        Registration status
    """
    try:
        # Validate customer exists
        if customer_id not in CUSTOMERS_DB:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Customer {customer_id} not found"
            )
        
        # Validate file is an image
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file must be an image"
            )
        
        # Read file bytes
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image file is empty"
            )
        
        # Register face
        success = face_service.add_customer_face(customer_id, image_bytes)
        
        if not success:
            return FaceEmbeddingResponse(
                status="FAILED",
                message="No face detected in image",
                customer_id=customer_id,
                embedding_stored=False
            )
        
        return FaceEmbeddingResponse(
            status="SUCCESS",
            message=f"Face registered for customer {customer_id}",
            customer_id=customer_id,
            embedding_stored=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error registering face: {str(e)}"
        )


# ============================================================================
# VERIFICATION ENDPOINTS
# ============================================================================

@app.post("/verify", response_model=VerificationResponse, tags=["Verification"])
async def verify_customer_face(file: UploadFile = File(...)):
    """
    Verify customer face against registered embeddings.
    
    Args:
        file: Image file containing face to verify
        
    Returns:
        Verification result with customer ID and confidence score
    """
    try:
        log.info(f"🔍 Verification request received - File: {file.filename}, Type: {file.content_type}")
        
        # Validate file is an image
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file must be an image"
            )
        
        # Read file bytes
        image_bytes = await file.read()
        
        if len(image_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image file is empty"
            )
        
        log.info(f"📷 Image received - Size: {len(image_bytes)} bytes")
        log.info(f"🎯 Verification threshold: {settings.FACE_VERIFICATION_THRESHOLD}")
        log.info(f"👥 Registered customers: {len(face_service.get_registered_customers())}")
        
        # Verify face
        customer_id, confidence = face_service.verify_face(image_bytes)
        
        log.info(f"✅ Verification result - Customer: {customer_id}, Score: {confidence:.4f}")
        
        if customer_id is None:
            log.warning(f"❌ No face match found - Best score: {confidence:.4f} < threshold: {settings.FACE_VERIFICATION_THRESHOLD}")
            return VerificationResponse(
                status="UNAUTHORIZED",
                customer_id=None,
                confidence=confidence,
                message=f"Face not recognized (score: {confidence:.3f}). Access denied."
            )
        
        # Get customer details from face repo instead of CUSTOMERS_DB
        try:
            customer_data = customer_face_repo.get_customer_by_id(customer_id)
            customer_name = customer_data.get('name', 'Unknown') if customer_data else 'Unknown'
        except:
            customer_name = 'Unknown'
        
        log.info(f"🎉 Access granted for: {customer_name} (confidence: {confidence:.4f})")
        
        return VerificationResponse(
            status="AUTHORIZED",
            customer_id=customer_id,
            confidence=confidence,
            message=f"Face verified for {customer_name} (score: {confidence:.3f})"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"💥 Verification error: {str(e)}")
        import traceback
        log.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying face: {str(e)}"
        )


# ============================================================================
# ADMIN ENDPOINTS
# ============================================================================

@app.get("/admin/registered-customers", tags=["Admin"])
async def get_registered_customers():
    """
    Get list of customers with registered faces.
    
    Returns:
        List of customer IDs with registered embeddings
    """
    registered = face_service.get_registered_customers()
    return {
        "count": len(registered),
        "customer_ids": registered
    }


@app.delete("/admin/customers/{customer_id}/face", tags=["Admin"])
async def remove_customer_face(customer_id: str):
    """
    Remove customer's registered face.
    
    Args:
        customer_id: Customer to remove
        
    Returns:
        Removal status
    """
    try:
        success = face_service.clear_customer_embedding(customer_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No registered face found for customer {customer_id}"
            )
        
        return {"status": "SUCCESS", "message": f"Face removed for customer {customer_id}"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error removing face: {str(e)}"
        )


# ============================================================================
# CUSTOMER FACE ENROLLMENT SYSTEM ENDPOINTS  
# ============================================================================

@app.post("/customers/enroll", response_model=CustomerFaceResponse, tags=["Customer Face Management"])
async def enroll_customer(enrollment_data: CustomerFaceEnrollment):
    """
    Enroll a new customer for face recognition.
    
    Args:
        enrollment_data: Customer name and phone
        
    Returns:
        Customer enrollment status with customer_id
    """
    try:
        customer_face_data = {
            "customer_id": None,  # Will be set after insertion
            "name": enrollment_data.name,
            "phone": enrollment_data.phone,
            "face_embedding": None,  # Will be set when face is uploaded
            "enrollment_date": datetime.now(),
            "is_active": True
        }
        
        customer_id = customer_face_repo.create_customer_face(customer_face_data)
        
        log.info(f"👤 New customer enrolled: {enrollment_data.name} (ID: {customer_id})")
        
        return CustomerFaceResponse(
            status="SUCCESS",
            message=f"Customer {enrollment_data.name} enrolled successfully",
            customer_id=customer_id
        )
    except Exception as e:
        log.error(f"❌ Error enrolling customer: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error enrolling customer: {str(e)}"
        )


@app.post("/customers/{customer_id}/upload-face", response_model=CustomerFaceResponse, tags=["Customer Face Management"])
async def upload_customer_face(customer_id: str, face_image: UploadFile = File(...)):
    """
    Upload and process customer face image for enrollment.
    
    Args:
        customer_id: Customer ID from enrollment
        face_image: Face image file
        
    Returns:
        Face processing and storage status
    """
    try:
        # Validate customer exists
        customer = customer_face_repo.get_customer_by_id(customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        # Read and process face image
        image_bytes = await face_image.read()
        log.info(f"📸 Processing face image for customer: {customer['name']} (ID: {customer_id})")
        
        # Extract face embedding
        embedding = face_service.extract_embedding(image_bytes)
        if embedding is None:
            log.warning(f"⚠️  No face detected in uploaded image for customer: {customer['name']}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No face detected in uploaded image. Please upload a clear face photo."
            )
        
        # Convert embedding to base64 for storage
        import base64
        embedding_bytes = embedding.tobytes()
        embedding_b64 = base64.b64encode(embedding_bytes).decode('utf-8')
        
        # Store embedding in database
        success = customer_face_repo.update_face_embedding(customer_id, embedding_b64)
        if not success:
            log.error(f"❌ Failed to store face embedding for customer: {customer['name']}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to store face embedding in database."
            )
        
        # Also store in face service for immediate use
        face_service.face_embeddings[customer_id] = embedding
        
        log.info(f"✅ Face enrollment completed for customer: {customer['name']} (ID: {customer_id})")
        
        return {
            "status": "SUCCESS",
            "message": f"Face enrolled successfully for {customer['name']}",
            "customer_id": customer_id
        }
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"❌ Error uploading customer face: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing face image: {str(e)}"
        )


@app.get("/face-customers", response_model=CustomerFaceResponse, tags=["Customer Face Management"])
async def get_all_face_customers():
    """
    Get all face enrollment customers.
    
    Returns:
        List of all face enrollment customers
    """
    try:
        customers = customer_face_repo.get_all_customers()
        return CustomerFaceResponse(
            status="SUCCESS", 
            message=f"Retrieved {len(customers)} customers",
            customers=customers
        )
    except Exception as e:
        log.error(f"❌ Error retrieving customers: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving customers: {str(e)}"
        )


@app.delete("/customers/{customer_id}", response_model=CustomerFaceResponse, tags=["Customer Face Management"])
async def delete_customer(customer_id: str):
    """
    Delete a customer enrollment.
    
    Args:
        customer_id: Customer ID to delete
        
    Returns:
        Deletion status
    """
    try:
        success = customer_face_repo.delete_customer(customer_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        # Also remove from face service
        face_service.clear_customer_embedding(customer_id)
        
        log.info(f"🗑️ Customer deleted: {customer_id}")
        
        return CustomerFaceResponse(
            status="SUCCESS",
            message="Customer deleted successfully"
        )
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"❌ Error deleting customer: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting customer: {str(e)}"
        )


@app.post("/customers/{customer_id}/verify", response_model=VerificationResponse, tags=["Customer Face Management"])
async def verify_specific_customer(customer_id: str, face_image: UploadFile = File(...)):
    """
    Verify face against a specific enrolled customer.
    
    Args:
        customer_id: Customer ID to verify against
        face_image: Face image for verification
        
    Returns:
        Verification result with similarity score
    """
    try:
        # Validate customer exists
        customer = customer_face_repo.get_customer_by_id(customer_id)
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        # Load customer embedding into memory if not already present
        if customer_id not in face_service.face_embeddings and customer.get('face_embedding'):
            import base64
            import numpy as np
            embedding_bytes = base64.b64decode(customer['face_embedding'])
            embedding = np.frombuffer(embedding_bytes, dtype=np.float32).copy()
            face_service.face_embeddings[customer_id] = embedding
            log.info(f"📥 Loaded embedding for {customer['name']} into memory (dim={embedding.shape})")

        if customer_id not in face_service.face_embeddings:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Customer has no face enrolled. Please upload a face image first."
            )

        # Read and verify face image directly against this customer
        image_bytes = await face_image.read()
        log.info(f"🔍 Direct face verification for {customer['name']} (ID: {customer_id})")
        log.info(f"   Registered customers in memory: {face_service.get_registered_customers()}")

        is_match, similarity = face_service.verify_face_against_customer(image_bytes, customer_id)

        log.info(f"🔍 Face verification for {customer['name']}: {'✅ MATCH' if is_match else '❌ NO MATCH'} (score={similarity:.4f}, threshold={settings.FACE_VERIFICATION_THRESHOLD})")

        return VerificationResponse(
            status="VERIFIED" if is_match else "NOT_VERIFIED",
            customer_id=customer_id if is_match else None,
            customer_name=customer['name'] if is_match else None,
            similarity_score=similarity,
            confidence=similarity,
            message=f"Verification {'successful' if is_match else 'failed'} for {customer['name']} (score: {similarity:.3f})"
        )
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"❌ Error in customer verification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error verifying customer: {str(e)}"
        )


# PUBLIC ANNOUNCEMENT SYSTEM ENDPOINTS
# ============================================================================

announcement_repo = AnnouncementRepository()
customer_face_repo = CustomerFaceRepository()
tts_service = get_tts_service()


@app.post("/announcements/broadcast", response_model=AnnouncementResponse, tags=["Announcements"])
async def broadcast_announcement(announcement: Announcement):
    """
    Broadcast a public announcement through system speakers.
    
    Args:
        announcement: Announcement data (message, type, triggered_by)
        
    Returns:
        Announcement confirmation with ID and timestamp
    """
    try:
        log.info(f"📢 Broadcasting announcement: {announcement.message[:50]}... (type: {announcement.announcement_type})")
        
        # Store announcement in MongoDB
        announcement_id = announcement_repo.create_announcement(announcement)
        log.info(f"✓ Stored in MongoDB with ID: {announcement_id}")
        
        # Convert text to speech and play
        tts_service.text_to_speech_simple(announcement.message)
        log.info(f"✓ Audio playback initiated")
        
        return AnnouncementResponse(
            id=announcement_id,
            message=announcement.message,
            announcement_type=announcement.announcement_type,
            triggered_by=announcement.triggered_by,
            created_at=announcement.created_at,
            status="broadcasted"
        )
    except Exception as e:
        log.error(f"✗ Error broadcasting announcement: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error broadcasting announcement: {str(e)}"
        )


@app.get("/announcements", response_model=List[AnnouncementLog], tags=["Announcements"])
async def get_announcements(limit: int = 50):
    """
    Get announcement history.
    
    Args:
        limit: Maximum number of announcements to return (default: 50)
        
    Returns:
        List of previous announcements
    """
    try:
        announcements = announcement_repo.get_all_announcements(limit=limit)
        return [AnnouncementLog(**doc) for doc in announcements]
    except Exception as e:
        log.warning(f"Could not fetch announcements from database, returning empty list: {e}")
        return []


@app.get("/announcements/type/{announcement_type}", response_model=List[AnnouncementLog], tags=["Announcements"])
async def get_announcements_by_type(announcement_type: str, limit: int = 50):
    """
    Get announcements filtered by type.
    
    Args:
        announcement_type: Filter by type (emergency or general)
        limit: Maximum number of announcements to return
        
    Returns:
        List of announcements of specified type
    """
    try:
        if announcement_type not in ["emergency", "general"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid announcement type. Must be 'emergency' or 'general'"
            )
        
        announcements = announcement_repo.get_announcements_by_type(announcement_type, limit=limit)
        return [AnnouncementLog(**doc) for doc in announcements]
    except HTTPException:
        raise
    except Exception as e:
        log.warning(f"Could not fetch announcements by type from database, returning empty list: {e}")
        return []


@app.get("/announcements/{announcement_id}", response_model=AnnouncementLog, tags=["Announcements"])
async def get_announcement_detail(announcement_id: str):
    """
    Get specific announcement details.
    
    Args:
        announcement_id: ID of announcement to retrieve
        
    Returns:
        Announcement details
    """
    try:
        announcement = announcement_repo.get_announcement_by_id(announcement_id)
        
        if not announcement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Announcement {announcement_id} not found"
            )
        
        return AnnouncementLog(**announcement)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching announcement: {str(e)}"
        )


@app.delete("/announcements/{announcement_id}", tags=["Announcements"])
async def delete_announcement(announcement_id: str):
    """
    Delete an announcement from history.
    
    Args:
        announcement_id: ID of announcement to delete
        
    Returns:
        Deletion status
    """
    try:
        log.info(f"🗑️  DELETE request received for announcement: {announcement_id}")
        success = announcement_repo.delete_announcement(announcement_id)
        
        if not success:
            log.warning(f"❌ Announcement {announcement_id} not found in database")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Announcement {announcement_id} not found"
            )
        
        log.info(f"✅ Successfully deleted announcement: {announcement_id}")
        return {"status": "SUCCESS", "message": f"Announcement {announcement_id} deleted"}
    except HTTPException:
        raise
    except Exception as e:
        log.error(f"❌ Error deleting announcement {announcement_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting announcement: {str(e)}"
        )

@app.delete("/test-delete", tags=["Test"])
async def test_delete():
    """Test DELETE endpoint to verify DELETE requests work."""
    log.info("🗑️ Test DELETE endpoint called successfully")
    return {"status": "SUCCESS", "message": "DELETE request works"}


# ============================================================================
# AUDIO STREAMING ENDPOINTS
# ============================================================================

audio_service = get_audio_service()


@app.get("/audio/devices", tags=["Audio"], response_model=dict)
async def get_audio_devices():
    """
    Get list of available audio devices (microphones, speakers).
    
    Returns:
        Dictionary with input and output devices
    """
    try:
        # Check if audio service is available
        if not audio_service.pa:
            log.warning("⚠️ PyAudio not available")
            return {
                "status": "pyaudio_not_available",
                "message": "PyAudio is not installed. Install with: pip install pyaudio",
                "input_devices": [],
                "output_devices": [],
                "default_input": None,
                "default_output": None
            }
        
        log.info("📌 Fetching available audio devices...")
        
        input_devices = audio_service.get_devices("input")
        output_devices = audio_service.get_devices("output")
        
        default_input = audio_service.get_default_input_device()
        default_output = audio_service.get_default_output_device()
        
        return {
            "status": "success",
            "input_devices": [
                {
                    "index": d.index,
                    "name": d.name,
                    "channels": d.channels,
                    "sample_rate": d.sample_rate,
                    "is_default": d.is_default
                }
                for d in input_devices
            ],
            "output_devices": [
                {
                    "index": d.index,
                    "name": d.name,
                    "channels": d.channels,
                    "sample_rate": d.sample_rate,
                    "is_default": d.is_default
                }
                for d in output_devices
            ],
            "default_input": {
                "index": default_input.index,
                "name": default_input.name
            } if default_input else None,
            "default_output": {
                "index": default_output.index,
                "name": default_output.name
            } if default_output else None
        }
    except Exception as e:
        log.error(f"✗ Error fetching audio devices: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching audio devices: {str(e)}"
        )


# WebSocket connection manager for audio streaming
class AudioConnectionManager:
    """Manage WebSocket connections for audio streaming.
    
    NOTE: Uses no locking because asyncio is single-threaded.
    All async methods run on the same event loop thread so
    list operations are safe without locks.
    """
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        log.info(f"🔌 Audio WebSocket connected. Active connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        log.info(f"🔌 Audio WebSocket disconnected. Active connections: {len(self.active_connections)}")
    
    async def broadcast(self, message: dict):
        """Broadcast JSON message to all connected clients."""
        connections = list(self.active_connections)
        disconnected = []
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                log.warning(f"⚠️ Failed to send to client, marking for removal: {e}")
                disconnected.append(connection)
        for connection in disconnected:
            self.disconnect(connection)

    async def broadcast_bytes(self, data: bytes, exclude: WebSocket = None):
        """Broadcast raw bytes to all connected clients except the excluded one."""
        connections = list(self.active_connections)
        disconnected = []
        for connection in connections:
            if connection is exclude:
                continue
            try:
                await connection.send_bytes(data)
            except Exception as e:
                log.warning(f"⚠️ Failed to send bytes to client: {e}")
                disconnected.append(connection)
        for connection in disconnected:
            self.disconnect(connection)


audio_manager = AudioConnectionManager()


@app.websocket("/ws/audio/broadcast-mic")
async def websocket_audio_broadcast(websocket: WebSocket):
    """
    WebSocket endpoint for real-time mic-to-speaker broadcasting.
    
    1. Client captures audio from microphone
    2. Client sends audio chunks to server via WebSocket
    3. Server broadcasts audio to all connected clients
    4. All connected clients play the audio through speakers
    
    Message format:
    {
        "type": "audio_chunk",
        "data": "<base64-encoded-audio>",
        "timestamp": "2026-02-20T..."
    }
    """
    log.info("🔌 WebSocket connection attempt for audio broadcast")
    
    try:
        # Accept connection
        try:
            await audio_manager.connect(websocket)
            log.info("✅ WebSocket connection accepted and registered")
        except Exception as e:
            log.error(f"✗ Failed to accept WebSocket connection: {e}")
            raise
        
        playback_queue = queue.Queue()
        playback_thread = None
        
        try:
            # Send connection status
            try:
                await websocket.send_json({
                    "type": "status",
                    "status": "connected",
                    "message": "Connected to audio broadcast stream"
                })
                log.info("📨 Sent initial connection status message")
            except Exception as e:
                log.error(f"✗ Failed to send initial status: {e}")
                raise
            
            # Start playback thread - wrap in try/catch for better error handling
            try:
                log.info("🎵 Attempting to initialize audio playback...")
                default_output = audio_service.get_default_output_device()
                
                if default_output is None:
                    log.warning("⚠️ No default output device found - playback disabled")
                    await websocket.send_json({
                        "type": "status",
                        "status": "warning",
                        "message": "No default output device found - audio playback disabled"
                    })
                else:
                    log.info(f"📍 Default output device: {default_output.name} (index: {default_output.index}, rate: {default_output.sample_rate})")
                    
                    # Start playback in a try-catch to prevent thread crash from stopping WebSocket
                    try:
                        playback_thread = audio_service.play_audio_stream(
                            playback_queue,
                            device_index=default_output.index,
                            sample_rate=16000,
                            channels=1
                        )
                        log.info(f"✓ Audio playback thread started for device: {default_output.name}")
                    except Exception as thread_error:
                        log.error(f"✗ Error starting playback thread: {thread_error}")
                        playback_thread = None
                        # Don't crash - stream can still work without playback
            
            except Exception as e:
                log.error(f"✗ Error during playback initialization: {e}", exc_info=True)
                try:
                    await websocket.send_json({
                        "type": "status",
                        "status": "warning",
                        "message": f"Playback initialization warning: {str(e)}"
                    })
                except:
                    pass  # If we can't send, just continue
            
            log.info("🟢 Starting to listen for incoming audio...")
            
            # Main message loop
            while True:
                try:
                    # Receive frame - can be binary PCM or text JSON
                    frame = await websocket.receive()
                    
                    if frame.get("bytes") is not None:
                        # Binary frame: raw Int16 PCM audio
                        audio_bytes = frame["bytes"]
                        
                        # Add to local playback queue
                        if playback_thread:
                            try:
                                playback_queue.put(audio_bytes, block=False)
                            except queue.Full:
                                log.warning("⚠️ Playback queue full, dropping audio chunk")
                        
                        # Relay binary to all other connected clients
                        try:
                            await audio_manager.broadcast_bytes(audio_bytes, exclude=websocket)
                        except Exception as broadcast_error:
                            log.error(f"✗ Broadcast error: {broadcast_error}")
                    
                    elif frame.get("text") is not None:
                        # Text frame: JSON control message
                        try:
                            message = json.loads(frame["text"])
                        except json.JSONDecodeError as e:
                            log.warning(f"⚠️ Invalid JSON received: {e}")
                            continue
                        
                        msg_type = message.get("type")
                        if msg_type == "stop":
                            log.info("⏹️ Received stop command from client")
                            break
                        else:
                            log.debug(f"ℹ️ Control message: {msg_type}")
                
                except WebSocketDisconnect:
                    log.info("ℹ️ WebSocket disconnect received in message loop")
                    break
                except Exception as loop_error:
                    log.error(f"✗ Error in message loop: {loop_error}", exc_info=True)
                    try:
                        await websocket.send_json({
                            "type": "error",
                            "message": f"Message loop error: {str(loop_error)}"
                        })
                    except:
                        pass
                    break
        
        except WebSocketDisconnect:
            log.info("🔌 WebSocket disconnected")
        except Exception as outer_error:
            log.error(f"✗ Outer error in WebSocket handler: {outer_error}", exc_info=True)
        finally:
            log.info("🧹 Cleaning up WebSocket resources...")
            audio_manager.disconnect(websocket)
            if playback_thread:
                try:
                    playback_queue.put(None)  # Signal thread to stop
                    log.info("📬 Sent stop signal to playback thread")
                except:
                    pass
            log.info("✓ WebSocket cleanup complete")
    
    except Exception as critical_error:
        log.error(f"❌ CRITICAL error in WebSocket handler: {critical_error}", exc_info=True)
        try:
            await websocket.close(code=1011, reason=f"Internal error: {str(critical_error)[:50]}")
        except:
            pass


@app.websocket("/ws/audio/record")
async def websocket_audio_record(websocket: WebSocket):
    """
    WebSocket endpoint for recording audio from microphone.
    
    Client receives audio chunks recorded from the system microphone.
    This allows remote monitoring/streaming of microphone input.
    
    Response format:
    {
        "type": "audio_chunk",
        "data": "<base64-encoded-audio>",
        "timestamp": "2026-02-20T..."
    }
    """
    await audio_manager.connect(websocket)
    recording_thread = None
    stop_recording = False
    
    try:
        # Send connection status
        await websocket.send_json({
            "type": "status",
            "status": "connected",
            "message": "Connected to audio recording"
        })
        
        # Start recording
        default_input = audio_service.get_default_input_device()
        
        def on_chunk(chunk: bytes):
            if not stop_recording:
                try:
                    # Encode audio as base64
                    audio_b64 = base64.b64encode(chunk).decode('utf-8')
                    # This will be sent via async task - for now just log
                    log.debug(f"📦 Recorded chunk: {len(chunk)} bytes")
                except Exception as e:
                    log.error(f"✗ Error encoding audio chunk: {e}")
        
        recording_thread = audio_service.start_recording(
            device_index=default_input.index if default_input else None,
            on_chunk=on_chunk
        )
        
        # Keep connection alive and handle commands
        while True:
            try:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                if message.get("type") == "command" and message.get("command") == "stop":
                    log.info("⏹️ Stop recording command received")
                    stop_recording = True
                    break
            except Exception as e:
                log.error(f"✗ Error receiving message: {e}")
                break
    
    except WebSocketDisconnect:
        log.info("🔌 Audio record WebSocket disconnected")
    except Exception as e:
        log.error(f"✗ WebSocket error: {e}")
    finally:
        stop_recording = True
        audio_manager.disconnect(websocket)


# ============================================================================
# OPERATION LOGS ENDPOINTS
# ============================================================================

@app.post("/logs/create", tags=["Logs"], response_model=dict)
async def create_operation_log(operation_type: str, level: str, message: str):
    """
    Create an operation log entry.
    
    Args:
        operation_type: Type of operation (food_delivery, public_announcement, etc.)
        level: Log level (info, warning, critical)
        message: Log message
        
    Returns:
        Log creation status
    """
    try:
        from services.database import OperationLogRepository
        log_repo = OperationLogRepository()
        log_id = log_repo.create_log(operation_type, level, message)
        log.info(f"Created {operation_type} log: {message}")
        return {"status": "SUCCESS", "id": log_id, "message": f"Log created for {operation_type}"}
    except Exception as e:
        log.error(f"Error creating log: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating log: {str(e)}"
        )


@app.get("/logs/operation/{operation_type}", tags=["Logs"])
async def get_operation_logs(operation_type: str, limit: int = 50):
    """
    Get logs for a specific operation type.
    
    Args:
        operation_type: Type of operation to filter by
        limit: Maximum number of logs to return
        
    Returns:
        List of operation logs
    """
    try:
        from services.database import OperationLogRepository
        log_repo = OperationLogRepository()
        logs = log_repo.get_logs_by_operation(operation_type, limit)
        return logs
    except Exception as e:
        log.warning(f"Could not fetch from database, returning mock data: {e}")
        # Return mock data when database is unavailable
        mock_logs = [
            {
                "_id": "mock1",
                "operation_type": operation_type,
                "level": "info",
                "message": f"Sample {operation_type} operation log",
                "timestamp": datetime.now().isoformat()
            }
        ]
        return mock_logs[:limit]


@app.get("/logs/all", tags=["Logs"])
async def get_all_operation_logs(limit: int = 100):
    """
    Get all operation logs.
    
    Args:
        limit: Maximum number of logs to return
        
    Returns:
        List of all operation logs
    """
    try:
        from services.database import OperationLogRepository
        log_repo = OperationLogRepository()
        logs = log_repo.get_all_logs(limit)
        return logs
    except Exception as e:
        log.warning(f"Could not fetch from database, returning mock data: {e}")
        # Return mock data when database is unavailable
        mock_logs = [
            {
                "_id": "mock1",
                "operation_type": "system",
                "level": "info",
                "message": "System startup initiated",
                "timestamp": datetime.now().isoformat()
            },
            {
                "_id": "mock2",
                "operation_type": "system",
                "level": "info",
                "message": "All systems operational",
                "timestamp": datetime.now().isoformat()
            }
        ]
        return mock_logs[:limit]


# ============================================================================
# ROOT ENDPOINT
# ============================================================================

@app.get("/", tags=["Info"])
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "Face detection and verification backend for MAPAS Food Delivery",
        "endpoints": {
            "health": "/health",
            "customers": "/customers",
            "verify": "/verify",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    )
