# Deployment Guide for Ltronix Shop

This document outlines the CI/CD pipeline and deployment steps for the Ltronix Shop application, covering both the backend (Django) and frontend (Next.js).

## 1. CI/CD Pipeline Summary

Our CI/CD pipeline is managed using GitHub Actions, with separate workflows for the backend and frontend.

### Backend CI/CD (`.github/workflows/backend.yml`)

This workflow is triggered on pushes and pull requests to the `main` branch. It performs the following steps:

1.  **Linting:** Runs `ruff` to ensure code quality and adherence to Python style guidelines.
2.  **Testing:** Executes `pytest` to run unit and integration tests for the Django application.
3.  **Docker Image Build:** Builds a Docker image for the backend application.
4.  **Docker Image Push:** Pushes the built Docker image to GitHub Container Registry (GHCR).

### Frontend CI/CD (`.github/workflows/frontend.yml`)

This workflow is also triggered on pushes and pull requests to the `main` branch. It performs the following steps:

1.  **Linting:** Runs `eslint` to ensure code quality and adherence to JavaScript/TypeScript style guidelines.
2.  **Testing:** Executes `npm test` to run tests for the Next.js application.
3.  **Application Build:** Builds the Next.js application for production using `npm run build`.
4.  **Deployment to Vercel:** If the push is to the `main` branch, the application is deployed to Vercel using the Vercel CLI.

## 2. Infrastructure as Code (IaC) with Terraform

Our AWS infrastructure is defined using Terraform, located in the `infra/terraform` directory. This includes configurations for:

*   **RDS (PostgreSQL):** Relational Database Service for the backend database.
*   **ElastiCache (Redis):** In-memory data store for caching and session management.
*   **S3:** Simple Storage Service for static files and media uploads.
*   **IAM:** Identity and Access Management for necessary AWS permissions.

### Manual Steps for IaC Deployment

1.  **Install Terraform:** If you don't have Terraform installed, follow the official guide: [https://learn.hashicorp.com/terraform/getting-started/install](https://learn.hashicorp.com/terraform/getting-started/install)

2.  **Configure AWS Credentials:** Ensure your AWS CLI is configured with appropriate credentials that have permissions to create and manage the resources defined in the Terraform files. You can set up credentials using `aws configure`.

3.  **Navigate to Terraform Directory:**
    ```bash
    cd infra/terraform
    ```

4.  **Initialize Terraform:** This command initializes a working directory containing Terraform configuration files.
    ```bash
    terraform init
    ```

5.  **Review the Plan:** This command creates an execution plan, which lets you preview the changes that Terraform plans to make to your infrastructure.
    ```bash
    terraform plan -var="db_name=<your_db_name>" -var="db_user=<your_db_user>" -var="db_password=<your_db_password>"
    ```
    **Important:** Replace `<your_db_name>`, `<your_db_user>`, and `<your_db_password>` with your desired database credentials. These values will be used to provision your RDS instance.

6.  **Apply the Changes:** This command applies the changes required to reach the desired state of the configuration.
    ```bash
    terraform apply -var="db_name=<your_db_name>" -var="db_user=<your_db_user>" -var="db_password=<your_db_password>"
    ```
    Confirm by typing `yes` when prompted.

## 3. Deployment Platforms

### Frontend Deployment (Vercel)

Your Next.js frontend is configured for deployment to Vercel via GitHub Actions. For this to work, you need to:

1.  **Connect GitHub to Vercel:** Go to your Vercel dashboard, import your Git repository, and configure the project settings. Vercel will automatically detect your Next.js application.
2.  **Configure Vercel Project ID and Org ID:** In your Vercel project settings, find your Project ID and Organization ID. These are needed for the GitHub Action.
3.  **Set up Vercel Token:** Generate a Vercel API Token from your Vercel account settings (`Settings > Tokens`).
4.  **Add Vercel Secrets to GitHub:** Add the following secrets to your GitHub repository (`Settings > Secrets and variables > Actions`):
    *   `VERCEL_TOKEN`: The API token you generated.
    *   `VERCEL_ORG_ID`: Your Vercel Organization ID.
    *   `VERCEL_PROJECT_ID`: Your Vercel Project ID.

