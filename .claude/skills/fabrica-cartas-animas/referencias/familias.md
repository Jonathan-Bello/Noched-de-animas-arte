# Reglas por familia

Estas reglas valen al **escribir** una escena y al **dibujarla**. Salen de lo que Jonathan eligió y rechazó en el lote `comparativa-01` (25-nov-2026) y de sus indicaciones de ese día. Prevalecen sobre las fichas y guiones anteriores que las contradigan.

## Lo que enseñó comparativa-01

De 65 elecciones, Jonathan conservó el original en 47 y eligió una propuesta en 18 (5 de ellas son las tarjetas de cordura). En Identidades y Espantos conservó el original en 26 de 27 cartas.

| Patrón en el guion | Variantes en el tiraje | Elegidas |
|---|---|---|
| Naipes, mazo o abanico de cartas en la escena | 35 | 1 (Espejo de plata, donde la carta es el efecto) |
| Investigadores en una Identidad o un Espanto | 37 | 0 |
| Espanto con petróleo, azul o verde en la paleta | 30 de 48 (medido) | 0 |
| Objeto o ánima sola como protagonista, sin investigador o con solo una mano | — | 12 de las 13 escenas elegidas |

## Reglas para todas las familias

1. **Propuesta nueva, no réplica.** Cuando una carta se rehace, cada variante es una escena nueva de la misma idea: otro lugar de la casona, otro momento u otro encuadre. No copiar la composición de la carta actual, que ya está en el selector como «Conservar original». Las réplicas fallan porque pierden lo que el original ya tenía y no aportan nada nuevo. «Mantener su identidad» significa conservar los rasgos del ánima en `fabrica/PERSONAJES.md`, no su pose ni su encuadre. Una réplica solo se hace si Jonathan la pide expresamente para corregir un detalle.
2. **Sin naipes.** La mecánica de cartas (robar, descartar, pasar, revelar la mano) **no se dibuja con naipes**. Se traduce a un hecho de la casa: papeles que vuelan (como el Portazo aprobado), objetos movidos, una sombra, una puerta. Excepciones, porque la carta es el efecto: **Espejo de mano, Espejo de plata, Espejo de obsidiana** (el reflejo revela la mano del ánima) y **Tarot** (una carta de tarot, no un naipe de juego).
3. **Variantes distintas entre sí.** Las cuatro variantes de una carta no pueden diferir solo en el punto de vista. Cambiar el lugar, el instante o el sujeto principal.

## Identidades (`id_*`)

- **Reparto:** solo el ánima. Nadie más: ni investigadores, ni sus manos, ni víctimas, ni testigos al fondo. Se permite lo que pertenece a su leyenda (el caballo del Charro Negro, las cadenas del Cadejo, la olla de la Bruja, la ceiba de Xtabay).
- **Foco:** el ánima ocupa la escena y se reconoce por su rasgo propio a tamaño de carta. El lugar es el de su leyenda.
- **Paleta:** la columna «Paleta» de su fila en `fabrica/PERSONAJES.md`. Las identidades aprobadas varían de una a otra; no imponer un promedio.

## Espantos (`es_*`)

- **Reparto:** solo el ánima, en el acto de atacar. Nadie más. La consecuencia para los jugadores se cuenta con **el entorno**: el fuego que sube la escalera, las cadenas tensas, el barco que se desprende de la pared, los objetos que giran. No se dibujan investigadores siendo atacados, ni sus tobillos, ni sus manos.
- **Foco:** el ánima en primer plano o como masa dominante; encuadre cerrado y amenazante.
- **Paleta: monocromo carmín.** Rojo saturado, guinda y negro dominan; crema, oro y ámbar solo como luz (fuego, velas, ojos, ornamento). **Nada de petróleo, azul ni verde**, aunque la identidad de esa ánima los use. Medido en los 20 Espantos aprobados: el carmín es la mediana del 75 % de la imagen y los tonos fríos son 0 %. Las propuestas rechazadas tenían carmín del 40 % y morados con acentos petróleo. Excepción aprobada: *Juego del monte* (Chaneque, s07), en selva verde.
- Al pedir la ilustración, escribirlo explícitamente: «toda la escena en rojos carmín, guinda y negro, con crema y oro solo como luz; sin azul, verde ni petróleo».
- Comprobar con `scripts/paleta_familia.py` antes de publicar en el selector.

Algunos Espantos aprobados todavía muestran a una persona (los pies de *Cadenas*, las víctimas de *Canto de la ceiba*). Se conservan, pero no son modelo para escenas nuevas.

## Herramientas, objetos, apoyos y evidencias

- **Protagonista:** el aparato, el objeto o el indicio. Las escenas elegidas lo muestran solo (Grabadora C, Lámpara UV B, Termómetro B) o con una mano (Ruda A, Tablilla A, Mano del mono C, Espejo de plata A, Apagón C).
- **Investigadores:** como mucho una mano o un antebrazo, identificables por la manga de `fabrica/PERSONAJES.md`. Un investigador completo solo si la acción es suya (Esconderse).
- **Paleta:** la del ilustrador (`guias/ESTILO_DE_CARTAS.md`).

## Acciones del ánima y habilidades

Las cartas aprobadas sí muestran a un investigador sufriendo el efecto (Escalofrío, Acecho, Presencia). En este tiraje Jonathan conservó casi todos los originales: antes de rehacer una, confirmar con él qué no le gusta de la actual.

## Comprobación

```sh
# Antes de ilustrar: guiones del lote
python3 .agents/skills/fabrica-cartas-animas/scripts/revisar_guiones.py --lote <lote>
# Antes de publicar: paleta de un Espanto
python3 .agents/skills/fabrica-cartas-animas/scripts/paleta_familia.py es_cadejo propuesta-a.png propuesta-b.png
```

`revisar_guiones.py` habría marcado 61 de las variantes del tiraje y ninguna de las que Jonathan eligió. `paleta_familia.py` deja pasar los 20 Espantos aprobados y detiene 30 de las 48 propuestas de Espanto rechazadas; las demás cayeron por el reparto. Ambos son filtros previos: no aprueban nada.
