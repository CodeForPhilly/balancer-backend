# Generated by Django 4.2.3 on 2024-07-25 19:46

from django.db import migrations, models


class Migration(migrations.Migration):

    replaces = [('api', '0004_feedback'), ('api', '0005_feedback_email_feedback_message_feedback_name_and_more')]

    dependencies = [
        ('api', '0003_alter_uploadfile_date_of_upload_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Feedback',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('feedbacktype', models.CharField(choices=[('issue', 'Issue'), ('new_feature', 'New Feature'), ('general', 'General')], default='general', max_length=100)),
                ('email', models.EmailField(default='', max_length=254)),
                ('message', models.TextField(default='')),
                ('name', models.CharField(default='', max_length=100)),
            ],
        ),
    ]
