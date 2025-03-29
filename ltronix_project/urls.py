from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('core/', include('core.urls')),  # User management URLs
    path('shop/', include('shop.urls', namespace='shop:index')),  # Include shop URLs with namespace
    path('core/login/', auth_views.LoginView.as_view(template_name='registration/login.html'), name='login'),
]
