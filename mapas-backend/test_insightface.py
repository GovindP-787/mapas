#!/usr/bin/env python3

print("=== InsightFace Installation Test ===")

try:
    import insightface
    print("✅ InsightFace imported successfully!")
    print(f"📦 Version: {insightface.__version__}")
    
    # Test model initialization
    print("🔄 Testing model initialization...")
    app = insightface.app.FaceAnalysis(providers=['CPUExecutionProvider'])
    app.prepare(ctx_id=0, det_size=(640, 640))
    print("✅ InsightFace model loaded successfully!")
    
except ImportError as e:
    print(f"❌ InsightFace not available: {e}")
    print("📥 Installation may still be in progress...")
    
except Exception as e:
    print(f"⚠️  InsightFace import works but model loading failed: {e}")
    print("🔧 This could be due to missing model files or ONNX issues")

print("\n=== Face Service Test ===")
try:
    from services.face_service import face_service
    print("✅ Face service initialized successfully!")
    print(f"🤖 Using model: {'InsightFace' if hasattr(face_service, 'model') and face_service.model else 'OpenCV Haar Cascade'}")
    
except Exception as e:
    print(f"❌ Face service failed: {e}")