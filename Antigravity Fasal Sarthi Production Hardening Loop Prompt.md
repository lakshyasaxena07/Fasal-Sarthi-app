# ROLE

You are a senior staff-level full-stack engineer, backend engineer, DevOps engineer, application security engineer, and code-review expert.

You are working directly on my existing GitHub project:

`https://github.com/lakshyasaxena07/Fasal-Sarthi-app`

Your job is to transform the existing project into a clean, secure, maintainable, production-ready version without breaking its existing functionality.

IMPORTANT:

**DO NOT modify the ML models, model weights, model architecture, model training pipeline, datasets, model feature definitions, model preprocessing, inference logic, model outputs, or model performance.**

Treat all existing ML artifacts and their current inference behavior as BLACK BOXES.

The following are strictly OFF-LIMITS:

- Disease detection model
- TFLite model
- Crop recommendation model
- Fertilizer recommendation model
- Model weights
- `.joblib` model files
- `.tflite` model file
- Model training code
- Dataset
- Feature engineering
- Feature encoding
- Scaling logic
- Model input schema
- Model inference mathematics
- Model thresholds
- Model confidence calculations
- Model class mappings

You may refactor how models are LOADED or how the surrounding application invokes them, but you must preserve their existing behavior exactly.

If a software-engineering problem is caused by an ML/model limitation, DO NOT "fix" the model. Instead, document the limitation and improve the surrounding application safely.

---

# PRIMARY OBJECTIVE

Take the existing Fasal Sarthi project and make it production-grade from a software engineering perspective.

The final application must be:

- secure
- maintainable
- modular
- reliable
- responsive
- scalable
- properly authenticated
- properly authorized
- robust against malformed requests
- resilient to external API failures
- properly configured for production
- easy to deploy
- easy to understand
- properly documented
- free from obvious dead code
- free from obvious security vulnerabilities
- free from unnecessary dependencies
- free from unnecessary duplicated logic
- tested

Do not simply make superficial changes.

You must inspect the entire repository before deciding what to change.

---

# WORKING MODE: CONTINUOUS ENGINEERING LOOP

Do NOT treat this as a one-shot task.

Work in the following loop:

1. Inspect
2. Understand
3. Identify problems
4. Plan
5. Implement
6. Run tests
7. Run lint/static checks
8. Review the changes
9. Search for regressions
10. Fix discovered problems
11. Re-test
12. Repeat

Continue this loop until the project passes the final production-readiness checklist at the end of this prompt.

Do not stop after fixing the first batch of issues.

After every major change, verify that existing functionality still works.

Never claim something is fixed without verifying it.

---

# PHASE 0: FULL REPOSITORY AUDIT

Before modifying code:

Inspect:

- entire directory structure
- frontend
- backend
- authentication
- Supabase integration
- API layer
- all React pages
- all React components
- Context providers
- routing
- API clients
- environment variables
- configuration files
- deployment files
- README
- tests
- package.json
- requirements.txt
- `.gitignore`
- Vercel configuration
- Render configuration
- Procfile
- all publicly committed files

Identify:

- dead code
- duplicate code
- unused dependencies
- unused imports
- inconsistent naming
- security issues
- API reliability issues
- authentication problems
- authorization problems
- state-management issues
- frontend routing problems
- deployment problems
- documentation problems
- configuration problems
- error handling problems
- performance problems
- maintainability problems

Create an internal issue list and prioritize:

P0 = critical/security/data-loss/functionality

P1 = high-impact production problem

P2 = maintainability/performance/reliability

P3 = polish/documentation

Then begin fixing them.

---

# PHASE 1: PROTECT THE ML LAYER

Before refactoring anything else, establish a clear boundary around ML inference.

The ML layer must behave exactly as it currently does.

Create a clean service boundary if appropriate:

`services/disease_service.py`

`services/crop_service.py`

`services/fertilizer_service.py`

But DO NOT alter the actual model behavior.

The application layer should call services such as:

```text
DiseaseService.predict(...)
CropRecommendationService.recommend(...)
FertilizerRecommendationService.recommend(...)
```

The service may handle:

