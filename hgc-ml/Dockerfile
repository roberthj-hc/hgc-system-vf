FROM python:3.12-slim
WORKDIR /workspace
COPY requirements.lock.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
ENV PYTHONPATH=/workspace/hgc-ml PYTHONUNBUFFERED=1
CMD ["python", "hgc-ml/main.py", "train"]
