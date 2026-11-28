"""Lectura común de las fuentes de la fábrica para la skill fabrica-cartas-animas.

No guarda decisiones propias: todo sale de los archivos del repositorio.
- fabrica/descripciones/descripciones.json  (generado desde datos_*.py)
- fabrica/catalogo_juego.json                (generado desde el repo del juego)
- fabrica/seleccion-visual.json              (votos del autor)
- fabrica/PERSONAJES.md, fabrica/CONTINUIDAD.md, guias/ESTILO_DE_CARTAS.md
"""
import hashlib
import json
import re
from pathlib import Path

# La skill vive en <repo>/.agents/skills/<nombre>/scripts/ o en su copia de .claude/skills/;
# las dos están a la misma profundidad, así que la raíz es la misma.
R = Path(__file__).resolve().parents[4]
if not (R / "fabrica" / "descripciones").is_dir():
    raise SystemExit(f"No encuentro la fábrica desde {Path(__file__).resolve()}. Ejecuta la skill dentro del repo de arte.")

INVESTIGADORES = {"Inés": "ines", "Rafael": "rafael", "Tomás": "tomas", "Amalia": "amalia", "Padre Mateo": "mateo"}

# Misma agrupación que herramientas/descripciones.py (FAMILIAS). Si cambia allá, cambia aquí;
# comprobar.py lo verifica.
FAMILIAS = [
    ("Herramientas", ["herramienta"]),
    ("Apoyos y reacciones", ["apoyo", "reaccion"]),
    ("Alba y objetos malditos", ["marcador", "objeto"]),
    ("Acciones del ánima", ["anima"]),
    ("Habilidades de evidencia", ["habilidad"]),
    ("Identidades de las ánimas", ["identidad"]),
    ("Espantos", ["espanto"]),
    ("Evidencias", ["evidencia"]),
    ("Roles (Los testigos de la casona)", ["rol"]),
    ("Cartas de espíritu", ["espiritu"]),
    ("Consulta, reglas y componentes", ["consulta", "reglas", "componente"]),
]

# Qué se hace con cada estado del catálogo de descripciones.
ACCION = {
    "rehacer": ("generar", "Ilustrar únicamente las variantes encargadas."),
    "falta": ("generar", "Ilustrar únicamente las variantes encargadas."),
    "conservar": ("referencia", "No se genera: es referencia de acabado de su familia."),
    "rol aprobado": ("montaje", "No se genera arte: la ilustración ya está aprobada; solo requiere montaje cuando el autor lo pida."),
    "en espera": ("pendiente", "Pendiente de reglas: no se genera hasta que el autor cierre las reglas."),
    "documentación": ("pendiente", "Es documentación: no se genera."),
    "por decidir": ("preguntar", "Preguntar al autor antes de generar."),
}


def leer(ruta):
    return json.loads((R / ruta).read_text(encoding="utf-8"))


def texto(ruta):
    return (R / ruta).read_text(encoding="utf-8")


def sha256(ruta):
    with (R / ruta).open("rb") as f:
        return hashlib.file_digest(f, "sha256").hexdigest()


def familia(tipo):
    for titulo, tipos in FAMILIAS:
        if tipo in tipos:
            return titulo, tipos
    return tipo, [tipo]


def miniatura(id_arte):
    return f"web/miniaturas/{id_arte}@2x.webp" if id_arte else None


