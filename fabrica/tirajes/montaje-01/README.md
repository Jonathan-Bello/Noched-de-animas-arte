# montaje-01 · cartas terminadas

Las 12 caras sin aprobar del catálogo (fabrica/catalogo_juego.json), montadas con marco, título, emblema y leyenda por código:

- 8 roles con su ilustración aprobada sin marco (web/miniaturas/roles-aprobados/) y la leyenda del bundle de roles v09.
- Manifestar y Velar con el arte que Jonathan conservó en comparativa-01.
- Pentagrama con el arte votado en comparativa-01 (A) y dos leyendas nuevas.
- Tarjeta de cordura (5 piezas) con los retratos votados en comparativa-01 (A), montada con herramientas/tarjeta_cordura.py.

En roles, espíritus y cordura, A y B solo cambian la franja del título (A oscura, como el Velar aprobado; B guinda o café). En el Pentagrama cambian la leyenda.

Regenerar: `python3 herramientas/montar_carta.py montaje-01` (necesita Playwright de Python). Los SVG con sangrado se escriben en `montaje/` y no se versionan: pesan 11 MB y salen del script.

Votar es preferencia; la aprobación de carta terminada se registra aparte en catalogo/aprobaciones.json.
