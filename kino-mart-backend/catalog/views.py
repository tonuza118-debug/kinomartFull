from rest_framework import viewsets
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import Category, Brand, District, Product
from .serializers import CategorySerializer, BrandSerializer, DistrictSerializer, ProductListSerializer, ProductDetailSerializer


class ProductPagination(PageNumberPagination):
    # Lets callers (e.g. a homepage rail showing 8 cards) ask for a smaller
    # page than the default 20, instead of always paying for 20 products'
    # worth of data + images when only a handful are ever rendered.
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 40

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all(); serializer_class = CategorySerializer

class BrandViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Brand.objects.all(); serializer_class = BrandSerializer

class DistrictViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = District.objects.all(); serializer_class = DistrictSerializer

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    lookup_field = 'slug'
    pagination_class = ProductPagination
    # Global DEFAULT_FILTER_BACKENDS only wires up DjangoFilterBackend, so this
    # viewset explicitly adds search + ordering on top of it.
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['section_type', 'category', 'in_stock', 'brand']
    search_fields = ['title', 'short_description', 'model_number']
    ordering_fields = ['price', 'created_at']

    def get_queryset(self):
        # List view only serializes id/title/slug/thumbnail/price/.../brand — so it
        # only needs select_related('brand') to avoid an N+1 on that FK. The heavier
        # prefetches (images/gallery/variants/specs/faqs/reviews) are only used by
        # ProductDetailSerializer on retrieve, so they're skipped here entirely
        # instead of being fetched (and thrown away) on every list request.
        if self.action == 'retrieve':
            return Product.objects.select_related('brand', 'category').prefetch_related(
                'images', 'gallery', 'variants', 'specifications', 'faqs', 'reviews'
            )
        return Product.objects.select_related('brand', 'category')

    def get_serializer_class(self):
        return ProductDetailSerializer if self.action == 'retrieve' else ProductListSerializer
