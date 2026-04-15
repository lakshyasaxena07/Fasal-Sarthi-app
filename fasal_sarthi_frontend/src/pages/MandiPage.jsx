import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from '../api/axiosInstance';
import { 
  LuLoader, 
  LuTriangleAlert as LuAlertTriangle, 
  LuTrendingUp, 
  LuSearch,
  LuMapPin,
  LuWheat,
  LuCalculator as LuCalendarDays, // Date ke liye naya icon
  LuShoppingBag as LuShoppingBasket // Variety ke liye naya icon
} from 'react-icons/lu';

// --- Options (Ismein koi change nahi hai) ---
const STATES = [
  "Madhya Pradesh", "Uttar Pradesh", "Punjab", "Maharashtra", "Rajasthan", "Gujarat"
];
const COMMODITIES = [
  "Wheat", "Soyabean", "Paddy(Dhan)", "Maize", "Cotton", "Gram(Chana)"
];
// --------------------------------------------------


function MandiPage() {
  const { t } = useTranslation();

  // [--- FIX (1) ---]
  // Form states mein 'district' add karein
  const [selectedState, setSelectedState] = useState("Madhya Pradesh");
  const [selectedCommodity, setSelectedCommodity] = useState("Wheat");
  const [selectedDistrict, setSelectedDistrict] = useState(""); // Naya state
  // [--- END FIX ---]

  // API states (Ismein koi change nahi hai)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResults([]);

    try {
      // [--- FIX (2) ---]
      // Payload mein 'district' add karein
      const payload = {
        state: selectedState,
        commodity: selectedCommodity,
        district: selectedDistrict, // Naya data
      };
      // [--- END FIX ---]
      
      const response = await axios.post('/get_mandi_prices', payload);
      setResults(response.data);

    } catch (err) {
      console.error("Mandi fetch error:", err);
      const errorMessage = err.response?.data?.error || "Failed to fetch prices.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 p-4 md:p-8 bg-gray-50 overflow-y-auto pb-20 md:pb-8">
      <div className="flex items-center space-x-3 mb-6">
        <LuTrendingUp className="text-3xl text-green-600" />
        <h2 className="text-3xl font-bold text-gray-800">
          {t('mandi_title')}
        </h2>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200 mb-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
              {t('mandi_label_state')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <LuMapPin className="h-5 w-5 text-gray-400" />
              </span>
              <select
                id="state"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="commodity" className="block text-sm font-medium text-gray-700 mb-1">
              {t('mandi_label_commodity')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <LuWheat className="h-5 w-5 text-gray-400" />
              </span>
              <select
                id="commodity"
                value={selectedCommodity}
                onChange={(e) => setSelectedCommodity(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {COMMODITIES.map((com) => (
                  <option key={com} value={com}>{com}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
              {t('mandi_label_district')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <LuMapPin className="h-5 w-5 text-gray-400" />
              </span>
              <input
                type="text"
                id="district"
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                placeholder={t('mandi_placeholder_district')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="self-end">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg font-semibold shadow-md hover:bg-green-700 transition duration-300 flex items-center justify-center disabled:opacity-50"
            >
              {isLoading ? (
                <LuLoader className="animate-spin" />
              ) : (
                <>
                  <LuSearch className="mr-2" /> {t('mandi_button_fetch')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <div>
        {isLoading && (
          <div className="text-center p-4">
            <LuLoader className="animate-spin text-4xl text-green-600 mx-auto" />
            <p className="mt-2 text-gray-600">{t('mandi_loading')}</p>
          </div>
        )}

        {error && (
          <div className="flex items-center rounded-lg bg-red-50 p-4 text-red-700">
            <LuAlertTriangle className="mr-3 h-6 w-6" />
            <span>{error}</span>
          </div>
        )}

        {!isLoading && !error && results.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('mandi_tbl_mandi')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('mandi_tbl_district')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('mandi_tbl_variety')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('mandi_tbl_date')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('mandi_tbl_min')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('mandi_tbl_max')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('mandi_tbl_avg')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.mandi}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.district}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.variety || 'N/A'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{item.date || 'N/A'}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.min_price ? `₹ ${item.min_price}` : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.max_price ? `₹ ${item.max_price}` : 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                      {item.price ? `₹ ${item.price}` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !error && results.length === 0 && (
          <div className="text-center p-8 bg-white rounded-2xl shadow-lg border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-700">{t('mandi_no_results_title')}</h3>
            <p className="mt-2 text-gray-500">{t('mandi_no_results_desc')}</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default MandiPage;