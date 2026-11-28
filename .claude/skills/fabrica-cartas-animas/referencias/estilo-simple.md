# Qué hace «simple» el estilo del mazo

Este documento salió de prueba-01 (28-nov-2026). Jonathan rechazó las tres imágenes del Kit de campo por «demasiado realistas»: no respetaban el estilo gráfico simple del mazo. Las comparamos con 12 cartas aprobadas: i08, i06, i09, i11, i14, o04, o07, h04, e01, a03, id01 y s02. Las aprobadas no son «poco detalladas»: tienen bastantes cosas. Lo que las hace simples es **cómo** están hechas, y eso es lo que fallaba.

Una medida automática de zonas planas y de colores no separa las aprobadas de las rechazadas. Por eso estos límites se revisan a ojo, uno por uno, en `control.py` (campo `limites`).

## Límites (todos obligatorios)

| Límite | Las aprobadas | Lo que salió mal en prueba-01 |
|---|---|---|
| **Capas de papel planas** | Cada forma es un recorte de color plano, con contorno oscuro y una sombra corta de capa debajo. Cada color tiene como mucho tres tonos: base, sombra y luz. | Volumen pintado con degradados suaves, brillos y sombras difusas, como en una pintura digital. |
| **Sin textura de material** | La única textura es el grano fino de papel, igual en toda la imagen. | Cuero con poros, costuras punteadas, remaches con brillo, piedra porosa del molcajete, fieltro y vetas de madera. |
| **Objetos como ícono** | Cada aparato es su silueta más uno o dos rasgos, como una pantalla en rectángulo plano o una aguja. | Grabadora con rejilla y botones, linterna con LEDs y EMF con carcasa moldeada: aparatos de catálogo. |
| **Fondo en dos planos** | Arcos recortados, más velas, cempasúchil o papel picado. El fondo es decoración plana, no un lugar. | Azulejos con perspectiva, mesa con canto y suelo de losas: un espacio real. |
| **Pocos objetos** | Un protagonista y como mucho tres objetos secundarios, todos grandes. | Molcajete, chiles, calabazas, jarras, mazorcas, mantel y velas compitiendo con la maleta. |
| **Adorno calado** | Telas, cerámica y bordes llevan motivos de flor recortada, como de papel picado. | Hubo adornos, pero pintados, no calados. |
| **Luz plana** | La llama es una forma plana con un halo de un círculo; el color cálido se reparte en capas. | Iluminación volumétrica con rebotes y oscurecimiento en los bordes. |

## Párrafo para el prompt (pegar tal cual en cada encargo)

```text
Estilo obligatorio: ilustración de papel recortado en capas, como las cartas adjuntas. Cada forma es un recorte de color plano con contorno oscuro y una sombra corta de capa; como mucho tres tonos por color (base, sombra, luz) y nada de degradados suaves. La única textura es un grano fino de papel uniforme. Los objetos se dibujan como íconos: silueta clara y uno o dos rasgos, sin botones, rejillas, tornillos, costuras ni remaches. El fondo son dos planos decorativos (arcos recortados y velas, cempasúchil o papel picado), no un espacio realista. Un protagonista grande y como mucho tres objetos secundarios. Telas y cerámica con motivos de flor calados. Luz de vela como forma plana con un halo simple.
Prohibido: pintura digital, óleo, acuarela, render 3D, fotorrealismo, texturas de cuero, fieltro, piedra o madera, brillos especulares, perspectiva de azulejos o suelo detallado.
```

No escribir en el prompt «imita su acabado, no lo simplifiques». Eso empujó a ChatGPT hacia más detalle. Lo correcto es pedir que **simplifique igual que las adjuntas**.
