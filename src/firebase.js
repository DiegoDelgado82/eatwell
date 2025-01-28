// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB5Ql6t4Iel6Oi_BdeRuMjZAveInYOvKow",
  authDomain: "biosalud-3e4d5.firebaseapp.com",
  projectId: "biosalud-3e4d5",
  storageBucket: "biosalud-3e4d5.firebasestorage.app",
  messagingSenderId: "301769308765",
  appId: "1:301769308765:web:2dc16932b88e88b9a62bb4",
  measurementId: "G-MZ8EG2XENG"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };
