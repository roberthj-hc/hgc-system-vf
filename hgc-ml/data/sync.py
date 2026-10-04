"""One Snowflake extraction per refresh; transactional publication in Postgres."""
import hashlib
from io import StringIO
from decimal import Decimal
import json
import os
import re
import uuid
from datetime import datetime, timezone

import pandas as pd
import snowflake.connector
from sqlalchemy import text

from core.settings import postgres_engine
from data.contracts import MODELS, validate


def sync():
    database = os.environ['SNOWFLAKE_DATABASE']
    if not re.fullmatch(r'[A-Za-z_][A-Za-z0-9_]*', database):
        raise ValueError('Invalid Snowflake database identifier')
    frames, manifest = {}, {}
    with snowflake.connector.connect(**{
        key: os.environ[f'SNOWFLAKE_{key.upper()}']
        for key in ('account', 'user', 'password', 'role', 'warehouse', 'database')
    }, login_timeout=30, session_parameters={'QUERY_TAG': 'hgc_system_serving'}) as connection:
        for table, (schema, keys) in MODELS.items():
            with connection.cursor() as cursor:
                cursor.execute(f'SELECT * FROM {database}.{schema}.{table}')
                frame = pd.DataFrame(cursor.fetchall(), columns=[c[0].lower() for c in cursor.description])
            for column in frame:
                values = frame[column].dropna()
                if not values.empty and isinstance(values.iloc[0], Decimal):
                    frame[column] = pd.to_numeric(frame[column], errors='raise')
            for column in ('fecha', 'mes_fecha', 'semana'):
                if column in frame:
                    frame[column] = pd.to_datetime(frame[column])
            validate(frame, keys)
            frame = frame.sort_values(keys).reset_index(drop=True)
            frames[table] = frame
            manifest[table] = {'rows': len(frame), 'sha256': hashlib.sha256(
                frame.to_json(date_format='iso').encode()).hexdigest()}
            print(f'Validated {table}: {len(frame)} rows')
    load_id = str(uuid.uuid4())
    engine = postgres_engine()
    with engine.begin() as connection:
        connection.execute(text('CREATE SCHEMA IF NOT EXISTS hgc_analytics'))
        connection.execute(text("SELECT pg_advisory_xact_lock(7264301)"))
        for table, frame in frames.items():
            frame.head(0).to_sql(table, connection, schema='hgc_analytics', if_exists='replace', index=False)
            buffer = StringIO()
            frame.to_csv(buffer, index=False, header=False, na_rep='\\N')
            buffer.seek(0)
            with connection.connection.driver_connection.cursor() as cursor:
                cursor.copy_expert(f"COPY hgc_analytics.{table} FROM STDIN WITH (FORMAT CSV, NULL '\\N')", buffer)
            keys = ', '.join(MODELS[table][1])
            connection.execute(text(f'ALTER TABLE hgc_analytics.{table} ADD PRIMARY KEY ({keys})'))
        connection.execute(text('''CREATE TABLE IF NOT EXISTS hgc_analytics.loads (
            load_id text PRIMARY KEY, loaded_at timestamptz NOT NULL, manifest jsonb NOT NULL)'''))
        connection.execute(text('INSERT INTO hgc_analytics.loads VALUES (:id,:at,CAST(:manifest AS jsonb))'),
                           {'id': load_id, 'at': datetime.now(timezone.utc), 'manifest': json.dumps(manifest)})
    engine.dispose()
    return load_id
