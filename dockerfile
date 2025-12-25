FROM python:3.9-slim

WORKDIR /app

# Kütüphaneleri yükle
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kodları kopyala
COPY . .

# Flask portu
EXPOSE 5000

CMD ["python", "app.py"]