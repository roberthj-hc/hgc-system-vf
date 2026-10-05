"""Publish immutable releases and indexed customer scores in one transaction."""

import csv
import json
from io import StringIO

from sqlalchemy import text


def publish(connection, reports, release_id, load_id, published, manifest):
    expected = {"sales", "clv", "churn", "profit", "efficiency", "expansion", "margin"}
    if set(reports) != expected or any(
        not report.get("rows") for report in reports.values()
    ):
        raise ValueError("A release requires all seven nonempty modules")
    connection.execute(text("SELECT pg_advisory_xact_lock(7264302)"))
    connection.execute(
        text("""CREATE TABLE IF NOT EXISTS hgc_analytics.releases (
        release_id text PRIMARY KEY, load_id text NOT NULL REFERENCES hgc_analytics.loads(load_id),
        published_at timestamptz NOT NULL, active boolean NOT NULL DEFAULT false)""")
    )
    connection.execute(
        text("""CREATE UNIQUE INDEX IF NOT EXISTS one_active_release
        ON hgc_analytics.releases(active) WHERE active""")
    )
    connection.execute(
        text("""CREATE TABLE IF NOT EXISTS hgc_analytics.reports (
        release_id text REFERENCES hgc_analytics.releases(release_id), module text NOT NULL,
        payload jsonb NOT NULL, PRIMARY KEY(release_id,module))""")
    )
    connection.execute(
        text("""CREATE TABLE IF NOT EXISTS hgc_analytics.customer_predictions (
        release_id text REFERENCES hgc_analytics.releases(release_id), id_cliente bigint NOT NULL,
        id_sucursal bigint NOT NULL, clv double precision NOT NULL CHECK(clv>=0),
        churn double precision NOT NULL CHECK(churn BETWEEN 0 AND 1), payload jsonb NOT NULL,
        PRIMARY KEY(release_id,id_cliente))""")
    )
    for metric in ("clv", "churn"):
        connection.execute(
            text(f"""CREATE INDEX IF NOT EXISTS customer_{metric}_rank
            ON hgc_analytics.customer_predictions(release_id,{metric} DESC,id_cliente)""")
        )
        connection.execute(
            text(f"""CREATE INDEX IF NOT EXISTS customer_branch_{metric}_rank
            ON hgc_analytics.customer_predictions(release_id,id_sucursal,{metric} DESC,id_cliente)""")
        )
    connection.execute(
        text("UPDATE hgc_analytics.releases SET active=false WHERE active")
    )
    connection.execute(
        text("INSERT INTO hgc_analytics.releases VALUES (:release,:load,:at,true)"),
        {"release": release_id, "load": load_id, "at": published},
    )
    customers = reports["clv"]["rows"]
    buffer = StringIO()
    writer = csv.writer(buffer)
    for row in customers:
        writer.writerow(
            [
                release_id,
                row["id_cliente"],
                row["id_sucursal"],
                row["clv"],
                row["churn"],
                json.dumps(row, allow_nan=False),
            ]
        )
    buffer.seek(0)
    with connection.connection.driver_connection.cursor() as cursor:
        cursor.copy_expert(
            "COPY hgc_analytics.customer_predictions FROM STDIN WITH (FORMAT CSV)",
            buffer,
        )
    for name, payload in reports.items():
        if name in ("clv", "churn"):
            payload["branches"] = reports["sales"]["branches"]
            payload["rows"] = []
        payload.update(
            {"release_id": release_id, "load_id": load_id, "source_manifest": manifest}
        )
        serialized = json.dumps(payload, allow_nan=False)
        connection.execute(
            text(
                "INSERT INTO hgc_analytics.reports VALUES (:release,:module,CAST(:payload AS jsonb))"
            ),
            {"release": release_id, "module": name, "payload": serialized},
        )
