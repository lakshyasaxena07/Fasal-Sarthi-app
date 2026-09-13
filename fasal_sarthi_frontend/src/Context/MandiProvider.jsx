import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { mandiApi } from '../api';

const MandiContext = createContext(null);

export const MandiProvider = ({ children }) => {
  const user = useUser();
  const [mandiData, setMandiData] = useState(null);
  const [isMandiLoading, setIsMandiLoading] = useState(false);
  const [mandiError, setMandiError] = useState(null);

  const fetchFavoriteMandiPrice = useCallback(async () => {
    if (!user) {
      setMandiData(null);
      setMandiError(null);
      setIsMandiLoading(false);
      return;
    }

    setIsMandiLoading(true);
    setMandiError(null);
    try {
      const payload = { state: "Madhya Pradesh", commodity: "Wheat" };
      const data = await mandiApi.fetchMandiPrices(payload);

      if (data && data.length > 0) {
        setMandiData(data[0]);
      } else {
        setMandiData(null);
      }
    } catch (error) {
      console.error("Failed to fetch favorite mandi price (Global):", error);
      setMandiError(error.userMessage || error.message || "Failed to fetch mandi price");
    } finally {
      setIsMandiLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFavoriteMandiPrice();
    } else {
      setMandiData(null);
      setMandiError(null);
      setIsMandiLoading(false);
    }
  }, [user, fetchFavoriteMandiPrice]);

  const value = {
    mandiData,
    isMandiLoading,
    mandiError,
    refreshMandiData: fetchFavoriteMandiPrice,
  };

  return <MandiContext.Provider value={value}>{children}</MandiContext.Provider>;
};

export const useMandiData = () => {
  const context = useContext(MandiContext);
  if (context === undefined) {
    throw new Error('useMandiData must be used within a MandiProvider');
  }
  return context;
};