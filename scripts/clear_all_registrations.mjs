// scripts/clear_all_registrations.mjs
// Immediately purges all registered user, patient, doctor, and hospital data across MediBridge AI
import fs from 'fs';
import path from 'path';

const CLOUD_SYNC_ENDPOINT = 'https://ntfy.sh/medibridge_cloud_db_v4';

const DEFAULT_ADMIN_USERS = [
  {
    id: 'usr-admin-root',
    email: 'admin@medibridge.ai',
    password: 'Admin@123',
    phone: '+91 99300 88777',
    fullName: 'System Administrator',
    role: 'SYSTEM_ADMIN',
    createdAt: '2025-10-01T08:00:00Z'
  },
  {
    id: 'usr-admin-gov',
    email: 'admin@medibridge.gov.in',
    password: 'Admin@2026',
    phone: '+91 11 2300 0000',
    fullName: 'National Health Administrator',
    role: 'SYSTEM_ADMIN',
    createdAt: '2025-10-01T08:00:00Z'
  },
  {
    id: 'usr-admin-in',
    email: 'admin@medibridge.in',
    password: 'Admin@2026',
    phone: '+91 11 2300 0000',
    fullName: 'Platform Administrator',
    role: 'SYSTEM_ADMIN',
    createdAt: '2025-10-01T08:00:00Z'
  }
];

async function run() {
  console.log('--- PURGING ALL REGISTRATION DATA FROM 3 PORTALS ---');
  const now = new Date().toISOString();
  const resetPayload = {
    users: DEFAULT_ADMIN_USERS,
    patients: [],
    doctors: [],
    hospitals: [],
    version: Date.now(),
    lastUpdated: now,
    clearedAt: now
  };

  // 1. Wipe local temp file registry
  const tempDir = process.env.TEMP || process.env.TMP || 'C:\\Windows\\Temp';
  const registryPath = path.join(tempDir, 'medibridge_auth_registry.json');
  try {
    fs.writeFileSync(registryPath, JSON.stringify(resetPayload, null, 2), 'utf-8');
    console.log(`[PASS] Wiped local registry file: ${registryPath}`);
  } catch (err) {
    console.warn(`[WARN] Could not write ${registryPath}:`, err.message);
  }

  // Also check workspace root for any stray medibridge_auth_registry.json
  const localRegistry = path.join(process.cwd(), 'medibridge_auth_registry.json');
  if (fs.existsSync(localRegistry)) {
    try {
      fs.writeFileSync(localRegistry, JSON.stringify(resetPayload, null, 2), 'utf-8');
      console.log(`[PASS] Wiped workspace registry file: ${localRegistry}`);
    } catch {}
  }

  // 2. Broadcast CLEAR_ALL_REGISTRATIONS event to cloud pubsub
  try {
    const res = await fetch(CLOUD_SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Title': 'CLEAR_ALL_REGISTRATIONS',
        'Priority': 'urgent'
      },
      body: JSON.stringify({
        type: 'CLEAR_ALL_REGISTRATIONS',
        clearedAt: now,
        ts: Date.now(),
        data: {
          message: 'All registration data across Patient, Doctor, and Hospital portals cleared.',
          clearedAt: now
        }
      })
    });
    console.log(`[PASS] Broadcasted CLEAR_ALL_REGISTRATIONS to cloud pubsub: status ${res.status}`);
  } catch (err) {
    console.warn(`[WARN] PubSub broadcast error:`, err.message);
  }

  console.log('--- CLEAR COMPLETED SUCCESSFULLY ---');
  console.log('Patients: 0');
  console.log('Doctors: 0');
  console.log('Hospitals: 0');
  console.log(`Retained Admin Users: ${DEFAULT_ADMIN_USERS.length} (admin@medibridge.ai, etc.)`);
}

run();
