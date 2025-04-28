import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';

async function updateProducts() {
  try {
    console.log('Загрузка XML...');
    const response = await fetch('https://prokolgotki.ru/available.xml');
    const xmlText = await response.text();
    const parser = new XMLParser();
    const json = parser.parse(xmlText);

    // ВРЕМЕННО выводим, чтобы понять структуру
    console.log(JSON.stringify(json, null, 2));

    // Тут нужно будет подставить правильный путь после просмотра структуры
    const offers = json.yml_catalog?.shop?.offers?.offer;

    if (!offers) {
      throw new Error('Не найдены офферы в XML!');
    }

    const products = offers.map(offer => ({
      name: offer.name || 'Без названия',
      price: offer.price || '0',
      picture: offer.picture || 'https://via.placeholder.com/300x400?text=Нет+фото'
    }));

    const output = `export const products = ${JSON.stringify(products, null, 2)};`;

    fs.writeFileSync('products.js', output);
    console.log('Товары успешно обновлены!');
  } catch (error) {
    console.error('Ошибка обновления товаров:', error);
    process.exit(1);
  }
}

updateProducts();
