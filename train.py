import torch
import torch.nn as nn
import torchvision.models as models
from torchvision import datasets, transforms
from torch.utils.data import DataLoader
import kagglehub as kgh
import os

dataset_path = kgh.dataset_download("vipooooool/new-plant-diseases-dataset")
dataset_dir = os.path.join(dataset_path, "new plant diseases dataset(augmented)", "New Plant Diseases Dataset(Augmented)")
train_dir = os.path.join(dataset_dir, "train")
valid_dir = os.path.join(dataset_dir, "valid")

train_transform = transforms.Compose([
    transforms.Resize((224,224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485,0.456,0.406], std=[0.229,0.224,0.225])
])
valid_transform = train_transform

train_dataset = datasets.ImageFolder(train_dir, transform=train_transform)
valid_dataset = datasets.ImageFolder(valid_dir, transform=valid_transform)

train_loader = DataLoader(train_dataset, batch_size=32, shuffle=True, num_workers=4)
valid_loader = DataLoader(valid_dataset, batch_size=32, shuffle=False, num_workers=4)

classes = train_dataset.classes
print("Classes:", len(classes))

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print("Using:", device)

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
        self.fc1 = nn.Linear(28*28*128, 512)
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

model = PlantDiseaseCNN().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)

print("Training Custom CNN...")
for epoch in range(15):
    model.train()
    running_loss, correct, total = 0, 0, 0
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)
        predictions = model(images)
        loss = criterion(predictions, labels)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        running_loss += loss.item() * images.size(0)
        correct += (predictions.argmax(1) == labels).sum().item()
        total += labels.size(0)

    model.eval()
    val_correct, val_total = 0, 0
    with torch.no_grad():
        for images, labels in valid_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = model(images)
            val_correct += (outputs.argmax(1) == labels).sum().item()
            val_total += labels.size(0)

    print(f"CNN Epoch {epoch+1}: train_loss={running_loss/total:.4f} train_acc={correct/total:.4f} val_acc={val_correct/val_total:.4f}")

torch.save(model.state_dict(), "plant_disease_cnn.pth")
print("Custom CNN saved.")

resnet = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
for param in resnet.parameters():
    param.requires_grad = False
resnet.fc = nn.Linear(resnet.fc.in_features, 38)
resnet = resnet.to(device)

criterion2 = nn.CrossEntropyLoss()
optimizer2 = torch.optim.Adam(resnet.fc.parameters(), lr=1e-3)

print("Training ResNet18...")
for epoch in range(15):
    resnet.train()
    running_loss, correct, total = 0, 0, 0
    for images, labels in train_loader:
        images, labels = images.to(device), labels.to(device)
        outputs = resnet(images)
        loss = criterion2(outputs, labels)
        optimizer2.zero_grad()
        loss.backward()
        optimizer2.step()
        running_loss += loss.item() * images.size(0)
        correct += (outputs.argmax(1) == labels).sum().item()
        total += labels.size(0)

    resnet.eval()
    val_correct, val_total = 0, 0
    with torch.no_grad():
        for images, labels in valid_loader:
            images, labels = images.to(device), labels.to(device)
            outputs = resnet(images)
            val_correct += (outputs.argmax(1) == labels).sum().item()
            val_total += labels.size(0)

    print(f"ResNet Epoch {epoch+1}: train_loss={running_loss/total:.4f} train_acc={correct/total:.4f} val_acc={val_correct/val_total:.4f}")

torch.save(resnet.state_dict(), "resnet18_plant.pth")
print("ResNet18 saved.")