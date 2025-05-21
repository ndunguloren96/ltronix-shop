- My work plan was based on my created development models: Phase --> Milestone --> PART --> Step
- I use this to ensure i divide my project into small actionable tasks that i can easily use.

# Architecture Overview

# Phase 1: Core Infrastructure

## Milestone 1: Django E-Commerce Website Scaffold

### Technology

- No Frontend Framework
- No REST API
- SQLite Database
- No Authentication
- JavaScript used
- Django fully used

### PART 1: Django Project Setup and Templates

- Step 1: Configure App
  Install Django, Start project, create app, and add app to settings.py
- Step 2: Templates
  Create Templates Folder, and create templates.
- Step 3: Views and URLs
  Create views, URLs, and Base URL's configuration
- Step 4: Static Files
  'static' folder, css file, STATICFILES_DIRES. add static files to page, and add images
- Step 5: Main Template
  Add HTML Boilerplate to main.html, adding viewport and startic, adding Bootstrap, container/navbar placeholder, and inheriting
- Step 6: Navbar
  Bootstarp Navbar, dark theme, customize Navbar, and Custom CSS
- Step 7: Store.html
  Layout and placeholder content
- Step 8: Cart.html
  Layout, Cart Headers, nd Cart Rows
- Step 9: Checkout.html
  Layout, form, payment option, and order summary

### PART 2: Data Structure

- Step 1: Models
  Import User Model, customer Model, 'Product', 'Order', 'OrderItem', and 'ShippingAddress' Models, and Migrate database
- Step 2: Render Products
  Query products and Render products.
- Step 3: Product ImageField
  ImageField(), MEDIA_ROOT, MEDIA_URL, urls.py configuration, render images and image error solution
- Step 4: User Cart
  Add data (Admin Panel), query data (cart), render data (cart.html), calculations total, query totals, render totals, and checkout PageData.

### PART 3: Site Functionality

- Step 1: Add to Cart
  cart.js, add event handlers, use type logic, update Item View, update UserOrder(), CSRF Token, update Item view logic, and Cart Total.
- Step 2: Cart Update
  "Add" and "Remove" clicks
- Step 3: Shipping Address
  Shipping method, order Shipping status, hide shipping form, payment option, and trigger Payment Action.
- Step 4: Checkout Form
  Hide form and fields and Form data
- Step 5: Process Order
  Process order view/url, send POST data, transaction ID, set data. confirm total, shipping logic.

### PART 4: Guest Checkout

### Steps

- Step 1: Set Cookies
  create cart and adding/removing items
- Step 2: Render cart total
  query cary in views.py and build cart total
- Step 3: Build order
  Order total, items Queryset, shipping information, and product does not exist
- Step 4: cookieCart() Function
  utils.py, copy cart logic, user cookieCart in views
- Step 5: CartData()
  create function, move view logic, use CartData() in views.py
- Step 6: Checkout
  clear cart, guest checkout logic, create guest checkout function, and cleanup processOrder view

---

## Milestone 2 : M-Pesa Payment Integration

### Technology

