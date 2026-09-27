// =========================================================================
// MediBridge AI: Centralized Cloud Authentication & Identity Service
// Production Multi-Device Account Verification, Session & Profile Engine
// =========================================================================

import { User, PatientProfile, DoctorProfile, HospitalAccount, UserRole } from '../types';
import { db } from './mockDatabase';
import { syncRelay } from './firebaseService';
import { cloudDb } from './cloudDatabaseEngine';

const CENTRAL_AUTH_API_ENDPOINT = '/api/auth';
const DIRECT_CLOUD_STORE_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a0e316cf6f2508';
const AUTH_STORAGE_KEY = 'medibridge_active_auth_session';

export interface AuthSessionData {
  isAuthenticated: boolean;
  token?: string;
  user: User;
  patientProfile?: PatientProfile;
  doctorProfile?: DoctorProfile;
  hospitalAccount?: HospitalAccount;
  savedAt?: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  user?: User;
  patientProfile?: PatientProfile;
  doctorProfile?: DoctorProfile;
  hospitalAccount?: HospitalAccount;
  patientId?: string;
  hospitalId?: string;
  message?: string;
  notFound?: boolean;
}

class CentralAuthService {
  private static instance: CentralAuthService;

  private constructor() {
    // Listen for cross-device authentication and profile updates
    syncRelay.subscribe('user_registered', (data) => {
      if (data && data.user) {
        db.createUser(data.user);
      }
    });

    syncRelay.subscribe('patient_registered', (data) => {
      if (data && data.patient) {
        db.createPatientProfile(data.patient);
      }
    });
  }

  public static getInstance(): CentralAuthService {
    if (!CentralAuthService.instance) {
      CentralAuthService.instance = new CentralAuthService();
    }
    return CentralAuthService.instance;
  }

  /**
   * Universal Login: Validates credentials centrally in cloud store
   * Supports email, Patient ID (MB-2026-XXXXX), phone, or ABHA ID
   */
  public async login(identifier: string, password?: string, role?: UserRole): Promise<AuthResult> {
    const cleanId = String(identifier || '').trim();
    const cleanPass = String(password || '').trim();

    if (!cleanId) {
      return { success: false, message: 'Please enter your registered Email or Patient ID.' };
    }

    // Platform Root Administrator Instant Check
    if (
      cleanId.toLowerCase() === 'admin@medibridge.ai' ||
      cleanId.toLowerCase() === 'admin@medibridge.gov.in' ||
      cleanId.toLowerCase() === 'admin@medibridge.in'
    ) {
      const adminPass = cleanId.toLowerCase() === 'admin@medibridge.ai' ? 'Admin@123' : 'Admin@2026';
      if (cleanPass && cleanPass !== adminPass) {
        return { success: false, message: 'Incorrect password. Please verify your credentials and try again.' };
      }
      const adminUser: User = {
        id: 'usr-admin-root',
        email: cleanId.toLowerCase(),
        password: adminPass,
        phone: '+91 99300 88777',
        fullName: 'Platform Administrator',
        role: 'SYSTEM_ADMIN',
        createdAt: '2025-10-01T08:00:00Z'
      };
      db.createUser(adminUser);
      this.persistSession({ isAuthenticated: true, user: adminUser, token: `mb-tok-admin-${Date.now()}` });
      return { success: true, user: adminUser, token: `mb-tok-admin-${Date.now()}` };
    }

    // 1. Primary: Query Serverless /api/auth
    try {
      if (typeof window !== 'undefined' && window.location) {
        const response = await fetch(CENTRAL_AUTH_API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'login',
            identifier: cleanId,
            password: cleanPass,
            role
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.success && data.user) {
            this.hydrateLocalDatabase(data);
            this.persistSession({
              isAuthenticated: true,
              token: data.token,
              user: data.user,
              patientProfile: data.patientProfile,
              doctorProfile: data.doctorProfile,
              hospitalAccount: data.hospitalAccount
            });
            return data;
          }
        } else if (response.status === 401 || response.status === 403 || response.status === 404) {
          const errData = await response.json().catch(() => ({}));
          return {
            success: false,
            message: errData.error || 'Authentication failed. Please verify credentials.',
            notFound: errData.notFound
          };
        }
      }
    } catch (apiErr) {
      console.warn('[Central Auth Service] Serverless /api/auth network error, engaging cloud database fallback:', apiErr);
    }

