import React from 'react';
import { useTranslation } from 'react-i18next';
// [--- FIX ---]
// LanguageSwitcher ko yahaan se hata diya
// import LanguageSwitcher from './LanguageSwitcher'; 
// [--- END FIX ---]
import { LuBell, LuUser, LuLogOut } from "react-icons/lu"; 
import { Link, useNavigate } from 'react-router-dom';
import { useUserProfile } from '../Context/UserProvider';
import LanguageSwitcher from './LanguageSwitcher'; // [--- FIX (1) ---] LanguageSwitcher import karein
import { useSupabaseClient } from '@supabase/auth-helpers-react';


function Header() {
  const { t } = useTranslation(); 
  const { profile } = useUserProfile();
  const displayName = (profile && profile.full_name) ? profile.full_name : 'Farmer';
  const supabaseClient = useSupabaseClient();
  const navigate = useNavigate();


  // [--- LOGOUT FIX (3) ---]
  // Logout function banayein
  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    navigate('/'); // User ko login page par bhej dein
  };
  return (
    <header className="h-[70px] bg-white border-b border-gray-200 
                       flex items-center justify-between px-4 md:px-8 shadow-sm
                       z-10">
      
      {/* Greeting */}
      <div>
        <h2 className="text-lg md:text-xl font-bold text-gray-800 truncate">
          {t('welcomeMessage', { name: displayName })}
        </h2>
      </div>

      {/* User Profile Icons */}
      {/* [--- FIX ---] */}
      {/* 'space-x-4' ko 'space-x-2' kar diya */}
      <div className="flex items-center space-x-2 md:space-x-4">
      {/* [--- END FIX ---] */}
        
        <button className="p-2 text-gray-600 hover:text-gray-900">
          <LanguageSwitcher />
        </button>
        
        <Link 
          to="/edit-profile" 
          className="p-2 text-gray-600 hover:text-gray-900"
        >
          <LuUser size={24} />
        </Link>

        {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center p-3 w-full text-base transition-colors duration-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
          >
            <span className="mr-4 text-xl text-red-600"><LuLogOut /></span>
            
            <span className="font-medium">{t('nav_logout')}</span>
            
          </button>
        
        {/* [--- FIX ---] */}
        {/* LanguageSwitcher ko yahaan se poori tarah hata diya hai */}
        {/* [--- END FIX ---] */}
        
      </div>
    </header>
  );
}

export default Header;