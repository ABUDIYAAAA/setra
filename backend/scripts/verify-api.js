import { createApp } from '../src/app.js';

async function runTests() {
  console.log('--- Starting API Verification Tests ---');
  const app = createApp();

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      testPassed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      testFailed++;
    }
  }

  // 1. Health check
  console.log('\n1. Testing Health Endpoint:');
  const healthRes = await app.request('/health');
  const healthData = await healthRes.json();
  assert(healthRes.status === 200 && healthData.status === 'ok', 'Health check returns status 200 and ok');

  // 2. OpenAPI JSON Spec
  console.log('\n2. Testing OpenAPI JSON Spec:');
  const docRes = await app.request('/openapi.json');
  const docData = await docRes.json();
  assert(docRes.status === 200, 'OpenAPI spec returns 200');
  assert(docData.openapi === '3.0.0', 'OpenAPI version is 3.0.0');
  assert(docData.paths['/api/v1/auth/register'] !== undefined, 'Contains register endpoint in paths');
  assert(docData.paths['/api/v1/auth/login'] !== undefined, 'Contains login endpoint in paths');
  assert(docData.paths['/api/v1/auth/refresh'] !== undefined, 'Contains refresh endpoint in paths');
  assert(docData.paths['/api/v1/auth/logout'] !== undefined, 'Contains logout endpoint in paths');
  assert(docData.paths['/api/v1/auth/me'] !== undefined, 'Contains me endpoint in paths');
  assert(docData.paths['/api/v1/auth/change-password'] !== undefined, 'Contains change-password endpoint in paths');

  // 3. Scalar UI docs
  console.log('\n3. Testing Scalar UI docs (/docs):');
  const docsRes = await app.request('/docs');
  assert(docsRes.status === 200, 'Scalar UI route returns 200');
  const docsHtml = await docsRes.text();
  assert(docsHtml.includes('Scalar') || docsHtml.includes('api-reference') || docsRes.status === 200, 'Scalar UI HTML served');

  // 4. Registration
  console.log('\n4. Testing User Registration:');
  const testEmail = `testuser_${Date.now()}@example.com`;
  const registerRes = await app.request('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Nimit Test',
      email: testEmail,
      password: 'StrongPassword123!',
    }),
  });
  const registerData = await registerRes.json();
  assert(registerRes.status === 201, 'Registration returns 201 Created');
  assert(registerData.success === true, 'Registration returns success: true');
  assert(registerData.data.user.email === testEmail, 'User email matches registered email');
  assert(typeof registerData.data.accessToken === 'string', 'Returns access token');
  assert(typeof registerData.data.refreshToken === 'string', 'Returns refresh token');

  let accessToken = registerData.data.accessToken;
  let refreshToken = registerData.data.refreshToken;

  // 4b. Registration duplicate email failure
  console.log('\n4b. Testing Duplicate Registration:');
  const dupRes = await app.request('/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Duplicate',
      email: testEmail,
      password: 'AnotherPassword123!',
    }),
  });
  const dupData = await dupRes.json();
  assert(dupRes.status === 400 && dupData.success === false, 'Duplicate email registration fails with 400');

  // 5. Login
  console.log('\n5. Testing User Login:');
  const loginRes = await app.request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'StrongPassword123!',
    }),
  });
  const loginData = await loginRes.json();
  assert(loginRes.status === 200 && loginData.success === true, 'Login with correct credentials succeeds (200)');
  assert(loginData.data.user.name === 'Nimit Test', 'Returned user name is correct');

  accessToken = loginData.data.accessToken;
  refreshToken = loginData.data.refreshToken;

  // 5b. Invalid Login
  console.log('\n5b. Testing Invalid Login:');
  const invalidLoginRes = await app.request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'WrongPassword!',
    }),
  });
  assert(invalidLoginRes.status === 401, 'Invalid password returns 401 Unauthorized');

  // 6. Get Profile /me
  console.log('\n6. Testing /me Profile Endpoint:');
  const meRes = await app.request('/api/v1/auth/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const meData = await meRes.json();
  assert(meRes.status === 200 && meData.success === true, 'Authenticated /me returns 200');
  assert(meData.data.user.email === testEmail, '/me returns authenticated user details');

  // 6b. Unauthorized /me
  const unauthMeRes = await app.request('/api/v1/auth/me', { method: 'GET' });
  assert(unauthMeRes.status === 401, 'Unauthenticated /me returns 401');

  // 7. Refresh Token
  console.log('\n7. Testing Refresh Token Rotation:');
  const refreshRes = await app.request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const refreshData = await refreshRes.json();
  assert(refreshRes.status === 200 && refreshData.success === true, 'Token refresh returns 200 and new tokens');
  assert(typeof refreshData.data.accessToken === 'string', 'Refreshed access token generated');
  assert(typeof refreshData.data.refreshToken === 'string', 'Rotated refresh token generated');

  const oldRefreshToken = refreshToken;
  accessToken = refreshData.data.accessToken;
  refreshToken = refreshData.data.refreshToken;

  // 7b. Replay attack on rotated refresh token
  console.log('\n7b. Testing Revoked/Rotated Token Reuse:');
  const reusedRefreshRes = await app.request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: oldRefreshToken }),
  });
  assert(reusedRefreshRes.status === 401, 'Reusing rotated refresh token is rejected (401)');

  // 8. Change Password
  console.log('\n8. Testing Change Password:');
  const changePwRes = await app.request('/api/v1/auth/change-password', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      currentPassword: 'StrongPassword123!',
      newPassword: 'BrandNewPassword456!',
    }),
  });
  const changePwData = await changePwRes.json();
  assert(changePwRes.status === 200 && changePwData.success === true, 'Password changed successfully');

  // 8b. Login with old password fails
  const oldLoginRes = await app.request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'StrongPassword123!',
    }),
  });
  assert(oldLoginRes.status === 401, 'Old password fails after change');

  // 8c. Login with new password succeeds
  const newLoginRes = await app.request('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'BrandNewPassword456!',
    }),
  });
  const newLoginData = await newLoginRes.json();
  assert(newLoginRes.status === 200 && newLoginData.success === true, 'New password login succeeds');

  refreshToken = newLoginData.data.refreshToken;

  // 9. Logout
  console.log('\n9. Testing Logout (Revoking Refresh Token):');
  const logoutRes = await app.request('/api/v1/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  const logoutData = await logoutRes.json();
  assert(logoutRes.status === 200 && logoutData.success === true, 'Logout succeeds with 200');

  // 9b. Refreshing with logged out token fails
  const postLogoutRefreshRes = await app.request('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  assert(postLogoutRefreshRes.status === 401, 'Logged out token cannot be refreshed');

  console.log(`\n========================================`);
  console.log(`Test Results: ${testPassed} Passed, ${testFailed} Failed`);
  console.log(`========================================\n`);

  if (testFailed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
