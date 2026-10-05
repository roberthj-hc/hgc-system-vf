# Evidencia de validación — 4 de octubre de 2026 (America/La_Paz)

- dbt SYSTEM: 36 operaciones completadas, 20 tests, cero errores. Exclusión explícita de `models/marts`.
- Airflow `hgc_end_to_end`: ejecución `manual__2026-10-05T03:48:47.059509+00:00` finalizada en `success`. Se omitió Airbyte con `ingest_mongodb=false`; se ejecutaron build, serving, entrenamiento y publicación reales.
- Cuatro notebooks ejecutados, 14 celdas de código, sin errores; entrenamientos y artefactos registrados en MLflow.
- Python: siete tests aprobados, incluido rollback real después de una violación de integridad durante COPY. Persisten avisos de deprecación de NumPy/pandas en el helper temporal de tests.
- Backend: cuatro tests aprobados. Prueba HTTP: siete reportes con una publicación común, JWT/RBAC, filtros, paginación, simuladores, inferencia de los siete módulos, horizonte dinámico y rechazo de entradas inválidas.
- Frontend: typecheck, lint de componentes analíticos y compilación de producción aprobados. No se efectuó revisión visual en el navegador en esta continuación, según lo solicitado.
- Sin cambios en los archivos del chat ni en `dbt/models/marts` respecto al inicio de esta continuación.

La publicación validada contiene 118.498 clientes. La selección temporal prefirió la media poblacional para CLV (RMSE de prueba 143,75 BOB) y la tasa poblacional para inactividad (Brier 0,17247; AUC 0,5). Esto no proporciona ranking individual validado; se expone claramente en la interfaz. Ventas usa referencia estacional entrenada (MAE de ingresos diarios 2.335,91 BOB); costos usa Ridge (MAE 1.277,75 BOB); precio log-log tiene MAE 54,33 unidades.

**Pendiente externo:** la sincronización real Airbyte Cloud MongoDB no se considera validada hasta actualizar las credenciales que respondieron HTTP 401 y ejecutar ese paso. El usuario indicó que las actualizaría. El DAG está preparado para comprobar origen MongoDB y destino Snowflake antes de crear un job.
