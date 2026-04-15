// src/pages/WeatherPage.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // <-- 1. Naya import
import { useWeather } from '../Context/WeatherContext';
import {
  LuSearch, LuLoader, LuTriangleAlert as LuAlertTriangle,
  LuWind, LuDroplet, LuMapPin,
  LuSunrise, LuSunset, LuEye, LuGauge, LuCloud, LuNavigation, LuUmbrella
} from 'react-icons/lu';

// Helper function (Ismein koi change nahi)
const getWindDirectionRotation = (deg) => {
  if (typeof deg !== 'number') return 'rotate(180deg)';
  return `rotate(${deg}deg)`;
};

// --- Detail Item Component (Translated) ---
const DetailItem = ({ icon, label, value, unit }) => {
  const { t } = useTranslation(); // <-- Hook ko yahaan use karein
  return (
    <div className="bg-linear-to-br from-skyblue-200 to-blue-800 rounded-xl backdrop-blur-md p-4 text-center flex flex-col justify-center h-full shadow-lg font-extrabold ">
      <div className="text-2xl mb-2 opacity-80 flex justify-center">{icon}</div>
      <div>
        <p className="font-bold text-lg leading-tight">
          {value !== null && value !== undefined ? value : '--'}
          {unit && (value !== null && value !== undefined) ? <span className="text-xs opacity-70 ml-1">{unit}</span> : ''}
        </p>
        <p className="text-xs opacity-70 uppercase tracking-wide mt-1">
          {t(label)} {/* Label ko translate karein (yeh 'humidity', 'wind_speed' jaisi keys hongi) */}
        </p>
      </div>
    </div>
  );
};


