import React, { createContext, useState, useContext, useEffect } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { supabaseClient } from '../lib/supabaseClient'; // Hamara main supabase client

// 1. Naya context banayein
const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const user = useUser(); // Supabase auth user (sirf id/email deta hai)
  const [profile, setProfile] = useState(null); // Hamari 'profiles' table ka data
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    // Yeh function tab chalega jab user login karega (ya app load karega)
    const fetchProfile = async () => {
      if (user) {
        setProfileLoading(true);
        try {
          // Apni 'profiles' table se data fetch karo
          const { data, error } = await supabaseClient
            .from('profiles')
            .select('full_name, username') // Humein sirf yeh 2 column chahiye
            .eq('id', user.id) // Sirf usi row ko jiska id user id se match kare
            .single(); // Humein sirf ek row chahiye

          if (error && error.code !== 'PGRST116') {
            // PGRST116 ka matlab hai 'row nahi mili', jo ki error nahi hai
            console.error('Error fetching profile:', error);
          } else if (data) {
            // Agar data mila (profile bani hui hai), toh usse state mein save karo
            setProfile(data);
          } else {
            // Agar data 'null' hai (row nahi mili), iska matlab profile bani nahi hai
            setProfile(null);
          }
        } catch (e) {
          console.error('Exception fetching profile:', e);
        } finally {
          setProfileLoading(false);
        }
      } else {
        // Agar user logged-out hai, toh profile aur loading ko reset kar do
        setProfile(null);
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]); // Yeh useEffect 'user' ke badalne par dobara chalega

  const value = {
    profile, // User ka profile data (ya null)
    profileLoading, // Kya hum abhi profile fetch kar rahe hain?
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// 4. Ek custom hook banayein taaki data aasani se mil sake
export const useUserProfile = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProvider');
  }
  return context;
};