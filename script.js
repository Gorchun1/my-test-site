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
function addToCart(name) {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart.push({ name });
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert(`Добавлено в корзину: ${name}`);
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
    li.textContent = `${item.name}`;
    list.appendChild(li);
  });
  document.getElementById('cart-modal').style.display = 'flex';
}

// Загрузка товаров
async function loadProducts() {
  try {
    const response = await fetch('products.json');

    if (!response.ok) {
      throw new Error(`Ошибка загрузки товаров: ${response.status} ${response.statusText}`);
    }

    const products = await response.json();
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';

    products.forEach(product => {
      const name = product.name || 'Без названия';
      const price = product.price || '0';
      const picture = Array.isArray(product.picture) ? product.picture[0] : product.picture || 'https://via.placeholder.com/300x400?text=Нет+фото';

      const productCard = document.createElement('div');
      productCard.className = 'product-card animate';

      productCard.innerHTML = `
        <img src="${picture}" alt="${name}" class="product-image">
        <h2>${name}</h2>
        <p class="price">${price} ₽</p>
        <button class="btn" onclick="addToCart('${name}')">Купить</button>
      `;

      productList.appendChild(productCard);
    });

    console.log(`✅ Товары успешно загружены: ${products.length} шт.`);
  } catch (error) {
    console.error('❌ Ошибка при загрузке товаров:', error.message);
    document.getElementById('product-list').innerHTML = `<p style="color:red;text-align:center;">Не удалось загрузить товары. Попробуйте позже.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartCount();
  document.getElementById('cart-btn').addEventListener('click', showCart);
});
