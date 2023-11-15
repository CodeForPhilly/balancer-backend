"""
URL configuration for balancer project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/4.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from balancer.controllers import chatgpt, jira, listDrugs, risk

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/chatgpt/extract_text/", chatgpt.extract_text, name="post_web_text"),
    path("api/chatgpt/diagnosis/", chatgpt.diagnosis, name="post_diagnosis"),
    path("api/chatgpt/chat", chatgpt.chatgpt, name="chatgpt"),
    path("api/chatgpt/list_drugs", listDrugs.medication, name="listDrugs"),
    path("api/chatgpt/risk", risk.medication, name="risk"),
    path("api/jira/create_new_feedback/", jira.create_new_feedback, name="create_new_feedback"),
    path("api/jira/upload_servicedesk_attachment/", jira.upload_servicedesk_attachment, name="upload_servicedesk_attachment"),
    path("api/jira/attach_feedback_attachment/", jira.attach_feedback_attachment, name="attach_feedback_attachment"),
]