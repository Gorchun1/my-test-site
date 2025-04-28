// app.js

const fetch = require('node-fetch');
const fs = require('fs');
const { XMLParser } = require('fast-xml-parser');

async function updateProducts() {
  try {
    console.log('🔄 Загрузка XML...');
    const response = await fetch('https://prokolgotki.ru/available.xml');

    if (!response.ok) {
      throw new Error(`Ошибка загрузки XML: ${response.status} ${response.statusText}`);
    }

    const xmlData = await response.text();
    console.log('✅ XML получен. Парсинг...');

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
    });
    const jsonData = parser.parse(xmlData);

    if (!jsonData.yml_catalog || !jsonData.yml_catalog.shop || !jsonData.yml_catalog.shop.offers || !jsonData.yml_catalog.shop.offers.offer) {
      throw new Error('❌ Структура XML неожиданная. Нет offers.offer');
    }

    const offers = jsonData.yml_catalog.shop.offers.offer;

    console.log(`✅ Найдено товаров: ${offers.length}. Сохраняю...`);

    fs.writeFileSync('products.json', JSON.stringify(offers, null, 2), 'utf8');

    console.log('🎯 Товары успешно обновлены и сохранены в products.json');
    process.exit(0);
  } catch (error) {
    console.error('❌ Ошибка обновления товаров:', error.message);
    process.exit(1);
  }
}

updateProducts();
