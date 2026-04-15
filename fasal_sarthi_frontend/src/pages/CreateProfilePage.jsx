import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUser } from '@supabase/auth-helpers-react';
import { supabaseClient } from '../lib/supabaseClient';
import { useNavigate, Navigate } from 'react-router-dom'; // 'Navigate' ko import karein
import { LuLeaf, LuLoader,LuTriangleAlert as LuAlertTriangle, LuUser, LuAtSign } from 'react-icons/lu';

// [--- FIX ---]
// Profile context ko import karein
import { useUserProfile } from '../Context/UserProvider'; 
// [--- END FIX ---]

function CreateProfilePage() {
  const { t } = useTranslation();
  const user = useUser();
  const navigate = useNavigate();

  // [--- FIX ---]
  // Profile data fetch karein
  const { profile, profileLoading } = useUserProfile();
  // [--- END FIX ---]

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user) {
      setError("User not found. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      const { error: insertError } = await supabaseClient
        .from('profiles')
        .insert({
          id: user.id,
          full_name: fullName,
          username: username,
        });

      if (insertError) {
        console.error('Error creating profile:', insertError);
        setError(`Error: ${insertError.message}. Try a different username.`);
        setLoading(false);
        return;
      }

      console.log('Profile created successfully!');
      setLoading(false);
      
      // Page ko reload karein taaki naya profile data fetch ho
      // aur ProtectedRoute usse dashboard par bhej de
      window.location.reload();

    } catch (err) {
      console.error('Profile creation exception:', err);
      setError(t('login_error_network'));
      setLoading(false);
    }
  };

  // [--- FIX ---]
  // Safety check: Agar profile load ho rahi hai, toh spinner dikhayein
  if (profileLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <LuLoader className="animate-spin text-4xl text-green-600" />
      </div>
    );
  }

  // Safety check: Agar profile pehle se bani hui hai,
  // toh user ko yahaan nahi hona chahiye. Dashboard par bhej do.
  if (profile) {
    return <Navigate to="/dashboard" replace />;
  }
  // [--- END FIX ---]

  // Agar profile nahi hai, tabhi form dikhayein
  // [--- FIX ---]
  // Sabhi hardcoded text ko t() se replace kiya
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <LuLeaf className="inline-block text-5xl text-green-600 mb-2" />
          <h1 className="text-3xl font-bold text-gray-800">
            {t('header_title')}
          </h1>
          <p className="text-gray-600">{t('profile_create_welcome')}</p>
        </div>

        <form 
          onSubmit={handleSubmitProfile} 
          className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200"
        >
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">
            {t('profile_create_title')}
          </h2>

          {error && (
            <div className="mb-4 flex items-center rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <LuAlertTriangle className="mr-2 h-5 w-5" />
              <span>{error}</span>
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
            {loading ? (
              <LuLoader className="animate-spin" />
            ) : (
              t('profile_button_save')
            )}
          </button>
        </form>
      </div>
    </div>
  );
  // [--- END FIX ---]

}

export default CreateProfilePage;