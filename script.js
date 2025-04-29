// Корзина
function addToCart(name, size, color, price) {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart.push({ name, size, color, price });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert(`Добавлено: ${name} — ${size} / ${color}`);
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  document.getElementById('cart-count').innerText = cart.length;
}

function showCart() {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const list = document.getElementById('cart-items');
  list.innerHTML = '';
  cart.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name} — ${item.size} / ${item.color} — ${item.price} ₽`;
    list.appendChild(li);
  });
  document.getElementById('cart-modal').style.display = 'flex';
}

// Загрузка товаров и логика селектов
async function loadProducts() {
  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
    const products = await response.json();

    const grouped = {};

    products.forEach(product => {
      const key = `${product.brand}|||${product.name}|||${product.menu}|||${product.density}`;
      if (!grouped[key]) {
        grouped[key] = {
          ...product,
          options: []
        };
      }
      grouped[key].options.push({
        size: product.size,
        color: product.color,
        price: product.price
      });
    });

    const container = document.getElementById('product-list');
    container.innerHTML = '';

    Object.values(grouped).forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';

      const matrix = {};
      product.options.forEach(o => {
        if (!matrix[o.size]) matrix[o.size] = new Set();
        matrix[o.size].add(o.color);
      });

      const sizes = Object.keys(matrix);
      let currentSize = sizes[0];
      let currentColor = [...matrix[currentSize]][0];

      const sizeSelect = document.createElement('select');
      const colorSelect = document.createElement('select');

      function updateColorOptions(selectedSize) {
        colorSelect.innerHTML = '';
        const colors = [...matrix[selectedSize]];
        colors.forEach(color => {
          const opt = document.createElement('option');
          opt.value = color;
          opt.textContent = color;
          colorSelect.appendChild(opt);
        });
        currentColor = colorSelect.value;
      }

      function updateSizeOptions(selectedColor) {
        sizeSelect.innerHTML = '';
        sizes.forEach(size => {
          if (matrix[size].has(selectedColor)) {
            const opt = document.createElement('option');
            opt.value = size;
            opt.textContent = size;
            sizeSelect.appendChild(opt);
          }
        });
        currentSize = sizeSelect.value;
      }

      sizeSelect.addEventListener('change', () => {
        currentSize = sizeSelect.value;
        updateColorOptions(currentSize);
      });

      colorSelect.addEventListener('change', () => {
        currentColor = colorSelect.value;
        updateSizeOptions(currentColor);
      });

      updateSizeOptions(currentColor);
      updateColorOptions(currentSize);

      // HTML карточки
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
      button.addEventListener('click', () => {
        const size = sizeSelect.value;
        const color = colorSelect.value;
        const match = product.options.find(o => o.size === size && o.color === color);
        if (match) {
          addToCart(product.name, size, color, match.price);
        } else {
          alert('❌ Такой комбинации нет!');
        }
      });

      card.appendChild(button);
      container.appendChild(card);
    });

    console.log(`✅ Загружено: ${Object.keys(grouped).length} карточек`);
  } catch (err) {
    console.error('❌ Ошибка загрузки:', err.message);
    document.getElementById('product-list').innerHTML = `<p style="color:red;">Не удалось загрузить товары.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartCount();
  document.getElementById('cart-btn').addEventListener('click', showCart);
});
