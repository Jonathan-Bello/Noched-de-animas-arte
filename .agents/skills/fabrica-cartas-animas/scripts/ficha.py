"""Prepara la ficha de producción de una o varias cartas.

Uso:
  python3 .agents/skills/fabrica-cartas-animas/scripts/ficha.py t3 t4 ev3
  python3 .agents/skills/fabrica-cartas-animas/scripts/ficha.py --lote segunda-tirada-01 t3 t4 ev3 --escribir
  python3 .agents/skills/fabrica-cartas-animas/scripts/ficha.py --lote segunda-tirada-01            # retoma el lote
  python3 ... ficha.py t3 --json         # datos para programas
  python3 ... ficha.py t3 t4 --comprobar # falla si falta una referencia

--escribir crea fabrica/tirajes/<lote>/encargo.json y una ficha <id>.md por carta.
Nunca sobrescribe una ficha existente (ya puede tener partes completadas a mano); usa --forzar.
"""
import argparse
import json
import subprocess
import sys
from datetime import date

from comun import INVESTIGADORES, R, Fabrica

ZONA = "Vertical 2:3 a sangre completa. Sujeto principal fuera del 12 % superior (título) y del 12 % inferior (leyenda); nada importante a menos del 5 % de los bordes laterales."
NO_DEBE = [
    "Texto, letras, números, firmas, marco, franjas o íconos: los pone la plantilla.",
    "Celulares, aparatos inalámbricos o pantallas modernas (equipo atemporal: casete, botones físicos, pantallas sencillas, cámara compacta sobre trípode).",
    "Personas que no sean los cinco investigadores; los roles con nombre solo aparecen en su carta de rol.",
]


def commit():
    try:
        return subprocess.check_output(["git", "-C", str(R), "rev-parse", "--short", "HEAD"], text=True, stderr=subprocess.DEVNULL).strip()
    except Exception:
        return "sin git"


def markdown(f, lote=None):
    L = [f"# Ficha · {f['id']} · {f['nombre']}", ""]
    if lote:
        L += [f"> Lote `{lote}` · preparada con la skill `fabrica-cartas-animas` (commit {commit()}). "
              "Pega la ficha en un chat nuevo del proyecto de ChatGPT y adjunta las imágenes de «Adjuntar».", ""]
    L += [f"**Tipo:** {f['tipo']} · **Familia:** {f['familia']} · **Copias:** {f['copias']} · **Reverso:** `{f['reverso']}`"
          + (f" · **Arte actual:** `{f['id_arte']}`" if f["id_arte"] else ""),
          f"**Qué hace en el juego:** {f['uso'] or '—'}",
          f"**Estado:** {f['estado']} → {f['accion_texto']}", ""]
    if f["accion"] != "generar":
        L += ["> Esta carta no entra al tiraje de arte. La ficha queda solo como consulta.", ""]
    if f["personaje"]:
        L += [f"**Personaje:** {f['personaje']}", ""]
    L += ["## Qué debe contar la imagen", f["representa"], "",
          "## Variante A · escena principal", f["escena_a"], "",
          "## Variante B · alternativa", f["escena_b"] if f["escena_b"] != "—" else "(completar: la ficha no trae alternativa; proponer otra escena y registrarla en datos_*.py)", "",
          "**Igual en A y B:** el aparato o el indicio, el personaje y el acabado de la familia. **Cambia:** el lugar del observador o el instante (CONTINUIDAD).", ""]
    if f["nota_continuidad"]:
        L += ["## Indicación del autor", f["nota_continuidad"], ""]
    if f["voto"]:
        v = f["voto"]
        L += [f"**Voto registrado:** lote `{v['lote']}`, opción `{v['voto']}`, alcance `{v['alcance']}`.", ""]
    L += ["## Debe verse", f"- {f['lectura_clave']}"]
    for r in f["referencias"]:
        if "modelo del aparato" in r["funciones"]:
            L.append(f"- Modelo del aparato: {r['aporta'][r['funciones'].index('modelo del aparato')]}")
    for p in f["personas"]:
        r = next((x for x in f["referencias"] if x["ruta"].startswith(f"web/mesa/arte/inv_{INVESTIGADORES[p]}")), None)
        if r:
            L.append(f"- {r['aporta'][0]}")
    L += ["- (completar: elementos propios de esta escena)", "", "## No debe verse", *[f"- {x}" for x in NO_DEBE]]
    for rel in f["relacionadas"]:
        L.append(f"- La escena de «{rel['nombre']}» (`{rel['id']}`), que es otra carta: {rel['escena_a']}")
    L += ["- (completar)", "", "## Composición", f"- {ZONA}", "- Puesta en escena propia por variante: (completar desde la acción: gesto, mirada o apoyo; contacto y punto de vista).",
          "- Para cada referencia, identificar el rasgo transferido y distinguirlo de la pose o distribución de la carta base.",
          "- Plano, punto de vista y luz: (completar)", "",
          "## Adjuntar", "Abrir cada imagen y entregar al generador **la imagen misma**, no el enlace.", "",
          "| Imagen | Función | Qué aporta | ¿Adjuntar? |", "|---|---|---|---|"]
    for r in f["referencias"]:
        estado = "sí" if r["usar"] else "no: solo consulta"
        if not r["existe"]:
            estado = "⚠ no existe"
        L.append(f"| `{r['ruta']}` | {' · '.join(r['funciones'])} | {' '.join(dict.fromkeys(r['aporta']))} | {estado} |")
    L += ["", "## Cómo se revisa",
          "- Ver cada variante ampliada y a 58 × 88 mm (`scripts/revisar.py`), con el título tapado.",
          "- Aplicar referencias/revision-visual.md de la skill. Anotar la zona observada, contacto o apoyo y decisión por variante.",
          f"- Al tapar el título debe leerse: {f['lectura_clave']}",
          "- Comparar materiales, planos y nivel de detalle con las referencias de acabado; pasar `fabrica/CONTROL_IA.md`.",
          "- **Criterio de aceptación:** (completar con algo que se pueda señalar en la imagen)", ""]
    return "\n".join(L)


