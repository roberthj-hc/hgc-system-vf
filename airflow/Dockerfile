FROM apache/airflow:2.9.3-python3.12
USER airflow
COPY --chown=airflow:root requirements.lock.txt /opt/airflow/hgc-requirements.lock.txt
# Airflow retains its own dependencies; MLflow/dbt live in a separate interpreter.
RUN python -m venv /opt/airflow/hgc-venv \
    && PIP_USER=false /opt/airflow/hgc-venv/bin/pip install --no-cache-dir -r /opt/airflow/hgc-requirements.lock.txt

USER root
RUN apt-get update && apt-get install -y --no-install-recommends git && rm -rf /var/lib/apt/lists/*
USER airflow
