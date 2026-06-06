import { X, Upload, Mail, Calendar, Shield, Bell, Globe, User, LogOut } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface ProfileSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode?: boolean;
  /** `drawer` = overlay + fixed panel (legacy). `inline` = full-width content for main column (no overlay). */
  layout?: 'drawer' | 'inline';
  onSave?: (data: { profilePhoto: string | null; firstName: string; lastName: string }) => void;
  onSignOut?: () => void;
}

export function ProfileSettingsDrawer({
  isOpen,
  onClose,
  darkMode = false,
  layout = 'drawer',
  onSave,
  onSignOut,
}: ProfileSettingsDrawerProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
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
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          profile_photo_url: profileData.profilePhoto,
          email: session.user.email,
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

  const [userEmail, setUserEmail] = useState('');
  const [memberSince, setMemberSince] = useState('');

  useEffect(() => {
    if (isOpen) {
      const loadProfile = async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) return;

          setUserEmail(session.user.email || '');
          if (session.user.created_at) {
            setMemberSince(new Date(session.user.created_at).toLocaleDateString('en-US', {
              year: 'numeric', month: 'long', day: 'numeric'
            }));
          }

          const { data, error } = await supabase
            .from('user_profiles')
            .select('first_name, last_name, profile_photo_url')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (error) throw error;

          if (data) {
            setFirstName(data.first_name || '');
            setLastName(data.last_name || '');
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

  const isInline = layout === 'inline';

  const panelShellClass = isInline
    ? 'flex flex-col w-full min-h-0 flex-1 bg-surface-page pt-20 lg:pt-0'
    : `fixed inset-y-0 right-0 w-full max-w-2xl z-50 shadow-xl flex flex-col ${
        darkMode ? 'bg-surface-page' : 'bg-surface-page'
      }`;

  const scrollBodyClass = isInline
    ? 'w-full max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 pt-6 lg:pt-8 pb-8 space-y-6'
    : 'flex-1 overflow-y-auto p-6 space-y-6';

  return (
    <>
      {!isInline ? (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
          aria-hidden={!isOpen}
        />
      ) : null}
      <div className={panelShellClass}>
        <div
          className={`${isInline ? 'sticky top-0 z-10' : 'sticky top-0 z-10'} px-6 py-4 border-b flex items-center justify-between ${
            darkMode ? 'bg-surface-raised border-stroke-subtle' : 'bg-surface-sunken border-stroke-subtle'
          }`}
        >
          <div>
            <h2 className={`text-lg font-semibold ${
              'text-content-primary'
            }`}>Profile Settings</h2>
            <p className={`text-sm mt-0.5 ${
              'text-content-secondary'
            }`}>Manage your account information and preferences</p>
          </div>
          <div className="flex items-center gap-2">
            {onSignOut && (
              <button
                onClick={onSignOut}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? 'text-red-400 hover:bg-red-400/10 border border-red-400/20'
                    : 'text-red-600 hover:bg-red-50 border border-red-200'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                darkMode
                  ? 'hover:bg-surface-sunken text-content-secondary'
                  : 'hover:bg-surface-overlay text-content-secondary'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className={scrollBodyClass}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`rounded-lg border p-6 ${
              darkMode
                ? 'bg-surface-sunken border-stroke-default'
                : 'bg-white border-stroke-subtle'
            }`}>
              <h3 className={`text-sm font-semibold mb-1 ${
                'text-content-primary'
              }`}>Profile Photo</h3>
              <p className={`text-xs mb-6 ${
                'text-content-secondary'
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
                      'bg-surface-sunken'
                    }`}>
                      <span className={`text-3xl font-bold ${
                        'text-content-primary'
                      }`}>{(firstName?.[0] || '') + (lastName?.[0] || '') || '?'}</span>
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
                  'text-content-primary'
                }`}>{firstName || lastName ? `${firstName} ${lastName}`.trim() : '—'}</p>
                <p className={`text-xs flex items-center gap-1.5 mt-1 ${
                  'text-content-secondary'
                }`}>
                  <Mail className="w-3 h-3" />
                  {userEmail}
                </p>
                <p className={`text-xs flex items-center gap-1.5 mt-1 ${
                  'text-content-secondary'
                }`}>
                  <Shield className="w-3 h-3 text-emerald-500" />
                  Verified Account
                </p>
              </div>
            </div>

            <div className={`rounded-lg border p-6 ${
              darkMode
                ? 'bg-surface-sunken border-stroke-default'
                : 'bg-white border-stroke-subtle'
            }`}>
              <h3 className={`text-sm font-semibold mb-1 ${
                'text-content-primary'
              }`}>Personal Information</h3>
              <p className={`text-xs mb-6 ${
                'text-content-secondary'
              }`}>Update your profile details and settings</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${
                      'text-content-primary'
                    }`}>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        darkMode
                          ? 'bg-surface-raised border-stroke-default text-white'
                          : 'bg-white border-stroke-default text-content-primary'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-xs font-medium mb-1.5 ${
                      'text-content-primary'
                    }`}>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm ${
                        darkMode
                          ? 'bg-surface-raised border-stroke-default text-white'
                          : 'bg-white border-stroke-default text-content-primary'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`flex items-center gap-2 text-xs font-medium mb-1.5 ${
                    'text-content-primary'
                  }`}>
                    <Upload className="w-3.5 h-3.5" />
                    Profile Image
                  </label>
                  <p className={`text-xs mb-2 ${
                    'text-content-secondary'
                  }`}>Upload Image File</p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      darkMode
                        ? 'border-stroke-default hover:bg-surface-sunken text-content-primary'
                        : 'border-stroke-default hover:bg-surface-sunken text-content-primary'
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
                      'text-content-secondary'
                    }`}>Supported: JPG, PNG, GIF (max 5MB)</p>
                  )}
                </div>

                <div>
                  <p className={`text-xs text-center mb-2 ${
                    'text-content-secondary'
                  }`}>Or use URL</p>
                  <label className={`block text-xs font-medium mb-1.5 ${
                    'text-content-primary'
                  }`}>Image URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/objects/uploads/80ef07a1-2c15-4940-919c-df04a0147cea"
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      darkMode
                        ? 'bg-surface-raised border-stroke-default text-white placeholder:text-content-secondary'
                        : 'bg-white border-stroke-default text-content-primary placeholder:text-content-secondary'
                    }`}
                  />
                  <p className={`text-xs mt-1.5 ${
                    'text-content-secondary'
                  }`}>Enter a direct link to your profile image</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`rounded-lg border p-6 ${
              darkMode
                ? 'bg-surface-sunken border-stroke-default'
                : 'bg-white border-stroke-subtle'
            }`}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`p-2.5 rounded-lg ${
                  'bg-surface-sunken'
                }`}>
                  <Mail className={`w-5 h-5 ${
                    'text-indigo-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${
                    'text-content-primary'
                  }`}>Email Address</h3>
                  <p className={`text-xs mt-0.5 ${
                    'text-content-secondary'
                  }`}>Used for login and notifications</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${
                  'text-content-primary'
                }`}>{userEmail}</p>
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
                ? 'bg-surface-sunken border-stroke-default'
                : 'bg-white border-stroke-subtle'
            }`}>
              <div className="flex items-start gap-3 mb-4">
                <div className={`p-2.5 rounded-lg ${
                  'bg-surface-sunken'
                }`}>
                  <Calendar className={`w-5 h-5 ${
                    'text-indigo-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-sm font-semibold ${
                    'text-content-primary'
                  }`}>Account Created</h3>
                  <p className={`text-xs mt-0.5 ${
                    'text-content-secondary'
                  }`}>Member since</p>
                </div>
              </div>
              <p className={`text-sm font-medium ${
                'text-content-primary'
              }`}>{memberSince || '—'}</p>
            </div>
          </div>

          <div className={`rounded-lg border p-6 ${
            darkMode
              ? 'bg-surface-sunken border-stroke-default'
              : 'bg-white border-stroke-subtle'
          }`}>
            <div className="flex items-start gap-3 mb-6">
              <div className={`p-2.5 rounded-lg ${
                'bg-surface-sunken'
              }`}>
                <Bell className={`w-5 h-5 ${
                  'text-indigo-400'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-semibold ${
                  'text-content-primary'
                }`}>Notification Preferences</h3>
                <p className={`text-xs mt-0.5 ${
                  'text-content-secondary'
                }`}>Manage how you receive updates</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-medium ${
                    'text-content-primary'
                  }`}>Email Notifications</p>
                  <p className={`text-xs ${
                    'text-content-secondary'
                  }`}>Receive updates via email</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    emailNotifications ? 'bg-indigo-600' : darkMode ? 'bg-surface-sunken' : 'bg-surface-sunken'
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
                    'text-content-primary'
                  }`}>Push Notifications</p>
                  <p className={`text-xs ${
                    'text-content-secondary'
                  }`}>Receive alerts on your device</p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    pushNotifications ? 'bg-indigo-600' : darkMode ? 'bg-surface-sunken' : 'bg-surface-sunken'
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
              ? 'bg-surface-sunken border-stroke-default'
              : 'bg-white border-stroke-subtle'
          }`}>
            <div className="flex items-start gap-3 mb-6">
              <div className={`p-2.5 rounded-lg ${
                'bg-surface-sunken'
              }`}>
                <Globe className={`w-5 h-5 ${
                  'text-indigo-400'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-semibold ${
                  'text-content-primary'
                }`}>Regional Settings</h3>
                <p className={`text-xs mt-0.5 ${
                  'text-content-secondary'
                }`}>Language and timezone preferences</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${
                  'text-content-primary'
                }`}>Language</label>
                <select className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  darkMode
                    ? 'bg-surface-raised border-stroke-default text-white'
                    : 'bg-white border-stroke-default text-content-primary'
                }`}>
                  <option>English (US)</option>
                  <option>Spanish</option>
                  <option>French</option>
                </select>
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1.5 ${
                  'text-content-primary'
                }`}>Timezone</label>
                <select className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  darkMode
                    ? 'bg-surface-raised border-stroke-default text-white'
                    : 'bg-white border-stroke-default text-content-primary'
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
              ? 'bg-surface-sunken border-stroke-default'
              : 'bg-white border-stroke-subtle'
          }`}>
            <div className="flex items-start gap-3 mb-6">
              <div className={`p-2.5 rounded-lg ${
                'bg-surface-sunken'
              }`}>
                <User className={`w-5 h-5 ${
                  'text-red-400'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-semibold ${
                  'text-content-primary'
                }`}>Account Management</h3>
                <p className={`text-xs mt-0.5 ${
                  'text-content-secondary'
                }`}>Advanced account actions</p>
              </div>
            </div>

            <div className="space-y-3">
              <button className={`w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${
                darkMode
                  ? 'border-stroke-default hover:bg-surface-sunken text-content-primary'
                  : 'border-stroke-default hover:bg-surface-sunken text-content-primary'
              }`}>
                Change Password
              </button>
              <button className={`w-full px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors text-left ${
                darkMode
                  ? 'border-stroke-default hover:bg-surface-sunken text-content-primary'
                  : 'border-stroke-default hover:bg-surface-sunken text-content-primary'
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
            ? 'bg-surface-raised border-stroke-subtle'
            : 'bg-surface-sunken border-stroke-subtle'
        }`}>
          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'text-content-primary hover:bg-surface-sunken'
                : 'text-content-primary hover:bg-surface-sunken'
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
