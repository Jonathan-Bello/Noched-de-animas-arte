# El punto de estilo del mazo

## Historial

- **Intento 1 de prueba-01** (28-nov-2026): rechazado por demasiado realista. Tenía volumen pintado, cuero con poros, costuras y remaches, aparatos de catálogo y un espacio con perspectiva real.
- **Intento 2**: rechazado por demasiado simple. Era papel recortado casi vectorial, con superficies grandes de un solo color, un fondo vacío y aparatos reducidos a rectángulos.

Pasamos de un extremo al otro porque el estilo estaba descrito con adjetivos. **Desde ahora manda la imagen, no la descripción.** Las cartas que Jonathan marque como «en el punto» en la página de calibración (`calibracion-estilo-01`) se adjuntan a **todo** encargo, sean de la familia que sean, además de las referencias de la carta. Este texto solo explica qué tienen esas cartas.

## Anclas elegidas (28-nov-2026)

En la calibración Jonathan marcó **Travesura (a03), La Llorona (id01) y Espejo de mano (i06)**, todas como `guias/punto-de-estilo.json`. Las tres comparten:

- **Una familia de color dominante** que tiñe toda la escena: vino y magenta en Travesura y en el Espejo, petróleo y azul noche en la Llorona. Encima van acentos de crema, ámbar de vela y cempasúchil. No es un arcoíris de objetos de colores distintos.
- **Papel con grano moteado** en todas las capas, como de impresión artesanal, con sombreado suave dentro de cada capa. No es pintura lisa ni vector.
- **Calados de encaje y de flor** en ropa, velos, marcos y papel picado. Es el adorno que más se repite.
- **Fondo de arcos en varias capas**, del mismo color dominante y más oscuro, que enmarca al sujeto.
- **Figuras simplificadas**: rasgos suaves, siluetas claras y expresión legible. No son realistas ni de caricatura plana.

## Qué tienen las cartas aprobadas

Cada límite se revisa en las dos direcciones. Si la imagen cae en cualquiera de los dos extremos, el límite no se cumple.

| Límite | En el punto (cartas aprobadas) | Demasiado realista (intento 1) | Demasiado plano (intento 2) |
|---|---|---|---|
| **Capas de papel con volumen** | Capas recortadas con contorno oscuro y sombra de capa; dentro de cada capa hay sombreado suave y luz cálida que modela el objeto. | Pintura digital: degradados fotográficos, brillos especulares y bordes difusos. | Formas de un solo color, sin modelado, como en un vector. |
| **Textura** | Grano de papel visible en todo, con un toque de material solo donde ayuda a leer, como el lomo de un libro o el cuero de la maleta. | Poros, costuras punteadas, remaches, fieltro, piedra porosa. | Nada de textura: superficies lisas. |
| **Detalle de los objetos** | Reconocibles y ricos: una brújula con su rosa de los vientos y un sello de lacre. Detalle de ilustración, no de catálogo. | Aparatos de producto real, con botones, rejillas y tornillos. | Rectángulos con una raya. |
| **Fondo** | Arcos de la casona en dos o tres planos, con velas, cempasúchil y papel picado. Está lleno y es decorativo, y se oscurece hacia los bordes para que el sujeto resalte. | Un lugar real, con azulejos en perspectiva y suelo de losas. | Un muro casi vacío y un solo color plano de mesa. |
| **Cantidad de cosas** | El protagonista grande al centro y alrededor varios elementos pequeños de ambiente (velas, flores) que no compiten con él. | Utilería de cocina que compite con el protagonista: molcajete, chiles, calabazas, mazorcas. | Protagonista y un objeto suelto, con huecos vacíos. |
| **Adorno calado** | Flores recortadas en telas, cerámica y papel picado, en varias partes de la imagen. | Adornos pintados. | Un solo papel picado. |
| **Luz** | Una luz cálida de velas que tiñe las capas cercanas, con halos suaves. | Iluminación de render, con rebotes y oscurecimiento en los bordes. | Halos como círculos planos, sin efecto sobre lo demás. |

## Párrafo para el prompt (pegar tal cual en cada encargo)

```text
Estilo: el mismo de las tres cartas adjuntas marcadas como «punto de estilo» (Travesura, La Llorona, Espejo de mano). Una familia de color dominante tiñe toda la escena, con acentos de crema, ámbar de vela y cempasúchil. Imítalas en nivel de detalle, textura, densidad del fondo y luz; no copies su composición.
Es papel recortado en capas con volumen: cada capa tiene contorno oscuro, sombra de capa y un sombreado suave interior con luz cálida de velas. Grano de papel visible en todo. Los objetos son reconocibles y con detalle de ilustración, no de catálogo. El fondo son los arcos de la casona en dos o tres planos, con velas, cempasúchil y papel picado, lleno y decorativo y más oscuro hacia los bordes. Adornos de flor calados en telas y cerámica.
Ni un extremo ni el otro: no hagas pintura digital realista (texturas de cuero o piedra, costuras, remaches, aparatos de producto real, perspectiva de azulejos) y tampoco vector plano (superficies de un solo color, fondo vacío, objetos reducidos a rectángulos).
```
