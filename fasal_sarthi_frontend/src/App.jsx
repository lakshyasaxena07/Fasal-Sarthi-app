import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Navigate, Link } from "react-router-dom";

// --- Layout Components ---
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import AppDrawer from "./components/AppDrawer";

// --- Page Components ---
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ScanPage from "./pages/ScanPage";
import ChatPage from "./pages/ChatPage";
import MandiPage from "./pages/MandiPage";
import CropRecPage from "./pages/CropRecPage";
import FertilizerRecPage from "./pages/FertilizerRecPage";
import WeatherPage from "./pages/WeatherPage";

// [--- FIX (1) ---]
// Naye Login, Register, aur ProtectedRoute components ko import karein
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute"; // Hamara naya gatekeeper
import CreateProfilePage from "./pages/CreateProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
// [--- END FIX ---]

// --- Helper Components ---
import { LuLoaderCircle as LuLoader } from "react-icons/lu"; // For loading indicator

// --- Main App Layout Component ---
// (Is component mein koi change nahi hai)
const MainAppLayout = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-white relative">
      <Sidebar />
      <AppDrawer isOpen={isDrawerOpen} toggleDrawer={toggleDrawer} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        {children}
      </div>
      <BottomNav toggleDrawer={toggleDrawer} />
    </div>
  );
};

// --- App Component (Main Router Setup) ---
function App() {
  return (
    <Routes>
      {/* --- Public Routes (Koi bhi dekh sakta hai) --- */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />{" "}
      {/* <-- FIX (2): Naya route */}
      <Route path="/register" element={<RegisterPage />} />{" "}
      {/* <-- FIX (3): Naya route */}
      <Route
        path="/about"
        element={
          <div className="flex flex-col min-h-screen bg-gray-50 items-center justify-center p-8">
            <h2 className="text-3xl font-bold mb-4">About Fasal Sarthi</h2>
            <p>Information about the Fasal Sarthi project and its goals.</p>
            <Link to="/" className="mt-4 text-green-600 hover:underline">
              Back to Home
            </Link>
          </div>
        }
      />
      {/* --- Profile Creation Route --- */}
      {/* [--- FIX (2) ---] */}
      {/* Yeh route protected nahi hai, lekin isse access karne ke liye */}
      {/* user ko logged-in hona zaroori hai (jo humara logic handle kar raha hai) */}
      <Route path="/create-profile" element={<CreateProfilePage />} />
      {/* [--- END FIX ---] */}
      {/* --- Protected Routes (Sirf Login ke baad dikhenge) --- */}
      {/* [--- FIX (4) ---] */}
      {/* Humne Dashboard ko <ProtectedRoute> se wrap kar diya hai */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainAppLayout>
              <Dashboard />
            </MainAppLayout>
          </ProtectedRoute>
        }
      />
      {/* Baaki sabhi pages ko bhi Protect kar dein */}
      <Route
        path="/scan"
        element={
          <ProtectedRoute>
            <MainAppLayout>
              <ScanPage />
            </MainAppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat"
        element={
          <ProtectedRoute>
            <MainAppLayout>
              <ChatPage />
            </MainAppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/crop-recommendation"
        element={
          <ProtectedRoute>
            <MainAppLayout>
              <CropRecPage />
            </MainAppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/fertilizer-advice"
        element={
          <ProtectedRoute>
            <MainAppLayout>
              <FertilizerRecPage />
            </MainAppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/weather"
        element={
          <ProtectedRoute>
            <MainAppLayout>
              <WeatherPage />
            </MainAppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <MainAppLayout>
              <div className="flex-1 p-8 text-center text-gray-600">
                Settings Page (Coming Soon!)
              </div>
            </MainAppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-profile"
        element={
          <ProtectedRoute>
            {/* Edit page layout ke bina achha dikhega */}
            <EditProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mandi-prices"
        element={
          <ProtectedRoute>
            <MainAppLayout>
              <MandiPage />
            </MainAppLayout>
          </ProtectedRoute>
        }
      />
      {/* [--- END FIX ---] */}
      {/* --- Catch-all Route --- */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
