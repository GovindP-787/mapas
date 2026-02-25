import numpy as np
import cv2
from typing import Optional, Dict, Tuple, List
from config import settings
from utils import decode_image_bytes, compute_cosine_similarity

# Try importing InsightFace, fallback to None if not available
try:
    import insightface
    import onnxruntime
    INSIGHTFACE_AVAILABLE = True
    print("[FaceService] InsightFace imported successfully!")
except ImportError as e:
    insightface = None
    onnxruntime = None
    INSIGHTFACE_AVAILABLE = False
    print(f"[FaceService] InsightFace not available: {e}")
    print("[FaceService] Will use OpenCV Haar Cascade instead")


class FaceService:
    """
    Service for face detection and verification using InsightFace.
    Uses ArcFace model for high-accuracy face recognition and embeddings.
    """
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        """Singleton pattern - initialize model only once."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        """Initialize the face detection model."""
        if FaceService._initialized:
            return
            
        self.model = None
        self.face_embeddings: Dict[str, np.ndarray] = {}
        self._load_model()
        FaceService._initialized = True
    
    def _load_model(self) -> None:
        """Load InsightFace ArcFace model or fallback to OpenCV."""
        try:
            print("[FaceService] Initializing face detection service...")
            
            # Try InsightFace first if available
            if INSIGHTFACE_AVAILABLE:
                print("[FaceService] Attempting to load InsightFace...")
                
                # Initialize InsightFace app
                self.model = insightface.app.FaceAnalysis(
                    providers=['CPUExecutionProvider']  # Use CPU for compatibility
                )
                
                # Prepare the model
                self.model.prepare(ctx_id=0, det_size=(640, 640))
                
                print("[FaceService] ✓ InsightFace initialized successfully!")
                print("[FaceService] Using ArcFace model for high-accuracy face recognition")
                return
            
            else:
                print("[FaceService] InsightFace not available, using OpenCV fallback")
                self._load_opencv_fallback()
                
        except Exception as e:
            print(f"[FaceService] Error loading InsightFace: {str(e)}")
            print("[FaceService] Falling back to OpenCV Haar Cascade...")
            
            # Fallback to OpenCV
            self._load_opencv_fallback()
    
    def _load_opencv_fallback(self) -> None:
        """Fallback to OpenCV Haar Cascade if InsightFace fails."""
        try:
            cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            self.face_cascade = cv2.CascadeClassifier(cascade_path)
            
            if self.face_cascade.empty():
                raise Exception("Failed to load Haar Cascade classifier")
            
            self.model = None  # Mark as fallback mode
            print("[FaceService] ✓ OpenCV Haar Cascade loaded successfully")
            
        except Exception as e:
            print(f"[FaceService] Error loading fallback model: {str(e)}")
            raise RuntimeError(f"Failed to load any face model: {str(e)}")
    
    def _detect_faces_insightface(self, image: np.ndarray) -> List[Dict]:
        """Detect faces using InsightFace with face analysis."""
        try:
            # InsightFace expects RGB format
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Get face analysis results
            faces = self.model.get(rgb_image)
            
            print(f"[FaceService] InsightFace detected {len(faces)} faces")
            
            return faces
            
        except Exception as e:
            print(f"[FaceService] InsightFace detection error: {str(e)}")
            return []
    
    def _detect_faces_opencv(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """Fallback face detection using OpenCV Haar Cascade."""
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        gray = cv2.equalizeHist(gray)
        
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        
        print(f"[FaceService] OpenCV detected {len(faces)} faces")
        return faces
    def extract_embedding(self, image_bytes: bytes) -> Optional[np.ndarray]:
        """
        Extract face embedding from image bytes using InsightFace.
        
        Args:
            image_bytes: Raw image data
            
        Returns:
            Face embedding (512-dim vector) or None if no face detected
        """
        try:
            # Decode image
            image = decode_image_bytes(image_bytes)
            if image is None:
                print("[FaceService] Failed to decode image bytes")
                return None
            
            print(f"[FaceService] Image decoded successfully: {image.shape}")
            
            # Use InsightFace if available
            if self.model is not None:
                faces = self._detect_faces_insightface(image)
                
                if len(faces) == 0:
                    print("[FaceService] No faces detected with InsightFace")
                    return None
                
                # Get the face with highest detection confidence
                best_face = max(faces, key=lambda f: f.det_score)
                
                # Extract high-quality 512-dimensional embedding
                embedding = best_face.embedding
                
                # Normalize embedding
                embedding = embedding / np.linalg.norm(embedding)
                
                print(f"[FaceService] InsightFace embedding extracted (dim={len(embedding)}, score={best_face.det_score:.3f})")
                return embedding
            
            else:
                # Fallback to OpenCV method
                faces = self._detect_faces_opencv(image)
                
                if len(faces) == 0:
                    print("[FaceService] No faces detected with OpenCV")
                    return None
                
                # Extract embedding from largest face using histogram method
                largest_face = max(faces, key=lambda f: f[2] * f[3])
                embedding = self._extract_face_embedding_opencv(image, largest_face)
                
                print(f"[FaceService] OpenCV embedding extracted (dim={len(embedding)})")
                return embedding
            
        except Exception as e:
            print(f"[FaceService] Error extracting embedding: {str(e)}")
            import traceback
            traceback.print_exc()
            return None
    
    def _extract_face_embedding_opencv(self, image: np.ndarray, face_rect: Tuple) -> np.ndarray:
        """
        Fallback embedding extraction using OpenCV histogram method.
        
        Args:
            image: BGR image array
            face_rect: (x, y, w, h) tuple
            
        Returns:
            512-dimensional embedding vector
        """
        x, y, w, h = face_rect
        face_roi = image[y:y+h, x:x+w]
        face_roi = cv2.resize(face_roi, (100, 100))
        
        # Create embedding using RGB histogram (simple approach)
        embedding = []
        for i in range(3):  # B, G, R channels
            hist = cv2.calcHist([face_roi], [i], None, [64], [0, 256])
            hist = cv2.normalize(hist, hist).flatten()
            embedding.extend(hist)
        
        # Pad to 512 dimensions
        embedding = np.array(embedding, dtype=np.float32)
        if len(embedding) < 512:
            embedding = np.pad(embedding, (0, 512 - len(embedding)), mode='constant')
        else:
            embedding = embedding[:512]
        
        # Normalize to unit length
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        
        return embedding
    
    def add_customer_face(self, customer_id: str, image_bytes: bytes) -> bool:
        """
        Register a customer's face.
        
        Args:
            customer_id: Unique customer identifier
            image_bytes: Raw image data
            
        Returns:
            True if successful, False otherwise
        """
        try:
            embedding = self.extract_embedding(image_bytes)
            
            if embedding is None:
                return False
            
            self.face_embeddings[customer_id] = embedding
            print(f"[FaceService] Registered face for customer {customer_id}")
            return True
            
        except Exception as e:
            print(f"[FaceService] Error adding customer face: {str(e)}")
            return False
    
    def verify_face(
        self,
        image_bytes: bytes,
        threshold: Optional[float] = None
    ) -> Tuple[Optional[str], float]:
        """
        Verify face against registered customer embeddings.
        
        Args:
            image_bytes: Raw image data to verify
            threshold: Verification threshold (default from settings)
            
        Returns:
            Tuple of (customer_id, confidence_score)
            Returns (None, 0.0) if no match found
        """
        try:
            if threshold is None:
                threshold = settings.FACE_VERIFICATION_THRESHOLD
            
            # Extract embedding
            embedding = self.extract_embedding(image_bytes)
            
            if embedding is None:
                return None, 0.0
            
            # Find best match
            best_match_id = None
            best_similarity = 0.0
            
            for customer_id, stored_embedding in self.face_embeddings.items():
                similarity = compute_cosine_similarity(embedding, stored_embedding)
                
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_match_id = customer_id
            
            # Return match if above threshold
            if best_similarity >= threshold:
                print(f"[FaceService] Match: {best_match_id} (score={best_similarity:.4f})")
                return best_match_id, best_similarity
            
            return None, best_similarity
            
        except Exception as e:
            print(f"[FaceService] Error verifying face: {str(e)}")
            return None, 0.0
    
    def get_registered_customers(self) -> List[str]:
        """
        Get list of registered customers.
        
        Returns:
            List of customer IDs with registered faces
        """
        return list(self.face_embeddings.keys())
    
    def clear_customer_embedding(self, customer_id: str) -> bool:
        """
        Remove a customer's registered face.
        
        Args:
            customer_id: Customer to remove
            
        Returns:
            True if removed, False if not found
        """
        if customer_id in self.face_embeddings:
            del self.face_embeddings[customer_id]
            print(f"[FaceService] Cleared face for customer {customer_id}")
            return True
        return False


# Singleton instance
face_service = FaceService()
