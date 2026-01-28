import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

const hasFirebaseConfig = () =>
  Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );

const getFirebaseApp = (): FirebaseApp => {
  if (!hasFirebaseConfig()) {
    throw new Error("Missing Firebase config. Set VITE_FIREBASE_* env vars.");
  }
  if (getApps().length > 0) return getApps()[0]!;
  return initializeApp(firebaseConfig);
};

export const getFirestoreDb = (): Firestore => {
  return getFirestore(getFirebaseApp());
};

export const getFirebaseAuth = (): Auth => {
  return getAuth(getFirebaseApp());
};

export const ensureAnonymousAuth = async (): Promise<void> => {
  const auth = getFirebaseAuth();
  if (auth.currentUser) return;
  const existing = await new Promise<boolean>((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub();
      resolve(Boolean(user));
    });
  });
  if (!existing) await signInAnonymously(auth);
};
