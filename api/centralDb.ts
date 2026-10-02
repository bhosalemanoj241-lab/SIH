import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  password?: string;
  phone: string;
  fullName: string;
  role: 'PATIENT' | 'DOCTOR' | 'TRIAGE' | 'HOSPITAL_ADMIN' | 'SYSTEM_ADMIN' | 'HOSPITAL' | 'ADMIN';
  avatarUrl?: string;
  patientId?: string;
  hospitalId?: string;
  isEmailVerified?: boolean;
  createdAt: string;
}

export interface PatientProfile {
  id: string;
  userId: string;
  patientId: string;
  abhaId?: string;
  abhaAddress?: string;
  dob: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup: string;
  heightCm?: number;
  weightKg?: number;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
  fullName?: string;
  phone?: string;
  email?: string;
  preferredLanguage?: string;
  allergies?: string[];
  chronicConditions?: string[];
  currentMedications?: string[];
  status?: string;
  password?: string;
  isEmailVerified?: boolean;
  createdAt: string;
}

export interface HospitalAccount {
  id: string;
  userId: string;
  hospitalId?: string;
  hospitalName: string;
  registrationId: string;
  address: string;
  city: string;
  location: string;
  state?: string;
  pincode?: string;
  emergencyContact: string;
  phone?: string;
  email: string;
  password?: string;
  ambulanceAvailable: boolean;
  departments: string[];
  licenseNumber?: string;
  coordinates?: { lat: number; lng: number };
  status?: string;
  createdAt: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  doctorName?: string;
  email?: string;
  phone?: string;
  registrationNumber: string;
  qualification: string;
  specialization: string;
  hospitalId: string;
  hospitalName: string;
  departmentId: string;
  departmentName: string;
  experienceYears: number;
  isAvailable: boolean;
  activePatientsCount: number;
  createdAt?: string;
}

export interface EmailVerificationRecord {
  email: string;
  code: string;
  expiresAt: number; // Unix timestamp in ms
  attempts: number;
  createdAt: string;
}

export interface CentralDatabase {
  users: User[];
  patients: PatientProfile[];
  hospitals: HospitalAccount[];
  doctors: DoctorProfile[];
  accessRequests: any[];
  trustedHospitals: any[];
  sessions: any[];
  documents: any[];
  emergencies: any[];
  appointments: any[];
  auditLogs: any[];
  verificationCodes: Record<string, EmailVerificationRecord>;
  version: number;
  lastUpdated: string;
  clearedAt?: string;
}

export const DEFAULT_ADMIN_USERS: User[] = [
  {
    id: 'usr-admin-root',
    email: 'admin@medibridge.ai',
    password: 'Admin@123',
    phone: '+91 99300 88777',
    fullName: 'System Administrator',
    role: 'SYSTEM_ADMIN',
    isEmailVerified: true,
    createdAt: '2025-10-01T08:00:00Z'
  },
  {
    id: 'usr-admin-gov',
    email: 'admin@medibridge.gov.in',
    password: 'Admin@2026',
    phone: '+91 11 2300 0000',
    fullName: 'National Health Administrator',
    role: 'SYSTEM_ADMIN',
    isEmailVerified: true,
    createdAt: '2025-10-01T08:00:00Z'
  },
  {
    id: 'usr-admin-in',
    email: 'admin@medibridge.in',
    password: 'Admin@2026',
    phone: '+91 11 2300 0000',
    fullName: 'Platform Administrator',
    role: 'SYSTEM_ADMIN',
    isEmailVerified: true,
    createdAt: '2025-10-01T08:00:00Z'
  }
];

let inMemoryDb: CentralDatabase | null = null;

export function getDbFilePath(): string {
  try {
    const cwd = process.cwd();
    const dataDir = path.join(cwd, 'data');
    if (!fs.existsSync(dataDir)) {
      try {
        fs.mkdirSync(dataDir, { recursive: true });
      } catch {}
    }
    if (fs.existsSync(dataDir)) {
      return path.join(dataDir, 'medibridge_central_database.json');
    }
  } catch {}

  const tmpDir = process.env.TEMP || process.env.TMP || (process.platform === 'win32' ? 'C:\\Windows\\Temp' : '/tmp');
  return path.join(tmpDir, 'medibridge_central_database.json');
}

