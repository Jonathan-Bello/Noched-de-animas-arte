"""Montaje de la carta terminada (paso g de fabrica/MONTAJE.md), compuesto por código.

Arma el frente de 64 x 94 mm (corte 58 x 88, sangrado 3 mm) con las cuatro capas: ilustración,
marco, título con emblema y leyenda. Lo renderiza con Playwright y publica las vistas en el
selector como un lote de montaje (A y B son dos propuestas de franja o de leyenda).

Uso:  python3 herramientas/montar_carta.py montaje-01
Salida:
  fabrica/tirajes/<lote>/montaje/<pieza>-<v>.svg   frente con sangrado, para imprenta
  web/revision/<lote>/<pieza>-<v>.webp            vista del corte (58 x 88) para el selector
  web/revision/<lote>/lote.json  y el lote al inicio de web/revision/lotes.json
"""
import base64
import hashlib
import io
import json
import re
import sys
from html import escape
from pathlib import Path

from PIL import Image

R = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(R / "herramientas"))
import tarjeta_cordura  # noqa: E402

PAL = json.loads((R / "web/plantillas/paleta.json").read_text(encoding="utf-8"))
ORO, CREMA, TINTA, GUINDA = "#E2A447", "#F1DBAC", "#171117", "#712236"
OSCURA = "#0F0622"  # franja de Velar, la única carta de espíritu con marco aprobada
FRANJA_OBJETO = PAL["franjas"]["objeto"]["hex"]
FUENTES = R / "sitio/src/assets/fuentes"
TOP, BOT = 11.7, 82.3


def b64(p: Path) -> str:
    return base64.b64encode(p.read_bytes()).decode()


def estilo_fuentes() -> str:
    return ("<style>"
            f"@font-face{{font-family:'Titulo Carta';src:url(data:font/woff;base64,{b64(FUENTES / 'DejaVuSerifCondensed-Bold.woff')}) format('woff');font-weight:700}}"
            f"@font-face{{font-family:'Leyenda Carta';src:url(data:font/woff;base64,{b64(FUENTES / 'LiberationSerif-Italic.woff')}) format('woff');font-style:italic}}"
            "</style>")


def imagen_datos(origen: Path, recorte=None) -> str:
    with Image.open(origen) as im:
        im = im.convert("RGB")
        if recorte:
            im = im.crop(recorte)
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=92)
    return base64.b64encode(buf.getvalue()).decode()


def emblema(familia: str) -> str:
    if familia == "objeto":
        # Emblema de objetos tal como está en los frentes aprobados (Radio, o01): dos fichas crema superpuestas.
        return (f'<rect x="5.4" y="4.9" width="4.4" height="4.6" rx=".6" fill="{CREMA}" opacity=".85"/>'
                f'<rect x="6.3" y="5.7" width="4.6" height="4.9" rx=".6" fill="{CREMA}" stroke="{FRANJA_OBJETO}" stroke-width=".35"/>')
    datos = b64(R / f"iconos/cartas/recursos-juego/familia_{familia}.webp")
    return f'<image href="data:image/webp;base64,{datos}" x="5.1" y="4.4" width="6.2" height="6.2"/>'


def texto_leyenda(leyenda: str) -> str:
    base = 'x="32" fill="{}" text-anchor="middle" font-family="Leyenda Carta, Liberation Serif, serif" font-style="italic"'.format(TINTA)
    if len(leyenda) <= 38:
        return f'<text {base} y="{BOT + 5.7}" font-size="2.9">{escape(leyenda)}</text>'
    # dos líneas, partidas en el espacio más cercano a la mitad
    mitad = len(leyenda) // 2
    corte = min((i for i, ch in enumerate(leyenda) if ch == " "), key=lambda i: abs(i - mitad))
    l1, l2 = leyenda[:corte], leyenda[corte + 1:]
    return (f'<text {base} y="{BOT + 3.9}" font-size="2.6">{escape(l1)}</text>'
            f'<text {base} y="{BOT + 6.8}" font-size="2.6">{escape(l2)}</text>')


