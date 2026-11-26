# Lote `familias-01` · prueba de la skill por familia

Primera prueba de la skill `fabrica-cartas-animas` con las [reglas por familia](../../../.agents/skills/fabrica-cartas-animas/referencias/familias.md) del 25-nov-2026. Se eligió en cada familia una carta cuyo original Jonathan conservó en `comparativa-01`, y se escribieron dos escenas nuevas (A y B). Ninguna copia la composición del arte actual, que sigue compitiendo como «Conservar original».

Reacciones y Espíritus quedan fuera: Esconderse ya tiene propuesta elegida, el resto de las reacciones son referencia de estilo y los espíritus se conservaron.

| Familia | Carta | Antes (comparativa-01, rechazado) | Ahora |
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

`revisar_guiones.py --lote familias-01`: 0 observaciones en 18 guiones. El mismo filtro marca 17 observaciones en los guiones de estas mismas cartas en `comparativa-01`.

## Cómo seguir

1. Pegar el bloque «Encargo» de cada ficha en un chat nuevo de ChatGPT, una variante por chat, con sus adjuntos.
2. En el Espanto, correr `python3 .agents/skills/fabrica-cartas-animas/scripts/paleta_familia.py es_mulata a.png b.png` y repetir la que no pase.
3. Hacer la hoja de revisión con `scripts/revisar.py` y publicar con `scripts/lote.py agregar familias-01 <id> --a a.png --b b.png`.
4. Votar en el selector y registrar con `scripts/lote.py registrar`.
