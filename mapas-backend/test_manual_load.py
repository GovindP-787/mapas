#!/usr/bin/env python3
"""
Manual test to load and verify face embeddings
"""
import sys
sys.path.append('.')

from services.database import CustomerFaceRepository
from services.face_service import face_service
import base64
import numpy as np

def test_manual_embedding_load():
    """Manually test loading embeddings from database"""
    print("=== MANUAL EMBEDDING LOAD TEST ===")
    
    try:
        # Initialize repository
        repo = CustomerFaceRepository()
        print("✓ Repository initialized")
        
        # Get all customers
        customers = repo.get_all_customers()
        print(f"✓ Found {len(customers)} customers in database")
        
        loaded_count = 0
        for customer in customers:
            print(f"\nCustomer: {customer.get('name', 'Unknown')} (ID: {customer.get('id', 'N/A')})")
            
            if customer.get('face_embedding'):
                print("  📸 Has face embedding in database")
                
                try:
                    # Decode base64 embedding back to numpy array
                    embedding_b64 = customer['face_embedding']
                    print(f"  📏 Embedding length (base64): {len(embedding_b64)} chars")
                    
                    embedding_bytes = base64.b64decode(embedding_b64)
                    print(f"  📏 Embedding bytes length: {len(embedding_bytes)} bytes")
                    
                    embedding = np.frombuffer(embedding_bytes, dtype=np.float32)
                    print(f"  🔢 Embedding array shape: {embedding.shape}")
                    
                    # Store in face service
                    face_service.face_embeddings[customer['id']] = embedding
                    loaded_count += 1
                    
                    print(f"  ✅ Successfully loaded embedding!")
                    
                except Exception as e:
                    print(f"  ❌ Failed to decode embedding: {str(e)}")
                    import traceback
                    traceback.print_exc()
            else:
                print("  ⚪ No face embedding in database")
        
        print(f"\n=== SUMMARY ===")
        print(f"Loaded embeddings: {loaded_count}")
        
        # Check face service
        in_memory_embeddings = face_service.get_registered_customers()
        print(f"In-memory embeddings: {len(in_memory_embeddings)}")
        
        return loaded_count > 0
        
    except Exception as e:
        print(f"❌ Error in manual load test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def test_verification_process():
    """Test the verification threshold and similarity calculation"""
    print(f"\n=== VERIFICATION SETTINGS TEST ===")
    
    from config import settings
    print(f"Verification threshold: {settings.FACE_VERIFICATION_THRESHOLD}")
    print(f"Detection threshold: {settings.FACE_DETECTION_THRESHOLD}")
    
    # Check if threshold is too high
    if settings.FACE_VERIFICATION_THRESHOLD > 0.6:
        print("⚠️  WARNING: Verification threshold might be too high!")
        print("   Consider lowering to 0.4-0.5 for better matching")
    elif settings.FACE_VERIFICATION_THRESHOLD < 0.3:
        print("⚠️  WARNING: Verification threshold might be too low!")
        print("   This could cause false positives")
    else:
        print("✅ Verification threshold looks reasonable")

if __name__ == "__main__":
    # Test loading embeddings
    success = test_manual_embedding_load()
    
    # Test verification settings
    test_verification_process()
    
    if success:
        print(f"\n🎯 RECOMMENDATION:")
        print("1. Restart the backend to reload embeddings")
        print("2. Test verification again") 
        print("3. Check browser console for any errors")
    else:
        print(f"\n🔧 TROUBLESHOOTING:")
        print("1. Make sure customer faces were properly uploaded")
        print("2. Check database connection")
        print("3. Verify embeddings are valid base64 data")