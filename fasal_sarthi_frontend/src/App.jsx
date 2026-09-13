import React, { useState, lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { Navigate, Link } from "react-router-dom";

// --- Layout Components ---
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import BottomNav from "./components/BottomNav";
import AppDrawer from "./components/AppDrawer";
import ProtectedRoute from "./components/ProtectedRoute";

// --- Lazy-Loaded Page Components ---
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ScanPage = lazy(() => import("./pages/ScanPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const MandiPage = lazy(() => import("./pages/MandiPage"));
const CropRecPage = lazy(() => import("./pages/CropRecPage"));
const FertilizerRecPage = lazy(() => import("./pages/FertilizerRecPage"));
const WeatherPage = lazy(() => import("./pages/WeatherPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const CreateProfilePage = lazy(() => import("./pages/CreateProfilePage"));
const EditProfilePage = lazy(() => import("./pages/EditProfilePage"));

// --- Helper Components ---
import { LuLoaderCircle as LuLoader } from "react-icons/lu"; // For loading indicator

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-8" role="status" aria-label="Loading page">
    <LuLoader className="w-10 h-10 animate-spin text-green-600" />
    <span className="mt-3 text-sm font-medium text-gray-500">Loading...</span>
  </div>
);

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
    <Suspense fallback={<PageLoader />}>
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
    </Suspense>
  );
}

export default App;
