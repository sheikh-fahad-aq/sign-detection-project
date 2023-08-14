from django.conf import settings
import tensorflow as tf
from tensorflow.keras.models import load_model
import numpy as np
import os
from cvzone.HandTrackingModule import HandDetector
import cv2
from PIL import Image
from io import BytesIO
import base64

class ImageDetection:
    def __init__(self):
        self.labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'space', 'space', 'space']
        model_path = os.path.join(settings.BASE_DIR, settings.BASE_DIR, 'src', "models", 'tensorflow_detection_sign' , 'model_fingerspelling_V6.h5')
        print(model_path)
        self.model = load_model(model_path)
        self.detector = HandDetector(detectionCon=0.8, maxHands=2)
        self.status = False
        self.predicted_class_label = None
        self.highest_probability = 0
        self.image = None

    @tf.function(reduce_retracing=True)
    def detection_image(self, image_data):

        image_bytes = bytes(image_data)
        # Convert bytes to a numpy array
        image_np_array = np.frombuffer(image_bytes, np.uint8)

        # Decode the image using cv2.imdecode()
        image_cv2 = cv2.imdecode(image_np_array, cv2.IMREAD_COLOR)
        hands, img = self.detector.findHands(image_cv2, draw=True)

        if len(hands) == 1:
            hand1 = hands[0]
            lmList1 = hand1["lmList"]  # List of 21 Landmark points
            bbox1 = hand1["bbox"]  # Bounding box info x,y,w,h
            x, y, w, h = bbox1
    
            # Crop the image using the bounding box coordinates
            cropped_hand = img[y:y+h, x:x+w]
            
            clone = cropped_hand.copy()
            clone_resized = cv2.resize(clone, (64,64))
            img_array=clone_resized/255
            image = np.expand_dims(img_array, axis=0) 

            predictions = self.model.predict(image)
            predicted_class_index = np.argmax(predictions)
            predicted_class_label = self.labels[predicted_class_index]
            highest_probability = predictions[0, predicted_class_index]

            self.status = True
            self.predicted_class_label = predicted_class_label
            self.highest_probability = float(highest_probability)
            self.image = self.np_to_base_image(cropped_hand)
           
        return {
                'class_name': self.predicted_class_label,
                'probability': self.highest_probability,
                'image': self.image,
                'status' : self.status
            }
    
    def np_to_base_image(self, image_array):
        pil_image = Image.fromarray(image_array)
        image_bytes = BytesIO()
        pil_image.save(image_bytes, format="PNG")
        image_bytes = image_bytes.getvalue()
        
        # Ensure there's no leading or trailing whitespace in the base64-encoded string
        base64_encoded = base64.b64encode(image_bytes).decode("utf-8").strip()
        
        return base64_encoded
