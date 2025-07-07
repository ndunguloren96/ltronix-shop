Solve the error below fully, and thoroughly. Seek to understand context and the codebase. Preserve existing functionalities, features, and tech. Remember to have scalability, performance, and reliability in mind. :

"
➜  my-app git:(fix/frontend-errors) npm run dev

> my-app@0.1.0 dev
> NODE_OPTIONS='--max-old-space-size=4096' next dev

   ▲ Next.js 15.3.5
   - Local:        http://localhost:3000
   - Network:      http://172.28.143.206:3000
   - Environments: .env.local

 ✓ Starting...
 ✓ Ready in 22.5s
 ○ Compiling / ...


Retrying 1/3...


Retrying 2/3...


Retrying 3/3...
[AggregateError: ] { code: 'ETIMEDOUT' }
 ⨯ Failed to download `Inter` from Google Fonts. Using fallback font instead.

Failed to fetch `Inter` from Google Fonts.}
 ✓ Compiled / in 835s (4502 modules)
[next-auth][warn][DEBUG_ENABLED]
https://next-auth.js.org/warnings#debug_enabled
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  <... fallbackRender={function SentryFallback} onError=... children=...>
                      ^^^^^^^^^^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '1660678800'
}
 ⨯ Error: Event handlers cannot be passed to Client Component props.
  <... fallbackRender=... onError={function onError} children=...>
                                  ^^^^^^^^^^^^^^^^^^
If you need interactivity, consider converting part of this to a Client Component.
    at stringify (<anonymous>) {
  digest: '4292927805'
}
Network or unexpected error fetching products: Error [AbortError]: This operation was aborted
    at async fetchProducts (src/api/products.ts:29:21)
  27 |     const url = new URL('products/products/', DJANGO_API_BASE_URL);
  28 |
