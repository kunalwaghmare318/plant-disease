FROM python:3.11-slim

WORKDIR /app

# Install CPU-optimized PyTorch and dependencies
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir fastapi uvicorn python-multipart pillow numpy

# Copy models and application code
COPY server.py .
COPY plant_disease_cnn.pth .
COPY resnet18_plant.pth .

# Hugging Face default port
ENV PORT=7860
EXPOSE 7860

CMD ["python", "server.py"]
