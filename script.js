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

// Корзина (оптимизированная версия)
function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem('cart') || [];
  const exists = cart.some(item => 
    item.brand === product.brand &&
    item.name === product.name &&
    item.size === product.size &&
    item.color === product.color
  );
  
  if (!exists) {
    cart.push(product);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    alert(`Добавлено: ${product.name} (${product.size}/${product.color})`);
  } else {
    alert('Товар уже в корзине!');
  }
}

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  document.getElementById('cart-count').textContent = cart.length;
}

function closeCart() {
  document.getElementById('cart-modal').style.display = 'none';
}

function showCart() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const list = document.getElementById('cart-items');
  list.innerHTML = cart.map(item => `
    <li>
      ${item.brand} ${item.name} - 
      ${item.size}/${item.color} - 
      ${item.price} ₽
    </li>
  `).join('');
  document.getElementById('cart-modal').style.display = 'flex';
}

// Улучшенная логика товаров
async function loadProducts() {
  try {
    const response = await fetch('products.json');
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const products = await response.json();

    const productMap = products.reduce((acc, product) => {
      const key = [product.brand, product.name, product.menu, product.density].join('||');
      if (!acc[key]) {
        acc[key] = {
          ...product,
          variants: new Map()
        };
      }
      acc[key].variants.set(`${product.size}|${product.color}`, {
        size: product.size,
        color: product.color,
        price: product.price
      });
      return acc;
    }, {});

    const container = document.getElementById('product-list');
    container.innerHTML = '';

    Object.values(productMap).forEach(group => {
      const card = document.createElement('div');
      card.className = 'product-card';
      
      // Генератор опций
      const createOptions = (values, selected) => {
        const fragment = document.createDocumentFragment();
        fragment.appendChild(new Option('Выберите...', ''));
        values.forEach(value => {
          const option = new Option(value, value);
          option.selected = value === selected;
          fragment.appendChild(option);
        });
        return fragment;
      };

      // Элементы управления
      const sizeSelect = document.createElement('select');
      const colorSelect = document.createElement('select');
      const button = document.createElement('button');
      button.className = 'btn';
      button.textContent = 'В корзину';
      button.disabled = true;

      // Состояния выбора
      let currentSize = '';
      let currentColor = '';

      // Обновление селектов
      const updateSelects = () => {
        const sizes = [...new Set(
          currentColor 
            ? [...group.variants.values()]
                .filter(v => v.color === currentColor)
                .map(v => v.size)
            : [...group.variants.values()].map(v => v.size)
        )].sort();

        const colors = [...new Set(
          currentSize 
            ? [...group.variants.values()]
                .filter(v => v.size === currentSize)
                .map(v => v.color)
            : [...group.variants.values()].map(v => v.color)
        )].sort();

        sizeSelect.replaceChildren(createOptions(sizes, currentSize));
        colorSelect.replaceChildren(createOptions(colors, currentColor));

        button.disabled = !group.variants.has(`${currentSize}|${currentColor}`);
      };

      // Обработчики событий
      sizeSelect.addEventListener('change', () => {
        currentSize = sizeSelect.value;
        currentColor = '';
        updateSelects();
      });

      colorSelect.addEventListener('change', () => {
        currentColor = colorSelect.value;
        if (currentColor) {
          const validSizes = [...group.variants.values()]
            .filter(v => v.color === currentColor)
            .map(v => v.size);
          if (!validSizes.includes(currentSize)) {
            currentSize = '';
          }
        }
        updateSelects();
      });

      button.addEventListener('click', () => {
        const variant = group.variants.get(`${currentSize}|${currentColor}`);
        addToCart({ 
          ...group,
          size: variant.size,
          color: variant.color,
          price: variant.price
        });
      });

      // Инициализация
      updateSelects();
      
      // Сборка карточки
      card.innerHTML = `
        <img src="${group.picture}" alt="${group.name}">
        <h2>${group.brand} ${group.name}</h2>
        <p>${group.menu}, ${group.density}</p>
        <p class="price">${group.price} ₽</p>
        <label>Размер:</label>
      `;
      card.append(sizeSelect);
      card.innerHTML += `<label>Цвет:</label>`;
      card.append(colorSelect, button);
      container.append(card);
    });

  } catch (error) {
    console.error('Ошибка:', error);
    document.getElementById('product-list').innerHTML = `
      <p class="error">Ошибка загрузки товаров: ${error.message}</p>
    `;
  }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCartCount();
  document.getElementById('cart-btn').addEventListener('click', showCart);
  document.querySelector('.close-btn').addEventListener('click', closeCart);
});
