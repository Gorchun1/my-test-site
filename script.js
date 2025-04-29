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

// Загрузка товаров и группировка
async function loadProducts() {
  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error(`Ошибка: ${response.status}`);
    const products = await response.json();

    // Группировка по brand+name+menu+density
    const grouped = {};

    products.forEach(product => {
      const key = `${product.brand}|||${product.name}|||${product.menu}|||${product.density}`;
      if (!grouped[key]) {
        grouped[key] = {
          ...product,
          sizes: [],
          colors: [],
          options: []
        };
      }
      if (!grouped[key].sizes.includes(product.size)) grouped[key].sizes.push(product.size);
      if (!grouped[key].colors.includes(product.color)) grouped[key].colors.push(product.color);
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

      const sizeOptions = product.sizes.map(size => `<option value="${size}">${size}</option>`).join('');
      const colorOptions = product.colors.map(color => `<option value="${color}">${color}</option>`).join('');

      card.innerHTML = `
        <img src="${product.picture}" alt="${product.name}">
        <h2>${product.brand} — ${product.name}</h2>
        <p class="meta">${product.menu}, ${product.density}</p>
        <p class="price">${product.price} ₽</p>
        <label>Размер:
          <select class="size-select">${sizeOptions}</select>
        </label>
        <label>Цвет:
          <select class="color-select">${colorOptions}</select>
        </label>
        <button class="btn">В корзину</button>
      `;

      card.querySelector('button').addEventListener('click', () => {
        const size = card.querySelector('.size-select').value;
        const color = card.querySelector('.color-select').value;
        const match = product.options.find(o => o.size === size && o.color === color);
        const price = match ? match.price : product.price;
        addToCart(product.name, size, color, price);
      });

      container.appendChild(card);
    });

    console.log(`✅ Загружено карточек: ${Object.keys(grouped).length}`);
  } catch (error) {
    console.error('❌ Ошибка загрузки:', error.message);
    document.getElementById('product-list').innerHTML = `<p style="color:red;">Не удалось загрузить товары.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartCount();
  document.getElementById('cart-btn').addEventListener('click', showCart);
});
