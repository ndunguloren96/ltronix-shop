from functools import wraps
from django.http import HttpResponseForbidden
from django.contrib.auth.decorators import user_passes_test
from django.shortcuts import redirect

def admin_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated and request.user.is_staff:
            return view_func(request, *args, **kwargs)
        return HttpResponseForbidden("Admins only.")
    return _wrapped_view

def vendor_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if request.user.is_authenticated and hasattr(request.user, "is_vendor") and request.user.is_vendor:
            return view_func(request, *args, **kwargs)
        return HttpResponseForbidden("Vendors only.")
    return _wrapped_view

def check_cart_not_empty(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        cart = getattr(request, "cart", None)
        if cart and hasattr(cart, "items") and cart.items.exists():
            return view_func(request, *args, **kwargs)
        return redirect("shop:cart")
    return _wrapped_view
