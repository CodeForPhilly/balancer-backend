from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.http import JsonResponse
from bs4 import BeautifulSoup
from nltk.stem import PorterStemmer
import requests
import openai
import tiktoken
import os
import json
from api.views.ai_settings.models import AI_Settings
from api.views.ai_promptStorage.models import AI_PromptStorage
from django.views.decorators.csrf import csrf_exempt
from django.db import transaction, connection
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer
from ...services.tools.tools import tools, execute_tool
from ...services.tools.database import get_database_info


@csrf_exempt
def extract_text(request: str) -> JsonResponse:
    """
    Takes a URL and returns a summary of page's text content.

    Currently only uses the first 3500 tokens.
    """
    openai.api_key = os.environ.get("OPENAI_API_KEY")
    data = json.loads(request.body)
    webpage_url = data["webpage_url"]

    response = requests.get(webpage_url)
    soup = BeautifulSoup(response.text, "html.parser")
    text_contents = soup.find_all("p")
    text_contents = [p.get_text() for p in text_contents]
    text_contents = " ".join(text_contents)

    stemmer = PorterStemmer()
    text_contents = text_contents.split()
    text_contents = [stemmer.stem(word) for word in text_contents]
    text_contents = " ".join(text_contents)

    tokens = get_tokens(text_contents, "cl100k_base")

    ai_response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[
            {
                "role": "system",
                "content": "Give a brief description of this medicine: %s" % tokens,
            }
        ],
        max_tokens=500,
    )

    return JsonResponse({"message": ai_response})


def get_tokens(string: str, encoding_name: str) -> str:
    """Tokenize the first 3500 tokens of a string."""
    encoding = tiktoken.get_encoding(encoding_name)
    tokens = encoding.encode(string)
    tokens = tokens[:3500]
    output_string = encoding.decode(tokens)
    return output_string


class ConversationViewSet(viewsets.ModelViewSet):
    serializer_class = ConversationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Conversation.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        # Add any custom logic here
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def continue_conversation(self, request, pk=None):
        conversation = self.get_object()
        user_message = request.data.get('message')
        page_context = request.data.get('page_context')

        if not user_message:
            return Response({"error": "Message is required"}, status=400)

        # Save user message
        Message.objects.create(conversation=conversation,
                               content=user_message, is_user=True)

        # Get ChatGPT response
        chatgpt_response = self.get_chatgpt_response(
            conversation, user_message, page_context)

        # Save ChatGPT response
        Message.objects.create(conversation=conversation,
                               content=chatgpt_response, is_user=False)

        # Generate or update title if it's the first message or empty
        if conversation.messages.count() <= 2 or not conversation.title:
            conversation.title = self.generate_title(conversation)
            conversation.save()

        return Response({"response": chatgpt_response, "title": conversation.title})

    @action(detail=True, methods=['patch'])
    def update_title(self, request, pk=None):
        conversation = self.get_object()
        new_title = request.data.get('title')

        if not new_title:
            return Response({"error": "New title is required"}, status=status.HTTP_400_BAD_REQUEST)

        conversation.title = new_title
        conversation.save()

        return Response({"status": "Title updated successfully", "title": conversation.title})

    def get_chatgpt_response(self, conversation, user_message, page_context=None):
        messages = [
            {"role": "system", "content": "You are a helpful assistant. Balancer is a powerful tool for selecting bipolar medication for patients. We are open-source and available for free use. Your primary role is to assist users with information related to Balancer and bipolar medication selection. If applicable, use the supplied tools to assist the user."}
        ]

        if page_context:
            context_message = f"If applicable, please use the following content to ask questions. If not applicable, please answer to the best of your ability: {page_context}"
            messages.append({"role": "system", "content": context_message})

        for msg in conversation.messages.all():
            role = "user" if msg.is_user else "assistant"
            messages.append({"role": role, "content": msg.content})

        messages.append({"role": "user", "content": user_message})
        print(tools)

        response = openai.ChatCompletion.create(
            model="gpt-4o",
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )

        response_message = response.choices[0].message
        print(response_message)
        tool_calls = response_message.get('tool_calls', [])
        print(tool_calls)

        all_results = []

        if tool_calls:
            for tool_call in tool_calls:
                tool_call_id = tool_call.get('id')
                tool_function_name = tool_call['function'].get('name')
                tool_arguments = json.loads(tool_call['function'].get('arguments', '{}'))

                # Execute the tool and collect results
                results = execute_tool(tool_function_name, tool_arguments)
                all_results.append(results)
            
            # Combine the tool call results into a single string or structure
            combined_results = "\n".join(all_results)
            return combined_results
        else:
            return response.choices[0].message['content']

    def generate_title(self, conversation):
        # Get the first two messages
        messages = conversation.messages.all()[:2]
        context = "\n".join([msg.content for msg in messages])
        prompt = f"Based on the following conversation, generate a short, descriptive title (max 6 words):\n\n{context}"

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant that generates short, descriptive titles."},
                {"role": "user", "content": prompt}
            ]
        )

        return response.choices[0].message['content'].strip()
