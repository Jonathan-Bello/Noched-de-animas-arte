# Dónde vive cada decisión

La skill enlaza estas fuentes y no las copia. Para corregir algo, se edita la fuente y la skill lo lee desde ahí en la siguiente ejecución.

| Qué | Fuente (se edita aquí) | Generado o derivado |
|---|---|---|
| Escena principal, alternativa, estado, personaje y lectura clave de cada carta | `fabrica/descripciones/datos_1.py`, `datos_2.py`, `datos_3.py` | `herramientas/descripciones.py` genera `fabrica/descripciones/descripciones.json`, las páginas por familia y su `README.md`. No editar a mano |
| IDs, nombres, tipos, copias, reverso, uso y evidencia que busca cada herramienta | Repo del juego (`Jonathan-Bello/NOCHE-DE-ANIMAS`) | `herramientas/catalogo_juego.mjs` genera `fabrica/catalogo_juego.json`. No editar a mano |
| Rasgos de los 5 investigadores, los 8 roles y las 21 ánimas | [`fabrica/PERSONAJES.md`](../../../../fabrica/PERSONAJES.md) | `scripts/comun.py` lee sus tablas |
| Modelos de aparato, indicaciones del autor por carta y riqueza de la ilustración | [`fabrica/CONTINUIDAD.md`](../../../../fabrica/CONTINUIDAD.md) | `scripts/comun.py` lee la tabla de modelos y las viñetas «- Nombre: …» |
| Cartas de referencia elegidas y artes que el autor quiere modificar | [`guias/ESTILO_DE_CARTAS.md`](../../../../guias/ESTILO_DE_CARTAS.md) | `scripts/comun.py` lee la línea «Artes que el autor quiere modificar» |
| Guiones por variante y autor de un lote comparativo | `fabrica/tirajes/<lote>/descripciones.json` | `scripts/ficha.py --lote <lote> ID --variante d` devuelve el texto exacto |
| Votos del autor en el selector | [`fabrica/seleccion-visual.json`](../../../../fabrica/seleccion-visual.json) | Lo actualiza `scripts/lote.py registrar` |
| Lotes de revisión | `web/revision/lotes.json` y `web/revision/<lote>/lote.json` | Los actualiza `scripts/lote.py agregar` |
| Fichas de un tiraje | `fabrica/tirajes/<lote>/<id>.md` y `encargo.json` | `scripts/ficha.py --escribir` crea el borrador; después se completan a mano |
| Propuestas recibidas | `fabrica/entrada/AAAA-MM-DD_<id>/` | Convención de `fabrica/entrada/README.md` |
| Arte aprobado (fuente final, con hashes) | `catalogo/canon.cartas.json` y `catalogo/aprobaciones.json` | Solo con aprobación explícita de Jonathan |
| Ilustraciones de rol aprobadas | `catalogo/ilustraciones_roles_aprobadas.json` | Rutas en `web/miniaturas/roles-aprobados/` |
| Reparto, paleta y utilería permitidos por familia (solo el ánima en Identidades y Espantos, Espantos en carmín, sin naipes) | [`referencias/familias.md`](familias.md) | `scripts/revisar_guiones.py` y `scripts/paleta_familia.py` lo comprueban |
| Formato y prompt para ChatGPT | `fabrica/PROMPT_CHATGPT.md`, `fabrica/CONTROL_IA.md` | — |
| Plantilla de carta, paleta de franjas e íconos | `web/plantillas/carta-base.svg`, `web/plantillas/paleta.json`, `iconos/cartas/` | Ver `montaje.md` |

## Imágenes de referencia (fuera de Git LFS: se abren directo desde GitHub)

| Ruta | Qué es |
|---|---|
| `web/miniaturas/<id_arte>@2x.webp` | Versión vigente de cada carta, a 580 × 880 px. El `id_arte` sale del catálogo, por ejemplo t3 → i04 |
| `web/mesa/arte/inv_<ines\|rafael\|tomas\|amalia\|mateo>.webp` | Retrato de identidad de cada investigador; `_espiritu` para su versión de espíritu |
| `web/miniaturas/roles-aprobados/<rol>.webp` | Ilustraciones de rol aprobadas |
| `web/revision/<lote>/<id>-a.webp` y `-b.webp` | Propuestas publicadas en el selector |

Los originales en `objetos/` sí están en Git LFS. Para fichas y revisión bastan las miniaturas; el original solo se usa al exportar.
