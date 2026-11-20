# Noche de Ánimas · biblioteca de arte

Fuente de recursos gráficos, versiones y evidencia de aprobación para tres proyectos separados: esta biblioteca, el juego de cartas y el juego 3D inspirado en él.

## Qué usar

- `catalogo/canon.cartas.json`: selección final de cartas con aprobación documentada, rutas inmutables y SHA-256.
- `catalogo/aprobaciones.json`: evidencia y alcance (identidad, escena o carta); las entregas posteriores no son aprobadas automáticamente.
- `catalogo/inventario.json`: cada archivo conservado, origen local, versión, fechas observadas y duplicados por contenido.
- `historial/`: entregas agrupadas por fecha y colección; los binarios se guardan una sola vez en `objetos/`.
- `CRONOLOGIA.md` y `galeria.html`: evolución y revisión visual.
- `PENDIENTES.md`: pentagrama, Vigía y decisiones que faltan.

## Obtener y comprobar

Se requiere Git LFS para descargar imágenes y PDF originales:

```sh
git lfs install
git lfs pull
python herramientas/verificar.py
python herramientas/exportar.py --destino exportaciones/cartas
```

El exportador solo usa cartas aprobadas del canon y verifica sus hashes. Conserva formatos, IDs, reversos y cantidades del manifiesto de importación. No exporta propuestas por ser las más recientes.

Para los otros proyectos: fijar este repositorio a un commit/tag concreto; ejecutar el exportador y conservar `arte.lock.json` junto a los recursos. `--comprobar` detecta diferencias o archivos adicionales en una exportación, sin modificarla.

## Historia importada

Los commits se crean en la fecha real de esta migración; sus mensajes identifican la fecha de los archivos importados. No se falsifican fechas de Git. La cronología usa primero fechas explícitas de las guías/entregas y después la última modificación observada, siempre identificada como aproximación; las fechas de creación de Windows pueden reflejar copias.

Los originales permanecen en la carpeta local. No se incluyen ZIP redundantes, fotos personales, dependencias, herramientas de navegador ni código de los otros juegos. Los trabajos 3D se registran en el mapa de separación, sin mezclarlos con las cartas aprobadas. Los PDF históricos son evidencia de exportación, no una aprobación automática.
