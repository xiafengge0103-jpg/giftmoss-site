// Product Loader - dynamically loads and renders products from JSON data
(function () {
  const DATA_PATH = 'data/';

  async function loadJSON(file) {
    const res = await fetch(DATA_PATH + file);
    if (!res.ok) throw new Error('Failed to load ' + file);
    return res.json();
  }

  // Render a single product card
  function renderProductCard(product, categoryName) {
    const catTag = categoryName || '';
    return `
      <article class="product-card" data-category="${product.category}">
        <img src="${product.image}" alt="${product.title}" onerror="this.style.display='none'">
        <div class="product-info">
          <div class="product-top">
            <h3>${product.title}</h3>
            <span class="tag">${catTag || product.tags[0] || ''}</span>
          </div>
          <p>${product.description}</p>
          <div class="specs">${(product.tags || []).map(t => `<span>${t}</span>`).join('')}</div>
          <div class="product-meta">
            ${product.price ? `<span class="meta-price">${product.price}</span>` : ''}
            ${product.moq ? `<span class="meta-moq">MOQ: ${product.moq}</span>` : ''}
            ${product.oem ? '<span class="meta-oem">OEM</span>' : ''}
          </div>
          <a class="btn btn-outline" href="wholesale.html">Inquire Now</a>
        </div>
      </article>`;
  }

  // Render category card
  function renderCategoryCard(cat) {
    return `
      <a class="category-card" href="products.html?category=${cat.id}">
        <div class="cat-icon-placeholder">${cat.icon || '📦'}</div>
        <div class="body">
          <h3>${cat.name}</h3>
          <p>${cat.description}</p>
          <div class="cat-tags">${(cat.tags || []).map(t => `<span>${t}</span>`).join('')}</div>
        </div>
      </a>`;
  }

  // Load and render category grid
  window.loadCategoryGrid = async function (containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    try {
      const categories = await loadJSON('categories.json');
      container.innerHTML = categories.map(renderCategoryCard).join('');
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  // Load and render product grid
  window.loadProductGrid = async function (containerSelector, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    try {
      const [products, categories] = await Promise.all([
        loadJSON('products.json'),
        loadJSON('categories.json')
      ]);

      let filtered = products;

      // Filter by category
      if (options.category) {
        filtered = filtered.filter(p => p.category === options.category);
      }

      // Filter featured only
      if (options.featuredOnly) {
        filtered = filtered.filter(p => p.featured);
      }

      // Limit
      if (options.limit) {
        filtered = filtered.slice(0, options.limit);
      }

      const catMap = {};
      categories.forEach(c => { catMap[c.id] = c.name; });

      container.innerHTML = filtered.length
        ? filtered.map(p => renderProductCard(p, catMap[p.category])).join('')
        : '<p class="empty-msg">No products found in this category.</p>';
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  // Load filter buttons
  window.loadCategoryFilters = async function (containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    try {
      const categories = await loadJSON('categories.json');
      const allBtn = '<button class="filter-btn active" data-filter="all">All</button>';
      const catBtns = categories.map(c =>
        `<button class="filter-btn" data-filter="${c.id}">${c.name}</button>`
      ).join('');
      container.innerHTML = allBtn + catBtns;

      // Bind filter events
      container.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const filter = btn.dataset.filter;
          await window.loadProductGrid('.product-grid', {
            category: filter === 'all' ? null : filter
          });
        });
      });
    } catch (err) {
      console.error('Failed to load filters:', err);
    }
  };

  // Auto-init: detect URL param for category filter
  document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('category');
    if (catParam && window.initProductPage) {
      window.initProductPage(catParam);
    }
  });
})();
