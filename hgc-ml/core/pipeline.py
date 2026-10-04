"""Train all modules from one repeatable-read snapshot; publish together."""
import json
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
    engine=postgres_engine()
    with engine.connect().execution_options(isolation_level='REPEATABLE READ') as connection:
        with connection.begin():
            load=connection.execute(text('SELECT * FROM hgc_analytics.loads ORDER BY loaded_at DESC LIMIT 1')).mappings().first()
            if not load:
                raise ValueError('Sync a validated serving snapshot before training')
            frames={name:pd.read_sql_table(name,connection,schema='hgc_analytics') for name in
                    ('sys_sales_daily','sys_customer_orders','sys_branch_monthly','sys_product_weekly')}
    setup_tracking()
    sales=train_sales(frames['sys_sales_daily'],load['load_id'])
    reports={'sales':sales,**train_customers(frames['sys_customer_orders'],load['load_id'])}
    reports.update(train_economics(frames['sys_branch_monthly'],frames['sys_product_weekly'],sales,load['load_id']))
    release_id=str(uuid.uuid4())
    published=datetime.now(timezone.utc)
    with engine.begin() as connection:
        connection.execute(text('SELECT pg_advisory_xact_lock(7264302)'))
        connection.execute(text('''CREATE TABLE IF NOT EXISTS hgc_analytics.releases (
            release_id text PRIMARY KEY, load_id text NOT NULL REFERENCES hgc_analytics.loads(load_id),
            published_at timestamptz NOT NULL, active boolean NOT NULL DEFAULT false)'''))
        connection.execute(text('''CREATE UNIQUE INDEX IF NOT EXISTS one_active_release
            ON hgc_analytics.releases(active) WHERE active'''))
        connection.execute(text('''CREATE TABLE IF NOT EXISTS hgc_analytics.reports (
            release_id text REFERENCES hgc_analytics.releases(release_id), module text NOT NULL,
            payload jsonb NOT NULL, PRIMARY KEY(release_id,module))'''))
        connection.execute(text('UPDATE hgc_analytics.releases SET active=false WHERE active'))
        connection.execute(text('INSERT INTO hgc_analytics.releases VALUES (:release,:load,:at,true)'),
            {'release':release_id,'load':load['load_id'],'at':published})
        for name,payload in reports.items():
            payload.update({'release_id':release_id,'load_id':load['load_id'],'source_manifest':load['manifest']})
            # Strict JSON rejects NaN/Infinity before any new release becomes visible.
            serialized=json.dumps(payload,allow_nan=False)
            connection.execute(text('INSERT INTO hgc_analytics.reports VALUES (:release,:module,CAST(:payload AS jsonb))'),
                {'release':release_id,'module':name,'payload':serialized})
    engine.dispose()
    print(f'Published release {release_id}: {list(reports)}')
    return release_id
