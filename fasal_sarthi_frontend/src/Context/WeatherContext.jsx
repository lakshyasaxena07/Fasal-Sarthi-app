import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "../api/axiosInstance"; // Yeh bilkul sahi hai
// [--- FIX (1) ---]
// Supabase ka 'useUser' hook import karein
import { useUser } from "@supabase/auth-helpers-react";
// [--- END FIX ---]

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Create the context
const WeatherContext = createContext();

// Create a provider component
export const WeatherProvider = ({ children }) => {
  const [selectedCity, setSelectedCity] = useState("Bhopal");
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // [--- FIX (2) ---]
  // Check karein ki user logged-in hai ya nahi
  const user = useUser();
  // [--- END FIX ---]

  const fetchWeather = async (cityOrCoords) => {
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
      const response = await axios.post(`${API_BASE_URL}/get_weather`, payload);
      setWeatherData(response.data);
      if (isCoords) {
        setSelectedCity(response.data.city);
      }
    } catch (err) {
      // console.error("Weather fetch error:", err);
      let errorMessage = "Failed to fetch weather data.";
      if (err.response?.status === 401) {
        errorMessage = "Please log in to fetch weather data.";
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
  };

  // [--- FIX (3) ---]
  // Yeh 'useEffect' ab 'user' par depend karega
  useEffect(() => {
    if (user) {
      // Agar user logged-in hai, tabhi weather fetch karo
      // console.log("User is logged in, fetching weather...");
      fetchWeather(selectedCity);
    } else {
      // Agar user logged-out hai, toh kuch mat karo (aur error/data clear rakho)
      // console.log("User is logged out, not fetching weather.");
      setWeatherData(null);
      setError(null);
      setIsLoading(false);
    }
  }, [user]); // Yeh 'useEffect' tab chalega jab user ka login status badlega
  // [--- END FIX ---]


  return (
    <WeatherContext.Provider
      // Hum 'fetchWeather' ko abhi bhi export kar rahe hain taaki
      // WeatherPage component usse manually call kar sake
      value={{ selectedCity, weatherData, isLoading, error, fetchWeather }}
    >
      {children}
    </WeatherContext.Provider>
  );
};

// Custom hook to use the weather context easily
export const useWeather = () => {
  return useContext(WeatherContext);
};