import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import crypto from 'crypto';

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

    const output = `export const products = ${JSON.stringify(products, null, 2)};\n`;

    const filePath = 'products.js';

    // Проверяем, изменилось ли содержимое
    let isChanged = true;
    if (fs.existsSync(filePath)) {
      const currentContent = fs.readFileSync(filePath, 'utf8');
      const currentHash = crypto.createHash('sha256').update(currentContent).digest('hex');
      const newHash = crypto.createHash('sha256').update(output).digest('hex');
      isChanged = currentHash !== newHash;
    }

    if (isChanged) {
      fs.writeFileSync(filePath, output);
      console.log('Товары обновлены и файл перезаписан.');
    } else {
      console.log('Изменений нет, файл оставлен без изменений.');
    }
  } catch (error) {
    console.error('Ошибка обновления товаров:', error);
    process.exit(1);
  }
}

updateProducts();
