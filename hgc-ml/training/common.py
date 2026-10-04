"""MLflow lineage and consistent report contracts."""
import json
import hashlib
import subprocess
from datetime import datetime, timezone

import mlflow
import numpy as np
import pandas as pd
from mlflow.models import infer_signature

from core.settings import ROOT, tracking_uri


def setup_tracking():
    mlflow.set_tracking_uri(tracking_uri())
    client = mlflow.MlflowClient()
    if client.get_experiment_by_name('hgc-system') is None:
        client.create_experiment('hgc-system', artifact_location=(ROOT / 'hgc-ml/artifacts/mlruns').as_uri())
    mlflow.set_experiment('hgc-system')


def track(name, model, inputs, predictions, metrics, params, load_id):
    with mlflow.start_run(run_name=name) as run:
        try:
            revision = subprocess.run(['git', 'rev-parse', 'HEAD'], cwd=ROOT, capture_output=True, text=True).stdout.strip()
        except FileNotFoundError:
            revision = 'unavailable'
        source = hashlib.sha256()
        for folder, pattern in [('hgc-ml', '*.py'), ('dbt/models/system', '*.sql'), ('dbt/models/intermediate', '*.sql')]:
            for path in sorted((ROOT/folder).rglob(pattern)):
                source.update(str(path.relative_to(ROOT)).encode())
                source.update(path.read_bytes())
        mlflow.set_tags({'load_id': load_id, 'git_revision': revision, 'source_sha256': source.hexdigest(), 'scope': 'system-only'})
        mlflow.log_params(params)
        mlflow.log_metrics({k: float(v) for k, v in metrics.items() if np.isfinite(v)})
        mlflow.sklearn.log_model(model, name='model', input_example=inputs.head(3),
            signature=infer_signature(inputs, predictions), registered_model_name=f'hgc_{name}',
            serialization_format='cloudpickle', code_paths=[str(ROOT/'hgc-ml/training')])
        return run.info.run_id


def records(frame):
    return json.loads(frame.to_json(orient='records', date_format='iso'))


def report(title, description, rows, kpis, model=None, **extra):
    return {'title': title, 'description': description, 'rows': rows, 'kpis': kpis,
            'model': model, 'generated_at': datetime.now(timezone.utc).isoformat(), **extra}


def kpi(label, value, unit='number'):
    return {'label': label, 'value': float(value), 'unit': unit}
