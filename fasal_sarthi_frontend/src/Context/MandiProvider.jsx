import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../api/axiosInstance'; // Hamara 'smart' axios

// 1. Naya Context banayein
const MandiContext = createContext(null);

// 2. Provider component banayein
export const MandiProvider = ({ children }) => {
  const [mandiData, setMandiData] = useState(null); // Yeh data save rakhega
  const [isMandiLoading, setIsMandiLoading] = useState(true);
  const [mandiError, setMandiError] = useState(null);

  // 3. Yeh useEffect sirf ek baar chalega (app load hone par)
  useEffect(() => {
    const fetchFavoriteMandiPrice = async () => {
      setIsMandiLoading(true);
      setMandiError(null);
      try {
        // Hum 'Wheat' (MP) ka data dashboard ke liye laa rahe hain
        const payload = { state: "Madhya Pradesh", commodity: "Wheat" };
        const response = await axios.post('/get_mandi_prices', payload);
        
        if (response.data && response.data.length > 0) {
          setMandiData(response.data[0]); // Sirf pehla record save karein
        } else {
          setMandiData(null); // Koi record nahi mila
        }
      } catch (error) {
        console.error("Failed to fetch favorite mandi price (Global):", error);
        setMandiError(error.message);
      } finally {
        setIsMandiLoading(false);
      }
    };
    
    fetchFavoriteMandiPrice();
  }, []); // <-- Khaali array ka matlab hai: "Sirf 1 baar chalo"

  // 4. Data ko poore app ke saath share karein
  const value = {
    mandiData,
    isMandiLoading,
    mandiError
  };

  return <MandiContext.Provider value={value}>{children}</MandiContext.Provider>;
};

// 5. Ek custom hook banayein taaki data aasani se mil sake
export const useMandiData = () => {
  const context = useContext(MandiContext);
  if (context === undefined) {
    throw new Error('useMandiData must be used within a MandiProvider');
  }
  return context;
};