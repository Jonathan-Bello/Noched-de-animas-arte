---
name: fabrica-cartas-animas
description: Propone, ilustra y revisa escenas de cartas para Noche de Ánimas. Úsala para escribir variantes nuevas de una carta, producir su arte, corregir su ejecución gráfica o comprobar su lectura impresa.
---

# Proponer e ilustrar una carta

**Esta skill entrega solo la ilustración**, sin marco, título, ícono ni leyenda. Es el primer paso de toda carta, nueva o rehecha. Cuando Jonathan aprueba la ilustración (aprobación, no solo voto), la carta terminada la arma la skill `disenar-carta-animas`. Para una carta que aún no existe en el juego, pedirle a esa skill un concepto breve (tipo, efecto y leyenda tentativa) y usarlo como punto de partida de la escena.

Antes de todo, leer las [reglas por familia](referencias/familias.md). Son indicaciones del autor y prevalecen sobre fichas y guiones anteriores. En resumen:

- **Identidades y Espantos: solo el ánima.** Nadie más en la escena, ni manos de investigadores. La consecuencia del Espanto se cuenta con el entorno.
- **Espantos en monocromo carmín:** rojos, guinda y negro; crema y oro solo como luz; sin azul, verde ni petróleo.
- **Sin naipes**, salvo en los espejos que revelan la mano del ánima y en el Tarot. La mecánica de cartas se traduce a un hecho de la casa.
- **Propuestas nuevas, no réplicas** de la carta actual: el original ya compite en el selector.
- En herramientas, objetos, apoyos y evidencias, el protagonista es el objeto o el indicio; un investigador entra como mano.

**Controles obligatorios (no tienen excepción).** En familias-03 el autor descartó las 40 propuestas y se quedó con los 10 originales porque se saltaron estos tres pasos. `scripts/control.py` los comprueba y `lote.py agregar` y `publicar_comparativa.py` se niegan a publicar sin ellos; `--forzar` no los salta.

- **Referencias por carta, no por lote.** Cada encargo lleva solo las referencias que la ficha de *esa* carta marca como adjuntables (`scripts/ficha.py <id>`), con al menos una de acabado de su familia. Nunca un bloque de referencias común para todo el lote ni un párrafo de estilo genérico: el acabado se toma de la familia.
- **Una propuesta nunca es referencia.** Nada de `fabrica/entrada/`, `fabrica/tirajes/` ni `web/revision/` (salvo el original votado que la ficha permita). No usar una variante para igualar la mano de otra: propaga sus defectos y el lote acaba pareciéndose a sí mismo y no al mazo.
- **Revisión a tamaño de juego contra la familia, carta por carta.** Hoja de `scripts/revisar.py` a 58 × 88 mm junto a las referencias, lectura ciega escrita con el título tapado y el acabado marcado «encaja» antes de publicar. Mirar el lote como miniaturas no cuenta.
- **Primero una carta.** Antes de un lote, probar el proceso con una sola carta hasta que el autor la apruebe; solo entonces repetir con más.
- **Claude no dibuja el arte final.** Claude escribe escenas, encargos y controles; las imágenes las pinta el generador (ChatGPT u otro). Dibujos vectoriales hechos por código no son propuestas.

Flujo de cada carta: `control.py plantilla <lote> <id>` → adjuntar al generador solo las rutas de «adjuntadas» → `revisar.py ... --salida fabrica/tirajes/<lote>/control/<id>-58x88.png` → llenar lectura ciega, acabado, `imagen_sha256` y `qa` → `lote.py agregar`.

