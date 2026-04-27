/* ============================================
   TechStore - Product Data Service
   Централізоване завантаження бази товарів
   ============================================ */

(function() {
  'use strict';

  let manifestCache = null;
  let productsCache = null;

  function getBasePath() {
    const depth = window.Utils?.getPageDepth?.() ?? 0;
    if (depth === 0) return './data/products';
    if (depth === 1) return '../data/products';
    return '../../data/products';
  }

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    return response.json();
  }

  async function loadManifest() {
    if (manifestCache) {
      return manifestCache;
    }

    const basePath = getBasePath();
    const manifest = await fetchJson(`${basePath}/index.json`);

    manifestCache = Array.isArray(manifest.products) ? manifest : { products: [] };
    return manifestCache;
  }

  async function getAllProducts() {
    if (productsCache) {
      return productsCache;
    }

    const basePath = getBasePath();
    const manifest = await loadManifest();

    const products = await Promise.all(
      manifest.products.map(async ({ category, id, featured }) => {
        try {
          const product = await fetchJson(`${basePath}/${category}/${id}.json`);
          return { ...product, category, id, featured: !!featured };
        } catch (error) {
          console.warn(`Could not load product ${category}/${id}`, error);
          return null;
        }
      })
    );

    productsCache = products.filter(Boolean);
    return productsCache;
  }

  async function getFeaturedProducts(limit = 8) {
    const products = await getAllProducts();

    const featured = products
      .filter(product => product.featured)
      .slice(0, limit);

    if (featured.length >= limit) {
      return featured;
    }

    const fallback = products
      .filter(product => !product.featured)
      .slice(0, Math.max(0, limit - featured.length));

    return [...featured, ...fallback];
  }

  async function searchProducts(query, limit = 10) {
    const safeQuery = String(query || '').trim().toLowerCase();
    if (!safeQuery) {
      return [];
    }

    const lang = window.i18n?.getCurrentLanguage?.() || 'uk';
    const products = await getAllProducts();

    return products
      .filter(product => {
        const name = product.name?.[lang] || product.name?.uk || '';
        const nameUk = product.name?.uk || '';
        const nameEn = product.name?.en || '';
        const nameRu = product.name?.ru || '';
        const brand = String(product.brand || '').toLowerCase();
        const category = String(product.category || '').toLowerCase();

        return (
          name.toLowerCase().includes(safeQuery) ||
          nameUk.toLowerCase().includes(safeQuery) ||
          nameEn.toLowerCase().includes(safeQuery) ||
          nameRu.toLowerCase().includes(safeQuery) ||
          brand.includes(safeQuery) ||
          category.includes(safeQuery)
        );
      })
      .slice(0, limit);
  }

  function clearCache() {
    manifestCache = null;
    productsCache = null;
  }

  window.ProductData = {
    loadManifest,
    getAllProducts,
    getFeaturedProducts,
    searchProducts,
    clearCache
  };
})();
