from rest_framework import serializers
from .models import (
    Product, Category, Supplier, User, StockLedger,
    StockAdjustment, Notification,
    VBestSeller, VCategoryBreakdown, VDailySalesChart,
    VInventoryReport, VLowStockAlert,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'
        read_only_fields = ['id']


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['id']


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source='category.name', read_only=True
    )
    supplier_name = serializers.CharField(
        source='supplier.company_name', read_only=True
    )

    class Meta:
        model = Product
        fields = [
            'id', 'sku', 'name', 'category', 'category_name',
            'supplier', 'supplier_name', 'cost_price', 'selling_price',
            'stock', 'reorder_level', 'status', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']

    def validate(self, data):
        if data.get('selling_price', 0) <= data.get('cost_price', 0):
            raise serializers.ValidationError(
                'Selling price must be strictly greater than cost price.'
            )
        return data


class ProductDropdownSerializer(serializers.ModelSerializer):
    price = serializers.DecimalField(source='selling_price', max_digits=12, decimal_places=2)

    class Meta:
        model = Product
        fields = ['id', 'sku', 'name', 'price', 'stock']
        read_only_fields = ['id']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        exclude = ['password_hash']


class StockLedgerSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source='product.name', read_only=True
    )

    class Meta:
        model = StockLedger
        fields = [
            'id', 'tx_id', 'product', 'product_name', 'type',
            'qty', 'balance_after', 'user', 'reference_type',
            'reference_id', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'tx_id', 'balance_after', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class BestSellerSerializer(serializers.ModelSerializer):
    class Meta:
        model = VBestSeller
        fields = '__all__'


class CategoryBreakdownSerializer(serializers.ModelSerializer):
    class Meta:
        model = VCategoryBreakdown
        fields = '__all__'


class DailySalesChartSerializer(serializers.ModelSerializer):
    class Meta:
        model = VDailySalesChart
        fields = '__all__'


class InventoryReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = VInventoryReport
        fields = '__all__'


class LowStockAlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = VLowStockAlert
        fields = '__all__'
