"""Revisa los guiones de un lote contra las reglas de familia antes de mandarlos a ilustrar.

Detecta tres errores que hicieron rechazar casi todo el lote comparativa-01:
  1. Naipes, mazos o cartas dibujados en escenas donde no corresponden.
  2. Investigadores (o cualquier persona) en Identidades y Espantos: ahí solo aparece el ánima.
  3. Variantes que piden replicar la composición de la carta actual en vez de proponer una escena nueva.

Uso:
  python3 .agents/skills/fabrica-cartas-animas/scripts/revisar_guiones.py --lote comparativa-01
  python3 .agents/skills/fabrica-cartas-animas/scripts/revisar_guiones.py --texto es_cadejo "El Cadejo ..."

Devuelve código 1 si hay observaciones. Las reglas completas están en referencias/familias.md.
"""
import argparse
import json
import re
import sys
from pathlib import Path

R = Path(__file__).resolve().parents[4]

# Cartas donde los naipes forman parte del efecto: revelan la mano del ánima o son el objeto.
NAIPES_PERMITIDOS = {"t5", "espejo_plata", "espejo_obsidiana", "tarot"}
NAIPES = re.compile(r"\b(cartas?|naipes?|mazo|abanico de cartas|dorsos?|baraja)\b", re.I)
PERSONAS = re.compile(r"\b(Inés|Rafael|Tomás|Amalia|Mateo|investigador(es|a)?|jugador(es)?|"
                      r"hombre|mujer|niñ[oa]s?|persona|alguien|tobillos?|manos? viva)\b", re.I)
REPLICA = re.compile(r"\b(se conserva|mantener la composición|igual que la carta|replica[r]?|"
                     r"como en la carta actual|misma composición)\b", re.I)
SOLO_ANIMA = {"identidad", "espanto"}


def familia(card_id, tipo=None):
    if tipo:
        return tipo
    if card_id.startswith("es_"):
        return "espanto"
    if card_id.startswith("id_"):
        return "identidad"
    return ""


def revisar(card_id, tipo, texto):
    obs = []
    if card_id not in NAIPES_PERMITIDOS and NAIPES.search(texto):
        obs.append(f"naipes «{NAIPES.search(texto).group(0)}»: traducir la mecánica a un hecho de la casa "
                   "(papeles, objetos, sombras) o quitarla")
    if familia(card_id, tipo) in SOLO_ANIMA and PERSONAS.search(texto):
        obs.append(f"persona «{PERSONAS.search(texto).group(0)}» en {tipo or familia(card_id)}: "
                   "solo aparece el ánima; contar la consecuencia con el entorno")
    if REPLICA.search(texto):
        obs.append(f"réplica «{REPLICA.search(texto).group(0)}»: proponer una escena nueva de la misma leyenda")
    return obs


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--lote")
    p.add_argument("--texto", nargs=2, metavar=("ID", "GUION"))
    p.add_argument("--tipo", help="tipo de carta si el ID no lo indica (identidad, espanto…)")
    a = p.parse_args()
    filas = []
    if a.lote:
        d = json.loads((R / "fabrica/tirajes" / a.lote / "descripciones.json").read_text(encoding="utf-8"))
        for c in d["cartas"]:
            for k, v in (c.get("variantes") or {}).items():
                if not v:
                    continue
                filas.append((c["id"], c.get("tipo", ""), k, v))
    elif a.texto:
        filas.append((a.texto[0], a.tipo or "", "-", a.texto[1]))
    else:
        p.error("usar --lote o --texto")
    n = 0
    for cid, tipo, var, texto in filas:
        for o in revisar(cid, tipo, texto):
            n += 1
            print(f"{cid} {var.upper()}: {o}")
    print(f"{n} observaciones en {len(filas)} guiones")
    return 1 if n else 0


if __name__ == "__main__":
    sys.exit(main())
