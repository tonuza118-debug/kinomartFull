from django.conf import settings
from django.db import models
from catalog.models import Product, District

class PromoBanner(models.Model):
    KIND_CHOICES = [('hero', 'Hero slider'), ('offer', 'Offer banner'), ('promo', 'Promo banner'), ('special', 'Special offer card')]
    kind = models.CharField(max_length=20, choices=KIND_CHOICES)
    image = models.ImageField(upload_to='banners/')
    title = models.CharField(max_length=255, blank=True)
    subtitle = models.CharField(max_length=255, blank=True)
    link = models.CharField(max_length=255, blank=True, help_text='e.g. /product/some-slug or an external URL')
    order = models.PositiveIntegerField(default=0)
    active = models.BooleanField(default=True)
    class Meta: ordering = ['kind', 'order']
    def __str__(self): return f'{self.get_kind_display()} - {self.title or self.image.name}'

class SiteSetting(models.Model):
    default_shipping_charge = models.DecimalField(max_digits=8, decimal_places=2, default=60)
    site_name = models.CharField(max_length=100, default='Kino Mart')
    gtm_id = models.CharField(max_length=30, blank=True)
    def save(self, *args, **kwargs): self.pk = 1; super().save(*args, **kwargs)
    def __str__(self): return 'Site settings'

class Order(models.Model):
    STATUS_CHOICES = [('pending', 'Pending'), ('confirmed', 'Confirmed'), ('shipped', 'Shipped'), ('delivered', 'Delivered'), ('cancelled', 'Cancelled')]
    # Nullable: checkout stays guest-friendly. Set automatically from the request
    # when the customer is logged in, so /api/orders/mine/ can filter by it.
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    full_name = models.CharField(max_length=150)
    phone_number = models.CharField(max_length=20)
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True)
    address = models.TextField()
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping_charge = models.DecimalField(max_digits=8, decimal_places=2)
    grand_total = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['-created_at']
    def __str__(self): return f'Order #{self.pk} - {self.full_name}'

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    title = models.CharField(max_length=255)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    selected_color = models.CharField(max_length=100, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    image = models.CharField(max_length=500, blank=True)

class Wishlist(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='wishlist')
    products = models.ManyToManyField(Product, blank=True, related_name='wishlisted_by')
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return f'Wishlist<{self.user.username}>'

class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cart')
    updated_at = models.DateTimeField(auto_now=True)
    def __str__(self): return f'Cart<{self.user.username}>'

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    variant_value = models.CharField(max_length=100, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    class Meta:
        unique_together = ('cart', 'product', 'variant_value')
    def __str__(self): return f'{self.quantity} x {self.product.title}'

class ContactMessage(models.Model):
    """A submission from the public Contact Us form.

    Name/email/phone are captured as plain fields (not just a FK to the user)
    because most senders are guests, and even for a logged-in sender we want
    the message to show who *said* it at the time — not force a join.
    `user` is only a convenience back-reference for "was this from an
    account". Since the identifying details already live on the row itself,
    an orphaned row tied to a deleted account has no support value left, so
    on_delete=CASCADE here instead of SET_NULL — it clears out with the
    account rather than accumulating as dead weight.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name='contact_messages')
    name = models.CharField(max_length=150)
    email = models.EmailField()
    phone_number = models.CharField(max_length=20, blank=True)
    subject = models.CharField(max_length=150, blank=True)
    message = models.TextField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['-created_at']
    def __str__(self): return f'{self.name} - {self.subject or self.message[:40]}'


class Coupon(models.Model):
    code = models.CharField(max_length=30, unique=True)
    percent_off = models.PositiveIntegerField(default=0, help_text='e.g. 10 for 10% off')
    flat_off = models.DecimalField(max_digits=8, decimal_places=2, default=0, help_text='Flat currency amount off, applied after percent_off')
    active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    minimum_subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    class Meta: ordering = ['-id']
    def __str__(self): return self.code
