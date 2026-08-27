# Stage 1: Build the Next.js static frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Python FastAPI + PyTorch AI Inference Backend
FROM python:3.11-slim
WORKDIR /app

# Install PyTorch (CPU) and FastAPI dependencies
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir fastapi uvicorn python-multipart pillow numpy

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/out ./out

# Copy backend application and models
COPY server.py .
COPY resnet18_plant.pth .

# Render assigns dynamic PORT environment variable
ENV PORT=10000
EXPOSE 10000

CMD ["python", "server.py"]
