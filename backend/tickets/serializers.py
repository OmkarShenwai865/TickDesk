from rest_framework import serializers
from .models import Ticket, TicketAttachment, TicketComment, TicketActivity, TicketNote


class TicketSerializer(serializers.ModelSerializer):
    created_by_name  = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    department_name  = serializers.SerializerMethodField()
    status_display   = serializers.CharField(source='get_status_display',   read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)

    class Meta:
        model  = Ticket
        fields = [
            'id', 'ticket_number', 'title', 'description',
            'priority', 'priority_display',
            'status',   'status_display',
            'created_by',  'created_by_name',
            'assigned_to', 'assigned_to_name',
            'department',  'department_name',
            'created_at',  'updated_at',
        ]
        read_only_fields = ['id', 'ticket_number', 'created_at', 'updated_at']

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return None

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None

    def get_department_name(self, obj):
        return obj.department.name if obj.department else None


class TicketAttachmentSerializer(serializers.ModelSerializer):
    uploaded_by_name = serializers.SerializerMethodField()
    file_url         = serializers.SerializerMethodField()

    class Meta:
        model  = TicketAttachment
        fields = [
            'id', 'original_name', 'file_size', 'file_url',
            'uploaded_by', 'uploaded_by_name', 'uploaded_at',
        ]
        read_only_fields = ['id', 'original_name', 'file_size', 'uploaded_at']

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return obj.uploaded_by.get_full_name() or obj.uploaded_by.username
        return None

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class TicketCommentSerializer(serializers.ModelSerializer):
    author_name     = serializers.SerializerMethodField()
    author_initials = serializers.SerializerMethodField()
    file_url        = serializers.SerializerMethodField()

    class Meta:
        model  = TicketComment
        fields = ['id', 'text', 'author', 'author_name', 'author_initials',
                  'file_url', 'original_name', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return "Unknown"

    def get_author_initials(self, obj):
        name = self.get_author_name(obj)
        parts = name.split()
        return "".join(p[0] for p in parts[:2]).upper() if parts else "?"

    def get_file_url(self, obj):
        if not obj.file:
            return None
        request = self.context.get('request')
        return request.build_absolute_uri(obj.file.url) if request else obj.file.url


class TicketActivitySerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()

    class Meta:
        model  = TicketActivity
        fields = ['id', 'action', 'actor', 'actor_name', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_actor_name(self, obj):
        if obj.actor:
            return obj.actor.get_full_name() or obj.actor.username
        return "System"


class TicketNoteSerializer(serializers.ModelSerializer):
    author_name     = serializers.SerializerMethodField()
    author_initials = serializers.SerializerMethodField()

    class Meta:
        model  = TicketNote
        fields = ['id', 'text', 'author', 'author_name', 'author_initials', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_author_name(self, obj):
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return "Unknown"

    def get_author_initials(self, obj):
        name  = self.get_author_name(obj)
        parts = name.split()
        return "".join(p[0] for p in parts[:2]).upper() if parts else "?"
