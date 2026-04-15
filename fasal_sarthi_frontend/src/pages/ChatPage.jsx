import React, { useState, useRef, useEffect } from "react";
import axios from "../api/axiosInstance";
import ReactMarkdown from "react-markdown";
import { useTranslation } from 'react-i18next'; // <-- Naya Import
import {
  LuBot,
  LuUser,
  LuSend,
  LuLoader,
} from "react-icons/lu";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// --- Modern Chat Bubble Component (Translated) ---
const ChatBubble = ({ message, role }) => {
  const { t } = useTranslation(); // <-- Hook ko yahaan use karein
  const isUser = role === "user";

  return (
    <div
      className={`flex items-start gap-4 mb-6 ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      <div
        className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center
        ${isUser ? "bg-emerald-600" : "bg-white border-2 border-emerald-500"}`}
      >
        {isUser ? (
          <LuUser size={20} className="text-white" />
        ) : (
          <LuBot size={20} className="text-emerald-600" />
        )}
      </div>

      <div className={`flex flex-col max-w-[75%] gap-1`}>
        <span className="text-xs text-gray-500">
          {isUser ? t('chat_you_label') : t('chat_sarthi_ai_label')} {/* Translate labels */}
        </span>
        <div
          className={`px-4 py-3 rounded-2xl
          ${
            isUser
              ? "bg-emerald-600 text-white"
              : "bg-white border border-gray-200 text-gray-800"
          }`}
        >
          {role === "bot" && message === "...thinking..." ? (
            <div className="flex items-center gap-2">
              <LuLoader className="animate-spin" />
              <span className="text-sm">{t('chat_processing_request')}</span> {/* Translate thinking message */}
            </div>
          ) : (
            <div
              className={`prose prose-sm max-w-none ${
                isUser ? "prose-invert" : ""
              }`}
            >
              <ReactMarkdown>{message}</ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Main Chat Page Component ---
function ChatPage() {
  const { t, i18n } = useTranslation(); // <-- Hook aur i18n ko yahaan use karein

  // Initial message ko t() function se translate karein
  const initialBotMessage = t('chat_initial_message'); 

  const [chatHistory, setChatHistory] = useState([
    {
      role: "bot",
      message: initialBotMessage,
    },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null); // For auto-scrolling

  // Prevent whole page from scrolling while this page is mounted
  
  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  // Reset chat history when language changes
  useEffect(() => {
    setChatHistory([
      {
        role: "bot",
        message: t('chat_initial_message'),
      },
    ]);
  }, [i18n.language, t]); // 't' ko bhi dependency mein add karein

  // Handle form submission (API call)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const userMessage = newMessage.trim();

    // Prepare history to send (exclude initial bot message and any previous 'thinking' states)
    const historyToSend = chatHistory
      .filter(msg => msg.message !== '...thinking...') // Filter out thinking messages
      // Exclude the very first bot message if it's just the initial greeting and not part of the conversation flow
      .filter((msg, index) => index !== 0 || msg.message !== t('chat_initial_message'))
      .map(msg => ({ role: msg.role, message: msg.message }));

    // Get current language
    const currentLanguage = i18n.language; // 'en' ya 'hi'

    // Add user message to UI immediately
    const updatedUiHistory = [...chatHistory, { role: "user", message: userMessage }];
    setChatHistory(updatedUiHistory);
    setNewMessage("");
    setIsLoading(true);

    // Add bot thinking state to UI
    setChatHistory(prev => [...prev, { role: "bot", message: "...thinking..." }]);

    try {
      // Send NEW message, prepared HISTORY, aur current LANGUAGE
      const response = await axios.post(`${API_BASE_URL}/sarthi_ai_chat`, {
        message: userMessage,
        history: historyToSend,
        language: currentLanguage, // <-- Naya data bhej rahe hain
      });
      const aiMessage = response.data.response;

      // Replace thinking message with actual response in UI
      setChatHistory((prev) => {
        const updatedHistory = [...prev];
        // Find the last message (which should be 'thinking') and replace it
        const lastIndex = updatedHistory.length - 1;
        if (lastIndex >= 0 && updatedHistory[lastIndex].message === '...thinking...') {
              updatedHistory[lastIndex] = { role: "bot", message: aiMessage };
        } else {
              // Fallback: just add the message if something went wrong
              updatedHistory.push({ role: "bot", message: aiMessage });
        }
        return updatedHistory;
      });
    } catch (error) {
      console.error("Chat API error:", error);
      // Replace thinking message with error message in UI
      setChatHistory((prev) => {
        const updatedHistory = [...prev];
        const lastIndex = updatedHistory.length - 1;
          if (lastIndex >= 0 && updatedHistory[lastIndex].message === '...thinking...') {
            updatedHistory[lastIndex] = {
              role: "bot",
              message: t('chat_error_message') // Translated error message
            };
          } else {
              updatedHistory.push({ role: "bot", message: t('chat_error_message_fallback') }); // Fallback translated
          }
        return updatedHistory;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 ">
      {/* Header (Translated) */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap ">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
            <LuBot size={24} className="text-emerald-600" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-800">{t('header_title')}</h1> {/* Translate Fasal Sarthi title */}
            <p className="text-xs text-gray-500">
              {t('chat_ai_assistant_subtitle')} {/* Translate subtitle */}
            </p>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 ">
        <div className="max-w-3xl mx-auto">
          {chatHistory.map((msg, index) => (
            <ChatBubble key={index} role={msg.role} message={msg.message} />
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area (Translated) */}
      <div className="bg-gray-600 p-4 shadow-2xl mb-16 md:mb-0">
        <form
          onSubmit={handleSubmit}
          className="max-w-3xl mx-auto flex items-center gap-3"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={t('chat_input_placeholder')} 
            className="flex-1 bg-white px-4 py-3 rounded-full border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !newMessage.trim()}
            className={`p-3 rounded-full ${
              isLoading || !newMessage.trim()
                ? "bg-gray-200 text-gray-400"
                : "bg-emerald-600 text-white hover:bg-emerald-700"
            } transition-colors duration-200`}
          >
            {isLoading ? (
              <LuLoader className="animate-spin" size={20} />
            ) : (
              <LuSend size={20} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChatPage;