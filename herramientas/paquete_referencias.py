"""Empaqueta las vistas medias verificadas y su correspondencia con el juego."""
import argparse
import hashlib
import json
import os
from pathlib import Path
from tempfile import NamedTemporaryFile
from zipfile import ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]


def load(path):
    return json.loads((ROOT / path).read_text())


def package(destination):
    canon = load('catalogo/canon.cartas.json')['base']
    game = load('fabrica/catalogo_juego.json')
    media = {r['id']: r['media'] for r in load('web/miniaturas/manifest.json')['imagenes']}
    index = {}
    for card in game['cartas'] + game['reversos']:
        index.setdefault(card.get('id_arte'), []).append(card)
    manifest = []
    destination.parent.mkdir(parents=True, exist_ok=True)
    with NamedTemporaryFile(dir=destination.parent, delete=False) as tmp:
        temp = Path(tmp.name)
    try:
        with ZipFile(temp, 'w') as archive:
            for card in canon['cartas'] + canon['reversos']:
                art_id = card['id']
                view = media[art_id]
                data = (ROOT / 'web/miniaturas' / view['archivo']).read_bytes()
                if hashlib.sha256(data).hexdigest() != view['sha256']:
                    raise ValueError(f'Vista media dañada: {art_id}')
                filename = f'cartas/{art_id}.webp'
                archive.writestr(ZipInfo(filename), data)
                for entry in index.get(art_id, [{}]):
                    manifest.append({'id_juego': entry.get('id'), 'id_arte': art_id,
                                     'nombre': entry.get('nombre', card['nombre']),
                                     'tipo': entry.get('tipo', 'reverso' if card in canon['reversos'] else None),
                                     'reverso': entry.get('reverso', card.get('reverso_id')),
                                     'archivo': filename})
            archive.writestr(ZipInfo('manifest.json'), json.dumps(manifest, ensure_ascii=False, indent=2))
        os.replace(temp, destination)
    finally:
        temp.unlink(missing_ok=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('destino', type=Path)
    package(parser.parse_args().destino)
