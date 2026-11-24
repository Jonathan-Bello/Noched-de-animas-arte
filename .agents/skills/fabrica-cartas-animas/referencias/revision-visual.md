# Dirección y revisión de una propuesta

Partir de las imágenes que identifica la ficha y de la selección de la [dirección de arte](../../../../guias/ESTILO_DE_CARTAS.md). Registrar qué rasgo aporta cada archivo antes de pasarlo al ilustrador. Si se descarta una ronda, abrir una composición nueva desde esas fuentes. El comentario del autor puede conservar una idea aunque se descarte todo el dibujo.

## Leer el acabado en las cartas base

| Referencia | Observación visible | Decisión para otra escena |
|---|---|---|
| Espejo de mano, i06 | El calado deja ver el fondo entre huecos; mano, mango y espejo se solapan con bordes distintos. El bordado sigue la manga. | Dibujar el canto del aparato, el contacto con la mano y un material secundario con su propio detalle. |
| Rosario, i11 y Limpia con huevo, o04 | Las cuentas cuelgan por gravedad. El brazo de la limpia se puede seguir hasta el huevo; los dedos que lo sujetan se agrupan en una sola acción. | Elegir el agarre antes del ornamento. Conservar el eje del antebrazo hasta la muñeca y explicar qué sostiene el peso. |
| Respirar hondo, i10 y Bajo cero, e01 | Solapas, bolsillos, puños y ala del sombrero tienen espesor. La silueta del aliento se distingue del dibujo de la ventana. | Usar planos de tinta para el volumen. Reservar contraste local para la evidencia. |
| Lluvia de objetos, h04 y Cacería total, a09 | Los muebles inclinados conservan su construcción. En la casa, ventanas y arcos forman ritmos dentro de masas de sombra amplias. | Construir primero el objeto entero y rotarlo como una pieza rígida. Separar por tono los planos de arquitectura. |
| Copal, i14 y Espejo de obsidiana, o08 | El calado del recipiente, el humo y el reflejo se distinguen por silueta y material. | Resolver brillo pintado, canto, sombra de contacto u orificio donde corresponda. Distribuir el detalle alrededor de un foco legible. |

## Antes de generar

Leer por separado A y B. Preparar para cada variante una frase de acción, el elenco visible (incluido «solo mano y manga»), el punto de vista y un indicio físico que se pueda señalar. Abrir las imágenes de «Adjuntar» y relacionarlas por nombre con sus funciones en el prompt. Cuando una imagen sirve de modelo y se ha pedido cambiar su acabado, trasladar solo los rasgos del modelo. Usar únicamente las imágenes base vigentes y expresamente elegidas para el acabado. En un encargo nuevo, las propuestas descartadas sirven al revisor para diagnosticar el error y quedan fuera del generador.

**Ejemplo de transferencia.** En Velar, el retrato de Rafael fija pelo, barba y vestuario. El guion pide que proteja a Inés: localizar el hombro de ella, el contacto de los dedos y la dirección de su antebrazo antes de encuadrar a ambos. La pose de exhibir el detector pertenece al retrato. Para una escena sin personas, aplicar la misma pregunta a la relación espacial entre objetos: en Cámara A el eje del trípode y los apoyos de la silla a medio caer determinan el encuadre.

Comparar al mismo tamaño con la referencia dominante. Imaginar las dos siluetas sin color ni adornos. Si el mismo contorno, gesto y distribución cuentan otra vez la escena de la base, rediseñar la relación que pide la ficha. Un cambio de fondo, color, espejo horizontal o zoom conserva esa relación. Admitir semejanzas que sean consecuencia física de la acción, como el agarre seguro de una linterna. Registrar una frase que explique la decisión y revisar después el corte real.

## Al recibir los píxeles

1. Empezar en la fila de mesa con las bandas tapadas. Describir el primer foco y la acción antes de leer el encargo. Para herramientas, señalar aparato e indicio. Para cartas de acción, buscar el gesto; para identidades, la silueta; para reglas y consulta, el orden de lectura. Comparar con la base al mismo tamaño. Una escala en pantalla simula la ocupación; verificar tamaño físico, contraste de tinta y comodidad con una impresión al 100 %.
2. Ampliar para seguir manga, antebrazo, muñeca, palma, pulgar y puntos de contacto. Para muebles, seguir respaldo, asiento, patas y sombras de apoyo. Comparar un material principal y uno secundario con la base. Comprobar después del corte los extremos del trípode, pelo, manos y elementos que identifican al personaje.
3. Registrar por variante qué se vio, en qué zona y qué corregir. Un defecto visible de anatomía, construcción o identidad devuelve esa variante a ilustración. Conservar las observaciones aunque una hermana del par pase. El autor decide la preferencia entre candidatas revisadas.

