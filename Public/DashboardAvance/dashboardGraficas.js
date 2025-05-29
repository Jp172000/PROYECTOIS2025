import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyALm01oDooHTXgAQCc-ARLlMA9k5wNbv4I",
  authDomain: "proyectois2025-50ffc.firebaseapp.com",
  projectId: "proyectois2025-50ffc",
  storageBucket: "proyectois2025-50ffc.appspot.com",
  messagingSenderId: "1064338863726",
  appId: "1:1064338863726:web:a9902af09d45b7a0c0d87f"
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

async function graficarIntegrantesPorRol() {
  const contenedor = document.getElementById("contenedor-grafico-integrantes");
  if (!contenedor) return;

  const snap = await getDocs(collection(db, "Integrantes"));

  const roles = {};
  snap.forEach(doc => {
    const data = doc.data();
    if (!data.rol || !data.nombre) return;

    const rol = data.rol;
    if (!roles[rol]) roles[rol] = [];
    roles[rol].push(data.nombre);
  });

  contenedor.innerHTML = "";

  const colores = {
    "Scrum Master": "#e74c3c",
    "Desarrollador": "#f39c12",
    "Tester": "#27ae60",
    default: "#3498db"
  };

  for (const [rol, integrantes] of Object.entries(roles)) {
    const bloque = document.createElement("div");
    bloque.style.marginBottom = "30px";
    bloque.style.textAlign = "center";

    const color = colores[rol] || colores.default;

    const conteo = document.createElement("div");
    conteo.style.fontWeight = "bold";
    conteo.style.color = color;
    conteo.style.fontSize = "20px";
    conteo.textContent = `${integrantes.length} ${rol}`;

    const lista = document.createElement("div");
    lista.style.color = color;
    lista.style.fontSize = "16px";
    lista.style.marginTop = "4px";
    lista.innerHTML = integrantes.map(nombre => `<div>${nombre}</div>`).join("");

    const iconoRol = document.createElement("div");
    iconoRol.style.marginTop = "8px";
    iconoRol.innerHTML = `
      <div style="display:inline-flex; align-items:center; flex-direction:column;">
        <div style="width:60px; height:60px; background:${color}; border-radius:50%; display:flex; align-items:center; justify-content:center;">
          <span style="color:#fff; font-size:30px;">👤</span>
        </div>
        <span style="font-weight:bold; font-size:14px; margin-top:5px;">${rol}</span>
      </div>`;

    bloque.appendChild(conteo);
    bloque.appendChild(lista);
    bloque.appendChild(iconoRol);
    contenedor.appendChild(bloque);
  }
}

async function contarSprintsYBacklogs() {
  const sprintSnap = await getDocs(collection(db, "Sprints"));
  const backlogSnap = await getDocs(collection(db, "Backlogs"));

  const sprintsProceso = sprintSnap.docs.filter(doc => doc.data().estado?.toLowerCase() === "en progreso").length;
  const backlogsProceso = backlogSnap.docs.filter(doc => doc.data().estado?.toLowerCase() === "en progreso").length;

  document.getElementById("valor-sprints").textContent = sprintsProceso;
  document.getElementById("valor-backlogs").textContent = backlogsProceso;
}

let filtroActual = { azul: true, verde: true };

async function graficarHorasPorSprint() {
  const snap = await getDocs(collection(db, "Sprints"));
  const hoy = new Date();
  const dataSprint = [];

  snap.forEach(doc => {
    const s = doc.data();
    if (s.nombre && s.fechaInicio) {
      const inicio = s.fechaInicio.toDate();
      const fin = s.estado?.toLowerCase() === "completado" && s.fechaFin ? s.fechaFin.toDate() : hoy;
      const horas = contarHorasLaborales(inicio, fin);
      dataSprint.push({ nombre: s.nombre, horas, estado: s.estado });
    }
  });

  insertarLeyendaSprint();
  actualizarGraficoSprint(dataSprint);

  document.getElementById("toggle-azul").addEventListener("click", () => {
    filtroActual.azul = !filtroActual.azul;
    actualizarGraficoSprint(dataSprint);
    document.getElementById("toggle-azul").style.opacity = filtroActual.azul ? 1 : 0.4;
  });

  document.getElementById("toggle-verde").addEventListener("click", () => {
    filtroActual.verde = !filtroActual.verde;
    actualizarGraficoSprint(dataSprint);
    document.getElementById("toggle-verde").style.opacity = filtroActual.verde ? 1 : 0.4;
  });
}

