import {
  iniciarSesion,
  escucharCambiosSesion
} from "./auth.js";

escucharCambiosSesion((user) => {
  if (user) {
    console.log("✅ Usuario activo:", user.displayName);
    window.location.href = "/DashboardAvance/Dashboard.html";
  } else {
    console.log("❌ No hay sesión activa");
  }
});

document.getElementById("btnLogin")?.addEventListener("click", async () => {
  try {
    await iniciarSesion();
  } catch (error) {
    console.error("❌ Error al iniciar sesión:", error);
  }
});