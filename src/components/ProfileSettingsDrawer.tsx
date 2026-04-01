import { X, Upload, Mail, Calendar, Shield, Bell, Globe, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ProfileSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
  onSave?: (data: { profilePhoto: string | null; firstName: string; lastName: string }) => void;
}

export function ProfileSettingsDrawer({ isOpen, onClose, darkMode = false, onSave }: ProfileSettingsDrawerProps) {
  const [firstName, setFirstName] = useState('Timothy');
  const [lastName, setLastName] = useState('McGuire');
  const [imageUrl, setImageUrl] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please upload a JPG, PNG, or GIF image');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Create a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      setProfilePhoto(publicUrl);
      setImageUrl(publicUrl);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    const profileData = {
      profilePhoto: profilePhoto || imageUrl || null,
      firstName,
      lastName
    };

    try {
      // Save to database
      const userId = 'demo-user'; // For demo purposes
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          profile_photo_url: profileData.profilePhoto,
          email: 'godesigngo@gmail.com'
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      onSave?.(profileData);
      onClose();
    } catch (error) {
      console.error('Failed to save profile:', error);
      setUploadError('Failed to save profile. Please try again.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Load profile data when drawer opens
      const loadProfile = async () => {
        try {
          const userId = 'demo-user';
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (error) throw error;

          if (data) {
            setFirstName(data.first_name);
            setLastName(data.last_name);
            setProfilePhoto(data.profile_photo_url);
            setImageUrl(data.profile_photo_url || '');
          }
        } catch (error) {
          console.error('Failed to load profile:', error);
        }
      };

      loadProfile();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      <div className={`fixed inset-y-0 right-0 w-full max-w-2xl z-50 shadow-xl flex flex-col ${
        darkMode ? 'bg-stone-900' : 'bg-stone-50'
      }`}>
        <div className={`sticky top-0 z-10 px-6 py-4 border-b flex items-center justify-between ${
          darkMode
            ? 'bg-stone-900 border-stone-800'
            : 'bg-stone-50 border-stone-200'
        }`}>
          <div>
            <h2 className={`text-lg font-semibold ${
              darkMode ? 'text-white' : 'text-stone-900'
            }`}>Profile Settings</h2>
            <p className={`text-sm mt-0.5 ${
              darkMode ? 'text-stone-400' : 'text-stone-600'
            }`}>Manage your account information and preferences</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'hover:bg-stone-800 text-stone-400'
                : 'hover:bg-stone-200 text-stone-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`rounded-lg border p-6 ${
              darkMode
                ? 'bg-stone-800 border-stone-700'
                : 'bg-white border-stone-200'
            }`}>
              <h3 className={`text-sm font-semibold mb-1 ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>Profile Photo</h3>
              <p className={`text-xs mb-6 ${
                darkMode ? 'text-stone-400' : 'text-stone-600'
              }`}>Your public avatar and identity</p>

              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`flex items-center justify-center w-32 h-32 rounded-full ${
                      darkMode ? 'bg-stone-700' : 'bg-indigo-100'
                    }`}>
                      <span className={`text-3xl font-bold ${
                        darkMode ? 'text-stone-300' : 'text-stone-700'
                      }`}>TM</span>
                    </div>
                  )}
                  <button
                    onClick={() => avatarFileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 p-2 bg-emerald-500 rounded-full hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-4 h-4 text-white" />
                  </button>
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                <p className={`text-sm font-semibold mt-4 ${
                  darkMode ? 'text-white' : 'text-stone-900'
                }`}>Timothy McGuire</p>
                <p className={`text-xs flex items-center gap-1.5 mt-1 ${
                  darkMode ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  <Mail className="w-3 h-3" />
                  godesigngo@gmail.com
                </p>
                <p className={`text-xs flex items-center gap-1.5 mt-1 ${
                  darkMode ? 'text-stone-400' : 'text-stone-600'
                }`}>
                  <Shield className="w-3 h-3 text-emerald-500" />
                  Verified Account
                </p>
              </div>
            </div>

            <div className={`rounded-lg border p-6 ${
              darkMode
                ? 'bg-stone-800 border-stone-700'
                : 'bg-white border-stone-200'
            }`}>
              <h3 className={`text-sm font-semibold mb-1 ${
                darkMode ? 'text-white' : 'text-stone-900'
              }`}>Personal Information</h3>
              <p className={`text-xs mb-6 ${
                darkMode ? 'text-stone-400' : 'text-stone-600'
              }`}>Update your profile details and settings</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${
                      darkMode ? 'text-stone-300' : 'text-stone-700'
                    }`}>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        darkMode
                          ? 'bg-stone-900 border-stone-700 text-white'
                          : 'bg-white border-stone-300 text-stone-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${
                      darkMode ? 'text-stone-300' : 'text-stone-700'
                    }`}>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        darkMode
                          ? 'bg-stone-900 border-stone-700 text-white'
                          : 'bg-white border-stone-300 text-stone-900'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`flex items-center gap-2 text-xs font-medium mb-1.5 ${
                    darkMode ? 'text-stone-300' : 'text-stone-700'
                  }`}>
                    <Upload className="w-3.5 h-3.5" />
                    Profile Image
                  </label>
                  <p className={`text-xs mb-2 ${
                    darkMode ? 'text-stone-400' : 'text-stone-600'
                  }`}>Upload Image File</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      darkMode
                        ? 'border-stone-700 hover:bg-stone-700 text-stone-300'
                        : 'border-stone-300 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <Upload className="w-4 h-4" />
                    {isUploading ? 'Uploading...' : 'Choose File to Upload'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {uploadError && (
                    <p className="text-xs mt-1.5 text-red-600">{uploadError}</p>
                  )}
                  {!uploadError && (
                    <p className={`text-xs mt-1.5 ${
                      darkMode ? 'text-stone-500' : 'text-stone-500'
                    }`}>Supported: JPG, PNG, GIF (max 5MB)</p>
                  )}
                </div>

                <div>
                  <p className={`text-xs text-center mb-2 ${
                    darkMode ? 'text-stone-400' : 'text-stone-600'
                  }`}>Or use URL</p>
                  <label className={`block text-xs font-medium mb-1.5 ${
                    darkMode ? 'text-stone-300' : 'text-stone-700'
                  }`}>Image URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/objects/uploads/80ef07a1-2c15-4940-919c-df04a0147cea"
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      darkMode
                        ? 'bg-stone-900 border-stone-700 text-white placeholder:text-stone-600'
                        : 'bg-white border-stone-300 text-stone-900 placeholder:text-stone-400'
                    }`}
                  />
                  <p className={`text-xs mt-1.5 ${
                    darkMode ? 'text-stone-500' : 'text-stone-500'
                  }`}>Enter a direct link to your profile image</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`rounded-lg border p-6 ${
              darkMode
                ? 'bg-stone-800 border-stone-700'
                : 'bg-white border-stone-200'
            }`}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`p-2.5 rounded-lg ${
                  darkMode ? 'bg-stone-700' : 'bg-indigo-50'
                }`}>
                  <Mail className={`w-5 h-5 ${
                    darkMode ? 'text-stone-300' : 'text-indigo-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${
                    darkMode ? 'text-white' : 'text-stone-900'
                  }`}>Email Address</h3>
                  <p className={`text-xs mt-0.5 ${
                    darkMode ? 'text-stone-400' : 'text-stone-600'
                  }`}>Used for login and notifications</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${
                  darkMode ? 'text-stone-300' : 'text-stone-700'
                }`}>godesigngo@gmail.com</p>
                <span className={`text-xs flex items-center gap-1 ${
                  darkMode ? 'text-emerald-400' : 'text-emerald-600'
                }`}>
                  <Shield className="w-3 h-3" />
                  Verified
                </span>
              </div>
            </div>

            <div className={`rounded-lg border p-6 ${
              darkMode
                ? 'bg-stone-800 border-stone-700'
                : 'bg-white border-stone-200'
            }`}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`p-2.5 rounded-lg ${
                  darkMode ? 'bg-stone-700' : 'bg-indigo-50'
                }`}>
                  <Calendar className={`w-5 h-5 ${
                    darkMode ? 'text-stone-300' : 'text-indigo-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${
                    darkMode ? 'text-white' : 'text-stone-900'
                  }`}>Account Created</h3>
                  <p className={`text-xs mt-0.5 ${
                    darkMode ? 'text-stone-400' : 'text-stone-600'
                  }`}>Member since</p>
                </div>
              </div>
              <p className={`text-sm font-medium ${
                darkMode ? 'text-stone-300' : 'text-stone-700'
              }`}>October 8, 2025</p>
            </div>
          </div>

          <div className={`rounded-lg border p-6 ${
            darkMode
              ? 'bg-stone-800 border-stone-700'
              : 'bg-white border-stone-200'
          }`}>
            <div className="flex items-start gap-3 mb-6">
              <div className={`p-2.5 rounded-lg ${
                darkMode ? 'bg-stone-700' : 'bg-indigo-50'
              }`}>
                <Bell className={`w-5 h-5 ${
                  darkMode ? 'text-stone-300' : 'text-indigo-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-semibold ${
                  darkMode ? 'text-white' : 'text-stone-900'
                }`}>Notification Preferences</h3>
                <p className={`text-xs mt-0.5 ${
                  darkMode ? 'text-stone-400' : 'text-stone-600'
                }`}>Manage how you receive updates</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    darkMode ? 'text-stone-300' : 'text-stone-700'
                  }`}>Email Notifications</p>
                  <p className={`text-xs ${
                    darkMode ? 'text-stone-400' : 'text-stone-600'
                  }`}>Receive updates via email</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    emailNotifications ? 'bg-indigo-600' : darkMode ? 'bg-stone-700' : 'bg-stone-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    emailNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    darkMode ? 'text-stone-300' : 'text-stone-700'
                  }`}>Push Notifications</p>
                  <p className={`text-xs ${
                    darkMode ? 'text-stone-400' : 'text-stone-600'
                  }`}>Receive alerts on your device</p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    pushNotifications ? 'bg-indigo-600' : darkMode ? 'bg-stone-700' : 'bg-stone-300'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    pushNotifications ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          <div className={`rounded-lg border p-6 ${
            darkMode
              ? 'bg-stone-800 border-stone-700'
              : 'bg-white border-stone-200'
          }`}>
            <div className="flex items-start gap-3 mb-6">
              <div className={`p-2.5 rounded-lg ${
                darkMode ? 'bg-stone-700' : 'bg-indigo-50'
              }`}>
                <Globe className={`w-5 h-5 ${
                  darkMode ? 'text-stone-300' : 'text-indigo-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-semibold ${
                  darkMode ? 'text-white' : 'text-stone-900'
                }`}>Regional Settings</h3>
                <p className={`text-xs mt-0.5 ${
                  darkMode ? 'text-stone-400' : 'text-stone-600'
                }`}>Language and timezone preferences</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${
                  darkMode ? 'text-stone-300' : 'text-stone-700'
                }`}>Language</label>
                <select className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  darkMode
                    ? 'bg-stone-900 border-stone-700 text-white'
                    : 'bg-white border-stone-300 text-stone-900'
                }`}>
                  <option>English (US)</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${
                  darkMode ? 'text-stone-300' : 'text-stone-700'
                }`}>Timezone</label>
                <select className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  darkMode
                    ? 'bg-stone-900 border-stone-700 text-white'
                    : 'bg-white border-stone-300 text-stone-900'
                }`}>
                  <option>Pacific (PST)</option>
                  <option>Mountain (MST)</option>
                  <option>Central (CST)</option>
                  <option>Eastern (EST)</option>
                </select>
              </div>
            </div>
          </div>

          <div className={`rounded-lg border p-6 ${
            darkMode
              ? 'bg-stone-800 border-stone-700'
              : 'bg-white border-stone-200'
          }`}>
            <div className="flex items-start gap-3 mb-6">
              <div className={`p-2.5 rounded-lg ${
                darkMode ? 'bg-stone-700' : 'bg-red-50'
              }`}>
                <User className={`w-5 h-5 ${
                  darkMode ? 'text-stone-300' : 'text-red-600'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-semibold ${
                  darkMode ? 'text-white' : 'text-stone-900'
                }`}>Account Management</h3>
                <p className={`text-xs mt-0.5 ${
                  darkMode ? 'text-stone-400' : 'text-stone-600'
                }`}>Advanced account actions</p>
              </div>
            </div>

            <div className="space-y-3">
              <button className={`w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${
                darkMode
                  ? 'border-stone-700 hover:bg-stone-700 text-stone-300'
                  : 'border-stone-300 hover:bg-stone-50 text-stone-700'
              }`}>
                Change Password
              </button>
              <button className={`w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${
                darkMode
                  ? 'border-stone-700 hover:bg-stone-700 text-stone-300'
                  : 'border-stone-300 hover:bg-stone-50 text-stone-700'
              }`}>
                Download My Data
              </button>
              <button className="w-full px-4 py-2.5 rounded-lg border border-red-600 text-sm font-medium transition-colors text-left text-red-600 hover:bg-red-50">
                Delete Account
              </button>
            </div>
          </div>

        </div>

        <div className={`sticky bottom-0 p-6 border-t flex justify-end gap-3 ${
          darkMode
            ? 'bg-stone-900 border-stone-800'
            : 'bg-stone-50 border-stone-200'
        }`}>
          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'text-stone-300 hover:bg-stone-800'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}
