/* ============================================
   TechStore - Utility Functions
   Спільні функції для всього проекту
   ============================================ */

(function() {
  'use strict';

  // ============================================
  // IMAGE UTILITIES
  // ============================================

  /**
   * Визначає глибину поточної сторінки відносно кореня проекту.
   * 0 = корінь (index.html), 1 = вкладені сторінки (/catalog/, /product/, ...)
   */
  function getProjectPathSegments() {
    const normalized = window.location.pathname.replace(/\/+$/, '');
    const segments = normalized.split('/').filter(Boolean);

    if (segments.length === 0) return segments;

    const knownTopLevel = new Set([
      'index.html',
      '404.html',
      'about',
      'cart',
      'catalog',
      'checkout',
      'compare',
      'contacts',
      'favorites',
      'order-success',
      'product',
      'products',
      'assets',
      'data'
    ]);

    // GitHub Pages project site path: /<repo-name>/...
    if (window.location.hostname.endsWith('github.io') && !knownTopLevel.has(segments[0])) {
      return segments.slice(1);
    }

    return segments;
  }

  function getPageDepth() {
    const segments = getProjectPathSegments();
    if (segments.length === 0) return 0;
    return 1;
  }

  function getPathPrefix() {
    const depth = getPageDepth();
    if (depth <= 0) return './';
    return '../'.repeat(depth);
  }

  function resolvePath(path) {
    const value = String(path || '');
    if (!value) return getPathPrefix();
    if (/^(https?:|data:|mailto:|tel:|#)/i.test(value)) return value;

    const cleaned = value.replace(/^\/+/, '');
    if (!cleaned) return getPathPrefix();
    return getPathPrefix() + cleaned;
  }

  /**
   * Виправляє шлях до зображення для правильного відображення.
   * Глибина визначається автоматично по pathname.
   * @param {string|array} imagePath - Шлях до зображення або масив шляхів
   * @returns {string} Виправлений шлях
   */
  function fixImagePath(imagePath) {
    const depth = getPageDepth();
    const placeholder = depth === 0
      ? './assets/images/placeholder.svg'
      : depth === 1
        ? '../assets/images/placeholder.svg'
        : '../images/placeholder.svg';

    if (!imagePath) return placeholder;

    if (Array.isArray(imagePath)) {
      imagePath = imagePath[0] || placeholder;
    }

    imagePath = String(imagePath);

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    if (imagePath.startsWith('data:')) return imagePath;
    if (imagePath.startsWith('/')) imagePath = imagePath.substring(1);

    if (imagePath.startsWith('assets/')) {
      if (depth === 0) return './' + imagePath;
      if (depth === 1) return '../' + imagePath;
      return imagePath.replace('assets/', '../');
    }

    if (imagePath.startsWith('../')) {
      if (depth === 0) return imagePath.replace(/^\.\.\//, './assets/');
      if (depth === 1) return '../assets/' + imagePath.replace(/^\.\.\//, '');
      return imagePath;
    }

    if (depth === 0) return './assets/' + imagePath;
    if (depth === 1) return '../assets/' + imagePath;
    return '../' + imagePath;
  }

  // ============================================
  // PRICE UTILITIES
  // ============================================

  /**
   * Форматує ціну в українському форматі
   * @param {number} price - Ціна
   * @param {string} currency - Валюта (за замовчуванням ₴)
   * @returns {string} Відформатована ціна
   */
  function formatPrice(price, currency = '₴') {
    if (typeof price !== 'number' || isNaN(price)) {
      return `0 ${currency}`;
    }
    return `${price.toLocaleString('uk-UA')} ${currency}`;
  }

  /**
   * Розраховує ціну зі знижкою
   * @param {number} price - Початкова ціна
   * @param {number} discount - Знижка у відсотках
   * @returns {number} Ціна зі знижкою
   */
  function calculateDiscountPrice(price, discount) {
    if (discount <= 0 || discount > 100) return price;
    return Math.round(price - (price * discount / 100));
  }

  /**
   * Розраховує суму знижки
   * @param {number} price - Початкова ціна
   * @param {number} discount - Знижка у відсотках
   * @returns {number} Сума знижки
   */
  function calculateDiscountAmount(price, discount) {
    if (discount <= 0 || discount > 100) return 0;
    return Math.round(price * discount / 100);
  }

  // ============================================
  // DATE/TIME UTILITIES
  // ============================================

  /**
   * Форматує дату в українському форматі
   * @param {Date|string|number} date - Дата
   * @param {object} options - Опції форматування
   * @returns {string} Відформатована дата
   */
  function formatDate(date, options = {}) {
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    
    const dateObj = date instanceof Date ? date : new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return dateObj.toLocaleDateString('uk-UA', { ...defaultOptions, ...options });
  }

  /**
   * Форматує відносний час (наприклад, "2 години тому")
   * @param {Date|string|number} date - Дата
   * @returns {string} Відносний час
   */
  function formatRelativeTime(date) {
    const dateObj = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);
    
    if (diffInSeconds < 60) return 'щойно';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} хв тому`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} год тому`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} дн тому`;
    
    return formatDate(dateObj);
  }

  // ============================================
  // VALIDATION UTILITIES
  // ============================================

  /**
   * Валідує email адресу
   * @param {string} email - Email адреса
   * @returns {boolean} true якщо валідний
   */
  function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(String(email).toLowerCase());
  }

  /**
   * Валідує номер телефону
   * @param {string} phone - Номер телефону
   * @returns {boolean} true якщо валідний
   */
  function validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 13;
  }

  /**
   * Перевіряє чи поле порожнє
   * @param {string} value - Значення поля
   * @returns {boolean} true якщо не порожнє
   */
  function validateRequired(value) {
    return String(value).trim().length > 0;
  }

  /**
   * Валідує довжину рядка
   * @param {string} value - Значення
   * @param {number} min - Мінімальна довжина
   * @param {number} max - Максимальна довжина
   * @returns {boolean} true якщо валідний
   */
  function validateLength(value, min = 0, max = Infinity) {
    const length = String(value).trim().length;
    return length >= min && length <= max;
  }

  // ============================================
  // STRING UTILITIES
  // ============================================

  /**
   * Перетворює рядок в slug (URL-friendly)
   * @param {string} text - Текст
   * @returns {string} Slug
   */
  function slugify(text) {
    return String(text)
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Обрізає текст до певної довжини
   * @param {string} text - Текст
   * @param {number} length - Максимальна довжина
   * @param {string} suffix - Суфікс (за замовчуванням ...)
   * @returns {string} Обрізаний текст
   */
  function truncate(text, length = 100, suffix = '...') {
    if (String(text).length <= length) return text;
    return String(text).substring(0, length).trim() + suffix;
  }

  /**
   * Capitalize першу літеру
   * @param {string} text - Текст
   * @returns {string} Текст з великою першою літерою
   */
  function capitalize(text) {
    return String(text).charAt(0).toUpperCase() + String(text).slice(1).toLowerCase();
  }

  /**
   * Екранує HTML символи
   * @param {string} text - Текст
   * @returns {string} Екранований текст
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // NUMBER UTILITIES
  // ============================================

  /**
   * Обмежує число в діапазоні
   * @param {number} value - Значення
   * @param {number} min - Мінімум
   * @param {number} max - Максимум
   * @returns {number} Обмежене значення
   */
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Генерує випадкове число в діапазоні
   * @param {number} min - Мінімум
   * @param {number} max - Максимум
   * @returns {number} Випадкове число
   */
  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * Округлює число до певної кількості десяткових знаків
   * @param {number} value - Значення
   * @param {number} decimals - Кількість десяткових знаків
   * @returns {number} Округлене значення
   */
  function roundTo(value, decimals = 2) {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }

  // ============================================
  // ARRAY UTILITIES
  // ============================================

  /**
   * Перемішує масив (Fisher-Yates shuffle)
   * @param {array} array - Масив
   * @returns {array} Перемішаний масив
   */
  function shuffle(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  /**
   * Видаляє дублікати з масиву
   * @param {array} array - Масив
   * @param {string} key - Ключ для порівняння (для масиву об'єктів)
   * @returns {array} Масив без дублікатів
   */
  function unique(array, key = null) {
    if (!key) {
      return [...new Set(array)];
    }
    
    const seen = new Set();
    return array.filter(item => {
      const value = item[key];
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    });
  }

  /**
   * Розбиває масив на частини певного розміру
   * @param {array} array - Масив
   * @param {number} size - Розмір частини
   * @returns {array} Масив масивів
   */
  function chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // ============================================
  // PERFORMANCE UTILITIES
  // ============================================

  /**
   * Debounce функція - затримує виконання
   * @param {function} func - Функція для debounce
   * @param {number} wait - Час затримки в мс
   * @returns {function} Debounced функція
   */
  function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Throttle функція - обмежує частоту виконання
   * @param {function} func - Функція для throttle
   * @param {number} limit - Мінімальний інтервал в мс
   * @returns {function} Throttled функція
   */
  function throttle(func, limit = 300) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // ============================================
  // DOM UTILITIES
  // ============================================

  /**
   * Перевіряє чи елемент видимий у viewport
   * @param {HTMLElement} element - Елемент
   * @param {number} offset - Offset в пікселях
   * @returns {boolean} true якщо видимий
   */
  function isInViewport(element, offset = 0) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= -offset &&
      rect.left >= -offset &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + offset &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) + offset
    );
  }

  /**
   * Плавний scroll до елемента
   * @param {HTMLElement|string} element - Елемент або селектор
   * @param {number} offset - Offset в пікселях
   */
  function scrollToElement(element, offset = 100) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    
    const top = el.offsetTop - offset;
    window.scrollTo({
      top: top,
      behavior: 'smooth'
    });
  }

  /**
   * Копіює текст в clipboard
   * @param {string} text - Текст для копіювання
   * @returns {Promise<boolean>} true якщо успішно
   */
  async function copyToClipboard(text) {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      
      // Fallback для старих браузерів
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      console.error('Failed to copy:', err);
      return false;
    }
  }

  // ============================================
  // STORAGE UTILITIES
  // ============================================

  /**
   * Зберігає дані в localStorage з JSON парсингом
   * @param {string} key - Ключ
   * @param {*} value - Значення
   * @returns {boolean} true якщо успішно
   */
  function setStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (err) {
      console.error('Storage error:', err);
      return false;
    }
  }

  /**
   * Отримує дані з localStorage з JSON парсингом
   * @param {string} key - Ключ
   * @param {*} defaultValue - Значення за замовчуванням
   * @returns {*} Значення
   */
  function getStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (err) {
      console.error('Storage error:', err);
      return defaultValue;
    }
  }

  /**
   * Видаляє дані з localStorage
   * @param {string} key - Ключ
   * @returns {boolean} true якщо успішно
   */
  function removeStorage(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (err) {
      console.error('Storage error:', err);
      return false;
    }
  }

  // ============================================
  // URL UTILITIES
  // ============================================

  /**
   * Отримує параметри з URL
   * @param {string} url - URL (за замовчуванням поточний)
   * @returns {object} Об'єкт з параметрами
   */
  function getUrlParams(url = window.location.search) {
    const params = new URLSearchParams(url);
    const result = {};
    for (const [key, value] of params) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Оновлює URL параметри без перезавантаження
   * @param {object} params - Об'єкт з параметрами
   * @param {boolean} replace - Використати replaceState замість pushState
   */
  function updateUrlParams(params, replace = true) {
    const url = new URL(window.location);
    Object.keys(params).forEach(key => {
      if (params[key] === null || params[key] === undefined) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, params[key]);
      }
    });
    
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({}, '', url);
  }

  // ============================================
  // SHOP CONSTANTS
  // ============================================
  const FREE_DELIVERY_THRESHOLD = 1000;

  const PROMO_CODES = [
    { code: 'TECH2026', discount: 10 },
    { code: 'NEWUSER', discount: 15 },
    { code: 'SPRING2026', discount: 20 }
  ];

  // ============================================
  // EXPORT TO GLOBAL
  // ============================================

  window.Utils = {
    // Image
    fixImagePath,
    getPageDepth,
    getPathPrefix,
    resolvePath,
    
    // Price
    formatPrice,
    calculateDiscountPrice,
    calculateDiscountAmount,
    
    // Date/Time
    formatDate,
    formatRelativeTime,
    
    // Validation
    validateEmail,
    validatePhone,
    validateRequired,
    validateLength,
    
    // String
    slugify,
    truncate,
    capitalize,
    escapeHtml,
    
    // Number
    clamp,
    randomInt,
    roundTo,
    
    // Array
    shuffle,
    unique,
    chunk,
    
    // Performance
    debounce,
    throttle,
    
    // DOM
    isInViewport,
    scrollToElement,
    copyToClipboard,
    
    // Storage
    setStorage,
    getStorage,
    removeStorage,
    
    // URL
    getUrlParams,
    updateUrlParams,

    // Shop constants
    FREE_DELIVERY_THRESHOLD,
    PROMO_CODES
  };



})();
