# Generated by Django 4.2.3 on 2024-07-30 10:19

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_alter_uploadfile_date_of_upload_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='uploadfile',
            name='uploaded_by_email',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name='uploadfile',
            name='uploaded_by',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL),
        ),
    ]
