/* ============================================
   TechStore - Favorites Logic (з Utils)
   ============================================ */

(function() {
  'use strict';

  // ============================================
  // State
  // ============================================
  let favorites = [];

  // ============================================
  // DOM Elements
  // ============================================
  const emptyFavorites = document.getElementById('emptyFavorites');
  const favoritesContent = document.getElementById('favoritesContent');
  const favoritesGrid = document.getElementById('favoritesGrid');
  const favoritesCountText = document.getElementById('favoritesCountText');
  const favoritesActions = document.getElementById('favoritesActions');
  const clearFavoritesBtn = document.getElementById('clearFavoritesBtn');
  const recommendedSection = document.getElementById('recommendedSection');
  const recommendedProducts = document.getElementById('recommendedProducts');

  // ============================================
  // Initialize
  // ============================================
  function init() {
    loadFavorites();
    renderFavorites();
    setupEventListeners();
    
    window.addEventListener('languageChanged', handleLanguageChange);
    

  }

  // ============================================
  // Handle Language Change
  // ============================================
  function handleLanguageChange() {
    renderFavorites();
  }

  // ============================================
  // Load Favorites
  // ============================================
  function loadFavorites() {
    favorites = window.TechStore.getFavorites();
  }

  // ============================================
  // Setup Event Listeners
  // ============================================
  function setupEventListeners() {
    if (clearFavoritesBtn) {
      clearFavoritesBtn.addEventListener('click', handleClearFavorites);
    }
  }

  // ============================================
  // Render Favorites
  // ============================================
  function renderFavorites() {
    if (favorites.length === 0) {
      showEmptyState();
    } else {
      showFavorites();
      renderFavoritesList();
      loadRecommendedProducts();
    }
  }

  // ============================================
  // Show Empty State
  // ============================================
  function showEmptyState() {
    if (emptyFavorites) emptyFavorites.style.display = 'flex';
    if (favoritesContent) favoritesContent.style.display = 'none';
    if (favoritesActions) favoritesActions.style.display = 'none';
    if (recommendedSection) recommendedSection.style.display = 'none';
  }

  // ============================================
  // Show Favorites
  // ============================================
  function showFavorites() {
    if (emptyFavorites) emptyFavorites.style.display = 'none';
    if (favoritesContent) favoritesContent.style.display = 'block';
    if (favoritesActions) favoritesActions.style.display = 'flex';
    if (recommendedSection) recommendedSection.style.display = 'block';

    if (favoritesCountText) {
      favoritesCountText.textContent = favorites.length;
    }
  }

  // ============================================
  // Render Favorites List
  // ============================================
  function renderFavoritesList() {
    if (!favoritesGrid) return;

    const lang = window.i18n?.getCurrentLanguage?.() || 'uk';
    const addToCartText = window.i18n?.t?.('add_to_cart') || 'В кошик';
    const reviewsText = window.i18n?.t?.('reviews') || 'відгуків';

    favoritesGrid.innerHTML = favorites.map(product => {
      const name = product.name?.[lang] || product.name?.uk || product.name || 'Продукт';
      const image = Utils.fixImagePath(product.images?.[0] || product.image);

      return `
        <div class="product-card" data-product-id="${product.id}">
          ${product.isNew ? '<span class="badge badge-new">NEW</span>' : ''}
          ${product.discount ? `<span class="badge badge-sale">-${product.discount}%</span>` : ''}
          ${product.isHot ? '<span class="badge badge-hot">HOT</span>' : ''}
          
          <a href="../../products/?id=${product.id}" class="product-image">
            <img src="${image}" alt="${name}" loading="lazy" onerror="this.src='../images/placeholder.svg'">
          </a>
          
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
              <button class="product-action-btn favorite-btn active" 
                      data-product-id="${product.id}">
                <i class="fas fa-heart"></i>
              </button>
              <a href="../../products/?id=${product.id}" 
                 class="product-action-btn">
                <i class="fas fa-eye"></i>
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');

    attachFavoriteListeners();
  }

  // ============================================
  // Attach Favorite Listeners
  // ============================================
  function attachFavoriteListeners() {
    if (!favoritesGrid) return;

    favoritesGrid.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.dataset.productId;
        const product = favorites.find(p => p.id === productId);
        if (product && window.TechStore?.addToCart) {
          window.TechStore.addToCart(product, 1);
        }
      });
    });

    favoritesGrid.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.dataset.productId;
        const product = favorites.find(p => p.id === productId);
        if (product && window.TechStore?.toggleFavorite) {
          window.TechStore.toggleFavorite(product);
          loadFavorites();
          renderFavorites();
        }
      });
    });
  }

  // ============================================
  // Load Recommended Products
  // ============================================
  async function loadRecommendedProducts() {
    if (!recommendedProducts || favorites.length === 0) return;

    try {
      const categories = Utils.unique(favorites.map(fav => fav.category).filter(Boolean), null);

      if (categories.length === 0) {
        recommendedSection.style.display = 'none';
        return;
      }

      const allProducts = await window.ProductData.getAllProducts();
      const relatedProducts = allProducts.filter(product => (
        categories.includes(product.category) &&
        !favorites.some(fav => fav.id === product.id)
      ));

      if (relatedProducts.length === 0) {
        recommendedSection.style.display = 'none';
        return;
      }

      const shuffled = Utils.shuffle(relatedProducts);
      recommendedProducts.innerHTML = shuffled.slice(0, 4).map(p => 
        renderRecommendedProductCard(p)
      ).join('');
      
      attachRecommendedListeners();

    } catch (err) {
      console.error('❌ Error loading recommended:', err);
      recommendedSection.style.display = 'none';
    }
  }

  // ============================================
  // Render Recommended Product Card
  // ============================================
  function renderRecommendedProductCard(product) {
    const lang = window.i18n?.getCurrentLanguage?.() || 'uk';
    const name = product.name?.[lang] || product.name?.uk || product.name || 'Продукт';
    const image = Utils.fixImagePath(product.images?.[0] || product.image);
    const isFavorite = window.TechStore?.isFavorite?.(product.id) || false;
    const reviewsText = window.i18n?.t?.('reviews') || 'відгуків';

    return `
      <div class="product-card" data-product-id="${product.id}">
        ${product.isNew ? '<span class="badge badge-new">NEW</span>' : ''}
        ${product.discount ? `<span class="badge badge-sale">-${product.discount}%</span>` : ''}
        ${product.isHot ? '<span class="badge badge-hot">HOT</span>' : ''}
        
        <a href="../../products/?id=${product.id}" class="product-image">
          <img src="${image}" alt="${name}" loading="lazy" onerror="this.src='../images/placeholder.svg'">
        </a>
        
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
            </button>
            <button class="product-action-btn favorite-btn ${isFavorite ? 'active' : ''}" 
                    data-product-id="${product.id}">
              <i class="fa${isFavorite ? 's' : 'r'} fa-heart"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Attach Recommended Listeners
  // ============================================
  function attachRecommendedListeners() {
    if (!recommendedProducts) return;

    recommendedProducts.querySelectorAll('.btn-add-cart').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.dataset.productId;
        await handleAddRecommendedToCart(productId);
      });
    });

    recommendedProducts.querySelectorAll('.favorite-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const productId = btn.dataset.productId;
        await handleToggleRecommendedFavorite(btn, productId);
      });
    });
  }

  // ============================================
  // Handle Add Recommended to Cart
  // ============================================
  async function handleAddRecommendedToCart(productId) {
    try {
      const allProducts = await window.ProductData.getAllProducts();
      const product = allProducts.find(item => item.id === productId);
      if (!product) return;
      
      if (window.TechStore?.addToCart) {
        window.TechStore.addToCart(product, 1);
      }
    } catch (err) {
      console.error('❌ Error adding to cart:', err);
    }
  }

  // ============================================
  // Handle Toggle Recommended Favorite
  // ============================================
  async function handleToggleRecommendedFavorite(btn, productId) {
    try {
      const allProducts = await window.ProductData.getAllProducts();
      const product = allProducts.find(item => item.id === productId);
      if (!product) return;
      
      if (window.TechStore?.toggleFavorite) {
        const isFav = window.TechStore.toggleFavorite(product);
        btn.classList.toggle('active', isFav);
        const icon = btn.querySelector('i');
        if (icon) {
          icon.classList.toggle('fas', isFav);
          icon.classList.toggle('far', !isFav);
        }
        
        if (isFav) {
          loadFavorites();
          renderFavorites();
        }
      }
    } catch (err) {
      console.error('❌ Error toggling favorite:', err);
    }
  }

  // ============================================
  // Handle Clear Favorites
  // ============================================
  function handleClearFavorites() {
    const modal = document.getElementById('confirmModal');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const overlay = document.getElementById('modalOverlay');
    const confirmText = document.getElementById('confirmText');

    if (!modal) {
      const confirmMessage = window.i18n?.t?.('confirm_clear_favorites') || 'Очистити обране?';
      if (confirm(confirmMessage)) {
        window.TechStore.clearFavorites();
        loadFavorites();
        renderFavorites();
      }
      return;
    }

    const confirmMessage = window.i18n?.t?.('confirm_clear_favorites') || 'Ви впевнені, що хочете очистити обране?';
    confirmText.textContent = confirmMessage;
    modal.classList.add('show');

    const handleConfirm = () => {
      window.TechStore.clearFavorites();
      loadFavorites();
      renderFavorites();
      modal.classList.remove('show');
      cleanup();
    };

    const handleCancel = () => {
      modal.classList.remove('show');
      cleanup();
    };

    const cleanup = () => {
      confirmBtn.removeEventListener('click', handleConfirm);
      cancelBtn.removeEventListener('click', handleCancel);
      overlay.removeEventListener('click', handleCancel);
    };

    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    overlay.addEventListener('click', handleCancel);
  }

  // ============================================
  // Helper Functions
  // ============================================
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

  // ============================================
  // Initialize on DOM Ready
  // ============================================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
