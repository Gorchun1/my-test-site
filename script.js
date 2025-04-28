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
let cart = [];

function addToCart(product) {
  cart.push(product);
  updateCartCount();
  alert(`Добавлено в корзину: ${product}`);
}

function updateCartCount() {
  document.getElementById('cart-count').innerText = cart.length;
}

function closeCart() {
  document.getElementById('cart-modal').style.display = 'none';
}

// Загрузка товаров из XML
async function loadProducts() {
    try {
        const response = await fetch('https://prokolgotki.ru/available.xml');
        const xmlText = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "application/xml");
        const offers = xml.querySelectorAll('offer');

        const productList = document.getElementById('product-list');

        offers.forEach(offer => {
            const name = offer.querySelector('name')?.textContent || 'Без названия';
            const price = offer.querySelector('price')?.textContent || '0';
            const picture = offer.querySelector('picture')?.textContent || 'https://via.placeholder.com/300x400?text=Нет+фото';

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
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        document.getElementById('product-list').innerHTML = `<p>Не удалось загрузить товары. Попробуйте позже.</p>`;
    }
}

document.addEventListener('DOMContentLoaded', loadProducts);
