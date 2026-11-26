"""Comprueba que una ilustración respete la paleta de su familia antes de publicarla en el selector.

Mide, en la zona útil de la imagen (sin franja de título, panel de leyenda ni marco), qué
proporción de los píxeles visibles es:

  carmín  — rojo saturado (tono 345°–22°, saturación > 0,45)
  morado  — magenta y morado (270°–345°)
  frío    — verdes, petróleo y azules (70°–270°)

Los umbrales salen de medir los 21 Espantos aprobados (web/miniaturas/s01…s21) contra las
52 propuestas de Espanto del lote comparativa-01, que el autor rechazó todas. Ver
referencias/familias.md.

Uso:
  python3 .agents/skills/fabrica-cartas-animas/scripts/paleta_familia.py es_cadejo propuesta.png [más.png …]
  python3 .agents/skills/fabrica-cartas-animas/scripts/paleta_familia.py --familia espanto propuesta.png
  python3 .agents/skills/fabrica-cartas-animas/scripts/paleta_familia.py --calibrar   # vuelve a medir el canon

Devuelve código 1 si alguna imagen no pasa. Es un filtro previo: no aprueba nada.
"""
import argparse
import colorsys
import statistics
import sys
from pathlib import Path

from PIL import Image

R = Path(__file__).resolve().parents[4]

# Umbrales por familia. Solo se fijan donde el canon es homogéneo y medible.
UMBRALES = {
    # Espantos aprobados (sin s07): carmín mín. 0,29, mediana 0,75; frío máx. 0,00.
    # Propuestas rechazadas de comparativa-01: carmín mediana 0,40; frío hasta 0,59.
    # Con estos umbrales pasan los 20 aprobados y se detienen 30 de las 48 propuestas
    # rechazadas (sin Chaneque); las demás cayeron por reparto, no por color.
    "espanto": {"carmin_min": 0.28, "carmin_morado_min": 0.52, "frio_max": 0.02},
}
# Excepción documentada: s07 «Juego del monte» (Chaneque) usa selva verde y está aprobado.
EXCEPCIONES = {"es_chaneque": "El Juego del monte aprobado es verde selva; compararlo a ojo con s07."}


def _pixeles(im):
    return im.get_flattened_data() if hasattr(im, "get_flattened_data") else im.getdata()


def medir(ruta, carta_montada=False):
    im = Image.open(ruta).convert("RGB")
    w, h = im.size
    if carta_montada:  # miniatura del canon: quitar marco, franja y leyenda
        im = im.crop((int(w * .06), int(h * .10), int(w * .94), int(h * .80)))
    im = im.resize((120, 180))
    n = carmin = morado = frio = 0
    for r, g, b in _pixeles(im):
        t, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
        if v < 0.12:          # negros: no cuentan para la paleta
            continue
        n += 1
        d = t * 360
        if s > 0.45 and (d >= 345 or d <= 22):
            carmin += 1
        elif s > 0.20 and 270 <= d < 345:
            morado += 1
        elif s > 0.20 and 70 <= d < 270:
            frio += 1
    n = max(n, 1)
    return {"carmin": carmin / n, "morado": morado / n, "frio": frio / n}


def familia_de(card_id):
    if card_id.startswith("es_"):
        return "espanto"
    if card_id.startswith("id_"):
        return "identidad"
    return None


def juzgar(m, familia):
    u = UMBRALES.get(familia)
    if not u:
        return []
    fallos = []
    if m["carmin"] < u["carmin_min"]:
        fallos.append(f"carmín {m['carmin']:.2f} < {u['carmin_min']}: el rojo no domina")
    if m["carmin"] + m["morado"] < u["carmin_morado_min"]:
        fallos.append(f"carmín+morado {m['carmin'] + m['morado']:.2f} < {u['carmin_morado_min']}")
    if m["frio"] > u["frio_max"]:
        fallos.append(f"frío {m['frio']:.2f} > {u['frio_max']}: hay petróleo, azul o verde")
    return fallos


def calibrar():
    fs = sorted((R / "web/miniaturas").glob("s[0-9][0-9]@2x.webp"))
    vals = []
    for f in fs:
        m = medir(f, carta_montada=True)
        vals.append(m)
        print(f"{f.name:14s} carmín {m['carmin']:.2f}  morado {m['morado']:.2f}  frío {m['frio']:.2f}")
    sin7 = [v for f, v in zip(fs, vals) if not f.name.startswith("s07")]
    for k in ("carmin", "morado", "frio"):
        xs = [v[k] for v in sin7]
        print(f"{k}: mín {min(xs):.2f}  mediana {statistics.median(xs):.2f}  máx {max(xs):.2f}  (sin s07)")


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("id", nargs="?", help="ID del juego (es_cadejo, id_xtabay…)")
    p.add_argument("imagenes", nargs="*")
    p.add_argument("--familia", choices=sorted(UMBRALES))
    p.add_argument("--montada", action="store_true", help="la imagen ya lleva marco, título y leyenda")
    p.add_argument("--calibrar", action="store_true")
    a = p.parse_args()
    if a.calibrar:
        calibrar()
        return 0
    imagenes = list(a.imagenes)
    familia = a.familia
    if familia and a.id and Path(a.id).exists():
        imagenes.insert(0, a.id)
    elif a.id:
        familia = familia or familia_de(a.id)
    if not imagenes:
        p.error("faltan imágenes")
    if a.id in EXCEPCIONES:
        print("Aviso:", EXCEPCIONES[a.id])
    malo = False
    for ruta in imagenes:
        m = medir(ruta, a.montada)
        fallos = juzgar(m, familia) if a.id not in EXCEPCIONES else []
        linea = f"{Path(ruta).name}: carmín {m['carmin']:.2f} · morado {m['morado']:.2f} · frío {m['frio']:.2f}"
        if not UMBRALES.get(familia):
            print(linea, "· (sin umbral para esta familia; revisar a ojo con familias.md)")
        elif fallos:
            malo = True
            print(linea, "· NO PASA —", "; ".join(fallos))
        else:
            print(linea, "· pasa")
    return 1 if malo else 0


if __name__ == "__main__":
    sys.exit(main())
