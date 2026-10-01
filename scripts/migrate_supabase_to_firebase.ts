// =========================================================================
// MediBridge AI: Supabase -> Firebase Firestore Data Migration Utility
// =========================================================================
// This script extracts existing Supabase tables (or local seeds & central DB)
// and loads every record into the equivalent Firebase Firestore collection
// while strictly preserving original IDs, timestamps, relationships, and schemas.
// =========================================================================

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, writeBatch } from 'firebase/firestore';
import { getFirebaseConfig, isFirebaseConfigured } from '../src/services/firebaseConfig';
import { db } from '../src/services/mockDatabase';
import { cloudDb } from '../src/services/cloudDatabaseEngine';
import { sanitizeForFirestore, withFirestoreTimeout } from '../src/services/firebaseService';

export interface MigrationReport {
  timestamp: string;
  collectionsMigrated: {
    users: number;
    patients: number;
    doctors: number;
    hospitals: number;
    access_requests: number;
    clinical_sessions: number;
    medical_documents: number;
    emergency_alerts: number;
    trusted_hospitals: number;
    appointments: number;
    timeline: number;
    audit_logs: number;
  };
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  errors: string[];
}

export async function runSupabaseToFirebaseMigration(): Promise<MigrationReport> {
  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    collectionsMigrated: {
      users: 0,
      patients: 0,
      doctors: 0,
      hospitals: 0,
      access_requests: 0,
      clinical_sessions: 0,
      medical_documents: 0,
      emergency_alerts: 0,
      trusted_hospitals: 0,
      appointments: 0,
      timeline: 0,
      audit_logs: 0
    },
    status: 'SUCCESS',
    errors: []
  };

  const config = getFirebaseConfig();
  const app = initializeApp(config);
  const firestore = getFirestore(app);

  console.log('[Migration] Starting Supabase to Firebase Firestore migration...');

  try {
    // 1. Migrate Users
    const users = db.getUsers();
    console.log(`[Migration] Migrating ${users.length} user records...`);
    for (const u of users) {
      try {
        await withFirestoreTimeout(setDoc(doc(firestore, 'users', u.id), sanitizeForFirestore(u), { merge: true }), 3000);
        report.collectionsMigrated.users++;
      } catch (err: any) {
        report.errors.push(`User ${u.id}: ${err.message}`);
      }
    }

    // 2. Migrate Patients
    const patients = await cloudDb.getPatients();
    const localPatients = db.getPatients();
    const patientMap = new Map<string, any>();
    localPatients.forEach(p => patientMap.set(p.patientId, p));
    patients.forEach(p => patientMap.set(p.patientId, p));

    console.log(`[Migration] Migrating ${patientMap.size} patient profiles...`);
    for (const [patientId, p] of patientMap.entries()) {
      try {
        await withFirestoreTimeout(setDoc(doc(firestore, 'patients', patientId), sanitizeForFirestore(p), { merge: true }), 3000);
        report.collectionsMigrated.patients++;
      } catch (err: any) {
        report.errors.push(`Patient ${patientId}: ${err.message}`);
      }
    }

    // 3. Migrate Hospitals
    const hospitals = await cloudDb.getHospitals();
    const localHospitals = db.getHospitalAccounts();
    const hospitalMap = new Map<string, any>();
    localHospitals.forEach(h => hospitalMap.set(h.id, h));
    hospitals.forEach(h => hospitalMap.set(h.hospitalId || h.id, h));

    console.log(`[Migration] Migrating ${hospitalMap.size} hospital records...`);
    for (const [hospId, h] of hospitalMap.entries()) {
      try {
        await withFirestoreTimeout(setDoc(doc(firestore, 'hospitals', hospId), sanitizeForFirestore(h), { merge: true }), 3000);
        report.collectionsMigrated.hospitals++;
      } catch (err: any) {
        report.errors.push(`Hospital ${hospId}: ${err.message}`);
      }
    }

    // 3b. Migrate Doctors
    const doctors = db.getDoctors();
    console.log(`[Migration] Migrating ${doctors.length} doctor profiles...`);
    for (const d of doctors) {
      try {
        await withFirestoreTimeout(setDoc(doc(firestore, 'doctors', d.id), sanitizeForFirestore(d), { merge: true }), 3000);
        report.collectionsMigrated.doctors++;
      } catch (err: any) {
        report.errors.push(`Doctor ${d.id}: ${err.message}`);
      }
    }

    // 4. Migrate Access Requests
    const requests = await cloudDb.getAccessRequests();
    console.log(`[Migration] Migrating ${requests.length} access consent requests...`);
    for (const req of requests) {
      try {
        await withFirestoreTimeout(setDoc(doc(firestore, 'access_requests', req.id), sanitizeForFirestore(req), { merge: true }), 3000);
        report.collectionsMigrated.access_requests++;
      } catch (err: any) {
        report.errors.push(`AccessRequest ${req.id}: ${err.message}`);
      }
    }

    // 5. Migrate Clinical Sessions
    const sessions = db.getClinicalSessions ? db.getClinicalSessions() : [];
    console.log(`[Migration] Migrating ${sessions.length} clinical sessions...`);
    for (const s of sessions) {
      try {
        await withFirestoreTimeout(setDoc(doc(firestore, 'clinical_sessions', s.id), sanitizeForFirestore(s), { merge: true }), 3000);
        report.collectionsMigrated.clinical_sessions++;
      } catch (err: any) {
        report.errors.push(`ClinicalSession ${s.id}: ${err.message}`);
      }
    }

    // 6. Migrate Medical Documents
    const docs = db.getDocuments ? db.getDocuments() : [];
    console.log(`[Migration] Migrating ${docs.length} medical document records...`);
    for (const d of docs) {
      try {
        await withFirestoreTimeout(setDoc(doc(firestore, 'medical_documents', d.id), sanitizeForFirestore(d), { merge: true }), 3000);
        report.collectionsMigrated.medical_documents++;
      } catch (err: any) {
        report.errors.push(`Document ${d.id}: ${err.message}`);
      }
    }

    // 7. Migrate Emergency Alerts
    const emergencies = db.getEmergencyAlerts ? db.getEmergencyAlerts() : [];
    console.log(`[Migration] Migrating ${emergencies.length} emergency alerts...`);
    for (const em of emergencies) {
      try {
        await withFirestoreTimeout(setDoc(doc(firestore, 'emergency_alerts', em.id), sanitizeForFirestore(em), { merge: true }), 3000);
        report.collectionsMigrated.emergency_alerts++;
      } catch (err: any) {
        report.errors.push(`Emergency ${em.id}: ${err.message}`);
      }
    }

    // 8. Migrate Trusted Hospitals
    const trusted = await cloudDb.getTrustedHospitals();
    console.log(`[Migration] Migrating ${trusted.length} trusted hospital linkages...`);
    for (const t of trusted) {
      try {
        await withFirestoreTimeout(setDoc(doc(firestore, 'trusted_hospitals', t.id), sanitizeForFirestore(t), { merge: true }), 3000);
        report.collectionsMigrated.trusted_hospitals++;
      } catch (err: any) {
        report.errors.push(`TrustedHospital ${t.id}: ${err.message}`);
      }
    }

    // 9. Migrate Appointments
    const appointments = db.getAppointments();
    console.log(`[Migration] Migrating ${appointments.length} appointments...`);
    for (const apt of appointments) {
      try {
        await withFirestoreTimeout(setDoc(doc(firestore, 'appointments', apt.id), sanitizeForFirestore(apt), { merge: true }), 3000);
        report.collectionsMigrated.appointments++;
      } catch (err: any) {
        report.errors.push(`Appointment ${apt.id}: ${err.message}`);
      }
    }

    // 10. Migrate Audit Logs
    const logs = db.getAuditLogs();
    console.log(`[Migration] Migrating ${logs.length} immutable audit logs...`);
    for (const l of logs) {
      try {
        await withFirestoreTimeout(setDoc(doc(firestore, 'audit_logs', l.id), sanitizeForFirestore(l), { merge: true }), 3000);
        report.collectionsMigrated.audit_logs++;
      } catch (err: any) {
        report.errors.push(`AuditLog ${l.id}: ${err.message}`);
      }
    }

    if (report.errors.length > 0) {
      report.status = 'PARTIAL';
    }

    console.log('[Migration] Migration complete!', report);
  } catch (globalErr: any) {
    report.status = 'FAILED';
    report.errors.push(`Global migration error: ${globalErr.message}`);
    console.error('[Migration Error]:', globalErr);
  }

  return report;
}

// Automatically run if invoked directly from the CLI
if (
  typeof process !== 'undefined' &&
  process.argv &&
  process.argv[1] &&
  (process.argv[1].includes('migrate_supabase_to_firebase') || process.argv[1].endsWith('migrate_supabase_to_firebase.ts'))
) {
  runSupabaseToFirebaseMigration()
    .then((report) => {
      console.log('\n=============================================');
      console.log(`[Migration Result]: ${report.status}`);
      console.log('Collections Migrated:', report.collectionsMigrated);
      if (report.errors.length > 0) {
        console.warn(`Encountered ${report.errors.length} non-fatal errors:`, report.errors.slice(0, 3));
      }
      console.log('=============================================\n');
      process.exit(report.status === 'FAILED' ? 1 : 0);
    })
    .catch((err) => {
      console.error('[Migration Fatal Error]:', err);
      process.exit(1);
    });
}
