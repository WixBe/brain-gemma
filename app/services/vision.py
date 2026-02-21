import os
import torch
import torch.nn as nn
import numpy as np
import tensorflow as tf
from PIL import Image
from torchvision import transforms
from langchain_core.tools import tool
import warnings

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'
warnings.filterwarnings('ignore')

# Root directory of the project ensures we can find models relative to this script
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

class TumorClassifierTool:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.class_names = ['glioma', 'meningioma', 'notumor', 'pituitary']
        
        self.infer_tf = None
        self.model_pt = None
        
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
        ])
    
    def load_models(self):
        if self.infer_tf is not None and self.model_pt is not None:
            return 
            
        print("Loading Tools: Path Foundation (TensorFlow) & Head (PyTorch)...")
        tf_model_path = os.path.join(BASE_DIR, "path_foundation_model")
        tf_model = tf.saved_model.load(tf_model_path)
        self.infer_tf = tf_model.signatures["serving_default"]

        self.model_pt = nn.Sequential(
            nn.Linear(384, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, 4)
        )
        pt_model_path = os.path.join(BASE_DIR, "brain_tumor_path_foundation_head.pth")
        self.model_pt.load_state_dict(torch.load(pt_model_path, map_location=self.device))
        self.model_pt = self.model_pt.to(self.device)
        self.model_pt.eval()
        
    def analyze_scan(self, image_path: str) -> str:
        if self.infer_tf is None or self.model_pt is None:
            self.load_models()
            
        try:
            image = Image.open(image_path).convert('RGB')
        except Exception as e:
            return f"Error opening image at {image_path}: {e}"

        image_tensor = self.transform(image).unsqueeze(0)
        images_np = image_tensor.permute(0, 2, 3, 1).numpy()
        tf_images = tf.constant(images_np, dtype=tf.float32)
        
        with tf.device('/CPU:0'):
            outputs = self.infer_tf(tf_images)
            
        features_np = list(outputs.values())[0].numpy()
        features_pt = torch.tensor(features_np).to(self.device)
        
        with torch.no_grad():
            logits = self.model_pt(features_pt)
            probabilities = torch.softmax(logits, dim=1)[0]
            
        probs_dict = {self.class_names[i]: float(probabilities[i]) * 100 for i in range(len(self.class_names))}
        sorted_probs = sorted(probs_dict.items(), key=lambda item: item[1], reverse=True)
        
        prediction = sorted_probs[0][0].upper()
        confidence = sorted_probs[0][1]
        
        result = f"Primary Diagnosis: {prediction} (Confidence: {confidence:.2f}%)\nDifferential Probabilities:\n"
        for cls_name, prob in sorted_probs:
            if cls_name == "notumor":
                result += f"- NO TUMOR DETECTED: {prob:.2f}%\n"
            else:
                result += f"- {cls_name.upper()}: {prob:.2f}%\n"
                
        return result

classifier_instance = TumorClassifierTool()

@tool
def analyze_brain_scan(image_path: str) -> str:
    """Useful when you need to analyze a brain scan image to detect tumors like glioma, meningioma, or pituitary. 
    Accepts the absolute path to the local image file."""
    return classifier_instance.analyze_scan(image_path)