- Django
- django-daraja: [A python django library for interacting with the Safaricom MPESA Daraja API.](https://github.com/martinmogusu/django-daraja)
- Python-dotenv
- Django environment
- HTML

### PART 1: Environment Preparation

- Goal: Ensure all development tools and configurations are ready

### Steps:

1. Install PostgreSQL & set up in settings.py
2. Create .env for secrets (API keys, DB creds)
3. Install django-environ or similar for env config
4. Set up virtual environment & requirements.txt
5. Register & activate your Safaricom Developer Account
6. Obtain Consumer Key/Secret for sandbox app

### PART 2: M-Pesa STK Push Integration

- Goal: Enable user to initiate a payment

### Steps:

1. Create Django app: payments
2. Install & configure django-mpesa or write custom integration
3. Create a view to handle STK Push requests
4. Send API request to Safaricom with required payload
5. Use mock product price (static amount) to trigger request
6. Handle API response → success/failure

### PART 3: Callback Handling (Confirmation & Validation URLs)

- Goal: Receive real-time payment confirmation from Safaricom

### Steps:

1. Expose your server using _Ngrok_ (for dev callback testing)
2. Register Validation & Confirmation URLs to Safaricom sandbox
3. Create Django views to handle callbacks
4. Parse response payload & store transaction in DB
5. Mark transaction as complete

### PART 4: Admin & Transaction Logging

- Goal: Record and review payment history

### Steps:

1. Create Transaction model (user, phone, amount, status, timestamp)
2. Update on callback success/failure
3. Display transactions in Django Admin
4. Add unit test for payment workflow logic

### PART 5: Basic Frontend Trigger

- Goal: Allow basic test payment from UI

### Steps:

1. Simple form to enter phone number & trigger payment view
2. Show response message to user
3. Add JavaScript validation if needed

### PART 6: Final Testing & Documentation

- Goal: Ensure system is working end-to-end

### Steps:

1. Full test cycle: trigger → confirm → validate
2. Simulate edge cases (timeout, wrong number, etc.)
3. Write clear README or dev notes for future reference
4. Clean codebase and commit to Git

---

### Deliverables:

- Server-side M-Pesa payment workflow working end-to-end
- Transaction data logged in database
- Admin panel shows payment records
- Code is organized, documented, and in version control

---

---

## Milestone 3: feature/frontend-revamp

## Summary

Start with PART −1/0 learning tracks (JS/TS fundamentals, React/Next.js core) to build confidence. Then scaffold new branch, establish a design system with Chakra UI, and stub state management, API contracts, accessibility, error/loading states, responsive nav, and CI. After the main frontend features (listing, search, filters, account, support pages), we’ll add an Additional PART for final polish—performance tuning, accessibility checks, and documentation.

### PART −1: JavaScript & TypeScript Fundamentals

- Goal: Solidify modern JavaScript and TypeScript foundations to write robust, typed React code.

1. ES6+ Syntax: let/const, arrow functions, destructuring
2. TypeScript Basics: interfaces, types, generics
3. Tooling: npm scripts, tsconfig.json setup

### PART 0: React & Next.js Core Concepts

- Goal: Master React hooks, Next.js routing/data‑fetching, and styling setup for a seamless SSR/SSG experience.

1. Hooks: useState, useEffect, useContext
2. Routing & Data Fetching: getStaticProps, getServerSideProps
3. Styling System: Chakra UI setup (design system)

### PART 1: Project Setup & Core Infrastructure

- Goal: Establish the Next.js/TypeScript codebase, branch, dependencies, and basic CI pipeline.

1. Branch: `feature/frontend-revamp`
2. Init Next.js w/ TS: `npx create-next-app@latest --ts`
3. Install: `@chakra-ui/react`, `@emotion/react`, `axios`/`swr`
4. Configure CI Stub: basic GitHub Actions lint/test workflow

### PART 2: Design System & State Management

- Goal: Create a consistent UI component library (Chakra UI) and global state store (Zustand) for cart/auth.

1. Chakra UI Theme: Define colors, fonts, spacing
2. Reusable Components: Button, Card, Input, Modal
3. State Store: Setup Zustand (simple) for cart/auth stubs

### PART 3: Global Layout & Responsive Nav

- Goal: Build the app shell—header, footer, responsive navbar—so all pages share a unified frame.

1. \_app.tsx/\_document.tsx: wrap with ChakraProvider
2. Header/NavBar: Logo, Search stub, Cart icon, Profile menu; mobile hamburger
3. Footer: About, Privacy, FAQ, Contact links

### PART 4: Product Listing & Details

- Goal: Deliver core product views (grid listing + detail page) with placeholder data and UI components.

1. Listing Page (`/products`): grid of ProductCard with image carousel stub
2. Detail Page (`/products/[id]`): image gallery, specs, Add to Cart button stub

### PART 5: Filtering & Search

- Goal: Implement client‑side product filtering and search interactions to enhance discoverability.

1. Filters UI: Category, Price Range, Brand (controlled components)
2. Search Input: Fuse.js stub with debounce (300 ms)
3. Pagination Stub: “Load More” button

### PART 6: Authentication & Account

- Goal: Stub login/signup flows and a protected user dashboard for profile, payment/security settings, and recent views.

1. Auth Pages: `/auth/login`, `/auth/signup` with NextAuth.js stub
2. Protected Route: Middleware redirect for `/account`
3. Account Dashboard: Profile details, Payment Settings stub, Security Settings

### PART 7: Support & Static Pages

- Goal: Provide essential informational pages (Contact, FAQ, About, Privacy) with basic UI and SEO stubs.

1. Contact (`/support/contact`): form stub, validation, error/loading states
2. FAQ (`/support/faq`): accordion component
3. Legal: `/about`, `/privacy` with SEO meta

### PART 8: API Stubs & Error/Loading States

- Goal: Scaffold /api endpoints with realistic success/error responses and global loading/error components.

1. API Folder: `/pages/api/products`, `/api/auth`, `/api/orders` returning JSON/errors
2. Error & Loading Components: `<LoadingSpinner/>`, `<ErrorAlert/>`

### PART 9: Accessibility & Performance

- Goal: Ensure WCAG‑compliant UI and meet Core Web Vitals targets (LCP, FID, CLS) through audits and image optimizations.

1. Accessibility Checks: integrate `@axe-core/react`, run Lighthouse audits
2. Performance: Next/Image with priority LCP, dynamic imports
3. Core Web Vitals: validate LCP<2.5s, FID<100 ms, CLS<0.1

### PART 10: Testing & Documentation

- Validate critical UI with unit/E2E tests and update documentation (architecture.md, dev-notes.md, API contract).

1. Component Tests: Jest + React Testing Library for critical UI
2. E2E Smoke Tests: Cypress/Playwright for listing→detail→search flow
3. Docs Update: Append `architecture.md`, `dev-notes.md` with this Milestone
4. API Contract: Basic OpenAPI markdown stub

### Additional PART: Final Harden & Handoff

- CI/CD Integration: finalize GitHub Actions for preview deploys on PR
- Monorepo Prep: add Turborepo config for future backend merge
- Design Review: ensure Component Library consistency
- Accessibility Sweep: WebAIM WCAG2.2 checklist

---
