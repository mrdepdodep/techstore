# TechStore

Портфоліо-проєкт інтернет-магазину електроніки на Vanilla JavaScript.

## Опис

TechStore — багатосторінковий магазин з каталогом, сторінкою товару, порівнянням, обраним, кошиком, checkout та сторінкою успішного замовлення.

## Ключові можливості

- Каталог товарів з фільтрами, сортуванням і пошуком
- Картки товарів з рейтингом, бейджами та кнопками дій
- Списки обраного та порівняння
- Кошик і симуляція оформлення замовлення
- Локалізація: українська, англійська, російська
- Повна локалізація UI каталогу, включно з плейсхолдерами фільтра ціни
- Світла/темна тема
- Адаптивна верстка для desktop і mobile

## Технології

- HTML5
- CSS3 (модульні стилі)
- Vanilla JavaScript (модульні скрипти)
- JSON-дані товарів і перекладів
- LocalStorage для стану клієнта

## Локалізація

- Файли перекладів: `data/translations/uk.json`, `data/translations/en.json`, `data/translations/ru.json`
- Тексти інтерфейсу та плейсхолдери перекладаються через `data-i18n` і `data-i18n-placeholder`

## Структура

- `index.html` — головна
- `about/`, `catalog/`, `product/`, `products/`, `compare/`, `contacts/`
- `favorites/`, `cart/`, `checkout/`, `order-success/`
- `assets/css`, `assets/js`, `assets/images`
- `data/products`, `data/translations`

## Локальний запуск

```bash
npm install
npm start
```

Відкрити: `http://127.0.0.1:8000`.

## Деплой (GitHub Pages)

Проєкт підготовлений для GitHub Pages за адресою:

`https://mrdepdodep.github.io/techstore/`

Рекомендовані налаштування Pages:
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

## SEO-файли

- `robots.txt` — правила для пошукових ботів
- `sitemap.xml` — список індексованих сторінок
- `site.webmanifest` — метадані веб-застосунку

## Примітка

Основна частина роботи виконана вручну; частина рутинних технічних змін виконувалась за допомогою AI-агента.

## Версії README

- English: `README.md`
- Русский: `README_RU.md`
