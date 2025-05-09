# /var/www/Django-Ecommerce-Website/ecommerce/store/views.py
from django.shortcuts import render

# from django.http import HttpResponse # You might still need HttpResponse for other simple views

# Make sure your store.html is located at:
# ecommerce/store/templates/store/store.html
# Or if you have a project-level templates folder defined in settings.PY DIRS:
# templates/store/store.html


def store(request):
    """
    View function for the main store page.
    Renders the store.html template.
    """
    # You can prepare context data to pass to the template if needed
    # For example:
    # products = Product.objects.all() # Assuming you have a Product model
    # context = {'products': products, 'page_title': 'Our Awesome Store'}
    context = {}  # For now, an empty context is fine

    # This tells Django to find 'store/store.html' within your template directories
    # and render it with the provided context.
    return render(request, "store/store.html", context)


def cart(request):
    """
    View function for the shopping cart page.
    (Assuming you'll create a cart.html template later)
    """
    context = {}
    # For now, let's assume you'll create 'store/cart.html'
    # If not, you can use HttpResponse for a placeholder:
    # return HttpResponse("<h1>Your Shopping Cart</h1>")
    return render(
        request, "store/cart.html", context
    )  # Update if your cart template is named differently or in a different path


def checkout(request):
    """
    View function for the checkout page.
    (Assuming you'll create a checkout.html template later)
    """
    context = {}
    # For now, let's assume you'll create 'store/checkout.html'
    # return HttpResponse("<h1>Checkout Page</h1>")
    return render(
        request, "store/checkout.html", context
    )  # Update if your checkout template is named differently
