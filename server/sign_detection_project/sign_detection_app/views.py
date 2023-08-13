from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .detection import ImageDetection
import json
import base64

@csrf_exempt
def detection_image(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            detection = ImageDetection()
            image_data = base64.b64decode(data["image"].split(',')[1])
            result = detection.detection_image(image_data)
            return JsonResponse(result)
        except Exception as e:
            print(e)
            return JsonResponse({'error': str(e)}, status=400)
    else:
        return JsonResponse({'error': 'Invalid request method'}, status=405)