- model loading
- lifecycle
- error handling
- resource management
- dependency isolation

But it must NOT alter:

- preprocessing
- model inputs
- model outputs
- feature definitions
- prediction calculations

Document this explicitly.

---

# PHASE 2: BACKEND ARCHITECTURE

The current Flask backend is too monolithic.

Refactor it into a clean modular architecture.

Target something approximately like:

backend/

    app/

        __init__.py

        config.py

        extensions.py

        middleware/

            auth.py

            errors.py

            security.py

            logging.py

        routes/

            health.py

            disease.py

            crop.py

            fertilizer.py

            chatbot.py

            weather.py

            mandi.py

            profile.py

        services/

            disease_service.py

            crop_service.py

            fertilizer_service.py

            gemini_service.py

            weather_service.py

            mandi_service.py

            profile_service.py

        utils/

            validation.py

            responses.py

            logging.py

            security.py

        schemas/

            requests.py

            responses.py

    tests/

    run.py

Do not blindly copy this structure.

Use the architecture that best fits the actual project.

The goal is separation of concerns.

Routes should be thin.

Business logic should live in services.

Configuration should live in configuration.

Authentication should live in middleware/decorators.

External API calls should live in service classes/functions.

---

# PHASE 3: CONFIGURATION MANAGEMENT

Centralize environment configuration.

Never hardcode:

- API keys
- Supabase credentials
- URLs
- secrets
- environment-specific settings
- production configuration

Create proper configuration handling.

Support:

- development
- testing
- production

Environment variables should include appropriate values such as:

```text
SUPABASE_URL
SUPABASE_SERVICE_KEY
GOOGLE_API_KEY
OWM_API_KEY
DATA_GOV_API_KEY
FRONTEND_URL
ENVIRONMENT
LOG_LEVEL
```

Only include variables actually required by the project.

Fail safely when required production secrets are missing.

Never expose server secrets to the React frontend.

---

# PHASE 4: SUPABASE AUTHENTICATION AND AUTHORIZATION

Audit the entire authentication system.

The project currently uses Supabase authentication.

Standardize on Supabase unless the existing implementation proves that another authentication system is genuinely required.

Remove unused Firebase authentication dependencies/code if they are not actually being used.

Important:

The Supabase service-role key must NEVER reach the browser.

The frontend should only use the public/anon key.

The backend must safely validate authenticated requests.

Improve the existing token middleware.

It should:

- correctly parse Bearer tokens
- reject malformed tokens
- reject expired tokens
- handle authentication provider failures
- avoid leaking internal errors
- attach authenticated user identity safely
- distinguish authentication from authorization
- avoid unnecessary repeated work where possible

Do not trust user IDs sent in request bodies.

Always derive the authenticated user ID from the verified token.

---

# PHASE 5: DATABASE SECURITY

Audit all Supabase/database access.

Ensure users can only access their own data.

Review:

- profiles
- future crop records
- dashboard data
- any user-specific records

Use Row Level Security where appropriate.

Never rely only on frontend restrictions.

A user should not be able to modify another user's records by changing an ID in an HTTP request.

Audit all insert/update/select/delete operations.

---

# PHASE 6: CORS

The current backend uses overly broad CORS configuration.

Replace unrestricted CORS with environment-based allowed origins.

Development may allow:

```text
http://localhost:5173
```

Production should allow only the actual frontend origin.

Do not use wildcard CORS in production.

Support credentials only if actually required.

---

# PHASE 7: API VALIDATION

Every API endpoint must validate incoming input.

Do not trust:

- JSON
- query parameters
- form data
- file uploads
- headers
- user-provided IDs
- coordinates
- city names
- chatbot messages

Use a consistent validation strategy.

Validate:

- required fields
- data types
- ranges
- string lengths
- enumerations
- file types
- file sizes
- coordinates
- pagination values
- request body size

Return consistent HTTP errors.

