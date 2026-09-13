# Rollback Protocols & Disaster Recovery

## 1. Git-Level Safety
- Before initiating any phase, the branch state is verified clean.
- Each phase produces self-contained, reviewable commits.
- If a phase fails verification gates or introduces regressions, immediate rollback is executed:
  ```bash
  # Check status and uncommitted changes
  git status
  # Discard uncommitted phase changes if necessary
  git restore .
  git clean -fd
  ```

## 2. Phase-Specific Rollback Procedures

### Phase 1 Rollback (Backend Infrastructure)
- **Trigger**: Model loading fails, app factory fails to initialize, or route parity breaks.
- **Action**:
  - Restore monolithic `app.py` from commit baseline.
  - Remove `fasal_sarthi_backend/app/` directory.
  - Verify server boots with `python app.py`.

### Phase 2 Rollback (Security & APIs)
- **Trigger**: CORS blocks legitimate frontend origin, rate limiter rejects valid traffic, or pruned dependency causes unexpected runtime error.
- **Action**:
  - Revert CORS config in `config.py` (`CORS_ORIGINS = ["*"]`) during emergency diagnostics.
  - Disable rate limiting via `RATELIMIT_ENABLED = False` in `config.py`.
  - Re-add `firebase_admin==6.6.0` to `requirements.txt` and run `pip install -r requirements.txt`.
  - Restore `MAX_CONTENT_LENGTH = None` if larger valid images are legitimately needed.

### Phase 3 Rollback (Frontend Architecture)
- **Trigger**: React context breakage, authentication loop, or broken page navigation.
- **Action**:
  - Revert `src/api/` changes and restore individual page Axios calls.
  - Restore original `UserProvider.jsx` and `MandiProvider.jsx`.
  - Re-add `"firebase": "^12.4.0"` to `fasal_sarthi_frontend/package.json` and run `npm install`.
  - Rebuild frontend with `npm run build` to confirm baseline stability.

### Phase 4 Rollback (Testing & Dependencies)
- **Trigger**: Dependency pruning causes missing module runtime errors.
- **Action**:
  - Re-add removed packages to `requirements.txt` or `package.json`.
  - Run `npm install` and `pip install -r requirements.txt`.

### Phase 5 Rollback (Deployment & Hygiene)
- **Trigger**: Build failures on Vercel or Render.
- **Action**:
  - Revert `Procfile` to `web: gunicorn app:app`.
  - Revert `vercel.json` rewrites.
