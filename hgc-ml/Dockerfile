FROM python:3.12-slim
WORKDIR /workspace
COPY requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt
ENV PYTHONPATH=/workspace/hgc-ml PYTHONUNBUFFERED=1
CMD ["python", "hgc-ml/main.py", "train"]
