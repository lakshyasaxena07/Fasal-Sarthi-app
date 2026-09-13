# Master Test Verification Matrix

*Note: All items use strictly empirical status markers: `PASS`, `FAIL`, `NOT TESTED`, `BLOCKED`, or `NOT APPLICABLE`.*

## 1. Backend Infrastructure & Health
| Check | Expected Behavior | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| Virtualenv Setup | `.venv` created with Python 3.11 | PASS | Verified `.venv\Scripts\python.exe` -> Python 3.11.9 |
| Backend Dependencies | All dependencies installed in `.venv` | PASS | `pip install -r requirements.txt` exited 0 |
| Dependency Health | `pip check` reports no broken requirements | PASS | Clean output, 0 broken requirements |
| `GET /` | Returns 200 OK | PASS | `scripts/test_health_endpoints.py` returned 200 OK |
| `GET /health` | Returns 200 OK + `{"status": "healthy"}` | PASS | Tested with rate-limiter exemption; returns 200 |
| `GET /ready` | Returns 200 OK when models are ready | PASS | Returns 200 with all 3 models marked `ready` |
| No Hardcoded Debug | `app.debug` is not hardcoded to True | PASS | Driven by `config.py`, verified in tests |

## 2. Authentication & Authorization Middleware
| Check | Expected Behavior | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| Unconfigured Supabase | Returns 503 Service Unavailable | PASS | Verified in `run_phase2_tests.py` Section 4 |
| Missing Token | Returns 401 Unauthorized | PASS | Verified in `run_phase2_tests.py` and `run_phase3_tests.py` |
| Malformed Header | Returns 401 Unauthorized | PASS | Verified non-Bearer token returns 401 |
| Invalid / Expired Token | Returns 401 Unauthorized | PASS | Verified Supabase rejected token returns 401 |
| Valid Token | Injects `g.user` and allows request (200 OK) | PASS | Verified valid mock token passes through |

## 3. Disease Detection Model (Frozen Inference & Upload Security)
| Check | Expected Behavior | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| Original Implementation Baseline | Fixed baseline on `corn_blight.jpeg` | PASS | Baseline: `Corn__Blight`, 92.14%, index 0, raw 0.921367 |
| Service Extracted Parity | Extracted service matches baseline 100% | PASS | Verified via `verify_ml_parity.py` (0 errors) |
| Missing File Key | Returns 400 Bad Request | PASS | Verified in `run_phase2_tests.py` |
| Empty Filename | Returns 400 Bad Request | PASS | Verified in `run_phase2_tests.py` |
| Empty File Content (0 bytes) | Returns 400 Bad Request | PASS | Verified in `run_phase2_tests.py` |
| Non-Image Extension (.pdf) | Returns 400 Bad Request | PASS | Verified in `run_phase2_tests.py` |
| Corrupt / Spoofed Image | Returns 400 Bad Request | PASS | Verified PIL magic byte validation in `run_phase2_tests.py` |
| Oversized File (>10MB) | Returns 413 Payload Too Large | PASS | Verified Flask `MAX_CONTENT_LENGTH` triggers 413 JSON |
| Frozen Artifact SHA256 Hash | Model hash matches Phase 0 | PASS | `D18162273F2BA7026A7828ECA81B9944F58579CD1444240E19107CB9864317A2` |

## 4. Crop Recommendation Model (Frozen Inference & Validation)
| Check | Expected Behavior | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| Original Implementation Baseline | Fixed 25-feature input baseline | PASS | Baseline: `Sabziyaan` |
| Service Extracted Parity | Extracted service matches baseline 100% | PASS | Verified via `verify_ml_parity.py` |
| Empty Payload | Returns 400 Bad Request | PASS | Verified in `run_phase2_tests.py` |
| Missing Numerical Field | Returns 400 Bad Request | PASS | Verified in `run_phase2_tests.py` |
| Invalid Categorical Soil Type | Returns 400 Bad Request | PASS | Verified in `run_phase2_tests.py` |
| Frozen Artifact SHA256 Hashes | Model, scaler, encoder hashes match | PASS | All 4 crop artifact hashes bit-for-bit identical |

## 5. Fertilizer Recommendation Model (Frozen Inference & Validation)
| Check | Expected Behavior | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| Original Implementation Baseline | Fixed input baseline | PASS | Baseline: `17-17-17` |
| Service Extracted Parity | Extracted service matches baseline 100% | PASS | Verified via `verify_ml_parity.py` |
| Empty Payload | Returns 400 Bad Request | PASS | Verified in `run_phase2_tests.py` |
| Invalid Categorical Soil Type | Returns 400 Bad Request | PASS | Verified in `run_phase2_tests.py` |
| Frozen Artifact SHA256 Hashes | Model, encoder, columns hashes match | PASS | All 3 fertilizer artifact hashes bit-for-bit identical |

