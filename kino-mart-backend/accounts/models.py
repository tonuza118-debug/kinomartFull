from django.conf import settings
from django.db import models


class Profile(models.Model):
    """Extra, storefront-specific fields on top of Django's built-in User."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=20, blank=True)
    default_district = models.ForeignKey(
        'catalog.District', on_delete=models.SET_NULL, null=True, blank=True, related_name='+'
    )
    default_address = models.TextField(blank=True)

    def __str__(self):
        return f'Profile<{self.user.username}>'
