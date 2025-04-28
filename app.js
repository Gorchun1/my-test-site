// app.js
const fetch = require('node-fetch');
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

async function loadProducts() {
    try {
        const response = await fetch('https://prokolgotki.ru/available.xml');
        const xmlText = await response.text();
        const parser = new XMLParser();
        const jsonObj = parser.parse(xmlText);

        // Берем только нужные данные
        const offers = jsonObj.yml_catalog.shop.offers.offer.map(offer => ({
            id: offer['@_id'] || '',
            name: offer.name || '',
            price: offer.price || '',
            picture: offer.picture || '',
        }));

        // Сохраняем в products.json
        fs.writeFileSync('products.json', JSON.stringify(offers, null, 2));
        console.log('✅ Товары успешно обновлены');
    } catch (error) {
        console.error('❌ Ошибка загрузки товаров:', error);
        process.exit(1);
    }
}

loadProducts();