// --- Main Weather Page Component (Translated) ---
function WeatherPage() {
  const { t } = useTranslation(); // <-- 2. Main hook ko yahaan use karein
  const [searchCity, setSearchCity] = useState('');
  const { weatherData, isLoading, error: contextError, fetchWeather, selectedCity } = useWeather();
  const [geoError, setGeoError] = useState(null);

  // Handle manual city search
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchCity.trim()) return;
    setGeoError(null);
    fetchWeather(searchCity);
  };

  // Handle automatic location detection (Translated errors)
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError(t('weather_error_geolocation_not_supported'));
      return;
    }
    setGeoError(null);
    setSearchCity('');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeather({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (geoErr) => {
        console.error("Geolocation error:", geoErr);
        setGeoError(t('weather_error_geolocation_failed', { message: geoErr.message }));
      }
    );
  };

  const displayError = contextError || geoError;

  return (
    <main 
      className="flex-1 flex flex-col bg-linear-to-br from-emerald-100 to-green-200 overflow-hidden pb-20 md:pb-8 overflow-y-auto"
      style={{
        backgroundImage:`url(/Weather.jpg)`,
        opacity:1.5,
        backgroundSize:'cover',
        backgroundPosition:'center'
      }}
    >

      {/* Search Section (Translated) */}
      <div className="relative p-4 md:p-6 top-0 z-10 border-b backdrop-blur-md shadow-sm">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="grow flex space-x-2">
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              placeholder={t('weather_search_placeholder')} 
              className="flex-1 w-full px-5 py-3 bg-white rounded-full shadow border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-full shadow flex items-center justify-center transition-colors disabled:bg-black"
              disabled={isLoading || !searchCity.trim()}
              aria-label={t('weather_search_aria_label')}
            >
              {isLoading && !geoError ? <LuLoader className="animate-spin text-xl" /> : <LuSearch className="text-xl"/>}
            </button>
          </form>
          <button
            onClick={handleDetectLocation}
            className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow flex items-center justify-center transition-colors disabled:bg-gray-400 whitespace-nowrap"
            disabled={isLoading}
            aria-label={t('weather_detect_aria_label')}
          >
            <LuMapPin className="text-xl" />
            <span className="sm:hidden ml-2">{t('weather_detect_button_mobile')}</span>
            <span className="hidden sm:inline ml-2">{t('weather_detect_button_desktop')}</span>
          </button>
        </div>
        {geoError && <p className="text-red-600 text-xs mt-2 text-center max-w-xl mx-auto">{geoError}</p>}
      </div>

      {/* --- Main Weather Display Area (Translated) --- */}
      <div className="flex-1 flex flex-col items-center p-4 md:p-6 text-gray-800">

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12 flex flex-col items-center">
            <LuLoader className="animate-spin text-4xl text-green-600" />
            <p className="mt-4 text-gray-600">{t('weather_loading_data')}</p>
          </div>
        )}

        {/* Error Display */}
        {displayError && !isLoading && (
          <div className="max-w-md w-full mx-auto mt-6 p-4 bg-red-50 border border-red-200 rounded-lg shadow">
            <div className="flex items-center gap-2 text-red-600">
              <LuAlertTriangle className="text-xl shrink-0"/>
              <p className="text-sm font-medium">{displayError}</p>
            </div>
          </div>
        )}

        {/* Success State (Weather Data) (Translated) */}
        {weatherData && !isLoading && (
          <div className="animate-fadeIn w-full max-w-2xl mx-auto">
            {/* Main Weather Card */}
            <div className="bg-linear-to-br from-skyblue-200 to-blue-800 rounded-3xl p-6 text-white shadow-xl backdrop-blur-md relative overflow-hidden">
              {weatherData.icon_url && (
                <img
                  src={weatherData.icon_url}
                  alt={weatherData.description}
                  className="w-24 h-24 absolute -top-4 -right-4 opacity-80"
                />
              )}
              <div className="text-center mb-6 relative z-1">
                <h2 className="text-3xl font-bold mb-1">{weatherData.city}, {weatherData.country}</h2>
                <p className="text-lg opacity-90 capitalize">
                  {/* Weather description ko translate karne ki koshish karein */}
                  {t(`weather_desc_${weatherData.description?.toLowerCase().replace(/ /g, '_')}`, { defaultValue: weatherData.description || 'Weather information' })}
                </p>
                <div className="text-6xl font-light my-4">
                  {weatherData.temperature !== null && weatherData.temperature !== undefined ? `${Math.round(weatherData.temperature)}°C` : '--'}
                </div>
                <div className="flex justify-center items-center gap-4 text-sm opacity-80">
                   <span>{t('weather_feels_like')}: {weatherData.feels_like !== null && weatherData.feels_like !== undefined ? `${Math.round(weatherData.feels_like)}°` : '--'}</span>
                   <span>{t('weather_high')}: {weatherData.temp_max !== null && weatherData.temp_max !== undefined ? `${Math.round(weatherData.temp_max)}°` : '--'}</span>
                   <span>{t('weather_low')}: {weatherData.temp_min !== null && weatherData.temp_min !== undefined ? `${Math.round(weatherData.temp_min)}°` : '--'}</span>
                </div>
              </div>
            </div>

            {/* Weather Details Grid (Translated) */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 bg-linear-to-br">
               <DetailItem icon={<LuWind/>} label="weather_wind_speed" value={weatherData.wind_speed} unit="m/s" />
               <DetailItem icon={<LuDroplet/>} label="weather_humidity" value={weatherData.humidity} unit="%" />
               <DetailItem icon={<LuGauge/>} label="weather_pressure" value={weatherData.pressure} unit="hPa" />
               <DetailItem icon={<LuEye/>} label="weather_visibility" value={weatherData.visibility} unit="km" />
               <DetailItem icon={<LuCloud/>} label="weather_clouds" value={weatherData.clouds} unit="%" />
               {/* Combine Sunrise/Sunset */}
               <div className="bg-linear-to-br from-green-500 to-emerald-600 backdrop-blur-md p-4 rounded-lg text-center flex flex-col justify-between h-full shadow-lg text-white col-span-2 md:col-span-1">
                 <div className="flex justify-around items-center h-full">
                   <div className="text-center">
                     <LuSunrise className="mx-auto text-2xl mb-1 opacity-80" />
                     <p className="font-bold text-lg leading-tight">{weatherData.sunrise ?? '--'}</p>
                     <p className="text-xs opacity-70 uppercase tracking-wide mt-1">{t('weather_sunrise')}</p>
                   </div>
                   <div className="text-center">
                     <LuSunset className="mx-auto text-2xl mb-1 opacity-80" />
                     <p className="font-bold text-lg leading-tight">{weatherData.sunset ?? '--'}</p>
                     <p className="text-xs opacity-70 uppercase tracking-wide mt-1">{t('weather_sunset')}</p>
                   </div>
                 </div>
               </div>
               {/* Conditionally show rain */}
               {weatherData.rain_1h > 0 && (
                 <DetailItem icon={<LuUmbrella/>} label="weather_rain_1h" value={weatherData.rain_1h} unit=" mm" />
               )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default WeatherPage;