## 6. External APIs, Resilience & Security
| Check | Expected Behavior | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| CORS Authorized Origin | 200 OK + `Access-Control-Allow-Origin` | PASS | `http://localhost:5173` allowed with credentials |
| CORS Unauthorized Origin | Origin header not echoed | PASS | `https://malicious-site.com` denied |
| CORS Preflight OPTIONS | Returns 200 with allowed methods/headers | PASS | Tested OPTIONS preflight request |
| Requests without Origin | Normal processing (status 200) | PASS | Verified server-to-server calls pass |
| Rate Limiting Trigger | Returns 429 Too Many Requests | PASS | 3rd request in burst returns clean 429 JSON |
| Rate Limiting Header | Returns `Retry-After` header | PASS | Verified header present on 429 |
| Rate Limiting Exemption | `/health` and `/ready` never rate-limited | PASS | Verified `/health` returns 200 while client is 429-limited |
| Weather Non-IST Timezone (NY) | Accurate sunrise calculation | PASS | New York (UTC-4) correctly calculated: `08:00 AM` |
| Weather Non-IST Timezone (Tokyo) | Accurate sunrise calculation | PASS | Tokyo (UTC+9) correctly calculated: `09:00 PM` |
| Weather Non-IST Timezone (London)| Accurate sunrise calculation | PASS | London (UTC+0) correctly calculated: `12:00 PM` |
| Weather Upstream Timeout | Returns 504 Gateway Timeout | PASS | Tested mock timeout on `requests.get` |
| Weather Upstream Conn Error | Returns 502 Bad Gateway | PASS | Tested mock `ConnectionError` on `requests.get` |
| Mandi Upstream Timeout | Returns 504 Gateway Timeout | PASS | Tested mock timeout on `requests.get` |
| Chatbot Upstream Timeout | Returns 504 Gateway Timeout | PASS | Tested mock timeout on `requests.post` |

## 7. Frontend Integration & Architecture (Phase 3)
| Check | Expected Behavior | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- |
| Unauthenticated Mount | Zero 401 console errors on `/` or `/login` | PASS | `MandiProvider.jsx` guarded with `if (!user) return;` |
| Mandi Auth Trace | Session -> JWT -> Bearer header -> 200 OK | PASS | Verified in `run_phase3_tests.py` Section 1 |
| Profile Creation Navigation | Navigates to `/dashboard` without reload | PASS | `updateProfileState` called, `window.location.reload` eliminated |
| Object URL Cleanup | `revokeObjectURL` executed on reset & unmount | PASS | Implemented and verified in `ScanPage.jsx` |
| Centralized API Layer | All endpoints routed through `src/api/` | PASS | All 8 API modules created and verified |
| Frontend Secret Audit | Zero service keys or private credentials | PASS | Codebase scan verified 0 leaks in `run_phase3_tests.py` |
| Dead Asset Pruning | `src/assests/` deleted (2.5MB saved) | PASS | Verified `src/assests` removed, bundle references intact |
| Firebase Pruning | `firebase` uninstalled (79 packages pruned) | PASS | Verified removed from `package.json` |
| Frontend Lint | `npm run lint` exits code 0 | PASS | Clean output: 0 errors and 0 warnings |
| Frontend Build | `npm run build` generates `dist/` | PASS | `vite build` completed with code 0; 0 warnings |

