/* ============================================
   TechStore - Internationalization (i18n)
   Multi-language support: UA, EN, RU with JSON files
   ============================================ */

(function() {
  'use strict';

  // ============================================
  // Configuration
  // ============================================
  const LANG_KEY = 'techstore-language';
  const DEFAULT_LANG = 'uk';
  const SUPPORTED_LANGS = ['uk', 'en', 'ru'];
  
  const LANG_MAP = {
    'uk': 'uk',
    'en': 'en',
    'ru': 'ru'
  };

  // ============================================
  // State
  // ============================================
  let currentLang = DEFAULT_LANG;
  let translations = {};
  let fallbackTranslations = {};
  let isLoaded = false;
  let isInitializing = true;

  // ============================================
  // Load Translation File
  // ============================================
  async function loadTranslation(lang) {
    try {
      const depth = window.Utils?.getPageDepth?.() ?? 0;
      const path = depth === 0
        ? './data/translations/'
        : depth === 1
          ? '../data/translations/'
          : '../../data/translations/';
      
      const response = await fetch(`${path}${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${lang}.json`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error loading translation for ${lang}:`, error);
      return null;
    }
  }

  // ============================================
  // Get Saved Language
  // ============================================
  function getSavedLanguage() {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      return saved;
    }
    
    const browserLang = navigator.language.toLowerCase().split('-')[0];
    if (SUPPORTED_LANGS.includes(browserLang)) {
      return browserLang;
    }
    
    return DEFAULT_LANG;
  }

  // ============================================
  // Get Nested Value
  // ============================================
  function getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => 
      current?.[key], obj
    );
  }

  function getTranslationValue(key) {
    return getNestedValue(translations, key) ?? getNestedValue(fallbackTranslations, key);
  }

  // ============================================
  // Translate Element
  // ============================================
  function translateElement(element, key) {
    const translation = getTranslationValue(key);
    
    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return;
    }

    element.textContent = translation;
  }

  // ============================================
  // Translate Placeholder
  // ============================================
  function translatePlaceholder(element, key) {
    const translation = getTranslationValue(key);
    
    if (translation) {
      element.placeholder = translation;
    }
  }

  // ============================================
  // Translate HTML Content
  // ============================================
  function translateHtmlElement(element, key) {
    const translation = getTranslationValue(key);

    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return;
    }

    element.innerHTML = translation;
  }

  // ============================================
  // Translate Attribute
  // ============================================
  function translateAttribute(element, key, attributeName) {
    const translation = getTranslationValue(key);

    if (translation) {
      element.setAttribute(attributeName, translation);
    }
  }

  // ============================================
  // Translate All
  // ============================================
  function translateAll() {
    if (!isLoaded) {
      console.warn('Translations not loaded yet');
      return;
    }

    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      
      if (key === 'language') {
        element.textContent = translations.language || currentLang.toUpperCase();
      } else {
        translateElement(element, key);
      }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      translatePlaceholder(element, key);
    });

    document.querySelectorAll('[data-i18n-html]').forEach(element => {
      const key = element.getAttribute('data-i18n-html');
      translateHtmlElement(element, key);
    });

    document.querySelectorAll('[data-i18n-aria-label]').forEach(element => {
      const key = element.getAttribute('data-i18n-aria-label');
      translateAttribute(element, key, 'aria-label');
    });

    document.querySelectorAll('[data-i18n-content]').forEach(element => {
      const key = element.getAttribute('data-i18n-content');
      translateAttribute(element, key, 'content');
    });

    document.documentElement.lang = currentLang;
    
    window.dispatchEvent(new CustomEvent('translationsLoaded'));
  }

  // ============================================
  // Change Language
  // ============================================
  async function changeLanguage(lang) {
    const mappedLang = LANG_MAP[lang] || lang;
    
    if (!SUPPORTED_LANGS.includes(mappedLang)) {
      console.error(`Unsupported language: ${lang} (mapped: ${mappedLang})`);
      return;
    }

    const data = await loadTranslation(mappedLang);
    if (!data) {
      console.error(`Failed to load language: ${mappedLang}`);
      return;
    }

    if (!Object.keys(fallbackTranslations).length) {
      const fallbackData = await loadTranslation(DEFAULT_LANG);
      if (fallbackData) {
        fallbackTranslations = fallbackData;
      }
    }
    
    translations = data;
    currentLang = mappedLang;
    isLoaded = true;
    localStorage.setItem(LANG_KEY, mappedLang);
    
    translateAll();
    updateLanguageButton();
    showLanguageNotification();
    
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: { language: mappedLang }
    }));

  }

  // ============================================
  // Show Language Change Notification
  // ============================================
  function showLanguageNotification() {
    if (isInitializing) return;
    
    const notificationsEnabled = localStorage.getItem('techstore-language-notifications') !== 'false';
    
    if (!notificationsEnabled) return;

    const languageName = translations.language || currentLang.toUpperCase();
    const changeText = translations.language_changed || 'Language changed to';

    const notification = document.createElement('div');
    notification.className = 'language-notification';
    notification.innerHTML = `
      <i class="fas fa-language"></i>
      <span>${changeText} ${languageName}</span>
    `;

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

    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(10px)';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 2000);
  }

  // ============================================
  // Update Language Button
  // ============================================
  function updateLanguageButton() {
    const langBtn = document.getElementById('languageBtn');
    if (!langBtn) return;

    const langSpan = langBtn.querySelector('[data-i18n="language"]');
    const langText = translations.language || fallbackTranslations.language;
    if (langSpan && langText) {
      langSpan.textContent = langText;
    }
  }

  // ============================================
  // Setup Language Switcher
  // ============================================
  function setupLanguageSwitcher() {
    const langBtn = document.getElementById('languageBtn');
    const langDropdown = document.getElementById('languageDropdown');

    if (!langBtn || !langDropdown) {
      console.warn('Language switcher elements not found');
      return;
    }

    langBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      langDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!langBtn.contains(e.target) && !langDropdown.contains(e.target)) {
        langDropdown.classList.remove('active');
      }
    });

    langDropdown.querySelectorAll('button[data-lang]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const lang = btn.getAttribute('data-lang');
        
        if (lang) {
          await changeLanguage(lang);
          langDropdown.classList.remove('active');
        }
      });
    });

  }

  // ============================================
  // Get Translation (t function)
  // ============================================
  function t(key) {
    if (!isLoaded) {
      console.warn('Translations not loaded');
      return key;
    }

    const translation = getTranslationValue(key);
    if (!translation) {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
    
    return translation;
  }

  // ============================================
  // Initialize
  // ============================================
  async function init() {
    const savedLang = getSavedLanguage();
    await changeLanguage(savedLang);
    setupLanguageSwitcher();
    
    isInitializing = false;

  }

  // ============================================
  // Public API
  // ============================================
  window.i18n = {
    t,
    changeLanguage,
    getCurrentLanguage: () => currentLang,
    getSupportedLanguages: () => [...SUPPORTED_LANGS],
    isLoaded: () => isLoaded
  };

  // ============================================
  // Auto Initialize
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