1. **Recibir o escribir la escena.** Identificar carta, tipo, variante, fuente del texto y alcance del pedido.
   - Si el encargo trae guion, trabajar con la descripción íntegra de esa variante y las indicaciones posteriores del autor. Si el guion choca con las reglas por familia, señalarlo a quien lo encargó antes de dibujar.
   - Si el encargo pide proponer, escribir cada variante como una escena nueva de la leyenda o del efecto: otro lugar de la casona, otro instante u otro sujeto principal, distinta de la carta actual y de las otras variantes. Partir del efecto de juego (`fabrica/catalogo_juego.json`) y de la leyenda del ánima (`fabrica/PERSONAJES.md`), no de la composición existente.
   - Antes de escribir, leer los comentarios del autor en `fabrica/seleccion-visual.json` (campo `nota` de cada voto y lista `notas`): dicen por qué le gustó o no cada propuesta.
   - Pasar los guiones por `python3 .agents/skills/fabrica-cartas-animas/scripts/revisar_guiones.py --lote <lote>` y corregir cada observación. Conservar una copia del texto recibido o escrito junto al resultado.
   - **Mostrar siempre los guiones en el comparador web**, antes de ilustrar: `python3 .agents/skills/fabrica-cartas-animas/scripts/lote.py guiones <lote>` y enviar al autor el enlace `revision.html?lote=<lote>`. Ahí elige la escena que se dibuja y escribe por qué.
   - **ChatGPT lo usa Jonathan en su aplicación.** Claude no abre chatgpt.com ni escribe ahí: prepara el encargo en la ficha, Jonathan lo pega en su app y devuelve el texto o las imágenes.
2. **Preparar las referencias.** Consultar [la selección de estilo](../../../guias/ESTILO_DE_CARTAS.md), la [guía gráfica](../../../guias/parametros_artisticos.json) y, cuando corresponda, [los retratos](../../../fabrica/PERSONAJES.md) y [los modelos de aparatos](../../../fabrica/CONTINUIDAD.md). Abrir las imágenes. Para cada adjunto, escribir el rasgo transferible y la variante en que se necesita. Como referencia de paleta usar cartas aprobadas **de la misma familia** (para un Espanto, dos Espantos aprobados en rojo). No adjuntar la carta actual que se va a rehacer como referencia de composición: induce la réplica. Un retrato sirve para una persona visible; si solo se necesita su objeto, recortar el objeto.
3. **Dibujar el instante pedido.** Definir apoyo, contacto, dirección de la acción y punto de vista. Usar el gesto y las relaciones espaciales que pide el guion. Comprobar que una pose de retrato o una distribución de objetos no se haya trasladado por inercia. Preservar una pose concreta solo cuando el encargo sea una corrección local pedida por el autor.
4. **Aplicar el acabado.** Usar planos de tinta mate con tonos medios, cantos visibles y grano fino integrado. En pequeño debe leerse primero el acontecimiento; al ampliar, los materiales que lo explican. Aplicar la paleta de la familia y escribirla en el pedido al ilustrador; en un Espanto, nombrar también los colores prohibidos. Seguir el [formato del ilustrador](../../../fabrica/PROMPT_CHATGPT.md).
5. **Revisar los píxeles.** Antes de mirar, correr las comprobaciones automáticas: en un Espanto, `scripts/paleta_familia.py <id> <imagenes>`. Después, lectura ciega en la simulación de 58 × 88 mm y lectura ampliada de anatomía, construcción, identidad y fidelidad. Verificar a ojo las reglas por familia: nadie más que el ánima en Identidades y Espantos, ningún naipe fuera de las excepciones. Repetir tras cualquier corrección. El [procedimiento visual](referencias/revision-visual.md) explica la comparación y la prueba en papel. Entregar imagen, variante y observaciones, distinguiendo la candidatura de la aprobación del autor. Publicar siempre las imágenes en el comparador web para que el autor las vote; nunca presentarlas solo en el chat.
6. **Cerrar con la aprobación.** Registrar la aprobación de la ilustración en `catalogo/aprobaciones.json` con las palabras del autor y su alcance (escena). Aquí termina esta skill: no montar la carta. El siguiente paso es `disenar-carta-animas`.

Las [entradas](referencias/entradas.md) describen el uso en Claude, Codex y un chat con GitHub. El catálogo de escenas, la gestión de tirajes, los votos y la publicación se mantienen en el [proyecto de arte](../../../fabrica/README.md). Después de cada votación, registrar la selección con `scripts/lote.py registrar` (guarda también los comentarios del autor) y, si los votos o los comentarios revelan un patrón nuevo, anotarlo en las reglas por familia.
