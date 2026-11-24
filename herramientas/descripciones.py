"""Genera las descripciones del catálogo para la segunda tirada.

Lee fabrica/descripciones/datos_*.py y fabrica/catalogo_juego.json y escribe:
- fabrica/descripciones/descripciones.json (para programas)
- fabrica/descripciones/<familia>.md (una página por familia, para ChatGPT y personas)
- fabrica/descripciones/README.md (índice y reglas comunes)

Uso: python3 herramientas/descripciones.py
"""
import json
import runpy
from pathlib import Path

R = Path(__file__).resolve().parent.parent
D = R / "fabrica" / "descripciones"
cat = json.loads((R / "fabrica" / "catalogo_juego.json").read_text(encoding="utf-8"))

datos = {}
for f in sorted(D.glob("datos_*.py")):
    datos.update(runpy.run_path(str(f))["C"])

FAMILIAS = [
    ("herramientas", "Herramientas", ["herramienta"], "Franja azul noche con lupa. Un instrumento del equipo que debe reconocerse por su silueta."),
    ("apoyos-y-reacciones", "Apoyos y reacciones", ["apoyo", "reaccion"], "Apoyo: franja verde con corazón. Reacción: franja azul con escudo. Gestos de cuidado y defensa; manos, hierbas, humo y fe."),
    ("marcador-y-objetos", "Alba y objetos malditos", ["marcador", "objeto"], "Franja ocre con ícono de carta. Objetos reales de la cultura mexicana con una carga ritual."),
    ("acciones-del-anima", "Acciones del ánima", ["anima"], "Franja morado noche con ícono de objetivo. El ánima actúa: se cuenta la consecuencia que sufre el investigador."),
    ("habilidades", "Habilidades de evidencia", ["habilidad"], "Franja morado noche con ojo. Ataque del ánima que deja una pista de su evidencia."),
    ("identidades", "Identidades de las ánimas", ["identidad"], "Franja café oscuro con fantasma y número. Retrato de la ánima en su escenario; su rasgo propio manda."),
    ("espantos", "Espantos", ["espanto"], "Franja guinda con calavera. El ataque final: manda la consecuencia que vive el jugador. Repite la figura de su identidad."),
    ("evidencias", "Evidencias", ["evidencia"], "Franja petróleo con el ícono de la evidencia. El indicio es el protagonista; alrededor queda un área de descanso."),
    ("roles", "Roles (Los testigos de la casona)", ["rol"], "Encabezado con el emblema de familia (mano, ojo, corazón, escudo). Retrato de una persona real; solo aparece aquí."),
    ("espiritus", "Cartas de espíritu", ["espiritu"], "Franja azul noche. Investigadores muertos, traslúcidos en azul y verde, que siguen ayudando."),
    ("consulta-y-reglas", "Consulta, reglas y componentes", ["consulta", "reglas", "componente"], "Franja café. Cartas que explican el juego; las de reglas llevan ilustración al frente."),
]
ESTADO = {"conservar": "✅ Conservar", "rehacer": "🔁 Rehacer", "rol aprobado": "🟡 Ilustración aprobada · falta carta",
          "falta": "⬜ Falta", "documentación": "📄 Documentación"}

salida, faltan = [], []
for c in cat["cartas"]:
    d = datos.get(c["id"])
    if not d:
        faltan.append(c["id"]); continue
    salida.append({"id": c["id"], "id_arte": c.get("id_arte"), "nombre": c["nombre"], "tipo": c["tipo"], "copias": c["cantidad"],
                   "reverso": c["reverso"], "estado": d["e"], "personaje": d.get("p"), "representa": d["r"], "arte_actual": d["a"],
                   "lectura_clave": d["l"], "propuesta": d["pr"], "alternativa": d["alt"]})
if faltan:
    raise SystemExit(f"Sin descripción: {faltan}")
