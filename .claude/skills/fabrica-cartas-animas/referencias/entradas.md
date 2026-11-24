# Usar la fábrica desde Claude o Codex

La copia editable está en `.agents/skills/fabrica-cartas-animas/`; Claude Code descubre su copia idéntica en `.claude/skills/`. Desde la raíz, ejecutar `python3 herramientas/sincronizar_skill.py` tras editar y `python3 herramientas/sincronizar_skill.py --comprobar` para verificar ambas entradas.

## 1. Claude Code

Abrir el repositorio e invocar `/fabrica-cartas-animas` con la ruta del guion y la letra de variante. Si la sesión prepara el encargo para otro ilustrador, entregar los píxeles de referencia y el guion literal con su autor.

## 2. Codex

Invocar `$fabrica-cartas-animas` con la misma ruta y variante. Para un guion que ya está en un lote, leer su ficha completada. El auxiliar `scripts/ficha.py ID` permite consultar el catálogo histórico A/B. Sus posibles referencias se cotejan con el elenco y los objetos visibles en **esa variante**.

## 3. Un chat que lee GitHub

Abrir `SKILL.md` y después `referencias/fuentes.md` en la rama o revisión indicada en el encargo. Para el catálogo publicado usar `main`; para un lote en revisión, usar su rama tanto para textos como para imágenes.

Leer la descripción solicitada en el documento editorial. Para un tiraje con ficha completada, revisar también `fabrica/tirajes/<lote>/<id>.md` y sus indicaciones específicas. Abrir los adjuntos seleccionados en `https://raw.githubusercontent.com/Jonathan-Bello/Noched-de-animas-arte/<revision>/<ruta>` y entregar las imágenes al generador con su función rotulada. Cuando el autor pida comparar descripciones, registrar la autoría del texto y el ilustrador por separado.

Entregar únicamente las variantes pedidas. La publicación se gestiona con el [procedimiento del selector](selector.md).
