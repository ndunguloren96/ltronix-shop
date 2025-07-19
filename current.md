# Ltronix Shop: Codebase Analysis

This document provides a comprehensive analysis of the Ltronix Shop codebase, covering its features, technologies, and architecture.

## 1. Overview

Ltronix Shop is a full-stack e-commerce application with a Next.js frontend and a Django backend. It is designed to be a production-ready storefront with features like product management, a guest "add to cart" experience, and M-Pesa integration for payments. The application is containerized using Docker and can be deployed on AWS.

## 2. Backend (Django)

The backend is a Django project located in the `ecommerce` directory. It provides a RESTful API for the frontend and a Django admin interface for managing products and other data.

### 2.1. Technologies

*   **Framework:** Django
*   **Database:** PostgreSQL
*   **Authentication:** `django-allauth` for social authentication (Google) and `dj-rest-auth` for RESTful API authentication with JWT.
*   **API:** Django Rest Framework
*   **Payments:** `django-daraja` for M-Pesa integration.
*   **Email:** `Anymail` with `SendGrid` for sending emails.
*   **Async Tasks:** Celery with Redis for asynchronous tasks.
*   **Deployment:** Configured for deployment on Render, with S3 for media storage.

### 2.2. Apps

The project is divided into several apps:

*   **`store`:** Handles product and order management.
    *   **Models:** `Category`, `Customer`, `Product`, `Order`, `OrderItem`, `ShippingAddress`.
*   **`payment`:** Handles payment processing.
    *   **Models:** `Transaction` (for M-Pesa transactions).
*   **`users`:** Manages user accounts.
    *   **Models:** Custom `User` model (using email as the unique identifier) and `UserProfile`.
*   **`emails`:** Manages sending emails (no models).

### 2.3. Architecture

The backend follows a standard Django project structure. The settings are split into `base.py`, `development.py`, and `production.py` for different environments. The business logic is encapsulated within the respective apps.

## 3. Frontend (Next.js)

The frontend is a Next.js application located in the `frontend/my-app` directory. It provides a modern, responsive user interface for the e-commerce store.

### 3.1. Technologies

*   **Framework:** Next.js
*   **UI Library:** Chakra UI
*   **State Management:** Zustand and React Query
*   **HTTP Client:** Axios
*   **Authentication:** NextAuth.js
*   **Fuzzy Search:** Fuse.js
*   **Error Tracking:** Sentry
*   **Real User Monitoring:** Datadog

### 3.2. Structure

The frontend code is well-structured within the `src` directory:

*   **`api`:** API route handlers for the Next.js backend.
*   **`app`:** Main directory for the Next.js app router, containing pages and layouts.
*   **`components`:** Reusable React components.
*   **`hooks`:** Custom React hooks.
*   **`lib`:** Utility functions and libraries.
*   **`providers`:** React context providers.
*   **`store`:** Zustand store for state management.
*   **`types`:** TypeScript type definitions.

### 3.3. Features

The frontend provides the following features:

*   Product listing and detail pages.
*   Guest "add to cart" functionality.
*   Shopping cart and checkout process.
*   User authentication (login, registration, social login).
*   User account management.
*   Order history.
*   Search functionality.

## 4. Infrastructure (Terraform & Docker)

The project uses Docker for containerization and Terraform for infrastructure as code.

### 4.1. Docker

The `docker-compose.yml` file defines the following services for local development:

*   **`nginx`:** A reverse proxy for the backend and frontend.
*   **`backend`:** The Django application.
*   **`frontend`:** The Next.js application.
*   **`db`:** A PostgreSQL database.
*   **`redis`:** A Redis server for Celery and caching.

### 4.2. Terraform

The Terraform configuration in the `infra/terraform` directory sets up the following AWS resources for production deployment:

*   **VPC:** A virtual private cloud.
*   **Internet Gateway:** To provide internet access to the VPC.
*   **Subnets:** Public subnets.
*   **Route Table:** To control traffic routing.
*   **RDS:** A managed PostgreSQL database.
*   **S3:** An S3 bucket for media storage.
*   **IAM:** An IAM user for S3 access.
*   **ElastiCache:** A managed Redis cluster.
*   **CloudWatch:** A log group for RDS logs.

## 5. How it all connects

1.  The user interacts with the **Next.js frontend**, which is served by the **Next.js development server** (in development) or a **Node.js server** (in production).
2.  The frontend makes API calls to the **Django backend** to fetch and manipulate data.
3.  The **Nginx** server acts as a reverse proxy, directing traffic to the appropriate service (frontend or backend) and serving static and media files.
4.  The **Django backend** communicates with the **PostgreSQL database** to store and retrieve data.
5.  **Celery** is used for asynchronous tasks, such as sending emails, with **Redis** as the message broker.
6.  In production, the entire application is deployed on **AWS**, with the infrastructure managed by **Terraform**. The frontend is likely hosted on a service like Vercel or AWS Amplify, while the backend runs on a service like AWS Elastic Beanstalk or Amazon ECS. The database is a managed **RDS** instance, media files are stored in **S3**, and caching is handled by **ElastiCache**.
