import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // <-- 1. Naya import
// import { useAuth } from '../context/AuthContext'; // <-- 2. Auth hook import karein
import { 
  LuLeaf, LuWheat, LuFlaskConical, 
  LuCloudRain, LuMessageSquare, LuUsers,
  LuGithub, LuLanguages // <-- 3. Language icon import karein
} from 'react-icons/lu';
// [--- SUPABASE AUTH ADDITION (1) ---]
// Purana AuthContext hook hatayein aur yeh naye Supabase hooks import karein
import { useUser } from '@supabase/auth-helpers-react';

// Temporary developer images (Ismein koi change nahi)
const developerImages = [
  '/Lakshya.jpg',
  '/Rounak_Jain.jpg',
  '/Shivam.jpg',
  '/Priyani.jpg'
];

function LandingPage() {
  // --- 4. Hooks ko initialize karein ---
  const { t, i18n } = useTranslation();

  // [--- SUPABASE AUTH ADDITION (2) ---]
  // useUser() hook se current user ki jaankari lein
  // Agar user login hai, toh 'user' object mein data hoga, varna yeh 'null' hoga
  const user = useUser();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // const getStartedLink = currentUser ? '/dashboard' : '/login';

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsDropdownOpen(false); // Dropdown ko band karein
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      {/* Navbar (Translated) */}
      <nav className="p-4 bg-white shadow-sm flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-green-700">🌿 {t('header_title')}</h1>
        <div className="flex items-center space-x-4">
          
          {/* --- 5. Language Switcher Dropdown --- */}
          <div className="relative inline-block text-left">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center justify-center rounded-md border border-gray-300 shadow-sm px-3 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <LuLanguages className="mr-2 h-5 w-5 text-gray-600" aria-hidden="true" />
              {i18n.language === 'hi' ? t('hindi_language') : t('english_language')}
              <svg className="-mr-1 ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {isDropdownOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="none">
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`w-full text-left block px-4 py-2 text-sm ${i18n.language === 'en' ? 'font-bold text-green-700' : 'text-gray-700'} hover:bg-gray-100`}
                  >
                    {t('english_language')}
                  </button>
                  <button
                    onClick={() => changeLanguage('hi')}
                    className={`w-full text-left block px-4 py-2 text-sm ${i18n.language === 'hi' ? 'font-bold text-green-700' : 'text-gray-700'} hover:bg-gray-100`}
                  >
                    {t('hindi_language')}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* [--- SUPABASE AUTH ADDITION (3) ---] */}
          {/* Yeh raha aapka fix: Ab hum 'user' variable se check karenge */}
          {user ? (
            // Agar user login hai, toh "Dashboard" dikhayein
            <Link 
              to="/dashboard" 
              className="text-green-600 hover:text-green-800 text-sm font-semibold"
            >
              {t('nav_dashboard')}
            </Link>
          ) : (
            // Agar user login nahi hai, toh "Login" dikhayein
            <Link 
              to="/login" 
              className="text-green-600 hover:text-green-800 text-sm font-semibold"
            >
              {t('nav_login')}
            </Link>
          )}

        </div>
      </nav>

      {/* --- 6. Baaki saare text ko t() se replace karein --- */}

      {/* Hero Section */}
      {/* Hero Section (Get Started Button ko update kiya gaya) */}
      <section className="relative bg-linear-to-r from-green-600 to-emerald-700 text-white py-20 md:py-32 text-center overflow-hidden">
        {/* ... (Background blobs) ... */}
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          <h2 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4">
            {t('home_hero_title')}
          </h2>
          <p className="text-lg md:text-xl font-light opacity-90 mb-8">
            {t('home_hero_description')}
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            
            {/* [--- SUPABASE AUTH ADDITION (4) ---] */}
            {/* Get Started button ko bhi smart bana diya */}
            <Link 
              to={user ? '/dashboard' : '/register'} // Agar login hai toh dashboard, varna register par
              className="bg-white text-green-700 hover:bg-gray-100 font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 w-full sm:w-auto"
            >
              {t('get_started_button')}
            </Link>

            <Link to="/about" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-green-700 font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-300 w-full sm:w-auto">
              {t('learn_more_button')}
            </Link>
          </div>
        </div>
      </section>

      {/* Core Services Section */}
      <section className="py-16 md:py-24 bg-gray-100 text-center px-4">
        <h3 className="text-3xl md:text-4xl font-bold mb-12 text-gray-800">{t('home_core_services')}</h3>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Service Card 1 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <LuLeaf className="text-5xl text-green-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">{t('home_feature1_title')}</h4>
            <p className="text-gray-600 mb-4">{t('home_feature1_description')}</p>
            <Link to="/scan" className="text-green-600 hover:text-green-800 font-semibold flex items-center justify-center">
              {t('home_analyze_crop_link')} <span className="ml-1 text-lg">›</span>
            </Link>
          </div>
          {/* Service Card 2 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <LuWheat className="text-5xl text-green-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">{t('nav_recommend_crop')}</h4>
            <p className="text-gray-600 mb-4">{t('home_feature2_description')}</p>
            <Link to="/crop-recommendation" className="text-green-600 hover:text-green-800 font-semibold flex items-center justify-center">
              {t('home_get_recs_link')} <span className="ml-1 text-lg">›</span>
            </Link>
          </div>
          {/* Service Card 3 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <LuFlaskConical className="text-5xl text-green-600 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">{t('nav_recommend_fertilizer')}</h4>
            <p className="text-gray-600 mb-4">{t('home_fert_desc')}</p>
            <Link to="/fertilizer-advice" className="text-green-600 hover:text-green-800 font-semibold flex items-center justify-center">
              {t('home_get_plan_link')} <span className="ml-1 text-lg">›</span>
            </Link>
          </div>
        </div>
      </section>

      {/* More Features Section */}
      <section className="py-16 md:py-24 bg-gray-50 text-center px-4">
        <h3 className="text-3xl md:text-4xl font-bold mb-12 text-gray-800">{t('home_more_features')}</h3>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature Card 1 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <LuCloudRain className="text-5xl text-blue-500 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">{t('nav_weather')}</h4>
            <p className="text-gray-600 mb-4">{t('home_feature3_description')}</p>
          </div>
          {/* Feature Card 2 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <LuMessageSquare className="text-5xl text-purple-500 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">{t('nav_chat')}</h4>
            <p className="text-gray-600 mb-4">{t('home_feature4_description')}</p>
            <Link to="/chat" className="text-purple-600 hover:text-purple-800 font-semibold flex items-center justify-center">
              {t('home_talk_to_sarthi_link')} <span className="ml-1 text-lg">›</span>
            </Link>
          </div>
          {/* Feature Card 3 */}
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <LuUsers className="text-5xl text-orange-500 mx-auto mb-4" />
            <h4 className="text-xl font-bold mb-2">{t('home_community_title')}</h4>
            <p className="text-gray-600 mb-4">{t('home_community_desc')}</p>
          </div>
        </div>
      </section>

      {/* Know the Developer Section */}
      <section className="py-16 md:py-24 bg-green-50 text-center px-4">
        <h3 className="text-3xl md:text-4xl font-bold mb-12 text-gray-800">{t('home_meet_team')}</h3>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Developer 1 */}
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <img src={developerImages[0]} alt="Developer 1" className="w-32 h-32 rounded-full object-cover mb-4 ring-4 ring-green-300" />
            <h4 className="text-xl font-bold mb-1">{t('team_name_1')}</h4>
            <p className="text-green-600 font-medium mb-2">{t('team_role_1')}</p>
            <p className="text-gray-600 text-sm">{t('team_desc_1')}</p>
            <a href="/" target='_blank' className="mt-3 text-gray-500 hover:text-gray-700"><LuGithub className="inline-block mr-1" /> GitHub</a>
          </div>
          {/* Developer 2 */}
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <img src={developerImages[1]} alt="Developer 2" className="w-32 h-32 rounded-full object-cover mb-4 ring-4 ring-green-300" />
            <h4 className="text-xl font-bold mb-1">{t('team_name_2')}</h4>
            <p className="text-green-600 font-medium mb-2">{t('team_role_2')}</p>
            <p className="text-gray-600 text-sm">{t('team_desc_2')}</p>
            <a href="/" target='_blank' className="mt-3 text-gray-500 hover:text-gray-700"><LuGithub className="inline-block mr-1" /> GitHub</a>
          </div>
          {/* Developer 3 */}
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <img src={developerImages[2]} alt="Developer 3" className="w-32 h-32 rounded-full object-cover mb-4 ring-4 ring-green-300" />
            <h4 className="text-xl font-bold mb-1">{t('team_name_3')}</h4>
            <p className="text-green-600 font-medium mb-2">{t('team_role_3')}</p>
            <p className="text-gray-600 text-sm">{t('team_desc_3')}</p>
            <a href="#" target='_blank' className="mt-3 text-gray-500 hover:text-gray-700"><LuGithub className="inline-block mr-1" /> GitHub</a>
          </div>
          {/* Developer 4 */}
          <div className="flex flex-col items-center p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
            <img src={developerImages[3]} alt="Developer 4" className="w-32 h-32 rounded-full object-cover mb-4 ring-4 ring-green-300" />
            <h4 className="text-xl font-bold mb-1">{t('team_name_4')}</h4>
            <p className="text-green-600 font-medium mb-2">{t('team_role_4')}</p>
            <p className="text-gray-600 text-sm">{t('team_desc_4')}</p>
            <a href="#" target='_blank' className="mt-3 text-gray-500 hover:text-gray-700"><LuGithub className="inline-block mr-1" /> GitHub</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-8 text-center text-sm">
        <p>{t('footer_rights')}</p>
      </footer>

      {/* Blob animation CSS (yeh index.css mein hona chahiye) */}
      {/* ... */}
    </div>
  );
}

export default LandingPage;