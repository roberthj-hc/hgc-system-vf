"""Read-only connectivity and aggregate bronze checks; never prints credentials."""
import os
import snowflake.connector
from core.settings import postgres_engine
from sqlalchemy import text

with postgres_engine().connect() as c:
    print('Postgres reachable:', c.execute(text('select 1')).scalar())
with snowflake.connector.connect(**{k:os.environ['SNOWFLAKE_'+k.upper()] for k in
    ['account','user','password','role','warehouse','database']}, login_timeout=30) as c:
    for sql in [
        'select id_estado,nombre from HGC_DWH.BRONZE_POSTGRESQL.ESTADO_PEDIDO',
        'select min(fecha_hora),max(fecha_hora),count(*),count(distinct id_cliente) from HGC_DWH.BRONZE_POSTGRESQL.PEDIDOS',
    ]:
        with c.cursor() as cur:
            cur.execute(sql)
            print(cur.fetchall())