function sanitizeDatabase(data: any): CentralDatabase {
  const users: User[] = Array.isArray(data?.users) ? data.users : [];
  for (const admin of DEFAULT_ADMIN_USERS) {
    if (!users.some(u => (u.email || '').toLowerCase() === admin.email.toLowerCase())) {
      users.push(admin);
    }
  }

  return {
    users,
    patients: Array.isArray(data?.patients) ? data.patients : [],
    hospitals: Array.isArray(data?.hospitals) ? data.hospitals : [],
    doctors: Array.isArray(data?.doctors) ? data.doctors : [],
    accessRequests: Array.isArray(data?.accessRequests) ? data.accessRequests : [],
    trustedHospitals: Array.isArray(data?.trustedHospitals) ? data.trustedHospitals : [],
    sessions: Array.isArray(data?.sessions) ? data.sessions : [],
    documents: Array.isArray(data?.documents) ? data.documents : [],
    emergencies: Array.isArray(data?.emergencies) ? data.emergencies : [],
    appointments: Array.isArray(data?.appointments) ? data.appointments : [],
    auditLogs: Array.isArray(data?.auditLogs) ? data.auditLogs : [],
    verificationCodes: (data?.verificationCodes && typeof data.verificationCodes === 'object') ? data.verificationCodes : {},
    version: typeof data?.version === 'number' ? data.version : 1,
    lastUpdated: data?.lastUpdated || new Date().toISOString(),
    clearedAt: data?.clearedAt
  };
}

let lastMtimeMs = 0;

export function getDatabase(): CentralDatabase {
  const filePath = getDbFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const stat = fs.statSync(filePath);
      if (!inMemoryDb || stat.mtimeMs > lastMtimeMs) {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        inMemoryDb = sanitizeDatabase(parsed);
        lastMtimeMs = stat.mtimeMs;
        return inMemoryDb;
      }
    }
  } catch (err) {
    console.warn('[CentralDb] Read error from', filePath, err);
  }

  if (inMemoryDb) {
    return inMemoryDb;
  }

  inMemoryDb = sanitizeDatabase({});
  saveDatabase(inMemoryDb);
  return inMemoryDb;
}

export function saveDatabase(data: CentralDatabase): boolean {
  try {
    const sanitized = sanitizeDatabase({
      ...data,
      lastUpdated: new Date().toISOString()
    });
    inMemoryDb = sanitized;

    const filePath = getDbFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(sanitized, null, 2), 'utf-8');
    try {
      lastMtimeMs = fs.statSync(filePath).mtimeMs;
    } catch {}

    // Also mirror to temp file for multi-process safety if using data directory
    try {
      const tmpDir = process.env.TEMP || process.env.TMP || (process.platform === 'win32' ? 'C:\\Windows\\Temp' : '/tmp');
      const mirrorPath = path.join(tmpDir, 'medibridge_central_database.json');
      if (mirrorPath !== filePath) {
        fs.writeFileSync(mirrorPath, JSON.stringify(sanitized, null, 2), 'utf-8');
      }
    } catch {}

    return true;
  } catch (err) {
    console.error('[CentralDb] Save error:', err);
    return false;
  }
}

/**
 * Completely clears all registered patients, hospitals, doctors, sessions, requests,
 * starting with a 100% clean registration state. Only default platform admins remain.
 */
