import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../store/store';
import { authService } from '../api/apiclient';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  is_email_verified: boolean;
  last_seen: string;
  created_at?: string;
  // Add other fields from your Django User model
}

export default function Profile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    location: '',
    website: ''
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user profile from Django backend
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await authService.getUserProfile();
        
        setProfileData(response);
        
        setFormData({
          name: response.name || '',
          email: response.email || '',
          bio: response.bio || '',
          location: response.location || '',
          website: response.website || ''
        });
        
      } catch (error: any) {
        setError(
          error.response?.data?.detail || 
          error.response?.data?.message || 
          'Failed to load profile data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      const updatePayload = {
        name: formData.name,
        location: null,
        bio: null,
        website: null,
        avatar: avatarFile ? avatarFile : ''
      };
      
      const response = await authService.editUserProfile(updatePayload);
      
      setProfileData(prev => ({
        ...prev!,
        ...response,
        avatar: response.avatar || prev!.avatar
      }));
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setAvatarFile(null);
      
    } catch (error: any) {
      setError(
        error.response?.data?.detail || 
        error.response?.data?.message || 
        'Failed to update profile'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50 shadow-sm">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="font-medium hidden sm:inline">Back to Dashboard</span>
                <span className="font-medium sm:hidden">Back</span>
              </Link>
              <div className="hidden sm:block h-6 w-px bg-gray-300"></div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                <span className="hidden sm:inline">Profile Settings</span>
                <span className="sm:hidden">Profile</span>
              </h1>
            </div>
            
            {!loading && (
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">Save</span>
                  </div>
                ) : (
                  <>
                    <span className="hidden sm:inline">{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
                    <span className="sm:hidden">{isEditing ? 'Save' : 'Edit'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-lg text-gray-600">Loading profile...</span>
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-red-800 font-medium">Error loading profile</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {success && !loading && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-green-800 font-medium">Success!</h3>
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-24 sm:h-32 relative">
              <div className="absolute -bottom-12 sm:-bottom-16 left-4 sm:left-8">
                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-2xl sm:text-4xl shadow-xl border-4 border-white">
                  {isEditing ? (
                    <div className="relative w-full h-full">
                      <input
                        type="file"
                        id="avatarInput"
                        ref={fileInputRef}
                        onChange={handleAvatarChange}
                        className="hidden"
                        accept="image/*"
                      />
                      <label htmlFor="avatarInput" className="cursor-pointer">
                        <img 
                          src={avatarFile ? URL.createObjectURL(avatarFile) : profileData?.avatar || 'https://placehold.co/128x128/9d20c7/ffffff?text=U'}
                          alt="Avatar" 
                          className="w-full h-full rounded-full object-cover"
                        />
                         <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.867-1.47a2 2 0 011.664-.89h1.866a2 2 0 011.664.89l.867 1.47c.21.375.498.665.864.89h.93a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                         </div>
                      </label>
                    </div>
                  ) : (
                    <img 
                      src={profileData?.avatar || 'https://placehold.co/128x128/9d20c7/ffffff?text=U'}
                      alt="Avatar" 
                      className="w-full h-full rounded-full object-cover"
                    />
                  )}
                </div>
              </div>
              
              <div className="absolute top-4 right-4">
                {profileData?.is_email_verified ? (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Email Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Email Unverified
                  </span>
                )}
              </div>
            </div>

            <div className="pt-16 sm:pt-20 px-4 sm:px-8 pb-6 sm:pb-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {formData.name || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                    {isEditing ? (
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-200 cursor-not-allowed"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {formData.email || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                    {isEditing ? (
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Tell us about yourself..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {formData.bio || 'No bio provided'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="City, Country"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                        {formData.location || 'Location not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    {isEditing ? (
                      <input
                        type="url"
                        name="website"
                        value={formData.website}
                        onChange={handleInputChange}
                        placeholder="https://your-website.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="bg-gray-50 px-3 py-2 rounded-lg">
                        {formData.website ? (
                          <a 
                            href={formData.website} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                          >
                            <span>{formData.website}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-gray-500">No website provided</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                    <h3 className="font-semibold text-gray-900 mb-3">Account Information</h3>
                    <div className="grid grid-cols-1 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Member Since:</span>
                        <span className="font-semibold text-gray-900">
                          {profileData?.created_at ? 
                            new Date(profileData.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'numeric', 
                              day: 'numeric' 
                            }) : 'N/A'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Login:</span>
                       <div>
                          <div className='font-semibold text-gray-900'>
                            {profileData?.last_seen 
                              ? new Date(profileData.last_seen).toLocaleDateString('en-US', { 
                                  year: 'numeric', 
                                  month: 'numeric', 
                                  day: 'numeric',
                                }) 
                              : 'Never'
                            }
                          </div>
                          <div className='font-semibold text-gray-900'>
                            {profileData?.last_seen 
                              ? new Date(profileData.last_seen).toLocaleTimeString('en-US', { 
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) 
                              : 'Never'
                            }
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email Status:</span>
                        <span className={`font-semibold ${profileData?.is_email_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                          {profileData?.is_email_verified ? '✅ Verified' : '⚠️ Unverified'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-semibold text-red-800 mb-2">Delete Account</h3>
                  <p className="text-red-700 text-sm mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button 
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    onClick={() => alert('Account deletion not implemented yet')}
                  >
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}