/* ============================================
   TechStore - Main JavaScript (з Utils)
   Core functionality для всіх сторінок
   ============================================ */

(function() {
  'use strict';

  // ============================================
  // Demo Analytics (localStorage + console)
  // ============================================
  function trackEvent(event, payload = {}) {
    try {
      const key = 'techstore-analytics-events';
      const current = Utils.getStorage(key, []);
      const next = Array.isArray(current) ? current : [];

      next.push({
        event,
        payload,
        page: window.location.pathname,
        ts: new Date().toISOString()
      });

      if (next.length > 300) {
        next.splice(0, next.length - 300);
      }

      Utils.setStorage(key, next);

    } catch (err) {
      console.warn('Analytics tracking failed:', err);
    }
  }

  // ============================================
  // Mobile Menu
  // ============================================
  function initMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const menu = document.getElementById('navMenu');

    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      menu.classList.toggle('active');
      toggle.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });

    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        menu.classList.remove('active');
        toggle.classList.remove('active');
        document.body.classList.remove('menu-open');
      });
    });

    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !toggle.contains(e.target)) {
        menu.classList.remove('active');
        toggle.classList.remove('active');
        document.body.classList.remove('menu-open');
      }
    });
  }

  // ============================================
  // Update Cart Count
  // ============================================
  function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    document.querySelectorAll('#cartCount').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  // ============================================
  // Update Favorites Count
  // ============================================
  function updateFavoritesCount() {
    const favorites = getFavorites();
    const count = favorites.length;
    
    document.querySelectorAll('#favoritesCount').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  // ============================================
  // Compare Management
  // ============================================
  function getCompareItems() {
    return Utils.getStorage('techstore-compare-items', []);
  }

  function updateCompareCount() {
    const compareItems = getCompareItems();
    const count = compareItems.length;

    document.querySelectorAll('#compareCount').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  function initCompareHeaderButton() {
    const compareBtn = document.getElementById('compareHeaderBtn');
    if (!compareBtn) return;

    compareBtn.addEventListener('click', () => {
      window.location.href = Utils.resolvePath('/compare/');
    });
  }

  // ============================================
  // Cart Management
  // ============================================
  function getCart() {
    return Utils.getStorage('techstore-cart', []);
  }

  function saveCart(cart) {
    Utils.setStorage('techstore-cart', cart);
    updateCartCount();
  }

  function addToCart(product, quantity = 1) {
    const cart = getCart();
    const existing = cart.find(item => item.id === product.id);

    const lang = window.i18n?.getCurrentLanguage?.() || 'uk';
    const name = product.name?.[lang] || product.name?.uk || product.name || 'Продукт';
    
    const image = Utils.fixImagePath(product.images?.[0] || product.image);

    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: image,
        category: product.category,
        quantity: quantity
      });
    }

    saveCart(cart);
    showToast('Товар додано до кошика', `${name} (${quantity} шт.)`);
    trackEvent('add_to_cart', { productId: product.id, category: product.category, quantity });
  }

  function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
  }

  function updateCartItemQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.find(item => item.id === productId);
    
    if (item) {
      if (quantity <= 0) {
        removeFromCart(productId);
      } else {
        item.quantity = quantity;
        saveCart(cart);
      }
    }
  }

  function clearCart() {
    Utils.removeStorage('techstore-cart');
    updateCartCount();
  }

  // ============================================
  // Favorites Management
  // ============================================
  function getFavorites() {
    return Utils.getStorage('techstore-favorites', []);
  }

  function saveFavorites(favorites) {
    Utils.setStorage('techstore-favorites', favorites);
    updateFavoritesCount();
  }

  function toggleFavorite(product) {
    let favorites = getFavorites();
    const index = favorites.findIndex(item => item.id === product.id);

    const lang = window.i18n?.getCurrentLanguage?.() || 'uk';
    const name = product.name?.[lang] || product.name?.uk || product.name || 'Продукт';
    
    const image = Utils.fixImagePath(product.images?.[0] || product.image);

    if (index > -1) {
      favorites.splice(index, 1);
      saveFavorites(favorites);
      showToast('Видалено з обраного', name);
      trackEvent('remove_favorite', { productId: product.id, category: product.category });
      return false;
    } else {
      favorites.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: image,
        images: product.images || [image],
        category: product.category,
        brand: product.brand,
        rating: product.rating,
        reviews: product.reviews,
        oldPrice: product.oldPrice,
        discount: product.discount,
        isNew: product.isNew,
        isHot: product.isHot,
        inStock: product.inStock
      });
      saveFavorites(favorites);
      showToast('Додано до обраного', name);
      trackEvent('add_favorite', { productId: product.id, category: product.category });
      return true;
    }
  }

  function isFavorite(productId) {
    const favorites = getFavorites();
    return favorites.some(item => item.id === productId);
  }

  function clearFavorites() {
    Utils.removeStorage('techstore-favorites');
    updateFavoritesCount();
  }

  // ============================================
  // Toast Notifications
  // ============================================
  function showToast(title, message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const titleEl = toast.querySelector('#toastTitle');
    const messageEl = toast.querySelector('#toastMessage');

    if (titleEl) titleEl.textContent = title;
    if (messageEl) messageEl.textContent = message;

    toast.classList.add('show');

    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  // ============================================
  // Product Card Rendering
  // ============================================
  function renderProductCard(product) {
    const isFav = isFavorite(product.id);
    const currentLang = window.i18n?.getCurrentLanguage() || 'uk';
    const name = product.name?.[currentLang] || product.name?.uk || product.name || 'Продукт';

    const image = Utils.fixImagePath(product.images?.[0] || product.image);

    const depth = Utils.getPageDepth();
    const productUrl = depth === 0
      ? `./products/?id=${product.id}`
      : depth === 1
        ? `./?id=${product.id}`
        : `../../products/?id=${product.id}`;
    
    const badgeNewText = getTranslatedText('badge_new', 'NEW');
    const badgeHotText = getTranslatedText('badge_hot', 'HOT');
    let badge = '';
    if (product.isNew) {
      badge = `<span class="product-badge badge-new">${badgeNewText}</span>`;
    } else if (product.discount || product.isSale) {
      badge = `<span class="product-badge badge-sale">-${product.discount || 15}%</span>`;
    } else if (product.isHot) {
      badge = `<span class="product-badge badge-hot">${badgeHotText}</span>`;
    }

    const categoryName = getCategoryName(product.category);
    const reviewsText = getTranslatedText('reviews', 'відгуки');
    const addToCartText = getTranslatedText('add_to_cart', 'Додати в кошик');
    
    return `
      <div class="product-card" data-product-id="${product.id}" data-product-category="${product.category}">
        ${badge ? `<div class="product-badges">${badge}</div>` : ''}
        
        <div class="product-image">
          <img src="${image}" alt="${name}" loading="lazy" decoding="async" onerror="this.src=window.Utils.fixImagePath('assets/images/placeholder.svg')">
          <div class="product-actions">
            <button class="product-action-btn favorite-btn ${isFav ? 'active' : ''}" 
                    data-product-id="${product.id}" 
                    aria-label="Add to favorites">
              <i class="fa${isFav ? 's' : 'r'} fa-heart"></i>
            </button>
          </div>
        </div>

        <div class="product-info">
          <span class="product-category">${categoryName}</span>
          <h3 class="product-title">
            <a href="${productUrl}">${name}</a>
          </h3>

          <div class="product-rating">
            <div class="product-stars">
              ${'★'.repeat(Math.floor(product.rating || 0))}${'☆'.repeat(5 - Math.floor(product.rating || 0))}
            </div>
            <span class="product-rating-value">${product.rating || 0}</span>
            <span class="product-reviews">(${product.reviews || 0} ${reviewsText})</span>
          </div>

          <div class="product-price">
            ${product.oldPrice ? `<span class="price-old">${Utils.formatPrice(product.oldPrice)}</span>` : ''}
            <span class="price-current">${Utils.formatPrice(product.price)}</span>
          </div>

          <div class="product-footer">
            <button class="btn btn-primary btn-add-cart" data-product-id="${product.id}">
              <i class="fas fa-shopping-cart"></i>
              ${addToCartText}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Get Category Name
  // ============================================
  function getCategoryName(category) {
    const categoryMap = {
      phones: 'smartphones',
      smartwatches: 'watches'
    };
    const key = `category_${categoryMap[category] || category}`;
    return getTranslatedText(key, category);
  }

  function getTranslatedText(key, fallback) {
    const translated = window.i18n?.t?.(key);
    return translated && translated !== key ? translated : fallback;
  }

  // ============================================
  // Load Featured Products
  // ============================================
  async function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    try {
      const products = await window.ProductData.getFeaturedProducts(8);

      if (products.length === 0) {
        container.innerHTML = '<p style="padding: 2rem; text-align: center;">Товари завантажуються...</p>';
        return;
      }

      container.innerHTML = products.map(product => 
        renderProductCard(product)
      ).join('');

      attachProductCardListeners(container);
      

    } catch (err) {
      console.error('❌ Error loading featured products:', err);
      container.innerHTML = '<p style="padding: 2rem; text-align: center; color: var(--danger-color);">Помилка завантаження товарів</p>';
    }
  }

  async function updateHomeCategoryCounts() {
    const countNodes = document.querySelectorAll('[data-category-count]');
    if (countNodes.length === 0) return;

    try {
      const products = await window.ProductData.getAllProducts();
      const categoryCountMap = products.reduce((acc, product) => {
        const category = product.category || 'other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {});

      countNodes.forEach(node => {
        const category = node.getAttribute('data-category-count');
        node.textContent = String(categoryCountMap[category] || 0);
      });
    } catch (error) {
      console.error('Error updating category counters:', error);
    }
  }

  // ============================================
  // Attach Event Listeners to Product Cards
  // ============================================
  function attachProductCardListeners(container) {
    container.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.dataset.productId;
        const category = btn.closest('.product-card')?.dataset.productCategory;
        if (!category) return;

        try {
          const depth = Utils.getPageDepth();
          const basePath = depth === 0 ? './data/products' : depth === 1 ? '../data/products' : '../../data/products';
          const response = await fetch(`${basePath}/${category}/${productId}.json`);
          if (!response.ok) return;
          const product = await response.json();
          addToCart({ ...product, category }, 1);
        } catch (err) {
          console.error('Error adding to cart:', err);
        }
      });
    });

    container.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.dataset.productId;
        const category = btn.closest('.product-card')?.dataset.productCategory;
        if (!category) return;

        try {
          const depth = Utils.getPageDepth();
          const basePath = depth === 0 ? './data/products' : depth === 1 ? '../data/products' : '../../data/products';
          const response = await fetch(`${basePath}/${category}/${productId}.json`);
          if (!response.ok) return;
          const product = await response.json();

          const isFav = toggleFavorite({ ...product, category });
          btn.classList.toggle('active', isFav);
          const icon = btn.querySelector('i');
          if (icon) {
            icon.classList.toggle('fas', isFav);
            icon.classList.toggle('far', !isFav);
          }
        } catch (err) {
          console.error('Error toggling favorite:', err);
        }
      });
    });
  }

  // ============================================
  // Search Functionality
  // ============================================
  function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');

    if (!searchInput || !searchBtn) return;

    if (typeof window.performSearch === 'function') {
      searchBtn.addEventListener('click', () => window.performSearch(searchInput.value));
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          window.performSearch(searchInput.value);
        }
      });
      return;
    }

    searchBtn.addEventListener('click', performSearch);

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }

  function performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput?.value.trim();
    
    if (query) {
      if (typeof window.performSearch === 'function') {
        window.performSearch(query);
      } else {
        window.location.href = Utils.resolvePath(`catalog/?search=${encodeURIComponent(query)}`);
      }
    }
  }

  // ============================================
  // Smooth Scroll
  // ============================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        if (href === '#' || href === '') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
          Utils.scrollToElement(target, 100);
        }
      });
    });
  }

  // ============================================
  // Scroll Animations
  // ============================================
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('aos-animate');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('[data-aos]').forEach(el => {
      observer.observe(el);
    });
  }

  // ============================================
  // Navbar Scroll Effect
  // ============================================
  function initNavbarScroll() {
    const navbar = document.querySelector('.header');
    if (!navbar) return;

    window.addEventListener('scroll', Utils.throttle(() => {
      if (window.pageYOffset > 100) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }, 100));
  }

  // ============================================
  // Active Nav Link
  // ============================================
  function highlightActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    document.querySelectorAll('.nav-menu a').forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.includes(currentPage)) {
        link.classList.add('active');
      }
    });
  }

  // ============================================
  // Initialize Everything
  // ============================================
  function init() {
    initMobileMenu();
    initSearch();
    initSmoothScroll();
    initScrollAnimations();
    initNavbarScroll();
    highlightActiveNavLink();
    
    updateCartCount();
    updateFavoritesCount();
    updateCompareCount();
    initCompareHeaderButton();
    
    if (document.getElementById('featuredProducts')) {
      loadFeaturedProducts();
    }

    updateHomeCategoryCounts();
    window.addEventListener('languageChanged', loadFeaturedProducts);
    window.addEventListener('languageChanged', (e) => {
      trackEvent('language_changed', { language: e?.detail?.language || window.i18n?.getCurrentLanguage?.() || 'uk' });
    });
    trackEvent('page_view', { title: document.title });

  }

  // ============================================
  // Export Functions
  // ============================================
  window.TechStore = {
    // Cart
    getCart,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
    
    // Favorites
    getFavorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    
    // Compare
    getCompareItems,
    updateCompareCount,
    
    // UI
    showToast,
    renderProductCard,
    trackEvent,
    
    // Validation (з Utils)
    validateEmail: Utils.validateEmail,
    validatePhone: Utils.validatePhone,
    
    // Utils re-export
    formatPrice: Utils.formatPrice,
    debounce: Utils.debounce,
    fixImagePath: Utils.fixImagePath
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
