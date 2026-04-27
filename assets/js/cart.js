/* ============================================
   TechStore - Cart Logic (з Utils)
   Управління кошиком з підтримкою JSON-файлів
   ============================================ */

(function() {
  'use strict';

  // ============================================
  // Configuration
  // ============================================
  const FREE_DELIVERY_THRESHOLD = Utils.FREE_DELIVERY_THRESHOLD;
  const DELIVERY_COST = 100;

  // ============================================
  // State
  // ============================================
  let cart = [];
  let appliedPromo = null;
  let allProducts = {};

  // ============================================
  // DOM Elements
  // ============================================
  const emptyCart = document.getElementById('emptyCart');
  const cartContent = document.getElementById('cartContent');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartItemsCount = document.getElementById('cartItemsCount');
  const subtotalEl = document.getElementById('subtotal');
  const deliveryPriceEl = document.getElementById('deliveryPrice');
  const discountAmountEl = document.getElementById('discountAmount');
  const totalPriceEl = document.getElementById('totalPrice');
  const promoInput = document.getElementById('promoInput');
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  const promoMessage = document.getElementById('promoMessage');
  const deliveryProgressFill = document.getElementById('deliveryProgressFill');
  const deliveryRemainingEl = document.getElementById('deliveryRemaining');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');

  function t(key, fallback = '') {
    return window.i18n?.t?.(key) || fallback;
  }

  // ============================================
  // Initialize
  // ============================================
  async function init() {
    loadCart();
    loadAppliedPromo();
    await loadCartProducts();
    renderCart();
    setupEventListeners();
    window.addEventListener('languageChanged', handleLanguageChange);
    

  }

  // ============================================
  // Load Cart
  // ============================================
  function loadCart() {
    cart = window.TechStore.getCart();
  }

  // ============================================
  // Load Cart Products from JSON
  // ============================================
  async function loadCartProducts() {
    try {
      const products = await window.ProductData.getAllProducts();
      allProducts = products.reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {});
    } catch (err) {
      console.error('❌ Error loading cart products:', err);
    }
  }

  function loadAppliedPromo() {
    appliedPromo = Utils.getStorage('appliedPromo', null);
    if (!appliedPromo) return;

    if (promoInput) {
      promoInput.value = appliedPromo.code;
      promoInput.disabled = true;
    }
    if (applyPromoBtn) {
      applyPromoBtn.textContent = t('promo_applied_button', 'Застосовано');
      applyPromoBtn.disabled = true;
    }
    showPromoMessage('success', `${t('promo_applied', 'Промокод застосовано')}! ${t('discount', 'Знижка')}: ${appliedPromo.discount}%`);
  }

  function handleLanguageChange() {
    renderCart();
    if (appliedPromo && applyPromoBtn) {
      applyPromoBtn.textContent = t('promo_applied_button', 'Застосовано');
      applyPromoBtn.disabled = true;
    }
  }

  // ============================================
  // Get Product By ID
  // ============================================
  function getProductById(id) {
    return allProducts[id] || null;
  }

  // ============================================
  // Setup Event Listeners
  // ============================================
  function setupEventListeners() {
    if (clearCartBtn) {
      clearCartBtn.addEventListener('click', handleClearCart);
    }

    if (applyPromoBtn) {
      applyPromoBtn.addEventListener('click', handleApplyPromo);
    }

    if (checkoutBtn) {
      checkoutBtn.addEventListener('click', handleCheckout);
    }
  }

  // ============================================
  // Render Cart
  // ============================================
  function renderCart() {
    if (cart.length === 0) {
      showEmptyCart();
    } else {
      showCartContent();
      renderCartItems();
      updateSummary();
      updateDeliveryProgress();
    }
  }

  // ============================================
  // Show Empty Cart
  // ============================================
  function showEmptyCart() {
    if (emptyCart) emptyCart.style.display = 'flex';
    if (cartContent) cartContent.style.display = 'none';
  }

  // ============================================
  // Show Cart Content
  // ============================================
  function showCartContent() {
    if (emptyCart) emptyCart.style.display = 'none';
    if (cartContent) cartContent.style.display = 'block';
  }

  // ============================================
  // Render Cart Items
  // ============================================
  function renderCartItems() {
    if (!cartItemsList) return;

    if (cartItemsCount) {
      cartItemsCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
    }

    const lang = window.i18n?.getCurrentLanguage?.() || 'uk';

    cartItemsList.innerHTML = cart.map(item => {
      const product = getProductById(item.id);
      const fallbackProduct = {
        id: item.id,
        name: item.name,
        price: item.price || 0,
        image: item.image,
        category: item.category || 'accessories',
        inStock: true
      };
      const resolvedProduct = product || fallbackProduct;

      const name = resolvedProduct.name?.[lang] || resolvedProduct.name?.uk || resolvedProduct.name || t('product_fallback_name', 'Продукт');
      const image = Utils.fixImagePath(resolvedProduct.images?.[0] || resolvedProduct.image || item.image);
      const inStockText = window.i18n?.t?.('in_stock') || 'В наявності';
      const outOfStockText = window.i18n?.t?.('out_of_stock') || 'Немає в наявності';
      const perItemText = window.i18n?.t?.('price_per_item') || 'за шт';

      return `
        <div class="cart-item" data-product-id="${item.id}">
          <div class="cart-item-image">
            <img src="${image}" alt="${name}" loading="lazy" onerror="this.src=window.Utils.fixImagePath('assets/images/placeholder.svg')">
          </div>

          <div class="cart-item-details">
            <h3 class="cart-item-name">
              <a href="../../products/?id=${resolvedProduct.id}">${name}</a>
            </h3>
            <p class="cart-item-category">${getCategoryName(resolvedProduct.category)}</p>
            
            ${resolvedProduct.inStock 
              ? `<span class="cart-item-status in-stock"><i class="fas fa-check"></i> ${inStockText}</span>`
              : `<span class="cart-item-status out-of-stock"><i class="fas fa-times"></i> ${outOfStockText}</span>`
            }
          </div>

          <div class="cart-item-price-section">
            <div class="cart-item-top">
              <div class="cart-quantity">
                <button class="qty-btn" onclick="updateQuantity('${item.id}', ${item.quantity - 1})">
                  <i class="fas fa-minus"></i>
                </button>
                <input type="number" 
                       class="qty-value" 
                       value="${item.quantity}" 
                       min="1" 
                       max="99"
                       onchange="updateQuantity('${item.id}', this.value)">
                <button class="qty-btn" onclick="updateQuantity('${item.id}', ${item.quantity + 1})">
                  <i class="fas fa-plus"></i>
                </button>
              </div>

              <div class="cart-item-price">
                <span class="price-current">${Utils.formatPrice(resolvedProduct.price)} <span class="price-per-item">${perItemText}</span></span>
                ${resolvedProduct.oldPrice 
                  ? `<span class="price-old">${Utils.formatPrice(resolvedProduct.oldPrice)}</span>`
                  : ''
                }
              </div>
            </div>

            <div class="cart-item-bottom">
              <button class="btn btn-outline btn-remove" onclick="removeFromCart('${item.id}')">
                <i class="fas fa-trash"></i>
              </button>

              <div class="cart-item-total">
                <span>${t('cart_item_total_label', 'Разом:')}</span>
                <strong>${Utils.formatPrice(resolvedProduct.price * item.quantity)}</strong>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // ============================================
  // Update Quantity (Global)
  // ============================================
  window.updateQuantity = async function(productId, quantity) {
    quantity = Number.parseInt(quantity, 10);
    if (Number.isNaN(quantity)) return;
    quantity = Utils.clamp(quantity, 1, 99);
    
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }

    window.TechStore.updateCartItemQuantity(productId, quantity);
    loadCart();
    await loadCartProducts();
    renderCart();
  };

  // ============================================
  // Remove from Cart (Global)
  // ============================================
  window.removeFromCart = async function(productId) {
    const modal = document.getElementById('confirmModal');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const overlay = document.getElementById('modalOverlay');
    const confirmText = document.getElementById('confirmText');

    if (!modal) {
      window.TechStore.removeFromCart(productId);
      loadCart();
      await loadCartProducts();
      renderCart();
      return;
    }

    const product = getProductById(productId);
    const lang = window.i18n?.getCurrentLanguage?.() || 'uk';
    const name = product?.name?.[lang] || product?.name?.uk || product?.name || t('product_fallback_name_short', 'товар');
    
    confirmText.textContent = `${t('confirm_remove_item', 'Видалити цей товар?')} "${name}"?`;
    modal.classList.add('show');

    const handleConfirm = async () => {
      window.TechStore.removeFromCart(productId);
      loadCart();
      await loadCartProducts();
      renderCart();
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
  };

  // ============================================
  // Calculate Totals
  // ============================================
  function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => {
      const product = getProductById(item.id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    const deliveryPrice = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_COST;
    
    let discount = 0;
    if (appliedPromo) {
      discount = Math.round(subtotal * appliedPromo.discount / 100);
    }

    const total = subtotal + deliveryPrice - discount;

    return { subtotal, deliveryPrice, discount, total };
  }

  // ============================================
  // Update Summary
  // ============================================
  function updateSummary() {
    const { subtotal, deliveryPrice, discount, total } = calculateTotals();

    if (subtotalEl) {
      subtotalEl.textContent = Utils.formatPrice(subtotal);
    }

    if (deliveryPriceEl) {
      deliveryPriceEl.textContent = deliveryPrice === 0 
        ? t('free', 'Безкоштовно')
        : Utils.formatPrice(deliveryPrice);
    }

    if (discountAmountEl) {
      discountAmountEl.textContent = Utils.formatPrice(discount);
    }

    if (totalPriceEl) {
      totalPriceEl.textContent = Utils.formatPrice(total);
    }
  }

  // ============================================
  // Update Delivery Progress
  // ============================================
  function updateDeliveryProgress() {
    const { subtotal } = calculateTotals();
    
    if (subtotal >= FREE_DELIVERY_THRESHOLD) {
      if (deliveryProgressFill) deliveryProgressFill.style.width = '100%';
      if (deliveryRemainingEl && deliveryRemainingEl.closest('.delivery-text')) {
        deliveryRemainingEl.closest('.delivery-text').innerHTML = `
          <i class="fas fa-check-circle"></i>
          <span>${t('free_delivery_earned', 'Ви отримали безкоштовну доставку!')}</span>
        `;
      }
    } else {
      const remaining = FREE_DELIVERY_THRESHOLD - subtotal;
      const progress = (subtotal / FREE_DELIVERY_THRESHOLD) * 100;
      
      if (deliveryProgressFill) deliveryProgressFill.style.width = `${progress}%`;
      if (deliveryRemainingEl) {
        deliveryRemainingEl.textContent = Utils.formatPrice(remaining);
      }
    }
  }

  // ============================================
  // Handle Apply Promo
  // ============================================
  function handleApplyPromo() {
    const code = promoInput?.value.trim().toUpperCase();
    if (!code) return;

    const promo = validatePromoCode(code);

    if (promo) {
      appliedPromo = promo;
      Utils.setStorage('appliedPromo', appliedPromo);
      showPromoMessage('success', `${t('promo_applied', 'Промокод застосовано')}! ${t('discount', 'Знижка')}: ${promo.discount}%`);
      promoInput.disabled = true;
      applyPromoBtn.textContent = t('promo_applied_button', 'Застосовано');
      applyPromoBtn.disabled = true;
      updateSummary();
    } else {
      showPromoMessage('error', t('promo_invalid', 'Невірний промокод'));
      appliedPromo = null;
      Utils.removeStorage('appliedPromo');
    }
  }

  // ============================================
  // Validate Promo Code
  // ============================================
  function validatePromoCode(code) {
    return Utils.PROMO_CODES.find(promo => promo.code === code) || null;
  }

  // ============================================
  // Show Promo Message
  // ============================================
  function showPromoMessage(type, message) {
    if (!promoMessage) return;

    promoMessage.textContent = message;
    promoMessage.className = `promo-message ${type}`;
    promoMessage.style.display = 'block';

    setTimeout(() => {
      if (type === 'error') {
        promoMessage.style.display = 'none';
      }
    }, 3000);
  }

  // ============================================
  // Handle Clear Cart
  // ============================================
  function handleClearCart() {
    const modal = document.getElementById('confirmModal');
    const confirmBtn = document.getElementById('confirmBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const overlay = document.getElementById('modalOverlay');
    const confirmText = document.getElementById('confirmText');

    if (!modal) {
      if (confirm(t('confirm_clear_cart', 'Ви впевнені, що хочете очистити кошик?'))) {
        window.TechStore.clearCart();
        loadCart();
        renderCart();
      }
      return;
    }

    confirmText.textContent = t('confirm_clear_cart', 'Ви впевнені, що хочете очистити кошик?');
    modal.classList.add('show');

    const handleConfirm = () => {
      window.TechStore.clearCart();
      Utils.removeStorage('appliedPromo');
      appliedPromo = null;
      loadCart();
      renderCart();
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
  // Handle Checkout
  // ============================================
  function handleCheckout() {
    if (cart.length === 0) {
      window.TechStore.showToast(t('error_title', 'Помилка'), t('cart_empty_title', 'Кошик порожній'));
      return;
    }

    if (appliedPromo) {
      Utils.setStorage('appliedPromo', appliedPromo);
    }

    window.location.href = window.Utils.resolvePath('/checkout/');
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