For example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {}
  }
}
```

Do not expose Python stack traces to clients.

---

# PHASE 8: FILE UPLOAD SECURITY

Audit the disease image upload system.

Implement safe restrictions:

- maximum file size
- allowed MIME types
- allowed extensions
- safe filename handling
- reject suspicious files
- reject empty files
- avoid arbitrary filesystem writes
- avoid trusting the client-provided MIME type
- safely process images in memory where appropriate

Do not permanently store uploaded images unless the application actually requires it.

If temporary files are required, ensure cleanup.

Do not let users upload arbitrary executable content.

Do not change the ML preprocessing itself.

---

# PHASE 9: RATE LIMITING

Add rate limiting to expensive or abuse-prone endpoints.

Especially:

```text
/predict_disease
/sarthi_ai_chat
/get_weather
/get_mandi_prices
/recommend_crop
/recommend_fertilizer
```

Use sensible per-IP and/or per-user limits.

Chatbot requests should have stricter limits because they call an external LLM API.

Disease inference should also be protected against upload spam.

Do not implement an absurdly restrictive limit that breaks normal usage.

Use environment configuration where appropriate.

---

# PHASE 10: EXTERNAL API RELIABILITY

Audit every external API request:

- Gemini
- OpenWeatherMap
- data.gov.in
- Supabase where applicable

Every external request should have:

- explicit timeout
- error handling
- appropriate status mapping
- reasonable retry behavior where safe
- logging
- protection against hanging workers

Do not blindly retry non-idempotent operations.

For external failures, return useful errors such as:

```text
SERVICE_UNAVAILABLE
UPSTREAM_TIMEOUT
UPSTREAM_ERROR
```

rather than generic internal server errors.

---

# PHASE 11: GEMINI CHATBOT

Keep Gemini functionality intact.

Improve only the engineering around it.

Implement:

- request size limits
- message length limits
- history length limits
- history validation
- timeout
- upstream error handling
- rate limiting
- structured logging
- safe API-key handling
- graceful degradation

Do not allow users to submit unlimited chat history.

Cap history to a sensible number of messages.

Prevent malformed history from crashing the endpoint.

Preserve the existing Hindi/English behavior.

Do not unnecessarily rewrite the chatbot's product behavior.

---

# PHASE 12: WEATHER API

Keep current functionality.

Fix engineering problems around the API.

Ensure:

- coordinates are validated
- latitude is between -90 and 90
- longitude is between -180 and 180
- city input has sane length limits
- API timeout exists
- upstream errors are handled
- timezone handling is correct
- no server timezone assumption leaks into the result

Important:

Do not hardcode IST for arbitrary weather locations.

Use the timezone information returned by the weather provider appropriately.

Preserve the existing output contract expected by the frontend.

---

# PHASE 13: MANDI API

Improve:

- validation
- timeout
- error handling
- upstream status handling
- response normalization
- empty-result handling
- logging
- rate limiting
- caching if beneficial

Do not break the current frontend API contract unless absolutely necessary.

If changing the contract is necessary, update the frontend simultaneously.

---

# PHASE 14: API RESPONSE STANDARDIZATION

Create a consistent API response strategy.

Success:

```json
{
  "data": {}
}
```

or preserve existing contracts where the frontend depends on them.

Errors should be standardized.

Use appropriate HTTP status codes:

400 = validation error

401 = unauthenticated

403 = unauthorized

404 = resource not found

408/504 = timeout

429 = rate limited

502 = upstream API failure

503 = service unavailable

500 = unexpected internal error

Do not leak internal exception details.

---

# PHASE 15: LOGGING

Replace scattered `print()` debugging with proper structured logging.

Logs should contain useful information such as:

- timestamp
- log level
- endpoint
- request ID
- user ID where safe
- error category
- upstream service
- execution duration

NEVER log:

- passwords
- access tokens
- API keys
- service-role keys
- sensitive user data
- uploaded image contents

Production logs should be useful for diagnosing failures.

---

# PHASE 16: HEALTH CHECKS

Add a lightweight endpoint:

```text
GET /health
```

It should quickly indicate that the API process is alive.

If useful, add a separate readiness endpoint:

```text
GET /ready
```

Do not make the health endpoint perform expensive ML inference.

Do not make it depend on Gemini/weather/mandi services being available.

---

# PHASE 17: MODEL RESOURCE MANAGEMENT

Without changing model behavior, improve lifecycle management.

Avoid unnecessarily loading multiple heavyweight frameworks if they aren't needed.

Ensure model initialization failures are handled cleanly.

Do not crash the entire application unnecessarily because an optional feature's model failed.

Do not repeatedly load models for every request.

Use appropriate application-level initialization/lazy-loading where justified.

Pay special attention to Gunicorn workers and memory usage.

Do not modify model internals.

---

# PHASE 18: FRONTEND API ARCHITECTURE

Audit the React frontend.

Centralize API configuration.

Do not repeat:

```text
API_BASE_URL
axios.post(...)
axios.get(...)
error handling
```

across every page.

Create a clean API layer such as:

```text
src/api/
    client.js
    auth.js
    disease.js
    crop.js
    fertilizer.js
    weather.js
    mandi.js
    chatbot.js
    profile.js
