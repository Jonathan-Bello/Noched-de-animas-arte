"""Genera las dos vistas públicas del canon con Pillow y originales verificados."""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
from tempfile import NamedTemporaryFile

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'web/miniaturas'
VIEWS = [('miniatura', 290, 440, 80, ''), ('media', 580, 880, 82, '@2x')]


def save(path, data):
    with NamedTemporaryFile(dir=path.parent, delete=False) as tmp:
        tmp.write(data)
    os.replace(tmp.name, path)


def generate(source_dir):
    canon = json.loads((ROOT / 'catalogo/canon.cartas.json').read_text())
    base = canon['base']
    OUTPUT.mkdir(parents=True, exist_ok=True)
    records = []
    for item in base['cartas'] + base['reversos']:
        source = item['formatos']['webp']
        path = Path(source['objeto'])
        original = (source_dir / path.name if source_dir else ROOT / path).read_bytes()
        digest = hashlib.sha256(original).hexdigest()
        if digest != source['sha256']:
            raise ValueError(f"{path}: el SHA-256 no coincide; comprueba la descarga LFS")
        record = {'id': item['id'], 'original': str(path), 'sha256_original': digest}
        with Image.open(io.BytesIO(original)) as image:
            for label, width, height, quality, suffix in VIEWS:
                scaled = image.resize((width, height), Image.Resampling.LANCZOS)
                limit = 40_000 if label == 'miniatura' else 150_000
                # A 290 px, atenuar solo el grano más fino si rebasa el presupuesto.
                for radius in (0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8):
                    view = scaled.filter(ImageFilter.GaussianBlur(radius)) if radius else scaled
                    data = io.BytesIO()
                    view.save(data, 'WEBP', quality=quality, method=6)
                    encoded = data.getvalue()
                    if len(encoded) < limit:
                        break
                else:
                    raise ValueError(f"{item['id']}: la vista {label} excede el presupuesto")
                name = f"{item['id']}{suffix}.webp"
                save(OUTPUT / name, encoded)
                record[label] = {'archivo': name, 'bytes': len(encoded),
                                 'sha256': hashlib.sha256(encoded).hexdigest()}
        records.append(record)
    save(OUTPUT / 'manifest.json', (json.dumps({'canon': canon['version'], 'imagenes': records},
                                               ensure_ascii=False, indent=2) + '\n').encode())


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--origen', type=Path, help='Directorio opcional de originales por nombre SHA-256')
    generate(parser.parse_args().origen)