## Casos para volver a probar la fábrica

- UV A. Solo entran mano y manga de Inés. Seguir una muñeca natural hasta el cilindro; el pulgar se opone a los dedos que sujetan el cuerpo. La lente origina el haz que revela dos pisadas. Rechazar una muñeca quebrada aunque se lean las dos huellas.
- Cámara A. Cámara y trípode apuntan a una silla a medio caer. Imaginar la silla enderezada: el asiento une cuatro patas y un respaldo; el vuelco conserva las uniones. Debe verse el apoyo y el aire bajo las patas levantadas. Comprobar que los dos cuadros desplazados sean secundarios.
- EMF A. Comprobar por separado el agarre de Rafael, la escala de mano del detector, las cinco luces y los dos estados de iluminación. Un detector que parece prolongación del antebrazo devuelve la variante a ilustración.

Para comparar versiones de la skill, usar la misma ficha y las mismas referencias en sesiones independientes, anotar el resultado de cada observación y mostrar al autor ambas lecturas. Diferenciar revisión técnica, preferencia y aprobación. Métodos de referencia: [evaluaciones de Agent Skills](https://agentskills.io/skill-creation/evaluating-skills) y [prácticas de Anthropic](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices).


## Calibrar un cambio de dirección

Registrar por separado reproducción guiada y composición nueva. Una réplica casi idéntica demuestra que el modelo siguió una referencia; la transferencia exige resolver el gesto con otro encuadre. Para ahorrar llamadas, agrupar estudios pequeños independientes; repetir de forma aislada los casos donde fallan construcción o lectura. Revisar el panel individual después del corte para descubrir pérdidas que oculta el mosaico.

Puntuar cada eje de 0 a 2: (1) lectura a mesa, (2) construcción, (3) acabado, (4) identidad o modelo y (5) composición y efecto. Cero = ausente o incorrecto; uno = reconocible con pérdida; dos = coincide en la característica observable. Usar 9/10 como objetivo interno por caso. Un defecto grave de anatomía, una acción incorrecta o la pérdida de un rasgo imprescindible bajo la banda devuelve el caso a ilustración incluso con una suma alta. Guardar notas por ronda y distinguir una puntuación visual de la probabilidad de gustar al autor.

En la prueba de transferencia, identificar explícitamente qué insumo gobierna el aparato, cuál gobierna la identidad y qué objetos del retrato quedan fuera. Velar requiere ver el bordado a través de la mano espectral. Para EMF usar el aparato original aunque el retrato lleve otro medidor. Cuando el grano y el calado se vuelvan más intensos que en la base, reducir contraste local en el fondo y comprobar de nuevo a tamaño de mesa.

Para piel y manos, comparar el número y la forma de las sombras con la referencia. En Tu turno, los dedos se explican con silueta crema y sombra ocre en el contacto. Uñas modeladas, arrugas y biseles pueden verse anatómicamente plausibles y aun así apartarse del dibujo del mazo. En consulta y componentes, renderizar textos, iconos, numeración y escala con plantilla y comprobar alineación y área útil del retrato.

## Evitar el doble recorte en estudios de reproducción

En un ejercicio explícito de réplica, usar el frente completo para medir el encuadre. En producción, usar la plantilla de corte para los márgenes y la ficha vigente para la composición. Una corrección local conserva el encuadre de la pieza que el autor indicó editar. Un recorte de textura, aparato o anatomía puede acompañarlo con su función indicada. Recortar el interior de una carta, ajustarlo a 2:3 y después colocar las bandas vuelve a comer parte de la composición. En el PDF de prueba verificar el contorno entero del espejo, la cabellera del personaje y el hocico y las garras del Nahual. Partir de un plano más abierto si alguno invade el corte. En espíritus comprobar que la trama del vestuario siga visible bajo el contacto traslúcido.

En una segunda lectura, ocultar título y ficha y pedir a otro lector una descripción espontánea. Un revisor informado puede contar las cinco luces del EMF y aun así sobreestimar la lectura del parpadeo. Si el lector reconoce el objeto pero omite el fenómeno, ajustar mirada, escala y contraste de los elementos que deben relacionarse. Una referencia de identidad sin indicaciones de gesto puede arrastrar la pose y la utilería al nuevo dibujo.

En EMF el índice de colores puede mejorar mientras empeora la anatomía. Identificar el hombro del que nace la manga y comprobar qué mano corresponde a ese brazo antes de puntuar. Si ya se resolvió la pose, modificar solo la iluminación de fondo para cambiar el primer foco. Volver a comprobar la mano después de cada edición localizada.
