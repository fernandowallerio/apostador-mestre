document.addEventListener('DOMContentLoaded', () => {
  if (window.BatalhaEspacial && typeof window.BatalhaEspacial.init === 'function') {
    window.BatalhaEspacial.init();
  }
});
