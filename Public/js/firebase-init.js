import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyALm01oDooHTXgAQCc-ARLMMA9k5wNbv4I",
  authDomain: "proyectois2025-50ffc.firebaseapp.com",
  projectId: "proyectois2025-50ffc",
  storageBucket: "proyectois2025-50ffc.firebasestorage.app",
  messagingSenderId: "1064338863726",
  appId: "1:1064338863726:web:a9902af09d45b7a0c0d87f"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);