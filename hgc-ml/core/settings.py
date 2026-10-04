"""Configuration shared by batch jobs; secrets never enter model artifacts."""
import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import URL, create_engine

ROOT = Path(__file__).resolve().parents[2]
for location in (ROOT / 'hgc-ml/.env', ROOT / 'hgc-back/.env', ROOT / 'dbt/.env'):
    load_dotenv(location, override=False)


def postgres_engine():
    return create_engine(URL.create(
        'postgresql+psycopg2', username=os.environ['POSTGRES_USER'],
        password=os.environ['POSTGRES_PASSWORD'], host=os.environ['POSTGRES_HOST'],
        port=int(os.getenv('POSTGRES_PORT', '5432')), database=os.environ['POSTGRES_DB'],
    ), pool_pre_ping=True, connect_args={'connect_timeout': 15})


def tracking_uri():
    location = ROOT / 'hgc-ml/artifacts'
    location.mkdir(exist_ok=True)
    return os.getenv('MLFLOW_TRACKING_URI', 'sqlite:///' + (location / 'mlflow.db').as_posix())
