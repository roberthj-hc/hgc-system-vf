"""PostgreSQL-only orchestration. Snowflake extraction stays in the external CLI.

A fresh validated serving load triggers training; unchanged loads are skipped.
No Snowflake/Airbyte operators, Redis, Celery or remote calls at DAG parse time.
"""
from datetime import timedelta
import os

import pendulum
from airflow import DAG
from airflow.exceptions import AirflowSkipException
from airflow.models.param import Param
from airflow.operators.bash import BashOperator
from airflow.operators.python import PythonOperator


def connection():
    import psycopg2
    return psycopg2.connect(host=os.environ['POSTGRES_HOST'],port=os.getenv('POSTGRES_PORT','5432'),
        dbname=os.environ['POSTGRES_DB'],user=os.environ['POSTGRES_USER'],
        password=os.environ['POSTGRES_PASSWORD'],connect_timeout=15)


def check_snapshot(**context):
    with connection() as database:
        with database.cursor() as cursor:
            cursor.execute('SELECT load_id FROM hgc_analytics.loads ORDER BY loaded_at DESC LIMIT 1')
            row=cursor.fetchone()
            if not row:
                raise ValueError('No validated serving snapshot is available')
            load_id=row[0]
            cursor.execute("SELECT to_regclass('hgc_analytics.releases')")
            if cursor.fetchone()[0]:
                cursor.execute('SELECT load_id FROM hgc_analytics.releases WHERE active')
                active=cursor.fetchone()
                if active and active[0]==load_id and not context['params']['force_retrain']:
                    raise AirflowSkipException('Snapshot unchanged; existing release remains active')
            for name in ('sys_sales_daily','sys_customer_orders','sys_branch_monthly','sys_product_weekly'):
                cursor.execute(f'SELECT EXISTS (SELECT 1 FROM hgc_analytics.{name})')
                if not cursor.fetchone()[0]:
                    raise ValueError(f'Empty serving table: {name}')
            return load_id


def verify_release(**context):
    expected=context['ti'].xcom_pull(task_ids='check_snapshot')
    with connection() as database:
        with database.cursor() as cursor:
            cursor.execute('''SELECT r.load_id, count(p.module) FROM hgc_analytics.releases r
                JOIN hgc_analytics.reports p USING(release_id) WHERE r.active GROUP BY r.load_id''')
            result=cursor.fetchone()
            if not result or result!=(expected,7):
                raise ValueError('Publication incomplete or based on a different snapshot')
            cursor.execute('''SELECT COUNT(*) FROM hgc_analytics.customer_predictions p
                JOIN hgc_analytics.releases r USING(release_id) WHERE r.active''')
            if cursor.fetchone()[0]==0:
                raise ValueError('Customer predictions missing')


with DAG(
    dag_id='hgc_postgres_models',
    description='Validate PostgreSQL serving, train versioned models and verify the atomic release',
    start_date=pendulum.datetime(2026,10,4,tz='America/La_Paz'),
    schedule='0 5 * * *',catchup=False,max_active_runs=1,max_active_tasks=1,
    default_args={'owner':'hgc-data','retries':1,'retry_delay':timedelta(minutes=5)},
    dagrun_timeout=timedelta(hours=1),
    params={'force_retrain':Param(False,type='boolean')},
    tags=['hgc','postgres','mlflow'],
) as dag:
    check=PythonOperator(task_id='check_snapshot',python_callable=check_snapshot,execution_timeout=timedelta(minutes=2))
    train=BashOperator(task_id='train_and_publish',
        bash_command='/opt/airflow/hgc-venv/bin/python /workspace/hgc-ml/main.py train',
        env={'HGC_EXPECTED_LOAD_ID':"{{ ti.xcom_pull(task_ids='check_snapshot') }}"},append_env=True,
        execution_timeout=timedelta(minutes=40))
    verify=PythonOperator(task_id='verify_release',python_callable=verify_release,execution_timeout=timedelta(minutes=2))
    check >> train >> verify
