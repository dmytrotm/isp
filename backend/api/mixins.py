from django.core.exceptions import ValidationError
from rest_framework import serializers
from django.apps import apps

class ContextAwareModelMixin:
    """Mixin that provides context awareness for models with status fields"""
    
    @classmethod
    def get_context_name(cls):
        """Get context name based on model name, override if needed"""
        return cls.__name__
    
    def clean(self):
        """Validate status belongs to the expected context"""
        super().clean()
        
        if hasattr(self, 'status') and self.status:
            context_name = self.get_context_name()
            Status = apps.get_model('api', 'Status')
            valid_statuses = Status.get_statuses_by_context(context_name)
            
            if not valid_statuses.filter(id=self.status.id).exists():
                raise ValidationError({
                    'status': f"Status must be from the '{context_name}' context."
                })
    
    def save(self, *args, **kwargs):
        """Ensure clean is called on save"""
        self.full_clean()
        return super().save(*args, **kwargs)


class ContextAwareSerializerMixin:
    """Mixin for serializers to validate status context"""
    
    def get_model_context_name(self):
        """Get context name from the model"""
        model_class = self.Meta.model
        if hasattr(model_class, 'get_context_name'):
            return model_class.get_context_name()
        return model_class.__name__
        
    def validate_status(self, status):
        """Validate status field"""
        from django.apps import apps
        Status = apps.get_model('api', 'Status')
        
        context_name = self.get_model_context_name()
        valid_statuses = Status.get_statuses_by_context(context_name)
        
        if not valid_statuses.filter(id=status.id).exists():
            raise serializers.ValidationError(
                f"Invalid status for {context_name}. Status must be from the '{context_name}' context."
            )
        return status