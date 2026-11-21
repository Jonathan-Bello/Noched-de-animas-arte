"""Genera las fichas públicas con el registro aprobado y las reglas del juego."""
import json
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def generar():
    roles = json.loads((ROOT / "catalogo/ilustraciones_roles_aprobadas.json").read_text())
    juego = json.loads((ROOT / "fabrica/catalogo_juego.json").read_text())
    fichas = []
    for carta in juego["cartas"]:
        if carta["tipo"] != "rol":
            continue
        rol = roles[carta["id"]]
        if rol["estado_arte"] != carta["estado_arte"]:
            raise ValueError("Regenerar primero el catálogo del juego")
        fichas.append(f'<article id="rol-{escape(carta["id"][4:])}"><a class="arte-rol" '
                      f'href="{escape(rol["ilustracion"])}"><img loading="lazy" width="448" height="672" '
                      f'src="{escape(rol["vista"])}" alt="{escape(rol["descripcion"])}"></a>'
                      f'<h3>{escape(rol["nombre"])}</h3><p><b>En el juego.</b> {escape(carta["uso"])}</p></article>')
    page = ROOT / "personajes.html"
    before, section = page.read_text().split("<!-- roles-inicio -->")
    _, after = section.split("<!-- roles-fin -->")
    page.write_text(before + '<!-- roles-inicio --><div class="fichas">' + "".join(fichas)
                    + '</div><!-- roles-fin -->' + after)

if __name__ == "__main__":
    generar()
