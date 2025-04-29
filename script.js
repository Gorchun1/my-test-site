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
function addToCart(product) {
  const cart = JSON.parse(localStorage.getItem('cart') || '[]');
  cart.push(product);
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert(`Добавлено: ${product.name} — ${product.size} / ${product.color}`);
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

      // Матрица допустимых комбинаций
      const sizeColorMap = {};
      const colorSizeMap = {};
      
      product.options.forEach(o => {
        if (!sizeColorMap[o.size]) sizeColorMap[o.size] = new Set();
        if (!colorSizeMap[o.color]) colorSizeMap[o.color] = new Set();
        
        sizeColorMap[o.size].add(o.color);
        colorSizeMap[o.color].add(o.size);
      });

      const sizeSelect = document.createElement('select');
      const colorSelect = document.createElement('select');

      function updateSizeOptions(selectedColor = null) {
        sizeSelect.innerHTML = '<option value="">Выберите размер</option>';
        const sizes = selectedColor 
          ? [...colorSizeMap[selectedColor]] 
          : Object.keys(sizeColorMap);
        
        sizes.forEach(size => {
          const opt = document.createElement('option');
          opt.value = size;
          opt.textContent = size;
          sizeSelect.appendChild(opt);
        });
      }

      function updateColorOptions(selectedSize = null) {
        colorSelect.innerHTML = '<option value="">Выберите цвет</option>';
        const colors = selectedSize 
          ? [...sizeColorMap[selectedSize]] 
          : Object.keys(colorSizeMap);
        
        colors.forEach(color => {
          const opt = document.createElement('option');
          opt.value = color;
          opt.textContent = color;
          colorSelect.appendChild(opt);
        });
      }

      // Инициализация
      updateSizeOptions();
      updateColorOptions();

      sizeSelect.addEventListener('change', () => {
        updateColorOptions(sizeSelect.value);
      });

      colorSelect.addEventListener('change', () => {
        updateSizeOptions(colorSelect.value);
      });

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
        
        if (!size || !color) {
          alert('❌ Выберите размер и цвет!');
          return;
        }

        const match = product.options.find(o => o.size === size && o.color === color);
        if (match) {
          addToCart({
            brand: product.brand,
            name: product.name,
            menu: product.menu,
            density: product.density,
            size: size,
            color: color,
            price: match.price,
            picture: product.picture
          });
        } else {
          alert('❌ Такой комбинации нет в наличии!');
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
