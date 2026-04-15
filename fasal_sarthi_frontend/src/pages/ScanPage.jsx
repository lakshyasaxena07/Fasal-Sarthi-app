import React, { useState, useCallback, useRef, Fragment } from "react";
import { useTranslation } from "react-i18next"; // <-- 1. Naya import
import { useDropzone } from "react-dropzone";
import axios from "../api/axiosInstance";
import ReactMarkdown from "react-markdown";
import {
  LuCloudUpload,
  LuFileImage,
  LuX,
  LuLoader,
  LuTriangleAlert as LuAlertTriangle,
  LuSparkles,
  LuScanLine,
  LuCheck,
  LuCamera,
} from "react-icons/lu";

// API Base URL (Aapke paas pehle se hai)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- 1. Result Display Component (Translated) ---
const ResultDisplay = ({ resultData, cureData, onGetCure, isCureLoading }) => {
  const { t } = useTranslation(); // <-- Hook ko yahaan bhi use karein
  if (!resultData) return null;

  const { predicted_disease, confidence } = resultData;
  const confidenceValue = parseFloat(confidence);
  let confidenceColor = "text-green-600";
  if (confidenceValue < 80) confidenceColor = "text-yellow-600";
  if (confidenceValue < 50) confidenceColor = "text-red-600";

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg animate-fadeIn border border-gray-200">
      <div className="flex items-center mb-4">
        <LuCheck className="text-3xl text-green-600 mr-3" />
        <h3 className="text-2xl font-bold text-gray-800">
          {t("scan_result_title")}
        </h3>
      </div>

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-500">
          {t("predicted_disease")}
        </p>
        <p className="text-xl font-semibold text-green-700">
          {predicted_disease.replace(/_/g, " ")}
        </p>
      </div>

      <div className="mb-6">
        <p className="text-sm font-medium text-gray-500">
          {t("confidence_score")}
        </p>
        <p className={`text-xl font-semibold ${confidenceColor}`}>
          {confidence}
        </p>
      </div>

      <hr className="my-6 border-gray-200" />

      {!cureData && !isCureLoading && (
        <button
          onClick={onGetCure}
          className="w-full bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center transition-transform duration-200 hover:scale-105"
        >
          <LuSparkles className="mr-2" /> {t("scan_ask_cure")}
        </button>
      )}

      {isCureLoading && (
        <div className="flex items-center justify-center p-4 rounded-lg bg-gray-50 border">
          <LuLoader className="animate-spin text-2xl text-green-600" />
          <p className="ml-3 text-gray-600">{t("scan_asking_cure")}</p>
        </div>
      )}

      {cureData && (
        <div className="animate-fadeIn">
          <div className="flex items-center mb-3">
            <LuSparkles className="text-xl text-green-600 mr-2" />
            <h4 className="text-lg font-semibold text-gray-800">
              {t("scan_cure_advice_title")}
            </h4>
          </div>
          <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-1 text-gray-700">
            <ReactMarkdown>{cureData}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

// --- 2. Error Card Component (Translated) ---
const ErrorCard = ({ message }) => {
  const { t } = useTranslation(); // <-- Hook ko yahaan bhi use karein
  return (
    <div className="bg-red-50 p-6 rounded-2xl shadow-lg border border-red-200 animate-fadeIn">
      <div className="flex items-center">
        <LuAlertTriangle className="text-3xl text-red-500 mr-4 shrink-0" />
        <div>
          <h3 className="text-xl font-bold text-red-700">
            {t("scan_error_title")}
          </h3>
          <p className="text-red-600 mt-1">{message}</p>
        </div>
      </div>
    </div>
  );
};

// --- 3. Main Scan Page Component (Translated) ---
function ScanPage() {
  const { t, i18n } = useTranslation(); // <-- 2. Main hook ko yahaan use karein (i18n ko bhi import karein)
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoadingScan, setIsLoadingScan] = useState(false);
  const [cure, setCure] = useState(null);
  const [isCureLoading, setIsCureLoading] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileChange = (file) => {
    // Kadam 1: Check karein ki file hai (user ne 'Cancel' nahi dabaya)
    if (!file) {
      // Agar file nahi hai, input ko reset karein aur return
      if (fileInputRef.current) fileInputRef.current.value = null;
      if (cameraInputRef.current) cameraInputRef.current.value = null;
      return;
    }

    // Kadam 2: Check karein ki file image hai
    if (file.type.startsWith("image/")) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setResult(null);
      setError(null);
      setCure(null);
    } else {
      // Agar file hai, lekin image nahi hai (jaise PDF)
      setError(t("scan_error_invalid_file"));
    }

    // [--- ANDROID FIX ---]
    // Dono inputs ko force-reset karein, taaki agla click
    // (bhaley hi same file ho) 'onChange' ko trigger kare.
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = null;
    }
    // [--- END FIX ---]
  };

  const onDrop = useCallback(
    (acceptedFiles) => {
      handleFileChange(acceptedFiles[0]);
    },
    [t]
  ); // Add 't' as dependency

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [], "image/png": [], "image/jpg": [] },
    multiple: false,
    noClick: true,
    noKeyboard: true,
  });

  const triggerCameraInput = () => {
    cameraInputRef.current?.click();
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setCure(null);

    // [--- ANDROID FIX (in Clear) ---]
    // Jab user 'X' dabaye, tab bhi inputs ko 'null' par reset karein.
    if (fileInputRef.current) {
      fileInputRef.current.value = null;
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = null;
    }
    // [--- END FIX ---]
  };

  // --- API CALL 1: Start Scan (Translated Error) ---
  const handleSubmitScan = async () => {
    if (!selectedFile) return;
    setIsLoadingScan(true);
    setResult(null);
    setError(null);
    setCure(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/predict_disease`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      setResult(response.data);
    } catch (err) {
      console.error(err);
      setError(t("scan_error_connection")); // Translated error
    } finally {
      setIsLoadingScan(false);
    }
  };

  // --- API CALL 2: Get Cure (UPDATED) ---
  const handleGetCure = async () => {
    if (!result || !result.predicted_disease) return;
    setIsCureLoading(true);
    setError(null);
    setCure(null);

    const diseaseName = result.predicted_disease.replace(/_/g, " ");

    // 3. Prompt ko t() function se generate karein
    const prompt = t("scan_cure_prompt", { diseaseName: diseaseName });

    // 4. Current language ko fetch karein
    const currentLanguage = i18n.language; // Yeh 'en' ya 'hi' dega

    try {
      // 5. API call mein 'language' aur 'message' (translated prompt) bhejें
      const response = await axios.post(`${API_BASE_URL}/sarthi_ai_chat`, {
        message: prompt,
        language: currentLanguage, // <-- Naya data bhej rahe hain
      });
      setCure(response.data.response);
    } catch (err) {
      console.error(err);
      setError(t("scan_error_cure_fetch")); // Translated error
      setCure(null);
    } finally {
      setIsCureLoading(false);
    }
  };

  // --- Main Return (Translated) ---
  return (
    <main className="flex-1 p-4 md:p-8 bg-linear-to-b from-green-50 to-emerald-50 overflow-y-auto pb-20 md:pb-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center md:text-left">
        {t("scan_crop_title")}
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* --- Left Column --- */}
        <div className="bg-white overflow-y-auto lg:max-h-[460px] p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200 space-y-6 ">
          {!selectedFile && (
            <Fragment>
              <h3 className="text-xl font-semibold text-gray-700 mb-4 text-center">
                {t("scan_step1_title")}
              </h3>
              <div
                {...getRootProps()}
                className={`border-4 border-dashed rounded-lg p-8 md:p-12 text-center transition-colors mb-4 ${
                  isDragActive
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  accept="image/jpeg,image/png,image/jpg"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={(e) => handleFileChange(e.target.files[0])}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
                <LuCloudUpload className="mx-auto text-5xl text-gray-400 mb-3" />
                <p className="text-lg text-gray-600 font-medium">
                  {t("scan_dropzone_main")}
                </p>
                <p className="text-gray-500 my-2">{t("scan_dropzone_or")}</p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button
                    onClick={triggerFileInput}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center transition-transform duration-200 hover:scale-105"
                  >
                    <LuFileImage className="mr-2" /> {t("scan_browse_button")}
                  </button>
                  <button
                    onClick={triggerCameraInput}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center transition-transform duration-200 hover:scale-105"
                  >
                    <LuCamera className="mr-2" /> {t("scan_camera_button")}
                  </button>
                </div>
                <p className="mt-4 text-xs text-gray-500">
                  {t("scan_supports_formats")}
                </p>
              </div>
            </Fragment>
          )}

          {selectedFile && (
            <Fragment>
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">
                  {t("scan_preview_title")}
                </h3>
                <div className="relative inline-block border-4 border-gray-200 rounded-lg p-2 shadow-inner bg-gray-100 max-w-full">
                  <img
                    src={preview}
                    alt="Selected preview"
                    className="max-w-full h-auto max-h-64 md:max-h-80 rounded-md object-contain"
                    onLoad={() => URL.revokeObjectURL(preview)}
                  />
                  <button
                    onClick={handleClearFile}
                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                    aria-label={t("scan_remove_image_aria")}
                  >
                    <LuX size={18} />
                  </button>
                </div>
                <p className="mt-2 text-sm text-gray-600 truncate">
                  {selectedFile.name}
                </p>
              </div>

              {!result && !isLoadingScan && (
                <button
                  onClick={handleSubmitScan}
                  className="w-full bg-linear-to-r from-teal-500 to-cyan-600 text-white font-bold py-4 px-6 rounded-lg shadow-lg text-lg flex items-center justify-center transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!selectedFile || isLoadingScan}
                >
                  <LuScanLine className="mr-2 text-xl" />{" "}
                  {t("scan_scan_now_button")}
                </button>
              )}

              {isLoadingScan && (
                <div className="flex items-center justify-center p-4 rounded-lg bg-gray-50 border">
                  <LuLoader className="animate-spin text-2xl text-green-600" />
                  <p className="ml-3 text-gray-600">{t("scan_loading_scan")}</p>
                </div>
              )}

              {result && !isLoadingScan && (
                <div className="p-5 rounded-xl bg-white shadow-lg border border-gray-100">
                  <div className="flex items-center mb-5">
                    <div className="p-2 bg-green-100 rounded-full mr-3 shrink-0">
                      <LuCheck className="text-xl text-green-700" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-800">
                      {t("scan_result_title")}
                    </h4>
                  </div>
                  <div className="space-y-5">
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("predicted_disease")}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {result.predicted_disease.replace(/_/g, " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t("confidence_score")}
                      </p>
                      <p
                        className={`text-3xl font-extrabold text-green-500 mt-1`}
                      >
                        {result.confidence}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error &&
                error.includes(t("scan_error_connection")) && ( // Check against translated string or a code
                  <ErrorCard message={error} />
                )}
            </Fragment>
          )}
        </div>

        {/* --- Right Column --- */}
        <div className="mt-8 lg:mt-0 lg:sticky lg:top-8">
          {!selectedFile && !isLoadingScan && !result && !error && (
            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 text-center lg:max-h-[500px] lg:flex lg:flex-col lg:justify-center">
              <LuScanLine className="mx-auto text-5xl text-emerald-600 mb-3" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {t("scan_placeholder_title")}
              </h3>
              <p className="text-gray-600">{t("scan_placeholder_desc")}</p>
            </div>
          )}

          {result && !isLoadingScan && (
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-gray-200 lg:max-h-[460px] lg:overflow-y-auto">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">
                <LuSparkles className="inline-block mr-2 text-green-600" />
                {t("scan_cure_advice_title")}
              </h3>
              {!cure && !isCureLoading && (
                <button
                  onClick={handleGetCure}
                  className="w-full bg-linear-to-r from-green-500 to-emerald-600 text-white font-bold py-3 px-6 rounded-lg shadow-md flex items-center justify-center transition-transform duration-200 hover:scale-105"
                >
                  <LuSparkles className="mr-2" /> {t("scan_ask_cure_for")}{" "}
                  {result.predicted_disease.replace(/_/g, " ")}
                </button>
              )}
              {isCureLoading && (
                <div className="flex items-center justify-center p-4 rounded-lg bg-gray-50 border">
                  <LuLoader className="animate-spin text-2xl text-green-600" />
                  <p className="ml-3 text-gray-600">{t("scan_asking_cure")}</p>
                </div>
              )}
              {error &&
                !error.includes(t("scan_error_connection")) && ( // Only show cure-related errors here
                  <ErrorCard message={error} />
                )}
              {cure && (
                <div className="animate-fadeIn mt-4 prose prose-sm max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-1 text-gray-700">
                  <ReactMarkdown>{cure}</ReactMarkdown>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default ScanPage;
