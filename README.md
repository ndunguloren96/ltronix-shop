# Ltronix Shop

Ltronix Shop is a full-stack e-commerce platform built with a modern architecture, featuring a decoupled frontend and backend, automated CI/CD pipelines, and infrastructure as code.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [CI/CD](#cicd)
- [Infrastructure](#infrastructure)
- [Contributing](#contributing)
- [License](#license)

## Features

- User authentication (local and social)
- Product catalog and search
- Shopping cart and checkout
- M-Pesa payment integration
- Order history and user profiles
- Admin dashboard for managing products, orders, and users

## Tech Stack

### Backend

- **Framework:** Django, Django Rest Framework
- **Database:** PostgreSQL
- **Async Tasks:** Celery, Redis
- **Authentication:** django-allauth, Simple JWT
- **Payments:** django-daraja (M-Pesa)
- **Deployment:** Docker, Gunicorn

### Frontend

- **Framework:** Next.js, React
- **UI:** Chakra UI
- **State Management:** Zustand, React Query
- **HTTP:** Axios
- **Authentication:** NextAuth.js
- **Deployment:** Vercel

### Infrastructure

- **Cloud Provider:** AWS
- **Infrastructure as Code:** Terraform
- **Services:** EC2, RDS, S3, ElastiCache, VPC, CloudWatch

### CI/CD

- **Platform:** GitHub Actions
- **Backend:** Docker image build and push to GitHub Container Registry, Terraform deployment to AWS
- **Frontend:** Deployment to Vercel

## Project Structure

```
ltronix-shop/
├── .github/            # GitHub Actions workflows
├── .venv/              # Virtual environment
├── docs/               # Project documentation
├── ecommerce/          # Django backend
├── frontend/my-app/    # Next.js frontend
├── infra/terraform/    # Terraform infrastructure code
├── nginx/              # Nginx configuration
├── ...
```

## Getting Started

### Prerequisites

- Docker
- Docker Compose
- Node.js and npm
- Python and pip

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ndunguloren96/ltronix-shop.git
    cd ltronix-shop
    ```

2.  **Set up environment variables:**

    -   Copy `.env.example` to `.env` in both the `ecommerce` and `frontend/my-app` directories and fill in the required values.

3.  **Build and run the application:**

    ```bash
    docker-compose up --build
    ```

## Usage

-   The frontend is accessible at `http://localhost:3000`.
-   The backend API is accessible at `http://localhost:8000/api/v1/`.
-   The Django admin panel is at `http://localhost:8000/admin/`.

## Deployment

The application is designed for deployment to AWS and Vercel. The `docker-compose.yml` file can be adapted for production use, and the Terraform scripts will provision the necessary AWS resources.

## CI/CD

The project uses GitHub Actions for continuous integration and continuous deployment.

-   **Backend:** The backend workflow (`.github/workflows/backend.yml`) lints, tests, builds a Docker image, and deploys the infrastructure to AWS.
-   **Frontend:** The frontend workflow (`.github/workflows/frontend.yml`) lints, tests, builds, and deploys the frontend to Vercel.

## Infrastructure

The infrastructure is managed with Terraform. The configuration in `infra/terraform/` defines the AWS resources required to run the application.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.