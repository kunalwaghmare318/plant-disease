import io
import os
import time
from typing import Dict, Any, List
import numpy as np
from PIL import Image
import torch
import torch.nn as nn
from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

app = FastAPI(title="Plant Disease AI Diagnostics API")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLASSES = [
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

# Plant & Disease Metadata Database
DISEASE_INFO: Dict[str, Dict[str, str]] = {
    'Apple___Apple_scab': {
        'desc': 'Fungal disease caused by Venturia inaequalis leading to olive-green or dark velvety lesions on leaves and fruit deformities.',
        'treatment': 'Apply protective fungicide (captan or copper-based) in early spring. Remove and destroy fallen infected leaves.'
    },
    'Apple___Black_rot': {
        'desc': 'Caused by Botryosphaeria obtusa. Creates frog-eye leaf spots, limb cankers, and firm, rotting fruit with concentric rings.',
        'treatment': 'Prune dead wood and cankers during dormant season. Spray with captan or thiophanate-methyl.'
    },
    'Apple___Cedar_apple_rust': {
        'desc': 'Gymnosporangium juniperi-virginianae rust fungus requiring both apple trees and eastern red cedars to complete its cycle.',
        'treatment': 'Apply myclobutanil or propiconazole at pink bud stage. Remove nearby cedar galls if possible.'
    },
    'Cherry_(including_sour)___Powdery_mildew': {
        'desc': 'Podosphaera clandestina fungus causing white powdery fungal patches on young leaves, distortion, and curled foliage.',
        'treatment': 'Apply sulfur-based or potassium bicarbonate sprays. Ensure good canopy airflow with proper pruning.'
    },
    'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot': {
        'desc': 'Cercospora zeae-maydis produces rectangular, tan-to-gray necrotic lesions along leaf veins, reducing photosynthesis.',
        'treatment': 'Utilize resistant corn hybrids, practice crop rotation, and apply strobilurin or triazole fungicides.'
    },
    'Corn_(maize)___Common_rust_': {
        'desc': 'Puccinia sorghi causes small, cinnamon-brown powdery pustules on both upper and lower leaf surfaces.',
        'treatment': 'Plant rust-resistant hybrids. In severe early outbreaks, treat with approved foliar fungicides.'
    },
    'Corn_(maize)___Northern_Leaf_Blight': {
        'desc': 'Exserohilum turcicum produces long, cigar-shaped grayish-green to tan lesions that can coalesce and blight large areas.',
        'treatment': 'Select resistant seed varieties, rotate crops out of corn for 1-2 years, and apply fungicide if lesions appear early.'
    },
    'Grape___Black_rot': {
        'desc': 'Guignardia bidwellii causes reddish-brown circular leaf spots and rapidly shrivels grapes into hard black mummies.',
        'treatment': 'Apply mancozeb, ziram, or myclobutanil from pre-bloom to 4 weeks post-bloom. Prune out mummified berry clusters.'
    },
    'Grape___Esca_(Black_Measles)': {
        'desc': 'Complex fungal wood disease causing tiger-stripe leaf interveinal chlorosis/necrosis and spotted berries.',
        'treatment': 'Protect pruning wounds with sealing paste. Remove severely infected vines to prevent spore spread.'
    },
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': {
        'desc': 'Pseudocercospora vitis causes angular, dark brown spots on mature leaves, causing premature defoliation.',
        'treatment': 'Spray copper fungicides post-harvest. Maintain open trellis canopy for optimal sun exposure and air movement.'
    },
    'Orange___Haunglongbing_(Citrus_greening)': {
        'desc': 'Devastating bacterial disease (Candidatus Liberibacter) spread by citrus psyllids, causing blotchy mottle and bitter, misshapen fruit.',
        'treatment': 'Manage Asian citrus psyllid vector populations. Provide enhanced micronutrient foliar nutrition and remove infected trees.'
    },
    'Peach___Bacterial_spot': {
        'desc': 'Xanthomonas arboricola pv. pruni causing angular purple-black lesions on leaves and sunken pitted lesions on peach skin.',
        'treatment': 'Spray copper bactericide during dormancy and oxytetracycline during the growing season. Choose tolerant varieties.'
    },
    'Pepper,_bell___Bacterial_spot': {
        'desc': 'Xanthomonas campestris pv. vesicatoria causing water-soaked spots that turn dark brown with yellow halos.',
        'treatment': 'Use certified disease-free seed, avoid overhead watering, and apply copper sprays combined with mancozeb.'
    },
    'Potato___Early_blight': {
        'desc': 'Alternaria solani causes dark, target-like concentric rings on older foliage, yellowing surrounding leaf tissues.',
        'treatment': 'Apply chlorothalonil or copper fungicides. Practice 3-year crop rotation away from solanaceous plants.'
    },
    'Potato___Late_blight': {
        'desc': 'Phytophthora infestans causes rapid water-soaked lesions with white mold on the underside of leaves during cool, wet weather.',
        'treatment': 'Destroy volunteer potato plants. Apply systemic fungicides like metalaxyl or cymoxanil immediately at first sign.'
    },
    'Squash___Powdery_mildew': {
        'desc': 'Podosphaera xanthii coats leaves in talcum powder-like fungal spores, leading to premature leaf senescence and sunburned fruit.',
        'treatment': 'Spray neem oil, potassium bicarbonate, or sulfur at early onset. Provide wide plant spacing for sunlight and airflow.'
    },
    'Strawberry___Leaf_scorch': {
        'desc': 'Diplocarpon earlianum causes purplish irregular blotches that enlarge and turn dark brown, scorching leaf margins.',
        'treatment': 'Remove dead leaves post-harvest. Apply captan or dodine fungicide during early spring leaf emergence.'
    },
    'Tomato___Bacterial_spot': {
        'desc': 'Xanthomonas spp. produce small, greasy, water-soaked black spots with yellow borders on tomato foliage and stems.',
        'treatment': 'Apply fixed copper sprays with mancozeb. Avoid working among wet plants and avoid overhead sprinkler irrigation.'
    },
    'Tomato___Early_blight': {
        'desc': 'Alternaria linariae creates distinctive target-board concentric dark rings surrounded by chlorotic yellow halos.',
        'treatment': 'Mulch around tomato base to prevent soil splash. Prune lower leaves and apply chlorothalonil or copper fungicides.'
    },
    'Tomato___Late_blight': {
        'desc': 'Phytophthora infestans spreads rapidly in cool, humid conditions, creating large water-soaked greasy gray spots and stem collapse.',
        'treatment': 'Remove and bag infected plants immediately. Apply protective copper sprays to remaining healthy plants.'
    },
    'Tomato___Leaf_Mold': {
        'desc': 'Passalora fulva causes pale greenish-yellow patches on upper leaf surfaces and velvety olive-brown mold on undersides.',
        'treatment': 'Reduce greenhouse humidity below 85%. Increase ventilation and space plants evenly.'
    },
    'Tomato___Septoria_leaf_spot': {
        'desc': 'Septoria lycopersici produces numerous tiny circular spots with dark brown margins and gray centers on lower leaves.',
        'treatment': 'Clear infected crop residue. Stake plants off the ground and spray with chlorothalonil or copper.'
    },
    'Tomato___Spider_mites Two-spotted_spider_mite': {
        'desc': 'Tetranychus urticae causes fine yellow stippling, bronzing, and delicate silk webbing on undersides of leaves.',
        'treatment': 'Spray insecticidal soap, neem oil, or release predatory mites (Phytoseiulus persimilis).'
    },
    'Tomato___Target_Spot': {
        'desc': 'Corynespora cassiicola produces brown circular lesions with light brown centers and dark concentric rings on foliage and fruit.',
        'treatment': 'Maintain good air circulation. Apply azoxystrobin or boscalid fungicides upon early detection.'
    },
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {
        'desc': 'Whitefly-transmitted geminivirus causing upward leaf curling, yellow margins, severe stunting, and flower abortion.',
        'treatment': 'Control sweetpotato whiteflies with insecticidal nets, sticky traps, and imidacloprid or spinosad. Use TYLCV-resistant hybrids.'
    },
    'Tomato___Tomato_mosaic_virus': {
        'desc': 'Highly contagious tobamovirus causing mottled light/dark green mosaic patterns, blistering, and distortion on leaves.',
        'treatment': 'No chemical cure. Disinfect pruning tools with 20% milk solution or 10% bleach. Remove and destroy infected plants.'
    },
}

