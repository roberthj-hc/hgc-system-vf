"""Airbyte MongoDB -> Snowflake bronze -> dbt SYSTEM -> PostgreSQL -> MLflow.

Only the MongoDB connection is triggered. All other bronze sources are reused.
LocalExecutor uses PostgreSQL metadata; no Redis/Celery or Docker socket.
"""

from datetime import timedelta
import pendulum
from airflow import DAG
from airflow.models.param import Param
from airflow.operators.python import BranchPythonOperator, PythonOperator
from airflow.operators.bash import BashOperator
from airflow.sensors.python import PythonSensor
from airflow.utils.trigger_rule import TriggerRule
from lib.airbyte import sync_mongodb, job_complete
from lib.publication import check_snapshot, verify_release

PYTHON = "/opt/airflow/hgc-venv/bin/python"
CLI = f"{PYTHON} /workspace/hgc-ml/main.py"


def ingestion_path(**context):
    return "sync_mongodb" if context["params"]["ingest_mongodb"] else "build_system"


with DAG(
    "hgc_end_to_end",
    start_date=pendulum.datetime(2026, 10, 4, tz="America/La_Paz"),
    schedule=None,
    catchup=False,
    max_active_runs=1,
    max_active_tasks=1,
    default_args={
        "owner": "hgc-data",
        "retries": 1,
        "retry_delay": timedelta(minutes=3),
        "pool": "hgc_pipeline",
    },
    dagrun_timeout=timedelta(hours=3),
    tags=["hgc", "mongodb", "snowflake", "dbt", "postgres", "mlflow"],
    params={
        "ingest_mongodb": Param(True, type="boolean"),
        "force_retrain": Param(True, type="boolean"),
    },
) as dag:
    choose = BranchPythonOperator(
        task_id="select_ingestion", python_callable=ingestion_path
    )
    # POST is not retried automatically: a timeout can leave an already-created job.
    ingest = PythonOperator(
        task_id="sync_mongodb", python_callable=sync_mongodb, retries=0
    )
    wait = PythonSensor(
        task_id="wait_mongodb",
        python_callable=job_complete,
        mode="reschedule",
        poke_interval=60,
        timeout=7200,
    )
    build = BashOperator(
        task_id="build_system",
        bash_command=f"{CLI} build",
        trigger_rule=TriggerRule.NONE_FAILED_MIN_ONE_SUCCESS,
        execution_timeout=timedelta(minutes=20),
    )
    load = BashOperator(
        task_id="load_serving",
        bash_command=f"{CLI} sync",
        execution_timeout=timedelta(minutes=20),
    )
    check = PythonOperator(task_id="check_snapshot", python_callable=check_snapshot)
    train = BashOperator(
        task_id="train_and_publish",
        bash_command=f"{CLI} train",
        env={"HGC_EXPECTED_LOAD_ID": "{{ ti.xcom_pull(task_ids='check_snapshot') }}"},
        append_env=True,
        execution_timeout=timedelta(minutes=40),
    )
    verify = PythonOperator(task_id="verify_release", python_callable=verify_release)
    choose >> [ingest, build]
    ingest >> wait >> build >> load >> check >> train >> verify
