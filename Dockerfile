FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

# Install backend deps
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend/ ./backend/

# Copy built frontend
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

# Serve frontend from FastAPI
RUN pip install --no-cache-dir aiofiles

# Create data dir
RUN mkdir -p /app/data/reports

WORKDIR /app/backend
EXPOSE 3000 5001

CMD ["python", "run.py"]
