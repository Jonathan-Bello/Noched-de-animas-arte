# Lote `estilo-01` · estilo general, arte por tipo y escenas nuevas

Primera tanda con la skill `fabrica-cartas-animas` que entrega solo la ilustración (PR #14). Jonathan pidió arte más consistente entre cartas, con un estilo amigable y agradable, definido en dos niveles: un estilo general y después el arte de cada tipo de carta.

**Selector:** https://claude.ai/artifact/GtN7Hsot8aDft7SiArM2ws (también en `revision.html?lote=estilo-01`, solo las escenas). Devuelve `seleccion-estilo-01.json`.

## Qué se vota

1. **Estilo general** (`estilo.json` → `general`): A Papel recortado cálido, B Estampa de lotería, C Cuento ilustrado de noche. Cada uno con cartas aprobadas que ya se le acercan.
2. **Arte por tipo** (`estilo.json` → `familias`): dos composiciones para cada una de 8 familias. Las reglas fijas de `referencias/familias.md` no se votan.
3. **Escena por carta** (`descripciones.json`): tres escenas nuevas de Claude por carta, la carta actual y, si existe, la propuesta votada antes y nunca aprobada.

## Cartas elegidas

Ninguna cara del juego carece de arte fuera de las 12 de `montaje-01`. Se tomaron las cartas con un cambio de arte pendiente: propuestas votadas sin aprobar (votar no es aprobar) y escenas preparadas sin votar en `familias-02`. Una por tipo, dos en apoyos/reacciones y en acciones/habilidades.

| Tipo | Carta | Por qué está pendiente |
|---|---|---|
| Herramienta | Termómetro (`t0`) | Votada B en comparativa-01, sin aprobar; en la lista de artes a modificar |
| Apoyo | Ruda | Votada A, sin aprobar |
| Reacción | Esconderse | Votada D, sin aprobar |
| Objeto | Tablilla espiritista | Votada A, sin aprobar |
| Acción del ánima | Interferencia | Guiones de familias-02 sin votar |
| Habilidad | Apagón (`h4`) | Votada C, sin aprobar |
| Identidad | Bruja | Votada A, sin aprobar |
| Espanto | Maldición del entierro | Guiones de familias-02 sin votar |
| Evidencia | Luces parpadeantes | Votada A, sin aprobar |
| Reglas | Investigar (`R02`) | Votada B en frentes-01, sin aprobar; hoy duplica al Termómetro |

`revisar_guiones.py --lote estilo-01`: 0 observaciones en 30 guiones. Ninguna escena repite las de comparativa-01 ni familias-02.

## Después del voto

- `lote.py registrar seleccion-estilo-01.json` guarda las escenas elegidas. `estilo` y `familias` se pasan a `guias/ESTILO_DE_CARTAS.md` y a `referencias/familias.md`; `aprobar_votada` va a `catalogo/aprobaciones.json` con las palabras de Jonathan.
- Con el estilo y la familia elegidos se escribe el bloque «Encargo» de cada carta para ChatGPT. Las ilustraciones vuelven al selector en etapa de arte.
