// src/pages/FertilizerRecPage.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from 'react-i18next'; // <-- Naya import
import axios from "../api/axiosInstance";
// [--- SOIL CONTEXT FIX (2) ---]
// Hamara naya Soil context hook import karein
import { useSoilData } from '../Context/SoilProvider';
// [--- END FIX ---]
import {
  LuFlaskConical,
  LuLoader,
  LuTriangleAlert as LuAlertTriangle,
  LuSearch,
} from "react-icons/lu";

// API Base URL (Aapke paas pehle se hai)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Reusable Input Field Component (Translated) ---
const InputField = ({
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
    <div className="flex flex-col">
      <label htmlFor={name} className="text-sm font-medium text-gray-700 mb-1">
        {label} {/* Label props se translate hokar aayega */}
      </label>
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-shadow duration-200 shadow-sm"
        placeholder={t(placeholder)} 
        required={required}
        step={type === "number" ? "any" : undefined}
      />
    </div>
  );
};

// --- Reusable Select Field Component (Translated) ---
const SelectField = ({
  label,
  name,
  value,
  onChange,
  options,
  required = true,
}) => {
  const { t } = useTranslation(); // <-- Hook ko yahaan use karein
  return (
    <div className="flex flex-col">
      <label htmlFor={name} className="text-sm font-medium text-gray-700 mb-1">
        {label} {/* Label props se translate hokar aayega */}
      </label>
      <select
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-shadow duration-200 shadow-sm"
        required={required}
      >
        <option value="" disabled>
          {t('fert_rec_select_placeholder', { label: label })} {/* Placeholder ko translate karein */}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {t(`fert_rec_option_${option.toLowerCase().replace(/[^a-z0-9]/g, '_')}`, option)} {/* Options ko translate karein */}
          </option>
        ))}
      </select>
    </div>
  );
};

