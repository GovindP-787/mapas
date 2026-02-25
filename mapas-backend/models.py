from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class Customer(BaseModel):
    """Customer data model."""
    id: str
    name: str
    phone: str
    address: str
    order_id: str
    order_contents: str
    drop_coordinates: str
    status: str = Field(default="pending", description="pending, in-transit, delivered")
    created_at: datetime = Field(default_factory=datetime.now)


class CustomerFace(BaseModel):
    """Customer face enrollment data."""
    id: Optional[str] = None
    customer_id: str
    name: str
    phone: Optional[str] = None
    face_embedding: Optional[str] = None  # Base64 encoded embedding
    enrollment_date: datetime = Field(default_factory=datetime.now)
    is_active: bool = True


class CustomerFaceEnrollment(BaseModel):
    """Request model for customer face enrollment."""
    name: str
    phone: Optional[str] = None


class CustomerFaceResponse(BaseModel):
    """Response for customer face operations."""
    status: str
    message: str
    customer_id: Optional[str] = None
    customers: Optional[list] = None


class FaceEmbeddingResponse(BaseModel):
    """Response for face embedding extraction."""
    status: str
    message: str
    customer_id: Optional[str] = None
    embedding_stored: bool = False


class VerificationResponse(BaseModel):
    """Response for face verification."""
    status: str
    customer_id: Optional[str] = None
    customer_name: Optional[str] = None
    similarity_score: Optional[float] = None
    message: Optional[str] = None
    confidence: float = 0.0
    message: str


class CustomerRegistration(BaseModel):
    """Customer registration data."""
    customer_id: str
    name: str
    phone: str
    address: str


class ErrorResponse(BaseModel):
    """Standard error response."""
    status: str = "ERROR"
    message: str
    error_code: Optional[str] = None


# Public Announcement System Models
class Announcement(BaseModel):
    """Announcement data model."""
    message: str = Field(..., min_length=1, max_length=500, description="Announcement message")
    announcement_type: str = Field(default="general", description="emergency or general")
    triggered_by: str = Field(default="operator", description="operator or automated")
    created_at: datetime = Field(default_factory=datetime.now)


class AnnouncementResponse(BaseModel):
    """Response for announcement creation."""
    id: Optional[str] = None
    message: str
    announcement_type: str
    triggered_by: str
    created_at: datetime
    status: str = "success"


class AnnouncementLog(BaseModel):
    """Announcement log entry."""
    id: Optional[str] = None
    message: str
    announcement_type: str
    triggered_by: str
    created_at: datetime
    audio_file: Optional[str] = None

class OperationLog(BaseModel):
    """Operation log entry for different systems."""
    operation_type: str = Field(..., description="food_delivery, public_announcement, face_verification, etc.")
    level: str = Field(default="info", description="info, warning, critical")
    message: str = Field(..., max_length=500)
    timestamp: datetime = Field(default_factory=datetime.now)


class OperationLogResponse(BaseModel):
    """Response for operation log creation."""
    id: Optional[str] = None
    operation_type: str
    level: str
    message: str
    timestamp: datetime
    status: str = "success"


# Real-time Audio Streaming Models
class AudioDevice(BaseModel):
    """Audio device information."""
    index: int
    name: str
    device_type: str  # "input", "output", or "both"
    channels: int
    sample_rate: int
    is_default: bool = False


class AudioStreamMessage(BaseModel):
    """Message for WebSocket audio streaming."""
    type: str  # "audio_chunk", "command", "status"
    data: Optional[str] = None  # Base64 encoded audio data
    timestamp: datetime = Field(default_factory=datetime.now)


class AudioStreamStatus(BaseModel):
    """Status of audio stream."""
    status: str  # "connected", "recording", "playing", "error"
    message: str
    device_info: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.now)