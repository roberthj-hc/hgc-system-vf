"""Small Airbyte Cloud client. Credentials stay in Airflow Connections or env."""

import os
import requests
from airflow.hooks.base import BaseHook
from airflow.exceptions import AirflowException

BASE = "https://api.airbyte.com/v1"


def headers():
    connection = BaseHook.get_connection("airbyte_cloud")
    client_id = os.getenv("AIRBYTE_CLIENT_ID") or connection.login
    secret = os.getenv("AIRBYTE_CLIENT_SECRET") or (
        connection.password if client_id else None
    )
    if client_id and secret:
        response = requests.post(
            BASE + "/applications/token",
            json={"client_id": client_id, "client_secret": secret},
            timeout=30,
        )
        if not response.ok:
            raise AirflowException(
                f"Airbyte token request failed: HTTP {response.status_code}"
            )
        token = response.json()["access_token"]
    else:
        token = (
            connection.extra_dejson.get("Authorization") or connection.password or ""
        )
        token = token.removeprefix("Bearer ")
    return {"Authorization": f"Bearer {token}", "Accept": "application/json"}


def request(method, path, body=None):
    response = requests.request(
        method, BASE + path, headers=headers(), json=body, timeout=30
    )
    if not response.ok:
        raise AirflowException(
            f"Airbyte {method} {path.split('/')[1]} failed: HTTP {response.status_code}; review airbyte_cloud credentials"
        )
    return response.json()


def sync_mongodb():
    connection_id = os.getenv(
        "AIRBYTE_MONGODB_CONNECTION_ID", "6058b03d-5460-4128-b1c3-07e097336263"
    )
    connection = request("GET", f"/connections/{connection_id}")
    source = request("GET", f"/sources/{connection['sourceId']}")
    destination = request("GET", f"/destinations/{connection['destinationId']}")
    if "mongo" not in source.get("sourceType", "").lower():
        raise AirflowException("Refusing sync: the configured source is not MongoDB")
    if "snowflake" not in destination.get("destinationType", "").lower():
        raise AirflowException(
            "Refusing sync: the configured destination is not Snowflake"
        )
    result = request(
        "POST", "/jobs", {"connectionId": connection_id, "jobType": "sync"}
    )
    return result["jobId"]


def job_complete(**context):
    job_id = context["ti"].xcom_pull(task_ids="sync_mongodb")
    status = request("GET", f"/jobs/{job_id}")["status"]
    if status in ("failed", "cancelled", "incomplete"):
        raise AirflowException(f"Airbyte MongoDB job ended with status {status}")
    return status == "succeeded"
