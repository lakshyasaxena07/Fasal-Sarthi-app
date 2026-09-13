# System Architecture Specification

## 1. High-Level Architecture

```mermaid
graph TB
    subgraph Client Layer
        Web[React 19 / Vite SPA]
        Router[React Router DOM v7]
        AuthCtx[Supabase Session & User Context]
        APIClient[Axios Centralized API Client]
        Web --> Router
        Router --> AuthCtx
        AuthCtx --> APIClient
    end

    subgraph External Auth & DB
        SupaAuth[Supabase Auth Engine]
        SupaDB[(Supabase PostgreSQL: profiles table)]
        AuthCtx -.->|Anon Key| SupaAuth
        AuthCtx -.->|RLS Protected| SupaDB
    end

    subgraph Backend Layer (Flask)
        Gunicorn[WSGI: Gunicorn Production Runner]
        AppFactory[Flask App Factory: create_app]
        Middleware[Auth Guard + Error Handlers + Rate Limiter]

        Gunicorn --> AppFactory
        AppFactory --> Middleware

        subgraph Blueprints
            HealthBP[/health, /ready]
            DiseaseBP[/predict_disease]
            CropBP[/recommend_crop]
            FertBP[/recommend_fertilizer]
            ChatBP[/sarthi_ai_chat]
            WeatherBP[/get_weather]
            MandiBP[/get_mandi_prices]
        end

        Middleware --> HealthBP
        Middleware --> DiseaseBP
        Middleware --> CropBP
        Middleware --> FertBP
        Middleware --> ChatBP
        Middleware --> WeatherBP
        Middleware --> MandiBP
    end

    subgraph Service & ML Layer (Frozen)
        DisService[DiseaseService: TFLite Model]
        CropService[CropService: Stacking Classifier]
        FertService[FertilizerService: Random Forest]
        GeminiService[GeminiService: REST v1beta]
        WeatherService[WeatherService: OWM REST]
        MandiService[MandiService: data.gov.in REST]

        DiseaseBP --> DisService
        CropBP --> CropService
        FertBP --> FertService
        ChatBP --> GeminiService
        WeatherBP --> WeatherService
        MandiBP --> MandiService
    end

    subgraph External Upstream Providers
        GeminiAPI[Google Gemini 2.5 Flash]
        OWMAPI[OpenWeatherMap API]
        GovAPI[data.gov.in Mandi API]

        GeminiService --> GeminiAPI
        WeatherService --> OWMAPI
        MandiService --> GovAPI
    end

    APIClient -->|Bearer Token & HTTPS| Gunicorn
    Middleware -.->|Validate JWT| SupaAuth
```

## 2. Directory Structure

```text
Fasal-Sarthi-app/
├── .gitignore                          # Strict gitignore covering .venv, node_modules, envs
├── .venv/                              # Python isolated virtual environment
├── Readme.md                           # Professional repository documentation
├── docs/
│   └── ai/                             # Living AI control and tracking documentation
│       ├── HANDOVER.md
│       ├── DECISIONS.md
│       ├── FLOW.md
│       ├── ARCHITECTURE.md
│       ├── CONSTRAINTS.md
│       ├── TEST_CHECKLIST.md
│       ├── ROLLBACK.md
│       ├── BUG.md
│       └── FEATURE.md
├── fasal_sarthi_backend/
│   ├── Procfile                        # Render start command: web: gunicorn app:app
│   ├── runtime.txt                     # Pinned Python runtime: python-3.11.9
│   ├── requirements.txt                # Curated backend dependencies (UTF-8)
│   ├── app.py                          # Backwards-compatible WSGI runner
│   ├── run.py                          # Development runner
│   ├── *.joblib                        # Frozen ML models, encoders, and scalers
│   ├── *.tflite                        # Frozen TFLite disease detection model
│   ├── app/
│   │   ├── __init__.py                 # Flask Application Factory (create_app)
│   │   ├── config.py                   # Centralized configuration (Dev, Test, Prod)
│   │   ├── extensions.py               # Flask-Limiter, CORS, Supabase clients
│   │   ├── middleware/
│   │   │   ├── auth.py                 # Supabase token validation decorator
│   │   │   └── errors.py               # Consistent JSON error handlers
│   │   ├── routes/
│   │   │   ├── health.py               # /health and /ready routes
│   │   │   ├── disease.py              # /predict_disease route
│   │   │   ├── crop.py                 # /recommend_crop route
│   │   │   ├── fertilizer.py           # /recommend_fertilizer route
│   │   │   ├── chatbot.py              # /sarthi_ai_chat route
│   │   │   ├── weather.py              # /get_weather route
│   │   │   └── mandi.py                # /get_mandi_prices route
│   │   ├── services/
│   │   │   ├── disease_service.py      # Mechanical TFLite invocation wrapper
│   │   │   ├── crop_service.py         # Mechanical Stacking Classifier wrapper
│   │   │   ├── fertilizer_service.py   # Mechanical Random Forest wrapper
│   │   │   ├── gemini_service.py       # Gemini API client with timeouts
│   │   │   ├── weather_service.py      # OWM API client with accurate timezone offset
│   │   │   └── mandi_service.py        # data.gov.in client with caching
│   │   └── utils/
│   │       ├── logging.py              # Structured request logging
│   │       └── validation.py           # Input schema validation helpers
│   └── tests/
│       ├── conftest.py
│       ├── test_health.py
│       ├── test_auth.py
│       ├── test_disease.py
│       ├── test_crop.py
│       ├── test_fertilizer.py
│       ├── test_weather.py
│       ├── test_mandi.py
│       └── test_chatbot.py
└── fasal_sarthi_frontend/
    ├── package.json                    # Pruned frontend dependencies (no Firebase)
    ├── vite.config.js
    ├── vercel.json                     # SPA client-side routing rewrites
    ├── public/                         # Static assets and i18n translation bundles
    └── src/
        ├── App.jsx                     # Route definitions & navigation structure
        ├── main.jsx                    # Root provider assembly
        ├── api/                        # Centralized API client layer
        │   ├── client.js
        │   ├── disease.js
        │   ├── crop.js
        │   ├── fertilizer.js
        │   ├── weather.js
        │   ├── mandi.js
        │   ├── chatbot.js
        │   └── index.js
        ├── Context/                    # React Context providers (User, Weather, Soil, Mandi)
        ├── components/                 # Layout & UI components
        └── pages/                      # Page components
```

