# ecommerce/payment/views.py
# This file will now primarily host the M-Pesa callback view which doesn't need to be part of the DRF router.
# It can also host traditional Django views if you need any, but for API purposes, api_views.py is used.

import logging

from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

# Import the MpesaConfirmationAPIView directly to expose it at a non-API URL for callbacks
from .api_views import MpesaConfirmationAPIView

logger = logging.getLogger(__name__)

# The M-Pesa callback URL, as configured in settings.MPESA_CALLBACK_URL,
# will point to this specific view. It doesn't need to be an APIView in the DRF router sense,
# as it's a direct webhook. We're re-using the logic from MpesaConfirmationAPIView.
# @csrf_exempt is necessary for external POST requests.
# The `as_view()` method is used to turn a class-based view into a callable function.
mpesa_stk_push_callback = MpesaConfirmationAPIView.as_view()

# You can keep a simple render view for initial testing or other non-API pages here if needed.
# For example:
# def some_other_page_view(request):
#    return HttpResponse("This is a non-API view in payment app.")