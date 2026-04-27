# TechStore

Портфолио-проект интернет-магазина электроники на Vanilla JavaScript.

## Описание

TechStore — многостраничный магазин с каталогом, страницей товара, сравнением, избранным, корзиной, checkout и страницей успешного заказа.

## Ключевые возможности

- Каталог товаров с фильтрами, сортировкой и поиском
- Карточки товаров с рейтингом, бейджами и кнопками действий
- Списки избранного и сравнения
- Корзина и симуляция оформления заказа
- Локализация: украинский, английский, русский
- Полная локализация UI каталога, включая плейсхолдеры фильтра цены
- Светлая/тёмная тема
- Адаптивная верстка для desktop и mobile

## Технологии

- HTML5
- CSS3 (модульные стили)
- Vanilla JavaScript (модульные скрипты)
- JSON-данные товаров и переводов
- LocalStorage для клиентского состояния

## Локализация

- Файлы переводов: `data/translations/uk.json`, `data/translations/en.json`, `data/translations/ru.json`
- Тексты интерфейса и плейсхолдеры переводятся через `data-i18n` и `data-i18n-placeholder`

## Структура

- `index.html` — главная
- `about/`, `catalog/`, `product/`, `products/`, `compare/`, `contacts/`
- `favorites/`, `cart/`, `checkout/`, `order-success/`
- `assets/css`, `assets/js`, `assets/images`
- `data/products`, `data/translations`

## Локальный запуск

```bash
npm install
npm start
```

Открыть: `http://127.0.0.1:8000`.

## Деплой (GitHub Pages)

Проект подготовлен для GitHub Pages по адресу:

`https://mrdepdodep.github.io/techstore/`

Рекомендуемые настройки Pages:
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

## SEO-файлы

- `robots.txt` — правила для поисковых ботов
- `sitemap.xml` — список индексируемых страниц
- `site.webmanifest` — метаданные веб-приложения

## Примечание

Основная часть работы выполнена вручную; часть рутинных технических изменений выполнена с помощью AI-агента.

## Версии README

- English: `README.md`
- Українська: `README_UA.md`
