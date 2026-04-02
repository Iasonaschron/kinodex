FROM python:3.11-slim
WORKDIR /app

# Install CPU-only torch first to avoid pulling the multi-GB GPU build
RUN pip install --no-cache-dir \
    torch==2.2.2+cpu \
    --extra-index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY service.py .

EXPOSE 5001
CMD ["python", "service.py"]