export function clearAllRegistrations(): { success: boolean; clearedAt: string; message: string } {
  const now = new Date().toISOString();
  const resetDb: CentralDatabase = {
    users: [...DEFAULT_ADMIN_USERS],
    patients: [],
    hospitals: [],
    doctors: [],
    accessRequests: [],
    trustedHospitals: [],
    sessions: [],
    documents: [],
    emergencies: [],
    appointments: [],
    auditLogs: [],
    verificationCodes: {},
    version: Date.now(),
    lastUpdated: now,
    clearedAt: now
  };

  inMemoryDb = resetDb;
  saveDatabase(resetDb);

  // Clean any old legacy temporary registry file as well
  try {
    const tmpDir = process.env.TEMP || process.env.TMP || (process.platform === 'win32' ? 'C:\\Windows\\Temp' : '/tmp');
    const legacyPath = path.join(tmpDir, 'medibridge_auth_registry.json');
    if (fs.existsSync(legacyPath)) {
      fs.unlinkSync(legacyPath);
    }
  } catch {}

  return {
    success: true,
    clearedAt: now,
    message: 'All registered patient and hospital data has been cleared. Database is in clean registration state.'
  };
}

export function generatePatientId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `MB-2026-${code}`;
}

export function generateAbhaId(): string {
  const part1 = Math.floor(10 + Math.random() * 90);
  const part2 = Math.floor(1000 + Math.random() * 9000);
  const part3 = Math.floor(1000 + Math.random() * 9000);
  const part4 = Math.floor(1000 + Math.random() * 9000);
  return `${part1}-${part2}-${part3}-${part4}`;
}

export function findUserByIdentifier(identifier: string): User | undefined {
  const cleanId = String(identifier || '').trim().toLowerCase();
  if (!cleanId) return undefined;

  const db = getDatabase();
  const cleanDigits = cleanId.replace(/[^0-9]/g, '');
  const cleanAlphaNum = cleanId.replace(/[^a-z0-9]/g, '');

  return db.users.find(u => {
    const uEmail = (u.email || '').trim().toLowerCase();
    const uId = (u.id || '').trim().toLowerCase();
    const uPatId = (u.patientId || '').trim().toLowerCase();
    const uPatAlpha = uPatId.replace(/[^a-z0-9]/g, '');
    const uHospId = (u.hospitalId || '').trim().toLowerCase();
    const uPhone = (u.phone || '').replace(/[^0-9]/g, '');

    return (
      uEmail === cleanId ||
      uId === cleanId ||
      uPatId === cleanId ||
      uHospId === cleanId ||
      (cleanAlphaNum.length >= 6 && uPatAlpha === cleanAlphaNum) ||
      (cleanDigits.length >= 10 && uPhone.endsWith(cleanDigits.slice(-10)))
    );
  });
}

export function findPatientByIdentifier(identifier: string): PatientProfile | undefined {
  const cleanId = String(identifier || '').trim().toLowerCase();
  if (!cleanId) return undefined;

  const db = getDatabase();
  const cleanDigits = cleanId.replace(/[^0-9]/g, '');
  const cleanAlphaNum = cleanId.replace(/[^a-z0-9]/g, '');

  return db.patients.find(p => {
    const pId = (p.patientId || '').trim().toLowerCase();
    const pIdAlpha = pId.replace(/[^a-z0-9]/g, '');
    const pInternalId = (p.id || '').trim().toLowerCase();
    const pEmail = (p.email || '').trim().toLowerCase();
    const pAbha = (p.abhaId || '').trim().toLowerCase();
    const pAbhaAlpha = pAbha.replace(/[^a-z0-9]/g, '');
    const pPhone = (p.phone || p.emergencyContactPhone || '').replace(/[^0-9]/g, '');
    const queryCore = cleanAlphaNum.length >= 6 ? cleanAlphaNum.slice(-6) : cleanAlphaNum;
    const pCore = pIdAlpha.length >= 6 ? pIdAlpha.slice(-6) : pIdAlpha;

    return (
      pId === cleanId ||
      pInternalId === cleanId ||
      pEmail === cleanId ||
      pIdAlpha === cleanAlphaNum ||
      (queryCore.length >= 4 && queryCore === pCore) ||
      (cleanAlphaNum.length >= 4 && (pIdAlpha.endsWith(cleanAlphaNum) || cleanAlphaNum.endsWith(pIdAlpha))) ||
      (cleanAlphaNum.length >= 10 && pAbhaAlpha === cleanAlphaNum) ||
      (cleanDigits.length >= 10 && pPhone.endsWith(cleanDigits.slice(-10)))
    );
  });
}