```

Use one configured Axios instance.

Automatically attach the Supabase access token where appropriate.

Handle:

- 401
- 403
- 429
- 500
- 502
- 503
- network failures

consistently.

Do not duplicate authentication logic across pages.

---

# PHASE 19: FRONTEND AUTH STATE

Audit:

- Supabase session state
- UserProvider
- ProtectedRoute
- profile loading
- redirects
- logout
- token refresh

Remove unnecessary page reloads.

Do NOT use:

```javascript
window.location.reload()
```

as a state-management mechanism unless absolutely unavoidable.

After profile creation:

- update state
- navigate appropriately
- avoid full browser reload

Prevent redirect loops.

Ensure logged-out users cannot access protected pages.

Ensure authenticated users with incomplete profiles are handled cleanly.

---

# PHASE 20: ROUTING

Clean up React routing.

Make route protection reusable.

Avoid unnecessary repeated wrappers.

Ensure:

- public pages work
- protected pages work
- direct URL navigation works
- browser refresh works
- Vercel SPA routing works
- unknown routes behave sensibly
- authenticated redirects work correctly

Do not break existing URLs unless necessary.

---

# PHASE 21: FRONTEND ERROR UX

Every API-dependent page should have proper:

- loading state
- success state
- empty state
- error state
- retry state

Do not display raw backend exception strings to users.

For example:

Bad:

```text
Error: Connection refused at 127.0.0.1:5000
```

Better:

```text
Unable to connect to the server.
Please try again.
```

Keep detailed errors in logs.

---

# PHASE 22: DISEASE SCAN UX

Do not modify the model.

Improve only the surrounding experience.

Ensure:

- file validation
- upload progress/loading
- duplicate clicks prevented
- cancellation/reset behavior
- preview cleanup
- network error handling
- authentication errors
- rate-limit errors
- server errors

Do not claim that a prediction is medically/agriculturally certain.

Do not change the actual model confidence calculation in this task.

You may change the UI wording around confidence to avoid presenting it as guaranteed correctness, provided the numeric value itself remains unchanged.

---

# PHASE 23: ACCESSIBILITY

Audit the entire frontend for:

- semantic HTML
- keyboard navigation
- focus states
- labels
- aria attributes
- button accessibility
- image alt text
- color contrast
- form errors
- loading announcements

Do not sacrifice functionality for visual polish.

---

# PHASE 24: RESPONSIVE DESIGN

Test:

- desktop
- tablet
- mobile
- narrow mobile screens

Pay particular attention to:

- sidebar
- bottom navigation
- forms
- tables
- weather cards
- mandi data
- chatbot
- disease upload
- dashboard

Do not introduce unnecessary UI redesign.

Improve only where it materially helps usability.

---

# PHASE 25: PERFORMANCE

Audit frontend performance.

Look for:

- unnecessary re-renders
- duplicate API calls
- large images
- unnecessary dependencies
- oversized bundles
- repeated computations
- memory leaks
- object URL leaks
- unnecessary context updates

Lazy-load large pages where appropriate.

Do not prematurely optimize.

Do not change ML inference behavior.

---

# PHASE 26: DEPENDENCY CLEANUP

Audit:

`requirements.txt`

and:

`package.json`

Remove packages that are genuinely unused.

Pay special attention to the apparent presence of multiple authentication ecosystems.

Do not remove something merely because you didn't see it in one file.

Search the entire repository first.

After dependency cleanup:

- install dependencies
- build frontend
- run backend
- run tests
- run lint

Ensure nothing breaks.

---

# PHASE 27: SECURITY AUDIT

Perform a security review for:

### Secrets

Search for:

- API keys
- tokens
- passwords
- private keys
- service-role keys
- `.env` files

Ensure secrets aren't committed.

### Injection

Check:

- SQL/database queries
- command execution
- file paths
- HTML rendering
- markdown rendering
- external API payloads

### Authentication

Check:

- token validation
- expiration
- user identity
- logout
- refresh
- protected endpoints

### Authorization

Check:

- user can only access their own resources
- IDs aren't blindly trusted
- frontend restrictions aren't treated as security

### Abuse

Check:

- rate limiting
- upload size
- request size
- chatbot history
- expensive endpoints

### CORS

Restrict origins.

### Error leakage

No stack traces or secrets in API responses.

---

# PHASE 28: TESTING

The existing test coverage is insufficient.

Create meaningful backend tests.

At minimum test:

### Health

- `/health`

### Authentication

- missing token
- malformed token
- invalid token
- expired token
- valid token

### Disease endpoint

- no file
- empty filename
- unsupported file
- oversized file
- malformed image
- authenticated request
- model unavailable

Do not alter model logic to make tests easier.

Mock the model service where appropriate.

### Crop recommendation

Test:

- missing fields
- invalid numeric values
- invalid categorical values
- authenticated request
- model unavailable

### Fertilizer recommendation

Test:

- every required numerical field missing individually
- invalid values
- invalid categorical values
- authenticated request
- model unavailable

### Weather

Test:

- city request
- coordinate request
- missing location
- invalid coordinates
- upstream timeout
- upstream API error

### Mandi

Test:

- missing state
- missing commodity
- optional district
- empty response
- upstream error

### Chatbot

Test:

- missing message
- oversized message
- malformed history
- oversized history
- upstream timeout
- upstream error
- valid request

---

# PHASE 29: FRONTEND TESTING

If a testing framework isn't present, introduce a reasonable lightweight setup.

Test at least:

- route protection
- login flow
- profile creation
- logout
- API error handling
- disease upload validation
- form validation
- loading states

Do not introduce an unnecessarily huge testing stack.

---

# PHASE 30: LINTING AND STATIC QUALITY

Run:

```text
npm run lint
npm run build
```

Fix all meaningful lint/build errors.

For Python, introduce appropriate lint/static checking if practical.

Do not simply disable lint rules to make the project pass.

---

# PHASE 31: PRODUCTION DEPLOYMENT

Audit the current Vercel + Render architecture.

Frontend:

```text
React/Vite → Vercel
```

Backend:

```text
Flask/Gunicorn → Render
```

Keep this architecture unless there is a compelling reason to change it.

Make deployment configuration production-ready.

Ensure:

- production environment variables
- correct API URL
- frontend SPA rewrites
- backend start command
- health checks
- CORS
- secure secrets
- appropriate Gunicorn configuration
- graceful failures

Do not expose development server configuration in production.

---

# PHASE 32: MODEL FILE DEPLOYMENT

IMPORTANT:

Do not modify the models.

But you should evaluate the engineering problem of storing huge model binaries directly inside Git.

The repository currently contains large ML artifacts.

Design a production-safe model artifact strategy without changing the model files themselves.

Potential approaches:

- object storage
- release artifacts
- model storage
- private bucket
- deployment-time download

Choose the approach that best fits the existing architecture and deployment platform.

The goal is:

```text
Git repository
    ↓
