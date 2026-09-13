# Architectural Decision Records (ADRs)

## ADR-001: Strict Preservation of ML Binaries and Math
- **Status**: Accepted
- **Context**: The project employs pre-trained ML models for disease detection (TFLite), crop recommendation (Stacking Classifier via scikit-learn), and fertilizer recommendation (Random Forest).
- **Decision**: All `.tflite` and `.joblib` model binaries, encoders, scalers, preprocessing pipelines, input ordering, and confidence calculations are frozen. Extraction into service boundaries must be purely mechanical without modifying computation or data structures. Before any code extraction, an empirical fixed-input baseline must be captured from the original implementation and verified 100% identical post-extraction.
- **Consequence**: Avoids regressions in ML prediction accuracy and preserves colab-trained weights. Concurrency concerns regarding the TFLite interpreter are deferred as known limitations and mitigated via single-threaded synchronous worker deployment.

## ADR-008: Synchronous Single-Threaded Worker Configuration for Frozen TFLite
- **Status**: Accepted
- **Context**: The frozen TFLite interpreter `interpreter.invoke()` is not thread-safe within a multi-threaded process. Adding concurrency locks/synchronization into application code is forbidden under the ML freeze constraint.
- **Decision**: Configure deployment to run synchronous, single-threaded workers (e.g. Gunicorn with `--workers 1 --threads 1` or standard sync worker mode).
- **Consequence**: Safely prevents concurrent re-entry into the frozen interpreter without modifying ML code. Incurs a performance/throughput tradeoff that is explicitly cataloged as a residual risk and future microservice enhancement candidate.

## ADR-002: Supabase Standardization and Firebase Pruning
- **Status**: Accepted
- **Context**: The repository contained legacy references and dependencies for Firebase (`firebase` in `package.json`, `firebase_admin` in `requirements.txt`), while authentication and profile data are powered entirely by Supabase.
- **Decision**: Standardize 100% on Supabase Auth & Database. Completely remove Firebase dependencies:
  - Backend: Removed `firebase_admin` from `requirements.txt` in Phase 2.
  - Frontend: Uninstalled `firebase` (79 packages removed) from `package.json` in Phase 3.
- **Consequence**: Eliminates dual-authentication bloat, reduces frontend bundle size and install times, and simplifies codebase maintenance.

## ADR-003: Backend App Factory and Modular Layering
- **Status**: Accepted
- **Context**: The backend was originally a single 759-line script (`app.py`) containing configuration, route definitions, model loading, external API calls, and authentication logic.
- **Decision**: Adopt the standard Flask Application Factory pattern (`create_app`) with decoupled packages:
  - `app/config.py`: Environment configurations
  - `app/extensions.py`: Shared extension instances
  - `app/middleware/`: Auth decorators and error handlers
  - `app/routes/`: Thin Blueprint route handlers
  - `app/services/`: Isolated business logic and external client callers
  - `app.py`: Backwards-compatible WSGI entry point for `gunicorn app:app`
- **Consequence**: Dramatically improves maintainability, unit testability, and separation of concerns while maintaining full compatibility with Render's deployment command.

## ADR-004: Frontend State Management Without Page Reloads
- **Status**: Accepted
- **Context**: Profile creation previously triggered `window.location.reload()` to force `UserProvider` to re-fetch profile data from Supabase.
- **Decision**: Enhance `UserProvider.jsx` with an explicit `updateProfileState(profileData)` method and `refreshProfile()`. In `CreateProfilePage.jsx` and `EditProfilePage.jsx`, call `updateProfileState()` immediately upon database write and navigate via React Router (`navigate('/dashboard', { replace: true })`).
- **Consequence**: Guarantees seamless SPA transitions, eliminates flash of unstyled content and redirect glitches, and avoids duplicate network roundtrips.

