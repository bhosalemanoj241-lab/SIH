// test_central_api.mjs
async function run() {
  console.log('=== TESTING MEDIBRIDGE CENTRALIZED CLOUD AUTHENTICATION ===\n');

  const uniqueId = Date.now();
  const testEmail = `suresh.patil.${uniqueId}@medibridge.ai`;
  const testPassword = 'SecurePassword123!';

  const BASE_URL = process.env.APP_URL || 'http://localhost:3000';
  console.log(`[Device A] 1. Registering new patient account: ${testEmail}...`);
  const regPayload = {
    action: 'register',
    accountType: 'patient',
    data: {
      fullName: 'Suresh Baban Patil',
      email: testEmail,
      phone: `98${uniqueId.toString().slice(-8)}`,
      password: testPassword,
      dateOfBirth: '1988-04-12',
      gender: 'male',
      bloodGroup: 'B+',
      city: 'Pune',
      address: 'Kothrud, Pune'
    }
  };

  const regRes = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload)
  });

  const regData = await regRes.json();
  console.log('[Device A] Registration Response:', {
    success: regData.success,
    token: regData.token ? `${regData.token.slice(0, 18)}...` : undefined,
    userEmail: regData.user?.email,
    patientId: regData.user?.patientId || regData.patientId,
    fullName: regData.user?.fullName,
    requiresVerification: regData.requiresVerification
  });

  if (!regData.success) {
    console.error('Registration failed:', regData);
    process.exit(1);
  }

  const assignedPatientId = regData.user?.patientId || regData.patientId;
  console.log(`[Device A] Patient registered with Patient ID: ${assignedPatientId}`);

  if (regData.requiresVerification && regData.devCode) {
    console.log(`[Device A] Verifying OTP for ${testEmail} with code ${regData.devCode}...`);
    const verifyRes = await fetch(`${BASE_URL}/api/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'verify_otp',
        email: testEmail,
        code: regData.devCode
      })
    });
    const verifyData = await verifyRes.json();
    if (!verifyData.verified) {
      console.error('OTP verification failed:', verifyData);
      process.exit(1);
    }
    console.log('[Device A] OTP verified successfully!');
  }

  console.log('\n[Device B - Completely Isolated Device/Browser]');
  console.log(`2. Testing cross-device login with email (${testEmail}) and WRONG password...`);
  const wrongPassRes = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      identifier: testEmail,
      password: 'WrongPassword999!'
    })
  });
  const wrongPassData = await wrongPassRes.json();
  console.log('[Device B] Wrong password rejection:', wrongPassData.error);
  if (wrongPassData.success) {
    console.error('ERROR: Wrong password was accepted!');
    process.exit(1);
  }

  console.log(`\n3. Testing cross-device login with email (${testEmail}) and CORRECT password...`);
  const emailLoginRes = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      identifier: testEmail,
      password: testPassword
    })
  });
  const emailLoginData = await emailLoginRes.json();
  console.log('[Device B] Email Login Success:', {
    success: emailLoginData.success,
    token: emailLoginData.token ? `${emailLoginData.token.slice(0, 18)}...` : undefined,
    userId: emailLoginData.user?.id,
    fullName: emailLoginData.user?.fullName,
    patientId: emailLoginData.user?.patientId,
    profileCity: emailLoginData.patientProfile?.city
  });

  if (!emailLoginData.success || emailLoginData.user?.patientId !== assignedPatientId) {
    console.error('ERROR: Cross-device email login failed or did not retrieve identical profile!');
    process.exit(1);
  }

  console.log('\n[Device C - Third Device/Mobile Browser]');
  console.log(`4. Testing cross-device login using Patient ID (${assignedPatientId}) directly...`);
  const pidLoginRes = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      identifier: assignedPatientId,
      password: testPassword
    })
  });
  const pidLoginData = await pidLoginRes.json();
  console.log('[Device C] Patient ID Login Success:', {
    success: pidLoginData.success,
    token: pidLoginData.token ? `${pidLoginData.token.slice(0, 18)}...` : undefined,
    fullName: pidLoginData.user?.fullName,
    email: pidLoginData.user?.email,
    patientId: pidLoginData.user?.patientId
  });

  if (!pidLoginData.success || pidLoginData.user?.email !== testEmail) {
    console.error('ERROR: Cross-device Patient ID login failed!');
    process.exit(1);
  }

  console.log('\n[Device D - System Admin Multi-Device Verification]');
  console.log('5. Testing admin login across devices (admin@medibridge.ai)...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      identifier: 'admin@medibridge.ai',
      password: 'Admin@123'
    })
  });
  const adminLoginData = await adminLoginRes.json();
  console.log('[Device D] Admin Login Success:', {
    success: adminLoginData.success,
    role: adminLoginData.user?.role,
    fullName: adminLoginData.user?.fullName
  });

  if (!adminLoginData.success || adminLoginData.user?.role !== 'SYSTEM_ADMIN') {
    console.error('ERROR: System Admin login failed!');
    process.exit(1);
  }

  console.log('\n[Global Sync]');
  console.log('6. Verifying /api/auth?action=sync status endpoint...');
  const syncRes = await fetch(`${BASE_URL}/api/auth?action=sync`);
  const syncData = await syncRes.json();
  console.log(`Sync verification: ${syncData.patientsCount} patients and ${syncData.usersCount} users synchronized centrally.`);

  console.log('\n======================================================');
  console.log('>>> ALL MULTI-DEVICE AUTHENTICATION TESTS PASSED! <<<');
  console.log('======================================================');
}

run().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
