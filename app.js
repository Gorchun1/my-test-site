// app.js

const fetch = require('node-fetch');
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

async function loadAndSaveProducts() {
    try {
        const response = await fetch('https://prokolgotki.ru/available.xml');
        const xmlText = await response.text();

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: '',
        });
        const jsonObj = parser.parse(xmlText);

        const offers = jsonObj?.yml_catalog?.shop?.offers?.offer;

        if (!offers || offers.length === 0) {
            console.error('Нет товаров в XML');
            return;
        }

        const products = offers.map(offer => ({
            id: offer.id || '',
            name: offer.name || 'Без названия',
            price: offer.price || '0',
            picture: Array.isArray(offer.picture) ? offer.picture[0] : (offer.picture || 'https://via.placeholder.com/300x400?text=Нет+фото')
        }));

        fs.writeFileSync('products.json', JSON.stringify(products, null, 2), 'utf-8');

        console.log('Файл products.json успешно создан с', products.length, 'товарами.');
    } catch (error) {
        console.error('Ошибка загрузки или обработки товаров:', error);
    }
}

loadAndSaveProducts();
