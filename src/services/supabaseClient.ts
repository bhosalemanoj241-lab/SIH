// =========================================================================
// MediBridge AI: Legacy Supabase Client (Migrated to Firebase)
// =========================================================================
// All database, auth, and storage services have been migrated to Firebase Firestore,
// Firebase Authentication, and Firebase Storage.
// See `src/services/firebaseConfig.ts` and `src/services/firebaseService.ts`.

import { getFirebaseConfig, isFirebaseConfigured } from './firebaseConfig';

export const getSupabaseConfig = () => ({
  supabaseUrl: '',
  supabaseAnonKey: '',
  isConfigured: false,
  migratedToFirebase: true,
  firebase: getFirebaseConfig()
});

export { isFirebaseConfigured };
