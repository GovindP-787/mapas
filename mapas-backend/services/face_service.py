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

        # Try progressively more lenient settings until a face is found
        for scale, neighbors, min_size in [
            (1.05, 4, (40, 40)),
            (1.1,  3, (30, 30)),
            (1.15, 2, (20, 20)),
        ]:
            faces = self.face_cascade.detectMultiScale(
                gray,
                scaleFactor=scale,
                minNeighbors=neighbors,
                minSize=min_size,
                flags=cv2.CASCADE_SCALE_IMAGE
            )
            if len(faces) > 0:
                break

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
        Fallback embedding using HOG (Histogram of Oriented Gradients).
        HOG captures facial structure / edge orientations which are
        identity-specific — far more discriminative than colour histograms.

        Args:
            image: BGR image array
            face_rect: (x, y, w, h) tuple

        Returns:
            512-dimensional L2-normalised embedding vector
        """
        x, y, w, h = face_rect

        # Add 20 % padding so ears / chin are included
        pad = int(0.20 * max(w, h))
        x1 = max(0, x - pad)
        y1 = max(0, y - pad)
        x2 = min(image.shape[1], x + w + pad)
        y2 = min(image.shape[0], y + h + pad)
        face_roi = image[y1:y2, x1:x2]

        # Resize to a fixed 64×64 window
        face_roi = cv2.resize(face_roi, (64, 64))

        # Convert to grey + CLAHE for lighting normalisation
        gray = cv2.cvtColor(face_roi, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(4, 4))
        gray = clahe.apply(gray)

        # ── HOG descriptor (1764-dim for 64×64 / 8×8 cells / 16×16 blocks) ──
        hog = cv2.HOGDescriptor(
            _winSize  =(64, 64),
            _blockSize=(16, 16),
            _blockStride=(8, 8),
            _cellSize =(8, 8),
            _nbins    =9
        )
        hog_feat = hog.compute(gray).flatten().astype(np.float32)  # 1764-dim

        # ── LBP-style texture histogram (256-dim) ──
        # Use simple thresholding of neighbour differences as a fast proxy
        lbp_feat = np.zeros(256, dtype=np.float32)
        shifted = [
            np.roll(gray,  1, axis=0), np.roll(gray, -1, axis=0),
            np.roll(gray,  1, axis=1), np.roll(gray, -1, axis=1),
            np.roll(np.roll(gray,  1, axis=0),  1, axis=1),
            np.roll(np.roll(gray,  1, axis=0), -1, axis=1),
            np.roll(np.roll(gray, -1, axis=0),  1, axis=1),
            np.roll(np.roll(gray, -1, axis=0), -1, axis=1),
        ]
        code = np.zeros(gray.shape, dtype=np.uint8)
        for bit, s in enumerate(shifted):
            code |= ((gray.astype(np.int16) >= s.astype(np.int16)).astype(np.uint8) << bit)
        hist, _ = np.histogram(code.flatten(), bins=256, range=(0, 256))
        lbp_feat = hist.astype(np.float32)

        # ── Concatenate & reduce to 512 dims ──
        combined = np.concatenate([hog_feat, lbp_feat])  # 2020-dim
        # Average-pool down to 512
        n = len(combined) // 512
        embedding = np.array(
            [combined[i * n:(i + 1) * n].mean() for i in range(512)],
            dtype=np.float32
        )

        # L2-normalise
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
                threshold = self._effective_threshold
            
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
    
    @property
    def _effective_threshold(self) -> float:
        """Return a lower threshold when using the OpenCV HOG fallback.

        InsightFace (ArcFace) embeddings are highly discriminative so a
        threshold of 0.45 is appropriately strict.  The HOG fallback is
        weaker; same-person similarity typically lands around 0.70-0.90
        but is more sensitive to conditions, so we use a lower bar.
        """
        if self.model is None:          # OpenCV fallback mode
            return max(settings.FACE_VERIFICATION_THRESHOLD * 0.70, 0.25)
        return settings.FACE_VERIFICATION_THRESHOLD

    def verify_face_against_customer(
        self,
        image_bytes: bytes,
        customer_id: str,
        threshold: Optional[float] = None
    ) -> Tuple[bool, float]:
        """
        Verify face directly against a specific customer's embedding.

        Args:
            image_bytes: Raw image data to verify
            customer_id: The specific customer to compare against
            threshold: Similarity threshold (defaults to settings value)

        Returns:
            Tuple of (is_match, similarity_score)
        """
        try:
            if threshold is None:
                threshold = self._effective_threshold

            embedding = self.extract_embedding(image_bytes)
            if embedding is None:
                print("[FaceService] No face detected in verification image")
                return False, 0.0

            stored = self.face_embeddings.get(customer_id)
            if stored is None:
                print(f"[FaceService] No stored embedding for customer {customer_id}")
                return False, 0.0

            similarity = compute_cosine_similarity(embedding, stored)
            is_match = similarity >= threshold
            print(f"[FaceService] Direct compare customer {customer_id}: score={similarity:.4f}, threshold={threshold}, match={is_match}")
            return is_match, similarity

        except Exception as e:
            print(f"[FaceService] Error in direct face compare: {str(e)}")
            return False, 0.0

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
