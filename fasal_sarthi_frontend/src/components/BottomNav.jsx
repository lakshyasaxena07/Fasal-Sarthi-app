import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <-- 1. Naya import
import { LuLayoutDashboard, LuScanLine, LuWheat, LuMenu } from 'react-icons/lu';

// NavButton Component (Is component mein koi change nahi hai)
const NavButton = ({ icon, label, to, onClick }) => {
  const location = useLocation();
  const isActive = to && (location.pathname === to || (to !== '/' && location.pathname.startsWith(to)));

  const Tag = to ? Link : 'button';

  return (
    <Tag
      to={to}
      onClick={onClick}
      type={!to ? 'button' : undefined}
      className={`
        flex flex-col items-center justify-center w-full pt-1 pb-1
        transition-colors duration-200 group focus:outline-none focus:ring-1 focus:ring-green-400 rounded-md
        ${isActive
          ? 'text-green-600'
          : 'text-gray-500 hover:text-green-500'}
      `}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className={`text-2xl mb-0.5 transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}>
        {icon}
      </span>
      <span className={`text-[11px] font-medium ${isActive ? 'font-semibold' : ''}`}>
        {label} {/* Yahaan translated label aayega */}
      </span>
    </Tag>
  );
};

// --- Main BottomNav Component (Updated) ---
function BottomNav({ toggleDrawer }) {
  const { t } = useTranslation(); // <-- 2. Hook ka istemaal karein

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0
                   bg-white/90 backdrop-blur-sm border-t border-gray-200
                   flex justify-around items-center h-16 shadow-up z-50">

      {/* --- 3. Hardcoded labels ko t('key') se replace karein --- */}
      <NavButton icon={<LuLayoutDashboard />} label={t('nav_dashboard')} to="/dashboard" />
      <NavButton icon={<LuScanLine />} label={t('nav_scan_crop')} to="/scan" />
      <NavButton icon={<LuWheat />} label={t('nav_recommend_crop')} to="/crop-recommendation" />

      {/* "More" Button - Triggers the drawer */}
      <NavButton icon={<LuMenu />} label={t('nav_more')} onClick={toggleDrawer} />

    </nav>
  );
}

export default BottomNav;