from django.db import models

from .imaging import process_image_field

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    image = models.ImageField(upload_to='categories/', blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    class Meta: ordering = ['order', 'name']
    def __str__(self): return self.name
    def save(self, *args, **kwargs):
        process_image_field(self.image, max_dimension=800, quality=85)
        super().save(*args, **kwargs)

class Brand(models.Model):
    name = models.CharField(max_length=100)
    logo = models.ImageField(upload_to='brands/')
    order = models.PositiveIntegerField(default=0)
    class Meta: ordering = ['order', 'name']
    def __str__(self): return self.name
    def save(self, *args, **kwargs):
        process_image_field(self.logo, max_dimension=400, quality=85)
        super().save(*args, **kwargs)

class District(models.Model):
    name = models.CharField(max_length=100)
    bn_name = models.CharField(max_length=100, blank=True)
    division_id = models.CharField(max_length=10, blank=True)
    lat = models.CharField(max_length=20, blank=True)
    long = models.CharField(max_length=20, blank=True)
    shipping_charge = models.DecimalField(max_digits=8, decimal_places=2, default=60)
    class Meta: ordering = ['name']
    def __str__(self): return self.name

class Product(models.Model):
    SECTION_CHOICES = [('hot', 'Hot'), ('trending', 'Trending'), ('normal', 'Normal')]
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    model_number = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    original_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    section_type = models.CharField(max_length=20, choices=SECTION_CHOICES, default='normal')
    in_stock = models.BooleanField(default=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, blank=True, null=True, related_name='products')
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, blank=True, null=True, related_name='products')
    thumbnail = models.ImageField(upload_to='products/thumbnails/')
    short_description = models.TextField(blank=True)
    description_html = models.TextField(blank=True, help_text='HTML is rendered as-is on the product page.')
    discount_timer = models.BooleanField(default=False, help_text='Shows the countdown-to-midnight banner.')
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['-created_at']
    def __str__(self): return self.title
    def save(self, *args, **kwargs):
        # Thumbnails only ever render small (product grids/cards), so they're
        # capped tighter than the full product images below.
        process_image_field(self.thumbnail, max_dimension=600, quality=80)
        super().save(*args, **kwargs)

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image = models.ImageField(upload_to='products/images/')
    order = models.PositiveIntegerField(default=0)
    class Meta: ordering = ['order']
    def save(self, *args, **kwargs):
        process_image_field(self.image, max_dimension=1600, quality=85)
        super().save(*args, **kwargs)

class ProductGalleryImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='gallery')
    image = models.ImageField(upload_to='products/gallery/')
    order = models.PositiveIntegerField(default=0)
    class Meta: ordering = ['order']
    def save(self, *args, **kwargs):
        process_image_field(self.image, max_dimension=1600, quality=85)
        super().save(*args, **kwargs)

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    name = models.CharField(max_length=50)
    value = models.CharField(max_length=100)
    price_modifier = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    order = models.PositiveIntegerField(default=0)
    class Meta: ordering = ['order']

class ProductSpecification(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='specifications')
    label = models.CharField(max_length=100)
    value = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)
    class Meta: ordering = ['order']

class ProductFAQ(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='faqs')
    question = models.CharField(max_length=255)
    answer = models.TextField()
    order = models.PositiveIntegerField(default=0)
    class Meta: ordering = ['order']

class ProductReview(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    reviewer_name = models.CharField(max_length=100)
    rating = models.PositiveSmallIntegerField(default=5)
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ['-created_at']
