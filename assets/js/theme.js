/* ============================================
   TechStore - Theme Switcher
   Light/Dark Theme Toggle with LocalStorage
   ============================================ */

(function() {
  'use strict';

  // ============================================
  // Configuration
  // ============================================
  const THEME_KEY = 'techstore-theme';
  const THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
  };

  // ============================================
  // DOM Elements
  // ============================================
  const themeToggle = document.getElementById('themeToggle');
  const html = document.documentElement;
  const body = document.body;

  // ============================================
  // Get Saved Theme or System Preference
  // ============================================
  function getSavedTheme() {
    // Check localStorage first
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      return savedTheme;
    }

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return THEMES.DARK;
    }

    // Default to light theme
    return THEMES.LIGHT;
  }

  // ============================================
  // Apply Theme
  // ============================================
  function applyTheme(theme, withTransition = true) {
    // Add transition class for smooth switch
    if (withTransition) {
      html.classList.add('theme-switching');
    }

    // Set theme attribute
    html.setAttribute('data-theme', theme);

    // Update icon
    updateThemeIcon(theme);

    // Save to localStorage
    localStorage.setItem(THEME_KEY, theme);

    // Remove transition class after animation
    if (withTransition) {
      setTimeout(() => {
        html.classList.remove('theme-switching');
      }, 300);
    }

    // Dispatch custom event for other scripts
    window.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: { theme } 
    }));

  }

  // ============================================
  // Update Theme Icon
  // ============================================
  function updateThemeIcon(theme) {
    if (!themeToggle) return;

    const icon = themeToggle.querySelector('i');
    if (!icon) return;

    if (theme === THEMES.DARK) {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
      themeToggle.setAttribute('aria-label', 'Switch to light theme');
    } else {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
      themeToggle.setAttribute('aria-label', 'Switch to dark theme');
    }
  }

  // ============================================
  // Toggle Theme
  // ============================================
  function toggleTheme() {
    const currentTheme = html.getAttribute('data-theme') || THEMES.LIGHT;
    const newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    
    applyTheme(newTheme, true);

    // Add animation to button
    if (themeToggle) {
      themeToggle.style.transform = 'scale(0.9)';
      setTimeout(() => {
        themeToggle.style.transform = 'scale(1)';
      }, 150);
    }

    // Show notification (optional)
    showThemeNotification(newTheme);
  }

  // ============================================
  // Show Theme Change Notification
  // ============================================
  function showThemeNotification(theme) {
    // Check if notifications are enabled
    const notificationsEnabled = localStorage.getItem('techstore-theme-notifications') !== 'false';
    
    if (!notificationsEnabled) return;

    // Wait for translations to be loaded
    if (!window.i18n || !window.i18n.isLoaded()) {
      setTimeout(() => showThemeNotification(theme), 100);
      return;
    }

    const themeName = theme === THEMES.DARK 
      ? window.i18n.t('theme_dark') 
      : window.i18n.t('theme_light');
    const themeEnabled = window.i18n.t('theme_enabled');

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'theme-notification';
    notification.innerHTML = `
      <i class="fas fa-${theme === THEMES.DARK ? 'moon' : 'sun'}"></i>
      <span>${themeName} ${themeEnabled}</span>
    `;

    // Add styles
    Object.assign(notification.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      padding: '12px 20px',
      background: 'var(--bg-secondary)',
      border: '2px solid var(--border-color)',
      borderRadius: 'var(--radius-full)',
      fontSize: 'var(--font-size-sm)',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      zIndex: '10001',
      opacity: '0',
      transform: 'translateY(10px)',
      transition: 'all 0.3s ease',
      boxShadow: 'var(--shadow-lg)'
    });

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);

    // Animate out and remove
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(10px)';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 2000);
  }

  // ============================================
  // Listen for System Theme Changes
  // ============================================
  function watchSystemTheme() {
    if (!window.matchMedia) return;

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    darkModeQuery.addEventListener('change', (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const hasManualPreference = localStorage.getItem(THEME_KEY);
      
      if (!hasManualPreference) {
        const newTheme = e.matches ? THEMES.DARK : THEMES.LIGHT;
        applyTheme(newTheme, true);
      }
    });
  }

  // ============================================
  // Keyboard Shortcut (Ctrl/Cmd + K)
  // ============================================
  function setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+K or Cmd+K
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleTheme();
      }
    });
  }

  // ============================================
  // Get Current Theme
  // ============================================
  function getCurrentTheme() {
    return html.getAttribute('data-theme') || THEMES.LIGHT;
  }

  // ============================================
  // Check if Dark Theme
  // ============================================
  function isDarkTheme() {
    return getCurrentTheme() === THEMES.DARK;
  }

  // ============================================
  // Force Theme (useful for testing)
  // ============================================
  function forceTheme(theme) {
    if (theme !== THEMES.LIGHT && theme !== THEMES.DARK) {
      console.error('Invalid theme. Use "light" or "dark"');
      return;
    }
    applyTheme(theme, false);
  }

  // ============================================
  // Reset Theme to System Default
  // ============================================
  function resetTheme() {
    localStorage.removeItem(THEME_KEY);
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches 
      ? THEMES.DARK 
      : THEMES.LIGHT;
    applyTheme(systemTheme, true);
  }

  // ============================================
  // Initialize Theme
  // ============================================
  function initTheme() {
    // Get saved or system theme
    const theme = getSavedTheme();
    
    // Apply theme immediately (without transition on page load)
    applyTheme(theme, false);

    // Add click event to toggle button
    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    // Watch for system theme changes
    watchSystemTheme();

    // Setup keyboard shortcut
    setupKeyboardShortcut();

  }

  // ============================================
  // Prevent Flash of Wrong Theme (FOUT)
  // ============================================
  function preventFlash() {
    // This should be called as early as possible
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      html.setAttribute('data-theme', savedTheme);
    }
  }

  // ============================================
  // Public API
  // ============================================
  window.ThemeManager = {
    toggle: toggleTheme,
    getCurrentTheme: getCurrentTheme,
    isDarkTheme: isDarkTheme,
    forceTheme: forceTheme,
    resetTheme: resetTheme,
    THEMES: THEMES
  };

  // ============================================
  // Initialize on DOM Ready
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTheme);
  } else {
    initTheme();
  }

  // Prevent flash immediately
  preventFlash();

  // ============================================
  // Handle Page Visibility (save battery)
  // ============================================

  // ============================================
  // Cleanup on Page Unload
  // ============================================
  window.addEventListener('beforeunload', () => {
    // Save current theme one last time
    const currentTheme = getCurrentTheme();
    localStorage.setItem(THEME_KEY, currentTheme);
  });

})();
