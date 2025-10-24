import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClGmWdBBiC5805nEGFKLnWv4p1qgAio40",
  authDomain: "medicine-indicator-1fbc8.firebaseapp.com",
  databaseURL: "https://medicine-indicator-1fbc8-default-rtdb.firebaseio.com",
  projectId: "medicine-indicator-1fbc8",
  storageBucket: "medicine-indicator-1fbc8.firebasestorage.app",
  messagingSenderId: "553743088878",
  appId: "1:553743088878:web:594db03aa078359f7d47ff",
  measurementId: "G-5EQ8TP9ER6"
};

// Initialize Firebase
let app: FirebaseApp;
let database: Database;
let auth: Auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  database = getDatabase(app);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

// Helper function for checking if Firebase is ready
const isFirebaseConfigured = () => true;

export { database, auth, isFirebaseConfigured };
