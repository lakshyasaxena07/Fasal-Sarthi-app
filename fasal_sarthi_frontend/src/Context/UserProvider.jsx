import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { supabaseClient } from '../lib/supabaseClient';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const user = useUser();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    try {
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('full_name, username')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data);
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error('Exception fetching profile:', e);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfileState = useCallback((newProfileData) => {
    setProfile(newProfileData);
    setProfileLoading(false);
  }, []);

  const value = {
    profile,
    profileLoading,
    refreshProfile: fetchProfile,
    updateProfileState,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserProfile = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProvider');
  }
  return context;
};