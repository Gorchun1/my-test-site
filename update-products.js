import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import crypto from 'crypto';
// --- НАЧАЛО ИЗМЕНЕНИЙ ---
// Удалены старые строки:
// import cheerioImport from 'cheerio';
// const cheerio = cheerioImport; // исправление импорта для ESM

// Добавлена правильная строка импорта для ESM:
import * as cheerio from 'cheerio';
// --- КОНЕЦ ИЗМЕНЕНИЙ ---

const xmlUrl = 'https://prokolgotki.ru/available.xml';
const searchUrl = 'https://www.collant.ru/search/?q=';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchImageUrl(name) {
  try {
    const res = await fetch(`${searchUrl}${encodeURIComponent(name)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ProKolgotkiBot/1.0)' // Добавлен User-Agent
      }
    });

    // Проверяем статус ответа перед обработкой
    if (!res.ok) {
       console.warn(`⚠️ Не удалось получить страницу для "${name}". Статус: ${res.status}`);
       // Возвращаем плейсхолдер или null, в зависимости от желаемого поведения
       return 'https://via.placeholder.com/300x400?text=Нет+фото';
    }

    const html = await res.text();
    const $ = cheerio.load(html); // Теперь cheerio.load() будет работать корректно

    // Находим первую валидную картинку, избегаем иконок и спрайтов
    // Улучшаем селектор для большей надежности
    const imgElement = $('.prod-cat-item img, .product-item-detail-slider-image img').first();
    let img = imgElement.attr('src') || imgElement.attr('data-src'); // Проверяем и data-src

    // Дополнительная проверка, что это не "заглушка" или нерелевантное изображение
    if (img && (img.includes('no_photo') || img.includes('placeholder') || !img.match(/\.(jpg|jpeg|png|gif|webp)/i))) {
        img = null; // Считаем такую картинку невалидной
    }

    if (img && img.startsWith('//')) { // Обработка URL без протокола
      img = `https:${img}`;
    } else if (img && img.startsWith('/')) { // Обработка относительных URL
      img = `https://www.collant.ru${img}`;
    } else if (img && !img.startsWith('http')) { // Если что-то странное, лучше не использовать
        console.warn(`⚠️ Неожиданный формат URL изображения для "${name}": ${img}`);
        img = null;
    }

    // Если нашли валидную картинку, возвращаем ее
    if (img) return img;

  } catch (e) {
    // Логируем ошибку, но продолжаем работу, возвращая плейсхолдер
    console.error(`❌ Ошибка при поиске изображения для "${name}": ${e.message}`);
  }

  // Если ничего не нашли или была ошибка, возвращаем плейсхолдер
  console.log(`ℹ️ Изображение для "${name}" не найдено, используется плейсхолдер.`);
  return 'https://via.placeholder.com/300x400?text=Нет+фото';
}

async function updateProducts() {
  try {
    console.log('🔄 Загрузка XML...');
    const response = await fetch(xmlUrl);
    if (!response.ok) {
        throw new Error(`❌ Не удалось загрузить XML. Статус: ${response.status}`);
    }
    const xmlText = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false, parseAttributeValue: true }); // parseAttributeValue может быть полезно
    const json = parser.parse(xmlText);

    const items = json?.rss?.channel?.item;
    if (!items || !Array.isArray(items)) throw new Error('❌ Не найдены товары (items) в XML!');

    const products = [];
    const totalItems = items.length;
    console.log(`📊 Найдено ${totalItems} товаров в XML.`);

    for (let i = 0; i < totalItems; i++) {
      const item = items[i];
      const name = item.name || 'Без названия';
      // Добавляем прогресс в лог
      console.log(`[${i + 1}/${totalItems}] 🔍 Ищу фото для "${name}"...`);
      const picture = await fetchImageUrl(name);
      await delay(1000); // пауза между запросами (антибот)

      products.push({
        brand: item.brand || '',
        name,
        menu: item.menu || '',
        density: item.density || '',
        size: item.size || '',
        color: item.color || '',
        // Используем parseFloat для большей надежности с ценами
        price: parseFloat(item.price) || 0,
        picture
      });
    }

    // Сортировка для предсказуемых git-диффов
    products.sort((a, b) => a.name.localeCompare(b.name));

    const output = JSON.stringify(products, null, 2);
    const filePath = 'products.json';

    let isChanged = true;
    if (fs.existsSync(filePath)) {
      const currentContent = fs.readFileSync(filePath, 'utf8');
      // Нормализуем контент перед хешированием (убираем возможные различия в \r\n vs \n)
      const normalize = (str) => str.replace(/\r\n/g, '\n');
      const currentHash = crypto.createHash('sha256').update(normalize(currentContent)).digest('hex');
      const newHash = crypto.createHash('sha256').update(normalize(output)).digest('hex');
      isChanged = currentHash !== newHash;
    }

    if (isChanged) {
      fs.writeFileSync(filePath, output);
      console.log(`✅ Файл ${filePath} обновлён (${products.length} товаров).`);
    } else {
      console.log(`ℹ️ Изменений нет, файл ${filePath} не обновлялся.`);
    }
  } catch (error) {
    console.error('❌ Глобальная ошибка обновления товаров:', error); // Логируем весь объект ошибки
    process.exit(1); // Завершаем с кодом ошибки
  }
}

updateProducts();
