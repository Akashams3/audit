import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';
import { User, Mail, Lock, Shield, CheckCircle, AlertCircle, Upload, Camera } from 'lucide-react';

const Profile = () => {
  const { user: authUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImageBase64, setProfileImageBase64] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await userApi.getProfile();
      setProfile(data);
      setName(data.name || '');
      setEmail(data.email || '');
      setProfileImageBase64(data.profileImageBase64 || '');
    } catch (e) {
      console.error(e);
      setMsg({ text: 'Error fetching profile details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMsg({ text: 'Please select a valid image file (PNG, JPG, WEBP).', type: 'error' });
      return;
    }

    setUploadingAvatar(true);
    setMsg({ text: '', type: '' });

    try {
      // Local live preview
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Str = event.target.result;
        setProfileImageBase64(base64Str);

        // Upload to server
        const res = await userApi.uploadAvatar(file);
        setMsg({ text: 'Profile image updated successfully!', type: 'success' });
        updateUser({ profileImageBase64: base64Str });
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setMsg({ text: 'Failed to upload profile picture: ' + err.message, type: 'error' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMsg({ text: '', type: '' });

    if (password && password !== confirmPassword) {
      setMsg({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      const payload = { name, email, profileImageBase64 };
      if (password) {
        payload.password = password;
      }

      await userApi.updateProfile(payload);
      setMsg({ text: 'Profile details updated successfully!', type: 'success' });
      updateUser({ name, email, profileImageBase64 });
      setPassword('');
      setConfirmPassword('');
      fetchProfile();
    } catch (err) {
      setMsg({ text: 'Error updating profile: ' + err.message, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-bold text-slate-800">My Profile & Avatar Settings</h2>
        <p className="text-xs text-slate-400 font-semibold mt-1">Dashboard &gt; Profile</p>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="h-8 w-8 border-4 border-[#0A3D91] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form on Left */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Edit Personal Profile</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Manage your user details, email address, password, and institutional avatar.</p>
              </div>

              {msg.text && (
                <div className={`p-3 rounded-xl flex items-start space-x-2 text-xs font-semibold ${msg.type === 'error' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {msg.type === 'error' ? <AlertCircle size={16} className="flex-shrink-0" /> : <CheckCircle size={16} className="flex-shrink-0" />}
                  <span>{msg.text}</span>
                </div>
              )}

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <div className="mt-1.5 relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User size={14} />
                      </div>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#0A3D91] outline-none transition-all text-slate-700 font-semibold"
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email ID</label>
                    <div className="mt-1.5 relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail size={14} />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#0A3D91] outline-none transition-all text-slate-700 font-semibold"
                        placeholder="Enter email ID"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">New Password (Optional)</label>
                    <div className="mt-1.5 relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock size={14} />
                      </div>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#0A3D91] outline-none transition-all text-slate-700 font-semibold"
                        placeholder="Leave blank to keep current"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirm New Password</label>
                    <div className="mt-1.5 relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock size={14} />
                      </div>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="block w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#0A3D91] outline-none transition-all text-slate-700 font-semibold"
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-[#0A3D91] hover:bg-[#082E6E] text-white font-bold py-2.5 rounded-xl text-xs transition-colors shadow-md flex items-center justify-center space-x-2"
                  >
                    {submitting ? (
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <span>Save Profile Changes</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* User Profile Card & Image Upload on Right */}
          <div className="space-y-6">
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-4 text-center">
              <div className="relative inline-block group">
                {profileImageBase64 ? (
                  <img
                    src={profileImageBase64}
                    alt="Profile Avatar"
                    className="h-24 w-24 rounded-full object-cover border-4 border-brand-100 shadow-md mx-auto"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-blue-50 text-[#0A3D91] flex items-center justify-center text-2xl font-bold border-4 border-brand-100 mx-auto">
                    {profile?.name ? profile.name.substring(0, 2).toUpperCase() : 'U'}
                  </div>
                )}

                <label className="absolute bottom-0 right-0 bg-[#0A3D91] text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-brand-700 transition-colors">
                  <Camera size={14} />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm">{profile?.name}</h4>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">{profile?.role?.replace('ROLE_', '')}</p>
                <p className="text-xs text-brand-600 font-semibold mt-1">Click camera icon to upload profile picture</p>
              </div>

              <div className="border-t border-slate-50 pt-4 space-y-3 text-xs text-left">
                {profile?.facultyCode && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Faculty Code:</span>
                    <span className="font-bold text-slate-700">{profile.facultyCode}</span>
                  </div>
                )}
                {profile?.department && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Department:</span>
                    <span className="font-bold text-slate-700">{profile.department}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Username:</span>
                  <span className="font-bold text-slate-700">{profile?.username}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
