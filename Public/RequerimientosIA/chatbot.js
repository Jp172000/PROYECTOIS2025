// ----- CONFIGURACIÓN -----
// Importar funciones de Firebase
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Inicializar Firebase con la configuración del proyecto (reemplaza con tu config real)
const firebaseConfig = {
  apiKey: "AIzaSyALm01oDooHTXgAQCc-ARLlMA9k5wNbv4I", // Reemplaza con tu clave API
  authDomain: "proyectois2025-50ffc.firebaseapp.com", // Reemplaza con tu dominio
  projectId: "proyectois2025-50ffc", // Reemplaza con tu ID de proyecto
  storageBucket: "proyectois2025-50ffc.appspot.com", // Reemplaza con tu bucket
  messagingSenderId: "1064338863726", // Reemplaza con tu sender ID
  appId: "1:1064338863726:web:a9902af09d45b7a0c0d87f" // Reemplaza con tu App ID
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const HUGGINGFACE_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3";
const HUGGINGFACE_TOKEN = "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"; // Reemplaza por tu token real

// Obtener referencias a los elementos del DOM
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendButton = document.getElementById("sendButton");

// Función para añadir un mensaje a la caja de chat
function addMessage(text, sender) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", `${sender}-message`);
  messageDiv.textContent = text;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// Nueva función: obtener datos de un sprint por nombre desde Firestore
async function getSprintDataByName(sprintName) {
  try {
    const q = query(collection(db, "Sprints"), where("nombre", "==", sprintName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    } else {
      return null; // No se encontró el sprint
    }
  } catch (error) {
    console.error("Error al obtener datos del sprint:", error);
    return null;
  }
}

// Nueva función: obtener datos de un backlog por nombre desde Firestore
async function getBacklogDataByName(backlogName) {
  try {
    const q = query(collection(db, "Backlogs"), where("nombre", "==", backlogName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    } else {
      return null; // No se encontró el backlog
    }
  } catch (error) {
    console.error("Error al obtener datos del backlog:", error);
    return null;
  }
}

// Nueva función: obtener datos de un integrante por nombre desde Firestore
async function getIntegranteDataByName(integranteName) {
  try {
    const q = query(collection(db, "Integrantes"), where("nombre", "==", integranteName));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    } else {
      return null; // No se encontró el integrante
    }
  } catch (error) {
    console.error("Error al obtener datos del integrante:", error);
    return null;
  }
}

// Nueva función: obtener todos los integrantes desde Firestore
async function getAllIntegrantesData() {
  try {
    const querySnapshot = await getDocs(collection(db, "Integrantes"));
    const integrantes = [];
    querySnapshot.forEach(docSnap => integrantes.push(docSnap.data()));
    return integrantes;
  } catch (error) {
    console.error("Error al obtener datos de integrantes:", error);
    return [];
  }
}

// Nueva función: enviar el mensaje a la IA de Hugging Face
async function sendMessageToAI(message) {
  try {
    // Mostrar en consola que se envía
    console.log("Enviando a Hugging Face:", message);

    // Construir el cuerpo de la petición
    const body = {inputs: message,
    // Añadir parámetros para controlar la generación si es necesario (opcional)
    // parameters: { max_new_tokens: 150, temperature: 0.7 }
};

    // Hacer el fetch
    const response = await fetch(HUGGINGFACE_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${HUGGINGFACE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Error de red: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    // La respuesta suele estar en data[0].generated_text (revisa el formato real devuelto)
    const aiText = data?.[0]?.generated_text || "No pude generar una respuesta. Intenta de nuevo.";
    return aiText;
  } catch (error) {
    console.error("Error al consultar Hugging Face:", error);
    return "Ocurrió un error al consultar la IA. Intenta más tarde.";
  }
}

// Función para manejar el envío del mensaje
async function handleSendMessage() {
  const message = userInput.value.trim();
  let promptMessage = message; // Inicialmente el prompt es solo el mensaje del usuario
  let contextData = null;
  let detectedIntent = null; // Usamos 'detectedIntent' para ser más claros
  if (message === "") return;

  addMessage(message, "user");
  userInput.value = "";
  addMessage("...", "bot"); // Mensaje de espera

  const lowerCaseMessage = message.toLowerCase();

  // --- Lógica para detectar intenciones y obtener datos ---

  // 1. Intentar detectar si pregunta por una entidad específica (Sprint, Backlog, Integrante)
  const sprintMatch = lowerCaseMessage.match(/sprint\s+([^.\s]+)/);
  const backlogMatch = lowerCaseMessage.match(/backlog\s+([^.\s]+)/);
  const integranteMatch = lowerCaseMessage.match(/integrante\s+([^.\s]+)|miembro\s+([^.\s]+)/);

  if (sprintMatch && sprintMatch[1]) {
    const sprintName = sprintMatch[1];
    const sprintData = await getSprintDataByName(sprintName);
    if (sprintData) {
      contextData = { type: "sprint", data: sprintData, name: sprintName };
      detectedIntent = "specific_entity";
      // Format sprint data for AI
 promptMessage = `Según los siguientes datos del sprint '${sprintName}':\n` +
 `- Estado: ${sprintData.estado || 'No especificado'}\n` +
 `- Fecha Inicio: ${sprintData.fechaInicio || 'No especificada'}\n` +
 `- Fecha Fin: ${sprintData.fechaFin || 'No especificada'}\n` +
 `Responde a la pregunta del usuario utilizando exclusivamente esta información: ${message}`;
    }
  } else if (backlogMatch && backlogMatch[1]) {
    const backlogName = backlogMatch[1];
    const backlogData = await getBacklogDataByName(backlogName);
    if (backlogData) {
      contextData = { type: "backlog", data: backlogData, name: backlogName };
      detectedIntent = "specific_entity";
      promptMessage = `Basado en los siguientes datos del backlog '${backlogName}': ${JSON.stringify(backlogData)}, responde a la pregunta del usuario: ${message}`;
    }
  } else if (integranteMatch && (integranteMatch[1] || integranteMatch[2])) {
    const integranteName = integranteMatch[1] || integranteMatch[2];
    const integranteData = await getIntegranteDataByName(integranteName);
    if (integranteData) {
      contextData = { type: "integrante", data: integranteData, name: integranteName };
      detectedIntent = "specific_entity";
      promptMessage = `Basado en los siguientes datos del integrante '${integranteName}': ${JSON.stringify(integranteData)}, responde a la pregunta del usuario: ${message}`;
    } else {
      // Si no se encontró el integrante por nombre, pero se preguntó por integrante/miembro,
      // tal vez pregunta algo general sobre integrantes o roles.
      if (lowerCaseMessage.includes("rol") || lowerCaseMessage.includes("equipo")) {
        const allIntegrantes = await getAllIntegrantesData();
        if (allIntegrantes && allIntegrantes.length > 0) {
          contextData = { type: "integrantes", data: allIntegrantes };
          detectedIntent = "general_info";
          promptMessage = `Basado en los siguientes datos de todos los integrantes: ${JSON.stringify(allIntegrantes)}, responde a la pregunta del usuario: ${message}`;
        }
      }
    }
  }

  // 2. Si no detectó una entidad específica o información general con contexto, verificar si pide una definición
  if (!detectedIntent && (lowerCaseMessage.includes("qué es un") || lowerCaseMessage.includes("que es un") || lowerCaseMessage.startsWith("define "))) {
    if (lowerCaseMessage.includes("sprint")) {
      promptMessage = "Define qué es un Sprint en la gestión de proyectos.";
      detectedIntent = "definition";
    } else if (lowerCaseMessage.includes("backlog")) {
      promptMessage = "Define qué es un Backlog en la gestión de proyectos.";
      detectedIntent = "definition";
    } else if (lowerCaseMessage.includes("equipo") || lowerCaseMessage.includes("integrantes")) {
       // Si pregunta por la definición de equipo/integrantes y no detectó un integrante específico
       promptMessage = "Define qué es un equipo de proyecto o los integrantes en la gestión ágil.";
       detectedIntent = "definition";
    }
  }

  // Función auxiliar para enviar al AI después de obtener datos (si es necesario)
  async function sendToAI(messageToSend) {
    try {
      const aiResponse = await sendMessageToAI(messageToSend);
      if (chatBox.lastChild && chatBox.lastChild.textContent === "...") {
        chatBox.lastChild.textContent = aiResponse;
        chatBox.lastChild.classList.add("bot-message");
      } else {
        addMessage(aiResponse, "bot");
      }
    } catch (error) {
      console.error("Error al obtener respuesta:", error);
      if (chatBox.lastChild && chatBox.lastChild.textContent === "...") {
        chatBox.lastChild.textContent = "Error al obtener respuesta.";
        chatBox.lastChild.classList.add("bot-message");
      } else {
        addMessage("Error al obtener respuesta.", "bot");
      }
    }
  }

  // 3. Si no se detectó ninguna intención específica (entidad o definición), usar el mensaje original
  // El promptMessage ya está configurado correctamente en cada caso.

  // Enviar el prompt message a la IA
  sendToAI(promptMessage);
}

// Event listeners
sendButton.addEventListener("click", handleSendMessage);
userInput.addEventListener("keypress", function(event) {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSendMessage();
  }
});
