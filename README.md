# Ltronix Shop

## Project Description

Ltronix Shop is an e-commerce platform designed to facilitate online transactions and provide a seamless payment experience for users in Kenya through M-Pesa integration.

This project aims to create a functional e-commerce platform.

## Current Features

- Basic product catalog display
- User ability to add products to cart
- Checkout process
- M-Pesa payment integration via Lipa na M-Pesa Online (STK Push)

## M-Pesa Integration Details

The M-Pesa integration allows users to pay for their purchases using their M-Pesa accounts.

- When a user selects M-Pesa at checkout and enters their phone number, the application initiates an STK Push request.
- The user receives a prompt on their phone to authorize the payment by entering their M-Pesa PIN.
- Upon successful authorization, the application processes the order and confirms the payment.

## Technology Stack

- Django (Backend)
- HTML, CSS, TypeScript (Frontend)
- PostgreSQL (Database)
- django-environ (for environment variable management)
- Safaricom M-Pesa APIs (Lipa na M-Pesa Online, Authorization)

## Getting Started

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/ndunguloren96/ltronix-shop
    cd ltronix-shop
    ```

2.  **Set up the virtual environment:**

    ```bash
    python3 -m venv .venv
    source .venv/bin/activate # or .venv\Scripts\activate on Windows
    ```

3.  **Install dependencies:**

    ```bash
    python3 -m pip install -r requirements.txt
    # or use pip3 if pip is not available:
    # pip3 install -r requirements.txt
    ```

4.  **Configure the database:**

    - Ensure PostgreSQL is installed and running.
    - Create a database for the project.
    - Set the database connection details in the `.env` file. You'll need to create a `.env` file in the root directory and add your database credentials. Example:

      ```
      # For PostgreSQL, the format is:
      # postgres://USER:PASSWORD@HOST:PORT/DBNAME
      DATABASE_URL=postgres://user:password@host:port/dbname
      ```

5.  **Configure M-Pesa API credentials:**

    - Obtain your Consumer Key, Consumer Secret, and Passkey from the Safaricom Developer Portal.
    - Add these credentials to the `.env` file:

      ```
      SAFARICOM_CONSUMER_KEY=YOUR_CONSUMER_KEY
      SAFARICOM_CONSUMER_SECRET=YOUR_CONSUMER_SECRET
      SAFARICOM_BUSINESS_SHORTCODE=YOUR_BUSINESS_SHORTCODE # PayBill or Till Number
      SAFARICOM_PASSKEY=YOUR_PASSKEY
      ```

6.  **Run migrations:**

    ```bash
    python manage.py migrate
    ```

7.  **Create a superuser (for admin access):**

    ```bash
    python manage.py createsuperuser
    ```

8.  **Run the development server:**

    ```bash
    python manage.py runserver
    ```

9.  **Access the application in your browser:**

    ```
    http://localhost:8000/
    ```

## Contributing

- Contibution is welcomed.

## License

This project is licensed under the [MIT] License.

## Future Enhancements

- Implement other payment methods (e.g., card payments).
- Add user authentication and authorization.
- Smart Inventory.
- Enhance the user interface and user experience.
- Implement order management and tracking.