export function saveClinicalSession(session: any): boolean {
  if (!session || !session.id) return false;
  const db = getDatabase();
  db.sessions = db.sessions.filter(s => s.id !== session.id);
  db.sessions.unshift(session);
  return saveDatabase(db);
}

export function getClinicalSessionsForPatient(patientId: string): any[] {
  if (!patientId) return [];
  const clean = patientId.trim().toLowerCase();
  const cleanAlpha = clean.replace(/[^a-z0-9]/g, '');
  const db = getDatabase();
  return db.sessions.filter(s => {
    const sId = (s.patientId || '').trim().toLowerCase();
    const sAlpha = sId.replace(/[^a-z0-9]/g, '');
    return sId === clean || sAlpha === cleanAlpha;
  });
}

export function saveMedicalDocument(document: any): boolean {
  if (!document || !document.id) return false;
  const db = getDatabase();
  db.documents = db.documents.filter(d => d.id !== document.id);
  db.documents.unshift(document);
  return saveDatabase(db);
}

export function getMedicalDocumentsForPatient(patientId: string): any[] {
  if (!patientId) return [];
  const clean = patientId.trim().toLowerCase();
  const cleanAlpha = clean.replace(/[^a-z0-9]/g, '');
  const db = getDatabase();
  return db.documents.filter(d => {
    const dId = (d.patientId || '').trim().toLowerCase();
    const dAlpha = dId.replace(/[^a-z0-9]/g, '');
    return dId === clean || dAlpha === cleanAlpha;
  });
}

export function saveAppointment(appointment: any): boolean {
  if (!appointment || !appointment.id) return false;
  const db = getDatabase();
  db.appointments = (db.appointments || []).filter(a => a.id !== appointment.id);
  db.appointments.unshift(appointment);
  return saveDatabase(db);
}

export function getAppointments(patientId?: string, hospitalId?: string): any[] {
  const db = getDatabase();
  let list = db.appointments || [];
  if (patientId) {
    const clean = patientId.trim().toLowerCase();
    const cleanAlpha = clean.replace(/[^a-z0-9]/g, '');
    list = list.filter(a => {
      const aId = (a.patientId || '').trim().toLowerCase();
      const aAlpha = aId.replace(/[^a-z0-9]/g, '');
      return aId === clean || aAlpha === cleanAlpha;
    });
  }
  if (hospitalId) {
    const cleanHosp = hospitalId.trim().toLowerCase();
    list = list.filter(a => (a.hospitalId || '').trim().toLowerCase() === cleanHosp);
  }
  return list;
}

export function updateAppointmentStatus(id: string, status: string, notes?: string): boolean {
  if (!id) return false;
  const db = getDatabase();
  const target = (db.appointments || []).find(a => a.id === id);
  if (target) {
    target.status = status;
    if (notes) target.notes = notes;
    return saveDatabase(db);
  }
  return false;
}

export function deleteAppointment(id: string): boolean {
  if (!id) return false;
  const db = getDatabase();
  db.appointments = (db.appointments || []).filter(a => a.id !== id);
  return saveDatabase(db);
}

export function saveEmergencyAlert(alert: any): boolean {
  if (!alert || !alert.id) return false;
  const db = getDatabase();
  db.emergencies = (db.emergencies || []).filter(e => e.id !== alert.id);
  db.emergencies.unshift(alert);
  return saveDatabase(db);
}

export function getEmergencyAlerts(patientId?: string): any[] {
  const db = getDatabase();
  let list = db.emergencies || [];
  if (patientId) {
    const clean = patientId.trim().toLowerCase();
    const cleanAlpha = clean.replace(/[^a-z0-9]/g, '');
    list = list.filter(e => {
      const eId = (e.patientId || '').trim().toLowerCase();
      const eAlpha = eId.replace(/[^a-z0-9]/g, '');
      return eId === clean || eAlpha === cleanAlpha;
    });
  }
  return list;
}

