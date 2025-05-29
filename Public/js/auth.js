import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  setPersistence,
  browserLocalPersistence,
  signOut
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
 getFirestore,
 doc,
 setDoc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyALm01oDooHTXgAQCc-ARLMMA9k5wNbv4I",
  authDomain: "proyectois2025-50ffc.firebaseapp.com",
  projectId: "proyectois2025-50ffc",
  storageBucket: "proyectois2025-50ffc.appspot.com",
  messagingSenderId: "1064338863726",
  appId: "1:1064338863726:web:a9902af09d45b7a0c0d87f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error("Error en setPersistence:", error);
});

export function iniciarSesion() {
  return signInWithPopup(auth, provider)
  .then(async (result) => {
  // Este bloque se ejecuta después de un inicio de sesión exitoso
  const user = result.user;
  try {
  // Guarda o actualiza los datos del usuario en Firestore
  await setDoc(doc(db, "usuarios", user.uid), {
  uid: user.uid,
  nombre: user.displayName,
  correo: user.email,
  });
  window.location.href = "../DashboardAvance/Dashboard.html";
  } catch (error) {
  console.error("Error al guardar datos del usuario en Firestore:", error);
  }
  })
  .catch((error) => {
        console.error("Error al iniciar sesión:", error);
  });      
}

export function escucharCambiosSesion(callback) {
  return onAuthStateChanged(auth, callback);
}

export function cerrarSesion() {
  return signOut(auth);
}

window.loginWithGoogle = iniciarSesion;