"""Preparar un lote de cuatro ilustraciones por pieza a partir de sus guiones editoriales.

Uso: python3 herramientas/publicar_comparativa.py comparativa-01 carpeta_de_webp
"""
import argparse
import hashlib
import re
import shutil
from pathlib import Path

from PIL import Image

from lotes_arte import Fabrica, INDICE, NOMBRE, R, cargar, familia, guardar, miniatura, sha256


def propuesta(origen, destino, anterior, descripcion):
    with Image.open(origen) as imagen:
        if imagen.format != "WEBP" or imagen.height <= imagen.width:
            raise ValueError(f"Se esperaba un WebP vertical: {origen}")
        imagen.verify()
    digest = hashlib.sha256(origen.read_bytes()).hexdigest()
    rel = destino.relative_to(R).as_posix()
    datos = {"archivo": f"{rel}?v={digest[:10]}", "sha256": digest, "descripcion": descripcion}
    if anterior:
        historial = list(anterior.get("anteriores", []))
        if anterior["sha256"] != digest:
            historial.append(anterior["sha256"])
        historial = [h for h in dict.fromkeys(historial) if h != digest]
        if historial:
            datos["anteriores"] = historial
    return datos


def preparar(lote, origen):
    if not NOMBRE.fullmatch(lote):
        raise ValueError("Nombre de lote no válido")
    fabrica = Fabrica()
    fichas = R / "fabrica/tirajes" / lote
    encargo = cargar(fichas / "encargo.json")
    editor = cargar(fichas / "descripciones.json")
    if not editor or not encargo or editor["lote"] != lote or encargo["lote"] != lote:
        raise ValueError("Faltan los guiones o el encargo del lote")
    if set(editor["guionistas"]) != set("abcd"):
        raise ValueError("Se necesita la autoría de las cuatro descripciones")
    destino = R / "web/revision" / lote
    archivo = destino / "lote.json"
    previo = cargar(archivo, {})
    if previo and not previo.get("guionistas"):
        raise ValueError("El lote ya existe con otro formato")
    anteriores = {c.get("pieza", c["id"]): c for c in previo.get("cartas", [])}
    guiones = {c["id"]: c for c in editor["cartas"]}
    nuevas, copias, vistas = [], [], set()
    for cid in encargo["ids"]:
        c = guiones[cid]
        if not c["en_selector"] or fabrica.desc[cid]["estado"] not in ("rehacer", "falta"):
            raise ValueError(f"{cid}: fuera del tiraje editorial")
        piezas = encargo.get("piezas", {}).get(cid, [{"clave": cid, "nombre": c["nombre"]}])
        for pieza in piezas:
            clave = pieza["clave"]
            if clave in vistas or not re.fullmatch(r"[A-Za-z0-9_-]+", clave):
                raise ValueError(f"Clave de pieza inválida o repetida: {clave}")
            vistas.add(clave)
            carta = {"id": cid, "nombre": pieza["nombre"], "familia": familia(c["tipo"])[0],
                     "reverso": fabrica.desc[cid]["reverso"]}
            if clave != cid:
                carta["pieza"] = clave
            for op in "abcd":
                descripcion = c["variantes"][op]
                if not descripcion:
                    raise ValueError(f"Falta el guion {cid}/{op}")
                nombre = f"{clave}-{op}.webp"
                carta[op] = propuesta(origen / nombre, destino / nombre, anteriores.get(clave, {}).get(op), descripcion)
                copias.append((origen / nombre, destino / nombre))
            if len({carta[k]["sha256"] for k in "abcd"}) != 4:
                raise ValueError(f"{clave}: hay propuestas idénticas")
            original = pieza.get("original") or encargo.get("originales", {}).get(cid) or miniatura(fabrica.desc[cid]["id_arte"])
            if original:
                carta["original"] = {"archivo": original, "sha256": sha256(original)}
            nuevas.append(carta)
    if {c["id"] for c in nuevas} != {c["id"] for c in editor["cartas"] if c["en_selector"]}:
        raise ValueError("El conjunto de guiones seleccionados difiere del encargo")
    destino.mkdir(exist_ok=True)
    for src, dest in copias:
        if src.resolve() != dest.resolve():
            shutil.copyfile(src, dest)
    guardar(archivo, {"lote": lote, "guionistas": editor["guionistas"], "ilustrador": encargo["ilustrador"], "cartas": nuevas})
    idx = cargar(INDICE)
    entrada = {"lote": lote, "titulo": encargo["titulo"], "ruta": archivo.relative_to(R).as_posix()}
    idx["lotes"] = [entrada] + [e for e in idx["lotes"] if e["lote"] != lote]
    guardar(INDICE, idx)
    print(f"{lote}: {len(nuevas)} comparaciones y {len(copias)} imágenes")


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("lote")
    cli.add_argument("origen", type=Path)
    args = cli.parse_args()
    preparar(args.lote, args.origen)
