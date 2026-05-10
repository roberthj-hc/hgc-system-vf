import os
import pandas as pd
import snowflake.connector

from dotenv import load_dotenv
from sqlalchemy import create_engine

# Variables de entorno
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
ENV_PATH = os.path.join(BASE_DIR, ".env")

load_dotenv(ENV_PATH)

# PostgreSQL
POSTGRES_URL = (
    f"postgresql+psycopg2://"
    f"{os.getenv('POSTGRES_USER')}:"
    f"{os.getenv('POSTGRES_PASSWORD')}@"
    f"{os.getenv('POSTGRES_HOST')}:"
    f"{os.getenv('POSTGRES_PORT')}/"
    f"{os.getenv('POSTGRES_DB')}"
)

# Tablas con schema incluido
TABLES_TO_IMPORT = [
    "FEATURES.INT_VENTAS_DIARIAS_SUCURSAL",
    "FEATURES.FEAT_TS_DESC__G_REGIONAL",
    "FEATURES.FEAT_TS_DIAG__G_REGIONAL",
    "FEATURES.FEAT_TS_PRED__G_REGIONAL",
    "ECONOMETRICS.ECO_COSTOS_EFICIENCIA__CFO",
    "ECONOMETRICS.ECO_ELASTICIDAD_PRECIO_DEMANDA__CFO",
    "ECONOMETRICS.INT_COSTOS_INGRESOS_MES",
    "ECONOMETRICS.INT_VENTAS_PRODUCTO_SEMANA",
]


def run_transfer():
    print("INICIANDO ETL SNOWFLAKE → POSTGRES")

    print("Conectando a Snowflake...")
    sf_conn = snowflake.connector.connect(
        user=os.getenv("SNOWFLAKE_USER"),
        password=os.getenv("SNOWFLAKE_PASSWORD"),
        account=os.getenv("SNOWFLAKE_ACCOUNT"),
        warehouse=os.getenv("SNOWFLAKE_WAREHOUSE"),
        database="HGC_DW",
    )
    print("Conexión Snowflake OK\n")

    print("Conectando a PostgreSQL...")
    engine = create_engine(POSTGRES_URL)
    print("Conexión PostgreSQL OK\n")

    for full_table in TABLES_TO_IMPORT:
        try:
            schema, table_name = full_table.split(".")

            print(f"Procesando: {schema}.{table_name}")

            query = f"""
            SELECT *
            FROM HGC_DW.{schema}.{table_name}
            """

            print("Extrayendo datos desde Snowflake...")
            df = pd.read_sql(query, sf_conn)

            print(f"Filas obtenidas: {len(df)}")

            df.columns = [col.lower() for col in df.columns]

            target_table = table_name.lower()

            print("Cargando datos a PostgreSQL...")

            df.to_sql(
                name=target_table,
                con=engine,
                if_exists="replace",
                index=False,
                method="multi",
                chunksize=5000
            )

            print(f"Tabla {schema}.{table_name} cargada correctamente\n")

        except Exception as e:
            print(f"ERROR en tabla {full_table}")
            print(str(e))
            print("\n")

    sf_conn.close()
    print("Extracción finalizada")


run_transfer()