// Слайдер (без изменений)
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

// Загрузка товаров с группировкой
async function loadProducts() {
  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error(`Ошибка: ${response.status} ${response.statusText}`);
    const products = await response.json();

    const grouped = {};

    products.forEach(product => {
      const key = `${product.brand}|||${product.name}|||${product.menu}|||${product.density}`;
      if (!grouped[key]) {
        grouped[key] = {
          ...product,
          sizes: new Set(),
          colors: new Set()
        };
      }
      grouped[key].sizes.add(product.size);
      grouped[key].colors.add(product.color);
    });

    const container = document.getElementById('product-list');
    container.innerHTML = '';

    Object.values(grouped).forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card';

      const sizes = Array.from(product.sizes).map(size => `<option value="${size}">${size}</option>`).join('');
      const colors = Array.from(product.colors).map(color => `<option value="${color}">${color}</option>`).join('');

      card.innerHTML = `
        <img src="${product.picture}" alt="${product.name}">
        <h2>${product.brand} — ${product.name}</h2>
        <p class="meta">${product.menu}, ${product.density}</p>
        <p class="price">${product.price} ₽</p>
        <label>Размер:
          <select class="size-select">${sizes}</select>
        </label>
        <label>Цвет:
          <select class="color-select">${colors}</select>
        </label>
        <button class="btn">В корзину</button>
      `;

      card.querySelector('button').addEventListener('click', () => {
        const size = card.querySelector('.size-select').value;
        const color = card.querySelector('.color-select').value;
        addToCart(product.name, size, color, product.price);
      });

      container.appendChild(card);
    });

    console.log(`✅ Загружено групп: ${Object.keys(grouped).length}`);
  } catch (err) {
    console.error('❌ Ошибка при загрузке товаров:', err.message);
    document.getElementById('product-list').innerHTML = `<p style="color:red;text-align:center;">Не удалось загрузить товары</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartCount();
  document.getElementById('cart-btn').addEventListener('click', showCart);
});
