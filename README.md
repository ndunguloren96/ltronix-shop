# Ltronix Shop – Starter Launch Package

A lightweight, production-ready storefront with a minimal Django backend for product management. Ideal for entrepreneurs who want to showcase and manage products online without payment or user auth complexity.

## 🚀 Overview

The Starter Launch package provides:

*   **Next.js Frontend** - Static product listing pages
*   **Guest “Add to Cart” experience** (client-side only)
*   **Responsive, mobile-first UI**
*   **Minimal Django Backend** - Django Admin for superuser CRUD on Products - No public login or payment endpoints
*   **Single app: store** (Product model + admin)
*   **Easy Customization** - Color & branding overrides via .env
*   **Step-by-step setup guide**
*   **Full control—no vendor lock‑in**

## 📦 What’s Included

*   **Frontend (`/frontend/my-app`)**
    *   Next.js + Chakra UI
    *   Components: ProductCard, CartInitializer, ErrorBoundary
    *   Data fetching from public `/api/v1/products/`
*   **Backend (`/ecommerce`)**
    *   Django project with `settings/starter` configuration
    *   `store` app only (Product model, admin registration)
    *   API endpoint:
        *   `GET /api/v1/products/`
*   **Documentation (`/docs`)**
    *   `starter-setup.md` — installation & customization instructions
    *   `architecture.md` — package-specific architecture overview

## 🔧 Quickstart

### Prerequisites

*   Docker & Docker Compose
*   Node.js ≥ 16 & npm

### 1. Clone & Switch to Starter Branch

```bash
git clone https://github.com/ndunguloren96/ltronix-shop.git
cd ltronix-shop
git fetch origin
git checkout release/starter
```

### 2. Configure Environment

**Backend (`/ecommerce/.env`):**

```
DJANGO_ENV=starter
DJANGO_SECRET_KEY=your_secret_key
DATABASE_URL=postgres://user:pass@db:5432/ltronix
```

**Frontend (`/frontend/my-app/.env.local`):**

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_BRAND_COLOR=#008080
```

### 3. Build & Run

```bash
docker-compose up --build
```

*   **Frontend:** http://localhost:3000
*   **Admin:** http://localhost:8000/admin/ (use `createsuperuser` to log in)

## ⚙️ Admin & Product Management

Create a superuser:

```bash
docker-compose exec backend python manage.py createsuperuser
```

Visit `/admin/` to add, update, or remove products. Frontend will automatically reflect product catalog changes.

## 🎨 Customization

*   **Brand Colors & Logo:** Override `NEXT_PUBLIC_BRAND_COLOR` and replace `/public/logo.svg`.
*   **Layout Tweaks:** Edit shared components in `/frontend/my-app/src/components`.
*   **Content:** Modify homepage text in `/frontend/my-app/src/app/page.tsx`.

## 🛠 Troubleshooting

*   **API errors in frontend:** Confirm `NEXT_PUBLIC_API_URL` matches backend URL.
*   **Admin login issues:** Re-run `createsuperuser` and verify `DJANGO_ENV=starter` in `.env`.
*   **Docker build failures:** Ensure Docker daemon is running and ports 3000/8000 are free.

## 📚 Documentation & Support

*   **Starter Setup Guide:** `/docs/starter-setup.md`
*   **Full Architecture:** `/docs/architecture.md`
*   **Community & Issues:** GitHub Issues

## 📝 License

This package is licensed under MIT. See `LICENSE` for details.
