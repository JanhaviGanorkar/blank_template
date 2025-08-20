import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/apiclient';

const Register: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirm: '',
    avatar: null as File | string | null,
    location: '',
    bio: '',
    website: ''
  });
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  // Clean up any created avatar preview URLs when component unmounts
  useEffect(() => {
    return () => {
      // Cleanup function
      if (previewAvatar) {
        URL.revokeObjectURL(previewAvatar);
      }
    };
  }, [previewAvatar]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should not exceed 5MB');
        return;
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPreviewAvatar(previewUrl);
      
      // Update formData
      setFormData({
        ...formData,
        avatar: file
      });
      
      setError('');
    }
  };

  const removeAvatar = () => {
    // Revoke object URL to prevent memory leaks
    if (previewAvatar) {
      URL.revokeObjectURL(previewAvatar);
    }
    
    setPreviewAvatar(null);
    setFormData({
      ...formData,
      avatar: null
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNextStep = () => {
    // Validate current step before proceeding
    if (step === 1) {
      if (!formData.name.trim() || !formData.email.trim() || 
          !formData.password.trim() || !formData.password_confirm.trim()) {
        setError('Please fill in all required fields');
        return;
      }
      
      if (formData.password !== formData.password_confirm) {
        setError('Passwords do not match');
        return;
      }
      
      setError('');
    }
    
    setStep(step + 1);
  };

  const handlePreviousStep = () => {
    setStep(step - 1);
  };
  
  const handleSkip = async () => {
    // Skip profile info and submit with just required fields
    await handleSubmit(undefined);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Check if passwords match
    if (formData.password !== formData.password_confirm) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const response = await authService.register(formData);
      setSuccess(response.message || 'Registration successful! Please check your email to verify your account.');
      
      // Navigate to email verification page after successful registration
      setTimeout(() => {
        navigate('/verify-email', { 
          state: { 
            email: formData.email,
            message: 'Registration successful! Please check your email for the verification link.'
          }
        });
      }, 2000);
    } catch (error: any) {
      console.error('Registration failed:', error);
      
      // Handle specific API error responses
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Handle field-specific errors (like email already exists)
        if (errorData.email && Array.isArray(errorData.email)) {
          setError(errorData.email[0]); // "A user with this email already exists."
        } else if (errorData.password && Array.isArray(errorData.password)) {
          setError(errorData.password[0]);
        } else if (errorData.name && Array.isArray(errorData.name)) {
          setError(errorData.name[0]);
        } else if (errorData.message) {
          setError(errorData.message);
        } else if (errorData.error) {
          setError(errorData.error);
        } else {
          setError('Registration failed. Please try again.');
        }
      } else {
        setError(error.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center py-12 px-4">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-gradient-to-br from-indigo-400 to-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100/50">
          <div className="text-center mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-sm font-medium text-blue-600 mb-6">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
              Create Account
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Sign Up
            </h1>
            <p className="text-gray-600 leading-relaxed">
              {step === 1 ? 'Create your account to get started' : 'Complete your profile (Optional)'}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${step === 1 ? 'bg-blue-600' : 'bg-blue-300'}`}></div>
              <div className="w-10 h-1 bg-gray-200"></div>
              <div className={`w-3 h-3 rounded-full ${step === 2 ? 'bg-blue-600' : 'bg-blue-300'}`}></div>
            </div>
          </div>

          <form onSubmit={(e) => handleSubmit(e)} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex">
                  <svg className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="font-medium">{error}</p>
                    {error.includes('email already exists') && (
                      <p className="text-sm mt-1">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-red-800 hover:text-red-900 underline">
                          Sign in here
                        </Link>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                <div className="flex">
                  <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p>{success}</p>
                </div>
              </div>
            )}
            
            {step === 1 && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Create a password"
                    required
                    minLength={8}
                  />
                </div>

                <div>
                  <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="password_confirm"
                    name="password_confirm"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Confirm your password"
                    required
                    minLength={8}
                  />
                </div>

                <div className="flex items-center">
                  <input
                    id="terms"
                    type="checkbox"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    required
                  />
                  <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                    I agree to the{' '}
                    <Link to="/terms" className="text-blue-600 hover:text-blue-700 font-medium">
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn-primary w-full"
                >
                  Next: Profile Information
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture (Optional)
                  </label>
                  
                  {previewAvatar ? (
                    <div className="mb-3">
                      <div className="relative inline-block">
                        <img 
                          src={previewAvatar} 
                          alt="Avatar preview" 
                          className="w-24 h-24 rounded-full object-cover border-2 border-gray-200" 
                        />
                        <button
                          type="button"
                          onClick={removeAvatar}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"
                          title="Remove image"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1 flex items-center">
                      <input
                        type="file"
                        id="avatar"
                        name="avatar"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                      />
                      <label
                        htmlFor="avatar"
                        className="cursor-pointer px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Choose File
                      </label>
                      <span className="ml-3 text-sm text-gray-500">No file chosen</span>
                    </div>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Upload a profile picture (Max: 5MB)
                  </p>
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                    Location (Optional)
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your location"
                  />
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                    Website (Optional)
                  </label>
                  <input
                    type="text"
                    id="website"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    className="form-input"
                    placeholder="Enter your website URL"
                  />
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                    Bio (Optional)
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    className="form-input min-h-[100px]"
                    placeholder="Tell us about yourself"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="btn-secondary w-full"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating account...
                      </div>
                    ) : (
                      'Complete Registration'
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSkip}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium w-full text-center py-2"
                >
                  Skip for now
                </button>
              </>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;