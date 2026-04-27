/* ============================================
   TechStore - Search Logic
   Пошук товарів з автодоповненням та історією
   ============================================ */

(function() {
  'use strict';

  const SEARCH_HISTORY_KEY = 'techstore-search-history';
  const MAX_HISTORY_ITEMS = 10;
  const MAX_SUGGESTIONS = 8;
  const DEBOUNCE_DELAY = 250;

  let searchHistory = [];
  let searchTimeout = null;
  let searchDropdown = null;

  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  function init() {
    if (!searchInput) return;

    loadSearchHistory();
    createSearchDropdown();
    setupEventListeners();
  }

  function createSearchDropdown() {
    searchDropdown = document.createElement('div');
    searchDropdown.className = 'search-dropdown';
    searchDropdown.style.display = 'none';

    const searchBar = searchInput.closest('.search-bar');
    if (!searchBar) return;

    searchBar.style.position = 'relative';
    searchBar.appendChild(searchDropdown);
    searchDropdown.addEventListener('click', handleDropdownClick);

    addSearchResultsStyles();
  }

  function setupEventListeners() {
    searchInput.addEventListener('input', event => {
      clearTimeout(searchTimeout);
      const query = event.target.value.trim();

      if (query.length < 2) {
        hideDropdown();
        return;
      }

      searchTimeout = setTimeout(() => {
        showSuggestions(query);
      }, DEBOUNCE_DELAY);
    });

    searchInput.addEventListener('focus', () => {
      if (!searchInput.value.trim() && searchHistory.length > 0) {
        showHistory();
      }
    });

    searchInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        window.performSearch(searchInput.value);
      }
    });

    if (searchBtn) {
      searchBtn.addEventListener('click', () => {
        window.performSearch(searchInput.value);
      });
    }

    document.addEventListener('click', event => {
      if (!searchInput.contains(event.target) && !searchDropdown.contains(event.target)) {
        hideDropdown();
      }
    });
  }

  async function showSuggestions(query) {
    if (!searchDropdown) return;

    try {
      const results = await window.ProductData.searchProducts(query, MAX_SUGGESTIONS);

      if (results.length === 0) {
        searchDropdown.innerHTML = `
          <div class="search-no-results">
            <i class="fas fa-search"></i>
            <p>Нічого не знайдено за запитом "<strong>${escapeHtml(query)}</strong>"</p>
          </div>
        `;
        showDropdown();
        return;
      }

      const lang = window.i18n?.getCurrentLanguage?.() || 'uk';

      searchDropdown.innerHTML = `
        <div class="search-results">
          <div class="search-header">
            <i class="fas fa-search"></i>
            <span>Результати пошуку</span>
          </div>
          ${results.map(product => {
            const name = product.name?.[lang] || product.name?.uk || 'Продукт';
            const image = window.Utils.fixImagePath(product.images?.[0]);
            const depth = window.Utils.getPageDepth();
            const productUrl = depth === 2
              ? `../../products/?id=${product.id}`
              : depth === 1
                ? `./?id=${product.id}`
                : `./products/?id=${product.id}`;

            return `
              <a href="${productUrl}" class="search-result-item">
                <div class="search-result-image">
                  <img src="${image}" alt="${escapeHtml(name)}" onerror="this.src=window.Utils.fixImagePath('assets/images/placeholder.svg')">
                </div>
                <div class="search-result-info">
                  <div class="search-result-name">${highlightQuery(escapeHtml(name), query)}</div>
                  <div class="search-result-category">${escapeHtml(product.brand || '')}</div>
                </div>
                <div class="search-result-price">${window.Utils.formatPrice(product.price)}</div>
              </a>
            `;
          }).join('')}
        </div>
      `;

      showDropdown();
    } catch (error) {
      console.error('Search suggestion error:', error);
      hideDropdown();
    }
  }

  function showHistory() {
    if (!searchDropdown || searchHistory.length === 0) return;

    searchDropdown.innerHTML = `
      <div class="search-history">
        <div class="search-header">
          <i class="fas fa-clock"></i>
          <span>Історія пошуку</span>
          <button class="btn-clear-history" type="button" data-action="clear-search-history">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        ${searchHistory.map((item, index) => `
          <div class="search-history-item">
            <button class="history-query" type="button" data-action="search-history-item" data-query="${escapeHtml(item)}">
              <i class="fas fa-history"></i>
              <span>${escapeHtml(item)}</span>
            </button>
            <button class="btn-remove-history" type="button" data-action="remove-history-item" data-index="${index}">
              <i class="fas fa-times"></i>
            </button>
          </div>
        `).join('')}
      </div>
    `;

    showDropdown();
  }

  function handleDropdownClick(event) {
    const target = event.target.closest('[data-action]');
    if (!target) return;

    const action = target.getAttribute('data-action');

    if (action === 'clear-search-history') {
      clearSearchHistory();
      return;
    }

    if (action === 'search-history-item') {
      const query = target.getAttribute('data-query') || '';
      window.performSearch(query);
      return;
    }

    if (action === 'remove-history-item') {
      const index = Number(target.getAttribute('data-index'));
      removeFromHistory(index);
    }
  }

  window.performSearch = function(query) {
    const safeQuery = String(query || '').trim();

    if (!safeQuery) {
      hideDropdown();
      return;
    }

    addToSearchHistory(safeQuery);

    const isCatalog = /\/catalog\/?$/.test(window.location.pathname) || window.location.pathname.includes('catalog.html');
    const queryUrl = window.Utils.resolvePath(`catalog/?search=${encodeURIComponent(safeQuery)}`);
    const url = isCatalog ? queryUrl : queryUrl;

    window.location.href = url;
  };

  function loadSearchHistory() {
    try {
      const stored = localStorage.getItem(SEARCH_HISTORY_KEY);
      searchHistory = stored ? JSON.parse(stored) : [];
    } catch {
      searchHistory = [];
    }
  }

  function addToSearchHistory(query) {
    searchHistory = searchHistory.filter(item => item.toLowerCase() !== query.toLowerCase());
    searchHistory.unshift(query);

    if (searchHistory.length > MAX_HISTORY_ITEMS) {
      searchHistory = searchHistory.slice(0, MAX_HISTORY_ITEMS);
    }

    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));
  }

  function clearSearchHistory() {
    searchHistory = [];
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    hideDropdown();
    window.TechStore?.showToast('Успішно', 'Історію пошуку очищено');
  }

  function removeFromHistory(index) {
    if (!Number.isInteger(index) || index < 0 || index >= searchHistory.length) return;

    searchHistory.splice(index, 1);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory));

    if (searchHistory.length === 0) {
      hideDropdown();
    } else {
      showHistory();
    }
  }

  function highlightQuery(text, query) {
    const safeQuery = escapeRegExp(query);
    const regex = new RegExp(`(${safeQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = String(text || '');
    return div.innerHTML;
  }

  function showDropdown() {
    searchDropdown.style.display = 'block';
  }

  function hideDropdown() {
    if (searchDropdown) {
      searchDropdown.style.display = 'none';
    }
  }

  function addSearchResultsStyles() {
    if (document.getElementById('search-results-styles')) return;

    const style = document.createElement('style');
    style.id = 'search-results-styles';
    style.textContent = `
      .search-dropdown {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        max-height: 420px;
        overflow-y: auto;
        background: var(--bg-primary);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-lg);
        z-index: 1200;
      }

      .search-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        background: var(--bg-secondary);
        border-bottom: 1px solid var(--border-color);
      }

      .search-result-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        color: inherit;
        text-decoration: none;
        border-bottom: 1px solid var(--border-color);
      }

      .search-result-item:hover {
        background: var(--bg-secondary);
      }

      .search-result-image {
        width: 46px;
        height: 46px;
        border-radius: var(--radius-sm);
        overflow: hidden;
        background: var(--bg-secondary);
      }

      .search-result-image img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .search-result-info {
        min-width: 0;
        flex: 1;
      }

      .search-result-name {
        font-weight: 600;
        font-size: var(--font-size-sm);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .search-result-name mark {
        background: rgba(255, 107, 53, 0.2);
        color: var(--primary-color);
      }

      .search-result-category {
        font-size: var(--font-size-xs);
        color: var(--text-secondary);
      }

      .search-result-price {
        font-weight: 700;
        color: var(--primary-color);
        white-space: nowrap;
      }

      .search-no-results {
        padding: 1.5rem 1rem;
        text-align: center;
        color: var(--text-secondary);
      }

      .search-history-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border-bottom: 1px solid var(--border-color);
      }

      .history-query {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        flex: 1;
        padding: 0.5rem;
        border: none;
        background: transparent;
        text-align: left;
        cursor: pointer;
      }

      .btn-remove-history,
      .btn-clear-history {
        width: 28px;
        height: 28px;
        border: none;
        border-radius: var(--radius-sm);
        background: transparent;
        color: var(--text-secondary);
        cursor: pointer;
      }

      .btn-remove-history:hover,
      .btn-clear-history:hover {
        background: var(--danger-color);
        color: #fff;
      }
    `;

    document.head.appendChild(style);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
