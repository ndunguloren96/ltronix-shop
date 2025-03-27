from django.shortcuts import render, redirect
from django.contrib.auth import login
from django.contrib.auth.forms import UserChangeForm
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .forms import CustomUserCreationForm, CustomUserChangeForm  # Import CustomUserChangeForm

@login_required
def profile(request):
    return render(request, 'core/profile.html', {'user': request.user})

def register(request):
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)  # Automatically log the user in after registration
            return redirect('profile')  # Redirect to profile page after successful registration
    else:
        form = CustomUserCreationForm()
    return render(request, 'core/register.html', {'form': form})

@login_required
def profile_update(request):
    if request.method == "POST":
        form = CustomUserChangeForm(request.POST, instance=request.user)  # Use CustomUserChangeForm
        if form.is_valid():
            form.save()
            messages.success(request, "Profile updated successfully.")
            return redirect("profile")
    else:
        form = CustomUserChangeForm(instance=request.user)  # Use CustomUserChangeForm
    return render(request, "core/profile_update.html", {"form": form})
