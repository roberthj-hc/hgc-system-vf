"""Initialize only generated workspace directories for shared container group 0."""

from pathlib import Path
import os

root = Path(__file__).resolve().parents[1]
for relative in (
    "hgc-ml/artifacts",
    "dbt/target-system",
    "dbt/logs-system",
    "dbt/dbt_packages",
):
    directory = root / relative
    directory.mkdir(parents=True, exist_ok=True)
    for path in [directory, *directory.rglob("*")]:
        if not path.is_symlink():
            os.chmod(path, path.stat().st_mode | (0o070 if path.is_dir() else 0o060))

for notebook in (root / "hgc-ml/notebooks").glob("*.ipynb"):
    os.chmod(notebook, notebook.stat().st_mode | 0o060)
