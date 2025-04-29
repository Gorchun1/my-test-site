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
      const matrix = {};
      product.options.forEach(o => {
        if (!matrix[o.size]) matrix[o.size] = new Set();
        matrix[o.size].add(o.color);
      });

      const card = createProductCard(product, matrix);
      container.appendChild(card);
    });

    console.log(`✅ Загружено: ${Object.keys(grouped).length} карточек`);
  } catch (err) {
    console.error('❌ Ошибка загрузки:', err.message);
    document.getElementById('product-list').innerHTML = `<p style="color:red;">Не удалось загрузить товары.</p>`;
  }
}

function createProductCard(product, matrix) {
  const card = document.createElement('div');
  card.className = 'product-card';

  const sizeSelect = document.createElement('select');
  const colorSelect = document.createElement('select');

  function renderSizeOptions(selectedColor = null) {
    sizeSelect.innerHTML = '';
    Object.keys(matrix).forEach(size => {
      if (selectedColor === null || matrix[size].has(selectedColor)) {
        const opt = document.createElement('option');
        opt.value = size;
        opt.textContent = size;
        sizeSelect.appendChild(opt);
      }
    });
  }

  function renderColorOptions(selectedSize = null) {
    colorSelect.innerHTML = '';
    if (!selectedSize || !matrix[selectedSize]) return;
    [...matrix[selectedSize]].forEach(color => {
      const opt = document.createElement('option');
      opt.value = color;
      opt.textContent = color;
      colorSelect.appendChild(opt);
    });
  }

  renderSizeOptions();
  renderColorOptions(Object.keys(matrix)[0]);

  sizeSelect.addEventListener('change', () => {
    const selectedSize = sizeSelect.value;
    renderColorOptions(selectedSize);
    updateButtonState();
  });

  colorSelect.addEventListener('change', () => {
    const selectedColor = colorSelect.value;
    renderSizeOptions(selectedColor);
    updateButtonState();
  });

  const button = document.createElement('button');
  button.className = 'btn';
  button.textContent = 'В корзину';
  button.disabled = true;

  function updateButtonState() {
    const selectedSize = sizeSelect.value;
    const selectedColor = colorSelect.value;
    const isValidCombination = product.options.some(
      o => o.size === selectedSize && o.color === selectedColor
    );
    button.disabled = !isValidCombination;
  }

  button.addEventListener('click', () => {
    const size = sizeSelect.value;
    const color = colorSelect.value;
    const match = product.options.find(o => o.size === size && o.color === color);
    if (match) {
      addToCart(product.name, size, color, match.price);
    } else {
      alert('❌ Такой комбинации нет в наличии!');
    }
  });

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
  card.appendChild(button);

  return card;
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartCount();
  document.getElementById('cart-btn').addEventListener('click', showCart);
});
