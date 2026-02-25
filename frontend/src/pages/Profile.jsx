import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { supabase } from '../config/supabase';
import { User, Lock, Camera, Check, AlertCircle, RefreshCw } from 'lucide-react';
import DashboardLayout from '../components/Layout/DashboardLayout';

const Profile = () => {
    const { user, setProfile } = useAuth();
    const fileInputRef = useRef(null);

    const [profileData, setProfileData] = useState({
        full_name: '',
        avatar_url: '',
        email: ''
    });
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [pwdLoading, setPwdLoading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [pwdMessage, setPwdMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await api.get('/users/profile');
            if (res.data.success) {
                setProfileData(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch profile', err);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please select a valid image file.' });
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image must be smaller than 2MB.' });
            return;
        }

        setAvatarUploading(true);
        setMessage({ type: '', text: '' });

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;
            const filePath = `avatars/${fileName}`;

            // Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            const avatarUrl = urlData.publicUrl;

            // Update profile in DB via backend API
            const res = await api.put('/users/profile', {
                full_name: profileData.full_name,
                avatar_url: avatarUrl
            });

            if (res.data.success) {
                const updatedData = { ...profileData, avatar_url: avatarUrl };
                setProfileData(updatedData);
                setProfile(prev => ({ ...prev, avatar_url: avatarUrl }));
                setMessage({ type: 'success', text: 'Profile picture updated!' });
            }
        } catch (err) {
            console.error('Avatar upload error:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to upload image. Make sure Supabase storage bucket "avatars" exists.' });
        } finally {
            setAvatarUploading(false);
            // Reset file input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await api.put('/users/profile', {
                full_name: profileData.full_name,
                avatar_url: profileData.avatar_url
            });
            if (res.data.success) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                // Sync to AuthContext so sidebar updates immediately
                setProfile(prev => ({
                    ...prev,
                    full_name: profileData.full_name,
                    avatar_url: profileData.avatar_url
                }));
            }
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPwdMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }
        if (passwordData.newPassword.length < 6) {
            setPwdMessage({ type: 'error', text: 'Password must be at least 6 characters' });
            return;
        }

        setPwdLoading(true);
        setPwdMessage({ type: '', text: '' });
        try {
            const res = await api.put('/users/change-password', {
                newPassword: passwordData.newPassword
            });
            if (res.data.success) {
                setPwdMessage({ type: 'success', text: 'Password changed successfully!' });
                setPasswordData({ newPassword: '', confirmPassword: '' });
            }
        } catch (err) {
            setPwdMessage({ type: 'error', text: err.response?.data?.error || 'Failed to change password' });
        } finally {
            setPwdLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">User Profile</h1>
                    <p className="text-slate-500">Manage your personal information and security settings.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Profile Information */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <User className="h-5 w-5 text-blue-600" />
                                </div>
                                <h2 className="font-semibold text-slate-800">Personal Information</h2>
                            </div>
                            <form onSubmit={handleProfileUpdate} className="p-6 space-y-4">
                                <div className="flex flex-col items-center sm:flex-row gap-6 mb-6">
                                    {/* Avatar with Camera Button */}
                                    <div className="relative group flex-shrink-0">
                                        <div className="h-24 w-24 rounded-full bg-slate-100 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                                            {profileData?.avatar_url ? (
                                                <img
                                                    src={profileData.avatar_url}
                                                    alt="Profile"
                                                    className="h-full w-full object-cover"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            ) : (
                                                <User className="h-12 w-12 text-slate-300" />
                                            )}
                                        </div>

                                        {/* Camera Icon Button */}
                                        <button
                                            type="button"
                                            onClick={handleAvatarClick}
                                            disabled={avatarUploading}
                                            className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 border-2 border-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 disabled:opacity-70"
                                            title="Upload profile picture"
                                        >
                                            {avatarUploading ? (
                                                <RefreshCw className="h-3.5 w-3.5 text-white animate-spin" />
                                            ) : (
                                                <Camera className="h-3.5 w-3.5 text-white" />
                                            )}
                                        </button>

                                        {/* Hidden file input */}
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileChange}
                                        />
                                    </div>

                                    <div className="flex-1 space-y-1 text-center sm:text-left">
                                        <h3 className="font-bold text-slate-900 text-lg">{profileData?.full_name || 'Your Name'}</h3>
                                        <p className="text-slate-500 text-sm">{profileData?.email || 'No email provided'}</p>
                                        <p className="text-xs text-slate-400">Click the camera icon to upload a photo</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
                                        <input
                                            type="text"
                                            value={profileData?.full_name || ''}
                                            onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                            placeholder="John Doe"
                                            required
                                        />
                                    </div>

                                </div>

                                {message.text && (
                                    <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                        {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                        <p className="text-sm font-medium">{message.text}</p>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-200 disabled:opacity-50 transition-all flex items-center gap-2"
                                    >
                                        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                                <div className="p-2 bg-amber-50 rounded-lg">
                                    <Lock className="h-5 w-5 text-amber-600" />
                                </div>
                                <h2 className="font-semibold text-slate-800">Security</h2>
                            </div>
                            <form onSubmit={handlePasswordChange} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>

                                {pwdMessage.text && (
                                    <div className={`p-4 rounded-xl flex items-center gap-3 ${pwdMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                        {pwdMessage.type === 'success' ? <Check className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                        <p className="text-sm font-medium">{pwdMessage.text}</p>
                                    </div>
                                )}

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={pwdLoading}
                                        className="w-full bg-slate-900 hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-slate-200 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                                    >
                                        {pwdLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Profile;
