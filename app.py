# app.py
from flask import Flask, render_template, request, jsonify
import tensorflow as tf
import numpy as np
import cv2
import io
from PIL import Image

app = Flask(__name__)

# Load the model
MODEL_PATH = 'trained_model.keras'
model = tf.keras.models.load_model(MODEL_PATH)

# Define class names exactly as in training
CLASS_NAMES = [
    'Apple___Apple_scab',
    'Apple___Black_rot',
    'Apple___Cedar_apple_rust',
    'Apple___healthy',
    'Blueberry___healthy',
    'Cherry_(including_sour)___Powdery_mildew',
    'Cherry_(including_sour)___healthy',
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot',
    'Corn_(maize)___Common_rust_',
    'Corn_(maize)___Northern_Leaf_Blight',
    'Corn_(maize)___healthy',
    'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)',
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
    'Grape___healthy',
    'Orange___Haunglongbing_(Citrus_greening)',
    'Peach___Bacterial_spot',
    'Peach___healthy',
    'Pepper,_bell___Bacterial_spot',
    'Pepper,_bell___healthy',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy',
    'Raspberry___healthy',
    'Soybean___healthy',
    'Squash___Powdery_mildew',
    'Strawberry___Leaf_scorch',
    'Strawberry___healthy',
    'Tomato___Bacterial_spot',
    'Tomato___Early_blight',
    'Tomato___Late_blight',
    'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
]

def preprocess_image(image_bytes):
    # Convert bytes to numpy array
    nparr = np.frombuffer(image_bytes, np.uint8)
    # Decode image
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    # Convert BGR to RGB
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    # Resize image
    img = cv2.resize(img, (128, 128))
    # Convert to float32 and normalize
    img = img.astype(np.float32)
    # Add batch dimension
    img = np.expand_dims(img, axis=0)
    
    return img

@app.route('/')
def home():
    return render_template('index.html', classes=CLASS_NAMES)

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get the image from the POST request
        file = request.files['file']
        image_bytes = file.read()
        
        # Preprocess the image
        processed_image = preprocess_image(image_bytes)
        
        # Make prediction
        predictions = model.predict(processed_image)
        
        # Get the predicted class index and confidence
        predicted_class_index = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class_index])
        
        # Get the class name
        predicted_class = CLASS_NAMES[predicted_class_index]
        
        # Get top 3 predictions for display
        top_3_indices = np.argsort(predictions[0])[-3:][::-1]
        top_3_predictions = [
            {
                'class': CLASS_NAMES[idx],
                'confidence': float(predictions[0][idx])
            }
            for idx in top_3_indices
        ]
        
        return jsonify({
            'success': True,
            'prediction': predicted_class,
            'confidence': confidence,
            'top_3': top_3_predictions
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        })

if __name__ == '__main__':
    app.run(debug=True)