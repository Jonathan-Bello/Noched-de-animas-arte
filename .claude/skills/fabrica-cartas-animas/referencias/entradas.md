# Tres formas de usar la skill

La versión editable es una sola: `.agents/skills/fabrica-cartas-animas/`. Claude Code tiene una copia idéntica en `.claude/skills/fabrica-cartas-animas/`, generada con `herramientas/sincronizar_skill.py`. Se usa una copia y no un enlace simbólico porque en Windows y en la vista web de GitHub un enlace simbólico aparece como un archivo de texto con una ruta. La copia funciona igual en todas partes, y el CI avisa si las dos versiones divergen.

## 1. Claude Code sobre un checkout del repo

Claude Code descubre la skill en `.claude/skills/` al abrir el repositorio.

```
/fabrica-cartas-animas segunda-tirada-01 t3 t4 ev3
```

También se activa sola con un pedido como «prepara el tiraje de t3, t4 y ev3». Claude ejecuta los scripts desde la raíz del repo, abre las imágenes con su visor y revisa las hojas de `revisar.py`.

## 2. Codex sobre el mismo checkout

Codex descubre la skill en `.agents/skills/`.

```
$fabrica-cartas-animas retoma el lote segunda-tirada-01
```

También se puede elegir desde `/skills`, o se activa sola si el pedido coincide con la descripción. Los comandos son los mismos de `SKILL.md`, y los scripts encuentran la raíz del repo desde cualquiera de las dos copias.

## 3. Un asistente en chat que lee GitHub (ChatGPT Work, Claude)

No ejecuta scripts: lee los archivos del repositorio `Jonathan-Bello/Noched-de-animas-arte`, rama `main`.

1. **Abre primero** `.agents/skills/fabrica-cartas-animas/SKILL.md`, y después `referencias/fuentes.md`.
2. **Busca la ficha por ID:**
   - Si el lote ya se preparó, la ficha completa está en `fabrica/tirajes/<lote>/<id>.md`. Es la que se usa para generar.
   - Si no, busca `` `<id>` `` en `fabrica/descripciones/<familia>.md` (el `README.md` de esa carpeta lista las familias), o la entrada `"id": "<id>"` en `fabrica/descripciones/descripciones.json`.
   - El aspecto de las personas está en `fabrica/PERSONAJES.md`.
3. **Recupera las imágenes de referencia** con las rutas de la tabla «Adjuntar» de la ficha. Abre cada una en GitHub. Si necesitas la imagen directa:
   ```
   https://raw.githubusercontent.com/Jonathan-Bello/Noched-de-animas-arte/main/<ruta>
   ```
   Las rutas de `web/` no usan Git LFS, así que esa dirección entrega la imagen. Mírala antes de generar y entrégala al generador junto con la ficha: el enlace solo identifica la versión.
4. **Para generar** (ChatGPT): sigue `fabrica/PROMPT_CHATGPT.md`, con un chat nuevo por carta, y genera A con la escena principal y B con la alternativa.
5. **Entrega:** las imágenes se adjuntan en la sesión de Claude o de Codex, que las guarda en `fabrica/entrada/` y las publica en el selector (`lote.py agregar`). Si el asistente puede escribir en el repo, sube las imágenes a una rama nueva en `fabrica/entrada/AAAA-MM-DD_<id>/` con su `.txt` y abre un PR. Nunca escribas directamente en `main`.

**Para retomar desde el chat:** abre `fabrica/tirajes/<lote>/encargo.json` (qué cartas entran y cuáles quedan fuera), `web/revision/<lote>/lote.json` (qué ya está en el selector) y `fabrica/seleccion-visual.json` (qué eligió el autor).

## Actualizar la skill una sola vez para todos

1. Edita los archivos en `.agents/skills/fabrica-cartas-animas/`.
2. Corre `python3 herramientas/sincronizar_skill.py` para copiarlos a `.claude/skills/`.
3. Haz commit y PR. El flujo `Skill` de GitHub Actions corre `--comprobar` y valida lotes y fichas de prueba.

Los chats leen `main`, así que verán el cambio en cuanto se fusione el PR.
