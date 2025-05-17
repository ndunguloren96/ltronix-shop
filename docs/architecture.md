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
