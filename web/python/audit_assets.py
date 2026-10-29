"""Validate INFA technical artwork and report approved project photo slots."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
ILLUSTRATIONS = (
    "metal-tech.svg", "carpinteria-tech.svg", "hidraulica-tech.svg", "modulos-tech.svg",
    "mantenimiento-tech.svg", "proceso-tech.svg",
)
PHOTO_SLOTS = (
    "metal.webp", "carpinteria.webp", "modulos.webp", "mantenimiento.webp",
)


def main() -> int:
    art_root = ROOT / "assets/images/illustrations"
    missing = [name for name in ILLUSTRATIONS if not (art_root / name).is_file()]
    print(f"INFA asset audit - {ROOT}")
    print(f"Generated technical diagrams: {len(ILLUSTRATIONS) - len(missing)}/{len(ILLUSTRATIONS)}")
    for name in ILLUSTRATIONS:
        path = art_root / name
        print(f"  {'OK      ' if path.is_file() else 'MISSING '} assets/images/illustrations/{name}")
    projects_root = ROOT / "assets/images/projects"
    photos = [name for name in PHOTO_SLOTS if (projects_root / name).is_file()]
    print(f"Approved project photos: {len(photos)}/{len(PHOTO_SLOTS)}")
    for name in PHOTO_SLOTS:
        path = projects_root / name
        print(f"  {'PHOTO   ' if path.is_file() else 'PENDING '} assets/images/projects/{name}")
    if missing:
        print("Restore missing generated diagrams before publishing.")
        return 1
    print("Illustration set is complete. Add only approved project photography.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
