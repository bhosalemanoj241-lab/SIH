// test_complete_email_verification.mjs
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:3000/api/auth';
const DB_PATH = './data/medibridge_central_database.json';

async function testCompleteFlow() {
  console.log('===============================================================');
  console.log('🧪 TESTING MEDIBRIDGE REAL PATIENT REGISTRATION & EMAIL OTP FLOW');
  console.log('===============================================================\n');

  // Check Database for fake data first
  console.log('Step 0: Checking Central Database for any fake/demo data...');
  if (fs.existsSync(DB_PATH)) {
    const raw = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    const patients = raw.patients || [];
    const hospitals = raw.hospitals || [];
    const fakeFound = patients.filter(p => (p.email && p.email.includes('demo')) || (p.fullName && p.fullName.includes('Demo')));
    if (fakeFound.length > 0) {
      console.error('❌ Found demo data in database!', fakeFound);
      process.exit(1);
    }
    console.log(`✅ Central Database verified clean. Total registered patients in DB: ${patients.length}, Hospitals: ${hospitals.length}`);
  }

  const timestamp = Date.now();
  const testEmail = `patient.test.${timestamp}@gmail.com`;
  const testPassword = 'Password@2026';
  const fullName = `Dr. Manoj Test Patient ${timestamp.toString().slice(-4)}`;

  // Step 1: Register Patient
  console.log(`\nStep 1: Registering new patient with email: ${testEmail}...`);
  const regPayload = {
    action: 'register',
    accountType: 'patient',
    data: {
      fullName,
      email: testEmail,
      password: testPassword,
      phone: `+91 98${timestamp.toString().slice(-8)}`,
      dateOfBirth: '1995-05-15',
      gender: 'MALE',
      bloodGroup: 'O+',
      city: 'Pune',
      address: 'Baner, Pune',
      pincode: '411045',
      emergencyContactName: 'Test Contact',
      emergencyContactPhone: `+91 97${timestamp.toString().slice(-8)}`,
      emergencyContactRelation: 'Brother',
      preferredLanguage: 'en'
    }
  };

  const regRes = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(regPayload)
  });

  const regData = await regRes.json();
  console.log('Registration Response Status:', regRes.status);
  console.log('Registration Response Body:', {
    success: regData.success,
    requiresVerification: regData.requiresVerification,
    patientId: regData.patientId,
    email: regData.email,
    token: regData.token ? 'TOKEN_ISSUED' : 'NO_TOKEN (CORRECT - GATED UNTIL VERIFIED)',
    hasDevCode: Boolean(regData.devCode)
  });

  if (!regData.success || !regData.requiresVerification) {
    console.error('❌ Registration failed or did not require verification:', regData);
    process.exit(1);
  }

  if (regData.token) {
    console.error('❌ Security Violation: Token was issued before email was verified!');
    process.exit(1);
  }

  const patientId = regData.patientId;
  const otpCode = regData.devCode;
  console.log(`✅ Real account created in database with Patient ID: ${patientId}`);
  console.log(`✅ Verification OTP sent to patient email: ${testEmail}`);

  // Step 2: Try logging in before email verification (MUST BE BLOCKED)
  console.log('\nStep 2: Attempting login BEFORE email verification (must be rejected)...');
  const preVerifyLoginRes = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      identifier: testEmail,
      password: testPassword
    })
  });

  const preVerifyLoginData = await preVerifyLoginRes.json();
  console.log('Pre-verification Login Status:', preVerifyLoginRes.status);
  console.log('Pre-verification Login Body:', preVerifyLoginData);

  if (preVerifyLoginRes.status !== 403 || !preVerifyLoginData.emailUnverified) {
    console.error('❌ Security Violation: Unverified user was not blocked properly!', preVerifyLoginData);
    process.exit(1);
  }
  console.log('✅ Unverified user strictly blocked from login with HTTP 403 and emailUnverified: true');

  // Step 3: Try verifying with incorrect OTP code
  console.log('\nStep 3: Submitting INCORRECT verification code (000000)...');
  const wrongOtpRes = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'verify_otp',
      email: testEmail,
      otp: '000000'
    })
  });

  const wrongOtpData = await wrongOtpRes.json();
  console.log('Wrong OTP Status:', wrongOtpRes.status);
  console.log('Wrong OTP Message:', wrongOtpData.error || wrongOtpData.message);

  if (wrongOtpData.success) {
    console.error('❌ Incorrect OTP code was accepted!', wrongOtpData);
    process.exit(1);
  }
  console.log('✅ Incorrect OTP correctly rejected.');

  // Step 4: Submit CORRECT verification code
  console.log(`\nStep 4: Submitting CORRECT verification code (${otpCode})...`);
  const correctOtpRes = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'verify_otp',
      email: testEmail,
      otp: otpCode
    })
  });

  const correctOtpData = await correctOtpRes.json();
  console.log('Correct OTP Status:', correctOtpRes.status);
  console.log('Correct OTP Response:', {
    success: correctOtpData.success,
    isEmailVerified: correctOtpData.user?.isEmailVerified,
    token: correctOtpData.token ? `${correctOtpData.token.slice(0, 20)}...` : undefined,
    patientId: correctOtpData.patientProfile?.patientId
  });

  if (!correctOtpData.success || !correctOtpData.token || !correctOtpData.user?.isEmailVerified) {
    console.error('❌ Verification failed with correct OTP:', correctOtpData);
    process.exit(1);
  }
  console.log('✅ Email successfully verified and session token issued!');

  // Step 5: Device B (Cross-device login with Email)
  console.log('\nStep 5: [Device B] Testing cross-device login with registered Email & password...');
  const devBLoginRes = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      identifier: testEmail,
      password: testPassword
    })
  });

  const devBLoginData = await devBLoginRes.json();
  console.log('[Device B] Login Response:', {
    success: devBLoginData.success,
    token: devBLoginData.token ? `${devBLoginData.token.slice(0, 20)}...` : undefined,
    email: devBLoginData.user?.email,
    patientId: devBLoginData.user?.patientId,
    fullName: devBLoginData.user?.fullName
  });

  if (!devBLoginData.success || devBLoginData.user?.patientId !== patientId) {
    console.error('❌ Device B login failed or returned incorrect patient:', devBLoginData);
    process.exit(1);
  }
  console.log('✅ Device B logged in successfully with email and retrieved identical patient profile!');

  // Step 6: Device C (Cross-device login with Patient ID)
  console.log(`\nStep 6: [Device C] Testing cross-device login with Patient ID (${patientId}) & password...`);
  const devCLoginRes = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      identifier: patientId,
      password: testPassword
    })
  });

  const devCLoginData = await devCLoginRes.json();
  console.log('[Device C] Login Response:', {
    success: devCLoginData.success,
    token: devCLoginData.token ? `${devCLoginData.token.slice(0, 20)}...` : undefined,
    email: devCLoginData.user?.email,
    patientId: devCLoginData.user?.patientId,
    city: devCLoginData.patientProfile?.city
  });

  if (!devCLoginData.success || devCLoginData.user?.email !== testEmail) {
    console.error('❌ Device C login with Patient ID failed:', devCLoginData);
    process.exit(1);
  }
  console.log('✅ Device C logged in successfully using Patient ID directly!');

  // Step 7: Database persistence check
  console.log('\nStep 7: Verifying persistent database record on disk...');
  const diskDb = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  const savedPatient = diskDb.patients.find(p => p.email === testEmail);
  const savedUser = diskDb.users.find(u => u.email === testEmail);

  if (!savedPatient || !savedUser) {
    console.error('❌ Patient not saved in persistent database file!');
    process.exit(1);
  }

  if (!savedUser.isEmailVerified || !savedPatient.isEmailVerified) {
    console.error('❌ isEmailVerified is not true in database file!', { savedUser, savedPatient });
    process.exit(1);
  }

  console.log('✅ Database disk file contains verified record:', {
    userId: savedUser.id,
    patientId: savedPatient.patientId,
    email: savedUser.email,
    isEmailVerified: savedUser.isEmailVerified,
    city: savedPatient.city
  });

  console.log('\n===============================================================');
  console.log('🎉 ALL TESTS PASSED: COMPLETE PATIENT AUTH & EMAIL VERIFICATION WORKING!');
  console.log('===============================================================\n');
}

testCompleteFlow().catch(err => {
  console.error('Fatal error during test:', err);
  process.exit(1);
});
