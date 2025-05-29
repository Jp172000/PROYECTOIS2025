import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  Timestamp,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc
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

let idEliminar = null;
let editando = false;

const formSprint = document.getElementById("formSprint");
const tablaSprints = document.getElementById("tablaSprints");
const modal = document.getElementById("modalSprint");
const btnAbrirModal = document.getElementById("btnAbrirModalSprint");
const selectBacklog = document.getElementById("backlog");
const modalConfirm = document.getElementById("modalConfirmar");
const btnConfirmar = document.getElementById("btnConfirmarEliminar");
const btnCancelar = document.getElementById("btnCancelarEliminar");
const textoConfirm = document.getElementById("textoConfirmacion");
const sprintIdInput = document.getElementById("sprintId");

btnAbrirModal.addEventListener("click", () => {
  limpiarFormulario();
  modal.style.display = "flex";
});

window.cerrarModalSprint = function () {
  modal.style.display = "none";
};

formSprint.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const descripcion = document.getElementById("descripcion").value.trim();
  const fechaInicio = new Date(document.getElementById("fechaInicio").value);
  const fechaFin = new Date(document.getElementById("fechaFin").value);
  const estado = document.getElementById("estado").value;
  const integrantes = [...document.querySelectorAll('input[name="integrante"]:checked')].map(cb => cb.value);
  const backlog = selectBacklog.value;

  if (integrantes.length < 1 || integrantes.length > 3) {
    mostrarToast("Selecciona entre 1 y 3 integrantes", false);
    return;
  }
  if (fechaFin <= fechaInicio) {
    mostrarToast("La fecha de fin debe ser posterior a la de inicio", false);
    return;
  }

  const sprintData = {
    nombre,
    descripcion,
    fechaInicio: Timestamp.fromDate(fechaInicio),
    fechaFin: Timestamp.fromDate(fechaFin),
    estado,
    integrantes,
    backlogId: backlog,
    tareas: [],
    fechaCreacion: Timestamp.now()
  };

  try {
    const id = sprintIdInput.value;
    if (id) {
      await updateDoc(doc(db, "Sprints", id), sprintData);
      mostrarToast("✅ Sprint actualizado");
    } else {
      const q = query(collection(db, "Sprints"), where("nombre", "==", nombre));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        mostrarToast("⚠️ Ya existe un Sprint con ese nombre", false);
        return;
      }
      await addDoc(collection(db, "Sprints"), sprintData);
      mostrarToast("✅ Sprint guardado exitosamente");
    }
    cerrarModalSprint();
    listarSprints();
  } catch (err) {
    console.error("❌ Error al guardar sprint:", err);
    mostrarToast("❌ Error al guardar sprint", false);
  }
});

async function listarSprints() {
  if (!tablaSprints) return;
  tablaSprints.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "Sprints"));

  querySnapshot.forEach((docu) => {
    const sprint = docu.data();
    const fila = `
      <tr>
        <td>${sprint.nombre}</td>
        <td>${sprint.descripcion}</td>
        <td>${sprint.estado}</td>
        <td>${sprint.fechaInicio.toDate().toLocaleDateString()}</td>
        <td>${sprint.fechaFin.toDate().toLocaleDateString()}</td>
        <td>
          <button class="btn-editar" onclick="editarSprint('${docu.id}')">✏️</button>
          <button class="btn-eliminar" onclick="confirmarEliminacion('${docu.id}', '${sprint.nombre}')">🗑️</button>
        </td>
      </tr>`;
    tablaSprints.innerHTML += fila;
  });
}

window.editarSprint = async function (id) {
  const ref = doc(db, "Sprints", id);
  const snap = await getDocs(query(collection(db, "Sprints"), where("__name__", "==", id)));

  if (!snap.empty) {
    const sprint = snap.docs[0].data();
    document.getElementById("tituloModal").textContent = "Editar Sprint";
    sprintIdInput.value = id;
    document.getElementById("nombre").value = sprint.nombre;
    document.getElementById("descripcion").value = sprint.descripcion;
    document.getElementById("fechaInicio").value = sprint.fechaInicio.toDate().toISOString().split('T')[0];
    document.getElementById("fechaFin").value = sprint.fechaFin.toDate().toISOString().split('T')[0];
    document.getElementById("estado").value = sprint.estado;
    await cargarIntegrantes(sprint.integrantes);
    document.getElementById("backlog").value = sprint.backlogId;
    modal.style.display = "flex";
  }
};

function limpiarFormulario() {
  formSprint.reset();
  sprintIdInput.value = "";
  document.getElementById("tituloModal").textContent = "Nuevo Sprint";
}

async function cargarIntegrantes(seleccionados = []) {
  const contenedor = document.getElementById("listaIntegrantes");
  contenedor.innerHTML = "";
  const snap = await getDocs(collection(db, "Integrantes"));
  snap.forEach(doc => {
    const data = doc.data();
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = doc.id;
    checkbox.name = "integrante";
    if (seleccionados.includes(doc.id)) checkbox.checked = true;

    const label = document.createElement("label");
    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(`${data.nombre} (${data.rol})`));
    contenedor.appendChild(label);
  });
}

async function cargarBacklogs() {
  const snap = await getDocs(collection(db, "Backlogs"));
  selectBacklog.innerHTML = "";
  snap.forEach(doc => {
    const data = doc.data();
    if (data.estado === "Pendiente" || data.estado === "En progreso") {
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = data.nombre;
      selectBacklog.appendChild(option);
    }
  });
}

function mostrarToast(mensaje, exito = true) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.backgroundColor = exito ? "#4CAF50" : "#e53935";
  toast.textContent = mensaje;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

window.confirmarEliminacion = function (id, nombre) {
  idEliminar = id;
  textoConfirm.innerHTML = `¿Estás seguro de eliminar <strong>${nombre}</strong>?`;
  modalConfirm.style.display = "flex";
};

btnConfirmar?.addEventListener("click", async () => {
  if (!idEliminar) return;
  try {
    await deleteDoc(doc(db, "Sprints", idEliminar));
    mostrarToast("Sprint eliminado correctamente");
    listarSprints();
  } catch (error) {
    console.error("❌ Error al eliminar sprint:", error);
    mostrarToast("Error al eliminar el Sprint", false);
  } finally {
    modalConfirm.style.display = "none";
    idEliminar = null;
  }
});

btnCancelar?.addEventListener("click", () => {
  modalConfirm.style.display = "none";
  idEliminar = null;
});

listarSprints();
cargarIntegrantes();
cargarBacklogs();