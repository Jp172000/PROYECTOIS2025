import {
  initializeApp,
  getApps
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

import Swal from 'https://cdn.jsdelivr.net/npm/sweetalert2@11.7.5/+esm';

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
const backlogsRef = collection(db, "Backlogs");

export async function cargarUsuarios() {
  const select = document.getElementById("asignado");
  if (!select) return;
  select.innerHTML = '<option value="">Seleccione</option>';
  try {
    const snapshot = await getDocs(collection(db, "Integrantes"));
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.nombre) {
        const option = document.createElement("option");
        option.value = data.nombre;
        option.textContent = data.nombre;
        select.appendChild(option);
      }
    });
  } catch (error) {
    console.error("❌ Error al cargar los integrantes:", error);
  }
}

export async function guardarBacklog(data) {
  return await addDoc(backlogsRef, data);
}

export async function obtenerBacklogs() {
  const snapshot = await getDocs(backlogsRef);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function cambiarEstadoBacklog(id, nuevoEstado) {
  const ref = doc(db, "Backlogs", id);
  const updateData = { estado: nuevoEstado };

  if (nuevoEstado === "En progreso") {
    updateData.fechaInicio = serverTimestamp();
  } else if (nuevoEstado === "Completado") {
    updateData.fechaFin = serverTimestamp();
  }

  await updateDoc(ref, updateData);
}

export async function eliminarBacklog(id) {
  const ref = doc(db, "Backlogs", id);
  await deleteDoc(ref);
}

export async function cargarYMostrarBacklogs() {
  const lista = document.getElementById('listaBacklogs');
  lista.innerHTML = '';
  const backlogs = await obtenerBacklogs();

  backlogs.forEach((item, i) => {
    const fechaInicio = item.fechaInicio
      ? new Date(item.fechaInicio.toDate ? item.fechaInicio.toDate() : item.fechaInicio).toLocaleDateString()
      : '-';

    const fechaFin = item.fechaFin
      ? new Date(item.fechaFin.toDate ? item.fechaFin.toDate() : item.fechaFin).toLocaleDateString()
      : '-';

    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${i + 1}</td>
      <td>${item.asignado}</td>
      <td>
        <span class="estado-dot ${item.estado.toLowerCase().replace(' ', '-')}"></span>
        <span class="estado-texto">${item.estado}</span>
      </td>
      <td>${item.nombre}</td>
      <td>${fechaInicio}</td>
      <td>${fechaFin}</td>
      <td style="text-align: center;">
        <button class="boton-icono-redondo boton-editar" title="Siguiente Estado" onclick="actualizarEstado('${item.id}', this)">✏️</button>
        <button class="boton-icono-redondo boton-ver" title="Ver" onclick="visualizarItem('${item.nombre}', '${item.descripcion}', '${item.asignado}', '${item.estado}')">👁️</button>
        <button class="boton-icono-redondo boton-eliminar" title="Eliminar" onclick="eliminarItem('${item.id}')">🗑️</button>
      </td>
    `;
    lista.appendChild(fila);
  });
}

window.actualizarEstado = async function (id, boton) {
  const fila = boton.closest('tr');
  const texto = fila.querySelector('.estado-texto');
  const punto = fila.querySelector('.estado-dot');
  let nuevoEstado = texto.textContent === 'Pendiente' ? 'En progreso' : 'Completado';
  texto.textContent = nuevoEstado;
  punto.className = 'estado-dot ' + nuevoEstado.toLowerCase().replace(' ', '-');
  if (nuevoEstado === 'Completado') boton.remove();
  await cambiarEstadoBacklog(id, nuevoEstado);
  await cargarYMostrarBacklogs();

};

window.eliminarItem = async function (id) {
  const confirmacion = await Swal.fire({
    title: '¿Estás seguro?',
    text: 'Este ítem se eliminará permanentemente',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6'
  });

  if (confirmacion.isConfirmed) {
    await eliminarBacklog(id);
    await cargarYMostrarBacklogs();
    Swal.fire('¡Eliminado!', 'El ítem ha sido eliminado.', 'success');
  }
};

window.visualizarItem = function (nombre, descripcion, asignado, estado) {
  document.getElementById('verNombre').textContent = nombre;
  document.getElementById('verDescripcion').textContent = descripcion;
  document.getElementById('verAsignado').textContent = asignado;
  document.getElementById('verEstado').textContent = estado;
  document.getElementById('modalVerItem').style.display = 'flex';
};

window.cerrarModalVer = function () {
  document.getElementById('modalVerItem').style.display = 'none';
};

window.mostrarFormulario = async function () {
  limpiarFormulario();
  await cargarUsuarios();
  document.getElementById('formularioModal').style.display = 'flex';
};

window.cerrarFormulario = function () {
  document.getElementById('formularioModal').style.display = 'none';
};

window.agregarItem = async function () {
  const nombre = document.getElementById('nombre');
  const descripcion = document.getElementById('descripcion');
  const asignado = document.getElementById('asignado');
  const estado = document.getElementById('estado');
  const fechaInicioInput = document.getElementById('fechaInicio');

  const campos = [nombre, descripcion, asignado, estado];
  let valido = true;

  campos.forEach(campo => {
    if (!campo.value.trim()) {
      campo.classList.add('error-input');
      campo.classList.remove('valid-input');
      valido = false;
    } else {
      campo.classList.remove('error-input');
      campo.classList.add('valid-input');
    }
  });

  if (descripcion.value.length > 50) {
    descripcion.classList.add('error-input');
    descripcion.classList.remove('valid-input');
    valido = false;
  }

  if (!valido) {
    mostrarAlerta();
    return;
  }

  const datos = {
    nombre: nombre.value.trim(),
    descripcion: descripcion.value.trim(),
    asignado: asignado.value,
    estado: estado.value
  };

  if (estado.value === "En progreso" && fechaInicioInput.value) {
    if (fechaInicioInput.value) {
      const [year, month, day] = fechaInicioInput.value.split("-");
      datos.fechaInicio = new Date(year, month - 1, day);
    }
    
  }

  await guardarBacklog(datos);
  cerrarFormulario();
  await cargarYMostrarBacklogs();
};

function limpiarFormulario() {
  ['nombre', 'descripcion', 'asignado', 'estado', 'fechaInicio'].forEach(id => {
    const campo = document.getElementById(id);
    if (campo) {
      campo.value = '';
      campo.classList.remove('error-input', 'valid-input');
    }
  });
  const contador = document.getElementById('contadorDescripcion');
  if (contador) contador.textContent = '0/50';
}

function mostrarAlerta() {
  const alerta = document.getElementById("alertaCampos");
  alerta.style.display = "block";
  setTimeout(() => alerta.style.display = "none", 3000);
}

document.addEventListener("DOMContentLoaded", async () => {
  const descripcion = document.getElementById("descripcion");
  const contador = document.getElementById("contadorDescripcion");

  if (descripcion && contador) {
    descripcion.addEventListener("input", () => {
      const longitud = descripcion.value.length;
      contador.textContent = `${longitud}/50`;

      if (longitud <= 50) {
        descripcion.classList.remove("error-input");
        descripcion.classList.add("valid-input");
      } else {
        descripcion.classList.add("error-input");
        descripcion.classList.remove("valid-input");
      }
    });

    contador.textContent = `${descripcion.value.length}/50`;
  }

  await cargarUsuarios();
  await cargarYMostrarBacklogs();
});
