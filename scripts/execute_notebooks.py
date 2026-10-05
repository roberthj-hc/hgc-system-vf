"""Execute maintained notebooks sequentially; fail on any cell error."""

from pathlib import Path
import nbformat
from nbclient import NotebookClient

root = Path(__file__).resolve().parents[1]
for path in sorted((root / "hgc-ml/notebooks").glob("*.ipynb")):
    notebook = nbformat.read(path, as_version=4)
    NotebookClient(
        notebook,
        timeout=1800,
        kernel_name="python3",
        resources={"metadata": {"path": str(root)}},
    ).execute()
    nbformat.write(notebook, path)
    print(f"Executed {path.name}", flush=True)
