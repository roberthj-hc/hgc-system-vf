FROM hgc-system-vf-pipeline:latest
COPY hgc-ml/notebooks/requirements.lock.txt /tmp/notebook-requirements.txt
RUN pip install --no-cache-dir -r /tmp/notebook-requirements.txt
ENV HOME=/tmp
CMD ["python", "scripts/execute_notebooks.py"]
