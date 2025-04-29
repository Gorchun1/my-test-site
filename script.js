fetch('products.json')
  .then(response => response.json())
  .then(products => {
    const groupedProducts = {};

    // Группируем товары по имени (или id, если нужно точнее)
    products.forEach(product => {
      const key = product.name;
      if (!groupedProducts[key]) {
        groupedProducts[key] = [];
      }
      groupedProducts[key].push(product);
    });

    const container = document.getElementById('products-container');

    Object.keys(groupedProducts).forEach(productName => {
      const productGroup = groupedProducts[productName];
      const product = productGroup[0]; // используем первый для общих данных

      const card = document.createElement('div');
      card.className = 'product-card';

      const title = document.createElement('h3');
      title.textContent = `${product.brand} ${product.name}`;

      const density = document.createElement('p');
      density.textContent = product.density;

      const price = document.createElement('p');
      price.textContent = `${product.price} ₽`;

      const image = document.createElement('img');
      image.src = product.picture;
      image.alt = `${product.brand} ${product.name}`;

      const sizeSelect = document.createElement('select');
      const colorSelect = document.createElement('select');

      // Получаем уникальные значения
      const sizes = [...new Set(productGroup.map(p => p.size))];
      const colors = [...new Set(productGroup.map(p => p.color))];

      function getValidColorsForSize(size) {
        return productGroup
          .filter(p => p.size === size)
          .map(p => p.color);
      }

      function getValidSizesForColor(color) {
        return productGroup
          .filter(p => p.color === color)
          .map(p => p.size);
      }

      function populateSelect(select, options) {
        select.innerHTML = '';
        options.forEach(value => {
          const opt = document.createElement('option');
          opt.value = value;
          opt.textContent = value;
          select.appendChild(opt);
        });
      }

      // Инициализация селектов
      populateSelect(sizeSelect, sizes);
      populateSelect(colorSelect, getValidColorsForSize(sizeSelect.value));

      sizeSelect.addEventListener('change', () => {
        const validColors = getValidColorsForSize(sizeSelect.value);
        populateSelect(colorSelect, validColors);
      });

      colorSelect.addEventListener('change', () => {
        const validSizes = getValidSizesForColor(colorSelect.value);
        populateSelect(sizeSelect, validSizes);

        // Повторно валидируем цвета
        const validColors = getValidColorsForSize(sizeSelect.value);
        if (!validColors.includes(colorSelect.value)) {
          populateSelect(colorSelect, validColors);
        }
      });

      const addToCartBtn = document.createElement('button');
      addToCartBtn.textContent = 'В корзину';
      addToCartBtn.addEventListener('click', () => {
        const selectedSize = sizeSelect.value;
        const selectedColor = colorSelect.value;

        const match = productGroup.find(
          p => p.size === selectedSize && p.color === selectedColor
        );

        if (match) {
          addToCart(product.name, selectedSize, selectedColor, match.price);
        } else {
          alert('❌ Такой комбинации не существует!');
        }
      });

      card.appendChild(image);
      card.appendChild(title);
      card.appendChild(density);
      card.appendChild(price);
      card.appendChild(sizeSelect);
      card.appendChild(colorSelect);
      card.appendChild(addToCartBtn);

      container.appendChild(card);
    });
  })
  .catch(error => {
    console.error('Ошибка загрузки товаров:', error);
  });

function addToCart(name, size, color, price) {
  console.log(`Добавлено в корзину: ${name}, Размер: ${size}, Цвет: ${color}, Цена: ${price}₽`);
}
