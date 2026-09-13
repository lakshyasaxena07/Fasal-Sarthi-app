# System Constraints & Invariants

## 1. Machine Learning Layer (STRICTLY FROZEN)
The ML layer and all its artifacts are treated as absolute **black boxes**. Under no circumstances may any of the following be modified:
- Model binaries (`FasalSarthi_Full_Model.tflite`, `best_stacking_model_final.joblib`, `random_forest_model.joblib`)
- Scalers and encoders (`scaler_final.joblib`, `encoder_final.joblib`, `model_columns.joblib`, `label_encoder.joblib`)
- Model weights, architectures, or training code
- Image preprocessing math (resizing to 300x300, RGB conversion, float normalization `/ 255.0`)
- Tabular feature sets and ordering (the exact 25 features for crop recommendation, exact columns for fertilizer recommendation)
- Categorical one-hot encoding columns and missing column fallbacks
- Inference invocation logic (`interpreter.set_tensor`, `interpreter.invoke()`, `interpreter.get_tensor`, `model.predict()`)
- Output interpretation, class names lists, and confidence calculation mathematics
- Model thresholds or confidence adjustments

> **Note on TFLite Concurrency & Deployment Tradeoff**: The TFLite interpreter is known to be thread-unsafe for concurrent invocations within a single process. Per project constraints, **no threading lock or concurrency synchronization code** is to be added in this phase. To safely prevent concurrent interpreter execution, the deployment baseline mandates a **synchronous / single-threaded configuration** (e.g. Gunicorn synchronous worker with `--workers 1 --threads 1`). This is formally documented as a temporary performance/concurrency tradeoff and residual risk.

## 2. Refactoring Boundary & Empirical Baseline Parity
- Any extraction of ML code into service modules must be strictly mechanical.
- Zero alterations to tensor handling, array formatting, or prediction calculation.
- **Empirical Baseline Requirement**: Before extracting any ML code:
  1. Dependencies must be installed in `.venv`.
  2. The original implementation must be executed against fixed test inputs:
     - Disease detection: Fixed test image (`corn_blight.jpeg`).
     - Crop recommendation: Fixed canonical 25-feature input.
     - Fertilizer recommendation: Fixed canonical soil/crop feature input.
  3. Baseline outputs must be recorded.
  4. After extraction and hardening, the identical inputs must be executed through the extracted services.
  5. Outputs must match 100%. If outputs differ for any reason, extraction must immediately STOP and be reverted.

## 3. Scope & Feature Freeze
- No new product features may be introduced (e.g., no backend implementation or UI extension of `/my-crops`).
- Placeholder or incomplete pages must be documented as "Future Scope" rather than mocked with deceptive stub implementations.
- Refactoring must strictly target reliability, modularity, security, performance, accessibility, and documentation.

## 4. Deletion & Pruning Safeguards
- No asset file (e.g., `src/assests/`) may be removed without completing a full-text search across the repository, verifying zero runtime/import usage, and confirming successful frontend production build.
- No dependency in `package.json` or `requirements.txt` may be uninstalled without verifying that it is not imported statically, dynamically, or referenced in build scripts/deployment manifests.

## 5. Security & Ingress Invariants
- Supabase service-role key (`SUPABASE_SERVICE_KEY`) must **never** be exposed to client-side code.
- Frontend must exclusively use public/anon credentials (`VITE_SUPABASE_ANON_KEY`).
- Debug mode (`debug=True`) is strictly prohibited in production configurations.
- Raw database error details and Python tracebacks must never be returned to client HTTP responses.
- Maximum payload limit for file uploads is capped at 10MB (`MAX_CONTENT_LENGTH = 10 * 1024 * 1024`).
- All uploaded image files must pass file extension checks and PIL magic byte verification (`Image.open().verify()`) prior to ML inference.
- CORS origins must be explicitly restricted to verified frontends via `CORS_ORIGINS`; wildcard (`*`) is prohibited in production.
- Public/expensive endpoints must be rate limited with clean 429 JSON responses; `/health` and `/ready` must remain exempt.

## 6. Verification Status Vocabulary
All checklists, status reports, and test tracking must use strictly verified states:
- `PASS`: Formally verified with test command output or manual reproduction evidence.
- `FAIL`: Execution resulted in an error or expectation mismatch.
- `NOT TESTED`: Planned check that has not yet been executed.
- `BLOCKED`: Cannot be tested due to an upstream dependency or missing configuration.
- `NOT APPLICABLE`: Check does not apply to the current architecture.
