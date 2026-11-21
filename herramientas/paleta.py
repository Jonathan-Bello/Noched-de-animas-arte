"""Mide franjas y obtiene muestras sRGB representativas de la ilustración.

Ejecutar después de miniaturas.py. No escribe sobre recursos del canon.
"""
import json
from collections import Counter
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "web/plantillas/paleta.json"
TARGETS = {"Petróleo": (28, 81, 83), "Crema": (240, 218, 166),
           "Cempasúchil": (240, 129, 28), "Ámbar": (208, 149, 54),
           "Guinda": (109, 35, 62), "Magenta": (169, 44, 94), "Morado": (89, 50, 102)}


def hex_color(rgb):
    return "#%02X%02X%02X" % tuple(rgb)


def main():
    cards = json.loads((ROOT / "fabrica/catalogo_juego.json").read_text())["cartas"]
    bands = {}
    samples = []
    for card in cards:
        art = card.get("id_arte")
        img = ROOT / f"web/miniaturas/{art}@2x.webp"
        if not img.exists() or card["estado_arte"] != "aprobado":
            continue
        with Image.open(img) as im:
            im = im.convert("RGB").resize((290, 440))
            if card["tipo"] not in bands:
                rgb = Counter(im.crop((18, 12, 272, 40)).getdata()).most_common(1)[0][0]
                bands[card["tipo"]] = {"hex": hex_color(rgb), "id": art, "nombre": card["nombre"]}
            if art in {"i06", "i09", "i11", "i14", "a09", "id01", "s13", "o08"}:
                palette = im.crop((12, 52, 278, 390)).quantize(64).convert("RGB")
                samples.extend((rgb, art) for n, rgb in palette.getcolors() if n >= 250)
    if not samples:
        raise SystemExit("Faltan vistas medias: ejecutar miniaturas.py primero.")
    illustration = {}
    for name, target in TARGETS.items():
        rgb, art = min(samples, key=lambda s: sum((a-b)**2 for a,b in zip(s[0], target)))
        illustration[name] = {"hex": hex_color(rgb), "id": art}
    OUT.write_text(json.dumps({"ilustracion": illustration, "franjas": bands}, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
