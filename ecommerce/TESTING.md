# Testing and Quality Assurance for Ltronix Shop Backend

This document outlines how to run tests and perform quality checks for the Django backend of the Ltronix Shop.

## 1. Setup

Ensure you have Python 3.10+ and `pip` installed.
Navigate to the `ecommerce/` directory:
```bash
cd ecommerce/
```

Install the required dependencies, including testing and quality assurance tools:
```bash
pip install -r requirements.txt
pip install pytest==7.4.4 coverage==7.4.4 black==24.3.0 isort==5.12.0 pytest-django
```

## 2. Running Tests

Tests are written using `pytest` and `pytest-django`.

To run all backend tests:
```bash
python3 -m pytest
```

To run tests for a specific app (e.g., `store`):
```bash
python3 -m pytest store/
```

To run a specific test file:
```bash
python3 -m pytest store/tests/test_models.py
```

To run a specific test function within a file:
```bash
python3 -m pytest store/tests/test_models.py::test_product_creation
```

## 3. Code Coverage

To generate a test coverage report:
```bash
python3 -m pytest --cov=. --cov-report=html
```
This will generate an `htmlcov/` directory. Open `htmlcov/index.html` in your browser to view the report.

## 4. Code Formatting and Linting

We use `black` for code formatting and `isort` for sorting imports.

To automatically format code:
```bash
python3 -m black .
```

To automatically sort imports:
```bash
python3 -m isort .
```

It's recommended to run these tools before committing changes to maintain code consistency.

## 5. Frontend Testing (Overview)

Frontend tests are located in `frontend/my-app/`. Refer to `frontend/my-app/README.md` and `frontend/my-app/package.json` for specific commands.

*   **Linting:** `npm run lint`
*   **Unit/Integration Testing:** (Requires Jest and React Testing Library setup - not yet configured)
*   **End-to-End Testing:** (Requires Playwright/Cypress setup - not yet configured)
*   **Accessibility Testing:** Integrated with `@axe-core/react` (runs in development mode).

## 6. Security Considerations

The Django backend is configured with several security best practices, including:
*   Loading sensitive keys from environment variables.
*   Enforcing strong password policies.
*   Configuring CORS and CSRF settings.
*   Using secure cookies in production.
*   Implementing HSTS.

Regular security audits and keeping dependencies updated are crucial for maintaining a secure application.
