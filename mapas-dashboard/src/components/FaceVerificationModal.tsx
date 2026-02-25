'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, Camera, Check, X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface FaceVerificationModalProps {
  isOpen: boolean;
  customerId: string;
  customerName: string;
  onVerified: (customerId: string, confidence: number) => void;
  onClosed: () => void;
}

interface VerificationResult {
  status: 'AUTHORIZED' | 'UNAUTHORIZED' | 'ERROR';
  customer_id?: string;
  confidence: number;
  message: string;
}

const BACKEND_URL = 'http://localhost:8002';

export function FaceVerificationModal({
  isOpen,
  customerId,
  customerName,
  onVerified,
  onClosed,
}: FaceVerificationModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);

  // Check camera permissions on mount
  useEffect(() => {
    if (isOpen) {
      console.log('Modal opened - checking camera access');
      checkCameraAccess();
    }
  }, [isOpen]);

  const checkCameraAccess = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Camera API not supported', {
          description: 'Your browser does not support camera access',
        });
        return;
      }

      // Check if we have camera permissions
      const permissions = await navigator.permissions.query({ name: 'camera' as any });
      console.log('Camera permission status:', permissions.state);
    } catch (error) {
      console.error('Error checking camera:', error);
    }
  };

  const startCamera = async () => {
    setCameraLoading(true);
    try {
      console.log('Requesting camera access...');

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      console.log('Camera stream acquired, tracks:', stream.getTracks());

      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      // Assign stream to video element
      videoRef.current.srcObject = stream;
      streamRef.current = stream;
      
      // Force a slight delay to ensure video element is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Try to play
      try {
        await videoRef.current.play();
        console.log('Video playing');
      } catch (playErr) {
        console.error('Play error:', playErr);
      }

      setCameraActive(true);
      toast.success('Camera started successfully');
    } catch (error: any) {
      console.error('Camera error:', error);
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError') {
        toast.error('Camera Permission Denied', {
          description: 'Please allow camera access in browser settings',
        });
      } else if (error.name === 'NotFoundError') {
        toast.error('No Camera Found', {
          description: 'No camera device detected on this system',
        });
      } else if (error.name === 'NotReadableError') {
        toast.error('Camera Not Accessible', {
          description: 'Camera is in use by another application',
        });
      } else {
        toast.error('Camera Error', {
          description: error.message || 'Failed to access camera',
        });
      }
    } finally {
      setCameraLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      setCameraActive(false);
      toast.info('Camera stopped');
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      try {
        const context = canvasRef.current.getContext('2d');
        if (!context) {
          toast.error('Failed to get canvas context');
          return;
        }
        
        // Set canvas dimensions to match video
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        
        // Flip the canvas context horizontally to correct the mirrored video
        context.save();
        context.scale(-1, 1);
        context.translate(-canvasRef.current.width, 0);
        
        // Draw video frame to canvas (this will un-flip the mirrored video)
        context.drawImage(videoRef.current, 0, 0);
        
        // Restore the context
        context.restore();
        
        // Capture with high JPEG quality (0.95 = 95%)
        const imageData = canvasRef.current.toDataURL('image/jpeg', 0.95);
        
        if (!imageData || imageData.length < 100) {
          toast.error('Failed to capture frame - image too small');
          return;
        }
        
        setCapturedImage(imageData);
        toast.success('Frame captured successfully');
        console.log('Frame captured, size:', imageData.length, 'bytes');
      } catch (error) {
        console.error('Error capturing frame:', error);
        toast.error('Failed to capture frame');
      }
    }
  };

  const verifyFace = async () => {
    if (!capturedImage) {
      toast.error('No image captured');
      return;
    }

    setVerifying(true);
    try {
      const blob = await fetch(capturedImage).then((res) => res.blob());
      const formData = new FormData();
      formData.append('file', blob, 'face.jpg');

      const response = await fetch(`${BACKEND_URL}/verify`, {
        method: 'POST',
        body: formData,
      });

      const result: VerificationResult = await response.json();
      setVerificationResult(result);

      if (result.status === 'AUTHORIZED') {
        toast.success(`✅ Face verified for ${customerName}`);
        onVerified(result.customer_id || customerId, result.confidence);
      } else {
        toast.error(`❌ Verification failed (Score: ${(result.confidence * 100).toFixed(1)}%)`);
      }
    } catch (error) {
      toast.error('Verification failed');
      console.error(error);
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setVerificationResult(null);
    onClosed();
  };

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-2xl bg-slate-950 border-slate-900">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-slate-100">🎥 Verify Customer Identity</AlertDialogTitle>
          <AlertDialogDescription className="text-slate-400">
            Capture and verify the customer's face before releasing the payload.
            <br />
            <span className="text-slate-300 font-medium">Customer: {customerName}</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 my-4">
          {/* Video Feed */}
          <div className="relative bg-black rounded-lg w-full overflow-hidden" style={{ aspectRatio: '16 / 9' }}>
            {/* Always render video element so ref is available */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)', // Mirror effect for selfie (front camera effect)
                display: cameraActive ? 'block' : 'none',
              }}
              onLoadedMetadata={() => {
                console.log('Video loaded, dimensions:', videoRef.current?.videoWidth, 'x', videoRef.current?.videoHeight);
                if (videoRef.current) {
                  videoRef.current.play().catch(err => {
                    console.error('Auto-play error:', err);
                  });
                }
              }}
              onError={(e) => {
                console.error('Video error:', e);
                toast.error('Video playback error');
              }}
            />
            {/* Show camera icon when inactive */}
            {!cameraActive && (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <Camera className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Captured Frame Preview */}
          {capturedImage && (
            <div>
              <p className="text-sm text-slate-400 mb-2">Captured Frame:</p>
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-48 object-cover rounded border border-slate-900"
              />
            </div>
          )}

          {/* Hidden Canvas */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Verification Result */}
          {verificationResult && (
            <Card className={`border-slate-900 p-4 ${
              verificationResult.status === 'AUTHORIZED'
                ? 'bg-emerald-950'
                : 'bg-red-950'
            }`}>
              <div className="flex items-start gap-3">
                {verificationResult.status === 'AUTHORIZED' ? (
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-1" />
                ) : (
                  <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                )}
                <div>
                  <h4 className="font-semibold text-slate-100 mb-1">Verification Result</h4>
                  <p className={`text-sm ${
                    verificationResult.status === 'AUTHORIZED'
                      ? 'text-emerald-300'
                      : 'text-red-300'
                  }`}>
                    {verificationResult.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Confidence: {(verificationResult.confidence * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Camera Controls */}
          <div className="flex gap-2">
            {!cameraActive ? (
              <Button
                onClick={startCamera}
                disabled={cameraLoading}
                className="flex-1 bg-sky-600 hover:bg-sky-700 disabled:opacity-50"
              >
                {cameraLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Requesting Camera...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4 mr-2" />
                    Start Camera
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  onClick={captureFrame}
                  variant="secondary"
                  className="flex-1"
                >
                  📸 Capture
                </Button>
                <Button
                  onClick={stopCamera}
                  variant="destructive"
                  className="flex-1"
                >
                  Stop
                </Button>
              </>
            )}
          </div>

          {/* Verify Button */}
          <Button
            onClick={verifyFace}
            disabled={!capturedImage || verifying}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {verifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verifying...
              </>
            ) : (
              <>✓ Verify Face</>
            )}
          </Button>
        </div>

        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction
          disabled={verificationResult?.status !== 'AUTHORIZED'}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
          onClick={handleClose}
        >
          Proceed with Release
        </AlertDialogAction>
      </AlertDialogContent>
    </AlertDialog>
  );
}
