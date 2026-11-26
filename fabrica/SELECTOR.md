# El selector de ilustraciones y los lotes

## Qué es un lote

Un **lote** es una ronda de revisión con nombre, por ejemplo `herramientas-02` o `segunda-tirada-01`. Por cada carta, el selector (`revision.html`, que en el sitio Astro es `revision.astro`) muestra tres imágenes una al lado de la otra:

| Columna | De dónde sale |
|---|---|
| **A** | Escena principal de la ficha: `web/revision/<lote>/<id>-a.webp` |
| **B** | Alternativa de la ficha: `web/revision/<lote>/<id>-b.webp` |
| **Original** | Versión vigente de la carta: `web/miniaturas/<id_arte>@2x.webp` |

El autor elige **A**, **B** o **Conservar original** en cada carta. El selector guarda el avance en su navegador y al final descarga `seleccion-<lote>.json`.

## Etapas y comentarios

- **Etapa de guion.** `lote.py guiones <lote>` publica las escenas A–D de `fabrica/tirajes/<lote>/descripciones.json` en texto, junto al arte actual. El lote lleva `"etapa": "guion"` y cada opción tiene `descripcion` y el `sha256` del texto, sin imagen.
- **Etapa de arte.** Las ilustraciones reemplazan al texto con `publicar_comparativa.py` o `lote.py agregar`.
- **Comentarios.** Bajo las opciones está la casilla «¿Qué te gustó y qué no?». El texto viaja en el JSON como `nota` de la elección, o en `notas` si la carta no tiene voto. `lote.py registrar` guarda ambos en `fabrica/seleccion-visual.json`; la skill los lee antes de proponer.
- Elegir una opción ya no salta a la siguiente carta, para que se pueda escribir el comentario. Se avanza con «Siguiente» o «Ir a una pendiente».

## Archivos

```
web/revision/lotes.json            índice: qué lotes existen, su título y su ruta (el primero se abre por omisión)
web/revision/<lote>/lote.json      cartas del lote, con archivo y SHA-256 de A, B y original
web/revision/<lote>/<id>-a.webp    propuestas, fuera de Git LFS para que GitHub Pages las sirva
fabrica/seleccion-visual.json      elección registrada del autor (la que leen Claude y Codex)
```

Forma de una carta en `lote.json`:

```json
{"id": "t3", "nombre": "Cámara de movimiento", "familia": "Herramientas", "reverso": "back01",
 "a": {"archivo": "web/revision/segunda-tirada-01/t3-a.webp?v=1a2b3c4d5e", "sha256": "…",
       "anterior": "…", "anteriores": ["…"]},
 "b": {"archivo": "…", "sha256": "…"},
 "original": {"archivo": "web/miniaturas/i04@2x.webp", "sha256": "…"}}
```

`?v=` lleva el inicio del hash. Así, al cambiar la imagen, el navegador no muestra la vieja guardada en caché.

## Ciclo completo

1. **Publicar.** `lote.py agregar <lote> <id> --a A.png --b B.png` hace lo siguiente:
   - Convierte A y B a WebP de hasta 1100 px de alto, las copia a `web/revision/<lote>/` y calcula sus hashes.
   - Agrega la carta a `lote.json` o la actualiza si ya estaba.
   - Pone el lote al inicio de `lotes.json`.
   - Rechaza las cartas que no tocan en este tiraje (Conservar, En espera…) salvo con `--forzar`.
2. **Comprobar.** `lote.py comprobar` valida todos los lotes:
   - cada lote está en el índice y no hay IDs repetidos;
   - cada ID existe en el catálogo;
   - las tres imágenes existen y su hash coincide.
3. **Votar.** El autor abre `revision.html?lote=<lote>` en el sitio y elige. Puede volver y cambiar su voto. Con «Descargar selección JSON» obtiene:
   ```json
   {"version": 1, "lote": "segunda-tirada-01", "total": 3, "completo": true,
    "elecciones": [{"id": "t3", "opcion": "a", "sha256": "…"}]}
   ```
4. **Registrar.** `lote.py registrar seleccion-<lote>.json` pasa cada elección a `fabrica/seleccion-visual.json` con `lote`, `voto`, `alcance`, `archivo`, `sha256` y fecha:
   - El alcance por omisión es `preferencia_visual`.
   - Si el autor eligió solo la idea, se registra con `--alcance <id>=concepto_…`, como pasó con el EMF.
   - Si la carta ya tenía un voto, el anterior queda en `historial` dentro de la misma entrada.
   - Registrar el mismo archivo dos veces no cambia nada.
5. **Commit y PR** con las imágenes, `lote.json`, `lotes.json` y `seleccion-visual.json`.

## Lo que garantiza

- **ID estable.** El ID es el del juego. Una carta aparece una sola vez por lote, aunque se publique varias veces.
- **Repetir no duplica.** `agregar` con las mismas imágenes responde «sin cambios».
- **Las elecciones anteriores se conservan.** Si se sustituye la propuesta A de una carta:
  - su hash viejo pasa a `anteriores`;
  - si el autor había elegido A en esa carta, ese voto queda pendiente para que vea la imagen nueva;
  - si había elegido B u original, el voto se conserva;
  - los votos de las demás cartas no cambian.

  Agregar cartas nuevas a un lote ya votado tampoco borra el avance.
- **Votar no es aprobar.** El selector registra preferencias. La aprobación final se registra aparte en `catalogo/aprobaciones.json` con las palabras del autor, y solo entonces entra al canon.

## Dónde queda la elección del autor

| Momento | Lugar | ¿Lo ve otra sesión? |
|---|---|---|
| Mientras vota | `localStorage` de su navegador, clave `noche-de-animas/revision/<lote>` | No |
| Al terminar | `seleccion-<lote>.json`, que él descarga y entrega | Solo si lo adjunta |
| Registrado | `fabrica/seleccion-visual.json` en el repo | **Sí**: Claude y Codex lo leen con `ficha.py` y `lote.py estado` |


## Comparación de cuatro guiones

Un lote con `guionistas` ofrece A, B, C y D; cada opción conserva la descripción que dio lugar a su dibujo. `ilustrador` acredita por separado la generación de imágenes. Incluir `original` cuando la carta tenga arte vigente. La opción `ninguna` registra el descarte de la ronda y se invalida si cambia alguna propuesta.

Para un componente que tiene varios retratos, mantener su ID de juego y añadir `pieza` como clave única de revisión de cada retrato. La exportación y el registro conservan ambos campos. El voto por una imagen o el descarte del conjunto expresa la preferencia del autor para esa pieza.

Para preparar o actualizar todas las imágenes de un lote de cuatro guiones, ejecutar `python3 herramientas/publicar_comparativa.py LOTE DIRECTORIO_WEBP`. El directorio contiene `<pieza>-a.webp` a `<pieza>-d.webp`; las descripciones y el alcance proceden del encargo editorial del lote.
