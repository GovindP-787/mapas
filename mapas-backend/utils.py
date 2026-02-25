import cv2
import numpy as np
from typing import Optional, Tuple
from scipy.spatial.distance import cosine


def decode_image_bytes(image_bytes: bytes) -> Optional[np.ndarray]:
    """
    Decode image bytes to OpenCV format (BGR).
    
    Args:
        image_bytes: Raw image bytes
        
    Returns:
        NumPy array in BGR format or None if decoding fails
    """
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return None
            
        return img
    except Exception as e:
        print(f"Error decoding image: {str(e)}")
        return None


def get_image_dimensions(image: np.ndarray) -> Tuple[int, int]:
    """
    Get image height and width.
    
    Args:
        image: NumPy array image
        
    Returns:
        Tuple of (height, width)
    """
    height, width = image.shape[:2]
    return height, width


def compute_cosine_similarity(embedding1: np.ndarray, embedding2: np.ndarray) -> float:
    """
    Compute cosine similarity between two embeddings.
    
    Args:
        embedding1: First face embedding
        embedding2: Second face embedding
        
    Returns:
        Similarity score (0-1, higher is more similar)
    """
    try:
        # Normalize embeddings
        emb1 = embedding1 / (np.linalg.norm(embedding1) + 1e-8)
        emb2 = embedding2 / (np.linalg.norm(embedding2) + 1e-8)
        
        # Compute cosine similarity
        similarity = 1 - cosine(emb1, emb2)
        return float(similarity)
    except Exception as e:
        print(f"Error computing similarity: {str(e)}")
        return 0.0


def resize_image(image: np.ndarray, max_dimension: int = 1280) -> np.ndarray:
    """
    Resize image if it exceeds max dimension (preserving aspect ratio).
    
    Args:
        image: Input image
        max_dimension: Maximum width or height
        
    Returns:
        Resized image
    """
    height, width = image.shape[:2]
    
    if max(height, width) > max_dimension:
        scale = max_dimension / max(height, width)
        new_width = int(width * scale)
        new_height = int(height * scale)
        image = cv2.resize(image, (new_width, new_height))
    
    return image