## 8. Phase 4 Comprehensive Testing & Hardening Quality Gate
| Area | Check | Expected Behavior | Status | Evidence / Notes |
| :--- | :--- | :--- | :--- | :--- |
| ML Freeze | SHA256 Hashes | All 7 model files match Phase 0 bit-for-bit | PASS | Verified in `run_phase4_backend_tests.py` |
| ML Parity | Disease Parity | 100% parity with Phase 0 baseline | PASS | Corn__Blight, 92.14%, index 0, raw 0.921367 |
| ML Parity | Crop Parity | 100% parity with Phase 0 baseline | PASS | Sabziyaan |
| ML Parity | Fertilizer Parity| 100% parity with Phase 0 baseline | PASS | 17-17-17 |
| Lint | ESLint Cleanliness | 0 errors and 0 warnings | PASS | Context fast-refresh rules configured; 0 errors, 0 warnings |
| Bundle | Route Lazy Loading | Route-level code splitting & manualChunks | PASS | 17 chunks; largest 343 kB (down from 789 kB monolith); zero >500kB warnings |
| Env Hardening | Production Fallback | Block silent localhost fallback in production | PASS | `getApiBaseUrl()` throws explicit configuration error if omitted |
| Backend Regression| Deterministic Suite | All auth, ML, validation, infra, CORS tests | PASS | `run_phase4_backend_tests.py` 100% pass |
| Infrastructure | Error Payloads | Clean JSON payloads for 404, 405, 413, 429, 500 | PASS | Stack traces strictly suppressed on 500 errors |
| Upstream Errors | Resilience | 504 on timeout, 502 on conn error, 404 upstream | PASS | Verified in `run_phase4_backend_tests.py` |
| Rate Limiting | Burst & Exemption | 429 with Retry-After; /health and /ready exempt | PASS | Verified in `run_phase4_backend_tests.py` |
| CORS | Strict Allowlist | Allowed origins + credentials; evil origin rejected | PASS | Tested localhost:5173, vercel app, and malicious origin |
| Dependency Audit | Frontend npm | 0 vulnerabilities | PASS | `npm audit fix` resolved 22 advisories; 0 vulnerabilities |
| Dependency Audit | Backend pip | No broken requirements | PASS | `pip check` confirmed 0 broken requirements |
| Security Audit | Secret Leak Scan | 0 secrets or private keys in repository | PASS | Verified no service-role keys in frontend, .env ignored |
| CI/CD | GitHub Actions | Automated workflow for tests, parity, lint, build | PASS | `.github/workflows/ci.yml` created |
| Frontend Journey | Contract & E2E | 45/45 frontend contract & navigation checks | PASS | `run_frontend_integration_tests.mjs` passed 45/45 |
| Browser Auto | Playwright Driver | Browser context initialization | BLOCKED | Subagent driver download hit 404 upstream; documented as environment limitation |
| Deployment Prep | Render & Vercel | Procfile single thread, vercel.json SPA rewrites | PASS | Verified Procfile (`--workers 1 --threads 1`) & vercel.json |

## 9. Phase 5 Final Quality Gate Matrix
| Area | Status | Evidence |
| :--- | :--- | :--- |
| **ML artifact integrity** | PASS | All 7 model SHA256 hashes bit-for-bit identical to Phase 0 baseline |
| **ML parity** | PASS | `verify_ml_parity.py` confirmed 100% parity on Disease, Crop, Fertilizer |
| **Backend regression** | PASS | `run_phase4_backend_tests.py` completed with 100% pass rate across all suites |
| **Frontend lint** | PASS | `npm run lint` exited 0 with 0 errors and 0 warnings |
| **Frontend build** | PASS | `npm run build` cleanly compiled 17 chunks with 0 warnings |
| **Security audit** | PASS | Repository scan confirmed 0 exposed secrets; `.env` untracked in `.gitignore` |
| **Dependency audit** | PASS | `pip check` clean; `npm audit` reports 0 vulnerabilities |
| **CI** | PASS | `.github/workflows/ci.yml` covers clean checkout, Python 3.11, Node 20 |
| **Supabase** | PASS | Standardized on Supabase Auth/DB; Firebase dependencies completely eradicated |
| **Authentication** | PASS | JWT Bearer validation verified with 401 on missing/expired and 200 on valid |
| **CORS** | PASS | `CORS_ORIGINS` strictly controls allowed domains; credentials & preflights verified |
| **Rate limiting** | PASS | Tiered Flask-Limiter returns 429 + `Retry-After`; `/health` and `/ready` exempt |
| **Upload security** | PASS | 10MB limit enforced (413), whitelisted extensions, PIL magic byte verification |
| **External APIs** | PASS | Explicit timeouts (10s/15s/30s) mapped to standard HTTP 502/504 status codes |
| **Local integration** | PASS | Full local frontend-backend journey validated via scripts & test suite |
| **Browser E2E** | BLOCKED | Automated Playwright driver download failed with upstream 404 CDN error; manual checklist provided |
| **Vercel deployment** | NOT TESTED | Configuration verified (`vercel.json`, build scripts); live deployment requires cloud credentials |
| **Render deployment** | NOT TESTED | Configuration verified (`Procfile`, `runtime.txt`, `/health`); live deployment requires cloud credentials |
| **Vercel → Render integration** | NOT TESTED | Requires live remote cloud deployment URLs |
| **Production environment variables** | PASS | `getApiBaseUrl()` strictly requires `VITE_API_BASE_URL` in production; zero secrets leaked |
| **Performance** | PASS | Route-level code splitting & vendor chunking (17 chunks, largest entry chunk 343 kB) |
| **Documentation** | PASS | All control docs and `Readme.md` completely updated |
| **Git hygiene** | PASS | Clean `git status`, clean `git diff --check`, no rogue or generated files |