function actualizarGraficoSprint(dataOriginal) {
  const ctx = document.getElementById("graficoSprint");
  if (!ctx) return;

  const colores = [], valores = [], etiquetas = [];

  dataOriginal.forEach(item => {
    const esVerde = item.estado?.toLowerCase() === "completado";
    const color = esVerde ? "#27ae60" : "#2F80ED";

    if ((esVerde && filtroActual.verde) || (!esVerde && filtroActual.azul)) {
      etiquetas.push(item.nombre);
      valores.push(item.horas);
      colores.push(color);
    }
  });

  Chart.getChart("graficoSprint")?.destroy();

  new Chart(ctx, {
    type: "bar",
    data: {
      labels: etiquetas,
      datasets: [{
        label: "Horas trabajadas",
        data: valores,
        backgroundColor: colores,
        datalabels: {
          color: "#fff",
          anchor: "end",
          align: "end",
          font: { weight: "bold" }
        }
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Cantidad de horas por sprint" }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 10 } }
      }
    }
  });
}

function insertarLeyendaSprint() {
  if (document.querySelector(".leyenda-sprint")) return;

  const canvas = document.getElementById("graficoSprint");
  const contenedor = document.createElement("div");
  contenedor.className = "leyenda-sprint";
  contenedor.style.display = "flex";
  contenedor.style.justifyContent = "center";
  contenedor.style.gap = "40px";
  contenedor.style.marginTop = "5px";
  contenedor.style.marginBottom = "0";

  contenedor.innerHTML = `
    <span id="toggle-azul" style="display:flex; align-items:center; gap:6px; cursor:pointer;">
      <div style="width:14px; height:14px; border-radius:50%; background:#2F80ED; border:2px solid #2F80ED;"></div>
      <span style="color:#2F80ED; font-weight:bold;">En progreso</span>
    </span>
    <span id="toggle-verde" style="display:flex; align-items:center; gap:6px; cursor:pointer;">
      <div style="width:14px; height:14px; border-radius:50%; background:#27ae60; border:2px solid #27ae60;"></div>
      <span style="color:#27ae60; font-weight:bold;">Finalizado</span>
    </span>
  `;

  canvas.insertAdjacentElement("afterend", contenedor);
}

async function graficarHorasPorRol() {
  const integrantesSnap = await getDocs(collection(db, "Integrantes"));
  const backlogsSnap = await getDocs(collection(db, "Backlogs"));
  const hoy = new Date();

  const rolHoras = {};
  const nombreARol = {};

  integrantesSnap.forEach(doc => {
    const data = doc.data();
    if (data.nombre && data.rol) nombreARol[data.nombre] = data.rol;
  });

  backlogsSnap.forEach(doc => {
    const b = doc.data();
    if (b.asignado && b.fechaInicio && b.estado?.toLowerCase() === "en progreso") {
      const rol = nombreARol[b.asignado];
      if (!rol) return;
      const horas = contarHorasLaborales(b.fechaInicio.toDate(), hoy);
      rolHoras[rol] = (rolHoras[rol] || 0) + horas;
    }
  });

  const ctx = document.getElementById("graficoHorasRol");
  if (!ctx) return;

  const labels = Object.keys(rolHoras);
  const data = Object.values(rolHoras);
  const colores = ["#2F80ED", "#F2994A", "#27AE60", "#BB6BD9", "#EB5757"];

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Horas por Rol",
        data,
        backgroundColor: colores,
        datalabels: {
          color: "#fff",
          anchor: "center",
          align: "center",
          font: { weight: "bold" }
        }
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: "Horas trabajadas por rol (Backlogs)" }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: { display: true, text: "Horas" }
        }
      }
    }
  });
}

function graficarRetraso() {
  const ctx = document.getElementById("graficoPastel");
  if (!ctx) return;

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Retraso", "Sin retraso"],
      datasets: [{
        data: [60, 40],
        backgroundColor: ["#FF0000", "#32CD32"],
        datalabels: {
          color: "#fff",
          font: { weight: "bold", size: 16 },
          formatter: val => `${val}%`
        }
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        title: { display: true, text: "Predicción de retraso" }
      }
    }
  });
}

