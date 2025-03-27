import psycopg2

try:
    conn = psycopg2.connect(
        dbname="ltronix_db",
        user="ltronix_user",
        password="962204",
        host="localhost",
        port="5432"
    )
    print("Database connection successful!")
    conn.close()
except psycopg2.Error as e:
    print(f"Database connection failed: {e}")