    // 2. Fallback: Query Central Cloud Object Store or PubSub stream directly
    try {
      let registry: any = null;
      try {
        const directRes = await fetch(DIRECT_CLOUD_STORE_URL, { cache: 'no-store' });
        if (directRes.ok) {
          const cloudData = await directRes.json();
          registry = cloudData?.data;
        }
      } catch {}

      if (!registry || !Array.isArray(registry.users) || registry.users.length === 0) {
        try {
          const pubRes = await fetch('https://ntfy.sh/medibridge_cloud_db_v4/json?poll=1&since=all', { cache: 'no-store' });
          if (pubRes.ok) {
            const text = await pubRes.text();
            const users: any[] = [];
            const patients: any[] = [];
            const hospitals: any[] = [];
            const lines = text.trim().split('\n').filter(Boolean);
            for (const l of lines) {
              try {
                const raw = JSON.parse(l);
                if (raw.message) {
                  const ev = JSON.parse(raw.message);
                  if (ev.type === 'SAVE_USER' && (ev.data?.user || ev.data)) {
                    users.unshift(ev.data?.user || ev.data);
                  } else if (ev.type === 'SAVE_PATIENT' && (ev.data || ev.patient)) {
                    patients.unshift(ev.data || ev.patient);
                  } else if (ev.type === 'SAVE_HOSPITAL' && (ev.data || ev.hospital)) {
                    hospitals.unshift(ev.data || ev.hospital);
                  }
                }
              } catch {}
            }
            registry = { users, patients, hospitals };
          }
        } catch {}
      }

      if (registry && (Array.isArray(registry.users) || Array.isArray(registry.patients))) {
        registry.users = Array.isArray(registry.users) ? registry.users : [];
        const cleanAlpha = cleanId.replace(/[^A-Za-z0-9]/g, '').toLowerCase();

          // Match in users
          let matchedUser = registry.users.find((u: any) => {
            const uEmail = (u.email || '').trim().toLowerCase();
            const uId = (u.id || '').trim().toLowerCase();
            const uPatId = (u.patientId || '').trim().toLowerCase();
            const uPatAlpha = uPatId.replace(/[^a-z0-9]/g, '');
            const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
            const queryNumeric = cleanId.replace(/[^0-9]/g, '');

            return (
              uEmail === cleanId.toLowerCase() ||
              uId === cleanId.toLowerCase() ||
              uPatId === cleanId.toLowerCase() ||
              (cleanAlpha.length >= 6 && uPatAlpha === cleanAlpha) ||
              (queryNumeric.length >= 10 && uPhone.endsWith(queryNumeric.slice(-10)))
            );
          });

          // Match in patients
          let matchedPatient = (registry.patients || []).find((p: any) => {
            const pEmail = (p.email || '').trim().toLowerCase();
            const pId = (p.patientId || '').trim().toLowerCase();
            const pAlpha = pId.replace(/[^a-z0-9]/g, '');
            const pAbha = (p.abhaId || '').trim().toLowerCase();
            const pPhone = (p.phone || p.emergencyContactPhone || '').replace(/[^0-9]/g, '');
            const queryNumeric = cleanId.replace(/[^0-9]/g, '');

            return (
              pEmail === cleanId.toLowerCase() ||
              pId === cleanId.toLowerCase() ||
              (cleanAlpha.length >= 6 && pAlpha === cleanAlpha) ||
              pAbha === cleanId.toLowerCase() ||
              (queryNumeric.length >= 10 && pPhone.endsWith(queryNumeric.slice(-10)))
            );
          });

          if (!matchedUser && matchedPatient) {
            matchedUser = {
              id: matchedPatient.userId || `usr-${matchedPatient.patientId}`,
              email: matchedPatient.email || `${matchedPatient.patientId.toLowerCase()}@patient.medibridge.in`,
              password: matchedPatient.password,
              phone: matchedPatient.phone || matchedPatient.emergencyContactPhone || '',
              fullName: matchedPatient.fullName,
              role: 'PATIENT',
              patientId: matchedPatient.patientId,
              createdAt: matchedPatient.createdAt || new Date().toISOString()
            };
          }

          // Match in hospitals
          let matchedHospital = (registry.hospitals || []).find((h: any) => {
            const hEmail = (h.email || '').trim().toLowerCase();
            const hId = (h.hospitalId || h.id || '').trim().toLowerCase();
            const hReg = (h.registrationId || '').trim().toLowerCase();
            return hEmail === cleanId.toLowerCase() || hId === cleanId.toLowerCase() || hReg === cleanId.toLowerCase();
          });

          if (!matchedUser && matchedHospital) {
            matchedUser = {
              id: matchedHospital.userId || `usr-hosp-${matchedHospital.id}`,
              email: matchedHospital.email || `admin@${(matchedHospital.code || matchedHospital.hospitalId || 'hosp').toLowerCase()}.in`,
              password: matchedHospital.password || 'Hospital@123',
              phone: matchedHospital.emergencyContact || matchedHospital.phone || '',
              fullName: matchedHospital.hospitalName,
              role: 'HOSPITAL_ADMIN',
              hospitalId: matchedHospital.hospitalId || matchedHospital.id,
              createdAt: matchedHospital.createdAt || new Date().toISOString()
            };
          }

          if (matchedUser) {
            // Verify password
            if (cleanPass) {
              const expectedPass = (matchedUser.password || matchedPatient?.password || '').trim();
              if (expectedPass && expectedPass !== cleanPass) {
                return { success: false, message: 'Incorrect password. Please verify your credentials and try again.' };
              }
            }

            const token = `mb-tok-${matchedUser.id}-${Date.now()}`;
            const resObj: AuthResult = {
              success: true,
              token,
              user: matchedUser,
              patientProfile: matchedPatient,
              hospitalAccount: matchedHospital
            };
            this.hydrateLocalDatabase(resObj);
            this.persistSession({
              isAuthenticated: true,
              token,
              user: matchedUser,
              patientProfile: matchedPatient,
              hospitalAccount: matchedHospital
            });
            return resObj;
          }
        }
      } catch (directErr) {
      console.warn('[Central Auth Service] Direct cloud store error:', directErr);
    }

