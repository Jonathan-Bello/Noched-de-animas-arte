"""Hoja de revisión de las variantes A y B de una carta (paso e del tiraje).

Pone cada variante ampliada y en la carta a 58 x 88 mm, con la franja del título y el panel de
leyenda tapados (sin texto), junto a las referencias de la ficha al mismo tamaño.

Uso:
  python3 .agents/skills/fabrica-cartas-animas/scripts/revisar.py t3 --a ruta/a.png --b ruta/b.png [--salida hoja.png]

Requiere Pillow. La hoja es para revisar: no se publica ni se aprueba con ella.
"""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from comun import R, Fabrica

PPMM = 96 / 25.4          # tamaño real en una pantalla de 96 ppp
AMPLIADA = 900            # alto de la vista ampliada, en px
CREMA, TINTA = (241, 219, 172), (23, 17, 23)


def fuente(t):
    for nombre in ("DejaVuSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "Arial.ttf"):
        try:
            return ImageFont.truetype(nombre, t)
        except OSError:
            pass
    return ImageFont.load_default()


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def en_carta(img, franja, escala=PPMM * 4, reducir=True):
    """Monta la ilustración en 64 x 94 mm (con sangrado), tapa título y leyenda y recorta a 58 x 88."""
    W, H = round(64 * escala), round(94 * escala)
    im = img.convert("RGB")
    k = max(W / im.width, H / im.height)
    im = im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)
    x, y = (im.width - W) // 2, (im.height - H) // 2
    im = im.crop((x, y, x + W, y + H))
    d = ImageDraw.Draw(im)
    mm = lambda v: round(v * escala)
    d.rectangle([mm(3.2), mm(3.2), mm(60.8), mm(11.7)], fill=franja)        # franja de título
    d.rectangle([mm(3.2), mm(82.3), mm(60.8), mm(90.8)], fill=CREMA)        # panel de leyenda
    d.rectangle([mm(3.6), mm(3.6), mm(60.4), mm(90.4)], outline=(226, 164, 71), width=max(1, mm(.9)))
    im = im.crop((mm(3), mm(3), mm(61), mm(91)))
    if not reducir:
        return im
    return im.resize((round(58 * PPMM), round(88 * PPMM)), Image.LANCZOS)


def con_franjas(im, frente):
    """Superponer título, leyenda y cantos del frente vigente en la prueba de corte."""
    base = frente.convert("RGB").resize(im.size, Image.LANCZOS)
    w, h = im.size
    caja = (round(w*.018), round(h*8.7/88), round(w*.982), round(h*79.3/88))
    base.paste(im.crop(caja), caja)
    return base


def prueba_pdf(salida, variantes, franja, referencia, frente):
    """Hoja Carta a escala física con imágenes independientes del zoom de pantalla."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import mm
    from reportlab.lib.utils import ImageReader
    from reportlab.pdfgen import canvas

    pdf = canvas.Canvas(str(salida), pagesize=letter)
    pdf.drawString(12*mm, 255*mm, "Imprimir al 100 %. Verificar la regla de 50 mm.")
    pdf.line(12*mm, 243*mm, 62*mm, 243*mm)
    elementos = [(k, en_carta(im, franja, escala=12, reducir=False)) for k, im in variantes.items()]
    if frente:
        with Image.open(frente) as impreso:
            elementos = [(nombre, con_franjas(im, impreso)) for nombre, im in elementos]
    if referencia:
        with Image.open(referencia) as original:
            elementos.append(("Carta base", original.convert("RGB")))
    for i, (nombre, im) in enumerate(elementos):
        x = (12 + i*65)*mm
        pdf.drawImage(ImageReader(im), x, 125*mm, width=58*mm, height=88*mm)
        pdf.drawString(x, 118*mm, nombre)
    pdf.drawString(12*mm, 99*mm, "Primero: objeto, acción y primer foco. Después: contacto, material y anatomía.")
    pdf.showPage()
    pdf.save()


def main():
    a = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    a.add_argument("id")
    a.add_argument("--a", required=True)
    a.add_argument("--b", required=True)
    a.add_argument("--salida")
    a.add_argument("--pdf", help="Prueba de corte 58 × 88 mm; requiere reportlab")
    a.add_argument("--base", help="Frente de referencia completo para comparar en la prueba PDF")
    p = a.parse_args()
    f = Fabrica().ficha(p.id)
    paleta = json.loads((R / "web/plantillas/paleta.json").read_text(encoding="utf-8"))
    franja = hex_rgb(paleta["franjas"].get(f["tipo"], {}).get("hex", "#3B2418"))
    variantes = {"A": Image.open(p.a), "B": Image.open(p.b)}
    refs = [r for r in f["referencias"] if r["usar"] and r["existe"]]
    punto = R / "guias/punto-de-estilo.json"  # las anclas de estilo se comparan siempre
    if punto.is_file():
        vistas = {r["ruta"] for r in refs}
        refs += [{"ruta": x["ruta"], "funciones": ["punto de estilo"]} for x in json.loads(punto.read_text(encoding="utf-8"))["referencias"] if x["ruta"] not in vistas]

    amp = {k: v.convert("RGB").resize((round(v.width * AMPLIADA / v.height), AMPLIADA), Image.LANCZOS) for k, v in variantes.items()}
    mesa = {k: en_carta(v, franja) for k, v in variantes.items()}
    cw, ch = mesa["A"].size
    m, cab = 24, 40
    ancho = max(sum(x.width for x in amp.values()) + 3 * m, (len(refs) + 2) * (cw + m) + m)
    alto = cab + AMPLIADA + m + cab + ch + 3 * m + 60
    hoja = Image.new("RGB", (ancho, alto), TINTA)
    d = ImageDraw.Draw(hoja)
    t, ts = fuente(22), fuente(14)
    inicio_amp = cab + ch + 2 * m + cab
    d.text((m, inicio_amp + 8), f"{f['id']} · {f['nombre']} · ampliadas", fill=CREMA, font=t)
    x = m
    for k, im in amp.items():
        hoja.paste(im, (x, inicio_amp + cab))
        d.text((x + 8, inicio_amp + cab + 8), k, fill=CREMA, font=t, stroke_width=2, stroke_fill=TINTA)
        x += im.width + m
    y = 0
    d.text((m, y + 8), "Leer primero en pequeño · simulación de corte 58 × 88 mm · referencias a la derecha", fill=CREMA, font=ts)
    y += cab
    x = m
    for k, im in mesa.items():
        hoja.paste(im, (x, y))
        d.text((x, y + ch + 6), f"Variante {k}", fill=CREMA, font=ts)
        x += cw + m
    for r in refs:
        im = Image.open(R / r["ruta"]).convert("RGB")
        im.thumbnail((cw, ch))
        hoja.paste(im, (x, y))
        d.text((x, y + ch + 6), r["funciones"][0][:28], fill=CREMA, font=ts)
        x += cw + m
    d.text((m, alto - 40), f"Al tapar el título debe leerse: {f['lectura_clave']}", fill=CREMA, font=ts)
    salida = Path(p.salida or f"revision-{f['id']}.png")
    hoja.save(salida)
    if p.pdf:
        frente = (R / f"web/miniaturas/{f['id_arte']}@2x.webp" if f["id_arte"] else None)
        prueba_pdf(p.pdf, variantes, franja, p.base or frente, frente)
    print(f"Hoja de revisión: {salida}")


if __name__ == "__main__":
    main()
