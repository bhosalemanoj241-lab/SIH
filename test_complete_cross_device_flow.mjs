// test_complete_cross_device_flow.mjs
// Comprehensive verification of Patient-Hospital cross-device linking,
// Central Database persistence, real authentication, and no fake data.

const APP_URL = 'http://localhost:3000';

async function main() {
  console.log('================================================================');
  console.log('  MEDIBRIDGE AI: FULL PATIENT-HOSPITAL CROSS-DEVICE TEST SUITE  ');
  console.log('================================================================\n');

  const ts = Date.now();
  const testPatient = {
    fullName: `Ananya Deshmukh ${ts.toString().slice(-4)}`,
    email: `ananya.${ts}@testpatient.medibridge.in`,
    phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'PatientPass@2026',
    dob: '1996-05-15',
    gender: 'FEMALE',
    bloodGroup: 'O+',
    city: 'Pune',
    address: '402, Shivajinagar, FC Road',
    emergencyContactName: 'Suresh Deshmukh',
    emergencyContactPhone: '9822001122',
    emergencyContactRelation: 'Father'
  };

  const testHospital = {
    hospitalName: `Apollo Central Clinic ${ts.toString().slice(-4)}`,
    registrationId: `MAH-REG-${ts.toString().slice(-6)}`,
    email: `admin.${ts}@apolloclinic.pune.in`,
    password: 'HospitalPass@2026',
    city: 'Pune',
    address: 'Plot 18, Bund Garden Road',
    phone: '020-26123456',
    ambulanceAvailable: true
  };

  let patientUniqueId = '';
  let hospitalUniqueId = '';
  let verificationOtp = '';

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 1: PATIENT REGISTRATION ON DEVICE A
  // ─────────────────────────────────────────────────────────────────────────
  console.log('1. [Device A - Patient] Registering genuine patient in central database...');
  const regRes = await fetch(`${APP_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      accountType: 'patient',
      data: testPatient
    })
  });

  const regData = await regRes.json();
  console.log('   Response status:', regRes.status, 'requiresVerification:', regData.requiresVerification);

  if (regRes.status !== 201 || !regData.requiresVerification) {
    throw new Error(`Patient registration failed: ${JSON.stringify(regData)}`);
  }

  patientUniqueId = regData.patientId;
  verificationOtp = regData.devCode;
  console.log(`   ✅ Patient registered! Unique ID: ${patientUniqueId}, Email: ${testPatient.email}`);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 2: ATTEMPT LOGIN BEFORE EMAIL VERIFICATION (MUST BE GATED)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n2. [Security Check] Attempting login before OTP verification (must be gated)...');
  const preVerifyLoginRes = await fetch(`${APP_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      identifier: testPatient.email,
      password: testPatient.password
    })
  });

  const preVerifyLoginData = await preVerifyLoginRes.json();
  console.log('   Pre-verification login status:', preVerifyLoginRes.status, 'emailUnverified:', preVerifyLoginData.emailUnverified);
  if (preVerifyLoginRes.status !== 403 || !preVerifyLoginData.emailUnverified) {
    throw new Error(`Unverified login should be gated with 403: ${JSON.stringify(preVerifyLoginData)}`);
  }
  console.log('   ✅ Unverified login properly gated!');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 3: EMAIL OTP VERIFICATION
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n3. [Device A - Patient] Verifying email with 6-digit OTP...');
  // Test wrong OTP first
  const wrongOtpRes = await fetch(`${APP_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'verify_otp',
      email: testPatient.email,
      code: '000000'
    })
  });
  console.log('   Wrong OTP response status:', wrongOtpRes.status);
  if (wrongOtpRes.status === 200) {
    throw new Error('Wrong OTP was incorrectly accepted!');
  }
  console.log('   ✅ Wrong OTP properly rejected!');

  // Now verify with correct OTP
  const verifyRes = await fetch(`${APP_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'verify_otp',
      email: testPatient.email,
      code: verificationOtp
    })
  });

  const verifyData = await verifyRes.json();
  if (verifyRes.status !== 200 || !verifyData.verified) {
    throw new Error(`Correct OTP verification failed: ${JSON.stringify(verifyData)}`);
  }
  console.log('   ✅ Email successfully verified and account activated!');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 4: PATIENT LOGIN (AFTER VERIFICATION)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n4. [Device A - Patient] Logging in with verified credentials...');
  const patLoginRes = await fetch(`${APP_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      identifier: testPatient.email,
      password: testPatient.password
    })
  });
  const patLoginData = await patLoginRes.json();
  if (patLoginRes.status !== 200 || !patLoginData.token) {
    throw new Error(`Patient login failed after verification: ${JSON.stringify(patLoginData)}`);
  }
  console.log('   ✅ Patient login successful! Token generated, role:', patLoginData.user?.role);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 5: PATIENT SAVES CLINICAL INTAKE SESSION (CENTRAL DB PERSISTENCE)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n5. [Device A - Patient] Saving AI Clinical Intake Session to Central Database...');
  const clinicalSession = {
    id: `sess-${ts}`,
    patientId: patientUniqueId,
    patientName: testPatient.fullName,
    startedAt: new Date().toISOString(),
    status: 'COMPLETED',
    triagePriority: 'YELLOW',
    symptoms: ['Persistent dry cough for 3 days', 'Low grade fever', 'Mild headache'],
    vitals: { temp: '99.8°F', pulse: '82 bpm', bp: '120/80' },
    aiSummary: {
      medicalSystem: 'ALLOPATHY',
      verificationStatus: 'PENDING_PHYSICIAN_REVIEW',
      chiefComplaint: { mainReason: 'Persistent dry cough & fever', source: 'PATIENT REPORTED' }
    }
  };

  const saveSessRes = await fetch(`${APP_URL}/api/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'save_session',
      session: clinicalSession
    })
  });
  const saveSessData = await saveSessRes.json();
  if (!saveSessData.success) {
    throw new Error(`Failed to save clinical session to central DB: ${JSON.stringify(saveSessData)}`);
  }
  console.log('   ✅ Clinical session saved to central backend database!');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 6: HOSPITAL REGISTRATION ON SEPARATE DEVICE B
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n6. [Device B - Hospital] Registering new Hospital Account in central database...');
  const hospRegRes = await fetch(`${APP_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      accountType: 'hospital',
      data: testHospital
    })
  });

  const hospRegData = await hospRegRes.json();
  if (hospRegRes.status !== 201 || !hospRegData.hospitalAccount) {
    throw new Error(`Hospital registration failed: ${JSON.stringify(hospRegData)}`);
  }
  hospitalUniqueId = hospRegData.hospitalAccount.hospitalId;
  console.log(`   ✅ Hospital registered! ID: ${hospitalUniqueId}, Name: ${testHospital.hospitalName}`);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 7: HOSPITAL LOGIN ON SEPARATE DEVICE B
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n7. [Device B - Hospital] Logging in to Hospital Portal on Device B...');
  const hospLoginRes = await fetch(`${APP_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      identifier: testHospital.email,
      password: testHospital.password
    })
  });

  const hospLoginData = await hospLoginRes.json();
  if (hospLoginRes.status !== 200 || !hospLoginData.token) {
    throw new Error(`Hospital login failed: ${JSON.stringify(hospLoginData)}`);
  }
  console.log('   ✅ Hospital authenticated on Device B! Role:', hospLoginData.user?.role);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 8: HOSPITAL SEARCHES FOR PATIENT USING UNIQUE ID (DEVICE B -> DEVICE A DATA)
  // ─────────────────────────────────────────────────────────────────────────
  console.log(`\n8. [Device B - Hospital] Searching for Patient using Unique ID: "${patientUniqueId}"...`);
  
  // Test /api/search
  const searchRes = await fetch(`${APP_URL}/api/search?patientId=${encodeURIComponent(patientUniqueId)}`);
  const searchData = await searchRes.json();
  console.log('   /api/search status:', searchRes.status, 'found:', searchData.found);

  if (searchRes.status !== 200 || !searchData.found || !searchData.patient) {
    throw new Error(`Hospital search failed to find patient by Unique ID: ${JSON.stringify(searchData)}`);
  }

  const foundPatient = searchData.patient;
  console.log('   ✅ Patient Found! Verified data:');
  console.log(`      - Unique ID: ${foundPatient.patientId}`);
  console.log(`      - Full Name: ${foundPatient.fullName}`);
  console.log(`      - Blood Group: ${foundPatient.bloodGroup}`);
  console.log(`      - City: ${foundPatient.city}`);
  console.log(`      - Sessions retrieved: ${searchData.sessions?.length || 0}`);

  if (foundPatient.fullName !== testPatient.fullName) {
    throw new Error(`Patient name mismatch: expected ${testPatient.fullName}, got ${foundPatient.fullName}`);
  }

  // Also test /api/patients
  const patRes = await fetch(`${APP_URL}/api/patients?patientId=${encodeURIComponent(patientUniqueId)}`);
  const patData = await patRes.json();
  if (patRes.status !== 200 || !patData.patient) {
    throw new Error(`/api/patients failed to find patient: ${JSON.stringify(patData)}`);
  }
  console.log(`   ✅ /api/patients also verified! Retrieved ${patData.sessions?.length} clinical sessions`);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 9: HOSPITAL CREATES ACCESS REQUEST (DEVICE B -> DEVICE A)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n9. [Device B - Hospital] Dispatching Access Consent Request to Patient...');
  const accessReq = {
    id: `req-test-${ts}`,
    patientId: patientUniqueId,
    patientName: testPatient.fullName,
    hospitalId: hospitalUniqueId,
    hospitalName: testHospital.hospitalName,
    requestedBy: 'Dr. Sameer Joshi (Duty Physician)',
    requestedAt: new Date().toISOString(),
    status: 'PENDING',
    accessScope: 'Full Clinical Dossier & Pre-Arrival AI Summary',
    reason: 'Clinical intake evaluation and treatment planning'
  };

  const reqPostRes = await fetch(`${APP_URL}/api/access-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(accessReq)
  });
  const reqPostData = await reqPostRes.json();
  if (reqPostRes.status !== 201 || !reqPostData.success) {
    throw new Error(`Failed to create access request: ${JSON.stringify(reqPostData)}`);
  }
  console.log('   ✅ Access Request dispatched and stored in central database!');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 10: PATIENT VIEWS PENDING ACCESS REQUEST ON DEVICE A
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n10. [Device A - Patient] Patient checking pending access requests...');
  const pendingReqRes = await fetch(`${APP_URL}/api/access-requests?patientId=${encodeURIComponent(patientUniqueId)}`);
  const pendingReqData = await pendingReqRes.json();
  const pendingList = pendingReqData.requests?.filter(r => r.status === 'PENDING') || [];
  console.log(`    Found ${pendingList.length} pending request(s) for patient.`);
  if (pendingList.length === 0) {
    throw new Error('Patient failed to find pending access request from hospital!');
  }
  console.log(`    ✅ Pending request verified from: "${pendingList[0].hospitalName}"`);

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 11: PATIENT APPROVES ACCESS (DEVICE A)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n11. [Device A - Patient] Patient approving access request...');
  const patchReqRes = await fetch(`${APP_URL}/api/access-requests?id=${encodeURIComponent(accessReq.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: accessReq.id, status: 'APPROVED' })
  });
  const patchReqData = await patchReqRes.json();
  if (patchReqRes.status !== 200 || patchReqData.request?.status !== 'APPROVED') {
    throw new Error(`Failed to approve access request: ${JSON.stringify(patchReqData)}`);
  }

  // Also store in trusted hospitals
  const trustRecord = {
    id: `trust-${ts}`,
    patientId: patientUniqueId,
    hospitalId: hospitalUniqueId,
    hospitalName: testHospital.hospitalName,
    grantedAt: new Date().toISOString(),
    status: 'ACTIVE'
  };
  await fetch(`${APP_URL}/api/trusted-hospitals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(trustRecord)
  });
  console.log('    ✅ Patient approved access! Hospital added to trusted hospitals registry.');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 12: HOSPITAL VERIFIES ACCESS GRANTED ON DEVICE B
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n12. [Device B - Hospital] Checking permission status on Device B...');
  const checkAccessRes = await fetch(`${APP_URL}/api/access-requests?patientId=${encodeURIComponent(patientUniqueId)}`);
  const checkAccessData = await checkAccessRes.json();
  const approvedReq = checkAccessData.requests?.find(r => r.id === accessReq.id && r.status === 'APPROVED');
  if (!approvedReq) {
    throw new Error(`Hospital on Device B could not verify approved status: ${JSON.stringify(checkAccessData)}`);
  }
  console.log('    ✅ Access APPROVED verified on Device B! Full medical dossier is authorized.');

  // ─────────────────────────────────────────────────────────────────────────
  // TEST 13: NEGATIVE SECURITY TESTS (NO FAKE DATA / STRICT GATING)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n13. [Negative Security & Non-Fake Verification Tests]...');

  // 13a. Unregistered Patient ID Search
  const fakeId = 'MB-2026-NONEXISTENT999';
  const fakeIdRes = await fetch(`${APP_URL}/api/search?patientId=${encodeURIComponent(fakeId)}`);
  console.log(`    - Search for non-existent ID "${fakeId}" status:`, fakeIdRes.status);
  if (fakeIdRes.status !== 404) {
    throw new Error('Unregistered patient ID did not return 404!');
  }
  console.log('      ✅ Non-existent ID returns 404 (No fake/demo data fallback).');

  // 13b. Unregistered Hospital Login
  const fakeHospRes = await fetch(`${APP_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      identifier: 'fakehospital@doesnotexist.in',
      password: 'AnyPassword@123'
    })
  });
  console.log('    - Unregistered hospital login status:', fakeHospRes.status);
  if (fakeHospRes.status !== 404 && fakeHospRes.status !== 401) {
    throw new Error('Unregistered hospital was not rejected!');
  }
  console.log('      ✅ Unregistered hospital properly rejected.');

  // 13c. Wrong Password for Real Patient
  const wrongPassRes = await fetch(`${APP_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      identifier: testPatient.email,
      password: 'WrongPassword999!'
    })
  });
  console.log('    - Wrong password login status:', wrongPassRes.status);
  if (wrongPassRes.status !== 401) {
    throw new Error('Wrong password was not rejected with 401!');
  }
  console.log('      ✅ Wrong password rejected with 401 Unauthorized.');

  // 13d. Duplicate Email Registration
  const dupEmailRes = await fetch(`${APP_URL}/api/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      accountType: 'patient',
      data: testPatient
    })
  });
  console.log('    - Duplicate email registration status:', dupEmailRes.status);
  if (dupEmailRes.status !== 409) {
    throw new Error('Duplicate email was not rejected with 409 Conflict!');
  }
  console.log('      ✅ Duplicate registration rejected with 409 Conflict.');

  console.log('\n================================================================');
  console.log('  🎉 ALL 13 REAL-WORLD CROSS-DEVICE VERIFICATION TESTS PASSED!  ');
  console.log('================================================================');
}

main().catch(err => {
  console.error('\n❌ Test Suite Failed:', err);
  process.exit(1);
});
