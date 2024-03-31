# Generated by Django 4.2.3 on 2024-03-31 00:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_ai_settings_settingslabel'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='ai_settings',
            name='SettingGUID',
        ),
        migrations.RemoveField(
            model_name='ai_settings',
            name='settingsLabel',
        ),
        migrations.AddField(
            model_name='ai_settings',
            name='SourceTableGUID',
            field=models.CharField(max_length=255, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='ai_settings',
            name='SettingsLabel',
            field=models.CharField(max_length=255, null=True),
        ),
    ]