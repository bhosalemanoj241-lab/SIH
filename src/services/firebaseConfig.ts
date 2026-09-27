// =========================================================================
// MediBridge AI: Firebase SDK & Cloud Configuration
// Replaces Supabase Client with Firebase App, Auth, Firestore & Storage
// =========================================================================

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, Firestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export interface FirebaseConfigOptions {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export const getFirebaseConfig = (): FirebaseConfigOptions => {
  const metaEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
  const globalProc = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
  const procEnv: Record<string, string | undefined> = {};
  if (globalProc && globalProc.env) {
    Object.assign(procEnv, globalProc.env);
  }

  return {
    apiKey: metaEnv.VITE_FIREBASE_API_KEY || procEnv.VITE_FIREBASE_API_KEY || '',
    authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || procEnv.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || procEnv.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || procEnv.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || procEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: metaEnv.VITE_FIREBASE_APP_ID || procEnv.VITE_FIREBASE_APP_ID || '',
    measurementId: metaEnv.VITE_FIREBASE_MEASUREMENT_ID || procEnv.VITE_FIREBASE_MEASUREMENT_ID || ''
  };
};

const config = getFirebaseConfig();

export const isFirebaseConfigured = Boolean(
  config.apiKey &&
  config.projectId &&
  !config.apiKey.includes('your_firebase_api_key') &&
  !config.projectId.includes('your_project_id') &&
  !config.apiKey.toLowerCase().includes('dummy') &&
  !config.apiKey.toLowerCase().includes('placeholder') &&
  !config.projectId.toLowerCase().includes('placeholder') &&
  config.apiKey.length > 20
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(config) : getApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
    storage = getStorage(app);

    // Set local persistence for seamless auth sessions
    if (typeof window !== 'undefined' && auth) {
      setPersistence(auth, browserLocalPersistence).catch(() => {});
    }

    // Try offline persistence for Firestore if available in browser
    if (typeof window !== 'undefined' && firestore) {
      try {
        enableIndexedDbPersistence(firestore).catch((err) => {
          if (err.code === 'failed-precondition') {
            // Multiple tabs open, persistence can only be enabled in one tab at a time.
          } else if (err.code === 'unimplemented') {
            // The current browser does not support all of the features required.
          }
        });
      } catch {}
    }
  } catch (err) {
    console.warn('[Firebase Init Warning]:', err);
  }
}

export { app, auth, firestore, storage };
export default app;
