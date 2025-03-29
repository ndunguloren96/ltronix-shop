from django.http import HttpResponse
from django.shortcuts import render
from django.views.generic import ListView
from .models import Product, Category

class ProductListView(ListView):
    model = Product
    template_name = "shop/product_list.html"
    context_object_name = "products"

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.GET.get("category")
        if category:
            queryset = queryset.filter(category__name=category)
        return queryset

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context["categories"] = Category.objects.all()
        return context

def product_list(request):
    products = Product.objects.all()
    return render(request, "shop/product_list.html", {"products": products})

def product_detail(request, pk):
    return HttpResponse(f"Product Detail for ID {pk}")
