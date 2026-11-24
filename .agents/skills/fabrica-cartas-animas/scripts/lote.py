"""Lotes del selector de ilustraciones (revision.html) y registro de la elección del autor.

Un lote es una ronda de revisión: para cada carta muestra la propuesta A, la propuesta B y la
versión vigente («original»), y el autor elige una de las tres.

  estado <lote>                         Qué falta en el lote: fichas, propuestas, publicación y votos.
  agregar <lote> <id> --a IMG --b IMG   Publica las dos propuestas de una carta en el selector.
  comprobar                             Valida todos los lotes (IDs únicos, archivos y hashes).
  registrar <seleccion.json>            Pasa el JSON que descarga el selector a fabrica/seleccion-visual.json.

Archivos:
  web/revision/lotes.json           Índice de lotes que lee el selector (el primero se abre por omisión).
  web/revision/<lote>/lote.json     Cartas del lote.
  web/revision/<lote>/<id>-a.webp   Propuestas publicadas (fuera de Git LFS para que el sitio las sirva).
  fabrica/seleccion-visual.json     Elección del autor, para retomarla desde cualquier sesión.
"""
import argparse
import hashlib
import io
import json
import re
import sys
from datetime import date
from pathlib import Path

from comun import R, Fabrica, familia, miniatura, sha256

INDICE = R / "web/revision/lotes.json"
SELECCION = R / "fabrica/seleccion-visual.json"
NOMBRE = re.compile(r"^[a-z0-9][a-z0-9-]{1,40}$")
ALTO_MAX = 1100


def cargar(p, defecto=None):
    return json.loads(p.read_text(encoding="utf-8")) if p.exists() else defecto