export function findHospitalByIdentifier(identifier: string): HospitalAccount | undefined {
  const cleanId = String(identifier || '').trim().toLowerCase();
  if (!cleanId) return undefined;

  const db = getDatabase();
  return db.hospitals.find(h => {
    const hId = (h.hospitalId || h.id || '').trim().toLowerCase();
    const hEmail = (h.email || '').trim().toLowerCase();
    const hReg = (h.registrationId || '').trim().toLowerCase();
    const hName = (h.hospitalName || '').trim().toLowerCase();

    return hId === cleanId || hEmail === cleanId || hReg === cleanId || hName === cleanId;
  });
}

/**
 * Stores or updates a 6-digit OTP verification code for an email
 */
export function setVerificationOtp(email: string, code: string, expiresMs = 10 * 60 * 1000): EmailVerificationRecord {
  const db = getDatabase();
  const cleanEmail = email.trim().toLowerCase();
  const record: EmailVerificationRecord = {
    email: cleanEmail,
    code: String(code).trim(),
    expiresAt: Date.now() + expiresMs,
    attempts: 0,
    createdAt: new Date().toISOString()
  };

  db.verificationCodes[cleanEmail] = record;
  saveDatabase(db);
  return record;
}

/**
 * Retrieves the active OTP record for an email
 */
export function getVerificationOtp(email: string): EmailVerificationRecord | undefined {
  const db = getDatabase();
  return db.verificationCodes[email.trim().toLowerCase()];
}

/**
 * Verifies an entered OTP code against the stored record
 */
export function verifyOtp(email: string, code: string): { valid: boolean; reason?: string } {
  const db = getDatabase();
  const cleanEmail = email.trim().toLowerCase();
  const cleanCode = String(code || '').trim();
  const record = db.verificationCodes[cleanEmail];

  if (!record) {
    return {
      valid: false,
      reason: 'No active verification code found for this email. Please request a new verification code.'
    };
  }

  if (Date.now() > record.expiresAt) {
    delete db.verificationCodes[cleanEmail];
    saveDatabase(db);
    return {
      valid: false,
      reason: 'The verification code has expired. Please request a new code.'
    };
  }

  if (record.attempts >= 5) {
    delete db.verificationCodes[cleanEmail];
    saveDatabase(db);
    return {
      valid: false,
      reason: 'Too many incorrect attempts. For security, please request a new verification code.'
    };
  }

  if (record.code !== cleanCode) {
    record.attempts += 1;
    saveDatabase(db);
    const remaining = 5 - record.attempts;
    return {
      valid: false,
      reason: `Incorrect verification code. Please check and try again (${remaining} attempt${remaining === 1 ? '' : 's'} remaining).`
    };
  }

  // OTP is correct! Remove used code
  delete db.verificationCodes[cleanEmail];

  // Mark user and patient profile as email verified
  const foundUser = db.users.find(u => (u.email || '').trim().toLowerCase() === cleanEmail);
  if (foundUser) {
    foundUser.isEmailVerified = true;
  }

  const foundPatient = db.patients.find(p => (p.email || '').trim().toLowerCase() === cleanEmail);
  if (foundPatient) {
    foundPatient.isEmailVerified = true;
  }

  saveDatabase(db);
  return { valid: true };
}

/**
 * Marks a patient's email verified directly (e.g. via direct verification)
 */
export function markEmailVerified(email: string): { user?: User; patient?: PatientProfile } {
  const db = getDatabase();
  const cleanEmail = email.trim().toLowerCase();

  const user = db.users.find(u => (u.email || '').trim().toLowerCase() === cleanEmail);
  if (user) {
    user.isEmailVerified = true;
  }

  const patient = db.patients.find(p => (p.email || '').trim().toLowerCase() === cleanEmail);
  if (patient) {
    patient.isEmailVerified = true;
  }

  saveDatabase(db);
  return { user, patient };
}
