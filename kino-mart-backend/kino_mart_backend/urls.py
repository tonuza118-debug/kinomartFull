from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from catalog.views import CategoryViewSet, BrandViewSet, DistrictViewSet, ProductViewSet
from storefront.views import (
    PromoBannerViewSet,
    SiteSettingViewSet,
    OrderViewSet,
    WishlistView,
    CartView,
    CouponValidateView,
    ContactMessageView,
    PaymentInitiateView,
    PaymentSuccessView,
    PaymentFailView,
    PaymentCancelView,
    PaymentIPNView,
)

router = DefaultRouter()
router.register('categories', CategoryViewSet)
router.register('brands', BrandViewSet)
router.register('districts', DistrictViewSet)
router.register('products', ProductViewSet)
router.register('banners', PromoBannerViewSet, basename='banner')
router.register('settings', SiteSettingViewSet, basename='setting')
router.register('orders', OrderViewSet, basename='order')  # includes /api/orders/mine/

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/wishlist/', WishlistView.as_view(), name='wishlist'),
    path('api/cart/', CartView.as_view(), name='cart'),
    path('api/coupons/validate/', CouponValidateView.as_view(), name='coupon-validate'),
    path('api/contact/', ContactMessageView.as_view(), name='contact-message'),
    path('api/payments/initiate/', PaymentInitiateView.as_view(), name='payment-initiate'),
    path('api/payments/success/', PaymentSuccessView.as_view(), name='payment-success'),
    path('api/payments/fail/', PaymentFailView.as_view(), name='payment-fail'),
    path('api/payments/cancel/', PaymentCancelView.as_view(), name='payment-cancel'),
    path('api/payments/ipn/', PaymentIPNView.as_view(), name='payment-ipn'),
    path('api/', include(router.urls)),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
