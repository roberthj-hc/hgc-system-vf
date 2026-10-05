# Operación reproducible

Ejecutar desde la raíz. Python 3.12 y las versiones de `requirements.lock.txt` son el entorno batch de referencia. En este equipo se usa Docker porque la política de Windows bloquea DLL del venv local. El venv existente se conserva.

## Preparación

1. Completar `hgc-back/.env`, `dbt/.env`, `hgc-front/.env` y `airflow/.env` según los ejemplos. PostgreSQL de serving debe ser accesible desde `host.docker.internal` para los contenedores.
2. Construir: `docker compose -f compose.analytics.yml build`.
3. Preparar permisos de artefactos compartidos: `docker compose -f compose.analytics.yml run --rm --user 0 pipeline python scripts/prepare_runtime.py`.
4. Actualizar datos y modelos: `docker compose -f compose.analytics.yml run --rm pipeline python hgc-ml/main.py refresh`.
5. Levantar MLflow e inferencia: `docker compose -f compose.analytics.yml up -d mlflow inference`.
6. Backend: `npm ci` y `npm start` dentro de `hgc-back`. Frontend: `npm ci` y `npm run dev` dentro de `hgc-front` (o `npm run build` y `npm start` para producción).

`build`, `sync` y `train` pueden ejecutarse por separado con la misma CLI. No lanzar cargas/entrenamientos paralelos por fuera de la orquestación. Conservar copias de PostgreSQL y de `hgc-ml/artifacts` juntos: SQLite contiene el tracking local y los directorios contienen los modelos. MLflow está configurado para un despliegue local de un solo host; para varios hosts se requiere un almacén de artefactos compartido y backend remoto.

## Airflow

```sh
docker compose -f airflow/docker-compose.yml up -d --build
docker exec airflow-scheduler airflow pools set hgc_pipeline 1 "Publicacion analitica serial"
docker exec airflow-scheduler airflow dags list-import-errors
```

- `hgc_end_to_end`: ejecución manual. Valida que la conexión Airbyte sea MongoDB → Snowflake, dispara y espera el job; luego dbt, carga PostgreSQL, entrenamiento MLflow, publicación y verificación. `ingest_mongodb=false` reutiliza bronze y omite explícitamente Airbyte. No se disparan otras fuentes.
- `hgc_postgres_models`: calendario 05:00 America/La_Paz; consume únicamente el serving PostgreSQL. Omite cargas ya publicadas salvo `force_retrain=true`. El calendario quedó habilitado en este entorno; en una instalación nueva se habilita desde Airflow.
- Ambos usan el pool `hgc_pipeline` de una plaza. Los DAGs nuevos se crean pausados. dbt y MLflow tienen un venv aislado de las dependencias de Airflow.

Configurar `airbyte_cloud` con OAuth: login = client ID, password = client secret; o `AIRBYTE_CLIENT_ID` / `AIRBYTE_CLIENT_SECRET` en `airflow/.env`. Configurar `AIRBYTE_MONGODB_CONNECTION_ID` para la conexión MongoDB. Tras cambiar `.env`, recrear los servicios con `docker compose -f airflow/docker-compose.yml up -d --no-build`. Un 401 significa que la ingesta cloud no se ha validado; no implica que la extracción de bronze existente haya fallado. El POST de creación de job no se reintenta automáticamente para evitar duplicados tras un timeout ambiguo.

Prueba completa con bronze existente:

```sh
docker exec airflow-scheduler python /opt/airflow/dags/lib/verify_pipeline.py
```

## Notebooks y pruebas

En el entorno batch instalar `hgc-ml/notebooks/requirements.lock.txt` (entorno completo fijado; `requirements.txt` declara las dependencias directas) y ejecutar `python scripts/execute_notebooks.py`. También se puede ejecutar `docker compose -f compose.analytics.yml --profile research build notebooks` y luego `docker compose -f compose.analytics.yml --profile research run --rm notebooks`. El ejecutor conserva resultados en los cuatro notebooks y falla ante cualquier celda con error. Ejecutar secuencialmente: el dataset de clientes requiere memoria. Los notebooks no publican scores experimentales.

```sh
docker compose -f compose.analytics.yml run --rm -e HGC_INTEGRATION=1 pipeline python -m pytest -q
node --test hgc-back/tests/*.test.js
node scripts/verify_system.cjs
```

Frontend: `npm run typecheck`, `npx eslint components/analytics lib/analytics` y `npm run build` dentro de `hgc-front`. La prueba HTTP comprueba permisos, paginación, consistencia de publicación, simuladores y carga/inferencia real de los siete módulos. La prueba de publicación verifica rollback ante datos inválidos.

## Recuperación

Si falla extracción o validación, el serving anterior se conserva. Si falla entrenamiento/publicación, la publicación activa sigue disponible. Revisar el task fallido, corregir su causa y reintentar. No borrar artefactos de runs que pertenezcan a publicaciones conservadas. Los modelos experimentales de notebooks no cambian la selección de serving: esta siempre usa el run de la publicación.
