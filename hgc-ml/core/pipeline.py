"""Train all modules from one repeatable-read snapshot; publish together."""

import os
import uuid
from datetime import datetime, timezone

import pandas as pd
from sqlalchemy import text

from core.settings import postgres_engine
from training.common import setup_tracking
from training.sales import train_sales
from training.customers import train_customers
from training.economics import train_economics


def train_all():
    engine = postgres_engine()
    with engine.connect().execution_options(
        isolation_level="REPEATABLE READ"
    ) as connection:
        with connection.begin():
            load = (
                connection.execute(
                    text(
                        "SELECT * FROM hgc_analytics.loads ORDER BY loaded_at DESC LIMIT 1"
                    )
                )
                .mappings()
                .first()
            )
            if not load:
                raise ValueError("Sync a validated serving snapshot before training")
            if (
                os.getenv("HGC_EXPECTED_LOAD_ID")
                and load["load_id"] != os.environ["HGC_EXPECTED_LOAD_ID"]
            ):
                raise ValueError(
                    "Serving changed after orchestration preflight; retry the DAG"
                )
            frames = {
                name: pd.read_sql_table(name, connection, schema="hgc_analytics")
                for name in (
                    "sys_sales_daily",
                    "sys_customer_features",
                    "sys_branch_monthly",
                    "sys_product_weekly",
                )
            }
    setup_tracking()
    sales = train_sales(frames["sys_sales_daily"], load["load_id"])
    reports = {
        "sales": sales,
        **train_customers(frames["sys_customer_features"], load["load_id"]),
    }
    reports.update(
        train_economics(
            frames["sys_branch_monthly"],
            frames["sys_product_weekly"],
            sales,
            load["load_id"],
        )
    )
    release_id = str(uuid.uuid4())
    published = datetime.now(timezone.utc)
    from data.publish import publish

    with engine.begin() as connection:
        publish(
            connection,
            reports,
            release_id,
            load["load_id"],
            published,
            load["manifest"],
        )
    engine.dispose()
    print(f"Published release {release_id}: {list(reports)}")
    return release_id
