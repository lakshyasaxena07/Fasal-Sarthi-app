import React, { createContext, useState, useContext, useCallback } from 'react';

// 1. Sabhi fields ke liye initial (default) state banayein
const initialState = {
  // Crop Rec + Fertilizer Rec (Common)
  soil_ph: '',
  nitrogen_kg_ha: '',
  phosphorus_kg_ha: '',
  potassium_kg_ha: '',
  avg_temp_c: '',
  avg_humidity_pct: '',
  soil_type: '', // Yeh dono mein alag-alag use ho sakti hai, hum ek common rakhenge
  
  // Crop Rec specific
  annual_rainfall_mm: '',
  irrigation_type: '',
  previous_crop: '',
  
  // Fertilizer Rec specific
  moisture: '',
  crop_type: '', // Yeh bhi alag ho sakti hai
};

// 2. Naya Context banayein
const SoilContext = createContext(null);

// 3. Provider component banayein
export const SoilProvider = ({ children }) => {
  // Sabhi fields ko 'state' mein daalein
  const [soilData, setSoilData] = useState(initialState);

  // 4. Ek "master" function banayein jo kisi bhi field ko update kar sake
  // 'useCallback' ka istemaal performance ke liye accha hai
  const updateSoilData = useCallback((field, value) => {
    setSoilData((prevData) => ({
      ...prevData,
      [field]: value,
    }));
  }, []);

  // 5. Context ki value banayein (data + function)
  const value = {
    soilData, // Poora data object
    updateSoilData, // Data update karne waala function
  };

  return <SoilContext.Provider value={value}>{children}</SoilContext.Provider>;
};

// 6. Ek custom hook banayein taaki data aasani se mil sake
export const useSoilData = () => {
  const context = useContext(SoilContext);
  if (context === undefined) {
    throw new Error('useSoilData must be used within a SoilProvider');
  }
  return context;
};