import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyALm01oDooHTXgAQCc-ARLlMA9k5wNbv4I",
  authDomain: "proyectois2025-50ffc.firebaseapp.com",
  projectId: "proyectois2025-50ffc",
  storageBucket: "proyectois2025-50ffc.appspot.com",
  messagingSenderId: "1064338863726",
  appId: "1:1064338863726:web:a9902af09d45b7a0c0d87f"
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const tabla = document.getElementById("tablaIntegrantes");
const modalFormulario = document.getElementById("modalFormulario");
const modalConfirmacion = document.getElementById("modalConfirmacion");
const mensajeFlotante = document.getElementById("mensajeFlotante");
const formTitulo = document.getElementById("formTitulo");
const nombreInput = document.getElementById("nombreIntegrante");
const rolActual = document.getElementById("rolActual");
const rolNuevo = document.getElementById("rolNuevo");
const btnForm = document.getElementById("btnForm");
const mensajeEliminar = document.getElementById("mensajeEliminar");

let idEdicion = null;

async function cargarIntegrantes() {
  tabla.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "Integrantes"));

  querySnapshot.forEach(docSnap => {
    const data = docSnap.data();
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${data.nombre}</td>
      <td>${data.rol}</td>
      <td>
        <button class="btn-gradient-editar">Editar</button>
        <button class="btn-gradient-eliminar">Eliminar</button>
      </td>
    `;

    const [btnEditar, btnEliminar] = fila.querySelectorAll("button");

    btnEditar.addEventListener("click", () =>
      editarIntegrante(docSnap.id, data.nombre, data.rol)
    );

    btnEliminar.addEventListener("click", () =>
      confirmarEliminar(docSnap.id, data.nombre)
    );

    tabla.appendChild(fila);
  });
}

function mostrarFormulario() {
  idEdicion = null;
  formTitulo.textContent = "Nuevo integrante";
  nombreInput.value = "";
  rolActual.textContent = "";
  rolNuevo.value = "";
  btnForm.textContent = "Agregar";
  limpiarValidaciones();
  modalFormulario.style.display = "flex";
}

function cerrarFormulario() {
  modalFormulario.style.display = "none";
  modalConfirmacion.style.display = "none";
}

function editarIntegrante(id, nombre, rol) {
  idEdicion = id;
  formTitulo.textContent = "Editar integrante";
  nombreInput.value = nombre;
  rolActual.textContent = rol;
  rolNuevo.value = "";
  btnForm.textContent = "Actualizar";
  limpiarValidaciones();
  modalFormulario.style.display = "flex";
}

function confirmarEliminar(id, nombre) {
  modalConfirmacion.style.display = "flex";
  mensajeEliminar.textContent = `¿Estás seguro de eliminar a ${nombre}?`;

  const btnSi = modalConfirmacion.querySelector(".btn-confirmar");
  const btnNo = modalConfirmacion.querySelectorAll(".btn-cancelar")[1];

  btnSi.onclick = async () => {
    await deleteDoc(doc(db, "Integrantes", id));
    modalConfirmacion.style.display = "none";
    mostrarMensaje("Integrante eliminado correctamente");
    cargarIntegrantes();
  };

  btnNo.onclick = () => {
    modalConfirmacion.style.display = "none";
  };
}

async function enviarFormulario() {
  const nombre = nombreInput.value.trim();
  const nuevoRol = rolNuevo.value;

  const validoNombre = nombre.length >= 5 && nombre.length <= 15;
  const validoRol = nuevoRol !== "";

  aplicarEstiloInput(nombreInput, validoNombre);
  aplicarEstiloInput(rolNuevo, validoRol);

  if (!validoNombre || !validoRol) {
    mostrarMensaje("Completa todos los campos correctamente", true);
    return;
  }

  if (idEdicion) {
    await updateDoc(doc(db, "Integrantes", idEdicion), { nombre, rol: nuevoRol });
    mostrarMensaje("Integrante actualizado correctamente");
  } else {
    await addDoc(collection(db, "Integrantes"), { nombre, rol: nuevoRol });
    mostrarMensaje("Integrante agregado correctamente");
  }

  cerrarFormulario();
  cargarIntegrantes();
}

function mostrarMensaje(texto, error = false) {
  mensajeFlotante.textContent = texto;
  mensajeFlotante.className = "mensaje " + (error ? "error" : "exito");
  mensajeFlotante.style.display = "block";
  setTimeout(() => mensajeFlotante.style.display = "none", 3500);
}

function aplicarEstiloInput(input, esValido) {
  input.classList.remove("error", "valid");
  input.classList.add(esValido ? "valid" : "error");
}

function limpiarValidaciones() {
  aplicarEstiloInput(nombreInput, true);
  aplicarEstiloInput(rolNuevo, true);
}

document.addEventListener("DOMContentLoaded", () => {
  cargarIntegrantes();
  document.getElementById("btnMostrarFormulario").addEventListener("click", mostrarFormulario);
  document.getElementById("btnForm").addEventListener("click", enviarFormulario);
  document.querySelectorAll(".btn-cancelar").forEach(btn =>
    btn.addEventListener("click", cerrarFormulario)
  );

  nombreInput.addEventListener("input", () => {
    const valor = nombreInput.value.trim();
    aplicarEstiloInput(nombreInput, valor.length >= 5 && valor.length <= 15);
  });

  rolNuevo.addEventListener("change", () => {
    aplicarEstiloInput(rolNuevo, rolNuevo.value !== "");
  });
});
