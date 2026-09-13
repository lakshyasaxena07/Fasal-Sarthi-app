import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { useUser } from "@supabase/auth-helpers-react";
import { weatherApi } from "../api";

const WeatherContext = createContext();

export const WeatherProvider = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState("Bhopal");
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const user = useUser();

  const fetchWeather = useCallback(async (cityOrCoords) => {
    setIsLoading(true);
    setWeatherData(null);
    setError(null);
    let payload;
    let isCoords = false;

    if (typeof cityOrCoords === "string") {
      payload = { city: cityOrCoords };
      setSelectedCity(cityOrCoords);
    } else if (cityOrCoords && cityOrCoords.lat && cityOrCoords.lon) {
      payload = { lat: cityOrCoords.lat, lon: cityOrCoords.lon };
      isCoords = true;
    } else {
      setError("Invalid input for fetching weather.");
      setIsLoading(false);
      return;
    }

    try {
      const data = await weatherApi.fetchWeather(payload);
      setWeatherData(data);
      if (isCoords && data?.city) {
        setSelectedCity(data.city);
      }
    } catch (err) {
      let errorMessage = "Failed to fetch weather data.";
      if (err.response?.status === 401) {
        errorMessage = "Please log in to fetch weather data.";
      } else if (err.userMessage) {
        errorMessage = err.userMessage;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      setError(
        errorMessage.replace(
          "city not found",
          "City not found. Check spelling."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchWeather(selectedCity);
    } else {
      setWeatherData(null);
      setError(null);
      setIsLoading(false);
    }
  }, [user, fetchWeather]); // eslint-disable-line react-hooks/exhaustive-deps

  const value = {
    selectedCity,
    weatherData,
    isLoading,
    error,
    fetchWeather,
  };

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (context === undefined) {
    throw new Error("useWeather must be used within a WeatherProvider");
  }
  return context;
};