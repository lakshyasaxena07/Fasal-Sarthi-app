import React from 'react';
import { useSessionContext } from '@supabase/auth-helpers-react';
import { Navigate } from 'react-router-dom';
import { LuLoader } from 'react-icons/lu';

// [--- FIX (1) ---]
// Hamara naya Profile Context hook import karein
import { useUserProfile } from '../Context/UserProvider';
// [--- END FIX ---]

function ProtectedRoute({ children }) {
  // Kadam 1: Auth data (session) aur loading state fetch karein
  const { session, isLoading: authLoading } = useSessionContext();
  
  // [--- FIX (2) ---]
  // Kadam 2: Profile data aur uski loading state fetch karein
  const { profile, profileLoading } = useUserProfile();
  // [--- END FIX ---]

  // [--- FIX (3) ---]
  // Kadam 3: Check karein ki auth YA profile, koi bhi load ho raha hai kya?
  if (authLoading || profileLoading) {
    // Jab tak dono load nahi ho jaate, spinner dikhayein
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-100">
        <LuLoader className="animate-spin text-4xl text-green-600" />
      </div>
    );
  }
  // [--- END FIX ---]

  // Kadam 4: Agar loading poori ho chuki hai aur session nahi hai (user logged-out)
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // [--- FIX (4) ---]
  // Kadam 5: Agar user logged-in hai (session hai)
  // LEKIN profile nahi bani hai (profile is null)
  if (session && !profile) {
    // User ko dashboard ke bajaaye 'create-profile' page par bhej do
    return <Navigate to="/create-profile" replace />;
  }
  // [--- END FIX ---]

  // Kadam 6: Agar user logged-in hai AUR profile bhi hai
  return children;
}

export default ProtectedRoute;