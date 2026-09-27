// =========================================================================
// MediBridge AI: Legacy Supabase Service Adapter
// =========================================================================
// The backend has migrated to Firebase Firestore, Auth, and Storage.
// This file re-exports the unified Firebase CloudDataService and SyncRelay
// ensuring 100% backward compatibility with zero broken imports.
// =========================================================================

export {
  cloudDataService,
  syncRelay,
  FirebaseAuthService,
  isFirebaseConfigured,
  isSupabaseConfigured
} from './firebaseService';