> 29 |     const response = await fetch(url.toString(), {
     |                     ^
  30 |       method: 'GET',
  31 |       headers: {
  32 |         'Content-Type': 'application/json', {
  code: 20,
  INDEX_SIZE_ERR: 1,
  DOMSTRING_SIZE_ERR: 2,
  HIERARCHY_REQUEST_ERR: 3,
  WRONG_DOCUMENT_ERR: 4,
  INVALID_CHARACTER_ERR: 5,
  NO_DATA_ALLOWED_ERR: 6,
  NO_MODIFICATION_ALLOWED_ERR: 7,
  NOT_FOUND_ERR: 8,
  NOT_SUPPORTED_ERR: 9,
  INUSE_ATTRIBUTE_ERR: 10,
  INVALID_STATE_ERR: 11,
  SYNTAX_ERR: 12,
  INVALID_MODIFICATION_ERR: 13,
  NAMESPACE_ERR: 14,
  INVALID_ACCESS_ERR: 15,
  VALIDATION_ERR: 16,
  TYPE_MISMATCH_ERR: 17,
  SECURITY_ERR: 18,
  NETWORK_ERR: 19,
  ABORT_ERR: 20,
  URL_MISMATCH_ERR: 21,
  QUOTA_EXCEEDED_ERR: 22,
  TIMEOUT_ERR: 23,
  INVALID_NODE_TYPE_ERR: 24,
  DATA_CLONE_ERR: 25
}
Failed to prefetch products for Home page: Error [AbortError]: This operation was aborted
    at async fetchProducts (src/api/products.ts:29:21)
  27 |     const url = new URL('products/products/', DJANGO_API_BASE_URL);
  28 |
> 29 |     const response = await fetch(url.toString(), {
     |                     ^
  30 |       method: 'GET',
  31 |       headers: {
  32 |         'Content-Type': 'application/json', {
  code: 20,
  INDEX_SIZE_ERR: 1,
  DOMSTRING_SIZE_ERR: 2,
  HIERARCHY_REQUEST_ERR: 3,
  WRONG_DOCUMENT_ERR: 4,
  INVALID_CHARACTER_ERR: 5,
  NO_DATA_ALLOWED_ERR: 6,
  NO_MODIFICATION_ALLOWED_ERR: 7,
  NOT_FOUND_ERR: 8,
  NOT_SUPPORTED_ERR: 9,
  INUSE_ATTRIBUTE_ERR: 10,
  INVALID_STATE_ERR: 11,
  SYNTAX_ERR: 12,
  INVALID_MODIFICATION_ERR: 13,
  NAMESPACE_ERR: 14,
  INVALID_ACCESS_ERR: 15,
  VALIDATION_ERR: 16,
  TYPE_MISMATCH_ERR: 17,
  SECURITY_ERR: 18,
  NETWORK_ERR: 19,
  ABORT_ERR: 20,
  URL_MISMATCH_ERR: 21,
  QUOTA_EXCEEDED_ERR: 22,
  TIMEOUT_ERR: 23,
  INVALID_NODE_TYPE_ERR: 24,
  DATA_CLONE_ERR: 25
}
 GET / 500 in 916142ms
 ○ Compiling /favicon.ico ...
 ✓ Compiled /favicon.ico in 661.2s (3038 modules)
 GET /favicon.ico 200 in 698617ms
➜  my-app git:(fix/frontend-errors)
"


This is my frontend/my-app/.env.local :
"
# frontend/my-app/.env.local
# Environment variables for your Next.js frontend (Development)
# This file should NOT be committed to version control.

# --- Next.js / NextAuth.js Core Settings ---
# The URL where your Next.js application is running.
# IMPORTANT: This MUST match one of the "Authorized redirect URIs" in your Google Cloud Console OAuth 2.0 Client ID.
NEXTAUTH_URL=http://localhost:3000

# NextAuth.js Secret: A long, random string used to sign and encrypt cookies.
# Generate one using `openssl rand -base64 32` or a similar tool.
NEXTAUTH_SECRET=D84E4CCE28EEEDF24FEF862F7EF6F

# --- Django Backend API Integration ---
# The base URL of your Django REST API.
# This is used by your Next.js app to make API calls to Django.
# In development, it points directly to your local Django server.
# Choose ONE of the following (localhost/127.0.0.1 or Ngrok URL)
# NEXT_PUBLIC_DJANGO_API_URL=http://127.0.0.1:8000/api/v1
# NEXT_PUBLIC_DJANGO_API_URL=https://man-fond-tortoise.ngrok-free.app/api
NEXT_PUBLIC_DJANGO_API_URL=http://192.168.68.101:8000/api/v1


# --- Google OAuth Provider Credentials (for NextAuth.js) ---
# These are your Google Cloud Console "Web application" OAuth 2.0 Client ID and Client Secret
GOOGLE_CLIENT_ID=434917669665-g9id9hli8c71fpa4fkhsi57ho8a7ta8o.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# --- Django Backend's OAuth Toolkit Application Credentials ---
# These are the Client ID and Client Secret of the Application created in Django Admin.
# NextAuth sends these to Django's /convert-token/ endpoint.
NEXT_PUBLIC_DJANGO_CLIENT_ID=wA9W3KWn0GWKRQ7RmnSnm92qfWgetLWwXRIEQpLQ
NEXT_PUBLIC_DJANGO_CLIENT_SECRET=urC7Qt6si5xTn6TWYUwl1LPuV2a0lxEHCbL0tMcO05LXa3sL79xBtqB4oNzAh7BdHkRpA3RroDZQYoQ864uFCd

# --- Sentry & Datadog RUM Configuration for Frontend ---
# Sentry DSN for frontend monitoring (get this from your Sentry project settings)
NEXT_PUBLIC_SENTRY_DSN="https://4212a72316d9ba7ca5100b47a0b37fa3@o4509555378356225.ingest.us.sentry.io/4509564238430208"

# Datadog RUM Configuration (get these from your Datadog RUM Application Settings)
NEXT_PUBLIC_DATADOG_APP_ID="e48c3512-b477-47e1-8404-a652eece31c1"
NEXT_PUBLIC_DATADOG_CLIENT_TOKEN="pubae4f9f4cf05bb1994548e0e11666071c"
NEXT_PUBLIC_DATADOG_SITE="datadoghq.com" # Or "eu.datadoghq.com" depending on your Datadog region

# General environment variable for conditional logic and Sentry environment tracking
NEXT_PUBLIC_ENV="development" # or "production", "staging"

# Example for Vercel integration (if you deploy there)
# NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA=

# --- Production Placeholders (DO NOT UNCOMMENT OR USE IN DEV) ---
# When deploying to production, these values will be set in your hosting environment
# (e.g., Vercel environment variables, Netlify environment variables, Docker/Kubernetes secrets).
# NEXTAUTH_URL_PROD=https://your-production-frontend.com
# NEXTAUTH_SECRET_PROD=a_new_very_strong_random_string_for_production
# NEXT_PUBLIC_DJANGO_API_URL_PROD=https://api.your-production-backend.com/api/v1
# GOOGLE_CLIENT_ID_PROD=your_production_google_client_id
# GOOGLE_CLIENT_SECRET_PROD=your_production_google_client_secret

"
This is my ecommerce/.env:
"
# ecommerce/.env
# This file should be placed in the root of your Django project (ltronix-shop/ecommerce/.env)
# and should NOT be committed to version control (e.g., add it to .gitignore).

# --- Django Core Settings ---
# Django Secret Key (VERY IMPORTANT - GENERATE A STRONG, UNIQUE ONE FOR PRODUCTION)
# You can generate one using Python:
# import os
# import secrets
# print(secrets.token_urlsafe(50))
DJANGO_SECRET_KEY=08tnz*jup6*6s!vpf%u5u**=@m197&67%vmrd4!tmd4qdc
DEBUG=True

# --- Database Settings ---
# Used by django-environ's env.db() to configure your database connection.
# For local PostgreSQL, ensure your database server is running.
DATABASE_ENGINE=django.db.backends.postgresql
DATABASE_NAME=ndunguloren96
DATABASE_USER=ndunguloren96
DATABASE_PASSWORD=962204
DATABASE_HOST=localhost
DATABASE_PORT=5432

# Alternative: If you prefer to use a single DATABASE_URL string (uncomment and configure if needed)
DATABASE_URL=postgresql://ndunguloren96:962204@localhost:5432/ndunguloren96

# Redis Celery Cache
CELERY_BROKER_URL="rediss://Itronix-redis-cache.fwfp68d.serverless.use1.cache.amazonaws.com:6379/0"
# CELERY_BROKER_URL="rediss://:YOUR_REDIS_PASSWORD@Itronix-redis-cache.fwfp68d.serverless.use1.cache.amazonaws.com:6379/0" # Todo:After testing production ready set pa>
# --- M-Pesa Settings (for django-daraja) ---
MPESA_CONSUMER_KEY=Ho5xpPlzH5mtGvMAQmfwB2jXSw9Z9uEGIeAGDgiVY0NSl8VF
MPESA_CONSUMER_SECRET=xBQbM4fA1cNA3duyFuiKDaKZGd5YDT6yvCwYApINB9wyhzPAr5A9AG2jwootQ96T
MPESA_EXPRESS_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_ENV=sandbox # Set to 'production' for live M-Pesa
MPESA_SHORTCODE=0000

# M-Pesa STK Push Callback URL for local Ngrok testing (Django backend's Ngrok URL)
# IMPORTANT: Update this whenever your Ngrok URL for Django changes!
MPESA_CALLBACK_URL=https://man-fond-tortoise.ngrok-free.app/mpesa/stk_push_callback/

# Test Credentials (for reference, not used by Django-Daraja directly from here)
# InitiatorName=testapi
# InitiatorPassword=Safaricom123!!
# PartyA=600990
# PartyB=600000
# PhoneNumber=254716941474 #receives the MPESA PIN prompt
# BusinessShortCode=174379
# PassKey=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919


# --- Email Settings for Development ---
# For local development, use Mailpit/Mailhog (recommended) or console backend.
# Mailpit/Mailhog: Run 'mailpit' in your terminal and visit http://localhost:8025
# EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend # Handled in base/development.py now
# EMAIL_HOST=localhost # Handled in base/development.py now
# EMAIL_PORT=1025 # Handled in base/development.py now
# EMAIL_USE_TLS=False # Handled in base/development.py now
# EMAIL_HOST_USER= # Handled in base/development.py now
# EMAIL_HOST_PASSWORD= # Handled in base/development.py now
DEFAULT_FROM_EMAIL=noreply@ltronix-shop.com # Keep here for base setting


# --- SendGrid & Sentry DSNs ---
SENDGRID_API_KEY=your_sendgrid_api_key_here # Get this from your SendGrid account
SENTRY_DSN="https://4212a72316d9ba7ca5100b47a0b37fa3@o4509555378356225.ingest.us.sentry.io/4509564238430208"
SENTRY_DSN_DEVELOPMENT="https://4212a72316d9ba7ca5100b47a0b37fa3@o4509555378356225.ingest.us.sentry.io/4509564238430208"
DJANGO_ENVIRONMENT=development # or 'production', 'staging'
RELEASE_VERSION=1.0.0 # Define a release version for Sentry

# --- CORS (Cross-Origin Resource Sharing) Settings ---
# Origins allowed to make browser requests to your Django backend API.
# MUST include your Next.js frontend's development URL.
# ONLY EXACT ORIGINS HERE. Regexes handled in settings/development.py
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://man-fond-tortoise.ngrok-free.app


# --- CSRF Trusted Origins ---
# Origins from which Django trusts incoming CSRF-protected requests.
# MUST include your Next.js frontend's development URL.
# ONLY EXACT ORIGINS HERE.
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://man-fond-tortoise.ngrok-free.app


# --- Django Password Reset Confirmation URL (Frontend URL) ---
# This URL is used by Django to construct the password reset email link.
# It MUST point to your Next.js frontend's password reset confirmation page.
DJANGO_PASSWORD_RESET_CONFIRM_URL=http://localhost:3000/auth/password-reset-confirm/{uid}/{token}


# --- Google OAuth2 Credentials (for Django's drf-social-oauth2 / social-auth-app-django) ---
# These come from your Google Cloud Console project.
# They should be the SAME as the GOOGLE_CLIENT_ID/SECRET used by NextAuth.js.
SOCIAL_AUTH_GOOGLE_OAUTH2_KEY=434917669665-g9id9hli8c71fpa4fkhsi57ho8a7ta8o.apps.googleusercontent.com
SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET=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

# Google OAuth2 Redirect URI (for Django's social-auth-app-django)
# This is the backend URL where Google *could* redirect (though NextAuth.js handles the primary redirect).
# It should match an Authorized redirect URI in your Google Cloud Console OAuth 2.0 Client IDs.
SOCIAL_AUTH_GOOGLE_OAUTH2_REDIRECT_URI=http://127.0.0.1:8000/api/auth/complete/google-oauth2/

# Indicates if social authentication redirects should use HTTPS.
# Set to `True` for production, or if your local Django dev server is accessed via HTTPS (e.g., Ngrok).
SOCIAL_AUTH_REDIRECT_IS_HTTPS=False # Set to True if your Django's Ngrok URL is HTTPS


# --- Next.js Frontend Environment Variables (for reference in Django's .env) ---
# These are the variables that your Next.js frontend will read from its own .env.local
# They are included here for completeness and to ensure consistency in values.

# Next.js Frontend API Base URL (used in Next.js files to call Django backend)
# NEXT_PUBLIC_DJANGO_API_URL=http://127.0.0.1:8000/api/v1 # For development
NEXT_PUBLIC_DJANGO_API_URL=http://192.168.68.101:8000/api/v1
#changed to i do not know if it is correct. I changed for backend and frontend.
# If Next.js calls Django via Ngrok
# NEXT_PUBLIC_DJANGO_API_URL=https://man-fond-tortoise.ngrok-free.app/api


# NextAuth.js Base URL (Frontend's own URL)
# IMPORTANT: This MUST match the "Authorized redirect URIs" in Google Cloud Console
# and your Next.js frontend's actual URL (local or Ngrok).
NEXTAUTH_URL=http://localhost:3000
# NEXTAUTH_URL=https://man-fond-tortoise.ngrok-free.app # If your Next.js frontend is also exposed via Ngrok

# NextAuth.js Google OAuth Provider Credentials (used in Next.js)
# These should be the SAME as SOCIAL_AUTH_GOOGLE_OAUTH2_KEY/SECRET.
GOOGLE_CLIENT_ID=434917669665-g9id9hli8c71fpa4fkhsi57ho8a7ta8o.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# NextAuth.js Secret (generate with `openssl rand -base64 32`)
NEXTAUTH_SECRET=D84E4CCE28EEEDF24FEF862F7EF6F
"
