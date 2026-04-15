import React, { useEffect } from 'react'; // [--- FIX (1) ---] useEffect ko import karein
import { Link, useLocation, useNavigate} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

import {
  LuX,
  LuLayoutDashboard,
  LuScanLine,
  LuBot,
  LuWheat,
  LuFlaskConical,
  LuCloudy,
  LuHouse as LuHome,
  LuLogOut,
  LuTrendingUp,
} from 'react-icons/lu';

// Drawer Item Component (Ismein koi change nahi hai)
const DrawerItem = ({ icon, children, to, onClick }) => {
  const location = useLocation();
  const isActive = (to === '/') ? location.pathname === to : location.pathname.startsWith(to);

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`
        flex items-center p-3 my-1 rounded-lg cursor-pointer text-base
        transition-colors duration-200
        ${isActive
          ? 'bg-green-100 text-green-700 font-semibold'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      <span className="mr-4 text-xl text-green-600">{icon}</span>
      <span className="font-medium">{children}</span>
    </Link>
  );
};

function AppDrawer({ isOpen, toggleDrawer }) {
  const { t } = useTranslation();
  const supabaseClient = useSupabaseClient();
  const navigate = useNavigate();

  // [--- FIX (2): BACKGROUND SCROLL LOCK ---]
  // Yeh hook body par scroll lock/unlock karega
  useEffect(() => {
    if (isOpen) {
      // Drawer khula hai toh background scroll lock kar do
      document.body.style.overflow = 'hidden';
    } else {
      // Drawer band hai toh scroll waapis chalu kar do
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup function: Jab component unmount ho, tab scroll reset kar do
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]); // Yeh effect tab chalega jab 'isOpen' badlega
  // [--- END FIX ---]

  // [--- LOGOUT FIX (3) ---]
  // Logout function banayein
  const handleLogout = async () => {
    toggleDrawer(); // Drawer ko band karein
    await supabaseClient.auth.signOut();
    navigate('/login'); // User ko login page par bhej dein
  };

  return (
    <>
      {/* Overlay (Ismein koi change nahi) */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 md:hidden ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={toggleDrawer}
      ></div>

      {/* Drawer Panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50
          transform transition-transform duration-300 ease-in-out md:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Drawer Header (Ismein koi change nahi) */}
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-green-700">{t('drawer_all_features')}</h2>
          <button
            onClick={toggleDrawer}
            className="text-gray-500 hover:text-gray-800 p-1"
            aria-label="Close menu"
          >
            <LuX size={24} />
          </button>
        </div>

        {/* Navigation List */}
        {/* h-[calc(100vh-125px)] ko update kiya taaki neeche switcher ke liye jagah ban sake */}
        <nav className="p-4 overflow-y-auto h-[calc(100vh-125px)]">
          <ul>
            <DrawerItem icon={<LuHome />} to="/" onClick={toggleDrawer}>{t('nav_home_landing')}</DrawerItem>
            <DrawerItem icon={<LuLayoutDashboard />} to="/dashboard" onClick={toggleDrawer}>{t('nav_dashboard')}</DrawerItem>
            <DrawerItem icon={<LuScanLine />} to="/scan" onClick={toggleDrawer}>{t('nav_scan_crop')}</DrawerItem>
            <DrawerItem icon={<LuTrendingUp />} to="/mandi-prices" onClick={toggleDrawer}>{t('nav_mandi_prices')}</DrawerItem>
            <DrawerItem icon={<LuWheat />} to="/crop-recommendation" onClick={toggleDrawer}>{t('nav_recommend_crop')}</DrawerItem>
            <DrawerItem icon={<LuFlaskConical />} to="/fertilizer-advice" onClick={toggleDrawer}>{t('nav_recommend_fertilizer')}</DrawerItem>
            <DrawerItem icon={<LuCloudy />} to="/weather" onClick={toggleDrawer}>{t('nav_weather')}</DrawerItem>
            <DrawerItem icon={<LuBot />} to="/chat" onClick={toggleDrawer}>{t('nav_chat')}</DrawerItem>
            <DrawerItem icon={<LuLogOut />} to="#" onClick={handleLogout}>{t('nav_logout')}</DrawerItem>
          </ul>
        </nav>

        
      </aside>
    </>
  );
}

export default AppDrawer;