// --- Main Fertilizer Recommendation Page (Translated) ---
function FertilizerRecPage() {
  const { t } = useTranslation(); // <-- Main hook ko yahaan use karein

  // Options matching backend (Inhein translate karne ki zaroorat nahi, yeh values hain)
  const soilTypeOptions = ["Black", "Clayey", "Loamy", "Red", "Sandy"];
  const cropTypeOptions = [
    "Barley", "Cotton", "Ground Nuts", "Maize", "Millets",
    "Oil seeds", "Paddy", "Pulses", "Sugarcane", "Tobacco", "Wheat",
    "coffee", "kidneybeans", "orange", "pomegranate", "rice", "watermelon",
  ];

  // [--- SOIL CONTEXT FIX (3) ---]
  // Naye shared context se data aur updater function lein
  const { soilData, updateSoilData } = useSoilData();

  // Mapping: Fertilizer keys -> Soil context keys
  const keyMap = {
    'Temparature': 'avg_temp_c',
    'Humidity': 'avg_humidity_pct',
    'Nitrogen': 'nitrogen_kg_ha',
    'Potassium': 'potassium_kg_ha',
    'Phosphorous': 'phosphorus_kg_ha',
    'Soil_Type': 'soil_type',
    // 'Moisture' aur 'Crop_Type' shared context mein nahi hain,
    // isliye hum unhein local state mein hi rakhenge.
  };

  // State for form inputs
  const [formData, setFormData] = useState({
    // Shared data ko 'soilData' se pre-fill karein
    Temparature: soilData.avg_temp_c || "",
    Humidity: soilData.avg_humidity_pct || "",
    Nitrogen: soilData.nitrogen_kg_ha || "",
    Potassium: soilData.potassium_kg_ha || "",
    Phosphorous: soilData.phosphorus_kg_ha || "",
    
    // Yeh data local hai
    Moisture: "", 
    
    // Soil_Type alag hai, isliye hum isse local hi rakhenge, pre-fill nahi karenge
    Soil_Type: "", 
    Crop_Type: "",
  });
  // [--- END FIX ---]

  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // [--- SOIL CONTEXT FIX (4) ---]
  // Jab 'soilData' (context se) badle, tab local form ko update karein
  // Yeh tab kaam aayega jab user CropRecPage se data bhar kar is page par aaye
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      Temparature: soilData.avg_temp_c || prev.Temparature,
      Humidity: soilData.avg_humidity_pct || prev.Humidity,
      Nitrogen: soilData.nitrogen_kg_ha || prev.Nitrogen,
      Potassium: soilData.potassium_kg_ha || prev.Potassium,
      Phosphorous: soilData.phosphorus_kg_ha || prev.Phosphorous,
    }));
  }, [soilData]);
  // [--- END FIX ---]

  // [--- SOIL CONTEXT FIX (5) ---]
  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 1. Local form ko update karein (taaki UI update ho)
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // 2. Shared Context ko bhi update karein (taaki CropRecPage update ho)
    const contextKey = keyMap[name]; // Mapping se context key dhoondhein
    if (contextKey) {
      updateSoilData(contextKey, value);
    }
  };
  // [--- END FIX ---]

  // Handle form submission (Error messages ko translate karein)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);
    setError(null);

    // [--- SOIL CONTEXT FIX (6) ---]
    // Payload ab local 'formData' se hi banega (jo context se pre-filled hai)
    const payload = {
      ...formData,
      Temparature: parseFloat(formData.Temparature),
      Humidity: parseFloat(formData.Humidity),
      Moisture: parseFloat(formData.Moisture),
      Nitrogen: parseFloat(formData.Nitrogen),
      Potassium: parseFloat(formData.Potassium),
      Phosphorous: parseFloat(formData.Phosphorous),
    };
    // [--- END FIX ---]

    // Validation for NaN inputs
    if (Object.values(payload).some(v => typeof v === 'number' && isNaN(v))) {
        setError(t('fert_rec_error_invalid_number'));
        setIsLoading(false);
        return;
    }
    // Validation for empty selects
    if (!payload.Soil_Type || !payload.Crop_Type) {
        setError(t('fert_rec_error_select_options'));
        setIsLoading(false);
        return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/recommend_fertilizer`,
        payload
      );
      setResult(response.data.recommended_fertilizer);
    } catch (err) {
      console.error("Fertilizer API Error:", err);
      if (err.response && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError(t('fert_rec_error_connection')); // Translated error
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 p-4 md:p-8 bg-linear-to-b from-emerald-50 via-white to-amber-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight">
            {t('fert_rec_page_title')} {/* Page title translate karein */}
          </h2>
          <p className="mt-2 text-sm md:text-base text-gray-600">
            {t('fert_rec_page_subtitle')} {/* Subtitle translate karein */}
          </p>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left column - image + quick tips (Translated) */}
          <div className="rounded-2xl overflow-hidden bg-white/60 shadow-md border border-gray-100 flex flex-col">
            <div className="relative h-56 md:h-72 lg:h-full">
              <img
                src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1350&q=80"
                alt="Farm field"
                className="w-full h-full object-cover transform transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent flex items-end p-4">
                <div className="text-white">
                  <h3 className="text-lg font-semibold">
                    {t('fert_rec_image_title')}
                  </h3>
                  <p className="text-sm opacity-90">
                    {t('fert_rec_image_subtitle')}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-lg shrink-0">
                  <LuSearch className="text-2xl text-amber-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{t('fert_rec_tip1_title')}</h4>
                  <p className="text-sm text-gray-600">
                    {t('fert_rec_tip1_desc')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-emerald-100 rounded-lg shrink-0">
                  <LuFlaskConical className="text-2xl text-emerald-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">{t('fert_rec_tip2_title')}</h4>
                  <p className="text-sm text-gray-600">
                    {t('fert_rec_tip2_desc')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500">{t('fert_rec_note1_title')}</p>
                  <p className="text-sm font-medium text-gray-800">
                    {t('fert_rec_note1_desc')}
                  </p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500">{t('fert_rec_note2_title')}</p>
                  <p className="text-sm font-medium text-gray-800">
                    {t('fert_rec_note2_desc')}
                  </p>
                </div>
              </div>

              <p className="text-xs text-gray-400">Image: Unsplash</p>
            </div>
          </div>

          {/* Right column - form (Translated) */}
          <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-gray-100 p-6 md:p-8 shadow-lg transform transition-all duration-300 hover:shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <p className="text-gray-600">
                {t('fert_rec_form_intro')}
              </p>

             {/* [--- SOIL CONTEXT FIX (7) ---] */}
              {/* Form fields ab 'formData.FIELD' se jude hain, jo context se pre-filled hain */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label={t('fert_rec_label_temperature')}
                  name="Temparature"
                  value={formData.Temparature} 
                  onChange={handleChange}
                  placeholder="fert_rec_placeholder_temperature"
                />
                <InputField
                  label={t('fert_rec_label_humidity')}
                  name="Humidity"
                  value={formData.Humidity} 
                  onChange={handleChange}
                  placeholder="fert_rec_placeholder_humidity"
                />
                <InputField
                  label={t('fert_rec_label_moisture')}
                  name="Moisture"
                  value={formData.Moisture} 
                  onChange={handleChange}
                  placeholder="fert_rec_placeholder_moisture"
                />
                <InputField
                  label={t('fert_rec_label_nitrogen')}
                  name="Nitrogen"
                  value={formData.Nitrogen} 
                  onChange={handleChange}
                  placeholder="fert_rec_placeholder_nitrogen"
                />
                <InputField
                  label={t('fert_rec_label_potassium')}
                  name="Potassium"
                  value={formData.Potassium} 
                  onChange={handleChange}
                  placeholder="fert_rec_placeholder_potassium"
                />
                <InputField
                  label={t('fert_rec_label_phosphorous')}
                  name="Phosphorous"
                  value={formData.Phosphorous} 
                  onChange={handleChange}
                  placeholder="fert_rec_placeholder_phosphorous"
                />
                <SelectField
                  label={t('fert_rec_label_soil_type')}
                  name="Soil_Type"
                  value={formData.Soil_Type} 
                  onChange={handleChange}
                  options={soilTypeOptions}
                />
                <SelectField
                  label={t('fert_rec_label_crop_type')}
                  name="Crop_Type"
                  value={formData.Crop_Type} 
                  onChange={handleChange}
                  options={cropTypeOptions}
                />
              </div>
              {/* [--- END FIX ---] */}

              <button
                type="submit"
                className="w-full bg-amber-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:scale-[1.02] transition-transform duration-200 flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LuLoader className="animate-spin text-2xl" />
                ) : (
                  <>
                    <LuFlaskConical className="text-xl" /> {t('fert_rec_submit_button')}
                  </>
                )}
              </button>
            </form>

            {/* result & error live preview (Translated) */}
            <div className="mt-6 space-y-4">
              {error && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex items-start gap-3">
                  <LuAlertTriangle className="text-2xl text-red-500 mt-1" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">{t('fert_rec_error_title')}</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}

              {result && (
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 flex items-center gap-4">
                  <div className="p-3 bg-amber-100 rounded-md">
                    <LuFlaskConical className="text-2xl text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      {t('fert_rec_result_title')}
                    </p>
                    <p className="text-lg font-bold text-amber-700 capitalize">
                      {result}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default FertilizerRecPage;