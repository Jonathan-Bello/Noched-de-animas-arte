# Prueba de una carta · prueba-01 · Kit de campo (`kit`)

Objetivo: comprobar con una sola carta que los controles nuevos de la skill bastan, antes de repetir un lote. Se mantienen las escenas A y B de familias-03 (no recibieron críticas de escena), así que lo único que se prueba es el **acabado**: que encaje con las herramientas aprobadas.

## Qué adjuntar (solo esto)

1. [i08 · Kit de campo actual](https://raw.githubusercontent.com/Jonathan-Bello/Noched-de-animas-arte/main/web/miniaturas/i08@2x.webp): la versión que prefieres. Acabado, materiales y nivel de detalle; no su composición.
2. [i06 · Espejo de mano](https://raw.githubusercontent.com/Jonathan-Bello/Noched-de-animas-arte/main/web/miniaturas/i06@2x.webp): herramienta aprobada (Conservar). Acabado de la familia.

Nada más: ni propuestas de familias-03 ni láminas comunes. No uses una imagen nueva como referencia de la otra.

## Prompt (un chat nuevo, pegar tal cual con los dos adjuntos)

```text
Vas a ilustrar dos escenas para la carta «Kit de campo» de un juego de cartas ya terminado (Noche de Ánimas: folclor mexicano, una casona en Día de Muertos). Las dos imágenes adjuntas son cartas aprobadas de la misma familia. Tu ilustración debe parecer pintada por la misma mano que ellas: misma técnica, mismos materiales, mismo nivel de detalle y de volumen, misma luz y misma paleta. Si dudas, imita su acabado, no lo simplifiques. No copies su composición ni su encuadre. Ignora el marco, el título y los íconos de las adjuntas.

Regla de su familia (herramientas): el aparato solo, en su sitio, como un bodegón, sin manos ni personas; el entorno da a entender qué mide. Sin naipes ni cartas de juego.

Escena A: El maletín de cuero del kit, abierto sobre la mesa de la cocina junto a un molcajete, con sus compartimentos en fila: termómetro, lámpara UV, grabadora y detector EMF, cada uno en su hueco de terciopelo. Un hueco del centro está vacío, la pieza que se eligió. Sin manos.

Escena B: El kit colgado de un perchero de la entrada, como un morral de cuero con bolsillos; de cada bolsillo asoma la punta de un aparato distinto, reconocible por su silueta. A sus pies, un farol encendido es la única luz cálida.

Formato: vertical 2:3 a sangre, sin texto, letras, números ni marcos. Deja el 12 % superior y el 12 % inferior como fondo de escena, sin nada importante. Que se lea a tamaño de carta (58 × 88 mm): la maleta y sus aparatos deben reconocerse de un vistazo.

Genera primero la imagen A. Antes de la B, compara la A con las dos adjuntas y dime en una frase si su acabado coincide; si no, corrígela.
```

## Después

Mándame `kit-a.png` y `kit-b.png`. Antes de que lleguen al selector hago la hoja a 58 × 88 mm junto a i08 e i06, escribo la lectura ciega y marco si el acabado encaja (`control/kit.json`). Si no encaja, se regenera con la observación concreta y no te llega.

Si apruebas una de las dos, repetimos el lote con las otras nueve cartas por el mismo camino. Si no, ajustamos el encargo con tu nota y probamos otra vez con esta misma carta.
