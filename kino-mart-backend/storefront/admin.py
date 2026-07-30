from django.contrib import admin
from .models import PromoBanner, SiteSetting, Order, OrderItem, Wishlist, Cart, CartItem, Coupon, ContactMessage

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

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id','full_name','user','phone_number','district','grand_total','status','created_at')
    list_filter = ('status','district')
    search_fields = ('full_name','phone_number')
    inlines = [OrderItemInline]

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
