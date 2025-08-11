# Ltronix Shop Frontend

This is the Next.js frontend for the Ltronix Shop e-commerce platform.

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Deployment](#deployment)
- [CI/CD](#cicd)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

The Ltronix Shop frontend is a modern, responsive, and user-friendly e-commerce interface built with Next.js and Chakra UI. It consumes the RESTful API provided by the Django backend.

## Key Features

-   **User Authentication:** Secure user registration and login with local email/password and social providers (Google).
-   **Product Catalog:** Browse and search for products with detailed descriptions and images.
-   **Shopping Cart:** Add products to a shopping cart and manage its contents.
-   **Checkout:** A streamlined checkout process with support for M-Pesa payments.
-   **Order Management:** View order history and track order status.
-   **Admin Dashboard:** A comprehensive admin panel for managing products, orders, and users.
-   **Responsive Design:** A mobile-friendly interface that works on all devices.

## Tech Stack

-   **Framework:** [Next.js](https://nextjs.org/), [React](https://reactjs.org/)
-   **UI:** [Chakra UI](https://chakra-ui.com/)
-   **State Management:** [Zustand](https://zustand-demo.pmnd.rs/), [React Query](https://tanstack.com/query/v4)
-   **HTTP:** [Axios](https://axios-http.com/)
-   **Authentication:** [NextAuth.js](https://next-auth.js.org/)
-   **Deployment:** [Vercel](https://vercel.com/)

## Project Structure

```
frontend/my-app/
├── public/       # Static assets for the frontend
└── src/          # Frontend source code
    ├── api/          # API client for interacting with the backend
    ├── app/          # Next.js app directory
    ├── components/   # Reusable UI components
    ├── hooks/        # Custom React hooks
    ├── lib/          # Library functions
    ├── providers/    # React context providers
    ├── store/        # Zustand stores
    └── types/        # TypeScript type definitions
```

## Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/en/download/) and [npm](https://www.npmjs.com/get-npm)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ndunguloren96/ltronix-shop.git
    cd ltronix-shop/frontend/my-app
    ```

2.  **Set up environment variables:**

    -   In the `frontend/my-app` directory, copy `.env.example` to `.env.local` and fill in the required values.
        ```bash
        cp .env.example .env.local
        ```

3.  **Install dependencies:**

    ```bash
    npm install
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

## Usage

-   **Frontend:** `http://localhost:3000`

## Deployment

The frontend is designed for deployment to Vercel.

## CI/CD

The project uses GitHub Actions for continuous integration and continuous deployment.

-   **Frontend:** The frontend workflow (`.github/workflows/frontend.yml`) lints, tests, builds, and deploys the frontend to Vercel.

## Troubleshooting

-   **`npm run dev` fails:** Ensure that Node.js and npm are properly installed. Also, check that you have created the `.env.local` file with the correct values.
-   **Frontend can't connect to the backend:** Verify that the `NEXT_PUBLIC_DJANGO_API_URL` in `.env.local` is set to the correct URL of your backend API.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the [MIT](./LICENSE) License.