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

// Firebase configuration with fallbacks for Capacitor
const measurementId = normalizeMeasurementId(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-E8X8MQJPE1')

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCCSELzDYkOEMRXoRRxMna-RbIUv87fRS4',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'recipebook-5a2d6.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'recipebook-5a2d6',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'recipebook-5a2d6.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '261114422744',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:261114422744:web:3e28123d45b2af43c67ead',
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
