import uuid
from django.contrib.auth.models import User
from django.db import models


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    unique_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