source code
    ↓
deployment
    ↓
secure model artifact retrieval
    ↓
ML service
```

Do not upload secrets.

Do not expose private model URLs unnecessarily.

If changing model storage would make local development harder, provide a documented local-development mechanism.

---

# PHASE 33: DATABASE / PRODUCT ARCHITECTURE

Review the "My Crops" functionality.

The README currently describes it as basic/dummy functionality.

Do not invent an unnecessarily large feature.

If the database schema already exists, properly integrate it.

If it does not, clearly separate:

- implemented functionality
- placeholder functionality
- future functionality

Do not make fake data look like real user data.

---

# PHASE 34: REMOVE DEVELOPMENT DEBRIS

Clean the codebase.

Remove or consolidate:

- obsolete comments
- debug prints
- commented-out code
- duplicate code
- old "FIX" comments
- temporary debugging logic
- unused imports
- dead functions
- abandoned authentication code
- obsolete dependencies

Do not remove useful documentation.

The final source should look like a project intentionally designed this way, not a sequence of patches.

---

# PHASE 35: README REWRITE

Rewrite the README professionally.

It must accurately describe the current repository.

Include:

## Fasal Sarthi

Short product explanation.

## Features

Actual implemented features only.

## Architecture

Include a clean architecture diagram in Mermaid if appropriate.

Example:

```text
React/Vite
    |
    | HTTPS
    ↓
