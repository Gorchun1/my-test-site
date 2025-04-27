// Функция загрузки товаров из XML
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
            productCard.className = 'product-card';

            productCard.innerHTML = `
                <img src="${picture}" alt="${name}" class="product-image">
                <h3 class="product-name">${name}</h3>
                <p class="product-price">${price} ₽</p>
                <button class="btn-primary">В корзину</button>
            `;

            productList.appendChild(productCard);
        });
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        document.getElementById('product-list').innerHTML = `<p>Не удалось загрузить товары. Попробуйте позже.</p>`;
    }
}

// Загружаем товары при старте страницы
document.addEventListener('DOMContentLoaded', loadProducts);
