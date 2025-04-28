// Подключаем fetch для Node.js
const fetch = require('node-fetch');
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

console.log('Загрузка XML...');

async function updateProducts() {
    try {
        const response = await fetch('https://prokolgotki.ru/available.xml');
        const xmlData = await response.text();

        const parser = new XMLParser();
        const jsonObj = parser.parse(xmlData);

        const offers = jsonObj.yml_catalog.shop.offers.offer;

        const products = offers.map(offer => ({
            name: offer.name || 'Без названия',
            price: offer.price || '0',
            picture: offer.picture || 'https://via.placeholder.com/300x400?text=Нет+фото'
        }));

        const output = `const products = ${JSON.stringify(products, null, 2)};\nexport default products;`;

        fs.writeFileSync('products.js', output);

        console.log('Товары успешно обновлены.');
    } catch (error) {
        console.error('Ошибка обновления товаров:', error);
        process.exit(1);
    }
}

updateProducts();

