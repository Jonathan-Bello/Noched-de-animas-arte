"""Tarjeta de cordura con clip (alternativa a las fichas impresas en 3D).

Genera la plantilla SVG de 64 x 94 mm (corte 58 x 88 con 3 mm de sangrado) y, para cada
investigador con retrato, una vista previa con su retrato en la zona de ilustración.
La ilustración definitiva la hace ChatGPT con la ficha fabrica/fichas/cordura.md.

Uso: python3 herramientas/tarjeta_cordura.py
Salida: web/plantillas/tarjeta-cordura.svg y web/plantillas/cordura/<investigador>.svg/.png
"""
import base64
import json
import re
from pathlib import Path

R = Path(__file__).resolve().parent.parent
PAL = json.loads((R / "web/plantillas/paleta.json").read_text(encoding="utf-8"))
OUT = R / "web/plantillas"
ICONO = (R / "iconos/cartas/svg/caceria.svg").read_text(encoding="utf-8")
ICONO_PATH = re.search(r'<path[^>]*d="([^"]+)"', ICONO).group(1)

CREMA, GUINDA, MORADO, AMBAR, TINTA = "#F1DBAC", "#712236", "#5E3C53", "#D8954B", "#171117"
FRANJA = PAL["franjas"].get("consulta", {}).get("hex", "#3B2418")
ORO = "#E2A447"

# Zonas en mm (coordenadas con sangrado)
TOP, BOT = 11.7, 82.3          # zona de ilustración y escala
ESC_X, ESC_W = 44.0, 16.8      # columna de la escala, pegada al borde derecho (donde entra el clip)
PASO = (BOT - TOP) / 11


def tarjeta(nombre: str | None = None, retrato: Path | None = None) -> str:
    imagen = ""
    if retrato and retrato.exists():
        datos = base64.b64encode(retrato.read_bytes()).decode()
        imagen = (f'<image href="data:image/webp;base64,{datos}" x="3.2" y="{TOP}" width="{ESC_X - 3.2}" height="{BOT - TOP}" '
                  f'preserveAspectRatio="xMidYMax slice" clip-path="url(#zonaIlus)"/>')
    else:
        imagen = (f'<text x="{(3.2 + ESC_X) / 2}" y="{(TOP + BOT) / 2}" fill="{CREMA}" font-size="3" text-anchor="middle" '
                  f'font-family="Leyenda Carta, Liberation Serif, serif" font-style="italic">Retrato del investigador</text>')
    celdas = []
    for i, n in enumerate(range(10, -1, -1)):
        y = TOP + i * PASO
        peligro = n <= 4
        relleno = GUINDA if peligro else (CREMA if n >= 8 else "#E8C98F")
        color_n = CREMA if peligro else TINTA
        celdas.append(f'<rect x="{ESC_X}" y="{y:.3f}" width="{ESC_W}" height="{PASO:.3f}" fill="{relleno}" stroke="{TINTA}" stroke-width=".25"/>')
        celdas.append(f'<text x="{ESC_X + 6.3}" y="{y + PASO * .72:.3f}" fill="{color_n}" font-size="4.4" text-anchor="middle" '
                      f'font-family="Titulo Carta, DejaVu Serif Condensed, serif" font-weight="700">{n}</text>')
        # muesca donde se alinea el borde del clip
        celdas.append(f'<path d="M{ESC_X + ESC_W - 1.6} {y + PASO / 2:.3f} h1.6" stroke="{color_n}" stroke-width=".35" opacity=".7"/>')
        if n == 10:
            celdas.append(f'<text x="{ESC_X + 11.3}" y="{y + PASO * .62:.3f}" fill="{TINTA}" font-size="1.6" text-anchor="middle" font-family="DejaVu Sans Condensed, sans-serif">inicio</text>')
        if n == 8:
            celdas.append(f'<text x="{ESC_X + 11.3}" y="{y + PASO * .48:.3f}" fill="{TINTA}" font-size="1.45" text-anchor="middle" font-family="DejaVu Sans Condensed, sans-serif">inicio</text>'
                          f'<text x="{ESC_X + 11.3}" y="{y + PASO * .8:.3f}" fill="{TINTA}" font-size="1.45" text-anchor="middle" font-family="DejaVu Sans Condensed, sans-serif">con 4</text>')
    y4 = TOP + 6 * PASO
    # ícono de cacería junto a la franja de peligro
    icono = (f'<g transform="translate({ESC_X + 9.6} {y4 + 1.2}) scale(.24)"><path d="{ICONO_PATH}" fill="{CREMA}" fill-rule="evenodd"/></g>')
    titulo = "Cordura" + (f" · {nombre}" if nombre else "")
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="64mm" height="94mm" viewBox="0 0 64 94">
<title>Tarjeta de cordura{(" de " + nombre) if nombre else ""}</title>
<desc>Corte 58 x 88 mm, sangrado 3 mm. La escala va pegada al borde derecho para el clip; la franja de 4 o menos es la zona de cacería.</desc>
<defs><clipPath id="zonaIlus"><rect x="3.2" y="{TOP}" width="{ESC_X - 3.2}" height="{BOT - TOP}"/></clipPath></defs>
<rect width="64" height="94" fill="{MORADO}"/>
<rect x="3" y="3" width="58" height="88" fill="{TINTA}"/>
<g id="ilustracion">{imagen}</g>
<g id="escala">{''.join(celdas)}{icono}</g>
<g id="titulo"><rect x="3.2" y="3.2" width="57.6" height="8.5" fill="{FRANJA}"/>
<text x="7" y="9.2" fill="{CREMA}" font-size="4.6" font-family="Titulo Carta, DejaVu Serif Condensed, serif" font-weight="700">{titulo}</text></g>
<g id="leyenda"><rect x="3.2" y="{BOT}" width="57.6" height="8.5" fill="{CREMA}"/>
<text x="32" y="{BOT + 5.4}" fill="{TINTA}" font-size="3" text-anchor="middle" font-family="Leyenda Carta, Liberation Serif, serif" font-style="italic">Con 4 o menos, te pueden cazar.</text></g>
<rect id="marco" x="3.6" y="3.6" width="56.8" height="86.8" rx=".8" fill="none" stroke="{ORO}" stroke-width=".9"/>
</svg>'''


def main():
    (OUT / "tarjeta-cordura.svg").write_text(tarjeta(), encoding="utf-8")
    carpeta = OUT / "cordura"
    carpeta.mkdir(exist_ok=True)
    hechos = []
    for nombre, archivo in [("Inés", "ines"), ("Rafael", "rafael"), ("Tomás", "tomas"), ("Amalia", "amalia"), ("Padre Mateo", "mateo")]:
        svg = tarjeta(nombre, R / f"web/mesa/arte/inv_{archivo}.webp")
        (carpeta / f"{archivo}.svg").write_text(svg, encoding="utf-8")
        hechos.append(carpeta / f"{archivo}.svg")
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            b = p.chromium.launch()
            pg = b.new_page(viewport={"width": 756, "height": 1110})
            for f in [OUT / "tarjeta-cordura.svg", *hechos]:
                pg.set_content(f'<style>body{{margin:0}}svg{{width:756px;height:1110px;display:block}}</style>{f.read_text(encoding="utf-8")}')
                pg.screenshot(path=str(f.with_suffix(".png")))
            b.close()
    except ImportError:
        print("Sin Playwright: solo se generaron los SVG.")
    print("Listo:", OUT / "tarjeta-cordura.svg", "y", len(hechos), "vistas previas")


if __name__ == "__main__":
    main()