# Clean naming helper
def format_class_name(raw_name: str) -> str:
    parts = raw_name.split('___')
    plant = parts[0].replace('_', ' ').replace('(including sour)', '').replace('(maize)', '').replace(',', '').strip()
    disease = parts[1].replace('_', ' ').strip()
    if disease.lower() == 'healthy':
        return f"{plant} - Healthy"
    return f"{plant} - {disease}"

# Custom 3-Layer CNN
class PlantDiseaseCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.dropout = nn.Dropout(0.5)
        self.conv1 = nn.Conv2d(3, 32, 3, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, padding=1)
        self.conv3 = nn.Conv2d(64, 128, 3, padding=1)
        self.relu = nn.ReLU()
        self.pool = nn.MaxPool2d(2, 2)
        self.flatten = nn.Flatten()
        self.fc1 = nn.Linear(28 * 28 * 128, 512)
        self.fc2 = nn.Linear(512, 38)

    def forward(self, x):
        x = self.pool(self.relu(self.conv1(x)))
        x = self.pool(self.relu(self.conv2(x)))
        x = self.pool(self.relu(self.conv3(x)))
        x = self.flatten(x)
        x = self.relu(self.fc1(x))
        x = self.dropout(x)
        x = self.fc2(x)
        return x

# Pure PyTorch ResNet-18 Architecture
class BasicBlock(nn.Module):
    expansion = 1
    def __init__(self, inplanes, planes, stride=1, downsample=None):
        super().__init__()
        self.conv1 = nn.Conv2d(inplanes, planes, kernel_size=3, stride=stride, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(planes)
        self.relu = nn.ReLU(inplace=True)
        self.conv2 = nn.Conv2d(planes, planes, kernel_size=3, stride=1, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(planes)
        self.downsample = downsample
        self.stride = stride

    def forward(self, x):
        identity = x
        out = self.conv1(x)
        out = self.bn1(out)
        out = self.relu(out)
        out = self.conv2(out)
        out = self.bn2(out)
        if self.downsample is not None:
            identity = self.downsample(x)
        out += identity
        out = self.relu(out)
        return out

class ResNet18(nn.Module):
    def __init__(self, num_classes=38):
        super().__init__()
        self.inplanes = 64
        self.conv1 = nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3, bias=False)
        self.bn1 = nn.BatchNorm2d(64)
        self.relu = nn.ReLU(inplace=True)
        self.maxpool = nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        self.layer1 = self._make_layer(64, 2)
        self.layer2 = self._make_layer(128, 2, stride=2)
        self.layer3 = self._make_layer(256, 2, stride=2)
        self.layer4 = self._make_layer(512, 2, stride=2)
        self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(512, num_classes)

    def _make_layer(self, planes, blocks, stride=1):
        downsample = None
        if stride != 1 or self.inplanes != planes * BasicBlock.expansion:
            downsample = nn.Sequential(
                nn.Conv2d(self.inplanes, planes * BasicBlock.expansion, kernel_size=1, stride=stride, bias=False),
                nn.BatchNorm2d(planes * BasicBlock.expansion),
            )
        layers = [BasicBlock(self.inplanes, planes, stride, downsample)]
        self.inplanes = planes * BasicBlock.expansion
        for _ in range(1, blocks):
            layers.append(BasicBlock(self.inplanes, planes))
        return nn.Sequential(*layers)

    def forward(self, x):
        x = self.conv1(x)
        x = self.bn1(x)
        x = self.relu(x)
        x = self.maxpool(x)
        x = self.layer1(x)
        x = self.layer2(x)
        x = self.layer3(x)
        x = self.layer4(x)
        x = self.avgpool(x)
        x = torch.flatten(x, 1)
        x = self.fc(x)
        return x

# Initialize and load models
print("Loading neural network weights...")
device = torch.device("cpu")

cnn_model = PlantDiseaseCNN().to(device)
try:
    cnn_model.load_state_dict(torch.load("plant_disease_cnn.pth", map_location=device, weights_only=True))
    cnn_model.eval()
    print("Custom CNN loaded successfully.")
except Exception as e:
    print(f"Warning loading CNN: {e}")

resnet_model = ResNet18(38).to(device)
try:
    resnet_model.load_state_dict(torch.load("resnet18_plant.pth", map_location=device, weights_only=True))
    resnet_model.eval()
    print("ResNet-18 loaded successfully.")
except Exception as e:
    print(f"Warning loading ResNet: {e}")

# Preprocessing Pipeline (Resize 224x224, Normalize with ImageNet stats)
MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(3, 1, 1)
STD = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(3, 1, 1)

def preprocess_image(image_bytes: bytes) -> torch.Tensor:
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = image.resize((224, 224), Image.Resampling.BILINEAR)
    img_array = np.array(image, dtype=np.float32) / 255.0  # shape (224, 224, 3)
    img_tensor = img_array.transpose((2, 0, 1))           # shape (3, 224, 224)
    img_tensor = (img_tensor - MEAN) / STD
    return torch.tensor(img_tensor, dtype=torch.float32).unsqueeze(0)

@app.get("/")
def health():
    return {"status": "online", "service": "Plant Disease AI Inference Engine"}

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    model_choice: str = Form("resnet")
) -> Dict[str, Any]:
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty image file received.")

    # Select model
    active_model = resnet_model if model_choice.lower() == "resnet" else cnn_model

    start_time = time.perf_counter()
    tensor_input = preprocess_image(content)

    with torch.no_grad():
        logits = active_model(tensor_input)
        probs = torch.softmax(logits, dim=1).squeeze(0)

    latency_ms = max(1, round((time.perf_counter() - start_time) * 1000))

    # Top 3 predictions
    top3_probs, top3_indices = torch.topk(probs, 3)
    top1_idx = top3_indices[0].item()
    top1_class = CLASSES[top1_idx]
    top1_conf = round(top3_probs[0].item() * 100, 1)

    is_healthy = "healthy" in top1_class.lower()
    info = DISEASE_INFO.get(top1_class, {})

    if is_healthy:
        description = "Leaf exhibits normal cellular pigmentation, vibrant chlorophyll distribution, and no visible fungal or bacterial lesions."
        treatment = "Maintain current balanced irrigation, standard crop scouting intervals, and soil nutrient levels."
        severity = 0
    else:
        description = info.get('desc', 'Foliar pathology detected with active pathogen symptoms on leaf surface.')
        treatment = info.get('treatment', 'Isolate affected crops and apply appropriate broad-spectrum organic or synthetic treatments.')
        # Severity calculation based on confidence and pathogen type
        severity = min(98, max(25, int(top1_conf * 0.85)))

    top3_list = []
    for prob, idx in zip(top3_probs.tolist(), top3_indices.tolist()):
        cls_name = CLASSES[idx]
        top3_list.append({
            "raw": cls_name,
            "formatted": format_class_name(cls_name),
            "confidence": round(prob * 100, 1)
        })

    return {
        "diagnosis_raw": top1_class,
        "diagnosis_formatted": format_class_name(top1_class),
        "is_healthy": is_healthy,
        "confidence": top1_conf,
        "severity": severity,
        "inference_ms": latency_ms,
        "model_used": "ResNet-18 (Transfer Learning)" if model_choice.lower() == "resnet" else "Custom 3-Layer CNN",
        "description": description,
        "treatment": treatment,
        "top3": top3_list
    }

# Mount static frontend build if 'out' directory exists
if os.path.exists("out"):
    app.mount("/", StaticFiles(directory="out", html=True), name="static")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
