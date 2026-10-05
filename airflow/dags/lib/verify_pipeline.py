"""Manual smoke test against existing bronze; cloud ingestion is explicitly skipped."""
if __name__ == "__main__":
    from airflow.models import DagBag
    dag = DagBag("/opt/airflow/dags").get_dag("hgc_end_to_end")
    for task in dag.tasks:
        task.retries = 0
    result = dag.test(run_conf={"ingest_mongodb": False, "force_retrain": True})
    if result.state != "success":
        raise SystemExit("Pipeline validation failed")
