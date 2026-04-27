# TechStore

Modern portfolio e-commerce website for electronics, built with Vanilla JavaScript.

Live demo: https://mrdepdodep.github.io/techstore/

## About Project

TechStore is a multi-page storefront that demonstrates a complete client-side shopping flow:

- home page with featured products
- catalog with filtering and sorting
- product page with gallery and specs
- favorites and compare pages
- cart and checkout flow
- order success page

The project focuses on clean UI, practical UX, localization, and deploy-ready structure for GitHub Pages.

## Key Features

- Responsive layout for desktop/tablet/mobile
- Localization (UA / EN / RU)
- Full UI localization for catalog filters (including price range placeholders)
- Light / Dark theme switcher
- Product search, filters, sorting
- Favorites and product comparison
- Cart state and checkout simulation
- SEO essentials (`robots.txt`, `sitemap.xml`, `site.webmanifest`)

## Tech Stack

- HTML5
- CSS3 (modular architecture)
- Vanilla JavaScript (modular files)
- JSON data source for products and translations
- LocalStorage for client-side persistence

## Localization

- Translation files: `data/translations/uk.json`, `data/translations/en.json`, `data/translations/ru.json`
- UI text and placeholders are translated through `data-i18n` and `data-i18n-placeholder` attributes

## Screenshots

### Home Page
![TechStore Home](./assets/images/screen1.png)

### Catalog / Product Experience
![TechStore Interface](./assets/images/screen2.png)

## Project Structure

```text
techstore/
├── index.html
├── about/
├── catalog/
├── product/
├── products/
├── compare/
├── contacts/
├── favorites/
├── cart/
├── checkout/
├── order-success/
├── assets/
│   ├── css/
│   ├── js/
│   └── images/
├── data/
│   ├── products/
│   └── translations/
├── robots.txt
├── sitemap.xml
├── site.webmanifest
├── LICENSE
└── package.json
```

## Local Development

```bash
npm install
npm start
```

Open: `http://127.0.0.1:8000`

## GitHub Pages Deploy

Repository: https://github.com/mrdepdodep/techstore

Recommended Pages settings:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`

## Notes

The project was built manually, with partial help from an AI coding agent for routine refactors and verification.

## License

This project is licensed under the terms in the [LICENSE](./LICENSE) file.
