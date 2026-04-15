import React, { Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { WeatherProvider } from "./Context/WeatherContext";
import "./i18n"; // i18n config file

import { supabaseClient } from "./lib/supabaseClient";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { UserProvider } from "./Context/UserProvider";

// [--- FIX ---]
// Naye SoilProvider ko import karein
import { SoilProvider } from "./Context/SoilProvider";
import { MandiProvider } from "./Context/MandiProvider"; // <-- YEH ADD KAREIN
// [--- END FIX ---]

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Suspense
      fallback={
        <div className="flex h-screen w-full items-center justify-center bg-gray-100">
          <p className="text-lg font-medium text-gray-700">Loading...</p>
        </div>
      }
    >
      <BrowserRouter>
        <SessionContextProvider supabaseClient={supabaseClient}>
          <WeatherProvider>
            <UserProvider>
              {/* [--- FIX ---] */}
              {/* SoilProvider ko yahaan add karein */}
              <SoilProvider>
                <MandiProvider>
                  <App />
                </MandiProvider>
              </SoilProvider>
              {/* [--- END FIX ---] */}
            </UserProvider>
          </WeatherProvider>
        </SessionContextProvider>
      </BrowserRouter>
    </Suspense>
  </React.StrictMode>
);
