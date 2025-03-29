from django.views.generic import CreateView, TemplateView
from django.contrib.auth.views import LoginView
from .models import CustomUser
from django.urls import reverse_lazy

class RegisterView(CreateView):
    model = CustomUser
    fields = ['username', 'password', 'email', 'phone_number', 'address']
    template_name = 'user_management/register.html'
    success_url = reverse_lazy('login')

class ProfileView(TemplateView):
    template_name = 'user_management/profile.html'