Once configured, pushes to the `main` branch will trigger the GitHub Action, which will build and deploy your frontend to Vercel.

### Backend Deployment (Render)

Your Django backend is Dockerized and can be deployed to Render. Here's a general guide:

1.  **Create a Render Account:** If you don't have one, sign up at [https://render.com/](https://render.com/).
2.  **Connect GitHub to Render:** In your Render dashboard, connect your GitHub account.
3.  **Create a New Web Service:**
    *   Choose `New Web Service`.
    *   Select your `ltronix-shop` repository.
    *   **Build Command:** Leave empty or specify `docker build -t ltronix-shop-backend .` (Render will typically handle this if you point to the Dockerfile).
    *   **Start Command:** `python manage.py runserver 0.0.0.0:$PORT` (Render injects the `$PORT` environment variable).
    *   **Root Directory:** Set to `ecommerce/` (where your Dockerfile and Django project reside).
    *   **Environment:** Python 3.
    *   **Instance Type:** Choose a suitable instance type (e.g., `Free` for testing).
4.  **Configure Environment Variables:** Add the necessary environment variables from your `ecommerce/.env.example` to Render's environment settings for your web service. These include:
    *   `SECRET_KEY`
    *   `DEBUG`
    *   `ALLOWED_HOSTS`
    *   `DB_NAME`
    *   `DB_USER`
    *   `DB_PASSWORD`
    *   `DB_HOST` (This will be the internal Render PostgreSQL service host)
    *   `DB_PORT`
    *   `EMAIL_HOST`, `EMAIL_PORT`, etc. (if using email)
    *   `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME` (if using S3 for static/media files)
    *   `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` (if using Celery/Redis)
5.  **Database Setup (Render PostgreSQL):**
    *   In Render, create a new PostgreSQL database service (`New > PostgreSQL`).
    *   Note down the internal database URL, username, and password. Use these for `DB_HOST`, `DB_USER`, `DB_PASSWORD` in your backend service's environment variables.
6.  **Redis Setup (Render Redis):**
    *   In Render, create a new Redis service (`New > Redis`).
    *   Note down the internal Redis URL. Use this for `CELERY_BROKER_URL` and `CELERY_RESULT_BACKEND` if you are using Celery.
7.  **Database Migrations:** After the first successful deployment, you'll need to run Django migrations. You can do this via Render's shell or by adding a `pre-deploy` command in your web service settings:
    ```bash
    python manage.py migrate
    ```
8.  **Collect Static Files:** If you are serving static files via Django (not S3), you might need to run `python manage.py collectstatic --noinput` as a `pre-deploy` command or manually.

## 4. Secrets Management

Sensitive information like API keys, database credentials, and AWS access keys are handled using environment variables and GitHub Actions secrets.

*   **`.env.example`:** You'll find `.env.example` files in `ecommerce/` and `frontend/my-app/`. These files list the required environment variables. **Do not commit actual secrets to your repository.**
*   **GitHub Actions Secrets:** For CI/CD, configure your secrets in your GitHub repository settings under `Settings > Secrets and variables > Actions`.
    *   `AWS_ACCESS_KEY_ID`
    *   `AWS_SECRET_ACCESS_KEY`
    *   `DB_NAME`
    *   `DB_USER`
    *   `DB_PASSWORD`
    *   `SECRET_KEY` (for Django)
    *   `VERCEL_TOKEN`
    *   `VERCEL_ORG_ID`
    *   `VERCEL_PROJECT_ID`

## 5. Verifying Deployment

After deploying your infrastructure and applications:

*   **Backend:** Access your backend API endpoints to ensure they are functioning correctly and connecting to the database.
*   **Frontend:** Access your frontend application in a browser. Verify that data is loading and user interactions are smooth.