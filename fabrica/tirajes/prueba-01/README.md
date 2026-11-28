# Prueba de una carta · prueba-01 · Kit de campo (`kit`)

> **Intento 2.** El intento 1 (28-nov) salió demasiado realista y lo rechazaste. Este prompt agrega los límites de [estilo simple](../../../.agents/skills/fabrica-cartas-animas/referencias/estilo-simple.md) y quita la frase «no lo simplifiques», que empujaba hacia más detalle.

Objetivo: comprobar con una sola carta que los controles nuevos de la skill bastan, antes de repetir un lote. Se mantienen las escenas A y B de familias-03 (no recibieron críticas de escena), así que lo único que se prueba es el **acabado**: que encaje con las herramientas aprobadas.

## Qué adjuntar (solo esto)

1. [i08 · Kit de campo actual](https://raw.githubusercontent.com/Jonathan-Bello/Noched-de-animas-arte/main/web/miniaturas/i08@2x.webp): la versión que prefieres. Acabado, materiales y nivel de detalle; no su composición.
2. [i06 · Espejo de mano](https://raw.githubusercontent.com/Jonathan-Bello/Noched-de-animas-arte/main/web/miniaturas/i06@2x.webp): herramienta aprobada (Conservar). Acabado de la familia.

Nada más: ni propuestas de familias-03 ni láminas comunes. No uses una imagen nueva como referencia de la otra.

## Prompt (un chat nuevo, pegar tal cual con los dos adjuntos)

```text
Vas a ilustrar dos escenas para la carta «Kit de campo» de un juego de cartas ya terminado (Noche de Ánimas: folclor mexicano, una casona en Día de Muertos). Las dos imágenes adjuntas son cartas aprobadas de la misma familia: tu ilustración debe simplificar exactamente igual que ellas. No copies su composición ni su encuadre. Ignora el marco, el título y los íconos de las adjuntas.

Estilo obligatorio: ilustración de papel recortado en capas, como las cartas adjuntas. Cada forma es un recorte de color plano con contorno oscuro y una sombra corta de capa; como mucho tres tonos por color (base, sombra, luz) y nada de degradados suaves. La única textura es un grano fino de papel uniforme. Los objetos se dibujan como íconos: silueta clara y uno o dos rasgos, sin botones, rejillas, tornillos, costuras ni remaches. El fondo son dos planos decorativos (arcos recortados y velas, cempasúchil o papel picado), no un espacio realista. Un protagonista grande y como mucho tres objetos secundarios. Telas y cerámica con motivos de flor calados. Luz de vela como forma plana con un halo simple.
Prohibido: pintura digital, óleo, acuarela, render 3D, fotorrealismo, texturas de cuero, fieltro, piedra o madera, brillos especulares, perspectiva de azulejos o suelo detallado.

Regla de su familia (herramientas): el aparato solo, en su sitio, como un bodegón, sin manos ni personas; el entorno da a entender qué mide. Sin naipes ni cartas de juego.

Escena A: El maletín de cuero del kit, abierto sobre la mesa de la cocina junto a un molcajete, con sus compartimentos en fila: termómetro, lámpara UV, grabadora y detector EMF, cada uno en su hueco de terciopelo. Un hueco del centro está vacío, la pieza que se eligió. Sin manos.

Escena B: El kit colgado de un perchero de la entrada, como un morral de cuero con bolsillos; de cada bolsillo asoma la punta de un aparato distinto, reconocible por su silueta. A sus pies, un farol encendido es la única luz cálida.

Formato: vertical 2:3 a sangre, sin texto, letras, números ni marcos. Deja el 12 % superior y el 12 % inferior como fondo de escena, sin nada importante. Que se lea a tamaño de carta (58 × 88 mm): la maleta y sus aparatos deben reconocerse de un vistazo.

Genera primero la imagen A. Antes de la B, revisa la A contra la lista «Prohibido» y contra las adjuntas: si tiene degradados, texturas de material, aparatos con botones o un fondo realista, rehazla más simple.
```

## Después

Mándame `kit-a.png` y `kit-b.png`. Antes de que lleguen al selector hago la hoja a 58 × 88 mm junto a i08 e i06, escribo la lectura ciega y marco si el acabado encaja (`control/kit.json`). Si no encaja, se regenera con la observación concreta y no te llega.

Si apruebas una de las dos, repetimos el lote con las otras nueve cartas por el mismo camino. Si no, ajustamos el encargo con tu nota y probamos otra vez con esta misma carta.
