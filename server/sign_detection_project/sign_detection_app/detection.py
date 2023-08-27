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
        self.labels =  {'A':0,'B':1,'C':2,'D':3,'E':4,'F':5,'G':6,'H':7,'I':8,'J':9,'K':10,'L':11,'M':12,
                    'N':13,'O':14,'P':15,'Q':16,'R':17,'S':18,'T':19,'U':20,'V':21,'W':22,'X':23,'Y':24,
                    'Z':25,'space':26,'del':27,'nothing':28}
        model_path = os.path.join(settings.BASE_DIR, settings.BASE_DIR, 'src', "models", 'tensorflow_detection_sign' , 'model_2.h5')
        self.model = load_model(model_path)
        self.detector = HandDetector(detectionCon=0.8, maxHands=2)
        self.status = False
        self.predicted_class_label = None
        self.highest_probability = 0
        self.image = None

    def detection_image(self, image_data):

        image_bytes = bytes(image_data)
        # Convert bytes to a numpy array
        image_np_array = np.frombuffer(image_bytes, np.uint8)
        # Decode the image using cv2.imdecode()
        image_cv2 = cv2.imdecode(image_np_array, cv2.IMREAD_COLOR)
        image_data = image_cv2.copy()
        hands, img = self.detector.findHands(image_data, draw=True)

        if len(hands) == 1:
            hand1 = hands[0]
            lmList1 = hand1["lmList"]  # List of 21 Landmark points
            bbox1 = hand1["bbox"]  # Bounding box info x,y,w,h
            x, y, w, h = bbox1
            # Crop the image using the bounding box coordinates
            cropped_hand = image_cv2[y-20:y+h+20, x-20:x+w+20]
            cropped_hand_copy = cropped_hand.copy()

            image = self.load_image(cropped_hand_copy)
            image = cv2.resize(image, (224, 224))  # Resize to match the expected input shape

            image = np.reshape(image, (1,) + image.shape)

            # make predictions on an image and append it to the list (predictions).
            predicted_class_index = np.argmax(self.model.predict(image), axis=1)
     
            # Now you have the predicted class label
            if len(predicted_class_index) > 0:
                predicted_class_label = self.find_keys_by_value(self.labels,predicted_class_index[0])
                self.status = True
                self.predicted_class_label = predicted_class_label
                self.highest_probability = float(100.00)
                self.image = self.np_to_base_image(cropped_hand)

           
        return {
                'class_name': self.predicted_class_label,
                'probability': self.highest_probability,
                'image': self.image,
                'status' : self.status
            }
    
    def np_to_base_image(self, image_array):
        _, buffer = cv2.imencode('.jpg', image_array)
        # Convert the image buffer to a base64 encoded string
        base64_image = base64.b64encode(buffer).decode('utf-8').strip()

        return base64_image

    def find_keys_by_value(self,dictionary, value):
        keys_with_value = []
        for key, val in dictionary.items():
            if val == value:
                keys_with_value.append(key)
        return keys_with_value

    def load_image(self,image):
        images = []
        names = []
        size = 64,64
        temp = cv2.resize(image, size)
        images.append(temp)
        images = np.array(images)
        images = images.astype('float32')/255.0
        return images[0]
