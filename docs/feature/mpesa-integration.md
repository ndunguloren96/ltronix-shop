# Payment Integration Guide

This document explains how M-Pesa payment integration is implemented in the Ltronix Shop project, including setup, flow, and troubleshooting.

---

## Overview

Ltronix Shop integrates M-Pesa payments using the [django-daraja](https://github.com/martinmogusu/django-daraja) library. Customers can pay for orders via M-Pesa STK Push, and the system automatically updates order and transaction statuses based on real-time callbacks from Safaricom.

---

## Key Components

- **payment/models.py:** Defines the `Transaction` model, storing payment details and status.
- **payment/views.py:** Handles payment initiation (`STKPushView`), M-Pesa callbacks (`mpesa_stk_push_callback`), and transaction status checks.
- **store/templates/store/checkout.html:** Checkout form and frontend logic for initiating payments and polling status.
- **settings.py:** Stores M-Pesa API credentials and callback URLs.
- **urls.py:** Routes payment endpoints.

---

## Payment Flow

1. **User Checkout:**

   - User fills in their phone number and submits the checkout form.
   - The frontend sends a POST request to `/payments/stk-push/`.

2. **STK Push Initiation:**

   - `STKPushView` validates input, creates a `Transaction` linked to the order, and calls M-Pesa via `MpesaClient.stk_push`.
   - Transaction IDs (`MerchantRequestID`, `CheckoutRequestID`) are saved for callback matching.

3. **User Prompt:**

   - The customer receives an M-Pesa prompt on their phone to authorize payment.

4. **Callback Handling:**

   - Safaricom sends a callback to `/mpesa/stk_push_callback/`.
   - The callback view updates the `Transaction` status to `COMPLETED` or `FAILED`.
   - If successful, the linked order is marked as complete.

5. **Status Polling:**
   - The frontend polls `/payments/status/?transaction_id=...` to check payment status and updates the UI accordingly.

---

## Error Handling & Timeouts

- If payment is not completed within a set timeout (e.g., 2–5 minutes), the transaction is marked as `FAILED` by a scheduled management command.
- The frontend displays appropriate messages for failed or timed-out payments.

---

## Admin & Monitoring

- All transactions are visible in the Django admin panel.
- Logs are generated for payment initiation, callbacks, and errors.

---

## Testing

- Use Safaricom sandbox credentials for development.
- Simulate various scenarios (success, failure, timeout) to ensure robustness.

---

## Troubleshooting

- **No callback received:** Ensure your callback URL is publicly accessible (use Ngrok for local dev).
- **Transaction not updated:** Check logs for errors and verify `merchant_request_id` matching.
- **Frontend not updating:** Confirm polling logic and endpoint responses.

---
