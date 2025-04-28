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

    const items = json.rss?.channel?.item;

    if (!items) {
      throw new Error('Не найдены товары в XML!');
    }

    const products = items.map(item => ({
      name: item.name || 'Без названия',
      price: item.price || '0',
      picture: item.picture || 'https://via.placeholder.com/300x400?text=Нет+фото'
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
