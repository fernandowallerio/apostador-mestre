document.addEventListener("DOMContentLoaded", () => {
    if (window.BatalhaEspacial && typeof window.BatalhaEspacial.inicializar === "function") {
        window.BatalhaEspacial.inicializar();
    }
});
