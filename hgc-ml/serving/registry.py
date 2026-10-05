"""Load only the exact MLflow artifact referenced by an active release."""

from functools import lru_cache
import mlflow
from sqlalchemy import text
from core.settings import postgres_engine, tracking_uri

ENGINE = postgres_engine()


def report(module, release_id=None):
    with ENGINE.connect() as connection:
        row = connection.execute(
            text("""SELECT p.payload FROM hgc_analytics.reports p
            JOIN hgc_analytics.releases r USING(release_id) WHERE ((:release IS NULL AND r.active) OR r.release_id=:release) AND p.module=:module"""),
            {"module": module, "release": release_id},
        ).scalar_one_or_none()
    if row is None:
        raise ValueError("No hay una publicaciÃ³n validada para este mÃ³dulo")
    return row


@lru_cache(maxsize=8)
def model(run_id):
    mlflow.set_tracking_uri(tracking_uri())
    client = mlflow.MlflowClient()
    uri = client.get_run(run_id).data.tags.get("model_uri")
    if not uri:
        versions = client.search_model_versions(f"run_id = '{run_id}'")
        if not versions:
            raise ValueError("El artefacto de esta publicaciÃ³n no estÃ¡ disponible")
        uri = versions[0].source
    return mlflow.sklearn.load_model(uri)


def customer(release_id, customer_id):
    with ENGINE.connect() as connection:
        value = connection.execute(
            text("""SELECT payload FROM hgc_analytics.customer_predictions
            WHERE release_id=:release AND id_cliente=:customer"""),
            {"release": release_id, "customer": customer_id},
        ).scalar_one_or_none()
    if value is None:
        raise ValueError("Cliente no disponible en esta publicaciÃ³n")
    return value