def frente(titulo, arte, familia, franja, leyenda, recorte=None, ancla="xMidYMid") -> str:
    ilus = imagen_datos(arte, recorte)
    largo = len(titulo)
    talla = 4.6 if largo <= 16 else 4.0
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="64mm" height="94mm" viewBox="0 0 64 94">
{estilo_fuentes()}
<title>{escape(titulo)}</title>
<defs><clipPath id="zonaIlus"><rect x="3.2" y="{TOP}" width="57.6" height="{BOT - TOP}"/></clipPath></defs>
<rect width="64" height="94" fill="{TINTA}"/>
<image href="data:image/webp;base64,{ilus}" x="0" y="{TOP - 0.2}" width="64" height="{BOT - TOP + 0.4}" preserveAspectRatio="{ancla} slice"/>
<rect x="0" y="0" width="64" height="{TOP}" fill="{franja}"/>
<rect x="0" y="{BOT}" width="64" height="{94 - BOT}" fill="{franja}"/>
<g id="titulo">{emblema(familia)}
<text x="12.6" y="9.3" fill="{CREMA}" font-size="{talla}" font-family="Titulo Carta, DejaVu Serif Condensed, serif" font-weight="700">{escape(titulo)}</text></g>
<g id="leyenda"><path d="M4.2 91 V{BOT + 1.4} q0 -1.4 1.4 -1.4 H58.4 q1.4 0 1.4 1.4 V91 Z" fill="{CREMA}"/>
{texto_leyenda(leyenda)}</g>
<rect id="marco" x="3.6" y="3.6" width="56.8" height="86.8" rx=".8" fill="none" stroke="{ORO}" stroke-width=".9"/>
<rect x="3.6" y="{TOP}" width="56.8" height=".35" fill="{ORO}"/>
</svg>'''


ROLES = [
    # id, pieza, título, familia, leyenda (bundle de roles v09)
    ("rol_vigia", "vigia", "El Vigía", "mano", "La sombra cambió de sitio. Él no apartó la mirada."),
    ("rol_improvisador", "improvisador", "El Improvisador", "mano", "Con lo que quedaba, todavía podía intentarlo."),
    ("rol_tecnico", "tecnico", "El Técnico", "ojo", "Un golpe, un chasquido… y volvió a escucharse."),
    ("rol_detective", "detective", "El Detective", "ojo", "La pista estaba donde nadie había querido mirar."),
    ("rol_curandero", "curandero", "El Curandero", "corazon", "Toma. Aún nos falta llegar al alba."),
    ("rol_devota", "devota", "La Devota", "escudo", "Donde llegó el humo, la sombra cedió."),
    ("rol_sensitivo", "sensitivo", "El Sensitivo", "ojo", "Dos ecos. Solo uno dejaba huella."),
    ("rol_guardaespaldas", "guardaespaldas", "El Guardaespaldas", "escudo", "La puerta cedió. Él no."),
]
CORDURA = [("ines", "Inés"), ("rafael", "Rafael"), ("tomas", "Tomás"), ("amalia", "Amalia"), ("mateo", "Padre Mateo")]


def piezas():
    """(id, pieza, nombre, familia del selector, reverso, original, {letra: (svg, descripcion)})"""
    franjas = {"a": (OSCURA, "Franja oscura, como el Velar aprobado"), "b": (GUINDA, "Franja guinda, del color del reverso de roles")}
    for cid, clave, titulo, fam, leyenda in ROLES:
        arte = R / f"web/miniaturas/roles-aprobados/{clave}.webp"
        ops = {k: (frente(titulo, arte, fam, color, leyenda, ancla="xMidYMin"),
                   f"{texto}. Emblema {fam}; leyenda «{leyenda}» (roles v09).") for k, (color, texto) in franjas.items()}
        yield cid, cid, titulo, "Roles", "rol_reverso", f"web/miniaturas/roles-aprobados/{clave}-vista.webp", ops
    leyenda = "Aún puedo hacer que me escuchen."
    arte = R / "objetos/4d/4df79e4a370d69ade1892705f26a5bff0213bd2e7b390b9d065a446390db0d8e.png"
    ops = {k: (frente("Manifestar", arte, "mano", color, leyenda, ancla="xMidYMid"), f"{texto}. Emblema mano; leyenda «{leyenda}».")
           for k, (color, texto) in franjas.items()}
    yield "rol_manifestar", "rol_manifestar", "Manifestar", "Espíritu", "espiritu_reverso", "web/miniaturas/personajes/manifestar_original.webp", ops
    leyenda = "No te dejaré solo en esta casa."
    arte = R / "web/revision/lote-01/velar-original.webp"
    ops = {k: (frente("Velar", arte, "escudo", color, leyenda, recorte=(14, 92, 579, 806)),
               f"{texto}. Mismo arte del Velar que conservaste, con el marco común de los roles.")
           for k, (color, texto) in franjas.items()}
    yield "rol_velar", "rol_velar", "Velar", "Espíritu", "espiritu_reverso", "web/revision/lote-01/velar-original.webp", ops
    arte = R / "web/revision/comparativa-01/pentagrama-a.webp"
    leyendas = {"a": "Cinco velas encendidas, y el copal no quiso prender.",
                "b": "Dentro de la estrella, ni el humo se atrevió a entrar."}
    ops = {k: (frente("Pentagrama", arte, "objeto", FRANJA_OBJETO, ley),
               f"Arte que votaste (comparativa-01 A). Franja de objeto maldito; leyenda «{ley}».") for k, ley in leyendas.items()}
    yield "pentagrama", "pentagrama", "Pentagrama", "Objetos malditos", "back02", "web/revision/comparativa-01/pentagrama-a.webp", ops
    for clave, nombre in CORDURA:
        retrato = R / f"web/revision/comparativa-01/cordura-{clave}-a.webp"
        svg_a = tarjeta_cordura.tarjeta(nombre, retrato).replace("<title>", estilo_fuentes() + "<title>", 1)
        franja = f'height="8.5" fill="{tarjeta_cordura.FRANJA}"'
        svg_b = svg_a.replace(franja, f'height="8.5" fill="{OSCURA}"', 1)
        ops = {"a": (svg_a, "Retrato que votaste en comparativa-01, montado con herramientas/tarjeta_cordura.py: franja café de consulta, escala 10 a 0 al borde derecho para el clip."),
               "b": (svg_b, "Igual que A, con la franja oscura de los roles para que la tarjeta haga juego con la carta de rol.")}
        yield "cordura", f"cordura-{clave}", f"Cordura · {nombre}", "Consulta, reglas y componentes", "Q1B", f"web/revision/comparativa-01/cordura-{clave}-a.webp", ops


def sha(p: Path) -> str:
    return hashlib.sha256(p.read_bytes()).hexdigest()


def main(lote: str):
    from playwright.sync_api import sync_playwright
    carpeta = R / "fabrica/tirajes" / lote / "montaje"
    web = R / "web/revision" / lote
    carpeta.mkdir(parents=True, exist_ok=True)
    web.mkdir(parents=True, exist_ok=True)
    cartas = []
    with sync_playwright() as p:
        try:
            nav = p.chromium.launch()
        except Exception:
            nav = p.chromium.launch(executable_path="/opt/pw-browsers/chromium")
        pg = nav.new_page(viewport={"width": 1280, "height": 1880})  # 20 px/mm
        for cid, clave, nombre, fam, reverso, original, ops in piezas():
            entrada = {"id": cid, "nombre": nombre, "familia": fam, "reverso": reverso}
            if clave != cid:
                entrada["pieza"] = clave
            for letra, (svg, desc) in ops.items():
                (carpeta / f"{clave}-{letra}.svg").write_text(svg, encoding="utf-8")
                pg.set_content(f"<style>body{{margin:0}}svg{{width:1280px;height:1880px;display:block}}</style>{svg}")
                pg.wait_for_timeout(150)
                png = pg.screenshot(clip={"x": 60, "y": 60, "width": 1160, "height": 1760})
                with Image.open(io.BytesIO(png)) as im:
                    im = im.convert("RGB").resize((724, 1100), Image.LANCZOS)
                    destino = web / f"{clave}-{letra}.webp"
                    im.save(destino, "WEBP", quality=88)
                h = sha(destino)
                entrada[letra] = {"archivo": f"web/revision/{lote}/{destino.name}?v={h[:10]}", "sha256": h, "descripcion": desc}
            o = R / original
            entrada["original"] = {"archivo": f"{original}?v={sha(o)[:10]}", "sha256": sha(o)}
            cartas.append(entrada)
        nav.close()
    datos = {"lote": lote, "etapa": "montaje",
             "nota": "Cartas terminadas: arte ya votado o aprobado con marco, título, emblema y leyenda. Original = arte actual sin marco.",
             "cartas": cartas}
    (web / "lote.json").write_text(json.dumps(datos, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    indice_p = R / "web/revision/lotes.json"
    indice = json.loads(indice_p.read_text(encoding="utf-8"))
    indice["lotes"] = [l for l in indice["lotes"] if l["lote"] != lote]
    indice["lotes"].insert(0, {"lote": lote, "titulo": f"{lote} · cartas terminadas · {len(cartas)} piezas",
                               "ruta": f"web/revision/{lote}/lote.json"})
    indice_p.write_text(json.dumps(indice, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print("Listo:", len(cartas), "piezas en", web.relative_to(R))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "montaje-01")
