/* ============================================
   TechStore - Catalog Logic (з Utils)
   ============================================ */

(function() {
  'use strict';

  // State
  let allProducts = [];
  let allProductsMap = new Map();
  let filteredProducts = [];
  let currentPage = 1;
  const productsPerPage = 12;
  
  const filters = {
    category: 'all',
    brands: [],
    minPrice: null,
    maxPrice: null,
    ratings: [],
    inStock: false,
    search: ''
  };

  let currentSort = 'default';
  let currentView = 'grid';

  // DOM Elements
  const productsGrid = document.getElementById('productsGrid');
  const productsCount = document.getElementById('productsCount');
  const sortSelect = document.getElementById('sortSelect');
  const categoryFilter = document.getElementById('categoryFilter');
  const brandFilter = document.getElementById('brandFilter');
  const ratingFilter = document.getElementById('ratingFilter');
  const priceMinInput = document.getElementById('priceMin');
  const priceMaxInput = document.getElementById('priceMax');
  const applyPriceBtn = document.getElementById('applyPrice');
  const inStockCheckbox = document.getElementById('inStockOnly');
  const resetFiltersBtn = document.getElementById('resetFilters');
  const toggleFiltersBtn = document.getElementById('toggleFilters');
  const sidebar = document.getElementById('catalogSidebar');
  const pagination = document.getElementById('pagination');
  const viewBtns = document.querySelectorAll('.view-btn');

  // Initialize
  async function init() {
    await loadProducts();
    setupEventListeners();
    applyFiltersFromURL();
    renderProducts();
    
    window.addEventListener('languageChanged', handleLanguageChange);
    

  }

  // Handle Language Change
  function handleLanguageChange() {
    translateSelectOptions();
    renderProducts();
  }

  // Translate Select Options
  function translateSelectOptions() {
    if (!sortSelect) return;

    const options = sortSelect.querySelectorAll('option');
    options.forEach(option => {
      const key = option.getAttribute('data-i18n');
      if (key && window.i18n?.t) {
        option.textContent = window.i18n.t(key);
      }
    });
  }

  // Load Products from JSON files
  async function loadProducts() {
    try {
      allProducts = await window.ProductData.getAllProducts();
      allProductsMap = new Map(allProducts.map((product) => [product.id, product]));
      filteredProducts = [...allProducts];
      

    } catch (err) {
      console.error('❌ Error loading products:', err);
    }
  }

  // Setup Event Listeners
  function setupEventListeners() {
    if (sortSelect) {
      sortSelect.addEventListener('change', handleSort);
    }

    if (categoryFilter) {
      categoryFilter.addEventListener('change', (e) => {
        const radio = e.target.closest('input[type="radio"]');
        if (radio) {
          filters.category = radio.value;
          applyFilters();
        }
      });
    }

    if (brandFilter) {
      brandFilter.addEventListener('change', (e) => {
        const checkbox = e.target.closest('input[type="checkbox"]');
        if (checkbox) {
          const brand = checkbox.value;
          if (checkbox.checked) {
            filters.brands.push(brand);
          } else {
            filters.brands = filters.brands.filter(b => b !== brand);
          }
          applyFilters();
        }
      });
    }

    if (ratingFilter) {
      ratingFilter.addEventListener('change', (e) => {
        const checkbox = e.target.closest('input[type="checkbox"]');
        if (checkbox) {
          const rating = parseInt(checkbox.value);
          if (checkbox.checked) {
            if (!filters.ratings.includes(rating)) {
              filters.ratings.push(rating);
            }
          } else {
            filters.ratings = filters.ratings.filter(r => r !== rating);
          }
          applyFilters();
        }
      });
    }

    if (applyPriceBtn) {
      applyPriceBtn.addEventListener('click', () => {
        filters.minPrice = priceMinInput.value ? parseInt(priceMinInput.value) : null;
        filters.maxPrice = priceMaxInput.value ? parseInt(priceMaxInput.value) : null;
        applyFilters();
      });
    }

    if (inStockCheckbox) {
      inStockCheckbox.addEventListener('change', (e) => {
        filters.inStock = e.target.checked;
        applyFilters();
      });
    }

    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', resetFilters);
    }

    if (toggleFiltersBtn && sidebar) {
      toggleFiltersBtn.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        document.body.classList.toggle('filters-open');
      });
    }

    viewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        setView(view);
      });
    });
  }

  // Map Category URL to Internal Name
  function mapCategoryName(urlCategory) {
    const categoryMap = {
      'smartphones': 'phones',
      'watches': 'smartwatches',
      'phones': 'phones',
      'laptops': 'laptops',
      'headphones': 'headphones',
      'smartwatches': 'smartwatches',
      'accessories': 'accessories',
      'all': 'all'
    };
    return categoryMap[urlCategory] || urlCategory;
  }

  // Apply Filters from URL
  function applyFiltersFromURL() {
    const params = Utils.getUrlParams();
    
    if (params.category) {
      const internalCategory = mapCategoryName(params.category);
      filters.category = internalCategory;
      
      let radio = document.querySelector(`input[name="category"][value="${internalCategory}"]`);
      if (!radio) {
        radio = document.querySelector(`input[name="category"][value="${params.category}"]`);
      }
      if (radio) radio.checked = true;
    }

    if (params.search) {
      filters.search = params.search;
    }
  }

  // Filter Products
  function filterProducts(products, filters) {
    return products.filter(product => {
      if (filters.category && filters.category !== 'all') {
        if (product.category !== filters.category) return false;
      }

      if (filters.brands.length > 0) {
        if (!filters.brands.includes(product.brand.toLowerCase())) return false;
      }

      if (filters.minPrice !== null && product.price < filters.minPrice) return false;
      if (filters.maxPrice !== null && product.price > filters.maxPrice) return false;

      if (filters.ratings.length > 0) {
        const productRating = product.rating || 0;
        const matchesRating = filters.ratings.some(filterRating => {
          if (filterRating === 5) {
            return productRating >= 4.5;
          } else if (filterRating === 4) {
            return productRating >= 4.0;
          } else if (filterRating === 3) {
            return productRating >= 3.0;
          }
          return false;
        });
        
        if (!matchesRating) return false;
      }

      if (filters.inStock && !product.inStock) return false;

      if (filters.search) {
        const lang = window.i18n?.getCurrentLanguage?.() || 'uk';
        const name = product.name?.[lang] || product.name?.uk || '';
        if (!name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      }

      return true;
    });
  }

  // Sort Products
  function sortProducts(products, sortType) {
    const sorted = [...products];
    const lang = window.i18n?.getCurrentLanguage?.() || 'uk';

    switch (sortType) {
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'name-asc':
        return sorted.sort((a, b) => {
          const nameA = a.name?.[lang] || a.name?.uk || '';
          const nameB = b.name?.[lang] || b.name?.uk || '';
          return nameA.localeCompare(nameB);
        });
      case 'name-desc':
        return sorted.sort((a, b) => {
          const nameA = a.name?.[lang] || a.name?.uk || '';
          const nameB = b.name?.[lang] || b.name?.uk || '';
          return nameB.localeCompare(nameA);
        });
      case 'rating':
        return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default:
        return sorted;
    }
  }

  // Apply Filters
  function applyFilters() {
    filteredProducts = filterProducts(allProducts, filters);
    currentPage = 1;
    renderProducts();
    updateURL();
  }

  // Reset Filters
  function resetFilters() {
    filters.category = 'all';
    filters.brands = [];
    filters.minPrice = null;
    filters.maxPrice = null;
    filters.ratings = [];
    filters.inStock = false;
    filters.search = '';

    document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
    document.querySelector('input[name="category"][value="all"]').checked = true;
    if (priceMinInput) priceMinInput.value = '';
    if (priceMaxInput) priceMaxInput.value = '';
    if (sortSelect) sortSelect.value = 'default';

    currentSort = 'default';
    applyFilters();
  }

  // Handle Sort
  function handleSort(e) {
    currentSort = e.target.value;
    filteredProducts = sortProducts(filteredProducts, currentSort);
    currentPage = 1;
    renderProducts();
  }

  // Set View
  function setView(view) {
    currentView = view;
    
    viewBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === view);
    });

    if (productsGrid) {
      if (view === 'list') {
        productsGrid.classList.add('list-view');
      } else {
        productsGrid.classList.remove('list-view');
      }
    }
  }

  // Render Product Card
  function renderProductCard(product) {
    const lang = window.i18n?.getCurrentLanguage?.() || 'uk';
    const name = product.name?.[lang] || product.name?.uk || 'Продукт';
    const image = Utils.fixImagePath(product.images?.[0] || 'assets/images/placeholder.svg');
    const isFavorite = window.TechStore?.isFavorite?.(product.id) || false;

    const addToCartText = window.i18n?.t?.('add_to_cart') || 'В кошик';
    const reviewsText = window.i18n?.t?.('reviews') || 'відгуків';

    return `
      <div class="product-card" data-product-id="${product.id}" data-product-category="${product.category}">
        ${product.isNew ? '<span class="badge badge-new">NEW</span>' : ''}
        ${product.discount ? `<span class="badge badge-sale">-${product.discount}%</span>` : ''}
        ${product.isHot ? '<span class="badge badge-hot">HOT</span>' : ''}

        <a href="../../products/?id=${product.id}" class="product-image">
          <img src="${image}" alt="${name}" loading="lazy" onerror="this.src='../images/placeholder.svg'">
        </a>

        <div class="product-actions product-card-actions">
          <button class="product-action-btn compare-btn" data-product-id="${product.id}" title="Порівняти">
            <i class="fas fa-scale-balanced"></i>
          </button>
          <button class="product-action-btn favorite-btn ${isFavorite ? 'active' : ''}"
                  data-product-id="${product.id}">
            <i class="fa${isFavorite ? 's' : 'r'} fa-heart"></i>
          </button>
        </div>

        <div class="product-info">
          <div class="product-category">${getCategoryName(product.category)}</div>
          <a href="../../products/?id=${product.id}" class="product-title">${name}</a>

          <div class="product-rating">
            <div class="product-stars">${renderStars(product.rating || 0)}</div>
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
              <span>${addToCartText}</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Render Products
  function renderProducts() {
    if (!productsGrid) return;

    if (productsCount) {
      productsCount.textContent = filteredProducts.length;
    }

    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = filteredProducts.slice(startIndex, endIndex);

    if (productsToShow.length === 0) {
      const noResultsTitle = window.i18n?.t?.('no_products_found') || 'Нічого не знайдено';
      const noResultsText = window.i18n?.t?.('no_products_text') || 'Спробуйте змінити параметри пошуку або фільтри';
      const resetFiltersText = window.i18n?.t?.('reset_filters') || 'Скинути фільтри';
      
      productsGrid.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">
            <i class="fas fa-search"></i>
          </div>
          <h2 class="no-results-title">${noResultsTitle}</h2>
          <p class="no-results-text">${noResultsText}</p>
          <button class="btn btn-primary no-results-reset" id="catalogNoResultsReset">
            <i class="fas fa-redo"></i> ${resetFiltersText}
          </button>
        </div>
      `;

      const noResultsResetBtn = document.getElementById('catalogNoResultsReset');
      if (noResultsResetBtn) {
        noResultsResetBtn.addEventListener('click', resetFilters);
      }
    } else {
      productsGrid.innerHTML = productsToShow.map(product => 
        renderProductCard(product)
      ).join('');

      attachProductListeners();
    }

    renderPagination();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Attach Event Listeners
  function attachProductListeners() {
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.dataset.productId;
        const product = allProductsMap.get(productId);
        if (product && window.TechStore?.addToCart) {
          window.TechStore.addToCart(product, 1);
        }
      });
    });

    document.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.dataset.productId;
        const product = allProductsMap.get(productId);
        if (product && window.TechStore?.toggleFavorite) {
          const isFav = window.TechStore.toggleFavorite(product);
          btn.classList.toggle('active', isFav);
          const icon = btn.querySelector('i');
          if (icon) {
            icon.classList.toggle('fas', isFav);
            icon.classList.toggle('far', !isFav);
          }
        }
      });
    });

    document.querySelectorAll('.compare-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.dataset.productId;
        const product = allProductsMap.get(productId);
        if (!product) return;

        const key = 'techstore-compare-items';
        const raw = Utils.getStorage(key, []);
        const items = Array.isArray(raw)
          ? raw.map((item) => (typeof item === 'string' ? { id: item } : item))
          : [];

        if (!items.some((item) => item.id === product.id)) {
          items.push({ id: product.id, category: product.category });
          Utils.setStorage(key, items.slice(0, 3));
          window.TechStore?.updateCompareCount?.();
          window.TechStore?.showToast?.('Порівняння', 'Товар додано до порівняння');
        } else {
          window.TechStore?.showToast?.('Порівняння', 'Товар вже у списку');
        }
      });
    });
  }

  // Render Pagination
  function renderPagination() {
    if (!pagination) return;

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    if (totalPages <= 1) {
      pagination.innerHTML = '';
      return;
    }

    let html = '';

    html += `
      <button class="pagination-btn" ${currentPage === 1 ? 'disabled' : ''} 
              onclick="window.catalogChangePage(${currentPage - 1})">
        <i class="fas fa-chevron-left"></i>
      </button>
    `;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      html += `<button class="pagination-btn" onclick="window.catalogChangePage(1)">1</button>`;
      if (startPage > 2) {
        html += `<span class="pagination-dots">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `
        <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                onclick="window.catalogChangePage(${i})">
          ${i}
        </button>
      `;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        html += `<span class="pagination-dots">...</span>`;
      }
      html += `<button class="pagination-btn" onclick="window.catalogChangePage(${totalPages})">${totalPages}</button>`;
    }

    html += `
      <button class="pagination-btn" ${currentPage === totalPages ? 'disabled' : ''} 
              onclick="window.catalogChangePage(${currentPage + 1})">
        <i class="fas fa-chevron-right"></i>
      </button>
    `;

    pagination.innerHTML = html;
  }

  // Change Page
  window.catalogChangePage = function(page) {
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderProducts();
  };

  // Update URL
  function updateURL() {
    const params = {};

    if (filters.category && filters.category !== 'all') {
      params.category = filters.category;
    }

    if (filters.search) {
      params.search = filters.search;
    }

    if (filters.brands.length > 0) {
      params.brands = filters.brands.join(',');
    }

    if (filters.minPrice) {
      params.minPrice = filters.minPrice;
    }

    if (filters.maxPrice) {
      params.maxPrice = filters.maxPrice;
    }

    if (currentSort !== 'default') {
      params.sort = currentSort;
    }

    Utils.updateUrlParams(params, true);
  }

  // Helper Functions
  function renderStars(rating) {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    
    let html = '';
    html += '<i class="fas fa-star"></i>'.repeat(full);
    if (half) html += '<i class="fas fa-star-half-alt"></i>';
    html += '<i class="far fa-star"></i>'.repeat(empty);
    
    return html;
  }

  function getCategoryName(category) {
    const categoryMap = {
      phones: 'smartphones',
      smartwatches: 'watches'
    };
    const key = `category_${categoryMap[category] || category}`;
    return window.i18n?.t?.(key) || category;
  }

  window.catalogResetFilters = function() {
    resetFilters();
  };

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
