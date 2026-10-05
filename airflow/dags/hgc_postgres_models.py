"""PostgreSQL-only orchestration. Snowflake extraction stays in the external CLI.

A fresh validated serving load triggers training; unchanged loads are skipped.
No Snowflake/Airbyte operators, Redis, Celery or remote calls at DAG parse time.
"""

from datetime import timedelta

import pendulum
from airflow import DAG
from airflow.models.param import Param
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator


from lib.publication import check_snapshot, verify_release


with DAG(
    dag_id="hgc_postgres_models",
    description="Validate PostgreSQL serving, train versioned models and verify the atomic release",
    start_date=pendulum.datetime(2026, 10, 4, tz="America/La_Paz"),
    schedule="0 5 * * *",
    catchup=False,
    max_active_runs=1,
    max_active_tasks=1,
    default_args={
        "owner": "hgc-data",
        "retries": 1,
        "retry_delay": timedelta(minutes=5),
        "pool": "hgc_pipeline",
    },
    dagrun_timeout=timedelta(hours=1),
    params={"force_retrain": Param(False, type="boolean")},
    tags=["hgc", "postgres", "mlflow"],
) as dag:
    check = PythonOperator(
        task_id="check_snapshot",
        python_callable=check_snapshot,
        execution_timeout=timedelta(minutes=2),
    )
    train = BashOperator(
        task_id="train_and_publish",
        bash_command="/opt/airflow/hgc-venv/bin/python /workspace/hgc-ml/main.py train",
        env={"HGC_EXPECTED_LOAD_ID": "{{ ti.xcom_pull(task_ids='check_snapshot') }}"},
        append_env=True,
        execution_timeout=timedelta(minutes=40),
    )
    verify = PythonOperator(
        task_id="verify_release",
        python_callable=verify_release,
        execution_timeout=timedelta(minutes=2),
    )
    check >> train >> verify
