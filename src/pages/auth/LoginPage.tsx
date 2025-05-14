import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/hooks/useAuth';import type { User } from '../../contexts/AuthContext';
import { User as UserIcon, Lock, Eye, EyeOff, Camera, Upload } from 'lucide-react';
import Logo from '../../components/common/Logo';
import { useNotification } from '../../contexts/NotificationContext';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { addNotification } = useNotification();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [faceImage, setFaceImage] = useState<File | null>(null);

  // Handle camera activation
  // Handle camera activation
  const startCamera = async () => {
    try {
      console.log('Starting camera initialization...');
      
      // Make sure any previous streams are stopped
      if (videoRef.current && videoRef.current.srcObject) {
        stopCamera();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      if (!videoRef.current) {
        console.error('Video element not available');
        throw new Error('Video element not available');
      }
      
      console.log('Stream obtained, setting to video element');
      videoRef.current.srcObject = stream;
      
      // Start playing the video
      await videoRef.current.play();
      console.log('Video playback started');
      
      // Set camera active state after successful initialization
      setIsCameraActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      addNotification('Error accessing camera. Please try uploading an image instead.', 'error');
    }
  };

  // Handle camera capture
  const captureImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('Video or canvas reference is not set');
      addNotification('Camera initialization failed. Please try uploading an image instead.', 'error');
      return;
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context) {
      console.error('Failed to get canvas context');
      addNotification('Failed to initialize camera. Please try uploading an image instead.', 'error');
      return;
    }
    
    // Ensure video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('Video dimensions are zero. Waiting for video to initialize...');
      
      // Wait for video to be fully initialized
      try {
        await new Promise<void>((resolve, reject) => {
          let attempts = 0;
          const maxAttempts = 20; // Try for about 2 seconds
          
          const checkDimensions = () => {
            attempts++;
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              resolve();
            } else if (attempts >= maxAttempts) {
              reject(new Error('Video dimensions could not be determined after multiple attempts'));
            } else {
              setTimeout(checkDimensions, 100);
            }
          };
          
          checkDimensions();
        });
      } catch (error) {
        console.error('Failed to get video dimensions:', error);
        addNotification('Camera not properly initialized. Please try again or upload an image.', 'error');
        return;
      }
    }
    
    // Set canvas size to match video dimensions
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    console.log('Capturing with dimensions:', canvas.width, canvas.height);
    
    // Draw the video frame to the canvas
    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Create a blob from the canvas
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'face-auth.jpg', { type: 'image/jpeg' });
          setFaceImage(file);
          stopCamera();
        } else {
          console.error('Failed to create blob from canvas - blob is null');
          addNotification('Failed to capture image. Please try again.', 'error');
        }
      }, 'image/jpeg', 0.9);
    } catch (error) {
      console.error('Error during capture:', error);
      addNotification('Error capturing image. Please try again.', 'error');
    }
  };

  // Stop camera stream
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setFaceImage(file);
      } else {
        addNotification('Please upload an image file.', 'error');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      if (faceImage) {
        formData.append('faceImage', faceImage);
      }

      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const userData = await response.json();
      const newUser: User = {
        id: '', // This can be set after registration
        username: userData.username,
        email: userData.email,
        role: userData.role,
      };
      login(newUser);

      // Redirect based on user role
      if (userData.role === 'customer') {
        navigate('/customer/dashboard');
      } else if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (userData.role === 'agent') {
        navigate('/agent/dashboard');
      }

      addNotification('Login successful!', 'success');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Invalid email or password');
      addNotification('Login failed. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Hidden video and canvas elements that are always rendered */}
      <div style={{ display: 'none' }}>
        <video 
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />
        <canvas ref={canvasRef}></canvas>
      </div>
      
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Logo className="mx-auto h-12 w-auto" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Face Authentication Section */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-700">Face Authentication</div>
            <div className="flex justify-center">
              {isCameraActive ? (
                <div className="relative">
                  {/* Display the video feed from the hidden video element */}
                  <div className="w-64 h-48 rounded-lg border border-gray-300 overflow-hidden" style={{ border: '2px solid blue' }}>
                    <video
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      srcObject={videoRef.current?.srcObject || null}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={captureImage}
                    className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Capture
                  </button>
                </div>
              ) : faceImage ? (
                <div className="relative">
                  <img
                    src={URL.createObjectURL(faceImage)}
                    alt="Captured face"
                    className="w-64 h-48 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setFaceImage(null)}
                    className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full hover:bg-red-700"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="space-x-4">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Camera className="h-5 w-5 mr-2" />
                    Use Camera
                  </button>
                  <label className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                    <Upload className="h-5 w-5 mr-2" />
                    Upload Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </Link>
            </div>
            <div className="text-sm">
              <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
                Don't have an account?
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;