## 3. Concurrency & Execution Model
- **Worker Configuration**: Gunicorn runs in synchronous single-threaded worker mode (e.g. `gunicorn app:app --workers 1 --threads 1`).
- **Rationale**: The frozen TFLite interpreter (`interpreter.invoke()`) is not thread-safe for concurrent invocations within a single process. Modifying the interpreter lifecycle, adding locks (`threading.Lock()`), or altering ML code is strictly forbidden.
- **Tradeoff & Residual Risk**: Enforcing a synchronous single-threaded worker eliminates concurrent re-entry into TFLite, avoiding runtime segmentation faults or state corruption. However, this limits request concurrency per process. This is formally documented as a temporary performance/concurrency tradeoff and residual risk for future microservice/worker isolation.

## 4. Security Architecture (Phase 2 Hardening)
- **Rate Limiting Layer**:
  - Powered by `Flask-Limiter` with memory storage by default, configurable Redis backing via `RATELIMIT_STORAGE_URI`.
  - Tiers: `RATELIMIT_DEFAULT` (200/day, 50/hour), `RATELIMIT_ML` (30/minute), `RATELIMIT_CHAT` (15/minute), `RATELIMIT_WEATHER_MANDI` (60/minute).
  - Clean HTTP 429 JSON response structure with `Retry-After` header.
  - `/health` and `/ready` probes are explicitly decorated with `@limiter.exempt`.
- **CORS Ingress Control**:
  - `Flask-CORS` configured with environment-variable array `CORS_ORIGINS`.
  - Localhost development origins allowed (`http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`).
  - Supports credentials, custom headers (`Content-Type`, `Authorization`), and handles preflight `OPTIONS` requests cleanly.
- **Upload Validation Pipeline**:
  - Application-level `MAX_CONTENT_LENGTH = 10MB`.
  - Whitelisted extensions (`.jpg`, `.jpeg`, `.png`, `.webp`).
  - Strict PIL magic byte and header verification (`test_img.verify()`) rejecting non-image or corrupted files with HTTP 400.
  - Safe memory handling via `io.BytesIO` without writing temp files to disk.

## 5. Frontend Performance & Bundle Architecture (Phase 4)
- **Route-Level Code Splitting**: All 12 page components in `App.jsx` are dynamically loaded on-demand via `React.lazy()` wrapped in `<Suspense fallback={<PageLoader />}>`.
- **Vendor Chunking**: Configured in `vite.config.js` via `rollupOptions.output.manualChunks`:
  - `vendor`: `react`, `react-dom`, `react-router-dom` (~50 kB minified)
  - `supabase`: `@supabase/supabase-js` (~168 kB minified)
  - Individual page chunks: 3 kB to 10 kB (with `ScanPage` at 68 kB due to image processing/camera dependencies).
- **Bundle Metrics**:
  - Monolithic baseline: 788.98 kB JS (gzip: 229 kB), 2 chunks, Vite warning > 500 kB.
  - Optimized output: 17 chunks, largest entry chunk 343 kB (gzip: 109 kB), zero warnings.
- **Environment Hardening**: `src/api/client.js` enforces dynamic production validation. Missing `VITE_API_BASE_URL` in production builds fails explicitly with a descriptive configuration error, preventing silent fallback to localhost.
