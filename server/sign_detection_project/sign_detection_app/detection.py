from django.conf import settings
import tensorflow as tf
from tensorflow.keras.models import load_model
import numpy as np
import os


class ImageDetection:
    def __init__(self):
        self.labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'space', 'space', 'space']
        model_path = os.path.join(settings.BASE_DIR, settings.BASE_DIR, 'src', "models", 'tensorflow_detection_sign' , 'model_fingerspelling_V6.h5')
        print(model_path)
        self.model = load_model(model_path)

    def detection_image(self, image_data):
        image = tf.image.decode_image(image_data, channels=3)
        image = tf.image.resize(image, (64, 64))
        image = tf.expand_dims(image, axis=0)

        predictions = self.model.predict(image)
        predicted_class_index = np.argmax(predictions)
        predicted_class_label = self.labels[predicted_class_index]
        highest_probability = predictions[0, predicted_class_index]

        print(predicted_class_label)
        print(highest_probability)

        return {
            'class_name': predicted_class_label,
            'probability': float(highest_probability)
        }