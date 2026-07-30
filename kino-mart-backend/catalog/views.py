from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Category, Brand, District, Product
from .serializers import CategorySerializer, BrandSerializer, DistrictSerializer, ProductListSerializer, ProductDetailSerializer

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all(); serializer_class = CategorySerializer

class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.all(); serializer_class = BrandSerializer

class DistrictViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = District.objects.all(); serializer_class = DistrictSerializer

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.prefetch_related('images', 'gallery', 'variants', 'specifications', 'faqs', 'reviews')
    lookup_field = 'slug'
    # Global DEFAULT_FILTER_BACKENDS only wires up DjangoFilterBackend, so this
    # viewset explicitly adds search + ordering on top of it.
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['section_type', 'category', 'in_stock', 'brand']
    search_fields = ['title', 'short_description', 'model_number']
    ordering_fields = ['price', 'created_at']
    def get_serializer_class(self):
        return ProductDetailSerializer if self.action == 'retrieve' else ProductListSerializer
