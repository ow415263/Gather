import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'
import { getFunctions } from 'firebase/functions'
import { getAnalytics } from 'firebase/analytics'

const normalizeMeasurementId = (value: string | undefined) => {
  const trimmed = value?.trim()
  if (!trimmed) return undefined
  return trimmed.startsWith('G-') ? trimmed : `G-${trimmed.replace(/^G-/, '')}`
}

// Firebase configuration — all values must come from .env (never hardcode keys here)
const measurementId = normalizeMeasurementId(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID)

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  ...(measurementId ? { measurementId } : {})
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
import { initializeAuth, indexedDBLocalPersistence } from 'firebase/auth'

// Use initializeAuth for better control over persistence
// This often fixes the "hang" issue on Capacitor/mobile
export const auth = initializeAuth(app, {
  persistence: indexedDBLocalPersistence
})

export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export const storage = getStorage(app)
export const functions = getFunctions(app)

// Initialize Analytics (only in browser)
let analytics
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app)
}

export { analytics }
export default app
