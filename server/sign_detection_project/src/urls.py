from django.urls import path
from sign_detection_app.views import detection_image

urlpatterns = [
    path('detection_image/', detection_image, name='detection_image'),
]