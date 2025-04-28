// script.js

async function loadProducts() {
  try {
    const response = await fetch('products.json');

    if (!response.ok) {
      throw new Error(`Ошибка загрузки товаров: ${response.status} ${response.statusText}`);
    }

    const products = await response.json();
    const productList = document.getElementById('product-list');

    productList.innerHTML = ''; // Очищаем список перед загрузкой новых товаров

    products.forEach(product => {
      const name = product.name || 'Без названия';
      const price = product.price || '0';
      const picture = Array.isArray(product.picture) ? product.picture[0] : product.picture || 'https://via.placeholder.com/300x400?text=Нет+фото';

      const productCard = document.createElement('div');
      productCard.className = 'product-card';

      productCard.innerHTML = `
        <img src="${picture}" alt="${name}" class="product-image">
        <h3 class="product-name">${name}</h3>
        <p class="product-price">${price} ₽</p>
        <button class="btn-primary">В корзину</button>
      `;

      productList.appendChild(productCard);
    });

    console.log(`✅ Товары успешно загружены: ${products.length} шт.`);
  } catch (error) {
    console.error('❌ Ошибка при загрузке товаров:', error.message);
    document.getElementById('product-list').innerHTML = `<p>Не удалось загрузить товары. Попробуйте позже.</p>`;
  }
}

function closeCart() {
  document.getElementById('cart-modal').style.display = 'none';
}

// Запускаем загрузку товаров при старте страницы
document.addEventListener('DOMContentLoaded', loadProducts);
