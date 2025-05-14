import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/hooks/useAuth';
import type { User } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { User as UserIcon, Lock, Eye, EyeOff, Mail, Camera, Upload } from 'lucide-react';
import Logo from '../../components/common/Logo';

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { addNotification } = useNotification();
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [faceImage, setFaceImage] = useState<File | null>(null);

    useEffect(() => {
        if (videoRef.current) {
            console.log('Video element is rendered:', videoRef.current);
        } else {
            console.log('Video element is not rendered yet.');
        }
    }, [isCameraActive]); // Run this effect when isCameraActive changes

    useEffect(() => {
        console.log('isCameraActive:', isCameraActive);
    }, [isCameraActive]);

    useEffect(() => {
        if (videoRef.current) {
            console.log('Video dimensions:', videoRef.current.videoWidth, videoRef.current.videoHeight);
        }
    }, [isCameraActive]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

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
        setError('');

        // Define a user object based on the User type
        const newUser: User = {
            id: '', // You might want to set this after registration
            username: formData.username,
            email: formData.email,
            role: 'customer', // Assuming a default role
        };

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            addNotification('Passwords do not match', 'error');
            return;
        }

        if (!faceImage) {
            setError('Please provide a face image for authentication');
            addNotification('Face image is required', 'error');
            return;
        }

        setIsLoading(true);
        try {
            const submitFormData = new FormData();
            submitFormData.append('username', formData.username);
            submitFormData.append('email', formData.email);
            submitFormData.append('password', formData.password);
            submitFormData.append('faceImage', faceImage);

            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                body: submitFormData,
            });

            const text = await response.text(); // Get the raw response text
            console.log(text); // Log the response text

            if (!response.ok) {
                throw new Error(text); // Throw an error with the raw response
            }

            const data = JSON.parse(text); // Parse it as JSON

            // Use the newUser object here
            newUser.id = data.id; // Set the ID from the response
            login(newUser); // Use newUser for login
            addNotification('Registration successful!', 'success');
            navigate('/customer/dashboard');
        } catch (error) {
            setError(error instanceof Error ? error.message : 'Registration failed');
            addNotification('Registration failed. Please try again.', 'error');
        } finally {
            setIsLoading(false);
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
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Create your account</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                            Sign in
                        </Link>
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="text-sm text-red-700">{error}</div>
                        </div>
                    )}

                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="username" className="sr-only">Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Username"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                                    required
                                    autoComplete="new-password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
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
                        <div>
                            <label htmlFor="confirmPassword" className="sr-only">Confirm Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                    placeholder="Confirm Password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showConfirmPassword ? (
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
                                    {/* This is just a display element, not the actual video element with the ref */}
                                    <div className="w-64 h-48 rounded-lg border border-gray-300 overflow-hidden" style={{ border: '2px solid blue' }}>
                                        {/* The actual video feed is shown here */}
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
                                        onClick={() => {
                                            console.log('Starting camera...');
                                            startCamera();
                                        }}
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
                        {/* Add this hidden canvas element */}
                        <canvas 
                            ref={canvasRef} 
                            style={{ display: 'none' }} 
                            width="640" 
                            height="480"
                        ></canvas>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                        >
                            {isLoading ? 'Creating account...' : 'Create account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;
