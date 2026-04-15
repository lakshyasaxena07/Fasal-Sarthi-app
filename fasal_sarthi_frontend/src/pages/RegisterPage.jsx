import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSupabaseClient } from "@supabase/auth-helpers-react"; // Auth hook
import { useNavigate, Link } from "react-router-dom";
import {
  LuLeaf,
  LuLoader,
  LuTriangleAlert as LuAlertTriangle,
  LuCheck as LuCheckCircle,
  LuEye, // [--- EYE ICON FIX (1) ---] Import LuEye
  LuEyeOff, // [--- EYE ICON FIX (2) ---] Import LuEyeOff
} from "react-icons/lu";

function RegisterPage() {
  const { t } = useTranslation();
  const supabase = useSupabaseClient(); // Supabase client ko access karein
  const navigate = useNavigate();
  // [--- EYE ICON FIX (3) ---]
  // Password dikhane ke liye naya state
  const [showPassword, setShowPassword] = useState(false);
  // [--- END FIX ---]

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false); // Success state

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Supabase se naya user register karein
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
      });

      if (error) {
        // Agar error aaye (jaise user pehle se hai)
        console.error("Supabase register error:", error.message);
        setError(error.message); // Supabase ka error dikhayein
        setLoading(false);
        return;
      }

      // Kadam 1 mein humne "Confirm email" ON kiya tha
      // Isliye user ko success message dikhayein
      console.log("Registration successful, user:", data.user);
      setLoading(false);
      setSuccess(true); // Success message state ko true karein
      setEmail(""); // Form clear karein
      setPassword("");
    } catch (err) {
      console.error("Registration exception:", err);
      setError(t("login_error_network")); // Network error
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo aur Title */}
        <div className="text-center mb-8">
          <LuLeaf className="inline-block text-5xl text-green-600 mb-2" />
          <h1 className="text-3xl font-bold text-gray-800">
            {t("header_title")}
          </h1>
          <p className="text-gray-600">{t("register_create_account")}</p>
        </div>

        {/* Register Form */}
        <form
          onSubmit={handleRegister}
          className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200"
        >
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-6">
            {t("register_title")}
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 flex items-center rounded-lg bg-red-50 p-4 text-sm text-red-700">
              <LuAlertTriangle className="mr-2 h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 flex items-center rounded-lg bg-green-50 p-4 text-sm text-green-700">
              <LuCheckCircle className="mr-2 h-5 w-5" />
              <span>{t("register_success_message")}</span>
            </div>
          )}

          {/* Email Input */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("login_email_label")}
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500  text-gray-600 focus:text-black"
              placeholder={t("login_email_placeholder")}
            />
          </div>

          {/* Password Input */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              {t("login_password_label")}
            </label>
            {/* [--- EYE ICON FIX (4) ---] */}
            {/* Input ko ek relative group mein daala */}
            <div className="relative">
              <input
                // Input ka type state se control kiya
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-600 focus:text-black"
                placeholder={t("login_password_placeholder")}
              />
              {/* Eye icon button */}
              <button
                type="button" // Form submit hone se rokne ke liye
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <LuEyeOff className="h-5 w-5" />
                ) : (
                  <LuEye className="h-5 w-5" />
                )}
              </button>
            </div>
            {/* [--- END FIX ---] */}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold shadow-md hover:bg-green-700 transition duration-300 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <LuLoader className="animate-spin" />
            ) : (
              t("register_button")
            )}
          </button>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-600 mt-6">
            {t("register_has_account")}{" "}
            <Link
              to="/login"
              className="font-medium text-green-600 hover:text-green-700"
            >
              {t("register_login_link")}
            </Link>
          </p>
        </form>

        {/* Back to Home Link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/" className="hover:underline">
            &larr; {t("login_back_home")}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
