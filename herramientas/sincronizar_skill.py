"""Copia la skill central a la entrada de Claude Code y detecta divergencias.

Versión editable:   .agents/skills/<skill>/   (la lee Codex)
Copia generada:     .claude/skills/<skill>/   (la lee Claude Code)

Uso:
  python3 herramientas/sincronizar_skill.py              # actualiza la copia
  python3 herramientas/sincronizar_skill.py --comprobar  # falla si difieren (lo corre el CI)
"""
import argparse
import filecmp
import re
import shutil
import sys
from pathlib import Path

R = Path(__file__).resolve().parent.parent
CENTRAL = R / ".agents" / "skills"
COPIA = R / ".claude" / "skills"
IGNORAR = {"__pycache__", ".DS_Store"}


def archivos(raiz):
    return {p.relative_to(raiz).as_posix() for p in raiz.rglob("*")
            if p.is_file() and not IGNORAR.intersection(p.relative_to(raiz).parts)}


def validar(skill):
    md = (skill / "SKILL.md").read_text(encoding="utf-8")
    m = re.match(r"---\n(.*?)\n---\n", md, re.S)
    if not m:
        return ["SKILL.md no empieza con frontmatter YAML"]
    campos = dict(re.findall(r"^(\w[\w-]*): (.+)$", m.group(1), re.M))
    errores = []
    if campos.get("name") != skill.name:
        errores.append(f"name «{campos.get('name')}» no coincide con la carpeta «{skill.name}»")
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", campos.get("name", "")) or len(campos.get("name", "")) > 64:
        errores.append("name debe ser minúsculas, números y guiones (máx. 64)")
    if not 1 <= len(campos.get("description", "")) <= 1024:
        errores.append("description debe tener entre 1 y 1024 caracteres")
    # Los enlaces relativos deben abrir desde la skill (y, por la misma profundidad, desde su copia).
    for doc in skill.rglob("*.md"):
        for destino in re.findall(r"\]\(([^)#:]+)(?:#[^)]*)?\)", doc.read_text(encoding="utf-8")):
            if not (doc.parent / destino).resolve().exists():
                errores.append(f"{doc.relative_to(skill)}: enlace roto {destino}")
    return errores


def main():
    a = argparse.ArgumentParser()
    a.add_argument("--comprobar", action="store_true")
    p = a.parse_args()
    errores = []
    for skill in sorted(d for d in CENTRAL.iterdir() if (d / "SKILL.md").is_file()):
        errores += [f"{skill.name}: {e}" for e in validar(skill)]
        destino = COPIA / skill.name
        fuente, copia = archivos(skill), archivos(destino) if destino.exists() else set()
        distintos = sorted(f for f in fuente & copia if not filecmp.cmp(skill / f, destino / f, shallow=False))
        faltan, sobran = sorted(fuente - copia), sorted(copia - fuente)
        if p.comprobar:
            for f in distintos:
                errores.append(f"{skill.name}/{f}: la copia de .claude difiere (edita .agents y sincroniza)")
            for f in faltan:
                errores.append(f"{skill.name}/{f}: falta en .claude")
            for f in sobran:
                errores.append(f"{skill.name}/{f}: sobra en .claude")
            continue
        for f in faltan + distintos:
            (destino / f).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(skill / f, destino / f)
        for f in sobran:
            (destino / f).unlink()
        print(f"{skill.name}: {len(faltan)} nuevos, {len(distintos)} actualizados, {len(sobran)} eliminados")
    if errores:
        print("\n".join("✗ " + e for e in errores))
        sys.exit(1)
    if p.comprobar:
        print("OK: .agents/skills y .claude/skills son idénticas.")


if __name__ == "__main__":
    main()
