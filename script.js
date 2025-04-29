// Слайдер (без изменений)
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
let currentIndex = 0;

function showSlide(index) { /* ... */ }
function nextSlide() { /* ... */ }
dots.forEach((dot, index) => { /* ... */ });
setInterval(nextSlide, 4000);

// Корзина (без изменений)
function addToCart(product) { /* ... */ }
function updateCartCount() { /* ... */ }
function closeCart() { /* ... */ }
function showCart() { /* ... */ }

// Загрузка и отображение товаров (исправленная версия)
async function loadProducts() {
  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
    const products = await response.json();

    const grouped = {};
    products.forEach(product => {
      const key = `${product.brand}|||${product.name}|||${product.menu}|||${product.density}`;
      if (!grouped[key]) grouped[key] = { ...product, options: [] };
      grouped[key].options.push({ size: product.size, color: product.color, price: product.price });
    });

    const container = document.getElementById('product-list');
    container.innerHTML = '';

    Object.values(grouped).forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';

      // Новая логика фильтрации
      const variantsMap = new Map();
      product.options.forEach(({size, color}) => {
        if (!variantsMap.has(size)) variantsMap.set(size, new Set());
        variantsMap.get(size).add(color);
      });

      const sizeSelect = document.createElement('select');
      const colorSelect = document.createElement('select');
      let selectedSize = '';
      let selectedColor = '';

      function updateSizes() {
        sizeSelect.innerHTML = '<option value="">Выберите размер</option>';
        const sizes = Array.from(variantsMap.keys());
        sizes.forEach(size => {
          const option = document.createElement('option');
          option.value = size;
          option.textContent = size;
          if (size === selectedSize) option.selected = true;
          sizeSelect.appendChild(option);
        });
      }

      function updateColors() {
        colorSelect.innerHTML = '<option value="">Выберите цвет</option>';
        const colors = selectedSize 
          ? Array.from(variantsMap.get(selectedSize) 
          : Array.from(new Set(
              Array.from(variantsMap.values())
                .flatMap(set => Array.from(set))
            ));

        colors.forEach(color => {
          const option = document.createElement('option');
          option.value = color;
          option.textContent = color;
          if (color === selectedColor) option.selected = true;
          colorSelect.appendChild(option);
        });

        if (!colors.includes(selectedColor)) selectedColor = '';
      }

      function syncSelections() {
        const isValid = selectedSize && selectedColor && 
          variantsMap.get(selectedSize)?.has(selectedColor);
        
        button.disabled = !isValid;
        if (!isValid) {
          selectedSize = '';
          selectedColor = '';
        }
      }

      sizeSelect.addEventListener('change', () => {
        selectedSize = sizeSelect.value;
        selectedColor = '';
        updateColors();
        syncSelections();
      });

      colorSelect.addEventListener('change', () => {
        selectedColor = colorSelect.value;
        if (selectedColor) {
          const availableSizes = Array.from(variantsMap.entries())
            .filter(([_, colors]) => colors.has(selectedColor))
            .map(([size]) => size);
          
          if (!availableSizes.includes(selectedSize)) {
            selectedSize = '';
            updateSizes();
          }
        }
        syncSelections();
      });

      // Инициализация
      updateSizes();
      updateColors();
      syncSelections();

      // Остальная часть создания карточки
      card.innerHTML = `
        <img src="${product.picture}" alt="${product.name}">
        <h2>${product.brand} — ${product.name}</h2>
        <p class="meta">${product.menu}, ${product.density}</p>
        <p class="price">${product.price} ₽</p>
        <label>Размер:</label>
      `;
      
      card.appendChild(sizeSelect);
      card.innerHTML += `<label>Цвет:</label>`;
      card.appendChild(colorSelect);

      const button = document.createElement('button');
      button.className = 'btn';
      button.textContent = 'В корзину';
      button.disabled = true;
      
      button.addEventListener('click', () => {
        const validVariant = product.options.find(o => 
          o.size === selectedSize && o.color === selectedColor
        );
        
        if (validVariant) {
          addToCart({ ...product, ...validVariant });
        }
      });

      card.appendChild(button);
      container.appendChild(card);
    });

  } catch (err) {
    console.error('❌ Ошибка загрузки:', err.message);
    document.getElementById('product-list').innerHTML = `<p style="color:red;">Не удалось загрузить товары.</p>`;
  }
}

// Инициализация (без изменений)
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartCount();
  document.getElementById('cart-btn').addEventListener('click', showCart);
});
