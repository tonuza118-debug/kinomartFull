from django.contrib import admin
from .models import PromoBanner, SiteSetting, Order, OrderItem, Payment, Wishlist, Cart, CartItem, Coupon, ContactMessage

@admin.register(PromoBanner)
class PromoBannerAdmin(admin.ModelAdmin):
    list_display = ('kind', 'title', 'order', 'active')
    list_filter = ('kind', 'active')

@admin.register(SiteSetting)
class SiteSettingAdmin(admin.ModelAdmin):
    list_display = ('site_name', 'default_shipping_charge')
    def has_add_permission(self, request): return not SiteSetting.objects.exists()

class OrderItemInline(admin.TabularInline):
    model = OrderItem; extra = 0; readonly_fields = ('product','title','price','selected_color','quantity','image'); can_delete = False

class PaymentInline(admin.TabularInline):
    model = Payment; extra = 0; can_delete = False
    readonly_fields = ('tran_id', 'amount', 'status', 'method', 'val_id', 'bank_tran_id', 'validated_at', 'created_at')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id','full_name','user','phone_number','district','grand_total','payment_method','is_paid','status','created_at')
    list_filter = ('status','payment_method','is_paid','district')
    search_fields = ('full_name','phone_number')
    inlines = [OrderItemInline, PaymentInline]

@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('tran_id', 'order', 'amount', 'status', 'method', 'created_at')
    list_filter = ('status',)
    search_fields = ('tran_id', 'val_id', 'bank_tran_id', 'order__full_name', 'order__phone_number')
    readonly_fields = ('order', 'tran_id', 'amount', 'status', 'method', 'val_id', 'bank_tran_id', 'validated_at', 'created_at')
    def has_add_permission(self, request): return False

@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):
    list_display = ('user', 'updated_at')
    filter_horizontal = ('products',)

class CartItemInline(admin.TabularInline):
    model = CartItem; extra = 0

@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('user', 'updated_at')
    inlines = [CartItemInline]

@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'user', 'is_resolved', 'created_at')
    list_filter = ('is_resolved',)
    search_fields = ('name', 'email', 'phone_number', 'message')
    readonly_fields = ('name', 'email', 'phone_number', 'subject', 'message', 'user', 'created_at')


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ('code', 'percent_off', 'flat_off', 'active', 'expires_at', 'minimum_subtotal')
    list_filter = ('active',)
    search_fields = ('code',)
