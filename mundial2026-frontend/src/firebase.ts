import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Configuración de Firebase usando variables de entorno de Vite.
// Se incluyen valores de respaldo (fallbacks) para evitar excepciones en desarrollo local
// si las variables de entorno aún no han sido cargadas en el sistema.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyFakeKeyPlaceholder1234567890",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mundial2026-prode.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mundial2026-prode",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mundial2026-prode.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef1234567890"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Forzar selección de cuenta de Google al iniciar sesión
googleProvider.setCustomParameters({
  prompt: 'select_account'
});
