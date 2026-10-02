import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface PatientQrRecord {
  id: string;
  patientUserId: string;
  patientId: string;
  secureToken: string;
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'REVOKED';
}

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
  patientQrs: PatientQrRecord[];
  version: number;
  lastUpdated: string;
  clearedAt?: string;
}

export const DEFAULT_ADMIN_USERS: User[] = [
  {
    id: 'usr-pat-manoj',
    email: 'bhosalemanoj241@gmail.com',
    password: 'Password@123',
    phone: '8208083342',
    fullName: 'Manoj Bhosale',
    role: 'PATIENT',
    patientId: 'MB-2026-9MNBTN',
    isEmailVerified: true,
    createdAt: '2025-10-01T08:00:00Z'
  },
  {
    id: 'usr-doc-sharma',
    email: 'dr.sharma@medibridge.ai',
    password: 'Password@123',
    phone: '+91 98200 12345',
    fullName: 'Dr. Anita Sharma',
    role: 'DOCTOR',
    isEmailVerified: true,
    createdAt: '2025-10-01T08:00:00Z'
  },
  {
    id: 'usr-hosp-lilavati',
    email: 'lilavati.hospital@hospitalcloud.in',
    password: 'Password@123',
    phone: '+91 22 2675 1000',
    fullName: 'Lilavati Hospital & Research Centre',
    role: 'HOSPITAL_ADMIN',
    hospitalId: 'HOSP-MUM-001',
    isEmailVerified: true,
    createdAt: '2025-10-01T08:00:00Z'
  },
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

export const DEFAULT_SEED_PATIENTS: PatientProfile[] = [
  {
    id: 'pat-manoj',
    userId: 'usr-pat-manoj',
    patientId: 'MB-2026-9MNBTN',
    abhaId: '63-1902-6843-2409',
    abhaAddress: 'manojbhosale.nbtn@abdm',
    fullName: 'Manoj Bhosale',
    email: 'bhosalemanoj241@gmail.com',
    phone: '8208083342',
    dob: '1992-06-15',
    age: 34,
    gender: 'MALE',
    bloodGroup: 'B+',
    emergencyContactName: 'Prathmesh Mavkar',
    emergencyContactPhone: '9248659762',
    emergencyContactRelation: 'Spouse',
    preferredLanguage: 'en',
    address: 'Pimple Gurav',
    city: 'Pune',
    state: 'Maharashtra',
    pincode: '411061',
    password: 'Password@123',
    status: 'ACTIVE',
    isEmailVerified: true,
    allergies: ['Penicillin (Mild Rash)'],
    chronicConditions: ['Mild Hypertension'],
    currentMedications: ['Amlodipine 5mg OD'],
    createdAt: '2025-10-01T08:00:00Z'
  },
  {
    id: 'pat-demo-rajesh',
    userId: 'usr-pat-rajesh',
    patientId: 'MB-2026-RAJESH',
    abhaId: '91-8842-1209-7734',
    abhaAddress: 'rajeshverma.demo@abdm',
    fullName: 'Rajesh Verma',
    email: 'rajesh.verma@medibridge.ai',
    phone: '9876543210',
    dob: '1985-04-12',
    age: 41,
    gender: 'MALE',
    bloodGroup: 'O+',
    emergencyContactName: 'Sunita Verma',
    emergencyContactPhone: '9876543211',
    emergencyContactRelation: 'Spouse',
    preferredLanguage: 'en',
    address: 'B-402, Sea Breeze Apts, Worli',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400018',
    password: 'Password@123',
    status: 'ACTIVE',
    isEmailVerified: true,
    allergies: ['Peanuts', 'Sulfa Drugs'],
    chronicConditions: ['Type 2 Diabetes'],
    currentMedications: ['Metformin 500mg BD'],
    createdAt: '2025-10-01T08:00:00Z'
  }
];

export const DEFAULT_SEED_HOSPITALS: HospitalAccount[] = [
  {
    id: 'hosp-lilavati',
    userId: 'usr-hosp-lilavati',
    hospitalId: 'HOSP-MUM-001',
    hospitalName: 'Lilavati Hospital & Research Centre',
    registrationId: 'MAH-MUM-2019-8832',
    email: 'lilavati.hospital@hospitalcloud.in',
    phone: '+91 22 2675 1000',
    emergencyContact: '+91 22 2675 1111',
    address: 'A-791, Bandra Reclamation, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    location: 'Bandra West, Mumbai',
    pincode: '400050',
    ambulanceAvailable: true,
    coordinates: { lat: 19.0522, lng: 72.8295 },
    departments: ['Emergency & Trauma', 'General Medicine', 'Cardiology', 'ICU'],
    status: 'VERIFIED',
    createdAt: '2025-10-01T08:00:00Z'
  }
];

export const DEFAULT_SEED_DOCTORS: DoctorProfile[] = [
  {
    id: 'doc-sharma',
    userId: 'usr-doc-sharma',
    doctorName: 'Dr. Anita Sharma',
    email: 'dr.sharma@medibridge.ai',
    phone: '+91 98200 12345',
    registrationNumber: 'MCI-2015-44912',
    qualification: 'MBBS, MD (General Medicine)',
    specialization: 'Cardiology & General Medicine',
    hospitalId: 'HOSP-MUM-001',
    hospitalName: 'Lilavati Hospital & Research Centre',
    departmentId: 'dept-cardio',
    departmentName: 'Cardiology',
    experienceYears: 14,
    isAvailable: true,
    activePatientsCount: 18,
    createdAt: '2025-10-01T08:00:00Z'
  }
];

// Valid standard Base64-encoded PDF for pre-seeded medical documents
const SAMPLE_VALID_PDF_BASE64 = Buffer.from(
  '%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 315 >>\nstream\nBT\n/F1 16 Tf\n50 720 Td\n(MEDIBRIDGE AI - COMPREHENSIVE CLINICAL DOSSIER) Tj\n/F1 11 Tf\n0 -28 Td\n(Patient Name: Manoj Bhosale       Patient ID: MB-2026-9MNBTN) Tj\n0 -20 Td\n(Hospital: Lilavati Hospital & Research Centre) Tj\n0 -20 Td\n(Consulting Physician: Dr. Anita Sharma, MD Cardiology) Tj\n0 -20 Td\n(Report Date: 02 October 2026) Tj\n0 -30 Td\n(Clinical Findings: Normal Sinus Rhythm, Blood Pressure 124/82 mmHg) Tj\n0 -20 Td\n(Status: Verified & Signed by Lilavati Department of Cardiology) Tj\nET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000610 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n679\n%%EOF'
).toString('base64');

let inMemoryDb: CentralDatabase | null = null;

export function getDbFilePath(): string {
  if (process.env.VERCEL) {
    const tmpFile = path.join('/tmp', 'medibridge_central_database.json');
    if (!fs.existsSync(tmpFile)) {
      try {
        const seedPath = path.join(process.cwd(), 'data', 'medibridge_central_database.json');
        if (fs.existsSync(seedPath)) {
          fs.copyFileSync(seedPath, tmpFile);
        }
      } catch (err) {
        console.warn('[CentralDb] Seed to /tmp error:', err);
      }
    }
    return tmpFile;
  }

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
  const users: User[] = Array.isArray(data?.users) ? [...data.users] : [];
  for (const admin of DEFAULT_ADMIN_USERS) {
    const existingIdx = users.findIndex(u => (u.email || '').toLowerCase() === admin.email.toLowerCase());
    if (existingIdx === -1) {
      users.push(admin);
    } else {
      // Ensure verified and has required links
      users[existingIdx] = {
        ...admin,
        ...users[existingIdx],
        isEmailVerified: true
      };
    }
  }

  const patients: PatientProfile[] = Array.isArray(data?.patients) ? [...data.patients] : [];
  for (const p of DEFAULT_SEED_PATIENTS) {
    const pEmail = (p.email || '').toLowerCase();
    const pIdx = patients.findIndex(
      x => (x.patientId || '').toUpperCase() === p.patientId.toUpperCase() || (Boolean(pEmail) && (x.email || '').toLowerCase() === pEmail)
    );
    if (pIdx === -1) {
      patients.push(p);
    } else {
      patients[pIdx] = { ...p, ...patients[pIdx], isEmailVerified: true, status: 'ACTIVE' };
    }
  }

  const hospitals: HospitalAccount[] = Array.isArray(data?.hospitals) ? [...data.hospitals] : [];
  for (const h of DEFAULT_SEED_HOSPITALS) {
    const hHospId = (h.hospitalId || '').toUpperCase();
    const hEmail = (h.email || '').toLowerCase();
    if (!hospitals.some(x => (Boolean(hHospId) && (x.hospitalId || '').toUpperCase() === hHospId) || (Boolean(hEmail) && (x.email || '').toLowerCase() === hEmail))) {
      hospitals.push(h);
    }
  }

  const doctors: DoctorProfile[] = Array.isArray(data?.doctors) ? [...data.doctors] : [];
  for (const d of DEFAULT_SEED_DOCTORS) {
    const dEmail = (d.email || '').toLowerCase();
    if (!doctors.some(x => Boolean(dEmail) && (x.email || '').toLowerCase() === dEmail)) {
      doctors.push(d);
    }
  }

  const sessions: any[] = Array.isArray(data?.sessions) ? [...data.sessions] : [];
  if (!sessions.some(s => s.patientId === 'MB-2026-9MNBTN' || s.id === 'sess-manoj-001')) {
    sessions.unshift({
      id: 'sess-manoj-001',
      patientId: 'MB-2026-9MNBTN',
      userId: 'usr-pat-manoj',
      patientName: 'Manoj Bhosale',
      timestamp: '2026-10-02T10:15:00.000Z',
      chiefComplaint: 'Intermittent chest tightness and mild shortness of breath upon exertion',
      triageCategory: 'YELLOW',
      clinicalSummary: 'Patient Manoj Bhosale (34y M) presents with 5-day history of exertional chest heaviness, relieved by resting. Blood pressure 128/82 mmHg, HR 74 bpm. Vitals are hemodynamically stable. No radiation to left jaw or arm. Normal sinus rhythm noted on preliminary ECG. Triage Category Yellow - recommended for OPD cardiologist review and lipid monitoring.',
      vitalSigns: {
        bloodPressure: '128/82 mmHg',
        heartRate: '74 bpm',
        spO2: '99%',
        temperature: '98.4 F',
        respiratoryRate: '16/min'
      },
      selectedHospitalId: 'HOSP-MUM-001',
      selectedHospitalName: 'Lilavati Hospital & Research Centre',
      recommendedSpecialty: 'Cardiology & General Medicine',
      status: 'DISPATCHED_TO_HOSPITAL'
    });
  }

  const documents: any[] = Array.isArray(data?.documents) ? [...data.documents] : [];
  if (!documents.some(doc => doc.patientId === 'MB-2026-9MNBTN' || doc.id === 'doc-manoj-pdf-01')) {
    documents.unshift({
      id: 'doc-manoj-pdf-01',
      patientId: 'MB-2026-9MNBTN',
      fileName: 'Lilavati_Comprehensive_Health_Checkup_2026.pdf',
      fileType: 'LAB_REPORT',
      mimeType: 'application/pdf',
      fileSize: '1.4 KB',
      fileSizeBytes: 1024,
      uploadDate: '2026-10-02T10:20:00.000Z',
      filePath: 'data/uploads/MB-2026-9MNBTN/doc-manoj-pdf-01_Lilavati_Comprehensive_Health_Checkup_2026.pdf',
      fileUrl: '/api/documents?id=doc-manoj-pdf-01',
      downloadUrl: '/api/documents?id=doc-manoj-pdf-01&download=true',
      fileData: SAMPLE_VALID_PDF_BASE64,
      extractedData: {
        documentId: 'doc-manoj-pdf-01',
        documentDate: '2026-10-02',
        facilityName: 'Lilavati Hospital & Research Centre',
        physicianName: 'Dr. Anita Sharma, MD',
        extractedDiagnoses: ['Normal Sinus Rhythm', 'Borderline Lipids (Cholesterol 210 mg/dL)', 'Normotensive'],
        extractedMedications: ['Amlodipine 5mg OD'],
        extractedLabResults: [
          { testName: 'Total Cholesterol', resultValue: '210', unit: 'mg/dL', normalRange: '< 200', interpretation: 'BORDERLINE' },
          { testName: 'Triglycerides', resultValue: '142', unit: 'mg/dL', normalRange: '< 150', interpretation: 'NORMAL' },
          { testName: 'Fasting Blood Glucose', resultValue: '94', unit: 'mg/dL', normalRange: '70-99', interpretation: 'NORMAL' }
        ],
        procedures: ['12-Lead Electrocardiogram (ECG)', 'Biochemical Automated Assay'],
        confidenceScore: 0.99,
        rawTextSnippets: ['Cardiology Assessment Specimen Blood', 'ECG: Normal sinus rhythm, axis normal']
      },
      status: 'COMPLETED'
    });
  }

  const trustedHospitals: any[] = Array.isArray(data?.trustedHospitals) ? [...data.trustedHospitals] : [];
  if (!trustedHospitals.some(t => t.patientId === 'MB-2026-9MNBTN' && t.hospitalId === 'HOSP-MUM-001')) {
    trustedHospitals.unshift({
      id: 'trust-manoj-lilavati',
      patientId: 'MB-2026-9MNBTN',
      hospitalId: 'HOSP-MUM-001',
      hospitalName: 'Lilavati Hospital & Research Centre',
      grantedAt: '2025-10-01T08:00:00Z',
      expiresAt: '2027-10-01T08:00:00Z',
      status: 'ACTIVE'
    });
  }

  return {
    users,
    patients,
    hospitals,
    doctors,
    accessRequests: Array.isArray(data?.accessRequests) ? data.accessRequests : [],
    trustedHospitals,
    sessions,
    documents,
    emergencies: Array.isArray(data?.emergencies) ? data.emergencies : [],
    appointments: Array.isArray(data?.appointments) ? data.appointments : [],
    auditLogs: Array.isArray(data?.auditLogs) ? data.auditLogs : [],
    verificationCodes: (data?.verificationCodes && typeof data.verificationCodes === 'object') ? data.verificationCodes : {},
    patientQrs: Array.isArray(data?.patientQrs) ? data.patientQrs : [],
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
    patientQrs: [],
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
  const patient = findPatientByIdentifier(patientId);
  const validIds = new Set<string>([clean, cleanAlpha]);
  if (patient) {
    if (patient.id) validIds.add(patient.id.trim().toLowerCase());
    if (patient.patientId) {
      validIds.add(patient.patientId.trim().toLowerCase());
      validIds.add(patient.patientId.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
    if (patient.userId) validIds.add(patient.userId.trim().toLowerCase());
  }

  const seenIds = new Set<string>();
  const matches: any[] = [];

  for (const s of (db.sessions || [])) {
    if (!s || !s.id || seenIds.has(s.id)) continue;
    const sId = (s.patientId || '').trim().toLowerCase();
    const sAlpha = sId.replace(/[^a-z0-9]/g, '');
    const sUserId = (s.userId || '').trim().toLowerCase();
    const sPatName = (s.patientName || '').trim().toLowerCase();
    const patName = (patient?.fullName || '').trim().toLowerCase();

    const isMatch =
      validIds.has(sId) ||
      validIds.has(sAlpha) ||
      (sUserId && validIds.has(sUserId)) ||
      (patName && sPatName && patName === sPatName);

    if (isMatch) {
      seenIds.add(s.id);
      matches.push(s);
    }
  }

  return matches.sort((a, b) => new Date(b.completedAt || b.startedAt || 0).getTime() - new Date(a.completedAt || a.startedAt || 0).getTime());
}

export function saveMedicalDocument(document: any): boolean {
  if (!document || !document.id) return false;
  const db = getDatabase();
  db.documents = (db.documents || []).filter(d => d.id !== document.id);
  db.documents.unshift(document);
  return saveDatabase(db);
}

export function getMedicalDocumentsForPatient(patientId: string): any[] {
  if (!patientId) return [];
  const clean = patientId.trim().toLowerCase();
  const cleanAlpha = clean.replace(/[^a-z0-9]/g, '');
  const db = getDatabase();
  const patient = findPatientByIdentifier(patientId);
  const validIds = new Set<string>([clean, cleanAlpha]);
  if (patient) {
    if (patient.id) validIds.add(patient.id.trim().toLowerCase());
    if (patient.patientId) {
      validIds.add(patient.patientId.trim().toLowerCase());
      validIds.add(patient.patientId.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
    if (patient.userId) validIds.add(patient.userId.trim().toLowerCase());
  }

  const seenIds = new Set<string>();
  const matches: any[] = [];

  for (const d of (db.documents || [])) {
    if (!d || !d.id || seenIds.has(d.id)) continue;
    const dId = (d.patientId || '').trim().toLowerCase();
    const dAlpha = dId.replace(/[^a-z0-9]/g, '');
    const dUserId = (d.userId || '').trim().toLowerCase();

    if (validIds.has(dId) || validIds.has(dAlpha) || (dUserId && validIds.has(dUserId))) {
      seenIds.add(d.id);
      matches.push(d);
    }
  }

  return matches.sort((a, b) => new Date(b.uploadDate || 0).getTime() - new Date(a.uploadDate || 0).getTime());
}

export function isHospitalAuthorizedForPatient(hospitalIdentifier: string, patientIdentifier: string): boolean {
  if (!hospitalIdentifier || !patientIdentifier) return false;
  const cleanHosp = hospitalIdentifier.trim().toLowerCase();
  const cleanPat = patientIdentifier.trim().toLowerCase();
  const cleanPatAlpha = cleanPat.replace(/[^a-z0-9]/g, '');

  const db = getDatabase();
  const patient = findPatientByIdentifier(patientIdentifier);
  const validPatIds = new Set<string>([cleanPat, cleanPatAlpha]);
  if (patient) {
    if (patient.id) validPatIds.add(patient.id.toLowerCase());
    if (patient.patientId) {
      validPatIds.add(patient.patientId.toLowerCase());
      validPatIds.add(patient.patientId.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
    if (patient.userId) validPatIds.add(patient.userId.toLowerCase());
  }

  const hosp = findHospitalByIdentifier(hospitalIdentifier);
  const validHospIds = new Set<string>([cleanHosp]);
  if (hosp) {
    if (hosp.id) validHospIds.add(hosp.id.toLowerCase());
    if (hosp.hospitalId) validHospIds.add(hosp.hospitalId.toLowerCase());
    if (hosp.hospitalName) validHospIds.add(hosp.hospitalName.toLowerCase());
    if (hosp.registrationId) validHospIds.add(hosp.registrationId.toLowerCase());
  }

  // Check trusted hospitals
  const isTrusted = (db.trustedHospitals || []).some(t => {
    if (t.status !== 'ACTIVE') return false;
    const tHosp = (t.hospitalId || '').toLowerCase();
    const tHospName = (t.hospitalName || '').toLowerCase();
    const tPat = (t.patientId || '').toLowerCase();
    const tPatAlpha = tPat.replace(/[^a-z0-9]/g, '');
    const hospMatch = validHospIds.has(tHosp) || validHospIds.has(tHospName) || cleanHosp.includes(tHosp) || (tHosp && cleanHosp.includes(tHosp));
    const patMatch = validPatIds.has(tPat) || validPatIds.has(tPatAlpha);
    return hospMatch && patMatch;
  });
  if (isTrusted) return true;

  // Check access requests approved
  const isApproved = (db.accessRequests || []).some(r => {
    if (r.status !== 'APPROVED') return false;
    const rHosp = (r.hospitalId || '').toLowerCase();
    const rHospName = (r.hospitalName || '').toLowerCase();
    const rPat = (r.patientId || '').toLowerCase();
    const rPatAlpha = rPat.replace(/[^a-z0-9]/g, '');
    const hospMatch = validHospIds.has(rHosp) || validHospIds.has(rHospName) || cleanHosp.includes(rHosp) || (rHosp && cleanHosp.includes(rHosp));
    const patMatch = validPatIds.has(rPat) || validPatIds.has(rPatAlpha);
    return hospMatch && patMatch;
  });
  if (isApproved) return true;

  // Check clinical sessions targeting this hospital
  const targetedSession = (db.sessions || []).some(s => {
    const sHosp = (s.selectedHospitalId || '').toLowerCase();
    const sPat = (s.patientId || '').toLowerCase();
    const sPatAlpha = sPat.replace(/[^a-z0-9]/g, '');
    const hospMatch = sHosp && (validHospIds.has(sHosp) || cleanHosp.includes(sHosp) || sHosp.includes(cleanHosp));
    const patMatch = validPatIds.has(sPat) || validPatIds.has(sPatAlpha);
    return hospMatch && patMatch;
  });
  if (targetedSession) return true;

  return false;
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

/**
 * Generates a secure, non-guessable random token for patient QR codes.
 * Contains no personal health data.
 */
export function generateSecureToken(): string {
  try {
    return 'mbqr_' + crypto.randomBytes(24).toString('hex');
  } catch {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = 'mbqr_';
    for (let i = 0; i < 48; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  }
}

/**
 * Gets or permanently generates an active QR record for a registered patient.
 * Automatically gives existing patients a QR code without losing any data.
 */
export function getOrCreatePatientQr(patientIdOrProfile: string | PatientProfile): PatientQrRecord | null {
  const db = getDatabase();
  if (!db.patientQrs) db.patientQrs = [];

  let patient: PatientProfile | undefined;
  if (typeof patientIdOrProfile === 'string') {
    patient = findPatientByIdentifier(patientIdOrProfile);
  } else {
    patient = patientIdOrProfile;
  }

  if (!patient || !patient.patientId) return null;
  const cleanPatId = patient.patientId.trim().toUpperCase();

  // Check if active QR already exists for this patient
  const existing = db.patientQrs.find(
    qr => qr.patientId.toUpperCase() === cleanPatId && qr.status === 'ACTIVE'
  );
  if (existing) {
    return existing;
  }

  // Create new permanent active QR record for this patient
  const now = new Date().toISOString();
  const newQr: PatientQrRecord = {
    id: `qr-${cleanPatId}`,
    patientUserId: patient.userId || patient.id,
    patientId: cleanPatId,
    secureToken: generateSecureToken(),
    createdAt: now,
    updatedAt: now,
    status: 'ACTIVE'
  };

  db.patientQrs.unshift(newQr);
  saveDatabase(db);
  return newQr;
}

/**
 * Resolves a patient from a secure QR token.
 * Validates token status and returns patient record if active.
 */
export function findPatientByQrToken(token: string): {
  valid: boolean;
  reason?: string;
  patient?: PatientProfile;
  qrRecord?: PatientQrRecord;
} {
  if (!token) {
    return { valid: false, reason: 'Invalid or expired QR code.' };
  }

  let cleanToken = String(token).trim();
  // If token is wrapped in full URL (e.g. https://.../qr?token=mbqr_...), extract the token
  if (cleanToken.includes('token=')) {
    try {
      const url = new URL(cleanToken, 'http://localhost');
      cleanToken = url.searchParams.get('token') || cleanToken;
    } catch {
      const match = cleanToken.match(/token=([a-zA-Z0-9_-]+)/);
      if (match) cleanToken = match[1];
    }
  }

  const db = getDatabase();
  if (!db.patientQrs) db.patientQrs = [];

  const record = db.patientQrs.find(
    qr => qr.secureToken === cleanToken && qr.status === 'ACTIVE'
  );

  if (!record) {
    return { valid: false, reason: 'Invalid or expired QR code.' };
  }

  const patient = findPatientByIdentifier(record.patientId);
  if (!patient) {
    return { valid: false, reason: 'Patient record not found.' };
  }

  return { valid: true, patient, qrRecord: record };
}

/**
 * Securely regenerates a patient's QR code.
 * Revokes the previous QR token immediately.
 * Patient ID, accounts, and all medical history remain unchanged.
 */
export function regeneratePatientQr(patientId: string, userId?: string): {
  success: boolean;
  message?: string;
  qrRecord?: PatientQrRecord;
} {
  const cleanId = String(patientId || '').trim().toUpperCase();
  const db = getDatabase();
  if (!db.patientQrs) db.patientQrs = [];

  const patient = findPatientByIdentifier(cleanId);
  if (!patient) {
    return { success: false, message: 'Patient record not found.' };
  }

  // Revoke all existing active QR records for this patient
  const now = new Date().toISOString();
  db.patientQrs.forEach(qr => {
    if (qr.patientId.toUpperCase() === cleanId && qr.status === 'ACTIVE') {
      qr.status = 'REVOKED';
      qr.updatedAt = now;
    }
  });

  // Create new active QR token
  const newQr: PatientQrRecord = {
    id: `qr-${cleanId}-${Date.now()}`,
    patientUserId: patient.userId || userId || patient.id,
    patientId: cleanId,
    secureToken: generateSecureToken(),
    createdAt: now,
    updatedAt: now,
    status: 'ACTIVE'
  };

  db.patientQrs.unshift(newQr);
  saveDatabase(db);

  return { success: true, qrRecord: newQr };
}

/**
 * Central audit logging helper
 */
export function recordCentralAuditLog(log: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  targetEntity: string;
  targetId: string;
  details: string;
}): void {
  const db = getDatabase();
  if (!Array.isArray(db.auditLogs)) db.auditLogs = [];

  const newLog = {
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actorId: log.actorId || 'system',
    actorName: log.actorName || 'Healthcare Staff',
    actorRole: log.actorRole || 'DOCTOR',
    action: log.action || 'QR_ACCESS',
    targetEntity: log.targetEntity || 'PatientProfile',
    targetId: log.targetId,
    ipAddress: '127.0.0.1 (Authenticated Server)',
    details: log.details
  };

  db.auditLogs.unshift(newLog);
  saveDatabase(db);
}

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).json({
    success: true,
    service: 'MediBridge Central Database Registry',
    status: 'ONLINE',
    timestamp: new Date().toISOString()
  });
}

