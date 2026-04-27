/* ============================================
   TechStore - Checkout Logic (з Utils)
   Оформлення замовлення з валідацією форми
   ============================================ */

(function() {
  'use strict';

  // ============================================
  // Configuration
  // ============================================
  const FREE_DELIVERY_THRESHOLD = Utils.FREE_DELIVERY_THRESHOLD;
  const DELIVERY_PRICES = {
    courier: 100,
    novaposhta: 80,
    pickup: 0
  };

  // ============================================
  // State
  // ============================================
  let cart = [];
  let appliedPromo = null;
  let selectedDelivery = 'courier';
  let selectedPayment = 'card';
  let allProducts = {};

  // ============================================
  // DOM Elements
  // ============================================
  const checkoutForm = document.getElementById('checkoutForm');
  const summaryItems = document.getElementById('summaryItems');
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryDelivery = document.getElementById('summaryDelivery');
  const summaryDiscount = document.getElementById('summaryDiscount');
  const summaryTotal = document.getElementById('summaryTotal');
  const discountRow = document.getElementById('discountRow');
  const addressFields = document.getElementById('addressFields');
  const promoInput = document.getElementById('promoInput');
  const applyPromoBtn = document.getElementById('applyPromoBtn');
  const promoMessage = document.getElementById('promoMessage');
  const loadingOverlay = document.getElementById('loadingOverlay');

  function t(key, fallback = '') {
    return window.i18n?.t?.(key) || fallback;
  }

  // ============================================
  // Initialize
  // ============================================
  async function init() {
    loadCart();
    loadAppliedPromo();
    
    if (cart.length === 0) {
      redirectToCart();
      return;
    }

    await loadCheckoutProducts();
    
    renderSummary();
    setupEventListeners();
    setupFormValidation();
    window.addEventListener('languageChanged', handleLanguageChange);
    

  }

  // ============================================
  // Load Cart
  // ============================================
  function loadCart() {
    cart = window.TechStore.getCart();
  }

  // ============================================
  // Load Checkout Products from JSON
  // ============================================
  async function loadCheckoutProducts() {
    try {
      const products = await window.ProductData.getAllProducts();
      allProducts = products.reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {});
    } catch (err) {
      console.error('❌ Error loading checkout products:', err);
    }
  }

  // ============================================
  // Get Product By ID
  // ============================================
  function getProductById(id) {
    return allProducts[id] || null;
  }

  // ============================================
  // Load Applied Promo
  // ============================================
  function loadAppliedPromo() {
    appliedPromo = Utils.getStorage('appliedPromo', null);
    
    if (appliedPromo) {
      const promo = validatePromoCode(appliedPromo.code);
      if (!promo) {
        appliedPromo = null;
        Utils.removeStorage('appliedPromo');
        return;
      }
      appliedPromo = promo;

      if (promoInput) {
        promoInput.value = appliedPromo.code;
        promoInput.disabled = true;
      }
      if (applyPromoBtn) {
        applyPromoBtn.textContent = t('promo_applied_button', 'Застосовано');
        applyPromoBtn.disabled = true;
      }
      if (promoMessage) {
        promoMessage.textContent = `${t('promo_applied', 'Промокод застосовано')}! ${t('discount', 'Знижка')}: ${appliedPromo.discount}%`;
        promoMessage.className = 'promo-message success';
        promoMessage.style.display = 'block';
      }
    }
  }

  function handleLanguageChange() {
    renderSummary();
    if (appliedPromo && applyPromoBtn) {
      applyPromoBtn.textContent = t('promo_applied_button', 'Застосовано');
      applyPromoBtn.disabled = true;
    }
  }

  // ============================================
  // Redirect to Cart
  // ============================================
  function redirectToCart() {
    window.TechStore.showToast(t('warning_title', 'Увага'), t('cart_empty_title', 'Кошик порожній'));
    setTimeout(() => {
      window.location.href = window.Utils.resolvePath('/cart/');
    }, 1000);
  }

  // ============================================
  // Setup Event Listeners
  // ============================================
  function setupEventListeners() {
    document.querySelectorAll('input[name="delivery"]').forEach(radio => {
      radio.addEventListener('change', handleDeliveryChange);
    });

    document.querySelectorAll('input[name="payment"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        selectedPayment = e.target.value;
      });
    });

    if (applyPromoBtn) {
      applyPromoBtn.addEventListener('click', handleApplyPromo);
    }

    if (checkoutForm) {
      checkoutForm.addEventListener('submit', handleFormSubmit);
    }

    const phoneInput = document.getElementById('phone');
    if (phoneInput) {
      phoneInput.addEventListener('input', formatPhoneNumber);
    }
  }

  // ============================================
  // Handle Delivery Change
  // ============================================
  function handleDeliveryChange(e) {
    selectedDelivery = e.target.value;
    
    if (addressFields) {
      if (selectedDelivery === 'pickup') {
        addressFields.style.display = 'none';
        addressFields.querySelectorAll('input').forEach(input => {
          input.removeAttribute('required');
        });
      } else {
        addressFields.style.display = 'block';
        addressFields.querySelectorAll('input').forEach(input => {
          input.setAttribute('required', 'required');
        });
      }
    }

    updateSummary();
  }

  // ============================================
  // Calculate Totals
  // ============================================
  function calculateTotals() {
    const subtotal = cart.reduce((sum, item) => {
      const product = getProductById(item.id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    let deliveryPrice = DELIVERY_PRICES[selectedDelivery] || 0;
    
    if (subtotal >= FREE_DELIVERY_THRESHOLD && selectedDelivery !== 'pickup') {
      deliveryPrice = 0;
    }

    let discount = 0;
    if (appliedPromo) {
      discount = Math.round(subtotal * appliedPromo.discount / 100);
    }

    const total = subtotal + deliveryPrice - discount;

    return { subtotal, deliveryPrice, discount, total };
  }

  // ============================================
  // Render Summary
  // ============================================
  function renderSummary() {
    if (summaryItems) {
      const lang = window.i18n?.getCurrentLanguage?.() || 'uk';
      
      summaryItems.innerHTML = cart.map(item => {
        const product = getProductById(item.id);
        if (!product) return '';

        const name = product.name?.[lang] || product.name?.uk || product.name || t('product_fallback_name', 'Продукт');
        const image = Utils.fixImagePath(product.images?.[0] || product.image);

        return `
          <div class="summary-item">
            <div class="summary-item-image">
              <img src="${image}" alt="${name}" onerror="this.src=window.Utils.fixImagePath('assets/images/placeholder.svg')">
            </div>
            <div class="summary-item-info">
              <div class="summary-item-name">${name}</div>
              <div class="summary-item-quantity">${t('quantity_label', 'Кількість')}: ${item.quantity}</div>
            </div>
            <div class="summary-item-price">
              ${Utils.formatPrice(product.price * item.quantity)}
            </div>
          </div>
        `;
      }).join('');
    }

    updateSummary();
  }

  // ============================================
  // Update Summary
  // ============================================
  function updateSummary() {
    const { subtotal, deliveryPrice, discount, total } = calculateTotals();

    if (summarySubtotal) {
      summarySubtotal.textContent = Utils.formatPrice(subtotal);
    }

    if (summaryDelivery) {
      summaryDelivery.textContent = deliveryPrice === 0 
        ? t('free', 'Безкоштовно')
        : Utils.formatPrice(deliveryPrice);
    }

    if (summaryDiscount) {
      summaryDiscount.textContent = `-${Utils.formatPrice(discount)}`;
    }

    if (discountRow) {
      discountRow.style.display = discount > 0 ? 'flex' : 'none';
    }

    if (summaryTotal) {
      summaryTotal.textContent = Utils.formatPrice(total);
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
      Utils.setStorage('appliedPromo', promo);
      window.TechStore?.trackEvent?.('promo_applied', { code: promo.code, discount: promo.discount });
      
      showPromoMessage('success', `${t('promo_applied', 'Промокод застосовано')}! ${t('discount', 'Знижка')}: ${promo.discount}%`);
      
      if (promoInput) promoInput.disabled = true;
      if (applyPromoBtn) {
        applyPromoBtn.textContent = t('promo_applied_button', 'Застосовано');
        applyPromoBtn.disabled = true;
      }
      
      updateSummary();
    } else {
      showPromoMessage('error', t('promo_invalid', 'Невірний промокод'));
      window.TechStore?.trackEvent?.('promo_invalid', { code });
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

    if (type === 'error') {
      setTimeout(() => {
        promoMessage.style.display = 'none';
      }, 3000);
    }
  }

  // ============================================
  // Setup Form Validation
  // ============================================
  function setupFormValidation() {
    if (!checkoutForm) return;

    const inputs = checkoutForm.querySelectorAll('input[required], textarea[required]');
    
    inputs.forEach(input => {
      input.addEventListener('blur', () => validateField(input));
      input.addEventListener('input', () => clearError(input));
    });
  }

  // ============================================
  // Validate Field
  // ============================================
  function validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = t('validation_required', 'Це поле обов\'язкове');
    }
    else if (field.type === 'email' && !Utils.validateEmail(value)) {
      isValid = false;
      errorMessage = t('validation_email', 'Невірний формат email');
    }
    else if (field.type === 'tel' && !Utils.validatePhone(value)) {
      isValid = false;
      errorMessage = t('validation_phone', 'Невірний формат телефону');
    }
    else if (field.type === 'checkbox' && field.name === 'terms' && !field.checked) {
      isValid = false;
      errorMessage = t('validation_terms_required', 'Необхідно погодитись з умовами');
    }

    if (!isValid) {
      showFieldError(field, errorMessage);
    } else {
      clearError(field);
    }

    return isValid;
  }

  // ============================================
  // Show Field Error
  // ============================================
  function showFieldError(field, message) {
    field.classList.add('error');
    
    const errorId = `${field.name}Error`;
    const errorEl = document.getElementById(errorId);
    
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  // ============================================
  // Clear Error
  // ============================================
  function clearError(field) {
    field.classList.remove('error');
    
    const errorId = `${field.name}Error`;
    const errorEl = document.getElementById(errorId);
    
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }
  }

  // ============================================
  // Format Phone Number
  // ============================================
  function formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.startsWith('380')) {
      value = value.substring(3);
    }
    value = value.substring(0, 9);

    let formatted = '+380';
    
    if (value.length > 0) {
      formatted += ' (' + value.substring(0, 2);
    }
    if (value.length >= 3) {
      formatted += ') ' + value.substring(2, 5);
    }
    if (value.length >= 6) {
      formatted += '-' + value.substring(5, 7);
    }
    if (value.length >= 8) {
      formatted += '-' + value.substring(7, 9);
    }

    e.target.value = formatted;
  }

  // ============================================
  // Handle Form Submit
  // ============================================
  async function handleFormSubmit(e) {
    e.preventDefault();

    const inputs = checkoutForm.querySelectorAll('input[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!validateField(input)) {
        isValid = false;
      }
    });

    if (!isValid) {
      window.TechStore.showToast(t('error_title', 'Помилка'), t('checkout_fill_required', 'Заповніть всі обов\'язкові поля'));
      window.TechStore?.trackEvent?.('checkout_validation_failed');
      
      const firstError = checkoutForm.querySelector('.error');
      if (firstError) {
        Utils.scrollToElement(firstError, 100);
        firstError.focus();
      }
      
      return;
    }

    if (loadingOverlay) {
      loadingOverlay.classList.add('show');
    }

    const formData = new FormData(checkoutForm);
    const lang = window.i18n?.getCurrentLanguage?.() || 'uk';
    
    const orderData = {
      customer: {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        email: formData.get('email')
      },
      delivery: {
        method: selectedDelivery,
        city: formData.get('city') || '',
        address: formData.get('address') || ''
      },
      payment: {
        method: selectedPayment
      },
      items: cart.map(item => {
        const product = getProductById(item.id);
        const name = product?.name?.[lang] || product?.name?.uk || product?.name || t('product_fallback_name', 'Продукт');
        return {
          id: item.id,
          name: name,
          price: product ? product.price : 0,
          quantity: item.quantity
        };
      }),
      comment: formData.get('comment') || '',
      callMe: formData.get('callMe') === 'on',
      newsletter: formData.get('newsletter') === 'on',
      totals: calculateTotals(),
      promoCode: appliedPromo ? appliedPromo.code : null,
      timestamp: new Date().toISOString()
    };

    try {
      const orderNumber = generateOrderNumber();
      await simulateOrderSubmission(orderData, orderNumber);
      
      Utils.setStorage('lastOrder', {
        orderNumber,
        items: orderData.items,
        total: orderData.totals.total
      });
      window.TechStore?.trackEvent?.('checkout_submitted', {
        orderNumber,
        total: orderData.totals.total,
        itemsCount: orderData.items.length,
        delivery: selectedDelivery,
        payment: selectedPayment
      });

      window.TechStore.clearCart();
      Utils.removeStorage('appliedPromo');

      window.location.href = window.Utils.resolvePath('/order-success/');
      
    } catch (error) {
      console.error('Order submission error:', error);
      window.TechStore?.trackEvent?.('checkout_submit_failed', {
        message: error?.message || 'unknown'
      });
      
      if (loadingOverlay) {
        loadingOverlay.classList.remove('show');
      }
      
      window.TechStore.showToast(t('error_title', 'Помилка'), t('checkout_submit_failed', 'Не вдалося оформити замовлення. Спробуйте ще раз.'));
    }
  }

  // ============================================
  // Simulate Order Submission
  // ============================================
  function simulateOrderSubmission(orderData, orderNumber) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, orderId: orderNumber });
      }, 2000);
    });
  }

  // ============================================
  // Generate Order Number
  // ============================================
  function generateOrderNumber() {
    return Utils.randomInt(10000, 99999);
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
