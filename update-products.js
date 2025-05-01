import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import crypto from 'crypto';

async function updateProducts() {
  try {
    console.log('🔄 Загрузка XML...');
    const response = await fetch('https://prokolgotki.ru/available.xml');
    const xmlText = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const json = parser.parse(xmlText);

    const items = json?.rss?.channel?.item;
    if (!items || !Array.isArray(items)) throw new Error('❌ Не найдены товары в XML!');

    const products = items.map(item => ({
      brand: item.brand || '',
      name: item.name || 'Без названия',
      menu: item.menu || '',
      density: item.density || '',
      size: item.size || '',
      color: item.color || '',
      price: Number(item.price) || 0,
      picture: item.picture || 'https://via.placeholder.com/300x400?text=Нет+фото'
    }));

    const output = JSON.stringify(products, null, 2);
    const filePath = 'products.json';

    let isChanged = true;
    if (fs.existsSync(filePath)) {
      const currentContent = fs.readFileSync(filePath, 'utf8');
      const currentHash = crypto.createHash('sha256').update(currentContent).digest('hex');
      const newHash = crypto.createHash('sha256').update(output).digest('hex');
      isChanged = currentHash !== newHash;
    }

    if (isChanged) {
      fs.writeFileSync(filePath, output);
      console.log('✅ Файл products.json обновлён.');
    } else {
      console.log('ℹ️ Изменений нет, файл не обновлялся.');
    }
  } catch (error) {
    console.error('❌ Ошибка обновления товаров:', error.message);
    process.exit(1);
  }
}

updateProducts();
