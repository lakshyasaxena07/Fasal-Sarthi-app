import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LuLayoutDashboard, 
  LuScanLine, 
  LuHeartPulse, 
  LuBot, 
  LuCloudy, 
  LuSettings, 
  LuWheat, 
  LuFlaskConical,
  LuTrendingUp // [--- MANDI FIX (1) ---] Naya icon import karein
} from "react-icons/lu";
import { useTranslation } from 'react-i18next';

// NavItem component (Ismein koi change nahi hai)
const NavItem = ({ icon, children, to }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className={`
      flex items-center p-3 my-1 rounded-lg cursor-pointer
      transition-colors duration-200
      ${isActive
        ? 'bg-green-100 text-green-700 font-semibold'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
      }
    `}>
      <span className="mr-3 text-xl text-green-600">{icon}</span>
      <span className="font-medium">{children}</span>
    </Link>
  );
};

function Sidebar() {
  const { t } = useTranslation();
  return (
    <aside className="hidden  md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
      <div className="p-5 border-b sticky top-0  border-gray-200">
        <Link to='/'>
        <h1 className="text-2xl font-bold text-green-700 text-center cursor-pointer">
          🌿 {t('header_title')}
        </h1>
        </Link>
      </div>
      <nav className="grow p-4 mt-15 fixed ">
        <ul>
          <NavItem icon={<LuLayoutDashboard />} to="/dashboard">
            {t('nav_dashboard')}
          </NavItem>
          <NavItem icon={<LuScanLine />} to="/scan">
            {t('nav_scan_crop')}
          </NavItem>
          
          {/* [--- MANDI FIX (2) ---] */}
          {/* Naya Mandi Bhaav link add karein */}
          <NavItem icon={<LuTrendingUp />} to="/mandi-prices">
            {t('nav_mandi_prices')}
          </NavItem>
          {/* [--- END FIX ---] */}
          
          {/* <NavItem icon={<LuHeartPulse />} to="/my-crops"> ... </NavItem> */}
          <NavItem icon={<LuWheat />} to="/crop-recommendation">
            {t('nav_recommend_crop')}
          </NavItem>
          <NavItem icon={<LuFlaskConical />} to="/fertilizer-advice">
            {t('nav_recommend_fertilizer')}
          </NavItem>
          <NavItem icon={<LuCloudy />} to="/weather">
            {t('nav_weather')}
          </NavItem>
          <NavItem icon={<LuBot />} to="/chat">
            {t('nav_chat')}
          </NavItem>
          
          <li className="mt-10 border-t border-gray-200"></li>
          <NavItem icon={<LuSettings />} to="/settings">
            {t('nav_settings')}
          </NavItem>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;