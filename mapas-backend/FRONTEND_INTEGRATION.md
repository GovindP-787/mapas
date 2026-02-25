// Frontend Integration Examples for MAPAS Backend

// ============================================================================
// React/Next.js Hook: useFaceVerification
// ============================================================================

import { useState } from 'react';

export function useFaceVerification(apiUrl = 'http://localhost:8000') {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerFace = async (customerId: string, file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${apiUrl}/customers/${customerId}/register-face`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyFace = async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${apiUrl}/verify`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    registerFace,
    verifyFace,
    loading,
    error,
  };
}


// ============================================================================
// React Component: FaceVerificationForm
// ============================================================================

import React, { useRef, useState } from 'react';
import { useFaceVerification } from './useFaceVerification';

interface FaceVerificationFormProps {
  customerId?: string;
  onVerificationSuccess?: (customerId: string, confidence: number) => void;
  onVerificationFail?: () => void;
}

export function FaceVerificationForm({
  customerId,
  onVerificationSuccess,
  onVerificationFail,
}: FaceVerificationFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const { verifyFace, loading, error } = useFaceVerification();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleVerify = async () => {
    if (!selectedFile) return;

    try {
      const response = await verifyFace(selectedFile);
      setResult(response);

      if (response.status === 'AUTHORIZED') {
        onVerificationSuccess?.(response.customer_id, response.confidence);
      } else {
        onVerificationFail?.();
      }
    } catch (err) {
      console.error('Verification failed:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          disabled={loading}
          className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {selectedFile && (
        <p className="text-sm text-slate-600">Selected: {selectedFile.name}</p>
      )}

      <button
        onClick={handleVerify}
        disabled={!selectedFile || loading}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
      >
        {loading ? 'Verifying...' : 'Verify Face'}
      </button>

      {error && <p className="text-red-600 text-sm">Error: {error}</p>}

      {result && (
        <div className={`p-4 rounded ${
          result.status === 'AUTHORIZED' 
            ? 'bg-green-50 text-green-900' 
            : 'bg-red-50 text-red-900'
        }`}>
          <p className="font-bold">{result.status}</p>
          <p className="text-sm">{result.message}</p>
          <p className="text-sm">
            Confidence: {(result.confidence * 100).toFixed(1)}%
          </p>
        </div>
      )}
    </div>
  );
}


// ============================================================================
// Service: BackendService (Encapsulated API Calls)
// ============================================================================

export class BackendService {
  constructor(private baseUrl: string = 'http://localhost:8000') {}

  async getCustomers() {
    const response = await fetch(`${this.baseUrl}/customers`);
    if (!response.ok) throw new Error('Failed to fetch customers');
    return response.json();
  }

  async getCustomer(customerId: string) {
    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}`
    );
    if (!response.ok) throw new Error('Customer not found');
    return response.json();
  }

  async registerFace(customerId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${this.baseUrl}/customers/${customerId}/register-face`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) throw new Error('Failed to register face');
    return response.json();
  }

  async verifyFace(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${this.baseUrl}/verify`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Verification failed');
    return response.json();
  }

  async checkHealth() {
    const response = await fetch(`${this.baseUrl}/health`);
    return response.ok;
  }
}


// ============================================================================
// Usage Examples
// ============================================================================

// Example 1: Basic usage in a component
async function example1() {
  const service = new BackendService();
  
  // Get all customers
  const customers = await service.getCustomers();
  console.log('Customers:', customers);
  
  // Register a face (assuming you have a File object)
  const file = new File(['...'], 'face.jpg', { type: 'image/jpeg' });
  const registerResult = await service.registerFace('1', file);
  console.log('Registration:', registerResult);
  
  // Verify a face
  const verifyResult = await service.verifyFace(file);
  console.log('Verification:', verifyResult);
}

// Example 2: Using with React component state
function DeliveryVerification() {
  const [authorized, setAuthorized] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const service = new BackendService();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await service.verifyFace(file);
      
      if (result.status === 'AUTHORIZED') {
        setAuthorized(true);
        setCustomerId(result.customer_id);
        alert(`✓ Verified customer: ${result.customer_id}`);
      } else {
        setAuthorized(false);
        alert('✗ Face not recognized');
      }
    } catch (error) {
      alert('Verification error: ' + error);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
      />
      {authorized && (
        <p>✓ Customer {customerId} authorized for delivery</p>
      )}
    </div>
  );
}

// Example 3: Fetch with error handling
async function verifyWithErrorHandling(file: File) {
  const apiUrl = 'http://localhost:8000';
  
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${apiUrl}/verify`, {
      method: 'POST',
      body: formData,
    });

    if (response.status === 400) {
      throw new Error('Invalid image file');
    } else if (response.status === 404) {
      throw new Error('Backend not available');
    } else if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: data.status === 'AUTHORIZED',
      customerId: data.customer_id,
      confidence: data.confidence,
      message: data.message,
    };
  } catch (error) {
    console.error('Verification error:', error);
    return {
      success: false,
      customerId: null,
      confidence: 0,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}


// ============================================================================
// Integration with Food Delivery Page
// ============================================================================

interface DeliveryIntegrationProps {
  selectedCustomerId: string | null;
}

export function FoodDeliveryIntegration({ selectedCustomerId }: DeliveryIntegrationProps) {
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const service = new BackendService();

  const handleCameraCapture = async (imageData: Blob) => {
    if (!selectedCustomerId) {
      alert('Please select a customer first');
      return;
    }

    setVerificationStatus('verifying');

    try {
      const file = new File([imageData], 'capture.jpg', { type: 'image/jpeg' });
      const result = await service.verifyFace(file);

      if (result.status === 'AUTHORIZED') {
        setVerificationStatus('success');
        // Enable release button, show success message, etc.
      } else {
        setVerificationStatus('failed');
        // Show failure message, lock release button
      }
    } catch (error) {
      console.error('Error:', error);
      setVerificationStatus('failed');
    }
  };

  return (
    <div>
      <button
        onClick={() => handleCameraCapture(new Blob())}
        disabled={!selectedCustomerId || verificationStatus === 'verifying'}
      >
        Verify Face for Delivery
      </button>

      {verificationStatus === 'success' && (
        <div className="text-green-600">✓ Face verified - Ready to release payload</div>
      )}
      
      {verificationStatus === 'failed' && (
        <div className="text-red-600">✗ Verification failed - Release button locked</div>
      )}
    </div>
  );
}


// ============================================================================
// Axios Wrapper (Alternative to Fetch)
// ============================================================================

import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export async function verifyFaceWithAxios(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await apiClient.post('/verify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Verification failed');
    }
    throw error;
  }
}


// ============================================================================
// Export all for use in components
// ============================================================================

export {
  BackendService,
  verifyFaceWithAxios,
  DeliveryVerification,
  FoodDeliveryIntegration,
};
