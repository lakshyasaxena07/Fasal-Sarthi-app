# Bug Catalog & Remediation Tracking

| ID | Severity | Component | Summary | Root Cause | Status | Planned Phase |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BUG-001** | P0 | Backend | `debug=True` hardcoded in `app.run()` | Production server would expose interactive Werkzeug debugger on unhandled exceptions | PASS | Fixed in Phase 1 (`config.py` driven) |
| **BUG-002** | P0 | Frontend | `MandiProvider.jsx` causes 401 on initial unauthenticated load | Unconditionally invoked `/get_mandi_prices` in `useEffect` without checking if a user session exists | PASS | Fixed in Phase 3 (Guarded with `if (!user) return;`) |
| **BUG-003** | P1 | Backend | Weather sunrise/sunset forced to IST regardless of location | Hardcoded `ist_offset = timedelta(hours=5, minutes=30)` applied after adding provider `timezone` offset | PASS | Fixed in Phase 1 & 2 (Empirically verified with NY UTC-4, Tokyo UTC+9, London UTC+0) |
| **BUG-004** | P1 | Backend | Missing timeouts on external HTTP requests | `requests.get` / `requests.post` called without `timeout=...`, allowing worker threads to stall indefinitely | PASS | Fixed in Phase 1 & 2 (Verified 10s/15s/30s timeouts, mapping to 504/502) |
| **BUG-005** | P1 | Backend | Open wildcard CORS configuration | `CORS(app)` instantiated without origin whitelist, allowing arbitrary cross-origin requests | PASS | Fixed in Phase 2 (Environment allowlist, credentials, preflight tested) |
| **BUG-006** | P1 | Backend | Lack of rate limiting on expensive endpoints | `/predict_disease`, `/sarthi_ai_chat`, etc., had zero rate limits, enabling resource exhaustion | PASS | Fixed in Phase 2 (Flask-Limiter tiers, 429 clean response + Retry-After, health exempt) |
| **BUG-007** | P1 | Frontend | Full page reload on profile creation | `window.location.reload()` used to trigger re-fetch of profile state instead of updating context | PASS | Fixed in Phase 3 (`updateProfileState` + `navigate('/dashboard', {replace: true})`) |
| **BUG-008** | P2 | Frontend | Object URL memory leaks in `ScanPage.jsx` | `URL.createObjectURL(file)` called without corresponding `URL.revokeObjectURL()` cleanup | PASS | Fixed in Phase 3 (Revoke effect & cleanup on reset) |
| **BUG-009** | P2 | Backend | `requirements.txt` encoded in UTF-16LE | File saved in UTF-16LE, causing issues with standard Linux deployment runners & tools | PASS | Fixed in Phase 1 (UTF-8 encoding) |
| **BUG-010** | P2 | Frontend | 2.5MB dead duplicate assets in `src/assests/` | `src/assests/` contains identical image files to `public/` and is never imported | PASS | Fixed in Phase 3 (Deleted duplicate directory) |
| **BUG-011** | P2 | Dependencies| Dead Firebase dependencies | `firebase` in `package.json` and `firebase_admin` in `requirements.txt` are unused | PASS | Fixed in Phase 2 (backend) & Phase 3 (frontend uninstalled) |
| **BUG-012** | P2 | Backend | Missing `/health` and `/ready` endpoints | Render and container orchestrators lack dedicated probes to assess service liveness | PASS | Fixed in Phase 1 (Added and verified) |
| **BUG-013** | P2 | Frontend | Monolithic bundle bloat (789 kB) with >500kB warning | Static page imports in `App.jsx` packed all views into one chunk | PASS | Fixed in Phase 4 (Route-level lazy loading + manualChunks, largest chunk 343 kB, 0 warnings) |
| **BUG-014** | P1 | Frontend | Silent localhost fallback in production build | `client.js` defaulted to localhost:5000 when `VITE_API_BASE_URL` was missing in production | PASS | Fixed in Phase 4 (`getApiBaseUrl()` strictly requires env in prod) |