(D / "descripciones.json").write_text(json.dumps({"version": 1, "generado_desde_juego": cat["juego"]["commit"], "cartas": salida},
                                                 ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

indice = []
for slug, titulo, tipos, regla in FAMILIAS:
    L = [x for x in salida if x["tipo"] in tipos]
    md = [f"# {titulo}", "", f"**Regla de la familia:** {regla}", "",
          "Lee antes [PERSONAJES.md](../PERSONAJES.md) y [la guía de estilo](../../guias/ESTILO_DE_CARTAS.md). Las cartas marcadas *Conservar* son la referencia de acabado de esta familia.", ""]
    for x in L:
        md += [f"## {x['nombre']} · `{x['id']}`", "",
               f"**Estado:** {ESTADO[x['estado']]} · **Copias:** {x['copias']} · **Reverso:** `{x['reverso']}`" + (f" · **Arte:** `{x['id_arte']}`" if x["id_arte"] else ""), ""]
        if x["personaje"]:
            md += [f"**Personaje:** {x['personaje']}", ""]
        md += [f"- **Qué representa:** {x['representa']}",
               f"- **Arte actual:** {x['arte_actual']}",
               f"- **Debe leerse a tamaño de mesa:** {x['lectura_clave']}",
               f"- **Segunda tirada:** {x['propuesta']}"]
        if x["alternativa"] != "—":
            md.append(f"- **Alternativa:** {x['alternativa']}")
        md.append("")
    (D / f"{slug}.md").write_text("\n".join(md), encoding="utf-8")
    cuenta = {}
    for x in L:
        cuenta[x["estado"]] = cuenta.get(x["estado"], 0) + 1
    indice.append(f"| [{titulo}]({slug}.md) | {len(L)} | " + ", ".join(f"{ESTADO[k]} {v}" for k, v in cuenta.items()) + " |")

total = {}
for x in salida:
    total[x["estado"]] = total.get(x["estado"], 0) + 1
readme = ["# Descripciones del catálogo · segunda tirada", "",
          "Una descripción por carta para mantener el mazo homogéneo. Generado con `herramientas/descripciones.py`; se edita en `datos_*.py`.", "",
          "**Cada carta trae:** estado, personaje, qué representa, arte actual, lo que debe leerse a tamaño de mesa, la escena para la segunda tirada y una alternativa (otra escena por si la primera no funciona).", "",
          "**Decisiones del 24-nov-2026:**",
          "- Las personas de las cartas son los 5 investigadores con nombre ([PERSONAJES.md](../PERSONAJES.md)).",
          "- Los roles solo aparecen en su carta de rol.",
          "- La carta de identidad manda el aspecto de cada ánima; el Espanto repite la figura.",
          "- Equipo atemporal: casete, botones físicos, pantallas sencillas; sin celulares.",
          "- Las cartas *Conservar* no se regeneran: son la referencia de acabado.", "",
          "**Total:** " + ", ".join(f"{ESTADO[k]} {v}" for k, v in total.items()), "",
          "| Familia | Cartas | Estado |", "|---|---|---|", *indice, "",
          "## Correcciones detectadas al revisar el arte",
          "- **Penitencia** (`es_anima`): la carta actual se titula «Cadenas» y muestra pies encadenados; no corresponde al Espanto vigente.",
          "- **Reglas 2, 3 y 4** repiten las ilustraciones del Termómetro, Cacería y Presencia. Necesitan ilustración propia.",
          "- **Velar y Manifestar** muestran a los roles (Curandero y Detective); se cambian por investigadores.",
          "- **Esconderse** muestra a un joven que no coincide con ningún investigador; pasa a ser Tomás.",
          "- **Consulta Q2** habla de «la franja» y del descarte previo a los Espantos, que ya no existen.",
          "- **El Detective y Tomás** comparten sombrero y poncho petróleo: conviene diferenciarlos.", ""]
(D / "README.md").write_text("\n".join(readme), encoding="utf-8")
print(len(salida), "cartas ·", total)
