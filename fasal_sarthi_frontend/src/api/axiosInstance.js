import axios from 'axios';
// [--- FIX ---]
// Import ko '../main' se badalkar '../lib/supabaseClient' kar diya
import { supabaseClient } from '../lib/supabaseClient'; 
// [--- END FIX ---]

// 1. Backend ka Base URL .env file se lein
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// 2. Axios ka ek naya 'instance' banayein
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// 3. Interceptor (Ab yeh crash nahi hona chahiye)
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Supabase se current session (login data) maangein
      const { data, error } = await supabaseClient.auth.getSession();

      if (error) {
        console.error('Error getting Supabase session:', error);
        return config; // Bina token ke request bhej do
      }

      if (data.session) {
        // Agar user logged-in hai, toh uska token nikaalein
        const { access_token } = data.session;
        
        // Token ko request ke Header mein daal dein
        config.headers['Authorization'] = `Bearer ${access_token}`;
        // console.log('Attaching auth token to request...');
      }
      
      // Ab request ko aage bhej dein
      return config;

    } catch (e) {
      // Agar supabaseClient undefined tha (jo ab nahi hona chahiye)
      console.error('Error in axios interceptor:', e);
      return config; // Request ko phir bhi jaane do
    }
  },
  (error) => {
    // Request config mein error hone par
    return Promise.reject(error);
  }
);

// Is naye 'smart' axios ko export karein
export default axiosInstance;