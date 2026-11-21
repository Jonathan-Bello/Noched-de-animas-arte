"""Actualizar el tablero público a partir del catálogo del juego."""
import json
from collections import Counter
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATUS = {
    "aprobado": "Aprobado",
    "candidato": "En revisión",
    "requiere_correccion": "Rehacer",
    "falta": "Falta",
    "aprobado_sin_marco": "Arte aprobado, falta la carta terminada",
}
NEXT = {
    "pentagrama": "Crear el arte a partir del concepto que defina Jonathan.",
    "rol_vigia": "Recuperar el parecido con la identidad ilustrada aprobada y conservar la camisa azul.",
    "rol_devota": "Revisar la caracterización y las variantes de la escena por separado.",
    "rol_velar": "Comparar la escena actual con la alternativa y seleccionar la ilustración.",
    "rol_manifestar": "Componer el marco y registrar la carta terminada.",
    "cordura": "Preparar la ilustración y componer la escala con la plantilla.",
}

def preview(piece):
    key = piece["id"]
    if key == "pentagrama":
        path, label = "archivo/arte/pentagrama.webp", "Prueba de composición"
    elif key == "rol_manifestar":
        path, label = "web/miniaturas/personajes/manifestar_original.webp", "Ilustración aprobada"
    else:
        return ""
    if not (ROOT / path).is_file():
        return ""
    return (f'<figure><img src="{path}" alt="{label} de {escape(piece["nombre"])}" '
            f'loading="lazy" width="100" style="max-width:100%;height:auto">'
            f'<figcaption>{label}</figcaption></figure>')

def board(catalog):
    parts = []
    for title, key in [("Cartas y componentes", "cartas"), ("Reversos", "reversos")]:
        pieces = catalog[key]
        counts = Counter(p["estado_arte"] for p in pieces)
        parts.append(f'<section><h2>{title}</h2><p>{len(pieces)} diseños en el catálogo.</p><ul>')
        for status, label in STATUS.items():
            if counts[status]:
                parts.append(f'<li>{label}: <b>{counts[status]}</b></li>')
        parts.append('</ul><div class="printing">')
        for p in pieces:
            status = p["estado_arte"]
            if status == "aprobado":
                continue
            code, name = escape(p["id"]), escape(p["nombre"])
            if key == "reversos":
                purpose = f'Identifica por detrás el grupo de cartas «{name}».'
                need = "Revisar y registrar la versión final del reverso."
            else:
                purpose = escape(p.get("uso") or "PENDIENTE: texto de Jonathan")
                need = NEXT.get(code, "Revisar el parecido y la escena y registrar la decisión sobre la carta.")
            if p.get("tipo") == "rol" and status == "aprobado_sin_marco":
                need = f'Componer el marco y la leyenda. <a href="personajes.html#rol-{code[4:]}">Ver ilustración aprobada</a>.'
            parts.append(f'<article><small>{STATUS[status]} · <code>{code}</code></small>'
                         f'<h3>{name}</h3>{preview(p)}<p>{purpose}</p><p><b>Trabajo pendiente.</b> {need}</p></article>')
        parts.append('</div></section>')
    return '\n'.join(parts)

if __name__ == "__main__":
    data = json.loads((ROOT / "fabrica/catalogo_juego.json").read_text(encoding="utf-8"))
    page = ROOT / "produccion.html"
    old = page.read_text(encoding="utf-8")
    start, end = "<!-- tablero-inicio -->", "<!-- tablero-fin -->"
    before, content = old.split(start)
    _, after = content.split(end)
    page.write_text(f"{before}{start}\n{board(data)}\n{end}{after}", encoding="utf-8")
