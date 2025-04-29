// Слайдер
const slides = document.querySelectorAll('.slide');
const dots = document.querySelectorAll('.dot');
let currentIndex = 0;

function showSlide(index) {
  slides.forEach(slide => slide.classList.remove('active'));
  dots.forEach(dot => dot.classList.remove('active'));
  slides[index].classList.add('active');
  dots[index].classList.add('active');
}

function nextSlide() {
  currentIndex = (currentIndex + 1) % slides.length;
  showSlide(currentIndex);
}

dots.forEach((dot, index) => {
  dot.addEventListener('click', () => {
    currentIndex = index;
    showSlide(currentIndex);
  });
});

setInterval(nextSlide, 4000);

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

function closeCart() {
  document.getElementById('cart-modal').style.display = 'none';
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

// Загрузка и отображение товаров
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

      // Собираем уникальные значения
      const sizes = [...new Set(product.options.map(o => o.size))];
      const colors = [...new Set(product.options.map(o => o.color))];

      // Матрица доступных комбинаций
      const matrix = {};
      product.options.forEach(o => {
        if (!matrix[o.size]) matrix[o.size] = new Set();
        matrix[o.size].add(o.color);
      });

      function getValidColorsForSize(size) {
        return matrix[size] ? [...matrix[size]] : [];
      }

      function getValidSizesForColor(color) {
        return Object.keys(matrix).filter(size => matrix[size].has(color));
      }

      // Генерация селектов
      let selectedSize = sizes[0];
      let validColors = getValidColorsForSize(selectedSize);

      const sizeSelect = document.createElement('select');
      sizeSelect.className = 'size-select';
      sizes.forEach(size => {
        const opt = document.createElement('option');
        opt.value = size;
        opt.textContent = size;
        sizeSelect.appendChild(opt);
      });

      const colorSelect = document.createElement('select');
      colorSelect.className = 'color-select';
      validColors.forEach(color => {
        const opt = document.createElement('option');
        opt.value = color;
        opt.textContent = color;
        colorSelect.appendChild(opt);
      });

      // Обновление color при смене size
      sizeSelect.addEventListener('change', () => {
        const size = sizeSelect.value;
        const valid = getValidColorsForSize(size);
        updateSelectOptions(colorSelect, valid);
      });

      // Обновление size при смене color
      colorSelect.addEventListener('change', () => {
        const color = colorSelect.value;
        const valid = getValidSizesForColor(color);
        updateSelectOptions(sizeSelect, valid);
      });

      function updateSelectOptions(select, values) {
        const current = select.value;
        select.innerHTML = '';
        values.forEach(v => {
          const opt = document.createElement('option');
          opt.value = v;
          opt.textContent = v;
          select.appendChild(opt);
        });
        if (!values.includes(current)) {
          select.value = values[0]; // fallback
        } else {
          select.value = current;
        }
      }

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
        if (match) addToCart(product.name, size, color, match.price);
      });

      card.appendChild(button);
      container.appendChild(card);
    });

    console.log(`✅ Товаров: ${Object.keys(grouped).length}`);
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
