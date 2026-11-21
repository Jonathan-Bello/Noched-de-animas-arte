#!/usr/bin/env python3
"""Comprueba páginas de GitHub Pages y sus recursos, sin descargar arte original."""
import argparse
from html.parser import HTMLParser
from pathlib import Path
import sys
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
LFS_HOST = "media.githubusercontent.com"


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if values.get("id"):
            self.ids.add(values["id"])
        if tag == "img" and "alt" not in values:
            self.errors.append(f"línea {self.getpos()[0]}: imagen sin atributo alt")
        for key in ("src", "href", "poster", "srcset"):
            if not values.get(key):
                continue
            raw = values[key]
            urls = [s.strip().split()[0] for s in raw.split(",") if s.strip()] if key == "srcset" and not raw.startswith("data:") else [raw]
            self.links.extend((tag, url) for url in urls)


def inspect(root):
    pages = {}
    for path in sorted(root.rglob("*.html")):
        if any(part.startswith(".") or part in {"node_modules", "objetos"} for part in path.relative_to(root).parts):
            continue
        page = Page()
        page.feed(path.read_text(encoding="utf-8"))
        pages[path] = page
    errors = []
    for path, page in pages.items():
        name = path.relative_to(root)
        errors.extend(f"{name}: {e}" for e in page.errors)
        for tag, link in page.links:
            url = urlsplit(link)
            if tag != "a" and url.hostname == LFS_HOST:
                errors.append(f"{name}: carga LFS automática: {link}")
            if url.scheme or url.netloc:
                continue
            target = (path.parent / unquote(url.path)).resolve() if url.path else path
            if target.is_dir():
                target /= "index.html"
            if not target.is_relative_to(root) or not target.is_file():
                errors.append(f"{name}: recurso local inexistente: {link}")
                continue
            if url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
                errors.append(f"{name}: ancla inexistente: {link}")
            if tag in {"img", "source", "image"} and target.stat().st_size < 256:
                if target.read_bytes().startswith(b"version https://git-lfs.github.com/spec/"):
                    errors.append(f"{name}: la imagen apunta a un puntero LFS: {link}")
    return pages, sorted(set(errors))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--raiz", type=Path, default=ROOT)
    args = parser.parse_args()
    pages, errors = inspect(args.raiz.resolve())
    for error in errors:
        print(error, file=sys.stderr)
    print(f"{len(pages)} páginas, {len(errors)} incidencias.")
    return bool(errors) or not pages


if __name__ == "__main__":
    sys.exit(main())
