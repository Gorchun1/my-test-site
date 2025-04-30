import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import crypto from 'crypto';
import cheerio from 'cheerio';

const xmlUrl = 'https://prokolgotki.ru/available.xml';
const searchUrl = 'https://www.collant.ru/search/?q=';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchImageUrl(name) {
  try {
    const res = await fetch(`${searchUrl}${encodeURIComponent(name)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProKolgotkiBot/1.0)'
      }
    });
    const html = await res.text();
    const $ = cheerio.load(html);
    const img = $('img').first().attr('src');

    if (img && img.startsWith('http')) return img;
    if (img) return `https://www.collant.ru${img}`;
  } catch (e) {
    console.error(`❌ Ошибка при поиске изображения для "${name}": ${e.message}`);
  }

  return 'https://via.placeholder.com/300x400?text=Нет+фото';
}

async function updateProducts() {
  try {
    console.log('🔄 Загрузка XML...');
    const response = await fetch(xmlUrl);
    const xmlText = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const json = parser.parse(xmlText);

    const items = json?.rss?.channel?.item;
    if (!items || !Array.isArray(items)) throw new Error('❌ Не найдены товары в XML!');

    const products = [];

    for (const item of items) {
      const name = item.name || 'Без названия';

      console.log(`🔍 Ищу фото для "${name}"...`);
      const picture = await fetchImageUrl(name);
      await delay(1000); // пауза между запросами

      products.push({
        brand: item.brand || '',
        name,
        menu: item.menu || '',
        density: item.density || '',
        size: item.size || '',
        color: item.color || '',
        price: Number(item.price) || 0,
        picture
      });
    }

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
