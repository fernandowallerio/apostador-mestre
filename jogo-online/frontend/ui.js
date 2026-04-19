document.addEventListener("DOMContentLoaded", () => {
    if (window.BatalhaEspacial && typeof window.BatalhaEspacial.inicializar === "function") {
        window.BatalhaEspacial.inicializar();
    } else {
        console.error("BatalhaEspacial não encontrada.");
    }
});
