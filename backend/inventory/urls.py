from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'products', views.ProductViewSet)
router.register(r'categories', views.CategoryViewSet)
router.register(r'suppliers', views.SupplierViewSet)
router.register(r'users', views.UserViewSet)
router.register(r'stock-ledger', views.StockLedgerViewSet)
router.register(r'notifications', views.NotificationViewSet)
router.register(r'dashboard/best-sellers', views.BestSellerViewSet)
router.register(r'dashboard/category-breakdown', views.CategoryBreakdownViewSet)
router.register(r'dashboard/daily-sales-chart', views.DailySalesChartViewSet)
router.register(r'dashboard/inventory-report', views.InventoryReportViewSet)
router.register(r'dashboard/low-stock-alerts', views.LowStockAlertViewSet)

urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('', include(router.urls)),
]
