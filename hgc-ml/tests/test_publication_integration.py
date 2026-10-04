"""Opt-in transaction test against the configured serving database."""
import os
import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy import text

from core.settings import postgres_engine
from data.publish import publish


@pytest.mark.skipif(os.getenv('HGC_INTEGRATION')!='1',reason='requires configured PostgreSQL')
def test_failed_publication_preserves_active_release():
    engine=postgres_engine()
    with engine.connect() as connection:
        active=connection.execute(text('SELECT release_id,load_id FROM hgc_analytics.releases WHERE active')).one()
    reports={'sales':{'branches':[]},'clv':{'rows':[{'id_cliente':-1,'id_sucursal':1,'clv':-1,'churn':.5}]}}
    with pytest.raises(Exception):
        with engine.begin() as connection:
            publish(connection,reports,str(uuid.uuid4()),active.load_id,datetime.now(timezone.utc),{})
    with engine.connect() as connection:
        assert connection.execute(text('SELECT release_id FROM hgc_analytics.releases WHERE active')).scalar_one()==active.release_id
    engine.dispose()
