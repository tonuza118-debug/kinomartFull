from rest_framework import viewsets, mixins, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PromoBanner, SiteSetting, Order, Wishlist, Cart, CartItem, ContactMessage
from catalog.models import Product
from .serializers import (
    PromoBannerSerializer,
    SiteSettingSerializer,
    OrderCreateSerializer,
    OrderListSerializer,
    OrderTrackSerializer,
    WishlistSerializer,
    CartSerializer,
    CouponValidateSerializer,
    ContactMessageSerializer,
)


class PromoBannerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PromoBanner.objects.filter(active=True); serializer_class = PromoBannerSerializer; filterset_fields = ['kind']


class SiteSettingViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    queryset = SiteSetting.objects.all(); serializer_class = SiteSettingSerializer


class OrderViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    serializer_class = OrderCreateSerializer

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def mine(self, request):
        """GET /api/orders/mine/ — order history for the logged-in customer."""
        orders = Order.objects.filter(user=request.user).prefetch_related('items')
        return Response(OrderListSerializer(orders, many=True).data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def track(self, request):
        """GET /api/orders/track/?phone=<phone> — guest order lookup by phone.

        No login needed (guest checkout has no account to log into). Returns
        every order placed with that phone number, most recent first.
        """
        phone = request.query_params.get('phone', '').strip()
        if not phone:
            return Response({'detail': 'phone is required.'}, status=status.HTTP_400_BAD_REQUEST)
        orders = Order.objects.filter(phone_number=phone).prefetch_related('items')
        if not orders.exists():
            return Response({'detail': 'No orders found for that phone number.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderTrackSerializer(orders, many=True).data)


class WishlistView(APIView):
    """GET/POST/DELETE /api/wishlist/ — a signed-in customer's saved products.

    POST body: {"product": "<slug>"} to add.
    DELETE with ?product=<slug> to remove one item, or no query param to clear all.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_wishlist(self, request):
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        return wishlist

    def get(self, request):
        return Response(WishlistSerializer(self.get_wishlist(request)).data)

    def post(self, request):
        slug = request.data.get('product')
        product = Product.objects.filter(slug=slug).first()
        if not product:
            return Response({'product': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        wishlist = self.get_wishlist(request)
        wishlist.products.add(product)
        return Response(WishlistSerializer(wishlist).data)

    def delete(self, request):
        wishlist = self.get_wishlist(request)
        slug = request.query_params.get('product')
        if slug:
            wishlist.products.remove(*wishlist.products.filter(slug=slug))
        else:
            wishlist.products.clear()
        return Response(WishlistSerializer(wishlist).data)


class CartView(APIView):
    """GET/POST/PATCH/DELETE /api/cart/ — a signed-in customer's server-side cart.

    POST body: {"product": "<slug>", "variant_value": "", "quantity": 1} — adds,
    or increments quantity if that product+variant combo is already in the cart.
    PATCH body: same shape, but sets the quantity outright (0 removes the line).
    DELETE with ?product=<slug>&variant_value= to remove one line, or no params to clear.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_cart(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return cart

    def get(self, request):
        return Response(CartSerializer(self.get_cart(request)).data)

    def post(self, request):
        cart = self.get_cart(request)
        slug = request.data.get('product')
        variant_value = request.data.get('variant_value', '')
        quantity = int(request.data.get('quantity', 1))
        product = Product.objects.filter(slug=slug).first()
        if not product:
            return Response({'product': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        item, created = CartItem.objects.get_or_create(
            cart=cart, product=product, variant_value=variant_value, defaults={'quantity': quantity}
        )
        if not created:
            item.quantity += quantity
            item.save()
        return Response(CartSerializer(cart).data)

    def patch(self, request):
        cart = self.get_cart(request)
        slug = request.data.get('product')
        variant_value = request.data.get('variant_value', '')
        quantity = int(request.data.get('quantity', 1))
        item = CartItem.objects.filter(cart=cart, product__slug=slug, variant_value=variant_value).first()
        if not item:
            return Response({'product': 'That item is not in the cart.'}, status=status.HTTP_404_NOT_FOUND)
        if quantity <= 0:
            item.delete()
        else:
            item.quantity = quantity
            item.save()
        return Response(CartSerializer(cart).data)

    def delete(self, request):
        cart = self.get_cart(request)
        slug = request.query_params.get('product')
        if slug:
            CartItem.objects.filter(cart=cart, product__slug=slug, variant_value=request.query_params.get('variant_value', '')).delete()
        else:
            cart.items.all().delete()
        return Response(CartSerializer(cart).data)


class ContactMessageView(APIView):
    """POST /api/contact/ — public Contact Us form submission.

    Anyone can submit (guest or logged-in); if the request is authenticated,
    the message is linked to that account for convenience, otherwise it's
    stored with just the name/email/phone the sender typed in.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = request.user if request.user.is_authenticated else None
        serializer.save(user=user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CouponValidateView(APIView):
    """POST /api/coupons/validate/ — {"code": "SAVE10", "subtotal": "1200.00"}"""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CouponValidateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        coupon = serializer.validated_data['coupon']
        subtotal = serializer.validated_data['subtotal']
        discount = (subtotal * coupon.percent_off / 100) + coupon.flat_off
        discount = min(discount, subtotal)
        return Response({
            'code': coupon.code,
            'percent_off': coupon.percent_off,
            'flat_off': str(coupon.flat_off),
            'discount': str(discount),
            'new_total': str(subtotal - discount),
        })
