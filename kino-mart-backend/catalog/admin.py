from django.contrib import admin
from .models import Category, Brand, District, Product, ProductImage, ProductGalleryImage, ProductVariant, ProductSpecification, ProductFAQ, ProductReview

class ProductImageInline(admin.TabularInline): model = ProductImage; extra = 1
class ProductGalleryImageInline(admin.TabularInline): model = ProductGalleryImage; extra = 1
class ProductVariantInline(admin.TabularInline): model = ProductVariant; extra = 1
class ProductSpecificationInline(admin.TabularInline): model = ProductSpecification; extra = 1
class ProductFAQInline(admin.TabularInline): model = ProductFAQ; extra = 1
class ProductReviewInline(admin.TabularInline): model = ProductReview; extra = 0

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('title', 'slug', 'price', 'section_type', 'in_stock', 'category', 'brand')
    list_filter = ('section_type', 'in_stock', 'category', 'brand')
    search_fields = ('title', 'slug')
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ProductImageInline, ProductGalleryImageInline, ProductVariantInline, ProductSpecificationInline, ProductFAQInline, ProductReviewInline]

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'order')

@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ('name', 'bn_name', 'shipping_charge')
    search_fields = ('name', 'bn_name')
