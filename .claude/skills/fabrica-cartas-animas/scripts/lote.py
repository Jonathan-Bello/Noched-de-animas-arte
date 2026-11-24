"""Acceso compatible al gestor de lotes del repositorio."""
from pathlib import Path
from runpy import run_path

if __name__ == "__main__":
    run_path(str(Path(__file__).resolve().parents[4] / "herramientas/lotes_arte.py"), run_name="__main__")
