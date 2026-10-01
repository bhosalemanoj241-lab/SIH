// test_hospital_auth.mjs
async function run() {
  console.log('=== TESTING HOSPITAL & STAFF CENTRALIZED MULTI-DEVICE AUTH ===\n');

  const timestamp = Date.now();
  const testHospital = {
    hospitalName: 'Apollo Sahyadri Super Speciality Hospital',
    registrationId: `REG-MAH-${timestamp.toString().slice(-6)}`,
    address: 'Survey 45, Senapati Bapat Road',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411016',
    emergencyContact: '+91 20 2567 8900',
    email: `apollo.pune.${timestamp}@hospitalcloud.in`,
    password: 'HospitalPassword@2026',
    ambulanceAvailable: true,
    departments: ['Emergency', 'Cardiology', 'ICU', 'Neurology']
  };

  console.log(`1. [Device A] Registering Hospital: ${testHospital.hospitalName} (${testHospital.email})...`);
  const regRes = await fetch('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      accountType: 'hospital',
      user: {
        email: testHospital.email,
        password: testHospital.password,
        fullName: testHospital.hospitalName,
        phone: testHospital.emergencyContact,
        role: 'HOSPITAL_ADMIN'
      },
      hospitalAccount: {
        id: `hosp-${timestamp}`,
        hospitalId: `HOSP-${timestamp.toString().slice(-5)}`,
        hospitalName: testHospital.hospitalName,
        registrationId: testHospital.registrationId,
        email: testHospital.email,
        city: testHospital.city,
        state: testHospital.state,
        pincode: testHospital.pincode,
        emergencyContact: testHospital.emergencyContact,
        departments: testHospital.departments
      }
    })
  });

  const regData = await regRes.json();
  console.log('[Device A] Hospital Registration Result:', {
    success: regData.success,
    role: regData.user?.role,
    hospitalName: regData.user?.fullName,
    hospitalId: regData.hospitalAccount?.hospitalId
  });

  if (!regData.success) {
    console.error('Hospital registration failed:', regData);
    process.exit(1);
  }

  const assignedHospId = regData.hospitalAccount?.hospitalId;

  console.log(`\n2. [Device B] Testing Hospital Login with Email (${testHospital.email}) from isolated device...`);
  const loginRes = await fetch('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      identifier: testHospital.email,
      password: testHospital.password
    })
  });

  const loginData = await loginRes.json();
  console.log('[Device B] Hospital Email Login Result:', {
    success: loginData.success,
    role: loginData.user?.role,
    hospitalName: loginData.user?.fullName,
    token: loginData.token ? `${loginData.token.slice(0, 18)}...` : undefined
  });

  if (!loginData.success || loginData.user?.role !== 'HOSPITAL_ADMIN') {
    console.error('Hospital login on Device B failed!');
    process.exit(1);
  }

  console.log(`\n3. [Device C] Testing Hospital Login with Registration ID (${testHospital.registrationId})...`);
  const regIdLoginRes = await fetch('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'login',
      identifier: testHospital.registrationId,
      password: testHospital.password
    })
  });

  const regIdLoginData = await regIdLoginRes.json();
  console.log('[Device C] Hospital Registration ID Login Result:', {
    success: regIdLoginData.success,
    role: regIdLoginData.user?.role,
    hospitalName: regIdLoginData.user?.fullName
  });

  if (!regIdLoginData.success) {
    console.error('Hospital Registration ID login failed!');
    process.exit(1);
  }

  console.log('\n======================================================');
  console.log('>>> HOSPITAL CENTRAL AUTHENTICATION VERIFIED 100%! <<<');
  console.log('======================================================');
}

run().catch(err => {
  console.error('Test run failed:', err);
  process.exit(1);
});
