# Lote `familias-01` · prueba de la skill por familia

Primera prueba de la skill `fabrica-cartas-animas` con las [reglas por familia](../../../.agents/skills/fabrica-cartas-animas/referencias/familias.md) del 25-nov-2026. Se eligió en cada familia una carta cuyo original Jonathan conservó en `comparativa-01`, y se escribieron cuatro escenas nuevas: A y B de Claude, C y D de ChatGPT. Ninguna copia la composición del arte actual, que sigue compitiendo como «Conservar original».

Reacciones y Espíritus quedan fuera: Esconderse ya tiene propuesta elegida, el resto de las reacciones son referencia de estilo y los espíritus se conservaron.

| Familia | Carta | Antes (comparativa-01, rechazado) | Ahora · Claude (A, B) |
|---|---|---|---|
| Herramienta | [Sensor de gases](t6.md) | Amalia completa junto a la puerta, con el hilo de gas a sus pies | A: el aparato solo, colgado de un baúl cerrado; el azufre sale por la cerradura. B: la sonda en el desagüe del lavadero, con solo la mano de Amalia |
| Apoyo | [Respirar hondo](resp.md) | Rafael apoyado en el brocal, casi igual al original | A: las manos de Rafael con un jarro humeante. B: Rafael de espaldas en la azotea, bajo las estrellas |
| Marcador | [Alba](alba.md) | La luz cruza «el último naipe tirado en el piso» | A: la luz entra bajo el portón y alcanza la última veladora. B: el sol parte la fuente en dorado y azul; un gallo |
| Objeto | [Radio](radio.md) | Una mano entrega una carta a otra por el alféizar (las 4 variantes con cartas) | A: dos radios en nichos contiguos; la onda atraviesa el muro. B: una mano pasa el radio mismo a otra por el cubo de la escalera |
| Acción del ánima | [Portazo](portazo.md) | Una carta prensada entre hoja y jamba (las 4 variantes con cartas) | A: tres puertas cierran a la vez y la corriente arrastra hojas de libreta y fotos. B: el portazo sacude un morral y caen linterna, frasco y libreta |
| Habilidad | [Helada](h0.md) | Tomás escondido mientras el hielo lo alcanza | A: la escarcha sella un ropero; solo sale vaho por la rendija. B: el hielo baja la escalera hasta una vela medio congelada |
| Identidad | [El Cadejo Negro](id_cadejo.md) | «Mantener su identidad»: masa oscura en el camino, como el original | A: de pie en la barda contra la luna, la cadena cuelga al camino. B: cruza bajo un arco y deja sus tres evidencias: ceniza, farol que parpadea y azufre |
| Espanto | [El barco en la pared](es_mulata.md) | Los investigadores se pasan naipes; Inés, Rafael, Tomás y Mateo en la escena; morados y petróleo | Solo la Mulata y su barco, en monocromo carmín. A: termina el trazo y el agua gira a la izquierda. B: en la proa; la estela barre a la izquierda farol, libreta y linterna |
| Evidencia | [Objetos movidos](ev3.md) | Silla desplazada y marcas en el polvo, cercano al original | A: todas las fotos de la ofrenda vueltas hacia la pared. B: los platos de talavera en una torre imposible en el piso |

## Variantes de ChatGPT (C y D)

ChatGPT recibió las reglas por familia, el efecto de cada carta, la descripción del arte actual y las escenas A y B, con la indicación de no repetirlas. Sus escenas completas están en cada ficha.

| Carta | C | D |
|---|---|---|
| Sensor de gases | Repisa del sótano entre frascos; las etiquetas se ennegrecen | Sujeto a una tubería de cobre; burbujas amarillas y corrosión |
| Respirar hondo | Rafael en la biblioteca, mano en el abdomen | Rafael en el corredor de retratos, sobre cojines bordados |
| Alba | La luz del rosetón corona el altar de la capilla | Un reloj de péndulo vuelve a andar; las sombras de las sillas se acortan |
| Radio | Dos radios en el archivo, entre libros | Un radio en la escalera de servicio junto a libreta y llavero |
| Portazo | Galería de espejos: tiemblan los cristales y caen fotos y papeles | Las vitrinas del comedor se vacían; polvo rojo |
| Helada | Un arcón de ropa blanca sellado por el hielo | El hueco de un horno de pan cerrado por agujas de hielo |
| El Cadejo Negro | En el puente del jardín; las lámparas se apagan | Erguido en el comedor; las copas se agrietan |
| El barco en la pared | La Mulata arrodillada; un río carmesí corre a la izquierda | El barco en la bóveda; candiles y cadenas se inclinan a la izquierda |
| Objetos movidos | Bobinas en espiral y la costura en fila en el piso | Botellas en espiral alrededor de una lámpara, corchos en círculo |

### Revisión de las escenas de ChatGPT

`revisar_guiones.py` no marcó ninguna de las 18. La lectura a ojo que pide la skill encontró cinco problemas, que se devolvieron a ChatGPT en una segunda ronda:

- **Sensor de gases C:** el aparato tenía «pantalla»; el modelo es de aguja (`fabrica/CONTINUIDAD.md`).
- **Objetos movidos C y D:** incluían la cámara de movimiento, que es otra carta (`t3`), y mostraban objetos moviéndose en ese instante en vez del indicio ya ocurrido.
- **Helada C y D:** el aljibe y el invernadero no se leían como escondites, y el efecto es que esconderse no sirve. Pasaron a un arcón de ropa y un horno de pan.
- **El barco en la pared C:** la corriente iba de izquierda a derecha; el efecto pasa las manos a la izquierda. La respuesta corregida traía un tropiezo de redacción, y Claude lo dejó en limpio sin cambiar la escena.

Dos detalles quedan para la lectura del autor: Respirar hondo D pone a Rafael sobre una «pila de cojines», que puede leerse menos sobrio que el resto del mazo, y Portazo D usa polvo rojo fuera de un Espanto.

Estos errores no los detecta el filtro automático: coherencia con el modelo del aparato, cartas que se cruzan y lectura del efecto. Siguen siendo trabajo de la revisión a ojo.

## Comprobación

`revisar_guiones.py --lote familias-01`: 0 observaciones en 36 guiones. El mismo filtro marca 17 observaciones en los guiones de estas mismas cartas en `comparativa-01`.

## Cómo seguir

1. Pegar el bloque «Encargo» de cada ficha en un chat nuevo de ChatGPT, una variante por chat, con sus adjuntos.
2. En el Espanto, correr `python3 .agents/skills/fabrica-cartas-animas/scripts/paleta_familia.py es_mulata a.png b.png` y repetir la que no pase.
3. Hacer la hoja de revisión con `scripts/revisar.py` y publicar con `scripts/lote.py agregar familias-01 <id> --a a.png --b b.png`.
4. Votar en el selector y registrar con `scripts/lote.py registrar`.
