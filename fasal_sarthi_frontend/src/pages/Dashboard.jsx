import React, { useEffect, useState } from "react"; // <-- useEffect aur useState add karein
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useWeather } from "../Context/WeatherContext";
import { useUserProfile } from "../Context/UserProvider";
import { useMandiData } from "../Context/MandiProvider";
import {
  LuScanLine,
  LuChevronRight,
  LuLoader,
  LuTrendingUp, // Naya
  LuSun, // Naya
  LuCloudRain, // Naya
  LuZap, // Naya
  LuCloudSun, // Naya
} from "react-icons/lu";

// --- Kadam 1: Actionable Weather Card Logic ---

// Ek helper function jo weather data ko "salah" mein badalta hai
const getWeatherAdvice = (weatherData, t) => {
  if (!weatherData) {
    return {
      icon: LuCloudSun,
      color: "text-gray-500",
      message: t("weather_advice_default"), // "Mausam ki jaankari laayi jaa rahi hai..."
    };
  }

  const { description, temperature, rain_1h } = weatherData;

  // 1. Baarish ya Toofaan
  if (description.includes("storm")) {
    return {
      icon: LuZap,
      color: "text-red-500",
      message: t("weather_advice_storm"), // "Toofaan ki chetavni! Surakshit rahein."
    };
  }
  if (description.includes("rain") || (rain_1h && rain_1h > 0)) {
    return {
      icon: LuCloudRain,
      color: "text-blue-500",
      message: t("weather_advice_rain"), // "Baarish ho rahi hai. Spray na karein."
    };
  }

  // 2. Garmi
  if (description.includes("clear") && temperature > 30) {
    return {
      icon: LuSun,
      color: "text-orange-500",
      message: t("weather_advice_clear_hot"), // "Mausam saaf aur garam hai. Sinchaai ka dhyaan rakhein."
    };
  }

  // 3. Achha Mausam
  if (description.includes("clear") || description.includes("clouds")) {
    return {
      icon: LuSun,
      color: "text-green-500",
      message: t("weather_advice_clear_good"), // "Mausam saaf hai. Kheti ke liye achha din hai."
    };
  }

  // Default
  return {
    icon: LuCloudSun,
    color: "text-gray-500",
    message: t("weather_advice_default"),
  };
};

// --- Main Dashboard Component ---
function Dashboard() {
  // --- Section 1: Hooks ---
  const { t } = useTranslation();
  const { profile } = useUserProfile();
  const {
    weatherData,
    isLoading: isWeatherLoading,
    error: weatherError,
    selectedCity,
  } = useWeather();
  const { mandiData, isMandiLoading } = useMandiData();

  // --- Section 2: Logic and Data Fetching ---

  // User ka naam set karna
  const displayName =
    profile && profile.full_name ? profile.full_name : "Farmer";

  // Actionable Weather salah generate karna
  const weatherAdvice = getWeatherAdvice(weatherData, t);

  // Naya Effect: Page load hote hi Mandi bhaav fetch karein

  // --- Section 3: UI Rendering ---
  return (
    // [UI FIX] Naya gradient background
    <main className="flex-1 p-4 md:p-8 bg-linear-to-b from-white to-green-50 overflow-y-auto pb-20 md:pb-8">
      {/* --- 1. Welcome Message --- */}
      <h2 className="text-3xl font-bold text-gray-800 mb-6">
        {t("welcomeMessage", { name: displayName })}
      </h2>

      {/* --- 2. Main Action Card (Scan) --- */}
      {/* Yeh card perfect hai, isse nahi badlenge */}
      <div
        className="bg-linear-to-r from-green-600 to-green-800
                      text-white p-8 rounded-2xl shadow-xl
                      flex flex-col md:flex-row items-center justify-between mb-8"
      >
        <div>
          <h3 className="text-3xl font-bold mb-2">
            {t("home_feature1_title")}
          </h3>
          <p className="text-lg text-green-100 mb-4 md:mb-0">
            {t("home_feature1_description")}
          </p>
        </div>
        <Link
          to="/scan"
          className="bg-white text-green-700 font-bold 
                     py-3 px-6 rounded-lg shadow-md
                     flex items-center transition-transform duration-200 hover:scale-105"
        >
          <LuScanLine className="mr-2" />
          {t("scan_now_button")}
        </Link>
      </div>

      {/* --- 3. Widgets Grid (Weather & Mandi) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* --- NAYA ACTIONABLE WEATHER WIDGET --- */}
        <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-xl font-semibold text-gray-800 mb-4">
              {t("nav_weather")}
            </h4>

            {/* Loading State */}
            {isWeatherLoading && (
              <div className="flex items-center text-gray-500">
                <LuLoader className="animate-spin mr-2" />{" "}
                {t("loading_message")}...
              </div>
            )}

            {/* Error State */}
            {weatherError && !isWeatherLoading && (
              <p className="text-red-500 text-sm">
                {t("weather_fetch_error")} {selectedCity}.
              </p>
            )}

            {/* --- NAYA ACTIONABLE DATA --- */}
            {weatherData && !isWeatherLoading && (
              <div className="space-y-3">
                {/* 1. Salah (Advice) */}
                <div className="flex items-center space-x-3">
                  <weatherAdvice.icon
                    size={28}
                    className={weatherAdvice.color}
                  />
                  <p className="text-lg font-semibold text-gray-800">
                    {weatherAdvice.message}
                  </p>
                </div>
                {/* 2. Asli Data (chhota karke) */}
                <div className="pl-11">
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(weatherData.temperature)}°C
                  </p>
                  <p className="text-gray-500 capitalize">
                    {weatherData.city} (
                    {t(weatherData.description, {
                      defaultValue: weatherData.description,
                    })}
                    )
                  </p>
                </div>
              </div>
            )}
            {/* --- END NAYA ACTIONABLE DATA --- */}
          </div>

          <Link
            to="/weather"
            className="text-green-600 font-semibold mt-4 inline-flex items-center self-start"
          >
            {t("dashboard_view_all_tasks")} <LuChevronRight className="ml-1" />
          </Link>
        </div>

        {/* --- NAYA MANDI PRICE WIDGET --- */}
        <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-xl font-semibold text-gray-800 mb-4">
              {t("nav_mandi_prices")} (Wheat)
            </h4>

            {/* Loading State */}
            {isMandiLoading && (
              <div className="flex items-center text-gray-500">
                <LuLoader className="animate-spin mr-2" /> {t("mandi_loading")}
                ...
              </div>
            )}

            {/* Error/No Data State */}
            {!mandiData && !isMandiLoading && (
              <p className="text-red-500 text-sm">
                {t("mandi_no_results_title")}
              </p>
            )}

            {/* Data State */}
            {mandiData && !isMandiLoading && (
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <LuTrendingUp size={28} className="text-green-500" />
                  <p className="text-lg font-semibold text-gray-800">
                    {mandiData.mandi}
                  </p>
                </div>
                <div className="pl-11">
                  <p className="text-2xl font-bold text-green-700">
                    ₹ {mandiData.price}
                  </p>
                  <p className="text-gray-500 capitalize">
                    {t("mandi_tbl_date")}: {mandiData.date}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Link
            to="/mandi-prices"
            className="text-green-600 font-semibold mt-4 inline-flex items-center self-start"
          >
            {t("dashboard_view_all_tasks")} <LuChevronRight className="ml-1" />
          </Link>
        </div>
      </div>

      {/* --- Community Feed (Hata Diya) --- */}
    </main>
  );
}

export default Dashboard;
