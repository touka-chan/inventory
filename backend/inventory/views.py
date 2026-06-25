from django.contrib.auth.hashers import check_password
from django.db import transaction
from django.db.models import F
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .models import (
    Product, Category, Supplier, User, StockLedger, Notification,
)
from .serializers import (
    ProductSerializer, ProductDropdownSerializer,
    CategorySerializer, SupplierSerializer, UserSerializer,
    StockLedgerSerializer, NotificationSerializer,
    BestSellerSerializer, CategoryBreakdownSerializer,
    DailySalesChartSerializer, InventoryReportSerializer,
    LowStockAlertSerializer,
)
from .models import (
    VBestSeller, VCategoryBreakdown, VDailySalesChart,
    VInventoryReport, VLowStockAlert,
)


@api_view(['GET', 'POST'])
@permission_classes([AllowAny])
@csrf_exempt
def login_view(request):
    if request.method == 'GET':
        if 'user_id' in request.session:
            try:
                user = User.objects.get(id=request.session['user_id'])
                return Response(UserSerializer(user).data)
            except User.DoesNotExist:
                request.session.flush()
        return Response({'error': 'Not authenticated.'}, status=status.HTTP_401_UNAUTHORIZED)

    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')
    try:
        user = User.objects.get(email__iexact=email)
        if not check_password(password, user.password_hash):
            return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)
        request.session['user_id'] = user.id
        request.session.save()
        return Response(UserSerializer(user).data)
    except User.DoesNotExist:
        return Response({'error': 'Invalid email or password.'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def logout_view(request):
    request.session.flush()
    return Response({'status': 'logged out'})


@api_view(['GET'])
@ensure_csrf_cookie
@permission_classes([AllowAny])
def me_view(request):
    if 'user_id' not in request.session:
        return Response({'error': 'Not authenticated.'}, status=status.HTTP_401_UNAUTHORIZED)
    try:
        user = User.objects.get(id=request.session['user_id'])
        return Response(UserSerializer(user).data)
    except User.DoesNotExist:
        request.session.flush()
        return Response({'error': 'Session invalid.'}, status=status.HTTP_401_UNAUTHORIZED)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def perform_create(self, serializer):
        last_id = Category.objects.order_by('id').last()
        next_num = int(last_id.id[1:]) + 1 if last_id else 1
        serializer.save(id=f'C{next_num:03d}')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.product_count > 0:
            return Response(
                {'error': f'Cannot delete "{instance.name}". There are {instance.product_count} products assigned to this category.'},
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

    def perform_create(self, serializer):
        last_id = Supplier.objects.order_by('id').last()
        next_num = int(last_id.id[1:]) + 1 if last_id else 1
        serializer.save(id=f'S{next_num:03d}')

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.products_supplied > 0:
            return Response(
                {'error': f'Cannot delete "{instance.company_name}". There are {instance.products_supplied} products linked to this supplier.'},
                status=status.HTTP_409_CONFLICT,
            )
        return super().destroy(request, *args, **kwargs)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(status='active')
    serializer_class = ProductSerializer

    def perform_create(self, serializer):
        last_id = Product.objects.order_by('id').last()
        next_num = int(last_id.id[1:]) + 1 if last_id else 1
        product = serializer.save(id=f'P{next_num:03d}')
        Category.objects.filter(id=product.category_id).update(product_count=F('product_count') + 1)
        Supplier.objects.filter(id=product.supplier_id).update(products_supplied=F('products_supplied') + 1)
        if product.stock > 0:
            from django.utils.timezone import now
            StockLedger.objects.create(
                product=product,
                type='Stock In',
                qty=product.stock,
                balance_after=product.stock,
                user_id='EMP-018',
                tx_id=f'TXN-{now():%Y%m%d%H%M%S%f}',
                notes='Initial stock on product creation',
            )

    def perform_update(self, serializer):
        old = self.get_object()
        old_stock = old.stock
        old_cat_id = old.category_id
        old_sup_id = old.supplier_id

        product = serializer.save()

        if old_cat_id != product.category_id:
            Category.objects.filter(id=old_cat_id).update(product_count=F('product_count') - 1)
            Category.objects.filter(id=product.category_id).update(product_count=F('product_count') + 1)
        if old_sup_id != product.supplier_id:
            Supplier.objects.filter(id=old_sup_id).update(products_supplied=F('products_supplied') - 1)
            Supplier.objects.filter(id=product.supplier_id).update(products_supplied=F('products_supplied') + 1)

        if product.stock != old_stock:
            diff = product.stock - old_stock
            from django.utils.timezone import now
            StockLedger.objects.create(
                product=product,
                type='Stock In' if diff > 0 else 'Stock Out',
                qty=abs(diff),
                balance_after=product.stock,
                user_id='EMP-018',
                tx_id=f'TXN-{now():%Y%m%d%H%M%S%f}',
                notes='Manual adjustment via product edit',
            )

    def perform_destroy(self, instance):
        instance.status = 'archived'
        instance.save(update_fields=['status'])
        Category.objects.filter(id=instance.category_id).update(product_count=F('product_count') - 1)
        Supplier.objects.filter(id=instance.supplier_id).update(products_supplied=F('products_supplied') - 1)

    def get_serializer_class(self):
        if self.action == 'dropdown':
            return ProductDropdownSerializer
        return ProductSerializer

    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        products = self.queryset.only('id', 'sku', 'name', 'stock')
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def archived(self, request):
        archived_qs = Product.objects.filter(status='archived')
        page = self.paginate_queryset(archived_qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(archived_qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def unarchive(self, request, pk=None):
        try:
            product = Product.objects.get(id=pk, status='archived')
        except Product.DoesNotExist:
            return Response({'error': 'Archived product not found.'}, status=404)
        product.status = 'active'
        product.save(update_fields=['status'])
        Category.objects.filter(id=product.category_id).update(product_count=F('product_count') + 1)
        Supplier.objects.filter(id=product.supplier_id).update(products_supplied=F('products_supplied') + 1)
        serializer = self.get_serializer(product)
        return Response(serializer.data)

    @action(detail=True, methods=['delete'])
    def permanent_delete(self, request, pk=None):
        try:
            product = Product.objects.get(id=pk, status='archived')
        except Product.DoesNotExist:
            return Response({'error': 'Archived product not found.'}, status=404)
        cat_id = product.category_id
        sup_id = product.supplier_id
        with transaction.atomic():
            StockLedger.objects.filter(product=product).delete()
            product.delete()
        Category.objects.filter(id=cat_id).update(product_count=F('product_count') - 1)
        Supplier.objects.filter(id=sup_id).update(products_supplied=F('products_supplied') - 1)
        return Response({'status': 'permanently deleted'})


class StockLedgerViewSet(viewsets.ModelViewSet):
    queryset = StockLedger.objects.all()
    serializer_class = StockLedgerSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        product_id = serializer.validated_data['product'].id
        ledger_type = serializer.validated_data['type']
        qty = serializer.validated_data['qty']

        with transaction.atomic():
            product = Product.objects.select_for_update().get(id=product_id)

            if ledger_type == 'Stock In':
                new_stock = product.stock + qty
            elif ledger_type == 'Stock Out':
                if product.stock < qty:
                    return Response(
                        {'error': f'Cannot stock out {qty} units. Current stock is only {product.stock}.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                new_stock = product.stock - qty
            else:
                new_stock = product.stock + qty

            Product.objects.filter(id=product_id).update(stock=new_stock)

            from django.utils.timezone import now
            tx_id = f'TXN-{now():%Y%m%d%H%M%S%f}'
            serializer.save(tx_id=tx_id, balance_after=new_stock)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    @action(detail=True, methods=['put'])
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response({'status': 'marked as read'})

    @action(detail=False, methods=['put'])
    def mark_all_read(self, request):
        updated = Notification.objects.filter(is_read=False).update(is_read=True)
        return Response({'status': f'{updated} notifications marked as read'})

    @action(detail=False, methods=['delete'])
    def clear_all(self, request):
        count = Notification.objects.count()
        Notification.objects.all().delete()
        return Response({'status': f'{count} notifications cleared'})


class BestSellerViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VBestSeller.objects.all()
    serializer_class = BestSellerSerializer
    pagination_class = None


class CategoryBreakdownViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VCategoryBreakdown.objects.all()
    serializer_class = CategoryBreakdownSerializer
    pagination_class = None


class DailySalesChartViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VDailySalesChart.objects.all()
    serializer_class = DailySalesChartSerializer
    pagination_class = None


class InventoryReportViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VInventoryReport.objects.all()
    serializer_class = InventoryReportSerializer
    pagination_class = None


class LowStockAlertViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = VLowStockAlert.objects.all()
    serializer_class = LowStockAlertSerializer
    pagination_class = None
