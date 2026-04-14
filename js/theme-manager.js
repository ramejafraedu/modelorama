/**
 * Theme Manager - Sistema de temas Claro/Oscuro
 * Maneja la persistencia y transición entre temas
 */

class ThemeManager {
  constructor() {
    this.STORAGE_KEY = 'modelorama-theme';
    this.currentTheme = 'light';
    this.init();
  }

  init() {
    // Cargar tema guardado o detectar preferencia del sistema
    const savedTheme = localStorage.getItem(this.STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    this.currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    this.applyTheme(this.currentTheme);

    // Escuchar cambios en preferencia del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(this.STORAGE_KEY)) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }

  setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      console.error('[ThemeManager] Tema inválido:', theme);
      return;
    }

    this.currentTheme = theme;
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.applyTheme(theme);

    // Disparar evento para que otros componentes se enteren
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme } 
    }));
  }

  applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    // Actualizar meta theme-color para móviles
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#053674');
    }

    // Actualizar icono del botón si existe
    this.updateToggleIcon(theme);
  }

  toggle() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  updateToggleIcon(theme) {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;

    const icon = toggleBtn.querySelector('i');
    if (icon) {
      icon.className = theme === 'light' ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
    }
    toggleBtn.setAttribute('title', theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro');
  }

  getCurrentTheme() {
    return this.currentTheme;
  }
}

// Crear instancia global
window.themeManager = new ThemeManager();

// Helper global para toggle
window.toggleTheme = () => {
  if (window.themeManager) {
    window.themeManager.toggle();
  }
};
