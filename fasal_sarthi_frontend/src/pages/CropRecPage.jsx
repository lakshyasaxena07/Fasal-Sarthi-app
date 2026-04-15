// src/pages/CropRecPage.jsx
import React, { useState } from "react";
import { useTranslation } from 'react-i18next'; // <-- Naya import
import axios from "../api/axiosInstance";
import i18n from '../i18n'; // <-- i18n import karein
import { useSoilData } from '../Context/SoilProvider';

import ReactMarkdown from "react-markdown"; // For formatting AI advice
import {
  LuWheat,
  LuLoader,
  LuTriangleAlert as LuAlertTriangle,
  LuSearch,
  LuClipboardList,
  LuCloudSunRain,
  LuMapPin,
  LuAtom,
  LuDroplet,
  LuThermometer, // Ensure LuThermometer is imported
  LuSparkles,
  LuCheck, // Added Check icon
} from "react-icons/lu";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Reusable Input Field Component (Translated) ---
const InputField = ({
  icon,
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "number",
  required = true,
}) => {
  const { t } = useTranslation(); // <-- Hook ko yahaan use karein
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-600 mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {icon || <LuAtom size={16} />}
        </div>
        <input
          type={type}
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 border border-gray-200 text-gray-700"
          placeholder={t(placeholder)} /* Placeholder ko translate karein */
          required={required}
          step={type === "number" ? "any" : undefined}
        />
      </div>
    </div>
  );
};

