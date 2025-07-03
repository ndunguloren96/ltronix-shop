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

**Note on Frontend Deployment:** For platforms like Vercel or Render, direct deployment is typically handled by connecting the GitHub repository to their respective dashboards. These platforms automatically detect new pushes to the `main` branch and trigger deployments. The GitHub Actions workflow primarily ensures the build process is successful.

## 2. Infrastructure as Code (IaC) with Terraform

Our AWS infrastructure is defined using Terraform, located in the `infra/terraform` directory. This includes configurations for:

*   **RDS (PostgreSQL):** Relational Database Service for the backend database.
*   **ElastiCache (Redis):** In-memory data store for caching and session management.
*   **S3:** Simple Storage Service for static files and media uploads.
*   **IAM:** Identity and Access Management for necessary AWS permissions.
*   **CloudWatch:** For logging and monitoring of AWS resources.

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

## 3. Secrets Management

Sensitive information like API keys, database credentials, and AWS access keys are handled using environment variables and GitHub Actions secrets.

*   **`.env.example`:** You'll find `.env.example` files in `ecommerce/` and `frontend/my-app/`. These files list the required environment variables. **Do not commit actual secrets to your repository.**
*   **GitHub Actions Secrets:** For CI/CD, configure your secrets in your GitHub repository settings under `Settings > Secrets and variables > Actions`.
    *   `AWS_ACCESS_KEY_ID`
    *   `AWS_SECRET_ACCESS_KEY`
    *   `DB_NAME`
    *   `DB_USER`
    *   `DB_PASSWORD`
    *   `SECRET_KEY` (for Django)
    *   `DATADOG_CLIENT_TOKEN` (for frontend RUM)
    *   `DATADOG_APPLICATION_ID` (for frontend RUM)

## 4. Monitoring Setup

### AWS CloudWatch

CloudWatch logging for RDS is configured via Terraform. You can view logs directly in the AWS CloudWatch console.

### Datadog RUM (Real User Monitoring)

Datadog RUM is integrated into the frontend to monitor user experience. To enable it:

1.  **Sign up for Datadog:** If you don't have an account, sign up at [https://www.datadoghq.com/](https://www.datadoghq.com/).
2.  **Obtain Client Token and Application ID:** In your Datadog dashboard, navigate to `UX Monitoring > RUM Applications` to create a new application and obtain your `clientToken` and `applicationId`.
3.  **Update Frontend Code:** The Datadog RUM snippet has been added as a placeholder in `frontend/my-app/src/app/layout.tsx`. You need to replace `YOUR_DATADOG_CLIENT_TOKEN` and `YOUR_DATADOG_APPLICATION_ID` with your actual values. For production, it's recommended to inject these via environment variables.

    ```typescript
    // Example of how to update in layout.tsx
    DD_RUM.init({
      clientToken: process.env.NEXT_PUBLIC_DATADOG_CLIENT_TOKEN, // Use environment variable
      applicationId: process.env.NEXT_PUBLIC_DATADOG_APPLICATION_ID, // Use environment variable
      // ... other configurations
    });
    ```

4.  **Configure Environment Variables:** Add `NEXT_PUBLIC_DATADOG_CLIENT_TOKEN` and `NEXT_PUBLIC_DATADOG_APPLICATION_ID` to your frontend deployment environment variables (e.g., Vercel environment variables).

## 5. Verifying Deployment and Monitoring

After deploying your infrastructure and applications:

*   **Backend:** Access your backend API endpoints to ensure they are functioning correctly and connecting to the database.
*   **Frontend:** Access your frontend application in a browser. Verify that data is loading and user interactions are smooth.
*   **CloudWatch:** Check the AWS CloudWatch console for logs from your RDS instance.
*   **Datadog:** In your Datadog dashboard, navigate to `UX Monitoring > RUM Explorer` to see real-time user data and performance metrics.

