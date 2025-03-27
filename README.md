# Ltronix Shop

Ltronix Shop is a Django-based e-commerce platform designed to provide a seamless shopping experience. It includes features such as user authentication, product management, order processing, and category-based filtering.

## Features

- User registration, login, and profile management.
- Product listing with category filtering.
- Order management for authenticated users.
- Admin interface for managing products, categories, and orders.
- PostgreSQL database integration.
- Secure authentication using a custom user model.

## Requirements

- Python 3.8+
- Django 4.0+
- PostgreSQL 12+
- Virtual environment (recommended)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/ndunguloren96/ltronix-shop.git
   cd ltronix-shop
   ```

2. Create and activate a virtual environment:

   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Configure the database:

   - Update the database credentials in `ltronix_shop/settings.py` under the `DATABASES` section.

5. Apply migrations:

   ```bash
   python manage.py migrate
   ```

6. Create a superuser:

   ```bash
   python manage.py createsuperuser
   ```

7. Start the development server:

   ```bash
   python manage.py runserver
   ```

8. Access the application:
   - Open your browser and navigate to `http://127.0.0.1:8000`.

## Directory Structure

- `core/`: Handles user authentication and profile management.
- `shop/`: Manages products, categories, and orders.
- `templates/`: Contains HTML templates for the frontend.
- `static/`: Includes static files like CSS and JavaScript.
- `media/`: Stores uploaded media files (e.g., product images).

## Usage

- **Admin Panel**: Access the admin panel at `/admin` to manage products, categories, and orders.
- **User Features**:
  - Register at `/core/register`.
  - Login at `/core/login`.
  - View and update your profile at `/core/profile`.

## Deployment

For production deployment:

1. Set `DEBUG = False` in `ltronix_shop/settings.py`.
2. Configure `ALLOWED_HOSTS` with your domain or server IP.
3. Use a production-ready WSGI server like Gunicorn.
4. Set up static file serving using `python manage.py collectstatic`.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## Contact

For questions or support, please contact Loren Ndungu at ndunguloren96@gmail.com.
