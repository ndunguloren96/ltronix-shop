# Setup Guide

This guide walks you through setting up the Ltronix Shop project, including environment, dependencies, database, and M-Pesa integration.

---

## Prerequisites

- Python 3.8+
- PostgreSQL
- Virtualenv (recommended)
- Safaricom Developer Account (for M-Pesa API keys)

---

## Steps

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/ndunguloren96/ltronix-shop
   cd ltronix-shop
   ```

2. **Set Up Virtual Environment:**

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   ```

3. **Install Dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables:**

   - Create a `.env` file in the root directory.
   - Add your database and M-Pesa credentials:

     ```
     DATABASE_URL=postgres://user:password@host:port/dbname
     MPESA_CONSUMER_KEY=your_consumer_key
     MPESA_CONSUMER_SECRET=your_consumer_secret
     MPESA_SHORTCODE=your_shortcode
     MPESA_PASSKEY=your_passkey
     MPESA_CALLBACK_URL=https://yourdomain.com/mpesa/stk_push_callback/
     ```

5. **Database Setup:**

   - Ensure PostgreSQL is running and the database exists.
   - Run migrations:

     ```bash
     python manage.py migrate
     ```

6. **Create Superuser (Optional):**

   ```bash
   python manage.py createsuperuser
   ```

7. **Run the Development Server:**

   ```bash
   python manage.py runserver
   ```

8. **Expose Callback URL (Development Only):**

   - Use [Ngrok](https://ngrok.com/) to expose your local server for M-Pesa callbacks:

     ```bash
     ngrok http 8000
     ```

   - Update `MPESA_CALLBACK_URL` in `.env` with your Ngrok URL.

---

## Additional Notes

- **Admin Panel:** Access at `/admin/` to manage products, orders, and transactions.
- **Testing Payments:** Use Safaricom sandbox credentials and test numbers.
- **Logs:** Check logs for payment and callback events.

---

For further details, see the [architecture.md](architecture.md) and [README.md](../README.md).