## ADR-005: Unauthenticated Guard on Mandi Provider
- **Status**: Accepted
- **Context**: `MandiProvider.jsx` fired `/get_mandi_prices` unconditionally upon initial app mount, triggering 401 Unauthorized errors in browser consoles on public routes (`/`, `/login`, `/register`).
- **Decision**: Guard `fetchFavoriteMandiPrice` with `if (!user) { setMandiData(null); setIsMandiLoading(false); return; }`, matching the pattern established in `WeatherContext.jsx`.
- **Consequence**: Prevents noise in developer logs and eliminates unauthorized network requests for logged-out visitors.

## ADR-006: External API Resilience and Timeouts
- **Status**: Accepted
- **Context**: Outgoing HTTP requests to Gemini, OpenWeatherMap, and data.gov.in lacked timeout parameters, risking indefinitely blocked worker threads in Gunicorn.
- **Decision**: Impose explicit timeouts (OpenWeatherMap: 10s, data.gov.in: 15s, Gemini: 30s) and map failures to standard HTTP 502/504 status codes.
- **Consequence**: Prevents cascading thread starvation and provides clear diagnostics to clients when upstream services stall.

## ADR-007: Configurable Rate Limiting
- **Status**: Accepted
- **Context**: Public endpoints (especially LLM and ML inference) were vulnerable to abuse and accidental request flooding.
- **Decision**: Integrate `Flask-Limiter` with environment-configurable limits (`RATELIMIT_DEFAULT`, `RATELIMIT_ML`, `RATELIMIT_CHAT`, `RATELIMIT_WEATHER_MANDI`). Return clean 429 JSON responses with `Retry-After` header. Exempt health probes (`/health`, `/ready`).
- **Consequence**: Protects external API quota limits and server memory from denial-of-service attempts without disrupting monitoring or normal user sessions.

## ADR-009: Strict CORS Origin Allowlisting
- **Status**: Accepted
- **Context**: `flask_cors.CORS(app)` originally allowed unrestricted wildcard (`*`) origins across all routes, posing cross-site security risks.
- **Decision**: Restrict CORS origins via `CORS_ORIGINS` environment variable with safe defaults (`http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`). Support credentials, preflight OPTIONS requests, and explicitly reject untrusted domains.
- **Consequence**: Enforces origin security in production while ensuring smooth local development across Vite dev server ports.

## ADR-010: Multi-Tier Upload Validation for Disease Inference
- **Status**: Accepted
- **Context**: `/predict_disease` accepted raw multipart file uploads with only basic file existence checks, exposing the server to memory exhaustion from giant uploads or corrupted file crashes in PIL.
- **Decision**: Implement a 4-step upload validation pipeline:
  1. `MAX_CONTENT_LENGTH = 10 * 1024 * 1024` (10MB) enforced at Flask application level (clean 413 error).
  2. Whitelist file extensions (`.jpg`, `.jpeg`, `.png`, `.webp`).
  3. Validate image magic bytes and header integrity via PIL `Image.open().verify()` without writing to disk.
  4. Pass verified image bytes into the frozen `DiseaseService`.
- **Consequence**: Completely prevents malicious, oversized, empty, or corrupt files from reaching the ML pipeline.

## ADR-011: Weather Local Timezone Calculation via Provider Offset
- **Status**: Accepted
- **Context**: The original implementation incorrectly applied a hardcoded Indian Standard Time (IST, UTC+5:30) offset to all locations regardless of actual longitude.
- **Decision**: Calculate sunrise and sunset using the dynamic `timezone` shift parameter (in seconds from UTC) returned by OpenWeatherMap: `datetime.fromtimestamp(ts, tz=timezone.utc).astimezone(timezone(timedelta(seconds=tz_offset)))`.
- **Consequence**: Ensures accurate local astronomical times for any queried global coordinates (verified on New York UTC-4, Tokyo UTC+9, and London UTC+0).