Flask API
    |
    ├── Auth
    ├── Disease Service
    ├── Crop Recommendation
    ├── Fertilizer Recommendation
    ├── Weather Service
    ├── Mandi Service
    └── Gemini Service
    |
    ├── Supabase
    ├── OpenWeatherMap
    ├── data.gov.in
    └── Gemini
```

## Tech Stack

Accurate only.

## Local Setup

Give working commands.

## Environment Variables

Explain every required variable without exposing secrets.

## Deployment

Explain Vercel + Render.

## API Endpoints

Document important endpoints.

## Security

Explain authentication and server-side secrets.

## Testing

Explain how to run tests.

## Project Structure

Show the actual structure.

## Limitations

Be honest.

## Future Scope

Only genuine future features.

Remove incorrect repository references and placeholders.

---

# PHASE 36: GITHUB HYGIENE

Improve:

- `.gitignore`
- repository description if possible
- README
- topics if possible
- license if appropriate
- screenshots
- architecture documentation

Ensure:

- no secrets
- no `.env`
- no virtual environment
- no build artifacts
- no cache directories
- no unnecessary generated files

Do NOT rewrite Git history destructively unless absolutely necessary.

If you discover a secret that was previously committed, do not simply delete it from the current file.

Flag it clearly because the credential may require rotation.

---

# PHASE 37: API DOCUMENTATION

Create a concise API reference.

For each endpoint document:

- method
- path
- authentication requirement
- request body
- response
- errors

Example:

```text
POST /predict_disease

Authorization:
Bearer <token>

Content-Type:
multipart/form-data

Body:
file=<image>

