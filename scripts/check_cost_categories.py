import os
import snowflake.connector
from core.settings import postgres_engine
from sqlalchemy import text
with postgres_engine().connect() as c:
 print('cost_totals',c.execute(text('select sum(costo_op_total),sum(costo_fijo),sum(costo_variable) from hgc_analytics.sys_branch_monthly')).fetchone())
with snowflake.connector.connect(**{k:os.environ['SNOWFLAKE_'+k.upper()] for k in ['account','user','password','role','warehouse','database']},login_timeout=30) as c:
 with c.cursor() as cur:
  cur.execute('select categoria,subcategoria,count(*),sum(monto) from HGC_DWH.BRONZE_MARIADB.COSTOS_OPERATIVOS group by 1,2'); print(cur.fetchall())
