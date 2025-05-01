import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs';
import crypto from 'crypto';
import * // Используем правильный импорт для ESM
* as cheerio from 'cheerio';

// --- Конфигурация ---
const xmlUrl = 'https://prokolgotki.ru/available.xml'; // Откуда брать список товаров
const searchUrl = 'https://www.collant.ru/search/?q=';  // Где искать картинки
const imageCachePath = 'image_cache.json';          // Файл для хранения кэша URL
const requestDelay = 1000;                          // Задержка между запросами к collant.ru (в мс)
const userAgent = 'Mozilla/5.0 (compatible; ProKolgotkiImageCacheUpdater/1.0)'; // User-Agent
// ---

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Загружает кэш URL изображений из файла.
 * @returns {object} Объект кэша { productName: imageUrl }
 */
function loadImageCache() {
  try {
    if (fs.existsSync(imageCachePath)) {
      const data = fs.readFileSync(imageCachePath, 'utf8');
      console.log(`ℹ️ Загружен кэш изображений из ${imageCachePath}`);
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`❌ Ошибка загрузки или парсинга кэша ${imageCachePath}:`, error);
  }
  console.log(`ℹ️ Файл кэша ${imageCachePath} не найден или поврежден, будет создан новый.`);
  return {}; // Возвращаем пустой объект, если файла нет или ошибка
}

/**
 * Сохраняет кэш URL изображений в файл, если он изменился.
 * @param {object} cache Объект кэша для сохранения.
 * @param {object} originalCache Исходный кэш для сравнения.
 */
function saveImageCache(cache, originalCache) {
  try {
    const normalize = (obj) => JSON.stringify(obj, Object.keys(obj).sort());
    const currentHash = crypto.createHash('sha256').update(normalize(cache)).digest('hex');
    const originalHash = crypto.createHash('sha256').update(normalize(originalCache)).digest('hex');

    if (currentHash !== originalHash) {
      fs.writeFileSync(imageCachePath, JSON.stringify(cache, null, 2));
      console.log(`✅ Кэш изображений сохранен в ${imageCachePath}. Обновлено/добавлено записей: ${Object.keys(cache).length - Object.keys(originalCache).length}`);
    } else {
      console.log('ℹ️ Изменений в кэше изображений нет, файл не перезаписан.');
    }
  } catch (error) {
    console.error(`❌ Ошибка сохранения кэша в ${imageCachePath}:`, error);
  }
}

/**
 * Асинхронно ищет URL изображения на сайте collant.ru.
 * НЕ использует кэш напрямую, только ищет в сети.
 * @param {string} name Название товара.
 * @returns {Promise<string>} Найденный URL изображения или плейсхолдер.
 */
