import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  addDoc,
  onSnapshot
} from "firebase/firestore";
import Constants from "expo-constants";

const extraConfig = Constants.expoConfig?.extra?.firebase || {};

const firebaseConfig = {
  apiKey: extraConfig.apiKey || "AIzaSyBn6eDmLMlHsHeMKiQy2YX__wD-EYBt8MU",
  authDomain: extraConfig.authDomain || "servija-34e26.firebaseapp.com",
  projectId: extraConfig.projectId || "servija-34e26",
  storageBucket: extraConfig.storageBucket || "servija-34e26.firebasestorage.app",
  messagingSenderId: extraConfig.messagingSenderId || "128919998450",
  appId: extraConfig.appId || "1:128919998450:web:7bbcb68443a5ccbc3ce56b",
  measurementId: extraConfig.measurementId || "G-VDH1STKTNK",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { 
  app, 
  auth, 
  db,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  updateProfile,
  onAuthStateChanged,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  addDoc,
  onSnapshot
};

export type { FirebaseUser };