def guardar(p, datos):
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(datos, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def ruta_lote(lote):
    for e in cargar(INDICE, {"lotes": []})["lotes"]:
        if e["lote"] == lote:
            return R / e["ruta"]
    return R / "web/revision" / lote / "lote.json"


def limpio(archivo):
    return archivo.split("?")[0]


def a_webp(origen):
    from PIL import Image
    im = Image.open(origen).convert("RGB")
    if im.height > ALTO_MAX:
        im = im.resize((round(im.width * ALTO_MAX / im.height), ALTO_MAX), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "WEBP", quality=86, method=6)
    return buf.getvalue()


def indexar(lote, ruta, n):
    idx = cargar(INDICE, {"version": 1, "lotes": []})
    titulo = f"{lote} · {n} carta" + ("s" if n != 1 else "")
    for e in idx["lotes"]:
        if e["lote"] == lote:
            e["titulo"] = titulo
            break
    else:
        idx["lotes"].insert(0, {"lote": lote, "titulo": titulo, "ruta": ruta})
    guardar(INDICE, idx)


def agregar(p):
    if not NOMBRE.match(p.lote) or p.lote == "frentes-01":
        sys.exit(f"Nombre de lote no válido o protegido: {p.lote}")
    fab = Fabrica()
    f = fab.ficha(p.id)
    if f["accion"] != "generar" and not p.forzar:
        sys.exit(f"{p.id}: {f['accion_texto']} Usa --forzar si el autor lo pidió.")
    if not f["id_arte"]:
        sys.exit(f"{p.id} no tiene versión vigente (id_arte) para la columna «original».")
    carpeta = R / "web/revision" / p.lote
    archivo = carpeta / "lote.json"
    datos = cargar(archivo, {"lote": p.lote, "cartas": []})
    carta = next((c for c in datos["cartas"] if c["id"] == p.id), None)
    nueva = carta is None
    if nueva:
        carta = {"id": p.id, "nombre": f["nombre"], "familia": familia(f["tipo"])[0], "reverso": f["reverso"]}
        datos["cartas"].append(carta)
    cambios = []
    for op, origen in (("a", p.a), ("b", p.b)):
        contenido = a_webp(origen)
        destino = carpeta / f"{p.id}-{op}.webp"
        h = hashlib.sha256(contenido).hexdigest()
        previo = carta.get(op)
        if previo and previo["sha256"] == h:
            continue
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_bytes(contenido)
        nuevo = {"archivo": f"{destino.relative_to(R).as_posix()}?v={h[:10]}", "sha256": h}
        if previo:
            anteriores = previo.get("anteriores") or ([previo["anterior"]] if previo.get("anterior") else [])
            anteriores = [x for x in anteriores + [previo["sha256"]] if x != h]
            nuevo["anterior"] = previo["sha256"]
            nuevo["anteriores"] = anteriores
        carta[op] = nuevo
        cambios.append(op.upper())
    orig = miniatura(f["id_arte"])
    if (R / orig).exists():
        h = sha256(orig)
        if carta.get("original", {}).get("sha256") != h:
            previo = carta.get("original")
            carta["original"] = {"archivo": orig, "sha256": h}
            if previo:
                carta["original"]["anteriores"] = [x for x in previo.get("anteriores", []) + [previo["sha256"]] if x != h]
            cambios.append("original")
    if not cambios and not nueva:
        print(f"= {p.id}: sin cambios en {p.lote} (ya publicadas las mismas imágenes)")
        return
    guardar(archivo, datos)
    indexar(p.lote, archivo.relative_to(R).as_posix(), len(datos["cartas"]))
    print(f"{'+' if nueva else '~'} {p.id} en {p.lote}: {', '.join(cambios) or 'registrada'} · {len(datos['cartas'])} cartas en el lote")


def comprobar(_p=None):
    idx = cargar(INDICE)
    if not idx:
        sys.exit("Falta web/revision/lotes.json")
    desc = Fabrica().desc
    errores, total = [], 0
    rutas = set()
    for e in idx["lotes"]:
        rutas.add(e["ruta"])
        datos = cargar(R / e["ruta"])
        if not datos or datos.get("lote") != e["lote"]:
            errores.append(f"{e['lote']}: {e['ruta']} no existe o pertenece a otro lote")
            continue
        ids = [c["id"] for c in datos["cartas"]]
        if len(ids) != len(set(ids)):
            errores.append(f"{e['lote']}: IDs repetidos")
        for c in datos["cartas"]:
            total += 1
            if c["id"] not in desc:
                errores.append(f"{e['lote']}/{c['id']}: el ID no está en el catálogo")
            for op in ("a", "b", "original"):
                x = c.get(op)
                if not x:
                    errores.append(f"{e['lote']}/{c['id']}: falta {op}")
                elif not (R / limpio(x["archivo"])).is_file():
                    errores.append(f"{e['lote']}/{c['id']}: no existe {limpio(x['archivo'])}")
                elif sha256(limpio(x["archivo"])) != x["sha256"]:
                    errores.append(f"{e['lote']}/{c['id']}: el hash de {op} no coincide con el archivo")
    for f in (R / "web/revision").glob("*/lote.json"):
        if f.relative_to(R).as_posix() not in rutas:
            errores.append(f"{f.relative_to(R)} no está en web/revision/lotes.json")
    if errores:
        print("\n".join("✗ " + x for x in errores))
        sys.exit(1)
    print(f"OK: {len(idx['lotes'])} lotes, {total} cartas, IDs únicos, archivos y hashes correctos.")


def registrar(p):
    sel = json.loads(Path(p.archivo).read_text(encoding="utf-8"))
    if sel.get("version") != 1 or "lote" not in sel:
        sys.exit("No es un JSON del selector (version 1).")
    datos = cargar(ruta_lote(sel["lote"]))
    if not datos:
        sys.exit(f"No encuentro el lote {sel['lote']}")
    por_id = {c["id"]: c for c in datos["cartas"]}
    alcances = dict(x.split("=", 1) for x in p.alcance)
    reg = cargar(SELECCION)
    actuales = {c["id"]: c for c in reg["cartas"]}
    hechos = 0
    for e in sel["elecciones"]:
        c = por_id.get(e["id"])
        if not c or c[e["opcion"]]["sha256"] != e["sha256"]:
            print(f"! {e['id']}: el voto corresponde a una imagen que ya cambió; se omite (vuelve a votar)")
            continue
        nuevo = {"id": e["id"], "nombre": c["nombre"], "lote": sel["lote"], "voto": e["opcion"],
                 "alcance": alcances.get(e["id"], "preferencia_visual"), "archivo": limpio(c[e["opcion"]]["archivo"]),
                 "sha256": e["sha256"], "registrado": date.today().isoformat()}
        previo = actuales.get(e["id"])
        if previo and all(previo.get(k) == nuevo[k] for k in ("lote", "voto", "sha256", "alcance")):
            continue
        if previo:
            historial = previo.pop("historial", [])
            nuevo["historial"] = historial + [previo]
            reg["cartas"][reg["cartas"].index(previo)] = nuevo
        else:
            reg["cartas"].append(nuevo)
        actuales[e["id"]] = nuevo
        hechos += 1
        print(f"~ {e['id']}: {nuevo['voto']} ({nuevo['alcance']})")
    guardar(SELECCION, reg)
    print(f"Registradas {hechos} elecciones del lote {sel['lote']} en fabrica/seleccion-visual.json"
          + ("" if sel.get("completo") else " · la selección exportada no estaba completa"))


def estado(p):
    fab = Fabrica()
    enc = cargar(R / "fabrica/tirajes" / p.lote / "encargo.json", {})
    datos = cargar(ruta_lote(p.lote), {"cartas": []})
    publicadas = {c["id"]: c for c in datos["cartas"]}
    votos = {c["id"]: c for c in fab.votos.values() if c["lote"] == p.lote}
    ids = list(dict.fromkeys(enc.get("ids", []) + list(publicadas)))
    if not ids:
        sys.exit(f"El lote {p.lote} no tiene encargo ni cartas publicadas.")
    print(f"Lote {p.lote} · modo {enc.get('modo', 'arte')} · {len(ids)} cartas\n")
    print("| ID | Acción | Ficha | Propuestas en entrada | En el selector | Voto registrado |\n|---|---|---|---|---|---|")
    for i in ids:
        f = fab.ficha(i)
        md = R / "fabrica/tirajes" / p.lote / f"{i}.md"
        ficha = "falta" if not md.exists() else (f"{md.read_text(encoding='utf-8').count('(completar')} por completar" if "(completar" in md.read_text(encoding="utf-8") else "lista")
        entrada = sorted(x.name for d in (R / "fabrica/entrada").glob(f"*_{i}") for x in d.iterdir() if x.suffix in (".png", ".webp", ".jpg"))
        v, c = votos.get(i), publicadas.get(i)
        voto = "—"
        if v:
            voto = v["voto"] if not c or c[v["voto"]]["sha256"] == v["sha256"] else f"{v['voto']} (la imagen cambió: votar de nuevo)"
        print(f"| {i} | {f['accion']} | {ficha} | {len(entrada) or '—'} | {'sí' if c else 'no'} | {voto} |")


def main():
    a = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    s = a.add_subparsers(dest="orden", required=True)
    x = s.add_parser("estado"); x.add_argument("lote"); x.set_defaults(fn=estado)
    x = s.add_parser("agregar"); x.add_argument("lote"); x.add_argument("id"); x.add_argument("--a", required=True)
    x.add_argument("--b", required=True); x.add_argument("--forzar", action="store_true"); x.set_defaults(fn=agregar)
    x = s.add_parser("comprobar"); x.set_defaults(fn=comprobar)
    x = s.add_parser("registrar"); x.add_argument("archivo")
    x.add_argument("--alcance", action="append", default=[], metavar="ID=ALCANCE",
                   help="p. ej. t4=concepto_sin_aprobacion_del_dibujo cuando el autor elige solo la idea")
    x.set_defaults(fn=registrar)
    p = a.parse_args()
    p.fn(p)


if __name__ == "__main__":
    main()