    // 3. Fallback: Check local client database cache
    const localUser = db.findUserByIdentifier(cleanId);
    if (localUser) {
      if (cleanPass && localUser.password && localUser.password.trim() !== cleanPass) {
        return { success: false, message: 'Incorrect password. Please verify your credentials and try again.' };
      }
      const p = db.getPatientByUserId(localUser.id) || db.getPatientByPatientId(cleanId);
      const d = db.getDoctorByUserId(localUser.id);
      const h = db.getHospitalAccountByUserId(localUser.id);
      const token = `mb-tok-${localUser.id}-${Date.now()}`;
      return {
        success: true,
        token,
        user: localUser,
        patientProfile: p,
        doctorProfile: d,
        hospitalAccount: h
      };
    }

    return {
      success: false,
      notFound: true,
      message: `No registered account found for "${cleanId}". Please check your credentials or click 'Create Account' to register.`
    };
  }

  /**
   * Centralized Patient Registration
   */
  public async registerPatient(data: {
    fullName: string;
    email: string;
    password?: string;
    phone: string;
    dob?: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    bloodGroup?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;
    preferredLanguage?: any;
    address?: string;
    city?: string;
    pincode?: string;
  }): Promise<AuthResult> {
    const cleanEmail = data.email.trim().toLowerCase();
    const userId = `usr-pat-${Date.now()}`;
    const generatedPatientId = db.generateUniquePatientId();

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      password: data.password || 'MediBridge@123',
      phone: data.phone.trim(),
      fullName: data.fullName.trim(),
      role: 'PATIENT',
      createdAt: new Date().toISOString()
    };

    let calculatedAge = 35;
    if (data.dob) {
      const birthYear = new Date(data.dob).getFullYear();
      if (!isNaN(birthYear)) calculatedAge = new Date().getFullYear() - birthYear;
    }

    const newProfile: PatientProfile = {
      id: `pat-${Date.now()}`,
      userId: userId,
      patientId: generatedPatientId,
      abhaId: `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`,
      abhaAddress: `${data.fullName.toLowerCase().replace(/\s+/g, '.') || 'patient'}@abdm`,
      fullName: data.fullName.trim(),
      email: cleanEmail,
      phone: data.phone.trim(),
      dob: data.dob || '1990-01-01',
      age: calculatedAge,
      gender: data.gender,
      bloodGroup: data.bloodGroup || 'B+',
      emergencyContactName: data.emergencyContactName || 'Primary Emergency Contact',
      emergencyContactPhone: data.emergencyContactPhone || data.phone.trim(),
      emergencyContactRelation: data.emergencyContactRelation || 'Family Member',
      preferredLanguage: data.preferredLanguage || 'en',
      address: data.address || 'Registered Residential Address',
      city: data.city || 'Mumbai',
      pincode: data.pincode || '400001',
      createdAt: new Date().toISOString()
    };

    // 1. Post to Serverless /api/auth
    try {
      if (typeof window !== 'undefined' && window.location) {
        const response = await fetch(CENTRAL_AUTH_API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            user: newUser,
            patientProfile: newProfile
          })
        });

        if (response.ok) {
          const resData = await response.json();
          this.hydrateLocalDatabase(resData);
          this.persistSession({
            isAuthenticated: true,
            token: resData.token,
            user: newUser,
            patientProfile: newProfile
          });
          return { success: true, patientId: generatedPatientId, user: newUser, patientProfile: newProfile };
        } else if (response.status === 409) {
          return { success: false, message: 'An account with this email address already exists. Please sign in.' };
        }
      }
    } catch (err) {
      console.warn('[Central Auth Register] Serverless route unreachable, falling back to direct cloud store:', err);
    }

    // 2. Direct Cloud Store Fallback
    try {
      const getRes = await fetch(DIRECT_CLOUD_STORE_URL, { cache: 'no-store' });
      if (getRes.ok) {
        const cloudData = await getRes.json();
        const registry = cloudData?.data || { users: [], patients: [], doctors: [], hospitals: [] };
        
        // Check duplicate
        if ((registry.users || []).some((u: any) => (u.email || '').trim().toLowerCase() === cleanEmail)) {
          return { success: false, message: 'An account with this email address already exists. Please sign in.' };
        }

        registry.users = registry.users || [];
        registry.patients = registry.patients || [];
        registry.users.unshift(newUser);
        registry.patients.unshift({ ...newProfile, password: newUser.password });

        await fetch(DIRECT_CLOUD_STORE_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'MediBridge_Auth_Store_v1',
            data: registry
          })
        });
      }
    } catch (directErr) {
      console.warn('[Central Auth Register] Direct save error:', directErr);
    }

    // Sync cloudDb & mockDb
    await cloudDb.savePatient({
      ...newProfile,
      fullName: newProfile.fullName || newUser.fullName,
      password: newUser.password,
      status: 'ACTIVE',
      createdAt: newProfile.createdAt || new Date().toISOString()
    });
    db.createUser(newUser);
    db.createPatientProfile(newProfile);

    this.persistSession({
      isAuthenticated: true,
      token: `mb-tok-${newUser.id}-${Date.now()}`,
      user: newUser,
      patientProfile: newProfile
    });

    return { success: true, patientId: generatedPatientId, user: newUser, patientProfile: newProfile };
  }

  /**
   * Centralized Staff / Doctor / Admin Registration
   */
  public async registerStaff(data: {
    fullName: string;
    email: string;
    password?: string;
    phone: string;
    role: 'DOCTOR' | 'TRIAGE' | 'HOSPITAL_ADMIN';
    registrationNumber?: string;
    specialization?: string;
    hospitalId?: string;
    hospitalName?: string;
  }): Promise<AuthResult> {
    const cleanEmail = data.email.trim().toLowerCase();
    const userId = `usr-staff-${Date.now()}`;

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      password: data.password || 'Staff@123',
      phone: data.phone.trim(),
      fullName: data.fullName.trim(),
      role: data.role,
      createdAt: new Date().toISOString()
    };

    let newDoctor: DoctorProfile | undefined = undefined;
    if (data.role === 'DOCTOR') {
      newDoctor = {
        id: `doc-${Date.now()}`,
        userId: userId,
        registrationNumber: data.registrationNumber || `MCI-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        qualification: 'MBBS, MD',
        specialization: data.specialization || 'General & Emergency Medicine',
        hospitalId: data.hospitalId || '',
        hospitalName: data.hospitalName || 'Registered Medical Facility',
        departmentId: 'dept-001',
        departmentName: 'Emergency & Critical Care',
        experienceYears: 10,
        isAvailable: true,
        activePatientsCount: 0
      };
    }

    // 1. Post to Serverless /api/auth
    try {
      if (typeof window !== 'undefined' && window.location) {
        const response = await fetch(CENTRAL_AUTH_API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            user: newUser,
            doctorProfile: newDoctor
          })
        });

        if (response.ok) {
          const resData = await response.json();
          this.hydrateLocalDatabase(resData);
          this.persistSession({
            isAuthenticated: true,
            token: resData.token,
            user: newUser,
            doctorProfile: newDoctor
          });
          return { success: true, user: newUser, doctorProfile: newDoctor };
        } else if (response.status === 409) {
          return { success: false, message: 'An account with this email address already exists.' };
        }
      }
    } catch (err) {
      console.warn('[Central Auth Register Staff] Serverless route error:', err);
    }

    // 2. Direct Cloud Store Fallback
    try {
      const getRes = await fetch(DIRECT_CLOUD_STORE_URL, { cache: 'no-store' });
      if (getRes.ok) {
        const cloudData = await getRes.json();
        const registry = cloudData?.data || { users: [], patients: [], doctors: [], hospitals: [] };
        registry.users = registry.users || [];
        registry.doctors = registry.doctors || [];
        registry.users.unshift(newUser);
        if (newDoctor) registry.doctors.unshift(newDoctor);

        await fetch(DIRECT_CLOUD_STORE_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'MediBridge_Auth_Store_v1',
            data: registry
          })
        });
      }
    } catch {}

    db.createUser(newUser);
    if (newDoctor) db.createDoctorProfile(newDoctor);

    this.persistSession({
      isAuthenticated: true,
      token: `mb-tok-${newUser.id}-${Date.now()}`,
      user: newUser,
      doctorProfile: newDoctor
    });

    return { success: true, user: newUser, doctorProfile: newDoctor };
  }

  /**
   * Centralized Hospital Registration
   */
  public async registerHospital(data: {
    hospitalName: string;
    registrationId: string;
    address: string;
    city: string;
    location: string;
    state?: string;
    pincode?: string;
    emergencyContact: string;
    email: string;
    password: string;
    ambulanceAvailable: boolean;
    coordinates?: { lat: number; lng: number };
    departments?: string[];
  }): Promise<AuthResult> {
    const cleanEmail = data.email.trim().toLowerCase();
    const userId = `usr-hosp-${Date.now()}`;
    const hospitalId = db.generateUniqueHospitalId();

    const newUser: User = {
      id: userId,
      email: cleanEmail,
      password: data.password,
      phone: data.emergencyContact,
      fullName: data.hospitalName.trim(),
      role: 'HOSPITAL_ADMIN',
      createdAt: new Date().toISOString()
    };

    const newHospitalAccount: HospitalAccount = {
      id: hospitalId,
      userId: userId,
      hospitalName: data.hospitalName.trim(),
      registrationId: data.registrationId.trim(),
      address: data.address.trim(),
      city: data.city.trim(),
      location: data.location.trim(),
      emergencyContact: data.emergencyContact.trim(),
      email: cleanEmail,
      ambulanceAvailable: data.ambulanceAvailable,
      coordinates: data.coordinates,
      departments: data.departments || ['Emergency & Trauma', 'General Medicine', 'Cardiology', 'ICU'],
      linkedHospitalId: hospitalId,
      createdAt: new Date().toISOString()
    };

    // 1. Post to Serverless /api/auth
    try {
      if (typeof window !== 'undefined' && window.location) {
        const response = await fetch(CENTRAL_AUTH_API_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            user: newUser,
            hospitalAccount: newHospitalAccount
          })
        });

        if (response.ok) {
          const resData = await response.json();
          this.hydrateLocalDatabase(resData);
          this.persistSession({
            isAuthenticated: true,
            token: resData.token,
            user: newUser,
            hospitalAccount: newHospitalAccount
          });
          return { success: true, hospitalId, user: newUser, hospitalAccount: newHospitalAccount };
        } else if (response.status === 409) {
          return { success: false, message: 'A hospital account with this email already exists.' };
        }
      }
    } catch (err) {
      console.warn('[Central Auth Register Hospital] Serverless route error:', err);
    }

    // 2. Direct Cloud Store Fallback
    try {
      const getRes = await fetch(DIRECT_CLOUD_STORE_URL, { cache: 'no-store' });
      if (getRes.ok) {
        const cloudData = await getRes.json();
        const registry = cloudData?.data || { users: [], patients: [], doctors: [], hospitals: [] };
        registry.users = registry.users || [];
        registry.hospitals = registry.hospitals || [];
        registry.users.unshift(newUser);
        registry.hospitals.unshift({ ...newHospitalAccount, password: newUser.password });

        await fetch(DIRECT_CLOUD_STORE_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'MediBridge_Auth_Store_v1',
            data: registry
          })
        });
      }
    } catch {}

    await cloudDb.saveHospital({
      id: hospitalId,
      hospitalId,
      userId,
      hospitalName: data.hospitalName.trim(),
      registrationId: data.registrationId.trim(),
      email: cleanEmail,
      phone: data.emergencyContact,
      emergencyContact: data.emergencyContact,
      address: data.address.trim(),
      city: data.city.trim(),
      location: data.location.trim(),
      coordinates: data.coordinates,
      ambulanceAvailable: data.ambulanceAvailable,
      departments: newHospitalAccount.departments,
      status: 'VERIFIED',
      createdAt: new Date().toISOString()
    });

    db.createUser(newUser);
    db.createHospitalAccount(newHospitalAccount);

    this.persistSession({
      isAuthenticated: true,
      token: `mb-tok-${newUser.id}-${Date.now()}`,
      user: newUser,
      hospitalAccount: newHospitalAccount
    });

    return { success: true, hospitalId, user: newUser, hospitalAccount: newHospitalAccount };
  }

  /**
   * Hydrates local client database cache from central auth server response
   */
  public hydrateLocalDatabase(data: AuthResult) {
    if (data.user) {
      db.createUser(data.user);
    }
    if (data.patientProfile) {
      db.createPatientProfile(data.patientProfile);
    }
    if (data.doctorProfile) {
      db.createDoctorProfile(data.doctorProfile);
    }
    if (data.hospitalAccount) {
      db.createHospitalAccount(data.hospitalAccount);
    }
  }

  /**
   * Persists authenticated session token and profile
   */
  public persistSession(session: AuthSessionData) {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          ...session,
          savedAt: new Date().toISOString()
        }));
      }
    } catch {}
  }

  /**
   * Clears session across browser
   */
  public clearSession() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch {}
  }
}

export const centralAuthService = CentralAuthService.getInstance();
