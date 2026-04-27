(function () {
  'use strict';

  const COMPARE_KEY = 'techstore-compare-items';
  const CATEGORIES = ['phones', 'laptops', 'headphones', 'smartwatches', 'accessories', 'watches'];

  const emptyStateEl = document.getElementById('compareEmptyState');
  const contentEl = document.getElementById('compareContent');
  const cardsEl = document.getElementById('compareCards');
  const warningEl = document.getElementById('compareWarning');
  const tableEl = document.getElementById('compareTable');
  const insightsEl = document.getElementById('compareInsights');
  let currentProducts = [];

  function getProductsBasePath() {
    const depth = window.Utils?.getPageDepth?.() ?? 1;
    if (depth === 0) return './data/products';
    if (depth === 1) return '../data/products';
    return '../../data/products';
  }

  function t(key, fallback = '') {
    const translated = window.i18n?.t?.(key);
    return translated && translated !== key ? translated : fallback;
  }

  async function init() {
    const compareItems = getCompareItems().slice(0, 3);
    if (compareItems.length === 0) {
      showEmpty();
      return;
    }

    const products = await loadCompareProducts(compareItems);
    if (products.length === 0) {
      showEmpty();
      return;
    }
    currentProducts = products;

    showContent();
    renderCards(products);

    if (hasMixedCategories(products)) {
      renderMixedCategoryWarning(products);
      if (tableEl?.parentElement) tableEl.parentElement.classList.add('hidden');
      if (insightsEl?.parentElement) insightsEl.parentElement.classList.add('hidden');
      return;
    }

    warningEl?.classList.add('hidden');
    if (tableEl?.parentElement) tableEl.parentElement.classList.remove('hidden');
    if (insightsEl?.parentElement) insightsEl.parentElement.classList.remove('hidden');
    renderTable(products);
    renderInsights(products);
  }

  function getCompareItems() {
    const raw = Utils.getStorage(COMPARE_KEY, []);
    if (!Array.isArray(raw)) return [];

    return raw.map((item) => {
      if (typeof item === 'string') return { id: item };
      return item;
    });
  }

  async function loadCompareProducts(compareItems) {
    const resolved = [];

    for (const item of compareItems) {
      const product = await findProductByCompareItem(item);
      if (product) resolved.push(product);
    }

    return resolved;
  }

  async function findProductByCompareItem(item) {
    const id = item?.id;
    if (!id) return null;

    const categories = item.category ? [item.category, ...CATEGORIES] : CATEGORIES;
    const uniqueCategories = [...new Set(categories)];

    for (const category of uniqueCategories) {
      try {
        const response = await fetch(`${getProductsBasePath()}/${category}/${id}.json`);
        if (!response.ok) continue;
        const product = await response.json();
        return { ...product, category };
      } catch {
        // ignore and continue
      }
    }
    return null;
  }

  function showEmpty() {
    emptyStateEl?.classList.remove('hidden');
    contentEl?.classList.add('hidden');
  }

  function showContent() {
    emptyStateEl?.classList.add('hidden');
    contentEl?.classList.remove('hidden');
  }

  function getLang() {
    return window.i18n?.getCurrentLanguage?.() || 'uk';
  }

  function renderCards(products) {
    if (!cardsEl) return;
    const lang = getLang();

    cardsEl.innerHTML = products.map((product) => {
      const name = product.name?.[lang] || product.name?.uk || product.id;
      const image = Utils.fixImagePath(product.images?.[0]);
      const price = Utils.formatPrice(product.price || 0);
      const url = `../products/?id=${product.id}`;

      return `
        <article class="compare-card">
          <div class="compare-card-media">
            <img src="${image}" alt="${escapeHtml(name)}" loading="lazy" decoding="async" onerror="this.src=window.Utils.fixImagePath('assets/images/placeholder.svg')">
          </div>
          <div class="compare-card-name">${escapeHtml(name)}</div>
          <div class="compare-card-price">${price}</div>
          <div class="compare-card-actions">
            <a class="btn btn-outline" href="${url}">${t('compare_open', 'Відкрити')}</a>
            <button class="btn btn-primary remove-compare-btn" data-id="${product.id}">${t('compare_remove', 'Прибрати')}</button>
          </div>
        </article>
      `;
    }).join('');

    cardsEl.querySelectorAll('.remove-compare-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        removeFromCompare(btn.dataset.id);
      });
    });
  }

  function renderTable(products) {
    if (!tableEl) return;
    const lang = getLang();

    const rows = [
      { label: t('compare_price', 'Ціна'), getValue: (p) => Utils.formatPrice(p.price || 0) },
      { label: t('compare_rating', 'Рейтинг'), getValue: (p) => `${p.rating || '-'} / 5` },
      { label: t('compare_reviews', 'Відгуків'), getValue: (p) => `${p.reviews || 0}` },
      { label: t('compare_availability', 'Наявність'), getValue: (p) => p.inStock ? t('in_stock', 'В наявності') : t('out_of_stock', 'Немає в наявності') }
    ];

    const specsMap = buildSpecsMap(products, lang);
    Object.keys(specsMap).slice(0, 14).forEach((specKey) => {
      rows.push({
        label: specKey,
        getValue: (p) => specsMap[specKey][p.id] || '-'
      });
    });

    const head = `
      <thead>
        <tr>
          <th>${t('compare_parameter', 'Параметр')}</th>
          ${products.map((p) => `<th>${escapeHtml(p.name?.[lang] || p.name?.uk || p.id)}</th>`).join('')}
        </tr>
      </thead>
    `;

    const body = `
      <tbody>
        ${rows.map((row) => `
          <tr>
            <td>${escapeHtml(row.label)}</td>
            ${products.map((p) => `<td>${escapeHtml(String(row.getValue(p)))}</td>`).join('')}
          </tr>
        `).join('')}
      </tbody>
    `;

    tableEl.innerHTML = `${head}${body}`;
  }

  function buildSpecsMap(products, lang) {
    const result = {};

    products.forEach((product) => {
      const specs = product.specifications || {};
      Object.entries(specs).forEach(([rawKey, value], index) => {
        const baseKey = normalizeSpecLabel(rawKey, value, lang, index);
        const rowKey = findAvailableRowKey(result, baseKey, product.id);
        if (!result[rowKey]) result[rowKey] = {};
        result[rowKey][product.id] = value;
      });

      const localizedFeatures = product.features?.[lang] || product.features?.uk || [];
      localizedFeatures.forEach((feature, index) => {
        const baseKey = inferFeatureLabel(feature, index, lang);
        const rowKey = findAvailableRowKey(result, baseKey, product.id);
        if (!result[rowKey]) result[rowKey] = {};
        result[rowKey][product.id] = feature;
      });
    });
    return result;
  }

  function findAvailableRowKey(rows, baseKey, productId) {
    let key = baseKey;
    let suffix = 2;
    while (rows[key] && Object.prototype.hasOwnProperty.call(rows[key], productId)) {
      key = `${baseKey} ${suffix}`;
      suffix += 1;
    }
    return key;
  }

  function normalizeSpecLabel(rawKey, value, lang, index) {
    const key = String(rawKey || '').trim();
    const looksGeneric = /^(feature|specification|характеристика|спецификация)\s*\d*$/i.test(key);
    if (looksGeneric) return inferFeatureLabel(value, index, lang);

    const normalized = key.toLowerCase();
    const labels = {
      uk: {
        display: 'Дисплей',
        processor: 'Процесор',
        graphics: 'Відеокарта',
        camera: 'Камера',
        battery: 'Батарея',
        charging: 'Зарядка',
        memory: 'Оперативна памʼять',
        storage: 'Накопичувач',
        protection: 'Захист',
        connectivity: 'Підключення'
      },
      en: {
        display: 'Display',
        processor: 'Processor',
        graphics: 'Graphics',
        camera: 'Camera',
        battery: 'Battery',
        charging: 'Charging',
        memory: 'RAM',
        storage: 'Storage',
        protection: 'Protection',
        connectivity: 'Connectivity'
      },
      ru: {
        display: 'Дисплей',
        processor: 'Процессор',
        graphics: 'Видеокарта',
        camera: 'Камера',
        battery: 'Батарея',
        charging: 'Зарядка',
        memory: 'Оперативная память',
        storage: 'Накопитель',
        protection: 'Защита',
        connectivity: 'Подключение'
      }
    };

    const dict = labels[lang] || labels.uk;
    if (/(екран|display|screen)/.test(normalized)) return dict.display;
    if (/(процес|processor|chip|чип|soc)/.test(normalized)) return dict.processor;
    if (/(камера|camera)/.test(normalized)) return dict.camera;
    if (/(батар|battery|акум)/.test(normalized)) return dict.battery;
    if (/(заряд|charging|charge)/.test(normalized)) return dict.charging;
    if (/(озу|ram|оператив)/.test(normalized)) return dict.memory;
    if (/(накоп|storage|ssd|rom|память)/.test(normalized)) return dict.storage;
    if (/(ip\d{2}|захист|protection|water|dust)/.test(normalized)) return dict.protection;
    if (/(5g|wifi|wi-fi|bluetooth|nfc|gps|підключ|подключ)/.test(normalized)) return dict.connectivity;

    return key;
  }

  function inferFeatureLabel(feature, index, lang) {
    const text = String(feature || '').toLowerCase();

    const labels = {
      uk: {
        display: 'Дисплей',
        processor: 'Процесор',
        graphics: 'Відеокарта',
        camera: 'Камера',
        battery: 'Батарея',
        charging: 'Зарядка',
        memory: 'Оперативна памʼять',
        storage: 'Накопичувач',
        protection: 'Захист',
        connectivity: 'Підключення',
        gps: 'GPS',
        nfc: 'NFC',
        bluetooth: 'Bluetooth',
        health: 'Здоровʼя',
        tracking: 'Фітнес і трекінг',
        assistant: 'Голосовий помічник',
        water: 'Водозахист',
        material: 'Матеріали',
        audio: 'Аудіо',
        generic: 'Характеристика'
      },
      en: {
        display: 'Display',
        processor: 'Processor',
        graphics: 'Graphics',
        camera: 'Camera',
        battery: 'Battery',
        charging: 'Charging',
        memory: 'RAM',
        storage: 'Storage',
        protection: 'Protection',
        connectivity: 'Connectivity',
        gps: 'GPS',
        nfc: 'NFC',
        bluetooth: 'Bluetooth',
        health: 'Health',
        tracking: 'Fitness tracking',
        assistant: 'Voice assistant',
        water: 'Water resistance',
        material: 'Materials',
        audio: 'Audio',
        generic: 'Additional'
      },
      ru: {
        display: 'Дисплей',
        processor: 'Процессор',
        graphics: 'Видеокарта',
        camera: 'Камера',
        battery: 'Батарея',
        charging: 'Зарядка',
        memory: 'Оперативная память',
        storage: 'Накопитель',
        protection: 'Защита',
        connectivity: 'Подключение',
        gps: 'GPS',
        nfc: 'NFC',
        bluetooth: 'Bluetooth',
        health: 'Здоровье',
        tracking: 'Фитнес и трекинг',
        assistant: 'Голосовой помощник',
        water: 'Влагозащита',
        material: 'Материалы',
        audio: 'Аудио',
        generic: 'Дополнительно'
      }
    };

    const dict = labels[lang] || labels.uk;

    if (/\bgps\b/.test(text)) return dict.gps || dict.connectivity || dict.generic;
    if (/\bnfc\b/.test(text)) return dict.nfc || dict.connectivity || dict.generic;
    if (/(bluetooth|bt\s?\d)/.test(text)) return dict.bluetooth || dict.connectivity || dict.generic;
    if (/(sleep|tracking|fitness|sport|activity|крок|сон|трек|тренув)/.test(text)) return dict.tracking || dict.generic;
    if (/(heart rate|пульс|spo2|blood oxygen|кисн)/.test(text)) return dict.health || dict.generic;
    if (/(siri|assistant|голосов|voice)/.test(text)) return dict.assistant || dict.generic;
    if (/(5atm|water resistance|водо)/.test(text)) return dict.water || dict.protection || dict.generic;
    if (/(oled|amoled|ips|ltpo|display|диспл|екран|screen|hz|герц|inch|\"|”)/.test(text)) return dict.display || dict.generic;
    if (/(snapdragon|kirin|ryzen|intel|apple a|chip|processor|процес|чип)/.test(text)) return dict.processor || dict.generic;
    if (/(rtx|gtx|geforce|radeon|gpu|graphics|відеокарт|видеокарт)/.test(text)) return dict.graphics || dict.generic;
    if (/(camera|камера|mp|мп|xmage)/.test(text)) return dict.camera || dict.generic;
    if (/(mah|ма·?г|battery|батар|акум)/.test(text)) return dict.battery || dict.generic;
    if (/(charging|заряд|usb-c|type-c|w\b|вт)/.test(text)) return dict.charging || dict.generic;
    if (/(ram|озу|оператив)/.test(text)) return dict.memory || dict.generic;
    if (/(ssd|rom|storage|накоп|гб|tb\b|тб)/.test(text)) return dict.storage || dict.generic;
    if (/(ip\d{2}|waterproof|dust|волог|пил|захист)/.test(text)) return dict.protection || dict.generic;
    if (/(5g|wifi|wi-fi|bluetooth|nfc|gps)/.test(text)) return dict.connectivity || dict.generic;
    if (/(metal|aluminum|титан|корпус|скло|glass|body)/.test(text)) return dict.material || dict.generic;
    if (/(audio|speaker|dolby|навуш|headphone|buds)/.test(text)) return dict.audio || dict.generic;

    return dict.generic;
  }

  function renderInsights(products) {
    if (!insightsEl) return;
    const lang = getLang();

    const priceWinner = pickBest(products, (p) => Number(p.price) || Number.MAX_SAFE_INTEGER, 'min');
    const ratingWinner = pickBest(products, (p) => Number(p.rating) || 0, 'max');
    const reviewsWinner = pickBest(products, (p) => Number(p.reviews) || 0, 'max');
    const featuresWinner = pickBest(products, (p) => (p.features?.[lang] || p.features?.uk || []).length, 'max');

    const cards = [
      { label: t('compare_insight_best_price', 'Найвигідніша ціна'), winner: priceWinner },
      { label: t('compare_insight_best_rating', 'Найвищий рейтинг'), winner: ratingWinner },
      { label: t('compare_insight_most_reviews', 'Найбільше відгуків'), winner: reviewsWinner },
      { label: t('compare_insight_most_features', 'Найбільше переваг'), winner: featuresWinner }
    ];

    insightsEl.innerHTML = cards.map((item) => `
      <article class="insight-card">
        <div class="insight-label">${item.label}</div>
        <div class="insight-winner">${escapeHtml(item.winner)}</div>
      </article>
    `).join('');
  }

  function hasMixedCategories(products) {
    const groups = new Set(products.map((p) => getComparableGroup(p).key));
    return groups.size > 1;
  }

  function renderMixedCategoryWarning(products) {
    if (!warningEl) return;
    const groups = [...new Set(products.map((p) => getComparableGroup(p).key))];
    const names = groups.map(getGroupLabel).join(', ');
    const keepOnlyText = t('compare_keep_only', 'Залишити тільки');

    warningEl.classList.remove('hidden');
    warningEl.innerHTML = `
      <div class="compare-warning-title">${t('compare_warning_title', 'Неможливо порівнювати різні типи товарів')}</div>
      <div class="compare-warning-text">
        ${t('compare_warning_text', 'Зараз у списку різні типи:')} <strong>${escapeHtml(names)}</strong>.
        ${t('compare_warning_hint', 'Для коректного порівняння залиш товари лише одного типу (наприклад, чохол з чохлом або ремінець з ремінцем).')}
      </div>
      <div class="compare-warning-actions">
        ${groups.map((group) => `
          <button class="btn btn-outline keep-category-btn" data-group="${group}">
            ${keepOnlyText} ${escapeHtml(getGroupLabel(group))}
          </button>
        `).join('')}
      </div>
    `;

    warningEl.querySelectorAll('.keep-category-btn').forEach((btn) => {
      btn.addEventListener('click', () => keepOnlyGroup(btn.dataset.group));
    });
  }

  function pickBest(products, scoreFn, mode) {
    const lang = getLang();
    const withScore = products.map((p) => ({ p, score: scoreFn(p) }));
    const target = mode === 'min'
      ? Math.min(...withScore.map((x) => x.score))
      : Math.max(...withScore.map((x) => x.score));
    const winners = withScore
      .filter((x) => x.score === target)
      .map((x) => x.p.name?.[lang] || x.p.name?.uk || x.p.id);
    return winners.length > 1 ? `${t('compare_tie', 'Нічия')}: ${winners.join(' / ')}` : winners[0];
  }

  function removeFromCompare(productId) {
    let items = getCompareItems();
    items = items.filter((item) => item.id !== productId);
    Utils.setStorage(COMPARE_KEY, items);
    window.TechStore?.updateCompareCount?.();
    window.TechStore?.trackEvent?.('compare_remove_item', { productId });
    init();
  }

  function keepOnlyGroup(groupKey) {
    let items = getCompareItems();
    const groupById = new Map(
      currentProducts.map((product) => [product.id, getComparableGroup(product).key])
    );
    items = items.filter((item) => groupById.get(item.id) === groupKey);

    Utils.setStorage(COMPARE_KEY, items);
    window.TechStore?.updateCompareCount?.();
    window.TechStore?.trackEvent?.('compare_keep_only_group', { groupKey, itemsLeft: items.length });
    init();
  }

  function getCategoryLabel(category) {
    const map = {
      phones: 'category_phones',
      laptops: 'category_laptops',
      headphones: 'category_headphones',
      smartwatches: 'category_smartwatches',
      accessories: 'category_accessories',
      watches: 'category_watches'
    };
    const key = map[category];
    return key ? t(key, category) : category;
  }

  function getComparableGroup(product) {
    const category = product.category || '';
    const id = String(product.id || '').toLowerCase();
    const lang = getLang();
    const name = String(product.name?.[lang] || product.name?.uk || product.name?.en || product.id || '').toLowerCase();

    if (category !== 'accessories') {
      return { key: category, label: getCategoryLabel(category) };
    }

    if (id.includes('case') || name.includes('case') || name.includes('чохол')) {
      return { key: 'accessories_case', label: t('compare_group_case', 'Чохли') };
    }
    if (id.includes('band') || name.includes('band') || name.includes('ремінець')) {
      return { key: 'accessories_band', label: t('compare_group_band', 'Ремінці') };
    }
    if (id.includes('cable') || name.includes('cable') || name.includes('кабель')) {
      return { key: 'accessories_cable', label: t('compare_group_cable', 'Кабелі') };
    }
    if (id.includes('charger') || name.includes('charger') || name.includes('заряд')) {
      return { key: 'accessories_charger', label: t('compare_group_charger', 'Зарядки') };
    }
    if (id.includes('mouse') || id.includes('keyboard') || name.includes('мишка') || name.includes('клавіат')) {
      return { key: 'accessories_peripheral', label: t('compare_group_peripheral', 'Периферія') };
    }

    return { key: 'accessories_other', label: t('compare_group_other', 'Інші аксесуари') };
  }

  function getGroupLabel(groupKey) {
    const map = {
      accessories_case: t('compare_group_case', 'Чохли'),
      accessories_band: t('compare_group_band', 'Ремінці'),
      accessories_cable: t('compare_group_cable', 'Кабелі'),
      accessories_charger: t('compare_group_charger', 'Зарядки'),
      accessories_peripheral: t('compare_group_peripheral', 'Периферія'),
      accessories_other: t('compare_group_other', 'Інші аксесуари')
    };
    return map[groupKey] || getCategoryLabel(groupKey);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.addEventListener('languageChanged', init);
})();