## ADR-012: Centralized Frontend API Client Architecture
- **Status**: Accepted
- **Context**: Every page component previously duplicated the `VITE_API_BASE_URL` logic and made ad-hoc `axios.post` calls with inconsistent headers, error handling, and manual token parsing.
- **Decision**: Implement a lightweight, modular API layer in `src/api/`:
  - `client.js`: Configures base URL from `VITE_API_BASE_URL`, registers an asynchronous request interceptor attaching the active Supabase JWT Bearer token, and provides consistent error extraction.
  - Domain modules (`disease.js`, `crop.js`, `fertilizer.js`, `weather.js`, `mandi.js`, `chatbot.js`).
  - `axiosInstance.js`: Retained as a thin proxy to `client.js` for backwards compatibility.
- **Consequence**: Eliminates duplicated configuration across components, prevents token leakage bugs, and standardizes error handling.

## ADR-013: Memory-Safe Object URL Lifecycle Management
- **Status**: Accepted
- **Context**: `ScanPage.jsx` created browser blob URLs via `URL.createObjectURL(file)` without revoking them, causing memory leaks across repeated scans.
- **Decision**: Explicitly revoke previous object URLs before generating new ones and register an unmount cleanup effect:
  ```javascript
  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);
  ```
- **Consequence**: Prevents memory bloat during prolonged leaf inspection sessions.

## ADR-014: Route-Level Code Splitting & Vendor Chunking
- **Status**: Accepted
- **Context**: `App.jsx` statically imported all 12 page views, compiling into a single monolithic JavaScript bundle (`dist/assets/index-*.js`, 788.98 kB minified / 229 kB gzip) that triggered Vite warning `(!) Some chunks are larger than 500 kB`.
- **Decision**:
  1. Convert all page component imports in `App.jsx` to `React.lazy(() => import('./pages/...'))` wrapped in `<Suspense fallback={<PageLoader />}>`.
  2. Configure `rollupOptions.output.manualChunks` in `vite.config.js` to split vendor dependencies (`react`, `react-dom`, `react-router-dom`) and `@supabase/supabase-js`.
- **Consequence**: Drastically lowers initial page load payload on public routes; splits the application cleanly into 17 lightweight chunks with the largest entry chunk reduced from 789 kB to 343 kB (gzip: 109 kB); completely eliminates Vite `> 500 kB` warnings.

## ADR-015: Strict Production API Base URL Enforcement
- **Status**: Accepted
- **Context**: `client.js` originally had a fallback `http://localhost:5000` that could mask missing environment variables in production deployments, causing subtle runtime network failures against nonexistent localhost endpoints.
- **Decision**: Implement `getApiBaseUrl()`:
  - In development mode (`import.meta.env.DEV`), allow safe fallback to `http://localhost:5000`.
  - In production builds (`!import.meta.env.DEV`), strictly require an explicit `VITE_API_BASE_URL` and throw an actionable error: `"Configuration Error: VITE_API_BASE_URL environment variable is required in production but was not configured."`.
- **Consequence**: Guarantees production builds never silently target localhost, surfacing misconfigurations early and clearly.

## ADR-016: Production Deployment Architecture and Runtime Pinning
- **Status**: Accepted
- **Context**: Deploying to Render without specifying Python runtime version defaults to Render's default image (which may run Python 3.8 or 3.9), causing incompatibilities with scikit-learn 1.6/1.7 model serialization and requirements.txt. Similarly, Vercel frontend deployments require SPA rewrites to avoid HTTP 404 on deep links (`/scan`, `/weather`, `/dashboard`).
- **Decision**:
  1. Add `fasal_sarthi_backend/runtime.txt` pinning `python-3.11.9`.
  2. Maintain `fasal_sarthi_backend/Procfile` with `web: gunicorn --workers 1 --threads 1 --bind 0.0.0.0:$PORT app:app`.
  3. Verify `fasal_sarthi_frontend/vercel.json` rewrite configuration (`"source": "/(.*)", "destination": "/index.html"`).
- **Consequence**: Ensures the cloud build environment matches the verified local `.venv` Python 3.11 environment, preventing runtime unpickling errors on frozen ML models.
