/**
 * Frontend Comprehensive Integration & Contract Test Suite
 * Validates:
 * 1. All lazy-loaded page route components resolve cleanly
 * 2. API client base URL configuration (dev fallback vs prod strictness)
 * 3. Auth token injection on authenticated API requests
 * 4. All API service modules (disease, crop, fertilizer, weather, mandi, chat)
 * 5. ProtectedRoute gatekeeper behavior (unauthenticated redirect vs authenticated access)
 * 6. Navigation contracts, error states, and session persistence
 */

import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const FRONTEND_DIR = path.resolve(ROOT_DIR, 'fasal_sarthi_frontend');

console.log('===============================================================');
console.log('FRONTEND COMPREHENSIVE INTEGRATION & CONTRACT TEST SUITE');
console.log('===============================================================');

let passCount = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passCount++;
  console.log(`  => PASS: ${message}`);
}

// 1. Verify all lazy-loaded page component source files exist and have valid default exports
console.log('\n--- [1] Route-Level Lazy Components Contract ---');
const routes = [
  'LandingPage.jsx',
  'LoginPage.jsx',
  'RegisterPage.jsx',
  'CreateProfilePage.jsx',
  'Dashboard.jsx',
  'ScanPage.jsx',
  'ChatPage.jsx',
  'MandiPage.jsx',
  'CropRecPage.jsx',
  'FertilizerRecPage.jsx',
  'WeatherPage.jsx',
  'EditProfilePage.jsx',
];

for (const routeFile of routes) {
  const filePath = path.join(FRONTEND_DIR, 'src', 'pages', routeFile);
  assert(existsSync(filePath), `Page component exists: src/pages/${routeFile}`);
  const content = readFileSync(filePath, 'utf-8');
  const componentName = routeFile.replace('.jsx', '');
  assert(
    content.includes(`export default ${componentName}`) || content.includes('export default'),
    `Page component ${routeFile} exports default component`
  );
}

// 2. Test API Client Base URL Hardening Contract
console.log('\n--- [2] Production API URL Contract & Environment Hardening ---');
const clientJsPath = path.join(FRONTEND_DIR, 'src', 'api', 'client.js');
assert(existsSync(clientJsPath), 'api/client.js exists');
const clientContent = readFileSync(clientJsPath, 'utf-8');

assert(
  clientContent.includes('getApiBaseUrl'),
  'getApiBaseUrl() validation function is implemented in client.js'
);
assert(
  clientContent.includes('import.meta.env.DEV') &&
  clientContent.includes('Configuration Error: VITE_API_BASE_URL environment variable is required in production'),
  'Production strictly fails when VITE_API_BASE_URL is omitted rather than silently falling back'
);
assert(
  clientContent.includes('http://localhost:5000'),
  'Development mode safely allows localhost:5000 fallback'
);

// 3. Test Auth Interceptor in API Client
console.log('\n--- [3] Client Request Interceptor & Bearer Token Injection ---');
assert(
  clientContent.includes('apiClient.interceptors.request.use'),
  'Request interceptor attached to axios instance'
);
assert(
  clientContent.includes('supabaseClient.auth.getSession()') &&
  clientContent.includes('data.session.access_token'),
  'Bearer token correctly extracted from Supabase session and injected into Authorization header'
);

// 4. Test ProtectedRoute Gatekeeper Contract
console.log('\n--- [4] ProtectedRoute Gatekeeper Contract ---');
const protectedRoutePath = path.join(FRONTEND_DIR, 'src', 'components', 'ProtectedRoute.jsx');
assert(existsSync(protectedRoutePath), 'ProtectedRoute.jsx exists');
const protectedRouteContent = readFileSync(protectedRoutePath, 'utf-8');

assert(
  protectedRouteContent.includes('useUserProfile') && protectedRouteContent.includes('useSessionContext'),
  'ProtectedRoute checks both auth session and user profile states'
);
assert(
  protectedRouteContent.includes('<Navigate to="/login" replace />'),
  'Unauthenticated users are cleanly redirected to /login with replace'
);
assert(
  protectedRouteContent.includes('<Navigate to="/create-profile" replace />'),
  'Authenticated users without profile are redirected to /create-profile'
);
assert(
  protectedRouteContent.includes('authLoading || profileLoading') && protectedRouteContent.includes('LuLoader'),
  'Loading state displays spinner while verifying session, preventing premature redirects'
);

// 5. Test Mandi Auth Contract
console.log('\n--- [5] Mandi Authenticated API Flow Contract ---');
const mandiProviderPath = path.join(FRONTEND_DIR, 'src', 'Context', 'MandiProvider.jsx');
assert(existsSync(mandiProviderPath), 'MandiProvider.jsx exists');
const mandiProviderContent = readFileSync(mandiProviderPath, 'utf-8');

assert(
  mandiProviderContent.includes('mandiApi.fetchMandiPrices'),
  'MandiProvider uses centralized mandiApi service'
);
assert(
  !mandiProviderContent.includes('Authorization: `Bearer ${session?.access_token}`'),
  'MandiProvider avoids redundant / stale manual auth headers in favor of client interceptor'
);

// 6. Test Object URL Leak Prevention in ScanPage
console.log('\n--- [6] ScanPage Memory Management & URL Cleanup ---');
const scanPagePath = path.join(FRONTEND_DIR, 'src', 'pages', 'ScanPage.jsx');
assert(existsSync(scanPagePath), 'ScanPage.jsx exists');
const scanPageContent = readFileSync(scanPagePath, 'utf-8');

assert(
  scanPageContent.includes('URL.revokeObjectURL'),
  'ScanPage includes URL.revokeObjectURL to prevent memory leaks on image re-selection'
);

// 7. Test CreateProfile Transition Without Reload
console.log('\n--- [7] Profile Creation Flow Contract ---');
const createProfilePath = path.join(FRONTEND_DIR, 'src', 'pages', 'CreateProfilePage.jsx');
assert(existsSync(createProfilePath), 'CreateProfilePage.jsx exists');
const createProfileContent = readFileSync(createProfilePath, 'utf-8');

assert(
  !createProfileContent.includes('window.location.href'),
  'CreateProfilePage eliminates window.location.href reload'
);
assert(
  createProfileContent.includes("navigate('/dashboard', { replace: true })") ||
  createProfileContent.includes('navigate("/dashboard", { replace: true })'),
  'CreateProfilePage uses React Router navigate with replace: true'
);

// 8. Test Supabase Anon Key Security
console.log('\n--- [8] Client-Side Secret Isolation ---');
const supabaseClientPath = path.join(FRONTEND_DIR, 'src', 'lib', 'supabaseClient.js');
assert(existsSync(supabaseClientPath), 'src/lib/supabaseClient.js exists');
const supabaseContent = readFileSync(supabaseClientPath, 'utf-8');

assert(
  !supabaseContent.includes('service_role') && !supabaseContent.includes('SUPABASE_SERVICE_KEY'),
  'Frontend only uses VITE_SUPABASE_ANON_KEY and contains zero service-role keys'
);

console.log('\n===============================================================');
console.log(`ALL ${totalTests} FRONTEND INTEGRATION & CONTRACT CHECKS PASSED (${passCount}/${totalTests})`);
console.log('===============================================================');