async function fetchImageUrlFromWeb(name) {
  console.log(`[Сеть] ☁️ Запрос URL для "${name}"...`);
  try {
    const res = await fetch(`${searchUrl}${encodeURIComponent(name)}`, {
      headers: { 'User-Agent': userAgent }
    });

    if (!res.ok) {
      console.warn(`⚠️ Не удалось получить страницу поиска для "${name}". Статус: ${res.status}`);
      return 'https://via.placeholder.com/300x400?text=Нет+фото'; // Плейсхолдер при ошибке сети
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const imgElement = $('.prod-cat-item img, .product-item-detail-slider-image img').first();
    let img = imgElement.attr('src') || imgElement.attr('data-src');

    // Валидация и нормализация URL
    if (img && (img.includes('no_photo') || img.includes('placeholder') || !img.match(/\.(jpg|jpeg|png|gif|webp)/i))) {
      img = null;
    }
    if (img && img.startsWith('//')) {
      img = `https:${img}`;
    } else if (img && img.startsWith('/')) {
      img = `https://www.collant.ru${img}`;
    } else if (img && !img.startsWith('http')) {
      console.warn(`⚠️ Неожиданный формат URL изображения для "${name}": ${img}`);
      img = null;
    }

    if (img) {
      console.log(`[Сеть] ✅ Получен URL для "${name}"`);
      return img;
    } else {
      console.log(`ℹ️ Изображение для "${name}" не найдено на сайте.`);
      return 'https://via.placeholder.com/300x400?text=Нет+фото'; // Плейсхолдер если не найдено
    }

  } catch (e) {
    console.error(`❌ Ошибка при поиске изображения для "${name}": ${e.message}`);
    return 'https://via.placeholder.com/300x400?text=Ошибка'; // Плейсхолдер при ошибке парсинга/запроса
  }
}

/**
 * Основная функция для обновления кэша изображений.
 */
async function updateImageCache() {
  const imageCache = loadImageCache();
  const originalCacheForComparison = { ...imageCache }; // Копия для сравнения
  let processedNames = new Set(Object.keys(imageCache)); // Для отслеживания уже обработанных
  let networkRequestsCount = 0;

  try {
    // 1. Загрузка XML для получения списка актуальных товаров
    console.log(`🔄 Загрузка XML со списком товаров из ${xmlUrl}...`);
    const response = await fetch(xmlUrl);
    if (!response.ok) {
      throw new Error(`❌ Не удалось загрузить XML. Статус: ${response.status}`);
    }
    const xmlText = await response.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const json = parser.parse(xmlText);

    const items = json?.rss?.channel?.item;
    if (!items || !Array.isArray(items)) throw new Error('❌ Не найдены товары (items) в XML!');

    // Используем Set для получения уникальных имен товаров
    const uniqueNames = new Set(items.map(item => item.name).filter(name => name)); // Фильтруем пустые имена
    const totalUniqueNames = uniqueNames.size;
    console.log(`📊 Найдено ${items.length} товаров в XML, ${totalUniqueNames} уникальных имен.`);
    console.log(`💾 Текущий размер кэша: ${Object.keys(imageCache).length} записей.`);

    let currentItemIndex = 0;
    // 2. Итерация по уникальным именам и обновление кэша
    for (const name of uniqueNames) {
      currentItemIndex++;
      const progressPrefix = `[${currentItemIndex}/${totalUniqueNames}]`;

      if (!imageCache.hasOwnProperty(name)) {
        // Если имени нет в кэше, ищем его в сети
        console.log(`${progressPrefix} ⏳ "${name}" - нет в кэше, поиск...`);
        const imageUrl = await fetchImageUrlFromWeb(name);
        imageCache[name] = imageUrl; // Добавляем в кэш (в памяти)
        networkRequestsCount++;
        await delay(requestDelay); // Применяем задержку только после сетевого запроса
      } else {
        // Имя уже есть в кэше, ничего не делаем
         console.log(`${progressPrefix} ✅ "${name}" - уже в кэше.`);
        // Можно раскомментировать, если лог слишком большой:
        // if (currentItemIndex % 50 === 0) { // Логировать каждые 50 товаров из кэша для индикации прогресса
        //   console.log(`${progressPrefix} ...проверка кэша...`);
        // }
      }
      processedNames.add(name); // Отмечаем имя как обработанное в этом запуске
    }

    // 3. (Опционально) Удаление из кэша устаревших записей (товаров, которых нет в XML)
    let removedCount = 0;
    for (const cachedName in imageCache) {
        if (!uniqueNames.has(cachedName)) {
            // console.log(`🗑️ Удаление устаревшей записи из кэша: "${cachedName}"`);
            delete imageCache[cachedName];
            removedCount++;
        }
    }
    if (removedCount > 0) {
        console.log(`🗑️ Удалено ${removedCount} устаревших записей из кэша.`);
    }


    console.log(`🏁 Обработка завершена. Сделано сетевых запросов: ${networkRequestsCount}.`);

  } catch (error) {
    console.error('❌ Глобальная ошибка при обновлении кэша изображений:', error);
    process.exitCode = 1; // Устанавливаем код ошибки для выхода
  } finally {
    // 4. Сохранение обновленного кэша в файл
    saveImageCache(imageCache, originalCacheForComparison);
  }
}

// Запуск процесса обновления кэша
updateImageCache();
