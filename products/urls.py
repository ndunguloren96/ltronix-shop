from django.urls import path
from . import views

urlpatterns = [
    path("products/", views.ProductListView.as_view(), name="product-list"),
    path("products/<int:pk>/", views.ProductDetailView.as_view(), name="product-detail"),
    path("products/create/", views.ProductCreateView.as_view(), name="product-create"),
    path("products/category/<slug:slug>/", views.ProductByCategoryView.as_view(), name="product-by-category"),
    path("categories/", views.CategoryListView.as_view(), name="category-list"),
    path("brands/", views.BrandListView.as_view(), name="brand-list"),
    path("products/<int:product_id>/reviews/", views.ReviewCreateView.as_view(), name="review-create"),
]
