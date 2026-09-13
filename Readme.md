# 🌿 Fasal Sarthi - Smart Farming Assistant

[![CI/CD](https://github.com/lakshyasaxena07/Fasal-Sarthi-app/actions/workflows/ci.yml/badge.svg)](https://github.com/lakshyasaxena07/Fasal-Sarthi-app/actions/workflows/ci.yml)
[![Frontend Deployment](https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel)](https://fasal-sarthi-app.vercel.app/)
[![Backend Deployment](https://img.shields.io/badge/Backend-Render-blue?logo=render)](https://render.com)
[![Python Version](https://img.shields.io/badge/Python-3.11.9-blue?logo=python)](https://www.python.org/)
[![Node.js Version](https://img.shields.io/badge/Node.js-20%20%7C%2024-brightgreen?logo=node.js)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**Fasal Sarthi** is a full-stack precision farming platform engineered to empower farmers with machine-learning-driven crop disease diagnosis, scientific crop and fertilizer recommendations, real-time localized weather telemetry, agricultural commodity market (*mandi*) prices, and an AI advisory assistant.

---

## 🏗️ System Architecture

The application adopts a decoupled client-server architecture with strict separation between user-facing presentation, business logic orchestration, and the frozen machine learning inference engine.

```text
┌─────────────────────────────────────────────────────────────┐
│                   Client Layer (Vercel)                     │
│  React 19 SPA (Vite) + Tailwind CSS + Lucide Icons          │
│  - Route-level Code Splitting (17 lightweight chunks)        │
│  - Centralized Axios API Layer with Supabase Bearer Interceptor│
│  - Dynamic Global State (User, Weather, Mandi Contexts)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON / FormData
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway & WSGI (Render)               │
│  Gunicorn (Synchronous, Single-Threaded: --workers 1 --threads 1)
│  Flask Application Factory (`create_app()`)                 │
│  - CORS Ingress Filter (Strict origin allowlist)            │
│  - Rate Limiter (Flask-Limiter with Retry-After headers)    │
│  - Supabase JWT Authentication Middleware                   │
│  - Multi-tier Image Upload Validator (10MB cap, PIL verify) │
│  - Health Probes (/health, /ready)                          │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
               ▼                              ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│  Frozen ML Inference Layer   │ │ External Upstream Services   │
│  - Disease: TFLite (300x300) │ │ - Supabase (Auth & Database) │
│  - Crop: Stacking Classifier │ │ - OpenWeatherMap API         │
│  - Fertilizer: Random Forest │ │ - data.gov.in (Mandi Prices) │
│  (100% Bit-for-Bit Parity)   │ │ - Google Gemini 2.5 Flash    │
└──────────────────────────────┘ └─────────────────────────────┘
```

### Core Architectural Layers
1. **Frontend (`fasal_sarthi_frontend/`)**: React 19 single-page application built on Vite. Leverages route-level lazy loading (`React.lazy` + `Suspense`) and vendor chunk splitting (`rollupOptions.output.manualChunks`), reducing the primary initial load bundle from 789 kB to 343 kB (gzip: 109 kB). All network communication routes through a centralized client (`src/api/client.js`) that attaches Supabase JWT session tokens and enforces explicit production API endpoint configurations.
2. **Backend (`fasal_sarthi_backend/`)**: Modular Flask application factory (`create_app`) structured into blueprints (`health`, `disease`, `crop`, `fertilizer`, `weather`, `mandi`, `chatbot`), decoupled service wrappers, and middleware for Supabase authentication, rate limiting, and structured error responses.
3. **Machine Learning Layer**: Pre-trained frozen inference models (TensorFlow Lite for leaf disease classification; scikit-learn Stacking and Random Forest classifiers for soil and crop recommendations). All model weights, scalers, and encoders remain frozen with bit-for-bit SHA256 integrity and 100% parity against verified baseline inference.

---

## ✨ Features & Capabilities

- **🌱 Crop Disease Detection (`/scan`)**: Multi-tier upload validation (magic bytes, 10MB limit) passing verified leaf images into a frozen TensorFlow Lite model. Returns predicted condition, confidence score, and optional Gemini-powered treatment advice.
- **🌾 Crop Recommendation (`/crop-recommendation`)**: Ingests 25 soil and meteorological parameters (N, P, K, pH, rainfall, temperature, humidity, soil type, irrigation type, previous crop) into an ensemble Stacking Classifier to predict optimal crop varieties.
- **🧪 Fertilizer Recommendation (`/fertilizer-advice`)**: Recommends customized chemical fertilizer blends based on soil nitrogen, phosphorus, potassium, moisture levels, soil type, and target crop via a Random Forest model.
- **🌦️ Localized Weather Telemetry (`/weather`)**: Real-time atmospheric conditions via OpenWeatherMap with dynamic provider timezone offset calculation for precise local sunrise/sunset times across global coordinates.
- **📈 Mandi Commodity Prices (`/mandi-prices`)**: Fetches agricultural market arrivals and prices from the Indian government open data API (`data.gov.in`) with in-memory caching to minimize upstream latency.
- **🤖 Sarthi AI Agricultural Advisor (`/chat`)**: Bilingual (Hindi/English) agricultural chat assistant powered by Google Gemini 2.5 Flash for farming practices, pest management, and advisory support.
- **🔐 User Identity & Farm Profiles (`/login`, `/register`, `/edit-profile`)**: Secure authentication via Supabase GoTrue with row-level security (RLS) policies protecting farmer profiles in Supabase PostgreSQL.

---

## 🔒 Absolute Machine Learning Freeze

The machine learning layer in this repository is **frozen**. Under no circumstances are model weights, architectures, scalers, encoders, feature schemas, or inference mathematics altered:

| Artifact File | Description | SHA256 Verification Hash |
| :--- | :--- | :--- |
| `FasalSarthi_Full_Model.tflite` | 19-class Crop Disease TFLite Model | `D18162273F2BA7026A7828ECA81B9944F58579CD1444240E19107CB9864317A2` |
| `best_stacking_model_final.joblib` | Crop Recommendation Stacking Classifier | `FA8275E1A968E7F6B18F6F76D93887A5950603F9B745BB047C15B7997C80CCB4` |
| `scaler_final.joblib` | Crop Feature StandardScaler | `7F3A7749BF6D88537BEED79D7ABB4835E53827E45A7E3D1B11CB13F979690E98` |
| `encoder_final.joblib` | Crop Categorical OneHotEncoder | `1B343114927FC6DAE5106E46D33A3B7EC3BC9277661C8709C6A8F23E008AD9CE` |
| `random_forest_model.joblib` | Fertilizer Recommendation Model | `42054E32328769AAC82DBBBDD1D662BA0C36468E770D106E71AD2BBB018736AC` |
| `model_columns.joblib` | Fertilizer Feature Column Definitions | `905B820ECE8A34FC6EB03EAE1BD6E96C2404D9839456D5562608AE192AB7DDDA` |
| `label_encoder.joblib` | Fertilizer LabelEncoder | `3B48DDFDC51883D663EF327E9FD9621035F50E9E7B011B3449AC07A722841AE8` |

*Verification*: Run `python scripts/verify_ml_parity.py` to confirm 100% empirical parity against the baseline.

---

## 🚀 Local Setup & Development

### Prerequisites
- **Python 3.11** (tested on 3.11.9)
- **Node.js 20 LTS** or **24** & **npm**
- **Git**

### 1. Repository Clone
```bash
git clone https://github.com/lakshyasaxena07/Fasal-Sarthi-app.git
cd Fasal-Sarthi-app
```

### 2. Backend Installation & Startup
```bash
# Set up Python virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r fasal_sarthi_backend/requirements.txt

# Verify backend health and dependency consistency
pip check
python scripts/verify_ml_parity.py

# Configure environment variables (see table below)
# Create fasal_sarthi_backend/.env

# Launch Flask development server
python fasal_sarthi_backend/run.py
# Backend runs at http://localhost:5000 (health check: http://localhost:5000/health)
```

### 3. Frontend Installation & Startup
```bash
# Navigate to frontend
cd fasal_sarthi_frontend

# Clean dependency installation
npm ci

# Verify lint cleanliness and production build
npm run lint
npm run build

# Configure local frontend environment variables
# Create fasal_sarthi_frontend/.env.local:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-public-key
# VITE_API_BASE_URL=http://localhost:5000

# Start Vite development server
npm run dev
# Frontend runs at http://localhost:5173
```

---

## 🔑 Environment Variables Reference

### Backend Configuration (`fasal_sarthi_backend/.env` or Render Dashboard)
| Variable | Required | Description |
| :--- | :---: | :--- |
| `FLASK_ENV` | Yes | Set to `production` (or `development` locally) |
| `PORT` | Optional | Port for Gunicorn/Flask (default: `5000`) |
| `CORS_ORIGINS` | Yes | Comma-separated list of allowed origins (e.g. `https://fasal-sarthi-app.vercel.app,http://localhost:5173`) |
| `SUPABASE_URL` | Yes | Supabase Project URL (`https://xyz.supabase.co`) |
| `SUPABASE_SERVICE_KEY` | Optional | Supabase service-role key (server-side operations only; **NEVER** expose to frontend) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key for chatbot and crop advice |
| `OWM_API_KEY` | Yes | OpenWeatherMap API key |
| `MANDI_API_KEY` | Optional | data.gov.in API key for mandi price updates |
| `RATELIMIT_DEFAULT` | Optional | Default rate limit (default: `200 per day, 50 per hour`) |
| `RATELIMIT_ML` | Optional | Rate limit for ML endpoints (default: `30 per minute`) |
| `RATELIMIT_CHAT` | Optional | Rate limit for chat endpoint (default: `15 per minute`) |

### Frontend Configuration (`fasal_sarthi_frontend/.env.local` or Vercel Dashboard)
| Variable | Required | Description |
| :--- | :---: | :--- |
| `VITE_SUPABASE_URL` | Yes | Public Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Public Supabase anon key |
| `VITE_API_BASE_URL` | Yes | URL of live backend (e.g. `https://fasal-sarthi-backend.onrender.com`). In production builds, this is **strictly required**; omitting it produces an immediate configuration failure to prevent silent fallback to localhost. |

> [!CAUTION]
> **Security Guardrail**: Never place `SUPABASE_SERVICE_KEY`, private API keys, or database passwords in `fasal_sarthi_frontend/.env` or `VITE_*` variables. The frontend bundle is public.

---

## ☁️ Production Deployment Guide

### Frontend Deployment (Vercel)
1. Import the repository in [Vercel](https://vercel.com).
2. Set **Root Directory** to `fasal_sarthi_frontend`.
3. Set **Build Command** to `npm run build`.
4. Set **Output Directory** to `dist`.
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`: `https://<your-project>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY`: `<your-supabase-anon-key>`
   - `VITE_API_BASE_URL`: `https://<your-backend>.onrender.com`
6. Client-side routing rewrites are pre-configured in `fasal_sarthi_frontend/vercel.json` (`/(.*)` -> `/index.html`).

### Backend Deployment (Render)
1. Create a new **Web Service** in [Render](https://render.com) connected to this repository.
2. Set **Root Directory** to `fasal_sarthi_backend`.
3. Python version is pinned in `fasal_sarthi_backend/runtime.txt` to `python-3.11.9`.
4. Set **Build Command** to `pip install -r requirements.txt`.
5. Set **Start Command** to `gunicorn --workers 1 --threads 1 --bind 0.0.0.0:$PORT app:app`.
6. Configure health check path to `/health` or `/ready`.
7. Configure required backend environment variables in the Render Dashboard.

---

## ⚠️ Known Limitations & Concurrency Constraints

1. **Single-Threaded Worker Model (ADR-008)**: The frozen TFLite interpreter (`interpreter.invoke()`) is not thread-safe within a multi-threaded Python process. Under the absolute ML freeze constraint, application-level locks and thread refactoring are strictly prohibited. Production Gunicorn deployment is configured with `--workers 1 --threads 1`. High-concurrency traffic requires scaling horizontal worker processes or migrating the model to an isolated inference service.
2. **"My Crops" / "Mera Khet" Feature Scope**: The `/my-crops` route represents a UI prototype/concept. It is not connected to a persistent backend database schema.
3. **Automated Browser E2E Environment Blocker**: In this test environment, the Playwright browser driver download failed upstream with HTTP 404 from external CDN mirrors (`playwright-1.57.0-win32_x64.zip`). Automated browser E2E is marked **BLOCKED**. Production deployment verification must include the manual browser verification checklist documented below.

---

## 📋 Manual Browser Verification Checklist

When deploying to staging or production, execute this manual verification sequence:

- [ ] **1. Public Entry**: Visit `/`. Confirm landing page loads with zero console errors, responsive navigation bar, and clean typography.
- [ ] **2. Auth Guard**: Confirm unauthenticated load produces zero 401 errors from Mandi or Weather context providers.
- [ ] **3. Registration / Login**: Register a new farmer account or log in with existing credentials via Supabase. Confirm redirection to `/dashboard` or `/create-profile`.
- [ ] **4. Profile Creation**: Complete farm profile (Name, State, District). Verify redirection to `/dashboard` occurs seamlessly without a full-page reload (`window.location.reload`).
- [ ] **5. Disease Scan**: Navigate to `/scan`. Upload a test leaf image (`.jpg`). Confirm instant image preview, click "Scan Crop", and verify predicted condition, confidence bar, and treatment recommendations load.
- [ ] **6. Crop Recommendation**: Navigate to `/crop-recommendation`. Fill out soil parameters (N, P, K, pH, rainfall, temperature) and submit. Confirm recommended crop displays.
- [ ] **7. Fertilizer Recommendation**: Navigate to `/fertilizer-advice`. Fill out soil nutrient form and submit. Confirm recommended fertilizer displays.
- [ ] **8. Weather Telemetry**: Navigate to `/weather`. Query a city name (e.g. "Indore", "Jaipur", "London"). Verify temperature, humidity, wind, and local sunrise/sunset times display accurately.
- [ ] **9. Mandi Market Prices**: Navigate to `/mandi-prices`. Select state and commodity. Verify market price table loads.
- [ ] **10. Sarthi AI Chat**: Navigate to `/chat`. Send a farming inquiry in Hindi or English. Confirm streaming/response renders properly.
- [ ] **11. Edit Profile & Logout**: Navigate to `/edit-profile`, update details, save, and log out. Verify session terminates and user is redirected to `/login`.

---

## 🚦 Production Status Summary

> [!WARNING]
> **Production Status: VERIFICATION COMPLETE (AWAITING CLOUD DEPLOYMENT & MANUAL BROWSER VALIDATION)**
>
> Automated local integration, ML parity (100%), backend deterministic regression suite (100%), frontend lint (0 errors, 0 warnings), bundle optimization (17 chunks), and security audits are **PASS**.
> Automated browser E2E verification is **BLOCKED** due to external Playwright driver CDN unavailability. Live cloud deployment verification requires remote host credentials and manual browser execution against deployed URLs.

---

## 👥 Contributors

- **Rounak Jain** - Project Lead & Backend Architecture
- **Shivam Kahar** - Frontend Architecture & UI/UX
- **Lakshya Saxena** - Data Science & Model Engineering
- **Priyani Rathod** - Cloud Deployment & Database Design