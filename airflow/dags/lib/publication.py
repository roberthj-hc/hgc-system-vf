"""Shared serving validation tasks; no DAG objects at import time."""

import os
from airflow.exceptions import AirflowSkipException


def connection():
    import psycopg2

    return psycopg2.connect(
        host=os.environ["POSTGRES_HOST"],
        port=os.getenv("POSTGRES_PORT", "5432"),
        dbname=os.environ["POSTGRES_DB"],
        user=os.environ["POSTGRES_USER"],
        password=os.environ["POSTGRES_PASSWORD"],
        connect_timeout=15,
    )


def check_snapshot(**context):
    with connection() as database:
        with database.cursor() as cursor:
            cursor.execute(
                "SELECT load_id FROM hgc_analytics.loads ORDER BY loaded_at DESC LIMIT 1"
            )
            row = cursor.fetchone()
            if not row:
                raise ValueError("No validated serving snapshot is available")
            load_id = row[0]
            cursor.execute("SELECT to_regclass('hgc_analytics.releases')")
            if cursor.fetchone()[0]:
                cursor.execute(
                    "SELECT load_id FROM hgc_analytics.releases WHERE active"
                )
                active = cursor.fetchone()
                if (
                    active
                    and active[0] == load_id
                    and not context["params"]["force_retrain"]
                ):
                    raise AirflowSkipException(
                        "Snapshot unchanged; existing release remains active"
                    )
            for name in (
                "sys_customer_features",
                "sys_sales_daily",
                "sys_customer_orders",
                "sys_branch_monthly",
                "sys_product_weekly",
            ):
                cursor.execute(f"SELECT EXISTS (SELECT 1 FROM hgc_analytics.{name})")
                if not cursor.fetchone()[0]:
                    raise ValueError(f"Empty serving table: {name}")
            return load_id


def verify_release(**context):
    expected = context["ti"].xcom_pull(task_ids="check_snapshot")
    with connection() as database:
        with database.cursor() as cursor:
            cursor.execute("""SELECT r.load_id, count(p.module) FROM hgc_analytics.releases r
                JOIN hgc_analytics.reports p USING(release_id) WHERE r.active GROUP BY r.load_id""")
            result = cursor.fetchone()
            if not result or result != (expected, 7):
                raise ValueError(
                    "Publication incomplete or based on a different snapshot"
                )
            cursor.execute("""SELECT COUNT(*) FROM hgc_analytics.customer_predictions p
                JOIN hgc_analytics.releases r USING(release_id) WHERE r.active""")
            if cursor.fetchone()[0] == 0:
                raise ValueError("Customer predictions missing")
