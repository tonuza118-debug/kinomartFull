from rest_framework import serializers
from .models import PromoBanner, SiteSetting, Order, OrderItem, Wishlist, Cart, CartItem, Coupon, ContactMessage
from catalog.models import Product, District
from catalog.serializers import ProductListSerializer

class PromoBannerSerializer(serializers.ModelSerializer):
    class Meta: model = PromoBanner; fields = ['kind', 'image', 'title', 'subtitle', 'link', 'order']

class SiteSettingSerializer(serializers.ModelSerializer):
    class Meta: model = SiteSetting; fields = ['default_shipping_charge', 'site_name', 'gtm_id']

class OrderItemSerializer(serializers.Serializer):
    product = serializers.SlugRelatedField(slug_field='slug', queryset=Product.objects.all())
    title = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    selected_color = serializers.CharField(required=False, allow_blank=True)
    quantity = serializers.IntegerField(min_value=1)
    image = serializers.CharField(required=False, allow_blank=True)

class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    district = serializers.SlugRelatedField(slug_field='name', queryset=District.objects.all())
    class Meta:
        model = Order
        # 'id' and 'status' are read-only here (not accepted on input) but ARE
        # returned in the response, so the frontend can show an order number.
        fields = ['id', 'full_name', 'phone_number', 'district', 'address', 'subtotal', 'shipping_charge', 'grand_total', 'status', 'items']
        read_only_fields = ['id', 'status']
    def create(self, validated_data):
        items_data = validated_data.pop('items')
        order = Order.objects.create(**validated_data)
        for item in items_data:
            OrderItem.objects.create(order=order, **item)
        return order


class OrderListSerializer(serializers.ModelSerializer):
    """Read-only order history for the logged-in customer (GET /api/orders/mine/)."""
    items = OrderItemSerializer(many=True, read_only=True)
    district = serializers.StringRelatedField()
    class Meta:
        model = Order
        fields = ['id', 'full_name', 'phone_number', 'district', 'address', 'subtotal', 'shipping_charge', 'grand_total', 'status', 'created_at', 'items']


class OrderTrackSerializer(serializers.ModelSerializer):
    """Public, guest-facing shape for GET /api/orders/track/ — same info as
    OrderListSerializer but reachable without a login, by phone + order id."""
    items = OrderItemSerializer(many=True, read_only=True)
    district = serializers.StringRelatedField()
    class Meta:
        model = Order
        fields = ['id', 'full_name', 'district', 'address', 'subtotal', 'shipping_charge', 'grand_total', 'status', 'created_at', 'items']


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['id', 'name', 'email', 'phone_number', 'subject', 'message', 'created_at']
        read_only_fields = ['id', 'created_at']


class WishlistSerializer(serializers.ModelSerializer):
    products = ProductListSerializer(many=True, read_only=True)
    class Meta:
        model = Wishlist
        fields = ['products', 'updated_at']


class CartItemSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source='product', read_only=True)
    product = serializers.SlugRelatedField(slug_field='slug', queryset=Product.objects.all(), write_only=True)
    line_total = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_detail', 'variant_value', 'quantity', 'line_total']

    def get_line_total(self, obj):
        return obj.product.price * obj.quantity


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['items', 'subtotal', 'updated_at']

    def get_subtotal(self, obj):
        return sum(item.product.price * item.quantity for item in obj.items.all())


class CouponValidateSerializer(serializers.Serializer):
    code = serializers.CharField()
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2)

    def validate(self, attrs):
        from django.utils import timezone
        try:
            coupon = Coupon.objects.get(code__iexact=attrs['code'], active=True)
        except Coupon.DoesNotExist:
            raise serializers.ValidationError({'code': 'This coupon code is invalid or has expired.'})
        if coupon.expires_at and coupon.expires_at < timezone.now():
            raise serializers.ValidationError({'code': 'This coupon has expired.'})
        if attrs['subtotal'] < coupon.minimum_subtotal:
            raise serializers.ValidationError({'subtotal': f'Add at least {coupon.minimum_subtotal} to use this code.'})
        attrs['coupon'] = coupon
        return attrs