def main():
    a = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    a.add_argument("ids", nargs="*")
    a.add_argument("--lote")
    a.add_argument("--escribir", action="store_true")
    a.add_argument("--forzar", action="store_true")
    a.add_argument("--json", action="store_true")
    a.add_argument("--comprobar", action="store_true")
    p = a.parse_args()
    fab = Fabrica()
    carpeta = R / "fabrica" / "tirajes" / p.lote if p.lote else None
    encargo = None
    if carpeta and (carpeta / "encargo.json").exists():
        encargo = json.loads((carpeta / "encargo.json").read_text(encoding="utf-8"))
    ids = p.ids or (encargo["ids"] if encargo else [])
    if not ids:
        a.error("Indica IDs o un --lote con encargo.json")
    fichas = [fab.ficha(i) for i in ids]

    if p.comprobar:
        malas = [(f["id"], r["ruta"]) for f in fichas for r in f["referencias"] if not r["existe"]]
        sin = [f["id"] for f in fichas if f["accion"] == "generar" and not any(r["usar"] for r in f["referencias"])]
        for i, ruta in malas:
            print(f"✗ {i}: falta {ruta}")
        for i in sin:
            print(f"✗ {i}: ninguna referencia utilizable")
        if malas or sin:
            sys.exit(1)
        print(f"OK: {len(fichas)} fichas, {sum(len(f['referencias']) for f in fichas)} referencias encontradas.")
        return
    if p.json:
        print(json.dumps(fichas, ensure_ascii=False, indent=1))
        return
    if p.escribir:
        if not p.lote:
            a.error("--escribir necesita --lote")
        carpeta.mkdir(parents=True, exist_ok=True)
        enc = encargo or {"lote": p.lote, "creado": date.today().isoformat(), "modo": "arte", "ids": []}
        for f in fichas:
            if f["id"] not in enc["ids"]:
                enc["ids"].append(f["id"])
            destino = carpeta / f"{f['id']}.md"
            if destino.exists() and not p.forzar:
                print(f"= {destino.relative_to(R)} ya existe; no se toca (usa --forzar)")
                continue
            destino.write_text(markdown(f, p.lote), encoding="utf-8")
            print(f"+ {destino.relative_to(R)}")
        enc["fuera_del_tiraje"] = {f["id"]: f["accion_texto"] for f in fichas if f["accion"] != "generar"} or enc.get("fuera_del_tiraje", {})
        (carpeta / "encargo.json").write_text(json.dumps(enc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"+ {(carpeta / 'encargo.json').relative_to(R)} · {len(enc['ids'])} cartas")
        return
    for f in fichas:
        print(markdown(f, p.lote))
        print("\n---\n")


if __name__ == "__main__":
    main()
