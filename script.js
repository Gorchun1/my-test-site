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
    container.innerHTML = ''; // Очистка контейнера перед рендером новых товаров

    Object.values(grouped).forEach(product => {
      const card = document.createElement('div');
      card.className = 'product-card'; // Используем класс для стилизации карточки

      // Матрица допустимых комбинаций
      const matrix = {};
      product.options.forEach(o => {
        if (!matrix[o.size]) matrix[o.size] = new Set();
        matrix[o.size].add(o.color);
      });

      let currentSize = Object.keys(matrix)[0]; // Выбираем первый доступный размер
      let currentColor = [...matrix[currentSize]][0]; // Выбираем первый доступный цвет

      const sizeSelect = document.createElement('select'); // Элемент для выбора размера
      const colorSelect = document.createElement('select'); // Элемент для выбора цвета

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

      // Первоначальная инициализация
      renderSizeOptions();
      renderColorOptions(currentSize);

      // Обработчики изменений
      sizeSelect.addEventListener('change', () => {
        const selectedSize = sizeSelect.value;
        renderColorOptions(selectedSize); // Обновляем список цветов
      });

      colorSelect.addEventListener('change', () => {
        const selectedColor = colorSelect.value;
        renderSizeOptions(selectedColor); // Обновляем список размеров
      });

      // HTML-код карточки товара
      card.innerHTML = `
        <img src="${product.picture}" alt="${product.name}">
        <h2>${product.brand} — ${product.name}</h2>
        <p class="meta">${product.menu}, ${product.density}</p>
        <p class="price">${product.price} ₽</p>
        <label>Размер:</label>
      `;
      card.appendChild(sizeSelect); // Добавляем элемент выбора размера
      card.innerHTML += `<label>Цвет:</label>`;
      card.appendChild(colorSelect); // Добавляем элемент выбора цвета

      const button = document.createElement('button');
      button.className = 'btn'; // Применяем класс для стилизации кнопки
      button.textContent = 'В корзину';
      button.addEventListener('click', () => {
        const size = sizeSelect.value;
        const color = colorSelect.value;
        const match = product.options.find(o => o.size === size && o.color === color);
        if (match) {
          addToCart(product.name, size, color, match.price);
        } else {
          alert('❌ Такая комбинация отсутствует.');
        }
      });

      card.appendChild(button); // Добавляем кнопку "В корзину"
      container.appendChild(card); // Добавляем карточку в контейнер
    });

    console.log(`✅ Загружено: ${Object.keys(grouped).length} карточек`);
  } catch (err) {
    console.error('❌ Ошибка загрузки:', err.message);
    document.getElementById('product-list').innerHTML = `<p style="color: red;">Не удалось загрузить товары.</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts(); // Запускаем загрузку товаров при полной готовности документа
  updateCartCount(); // Обновляем количество товаров в корзине
  document.getElementById('cart-btn').addEventListener('click', showCart); // Открываем корзину по кнопке
});