function contarHorasLaborales(inicio, fin) {
  let fecha = new Date(inicio);
  let horas = 0;
  while (fecha <= fin) {
    const dia = fecha.getDay();
    if (dia >= 1 && dia <= 5) horas += 8;
    fecha.setDate(fecha.getDate() + 1);
  }
  return horas;
}

async function mostrarIntegrantesPorRol() {
  const contenedor = document.getElementById("contenedor-grafico-integrantes");
  if (!contenedor) return;

  const snap = await getDocs(collection(db, "Integrantes"));
  const rolesMap = {}; 

  snap.forEach(doc => {
    const data = doc.data();
    if (!data.nombre || !data.rol) return;
    if (!rolesMap[data.rol]) rolesMap[data.rol] = [];
    rolesMap[data.rol].push(data.nombre);
  });

  const colores = {
    "Scrum Master": "#2F80ED",
    "Desarrollador": "#F2994A",
    "Tester": "#27AE60",
    "Product Owner": "#BB6BD9"
  };

  contenedor.innerHTML = ""; 
  let total = 0;

  Object.keys(rolesMap).forEach(rol => {
    const nombres = rolesMap[rol];
    total += nombres.length;

    const bloque = document.createElement("div");
    bloque.className = "bloque-rol";

    const header = document.createElement("h3");
    header.textContent = `${nombres.length} ${rol}`;
    header.style.color = colores[rol] || "#333";
    bloque.appendChild(header);

    nombres.forEach(nombre => {
      const p = document.createElement("p");
      p.textContent = nombre;
      bloque.appendChild(p);
    });

    contenedor.appendChild(bloque);
  });


  const totalLabel = document.querySelector(".titulo-integrantes");
  if (totalLabel) totalLabel.textContent = `Total de integrantes: ${total}`;
}

async function mostrarTarjetasIntegrantes() {
  const contenedor = document.getElementById("contenedor-integrantes");
  const totalSpan = document.getElementById("total-integrantes");
  if (!contenedor || !totalSpan) return;

  const snap = await getDocs(collection(db, "Integrantes"));
  const rolesCss = {
    "Scrum Master": "scrum",
    "Desarrollador": "desarrollador",
    "Tester": "tester",
    "Product Owner": "po"
  };

  contenedor.innerHTML = "";
  let total = 0;

  snap.forEach(doc => {
    const data = doc.data();
    if (!data.nombre || !data.rol) return;

    const tarjeta = document.createElement("div");
    tarjeta.className = `tarjeta-integrante ${rolesCss[data.rol] || ""}`;
    tarjeta.innerHTML = `<span>${data.nombre}</span>`;
    contenedor.appendChild(tarjeta);
    total++;
  });

  totalSpan.textContent = total;
}

function asignarClaseRol(rol) {
  const rolesCss = {
    "Scrum Master": "scrum",
    "Desarrollador": "desarrollador",
    "Tester": "tester",
    "Product Owner": "po"
  };
  return rolesCss[rol] || "";
}
function activarFiltroPorRol() {
  const botones = document.querySelectorAll(".filtro-rol");
  const rolesActivos = new Set();

  botones.forEach(btn => {
    btn.addEventListener("click", () => {
      const rolSeleccionado = btn.getAttribute("data-rol");

      if (rolesActivos.has(rolSeleccionado)) {
        rolesActivos.delete(rolSeleccionado);
      } else {
        rolesActivos.add(rolSeleccionado);
      }

      botones.forEach(b => {
        const r = b.getAttribute("data-rol");
        b.classList.toggle("inactiva", rolesActivos.size > 0 && !rolesActivos.has(r));
      });

      const tarjetas = document.querySelectorAll(".tarjeta-integrante");
      tarjetas.forEach(t => {
        const clases = Array.from(t.classList);
        const tieneRol = Array.from(rolesActivos).some(rol =>
          clases.includes(asignarClaseRol(rol))
        );
        t.classList.toggle("gris", rolesActivos.size > 0 && !tieneRol);
      });
    });
  });
}


mostrarTarjetasIntegrantes();
activarFiltroPorRol();
mostrarIntegrantesPorRol();
contarSprintsYBacklogs();
graficarHorasPorSprint();
graficarHorasPorRol();
graficarRetraso();
