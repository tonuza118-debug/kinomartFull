from rest_framework import serializers
from .models import Category, Brand, District, Product, ProductImage, ProductGalleryImage, ProductVariant, ProductSpecification, ProductFAQ, ProductReview

class CategorySerializer(serializers.ModelSerializer):
    class Meta: model = Category; fields = ['id', 'name', 'slug', 'image']

class BrandSerializer(serializers.ModelSerializer):
    class Meta: model = Brand; fields = ['id', 'name', 'logo']

class DistrictSerializer(serializers.ModelSerializer):
    class Meta: model = District; fields = ['id', 'name', 'bn_name', 'shipping_charge']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta: model = ProductImage; fields = ['image']

class ProductGalleryImageSerializer(serializers.ModelSerializer):
    class Meta: model = ProductGalleryImage; fields = ['image']

class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta: model = ProductVariant; fields = ['name', 'value', 'price_modifier']

class ProductSpecificationSerializer(serializers.ModelSerializer):
    class Meta: model = ProductSpecification; fields = ['label', 'value']

class ProductFAQSerializer(serializers.ModelSerializer):
    class Meta: model = ProductFAQ; fields = ['question', 'answer']

class ProductReviewSerializer(serializers.ModelSerializer):
    class Meta: model = ProductReview; fields = ['reviewer_name', 'rating', 'comment']

class ProductListSerializer(serializers.ModelSerializer):
    class Meta: model = Product; fields = ['id', 'title', 'slug', 'thumbnail', 'price', 'original_price', 'section_type', 'in_stock', 'brand']

class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    gallery = ProductGalleryImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    specifications = ProductSpecificationSerializer(many=True, read_only=True)
    faqs = ProductFAQSerializer(many=True, read_only=True)
    reviews = ProductReviewSerializer(many=True, read_only=True)
    class Meta:
        model = Product
        fields = ['id', 'title', 'slug', 'model_number', 'price', 'original_price', 'section_type', 'in_stock', 'category', 'brand', 'thumbnail', 'short_description', 'description_html', 'discount_timer', 'images', 'gallery', 'variants', 'specifications', 'faqs', 'reviews']
