import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@supabase/auth-helpers-react';
import { supabaseClient } from '../lib/supabaseClient';
// [--- CLOSE BUTTON FIX (1) ---]
// 'Link' ko import karein
import { useNavigate, Link } from 'react-router-dom';
import { 
  LuLeaf, LuLoader,LuTriangleAlert as LuAlertTriangle, LuUser, LuAtSign,LuCheck as LuCheckCircle, 
  LuX // 'X' icon ko import karein
} from 'react-icons/lu';
// [--- END FIX ---]
import { useUserProfile } from '../Context/UserProvider';

function EditProfilePage() {
  const { t } = useTranslation();
  const user = useUser();
  const navigate = useNavigate();
  const { profile, profileLoading } = useUserProfile();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setUsername(profile.username || '');
    }
  }, [profile]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!user) {
      setError("User not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({
          full_name: fullName,
          username: username,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
        setError(`Error: ${updateError.message}.`);
        setLoading(false);
        return;
      }

      console.log('Profile updated successfully!');
      setLoading(false);
      setSuccess(t('profile_update_success'));

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (err) {
      console.error('Profile update exception:', err);
      setError(t('login_error_network'));
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <LuLoader className="animate-spin text-4xl text-green-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <LuLeaf className="inline-block text-5xl text-green-600 mb-2" />
          <h1 className="text-3xl font-bold text-gray-800">
            {t('profile_edit_title')}
          </h1>
        </div>

        <form 
          onSubmit={handleUpdateProfile} 
          className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 relative"
        >
          <Link 
            to="/dashboard"
            aria-label="Close"
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <LuX size={24} />
          </Link>

          {error && (
            <div className="mb-4 flex items-center rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <LuAlertTriangle className="mr-2 h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-center rounded-lg bg-green-50 p-4 text-sm text-green-700">
              <LuCheckCircle className="mr-2 h-5 w-5" />
              <span>{success}</span>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile_label_email')}
            </label>
            <input
              type="email"
              id="email"
              value={user ? user.email : ''}
              disabled
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile_label_fullname')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <LuUser className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={t('profile_placeholder_fullname')}
              />
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              {t('profile_label_username')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <LuAtSign className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder={t('profile_placeholder_username')}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold shadow-md hover:bg-green-700 transition duration-300 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? <LuLoader className="animate-spin" /> : t('profile_button_update')}
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditProfilePage;