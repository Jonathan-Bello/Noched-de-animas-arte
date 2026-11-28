"""Control de calidad obligatorio de una carta antes de publicarla en el selector.

Nació de familias-03 (nov-2026), donde el autor descartó las 40 propuestas por tres fallos de proceso:
el encargo llevaba referencias comunes en vez de las de cada carta, unas propuestas sirvieron de
referencia a otras, y nadie comparó el resultado a 58 × 88 mm con las cartas aprobadas de su familia.

  plantilla <lote> <id> [--variantes a b c d]
      Escribe fabrica/tirajes/<lote>/control/<id>.json con las referencias aprobadas de la carta
      (las de la ficha que se pueden adjuntar) y los campos de revisión vacíos.
  comprobar <lote> <id> [--img a=RUTA ...]
      Falla si el control está incompleto o si alguna regla no se cumple. Con --img verifica además
      que las imágenes revisadas son las que se van a publicar (mismo sha256).

Reglas que comprueba, por variante:
  1. Referencias adjuntadas: al menos una, todas de la ficha de la carta (aprobadas o elegidas por el
     autor) y con el mismo sha256. Nunca una propuesta: nada de fabrica/entrada, fabrica/tirajes ni
     web/revision salvo el original votado que la ficha marque como utilizable.
  2. Al menos una referencia de acabado de la familia (o la versión que el autor prefirió).
  3. Hoja de revisión a 58 × 88 mm hecha con scripts/revisar.py (archivo existente).
  4. Las cartas de punto de estilo (guias/punto-de-estilo.json) adjuntadas, y los siete límites de
     referencias/estilo-simple.md revisados en las dos direcciones (ni realista ni plano).
  5. Lectura ciega escrita, acabado comparado con la familia marcado «encaja» y qa = true.
"""
import argparse
import hashlib
import json
import sys
from pathlib import Path

from comun import R, Fabrica

PROHIBIDO = ("fabrica/entrada/", "fabrica/tirajes/", "web/revision/")
LIMITES = ("capas_con_volumen", "textura", "detalle_objetos", "fondo", "cantidad", "adorno_calado", "luz")
PUNTO = "guias/punto-de-estilo.json"  # cartas que el autor marcó «en el punto» (calibración); van en todo encargo
FAMILIA = ("punto de estilo", "acabado de la familia", "versión preferida por el autor", "identidad en una carta elegida")


def ruta_control(lote, cid):
    return R / "fabrica/tirajes" / lote / "control" / f"{cid}.json"


def aprobadas(cid):
    f = Fabrica().ficha(cid)
    return f, {r["ruta"]: r for r in f["referencias"] if r["usar"] and r["existe"]}


def plantilla(p):
    f, refs = aprobadas(p.id)
    destino = ruta_control(p.lote, p.id)
    if destino.exists() and not p.forzar:
        sys.exit(f"Ya existe {destino.relative_to(R)}; usa --forzar para rehacerlo.")
    datos = {
        "id": p.id, "nombre": f["nombre"], "familia": f["familia"],
        "lectura_clave": f["lectura_clave"],
        "referencias_disponibles": [{"ruta": r["ruta"], "sha256": r["sha256"], "funciones": r["funciones"]} for r in refs.values()],
        "hoja_58x88": "",
        "variantes": {op: {"guion": "", "adjuntadas": list(refs), "imagen_sha256": "", "lectura_ciega": "",
                           "acabado": "", "limites": {k: False for k in LIMITES}, "observaciones": "", "qa": False} for op in p.variantes},
    }
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Escrito {destino.relative_to(R)}. Adjunta al generador solo las rutas de «adjuntadas» y después:")
    print(f"  python3 .agents/skills/fabrica-cartas-animas/scripts/revisar.py {p.id} --a A.png --b B.png --salida fabrica/tirajes/{p.lote}/control/{p.id}-58x88.png")


def punto_de_estilo():
    p = R / PUNTO
    return [x["ruta"] for x in json.loads(p.read_text(encoding="utf-8"))["referencias"]] if p.is_file() else None


def errores(lote, cid, imgs=None):
    destino = ruta_control(lote, cid)
    if not destino.is_file():
        return [f"falta el control {destino.relative_to(R)} (crea la plantilla con control.py plantilla {lote} {cid})"]
    c = json.loads(destino.read_text(encoding="utf-8"))
    _, refs = aprobadas(cid)
    mal = []
    punto = punto_de_estilo()
    if punto is None:
        mal.append(f"falta {PUNTO}: el autor aún no marcó las cartas «en el punto» de estilo")
    else:
        refs.update({r: {"ruta": r, "funciones": ["punto de estilo"]} for r in punto})
    hoja = c.get("hoja_58x88") or ""
    if not hoja or not (R / hoja).is_file():
        mal.append("falta la hoja de revisión a 58 × 88 mm (scripts/revisar.py --salida)")
    for op, v in sorted(c.get("variantes", {}).items()):
        pre = f"{op.upper()}:"
        adj = v.get("adjuntadas") or []
        if not adj:
            mal.append(f"{pre} no anota qué referencias se adjuntaron")
        for ruta in adj:
            if ruta.startswith(PROHIBIDO) and ruta not in refs:
                mal.append(f"{pre} usa una propuesta como referencia ({ruta}); solo valen cartas aprobadas")
            elif ruta not in refs:
                mal.append(f"{pre} {ruta} no es referencia aprobada de esta carta (ver ficha.py {cid})")
        if punto and not set(punto) <= set(adj):
            mal.append(f"{pre} faltan adjuntar las cartas de punto de estilo: {', '.join(sorted(set(punto) - set(adj)))}")
        if adj and not any(any(fn in FAMILIA for fn in refs[r]["funciones"]) for r in adj if r in refs):
            mal.append(f"{pre} ninguna referencia de acabado de la familia")
        if not (v.get("lectura_ciega") or "").strip():
            mal.append(f"{pre} falta la lectura ciega (qué se entiende con el título tapado)")
        if (v.get("acabado") or "").strip().lower() != "encaja":
            mal.append(f"{pre} el acabado no está marcado «encaja» con su familia")
        lim = v.get("limites") or {}
        faltan = [k for k in LIMITES if lim.get(k) is not True]
        if faltan:
            mal.append(f"{pre} no cumple o no revisó los límites de estilo simple: {', '.join(faltan)} (dos direcciones: ni realista ni plano; referencias/estilo-simple.md)")
        if v.get("qa") is not True:
            mal.append(f"{pre} qa no está aprobado")
        if imgs and op in imgs:
            h = hashlib.sha256(Path(imgs[op]).read_bytes()).hexdigest()
            if v.get("imagen_sha256") != h:
                mal.append(f"{pre} la imagen a publicar no es la revisada (sha256 distinto)")
    return mal


def comprobar(p):
    imgs = dict(x.split("=", 1) for x in p.img)
    mal = errores(p.lote, p.id, imgs)
    if mal:
        sys.exit(f"{p.id}: control incompleto\n- " + "\n- ".join(mal))
    print(f"{p.id}: control completo")


def main():
    a = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    s = a.add_subparsers(required=True)
    x = s.add_parser("plantilla"); x.add_argument("lote"); x.add_argument("id")
    x.add_argument("--variantes", nargs="+", default=["a", "b"], choices=list("abcd")); x.add_argument("--forzar", action="store_true")
    x.set_defaults(fn=plantilla)
    x = s.add_parser("comprobar"); x.add_argument("lote"); x.add_argument("id"); x.add_argument("--img", action="append", default=[], metavar="OP=RUTA")
    x.set_defaults(fn=comprobar)
    p = a.parse_args()
    p.fn(p)


if __name__ == "__main__":
    main()
