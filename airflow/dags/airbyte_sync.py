from datetime import datetime

from airflow import DAG
from airflow.providers.airbyte.operators.airbyte import AirbyteTriggerSyncOperator


with DAG(
    dag_id="airbyte_cloud_sync",
    start_date=datetime(2026, 1, 1),
    schedule=None,
    catchup=False,
    tags=["airbyte"],
) as dag:

    trigger_airbyte_sync = AirbyteTriggerSyncOperator(
        task_id="trigger_airbyte_sync",
        airbyte_conn_id="airbyte_cloud",
        connection_id="6058b03d-5460-4128-b1c3-07e097336263",
        api_version="v1",
        api_type="cloud",
        asynchronous=False,
    )
