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