Response:
{
  "predicted_disease": "...",
  "confidence": "..."
}
```

Do not invent endpoints that don't exist.

---

# PHASE 38: BACKWARD COMPATIBILITY

Be conservative.

Existing frontend functionality must continue working.

Before changing an API contract:

1. inspect all frontend consumers
2. update frontend and backend together
3. test both
4. ensure no stale code depends on the old contract

Do not randomly rename routes.

Do not remove features.

---

# PHASE 39: FINAL SECURITY SCAN

Before declaring completion, search the entire repository for:

```text
AIza
sk-
service_role
password
secret
token
Bearer
localhost
127.0.0.1
YOUR_
TODO
FIXME
console.log
print(
debug=True
CORS(app)
```

Review every match.

Not every match is necessarily a problem, but every match must be intentionally reviewed.

---

# PHASE 40: FINAL PRODUCTION CHECK

The project is NOT complete until all of these are true.

## Backend

- [ ] Modular architecture
- [ ] No monolithic business logic
- [ ] Central configuration
- [ ] Proper authentication
- [ ] Proper authorization
- [ ] Restricted CORS
- [ ] Rate limiting
- [ ] Input validation
- [ ] File upload protection
- [ ] External API timeouts
- [ ] Proper upstream error handling
- [ ] Structured logging
- [ ] Health endpoint
- [ ] No debug mode in production
- [ ] No secrets in source
- [ ] Consistent API errors
- [ ] Tests passing

## Frontend

- [ ] Central API client
- [ ] Proper auth state
- [ ] No unnecessary page reloads
- [ ] Protected routes work
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Responsive UI
- [ ] Accessible UI
- [ ] No obvious memory leaks
- [ ] No unnecessary duplicate API calls
- [ ] Production build passes
- [ ] Lint passes

## ML boundary

- [ ] Existing models preserved
- [ ] Model weights preserved
- [ ] Model preprocessing preserved
- [ ] Model feature schema preserved
- [ ] Model inference behavior preserved
- [ ] Model outputs preserved
- [ ] No model retraining
- [ ] No model optimization that changes behavior

## Deployment

- [ ] Vercel configuration works
- [ ] Render configuration works
- [ ] Production environment variables documented
- [ ] Secrets remain server-side
- [ ] API URL configuration works
- [ ] SPA routing works
- [ ] Health check works
- [ ] Model artifacts have a sensible deployment strategy

## Documentation

- [ ] README accurate
- [ ] No old GitHub URL
- [ ] No placeholder deployment URLs
- [ ] Setup instructions tested
- [ ] Environment variables documented
- [ ] API documented
- [ ] Architecture documented
- [ ] Limitations documented

---

# IMPORTANT ENGINEERING RULES

## Rule 1

Do not modify ML/model behavior.

If you think an ML-related change would improve the application, DO NOT make it.

Record it separately under:

```text
Future ML Improvements
```

and continue with software engineering improvements.

## Rule 2

Do not blindly rewrite working code.

Prefer incremental, testable refactoring.

## Rule 3

Do not hide errors.

Fix their root cause.

## Rule 4

Do not disable security checks just to make tests pass.

## Rule 5

Do not remove functionality merely to simplify the code.

## Rule 6

Do not introduce unnecessary frameworks.

Use the existing stack whenever practical.

## Rule 7

Do not create fake implementations.

If something cannot be safely implemented without changing the ML layer, document it.

## Rule 8

Never expose secrets.

## Rule 9

Never claim a test passed unless you actually ran it.

## Rule 10

Keep iterating.

---

# FINAL LOOP

After implementing all changes:

1. Run frontend lint.
2. Run frontend production build.
3. Run backend tests.
4. Run backend static checks.
5. Search for secrets.
6. Search for debug code.
7. Search for dead dependencies.
8. Review authentication.
9. Review authorization.
10. Review CORS.
11. Review rate limiting.
12. Review API validation.
13. Review external API timeouts.
14. Review deployment configuration.
15. Review README.
16. Review all modified files.
17. Look specifically for regressions.
18. Fix everything discovered.
19. Run the checks again.
20. Repeat until clean.

Do not stop because the application "looks good."

Stop only when the engineering checklist is genuinely satisfied.

---

# FINAL REPORT

When the implementation is complete, provide a concise engineering report containing:

## 1. What was fixed

Grouped by:

- security
- backend
- frontend
- authentication
- database
- APIs
- deployment
- documentation
- testing

## 2. Files changed

List important files.

## 3. Tests executed

Give exact commands and actual results.

## 4. Remaining issues

Only genuine remaining issues.

Separate them into:

- critical
- recommended
- future ML improvements

## 5. ML changes

Explicitly state:

```text
ML models were NOT modified.
Model weights were NOT modified.
Model preprocessing was NOT modified.
Model inference behavior was NOT modified.
```

## 6. Production readiness score

Give a score out of 10 based on actual verification, not optimism.

## 7. Deployment status

State exactly what is ready and what still requires environment-specific credentials/configuration.

---

# MOST IMPORTANT INSTRUCTION

You are not here to merely edit code.

You are responsible for performing a complete engineering hardening cycle.

Think like:

- Staff Software Engineer
- Backend Engineer
- Frontend Engineer
- DevOps Engineer
- Security Engineer
- QA Engineer
- Code Reviewer

Inspect deeply.

Change carefully.

Test aggressively.

Review your own work.

Fix your own mistakes.

Repeat the loop.

The final repository should look like a professionally engineered production project, while preserving the existing ML system exactly as it is.