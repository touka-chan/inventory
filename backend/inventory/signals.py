import json
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.utils import timezone

EVENT_MODELS = {'Product', 'Category', 'Supplier', 'StockLedger', 'Notification'}


def get_obj_name(instance):
    for attr in ['name', 'company_name', 'title', 'product_name']:
        val = getattr(instance, attr, None)
        if val:
            return str(val)
    return str(instance)


def broadcast_event(model_name, action, instance):
    channel_layer = get_channel_layer()
    data = {
        'model': model_name,
        'action': action,
        'id': str(instance.pk) if instance and instance.pk else None,
        'name': get_obj_name(instance) if instance else None,
        'timestamp': timezone.now().isoformat(),
    }
    async_to_sync(channel_layer.group_send)(
        'events',
        {'type': 'event_message', 'data': data},
    )


@receiver(post_save)
def model_saved(sender, **kwargs):
    name = sender.__name__
    if name in EVENT_MODELS:
        action = 'created' if kwargs.get('created') else 'updated'
        broadcast_event(name, action, kwargs.get('instance'))


@receiver(post_delete)
def model_deleted(sender, **kwargs):
    name = sender.__name__
    if name in EVENT_MODELS:
        broadcast_event(name, 'deleted', kwargs.get('instance'))
