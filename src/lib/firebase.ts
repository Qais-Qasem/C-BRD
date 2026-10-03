import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged,
  User
} from 'firebase/auth';

import firebaseConfigJson from '../../firebase-applet-config.json';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let isConfigured = false;

const isLocalMode = (): boolean => {
  try {
    if ((import.meta as any)?.env?.VITE_LOCAL_MODE === 'true') return true;
    // Automatic fallback: production runs on *.run.app, so localhost always means local dev.
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return true;
    }
  } catch {
    // ignore
  }
  return false;
};

try {
  if (!isLocalMode()) {
    const config = firebaseConfigJson;
  if (config && config.apiKey && config.projectId) {
    if (!getApps().length) {
      app = initializeApp(config);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    isConfigured = true;
  }
  }
} catch (err) {
  console.warn('Firebase initialization error:', err);
  isConfigured = false;
}

const isDev = (): boolean => {
  return (import.meta as any)?.env?.DEV || process.env.NODE_ENV !== 'production';
};

export const isFirebaseConnected = (): boolean => isConfigured && auth !== null;

export const getFirebaseAuth = (): Auth | null => auth;
export const getFirebaseDb = () => null;

export const getFirebaseConfigInfo = () => {
  return {
    projectId: firebaseConfigJson.projectId || '',
    appId: firebaseConfigJson.appId || ''
  };
};

export const authSignIn = async (email: string, pass: string): Promise<User | null> => {
  if (!auth) {
    throw new Error('REAL AUTHENTICATION SETUP REQUIRED: Firebase Auth is not configured in this environment.');
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  return userCredential.user;
};

export const authSignUp = async (email: string, pass: string): Promise<User | null> => {
  if (!auth) {
    throw new Error('REAL AUTHENTICATION SETUP REQUIRED: Firebase Auth is not configured in this environment.');
  }
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  if (userCredential.user) {
    try {
      if (isDev()) {
        const config = firebaseConfigJson;
        console.log('[Firebase Auth Dev Diagnostic]', {
          projectId: config.projectId,
          appId: config.appId,
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          emailVerified: userCredential.user.emailVerified,
          timestamp: new Date().toISOString()
        });
        console.log('[Firebase Auth Dev Diagnostic] sendEmailVerification start (SignUp)');
      }
      await sendEmailVerification(userCredential.user);
      if (isDev()) {
        console.log('[Firebase Auth Dev Diagnostic] sendEmailVerification success (SignUp)');
      }
    } catch (e: any) {
      if (isDev()) {
        console.warn('[Firebase Auth Dev Diagnostic] Could not send initial email verification on sign up:', {
          code: e?.code,
          message: e?.message
        });
      }
    }
  }
  return userCredential.user;
};

export const resendEmailVerificationForCurrentUser = async (): Promise<void> => {
  if (!auth) {
    throw {
      code: 'auth/not-initialized',
      message: 'Firebase Auth is not initialized in this app instance.'
    };
  }

  const currentUser = auth.currentUser;
  const config = firebaseConfigJson;

  // Development Logging Requirement
  if (isDev()) {
    console.log('[Firebase Auth Dev Diagnostic]', {
      projectId: config.projectId,
      appId: config.appId,
      uid: currentUser?.uid || null,
      email: currentUser?.email || null,
      emailVerified: currentUser?.emailVerified ?? null,
      timestamp: new Date().toISOString()
    });
    console.log('[Firebase Auth Dev Diagnostic] sendEmailVerification start');
  }

  if (!currentUser) {
    const error = {
      code: 'auth/no-current-user',
      message: 'No authenticated user is currently signed in. Please sign in again.'
    };
    if (isDev()) {
      console.error('[Firebase Auth Dev Diagnostic] sendEmailVerification failed:', error);
    }
    throw error;
  }

  try {
    await sendEmailVerification(currentUser);
    if (isDev()) {
      console.log('[Firebase Auth Dev Diagnostic] sendEmailVerification success');
    }
  } catch (err: any) {
    const errCode = err?.code || 'auth/unknown-error';
    const errMessage = err?.message || 'An unexpected error occurred while sending the email verification.';
    if (isDev()) {
      console.error('[Firebase Auth Dev Diagnostic] sendEmailVerification failed:', {
        code: errCode,
        message: errMessage,
        rawError: err
      });
    }
    throw {
      code: errCode,
      message: errMessage
    };
  }
};

export const authSignOut = async (): Promise<void> => {
  if (auth) {
    await firebaseSignOut(auth);
  }
};

export const authResetPassword = async (email: string): Promise<void> => {
  if (!auth) {
    throw new Error('REAL AUTHENTICATION SETUP REQUIRED: Firebase Auth is not configured in this environment.');
  }
  await sendPasswordResetEmail(auth, email);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};
