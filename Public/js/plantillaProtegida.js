import { escucharCambiosSesion, cerrarSesion } from "./auth.js";

window.toggleDropdown = function () {
  const menu = document.getElementById("dropdownMenu");
  if (menu) {
    const isVisible = menu.style.display === "block";
    menu.style.display = isVisible ? "none" : "block";
  }
};

escucharCambiosSesion((user) => {
  const userArea = document.getElementById("userArea");
  if (!userArea) return;

  if (user) {
    userArea.innerHTML = `
      <div class="usuario-dropdown" onclick="toggleDropdown()">
        Hola, ${user.displayName} ⬇
        <div class="dropdown-menu" id="dropdownMenu">
          <button id="cerrarSesion" type="button">Cerrar sesión</button>
        </div>
      </div>
    `;

    setTimeout(() => {
      const btn = document.getElementById("cerrarSesion");
      btn?.addEventListener("click", async () => {
        await cerrarSesion();
        window.location.href = "/index.html";
      });
    }, 50);

  } else {
    window.location.href = "/index.html";
  }
});