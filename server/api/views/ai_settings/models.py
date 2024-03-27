from django.conf import settings
from django.db import models
import uuid


class AI_Settings(models.Model):
    guid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    SettingGUID = models.CharField(max_length=255, unique=True)
    SettingValue = models.TextField()
    SourceTable = models.TextField()
    LastModified = models.DateTimeField(auto_now=True)
    ModifiedByUser = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='settings_modified')

    def __str__(self):
        return self.SettingGUID

    class Meta:
        verbose_name_plural = "AI_settings"