class Fabrica:
    def __init__(self):
        self.desc = {c["id"]: c for c in leer("fabrica/descripciones/descripciones.json")["cartas"]}
        self.cat_json = leer("fabrica/catalogo_juego.json")
        self.cat = {c["id"]: c for c in self.cat_json["cartas"]}
        self.votos = {c["id"]: c for c in leer("fabrica/seleccion-visual.json")["cartas"] if not c.get("pieza")}
        self.personajes = self._personajes()
        self.modelos = self._modelos()
        self.notas = self._notas()
        self.modificar = self._modificar()

    # --- PERSONAJES.md -------------------------------------------------
    def _personajes(self):
        md = texto("fabrica/PERSONAJES.md")
        out = {}
        for fila in re.findall(r"^\| \*\*([^*]+)\*\* \|(.+)\|\s*$", md, re.M):
            nombre, resto = fila
            celdas = [c.strip() for c in resto.split("|")]
            out[nombre] = celdas
        for num, nombre, rasgos, paleta in re.findall(r"^\| (\d+) \| ([^|]+?) \| ([^|]+?) \| ([^|]+?) \|\s*$", md, re.M):
            out[nombre] = [rasgos, paleta]
        return out

    # --- CONTINUIDAD.md ------------------------------------------------
    def _modelos(self):
        # Solo la tabla de «Continuidad temporal y de utilería»; la de dummies es de identidad.
        md = texto("fabrica/CONTINUIDAD.md").split("## Continuidad temporal", 1)[-1].split("\n## ", 1)[0]
        return {ida: (nombre, nota.strip()) for nombre, ida, nota in
                re.findall(r"^\| \[([^\]]+)\]\(\.\./web/miniaturas/([^@)]+)@2x\.webp\) \| (.+?) \|\s*$", md, re.M)}

    def _notas(self):
        md = texto("fabrica/CONTINUIDAD.md")
        return dict(re.findall(r"^- ([A-ZÁÉÍÓÚÑ][^:\n]{2,40}): (.+)$", md, re.M))

    # --- ESTILO_DE_CARTAS.md -------------------------------------------
    def _modificar(self):
        md = texto("guias/ESTILO_DE_CARTAS.md")
        m = re.search(r"\*\*Artes que el autor quiere modificar\*\* — ([^.]+)\.", md)
        if not m:
            return set()
        return {n.strip() for n in re.split(r",| y ", m.group(1)) if n.strip()}

    # --- Personas de una carta ----------------------------------------
    def personas(self, cadena):
        if not cadena:
            return []
        if "5 investigadores" in cadena:
            return list(INVESTIGADORES)
        return [n for n in INVESTIGADORES if n in cadena or (n == "Padre Mateo" and "Mateo" in cadena)]

    def rol(self, cadena):
        if cadena and "·" in cadena:
            return cadena.split("·")[0].strip()
        return None

    def relacionadas(self, cid):
        """Cartas ligadas por el juego: herramienta ↔ evidencia que busca."""
        c = self.cat.get(cid, {})
        rel = []
        if c.get("evidencia"):
            rel += [x["id"] for x in self.cat.values() if x["tipo"] == "evidencia" and x["nombre"] == c["evidencia"]]
        if c.get("tipo") == "evidencia":
            rel += [x["id"] for x in self.cat.values() if x.get("evidencia") == c["nombre"]]
        if c.get("anima"):
            rel += [x["id"] for x in self.cat.values() if x["tipo"] == "identidad" and x["nombre"] == c["anima"]]
        return [r for r in rel if r != cid]

    # --- Referencias ---------------------------------------------------
    def referencias(self, cid):
        d, c = self.desc[cid], self.cat.get(cid, {})
        refs = {}

        def add(ruta, funcion, aporta, usar=True):
            if not ruta:
                return
            # Una imagen se adjunta si al menos una de sus funciones es utilizable
            # (p. ej. el modelo del aparato de un arte que el autor quiere cambiar).
            r = refs.setdefault(ruta, {"ruta": ruta, "funciones": [], "aporta": [], "usar": False})
            r["funciones"].append(funcion)
            r["aporta"].append(aporta)
            r["usar"] = r["usar"] or usar

        tipo = d["tipo"]
        # 1. Identidad de las personas
        for p in self.personas(d.get("personaje")):
            slug = INVESTIGADORES[p]
            sufijo = "_espiritu" if tipo == "espiritu" else ""
            rasgos = self.personajes.get(p, ["", "", ""])
            add(f"web/mesa/arte/inv_{slug}{sufijo}.webp", "identidad del investigador",
                f"{p}: {rasgos[0]}. Vestuario: {rasgos[1]}. Objetos: {rasgos[2]}.")
            # apariciones de esa persona en cartas elegidas por el autor (Conservar primero; máximo 2)
            elegidas = []
            for o in self.desc.values():
                if o["id"] == cid or o["estado"] in ("en espera", "documentación") or not o["id_arte"]:
                    continue
                if p not in self.personas(o.get("personaje")) or o["nombre"] in self.modificar:
                    continue
                # El campo personaje describe la escena nueva; la persona debe verse en el arte vigente.
                v = self.votos.get(o["id"])
                se_ve = p.split()[-1] in o["arte_actual"]
                if o["estado"] == "conservar":
                    elegidas.append((0 if se_ve else 1, o))
                elif se_ve and v and v["voto"] == "original" and v["alcance"] == "preferencia_visual":
                    elegidas.append((2, o))
            for _, o in sorted(elegidas, key=lambda t: t[0])[:2]:
                add(miniatura(o["id_arte"]), "identidad en una carta elegida",
                    f"{p} tal como aparece en «{o['nombre']}» ({o['id']}): rasgos, ropa y volumen ya aceptados.")
        if tipo == "rol" and c.get("ilustracion_aprobada"):
            add(c["ilustracion_aprobada"], "identidad aprobada del rol", f"Ilustración aprobada de {d.get('personaje')}; manda rostro y vestuario.")
        # 2. Ánima: la identidad manda
        if c.get("anima"):
            for x in self.cat.values():
                if x["tipo"] == "identidad" and x["nombre"] == c["anima"]:
                    rasgos = self.personajes.get(c["anima"], ["", ""])
                    add(miniatura(x["id_arte"]), "identidad del ánima", f"{c['anima']}: {rasgos[0]}. Paleta: {rasgos[1]}.")
        # 3. Modelo del aparato (tabla de CONTINUIDAD)
        if d["id_arte"] in self.modelos:
            nombre, nota = self.modelos[d["id_arte"]]
            add(miniatura(d["id_arte"]), "modelo del aparato", nota)
        # 4. Votos del autor
        v = self.votos.get(cid)
        if v and (v["voto"] == "ninguna" or not v.get("archivo")):  # voto de guion: no hay imagen elegida
            v = None
        vigente = v and (R / v["archivo"]).is_file() and sha256(v["archivo"]) == v["sha256"]
        if v and not vigente:
            # La imagen votada se sustituyó después del voto: no es la que eligió el autor.
            add(v["archivo"], f"voto {v['voto']} desactualizado",
                f"El archivo ya no coincide con el hash votado en {v['lote']}; votar de nuevo en el selector.", usar=False)
            v = None
        if v:
            if d["nombre"] in self.modificar:
                add(v["archivo"], f"voto {v['voto']} anterior · superado",
                    "Indicación posterior del autor: quiere modificar esta carta. El voto ya no la vuelve referencia.", usar=False)
            elif "concepto" in v["alcance"]:
                add(v["archivo"], "concepto de escena (voto %s)" % v["voto"].upper(),
                    "El autor eligió la idea, no el dibujo: describir la acción con palabras; no usar como referencia de acabado.", usar=False)
            elif v["voto"] == "original":
                add(v["archivo"], "versión preferida por el autor", f"En el lote {v['lote']} el autor prefirió el original frente a las propuestas: acabado y lectura de referencia; la escena nueva sigue la ficha.")
            else:
                add(v["archivo"], f"propuesta preferida (voto {v['voto'].upper()})", "Preferencia visual del autor en la ronda anterior.")
        # 5. Arte actual
        if d["id_arte"] and d["estado"] in ("rehacer", "falta"):
            if d["nombre"] in self.modificar:
                add(miniatura(d["id_arte"]), "arte actual · el autor quiere modificarlo",
                    "No usar como referencia de estilo ni de composición; sirve para saber qué no repetir.", usar=False)
            elif not (v and v["voto"] == "original"):
                add(miniatura(d["id_arte"]), "arte actual", "Solo para la escena; el estilo se toma de las cartas elegidas.")
        # 6. Acabado de la familia: cartas Conservar
        fam, tipos = familia(tipo)
        n = 0
        for o in self.desc.values():
            if o["tipo"] in tipos and o["estado"] == "conservar" and o["id"] != cid and o["id_arte"] and n < 3:
                add(miniatura(o["id_arte"]), "acabado de la familia", f"«{o['nombre']}» ({o['id']}), carta Conservar de {fam}: materiales, planos y nivel de detalle.")
                n += 1
        out = []
        for r in refs.values():
            r["existe"] = (R / r["ruta"]).is_file()
            r["sha256"] = sha256(r["ruta"]) if r["existe"] else None
            out.append(r)
        return out

    def _escena(self, r):
        o = self.desc[r]
        if o["estado"] in ("rehacer", "falta"):
            escena = o["propuesta"]
        else:
            escena = "(se conserva) " + o["arte_actual"]
        return {"id": r, "nombre": o["nombre"], "estado": o["estado"], "escena_a": escena, "escena_b": o["alternativa"]}

    def ficha(self, cid):
        if cid not in self.desc:
            raise SystemExit(f"El ID «{cid}» no está en fabrica/descripciones/descripciones.json")
        d, c = self.desc[cid], self.cat.get(cid, {})
        fam, _ = familia(d["tipo"])
        clave, accion = ACCION[d["estado"]]
        return {
            "id": cid, "nombre": d["nombre"], "tipo": d["tipo"], "familia": fam, "copias": d["copias"],
            "reverso": d["reverso"], "id_arte": d["id_arte"], "uso": c.get("uso", ""), "estado": d["estado"],
            "accion": clave, "accion_texto": accion, "personaje": d.get("personaje"),
            "personas": self.personas(d.get("personaje")), "rol": self.rol(d.get("personaje")),
            "representa": d["representa"], "arte_actual": d["arte_actual"], "lectura_clave": d["lectura_clave"],
            "escena_a": d["propuesta"], "escena_b": d["alternativa"],
            "nota_continuidad": (lambda n: n[:1].upper() + n[1:] if n else None)(self.notas.get(d["nombre"])),
            "voto": self.votos.get(cid),
            "relacionadas": [self._escena(r) for r in self.relacionadas(cid) if r in self.desc],
            "referencias": self.referencias(cid),
        }