// --- Reusable Select Field Component (Translated) ---
const SelectField = ({
  icon,
  label,
  name,
  value,
  onChange,
  options,
  required = true,
}) => {
  const { t } = useTranslation(); // <-- Hook ko yahaan use karein
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-600 mb-1"
      >
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {icon || <LuMapPin size={16} />}
        </div>
        <select
          name={name}
          id={name}
          value={value}
          onChange={onChange}
          className="w-full pl-10 pr-10 py-2.5 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 border border-gray-200 appearance-none text-gray-700"
          required={required}
        >
          <option value="" disabled>
            {t('crop_rec_select_placeholder')} {/* Placeholder ko translate karein */}
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {t(`crop_rec_option_${option.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, option)} {/* Options ko translate karein */}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

// --- Result Display Components (Translated) ---
const LoadingIndicator = () => {
  const { t } = useTranslation(); // <-- Hook ko yahaan use karein
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-xl shadow-md border border-gray-100 animate-pulse">
      <LuLoader className="animate-spin text-4xl text-green-500 mb-4" />
      <p className="text-gray-600 font-medium">{t('crop_rec_loading_crop')}</p>
    </div>
  );
};

const ErrorDisplay = ({ message }) => {
  const { t } = useTranslation(); // <-- Hook ko yahaan use karein
  return (
    <div className="p-6 rounded-xl shadow-md border border-red-200 bg-red-50">
      <div className="flex items-center">
        <LuAlertTriangle className="text-3xl text-red-500 mr-4 shrink-0" />
        <div>
          <h3 className="text-lg font-bold text-red-700">{t('crop_rec_error_title')}</h3>
          <p className="text-red-600 text-sm mt-1">
            {message || t('crop_rec_error_unknown')}
          </p>
        </div>
      </div>
    </div>
  );
};

const ResultCard = ({ crop, onGetAdvice, isAdviceLoading }) => {
  const { t } = useTranslation(); // <-- Hook ko yahaan use karein
  return (
    <div className="bg-linear-to-br from-green-500 to-emerald-600 p-4 lg:max-h-[220px] rounded-xl shadow-xl animate-fadeIn text-white text-center space-y-1">
      <div>
        <LuWheat className="mx-auto text-6xl opacity-80 mb-2" />
        <h3 className="text-md font-medium opacity-90">{t('crop_rec_recommended_crop')}:</h3>
        <p className="text-4xl font-bold capitalize mt-1 tracking-tight">
          {crop}
        </p>
      </div>
      <button
        onClick={onGetAdvice}
        disabled={isAdviceLoading}
        className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold py-2.5 px-5 rounded-lg shadow-md flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isAdviceLoading ? (
          <LuLoader className="animate-spin text-xl" />
        ) : (
          <>
            <LuSparkles className="mr-2" /> {t('crop_rec_get_advice_button')}
          </>
        )}
      </button>
    </div>
  );
};

const AdviceCard = ({ advice, isLoading }) => {
  const { t } = useTranslation(); // <-- Hook ko yahaan use karein
  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 animate-fadeIn h-full flex flex-col">
      <div className="flex items-center mb-3 text-green-700">
        <LuSparkles className="text-xl mr-2 shrink-0" />
        <h4 className="text-lg font-semibold ">{t('crop_rec_sarthi_advice_title')}</h4>
      </div>
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <LuLoader className="animate-spin text-2xl mr-2" /> {t('crop_rec_fetching_advice')}
        </div>
      ) : (
        // Make this div scrollable
        <div className="prose prose-sm max-w-none text-gray-700 overflow-y-auto flex-1 pr-2">
          <ReactMarkdown>{advice || t('crop_rec_no_advice_yet')}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

const PlaceholderCard = () => {
  const { t } = useTranslation(); // <-- Hook ko yahaan use karein
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-linear-to-br from-gray-100 to-blue-50 rounded-xl shadow-md border border-gray-200">
      <LuClipboardList className="text-6xl text-gray-400 mb-4" />
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        {t('crop_rec_placeholder_title')}
      </h3>
      <p className="text-gray-500 max-w-xs">
        {t('crop_rec_placeholder_desc')}
      </p>
    </div>
  );
};

// --- Main Crop Recommendation Page ---
function CropRecPage() {
  const { t } = useTranslation(); // <-- Main hook ko yahaan use karein

  // Options matching backend (Use the final lists from Colab)
  const soilTypeOptions = [
    "Black (Vertisol)",
    "Laterite",
    "Loamy",
    "Red",
    "Sandy",
  ];
  const irrigationTypeOptions = [
    "Drip",
    "Groundwater",
    "Mixed",
    "Rainfed",
    "Sprinkler",
  ];
  const previousCropOptions = [
    "Dal",
    "Fallow",
    "Ganna",
    "Makka",
    "Moongfali",
    "Rice",
    "Sarson",
    "Wheat",
    "Other",
  ];

  // State
  // const [soilData, setsoilData] = useState({
  //   soil_ph: "",
  //   nitrogen_kg_ha: "",
  //   phosphorus_kg_ha: "",
  //   potassium_kg_ha: "",
  //   annual_rainfall_mm: "",
  //   avg_temp_c: "",
  //   avg_humidity_pct: "",
  //   soil_type: "",
  //   irrigation_type: "",
  //   previous_crop: "",
  // });


  // [--- SOIL CONTEXT FIX (2) ---]
  // Purane local 'soilData' state ko hata dein
  // const [soilData, setsoilData] = useState({ ... }); // <-- YEH LINE DELETE KAR DI
  
  // Naye shared context se data aur updater function lein
  const { soilData, updateSoilData } = useSoilData();
  // [--- END FIX ---]


  const [result, setResult] = useState(null); // Recommended crop name
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Loading for crop rec
  const [aiAdvice, setAiAdvice] = useState(null); // State for AI advice
  const [isAdviceLoading, setIsAdviceLoading] = useState(false); // Loading for AI advice

// [--- SOIL CONTEXT FIX (3) ---]
  // Naya 'handleChange' function jo seedha context ko update karega
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateSoilData(name, value); // 'setsoilData' ke bajaaye 'updateSoilData'
  };
  // [--- END FIX ---]


  // Handlers
  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setsoilData((prev) => ({ ...prev, [name]: value }));
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);
    setAiAdvice(null); // Reset AI advice on new crop search
    setIsAdviceLoading(false);

    // const payload = {
    //   soil_type: soilData.soil_type,
    //   irrigation_type: soilData.irrigation_type,
    //   previous_crop:
    //     soilData.previous_crop === "Other" ? "Unknown" : soilData.previous_crop,
    // };

    // [--- SOIL CONTEXT FIX (4) ---]
    // Ab 'soilData' ke bajaaye 'soilData' se payload banayein
    const payload = {
      soil_type: soilData.soil_type,
      irrigation_type: soilData.irrigation_type,
      previous_crop:
        soilData.previous_crop === "Other" ? "Unknown" : soilData.previous_crop,
    };
    // [--- END FIX ---]
    
    const numericalKeys = [
      "soil_ph",
      "nitrogen_kg_ha",
      "phosphorus_kg_ha",
      "potassium_kg_ha",
      "annual_rainfall_mm",
      "avg_temp_c",
      "avg_humidity_pct",
    ];
    let formValid = true;

    for (const key of numericalKeys) {
      // [--- SOIL CONTEXT FIX (5) ---]
      // Ab 'soilData' ke bajaaye 'soilData' se validate karein
      const value = parseFloat(soilData[key]);
      // [--- END FIX ---]
      if (isNaN(value)) {
        setError(t('crop_rec_error_invalid_input', { key: t(`crop_rec_label_${key}`) }));
        formValid = false;
        break;
      }
      payload[key] = value;
    }

    if (
      !soilData.soil_type ||
      !soilData.irrigation_type ||
      !soilData.previous_crop
    ) {
    // [--- END FIX ---]
      setError(t('crop_rec_error_select_options'));
      formValid = false;
    }

    if (!formValid) {
      setIsLoading(false);
      return;
    }

    try {
      console.log("Sending payload:", payload);
      const response = await axios.post(
        `${API_BASE_URL}/recommend_crop`,
        payload
      );
      setResult(response.data.recommended_crop);
    } catch (err) {
      console.error("Crop Rec API Error:", err);
      const errorMsg =
        err.response?.data?.error ||
        t('crop_rec_error_recommendation_failed'); // Translated error
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handler: Get Farming Advice from Sarthi AI ---
  const handleGetAdvice = async () => {
    if (!result) return;

    setIsAdviceLoading(true);
    setError(null);
    setAiAdvice(null);

    // 3. Prompt ko t() function se generate karein
    const prompt = t('crop_rec_advice_prompt', { cropName: result });
    
    // 4. Current language ko fetch karein
    const currentLanguage = i18n.language; // Yeh 'en' ya 'hi' dega

    try {
      // 5. API call mein 'language' aur 'message' (translated prompt) bhejें
      const response = await axios.post(`${API_BASE_URL}/sarthi_ai_chat`, {
        message: prompt,
        language: currentLanguage // <-- Naya data bhej rahe hain
      });
      setAiAdvice(response.data.response);
    } catch (err) {
      console.error("AI Advice API Error:", err);
      setError(t('crop_rec_error_advice_fetch')); // Yeh key pehle se hai
      setAiAdvice(null);
    } finally {
      setIsAdviceLoading(false);
    }
  };

  return (
    <main className="flex-1 p-4 md:p-8 bg-linear-to-br from-green-50 via-blue-50 to-emerald-50 overflow-y-auto pb-20 md:pb-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center md:text-left">
        {t('crop_rec_page_title')} 🌾 {/* Page title translate karein */}
      </h2>
      {/* --- Main Grid Layout --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start max-w-7xl mx-auto">
        {/* --- Left Column: Input Form --- */}
        <div className="bg-white p-6 lg:max-h-[450px] overflow-y-auto md:p-8 rounded-xl shadow-lg border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Group 1: Soil Nutrients */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center">
                <LuAtom className="mr-2 text-green-600" />
                {t('crop_rec_soil_nutrients_title')} {/* Title translate karein */}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  icon={<LuAtom size={16} />}
                  label={t('crop_rec_label_soil_ph')}
                  name="soil_ph"
                  value={soilData.soil_ph}
                  onChange={handleChange}
                  placeholder="crop_rec_ph_placeholder"
                />
                <InputField
                  icon={<LuAtom size={16} />}
                  label={t('crop_rec_label_nitrogen_kg_ha')}
                  name="nitrogen_kg_ha"
                  value={soilData.nitrogen_kg_ha}
                  onChange={handleChange}
                  placeholder="crop_rec_nitrogen_placeholder"
                />
                <InputField
                  icon={<LuAtom size={16} />}
                  label={t('crop_rec_label_phosphorus_kg_ha')}
                  name="phosphorus_kg_ha"
                  value={soilData.phosphorus_kg_ha}
                  onChange={handleChange}
                  placeholder="crop_rec_phosphorus_placeholder"
                />
                <InputField
                  icon={<LuAtom size={16} />}
                  label={t('crop_rec_label_potassium_kg_ha')}
                  name="potassium_kg_ha"
                  value={soilData.potassium_kg_ha}
                  onChange={handleChange}
                  placeholder="crop_rec_potassium_placeholder"
                />
              </div>
            </div>

            {/* Group 2: Climate */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center">
                <LuCloudSunRain className="mr-2 text-blue-500" />
                {t('crop_rec_climate_conditions_title')} {/* Title translate karein */}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <InputField
                  icon={<LuCloudSunRain size={16} />}
                  label={t('crop_rec_label_annual_rainfall_mm')}
                  name="annual_rainfall_mm"
                  value={soilData.annual_rainfall_mm}
                  onChange={handleChange}
                  placeholder="crop_rec_rainfall_placeholder"
                />
                <InputField
                  icon={<LuThermometer size={16} />}
                  label={t('crop_rec_label_avg_temp_c')}
                  name="avg_temp_c"
                  value={soilData.avg_temp_c}
                  onChange={handleChange}
                  placeholder="crop_rec_temp_placeholder"
                />
                <InputField
                  icon={<LuDroplet size={16} />}
                  label={t('crop_rec_label_avg_humidity_pct')}
                  name="avg_humidity_pct"
                  value={soilData.avg_humidity_pct}
                  onChange={handleChange}
                  placeholder="crop_rec_humidity_placeholder"
                />
              </div>
            </div>

            {/* Group 3: Field Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-4 border-b pb-2 flex items-center">
                <LuMapPin className="mr-2 text-orange-500" />
                {t('crop_rec_field_information_title')} {/* Title translate karein */}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SelectField
                  icon={<LuMapPin size={16} />}
                  label={t('crop_rec_label_soil_type')}
                  name="soil_type"
                  value={soilData.soil_type}
                  onChange={handleChange}
                  options={soilTypeOptions}
                />
                <SelectField
                  icon={<LuDroplet size={16} />}
                  label={t('crop_rec_label_irrigation_type')}
                  name="irrigation_type"
                  value={soilData.irrigation_type}
                  onChange={handleChange}
                  options={irrigationTypeOptions}
                />
                <SelectField
                  icon={<LuWheat size={16} />}
                  label={t('crop_rec_label_previous_crop')}
                  name="previous_crop"
                  value={soilData.previous_crop}
                  onChange={handleChange}
                  options={previousCropOptions}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-md
                          mt-6 transition-transform duration-200 hover:scale-105
                          flex items-center justify-center
                          disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <LuLoader className="animate-spin text-2xl" />
              ) : (
                <>
                  <LuSearch className="mr-2" /> {t('crop_rec_find_crop_button')} {/* Button text translate karein */}
                </>
              )}
            </button>
          </form>
        </div>{" "}
        {/* End Left Column */}
        {/* --- Right Column: Result/Placeholder/Advice --- */}
        {/* Adjusted sticky top value, added flex structure */}
        <div className="lg:sticky lg:top-5 space-y-2 h-full lg:h-[450px] flex flex-col">
          {/* Show Loading for Crop Rec */}
          {isLoading && <LoadingIndicator />}

          {/* Show Error Display (Handles both crop and advice errors) */}
          {error && !isLoading && <ErrorDisplay message={error} />}

          {/* Show Crop Result Card */}
          {result && !isLoading && !error && (
            <ResultCard
              crop={result}
              onGetAdvice={handleGetAdvice}
              isAdviceLoading={isAdviceLoading}
            />
          )}

          {/* Show AI Advice Card (or its loading state) */}
          {/* Show this only if a result exists and advice is loading or loaded */}
          {result && !isLoading && (isAdviceLoading || aiAdvice) && !error && (
            <div className="flex-1 min-h-[200px] overflow-hidden">
              {" "}
              {/* Added overflow-hidden */}
              <AdviceCard advice={aiAdvice} isLoading={isAdviceLoading} />
            </div>
          )}

          {/* Show Placeholder only initially */}
          {!isLoading && !result && !error && (
            <div className="flex-1">
              <PlaceholderCard />
            </div>
          )}
        </div>{" "}
        {/* End Right Column */}
      </div>{" "}
      {/* End Main Grid */}
    </main>
  );
}

export default CropRecPage;