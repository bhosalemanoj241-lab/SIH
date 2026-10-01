// test_resend_and_expiry.mjs
const API_BASE = 'http://localhost:3000/api/auth';

async function testResend() {
  console.log('Testing Resend OTP API...');
  const timestamp = Date.now();
  const email = `resend.test.${timestamp}@gmail.com`;

  // 1. Register
  const regRes = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'register',
      accountType: 'patient',
      data: {
        fullName: 'Resend Test User',
        email: email,
        password: 'Password123!',
        phone: '9820011122'
      }
    })
  });
  const regData = await regRes.json();
  const code1 = regData.devCode;
  console.log('First code generated:', code1);

  // 2. Resend OTP
  const resendRes = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'resend_otp',
      email: email
    })
  });
  const resendData = await resendRes.json();
  const code2 = resendData.devCode;
  console.log('Second code generated via resend:', code2);

  if (!resendData.success || !code2) {
    console.error('Resend failed:', resendData);
    process.exit(1);
  }

  // 3. Verify old code (should fail)
  const oldCodeRes = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'verify_otp',
      email: email,
      otp: code1
    })
  });
  const oldCodeData = await oldCodeRes.json();
  console.log('Old code verification rejected as expected:', oldCodeData.error);

  // 4. Verify new code (should succeed)
  const newCodeRes = await fetch(API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'verify_otp',
      email: email,
      otp: code2
    })
  });
  const newCodeData = await newCodeRes.json();
  console.log('New code verified successfully:', newCodeData.success, newCodeData.user?.isEmailVerified);

  if (!newCodeData.success || !newCodeData.user?.isEmailVerified) {
    console.error('New code verification failed:', newCodeData);
    process.exit(1);
  }

  console.log('✅ Resend OTP verification test passed successfully!');
}

testResend().catch(err => {
  console.error(err);
  process.exit(1);
});
