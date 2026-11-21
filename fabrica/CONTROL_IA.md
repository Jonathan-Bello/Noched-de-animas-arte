# Control de calidad para arte hecho con IA

Lo que suele fallar al generar con ChatGPT (u otra IA de imagen), cómo se nota y qué hace la fábrica para evitarlo. Claude revisa cada propuesta con esta lista antes de mostrársela a Jonathan.

## Problemas y prevención

| Problema | Cómo se nota | Prevención | Si aparece |
|---|---|---|---|
| **Deriva de estilo** | Cada versión se ve un poco más lisa, brillante o «de IA» que la anterior | Las referencias de estilo son siempre cartas aprobadas, nunca la versión anterior. Máximo 2 ediciones seguidas sobre la misma imagen | Empezar de nuevo desde la ficha y las referencias |
| **Deriva de identidad** | El personaje ya no se parece a la persona real | Ficha con rasgos fijos (cara, pelo, lentes, ropa) y la ilustración de identidad aprobada como referencia | Pedir solo «recupera el rostro de la referencia», sin cambiar nada más |
| **Texto deformado** | Letras inventadas, palabras mal escritas | La IA nunca escribe texto: el título y la leyenda los pone la plantilla | Pedir la misma imagen sin texto |
| **Marco deformado** | Grecas, esquinas o franjas distintas a las del mazo | La IA no dibuja el marco: genera solo la ilustración | Recortar el marco o regenerar sin él |
| **Zonas ocupadas** | La cabeza o el objeto principal queda bajo la franja del título o la leyenda | La ficha marca las zonas libres (arriba 12 %, abajo 12 %) | Pedir más aire arriba y abajo, con el sujeto centrado |
| **Manos y anatomía** | Dedos de más, manos fundidas con objetos | Revisar manos siempre; pedir manos en poses simples | Corregir solo la mano, con edición local |
| **Fotorrealismo** | Piel con poros, metal cromado, reflejos blancos, profundidad de cámara | Bloque de estilo fijo y lista de «evitar» en cada pedido | Pedir «menos fotográfico, más ilustración del mazo» señalando la referencia |
| **Aplanado** | Todo liso, sin tonos medios ni textura, como póster vectorial | El bloque de estilo pide volumen moderado y grano de impresión | Señalar la referencia y pedir el volumen de esa carta |
| **Elementos inventados** | Aparecen objetos, símbolos o personajes que no pidió la ficha | La ficha dice qué debe verse y qué no | Pedir que quite ese elemento concreto |
| **Símbolos ajenos** | Cruces, estrellas o letras que cambian el significado (pentagramas, ouija con letras raras) | La ficha describe el símbolo exacto y su orden | Revisar el símbolo letra por letra |
| **Proporción equivocada** | Imagen cuadrada o horizontal | Pedir siempre vertical 2:3 (1024 × 1536) | Regenerar con la proporción correcta, no recortar |
| **Resolución baja** | Menos de 1024 × 1536, o escalada y borrosa | Pedir la resolución máxima vertical | Regenerar; nunca agrandar una imagen chica |
| **Colores fuera de paleta** | Neón, saturación extrema, grises fríos | La paleta del mazo está en el bloque de estilo | Pedir la paleta de la referencia |
| **Inconsistencia entre cartas de una familia** | Una herramienta se ve más detallada o con otra luz que las demás | Referencias de la misma familia en cada pedido | Comparar lado a lado con la familia antes de aprobar |
| **Contenido sensible** | Rostros de personas reales en lugares públicos sin permiso | Solo personas que dieron permiso; las fotos no se suben | No aprobar hasta tener el permiso |

## Revisión técnica (antes de mostrar a Jonathan)

- [ ] Vertical, 2:3, al menos 1024 × 1536 px
- [ ] Sin texto, letras ni marco dibujado por la IA
- [ ] Sujeto principal fuera del 12 % superior y del 12 % inferior
- [ ] Nada importante a menos de 5 % de los bordes laterales (sangrado y corte)
- [ ] Manos, caras y anatomía correctas
- [ ] Rostro igual a la identidad aprobada (si es un personaje)
- [ ] Paleta, textura y volumen como las referencias de su familia
- [ ] Sin brillos, cromados, poros ni profundidad de cámara
- [ ] Solo los elementos que pide la ficha
- [ ] Prompt guardado junto a la imagen

## Revisión de arte (Jonathan)

Se muestra en este orden:
1. La propuesta sola, junto a 3–4 cartas aprobadas de su familia.
2. La propuesta con el marco y el título, a tamaño real (58 × 88 mm).
3. Si es un personaje, junto a la identidad aprobada.

Jonathan responde una de tres:
- **Aprobada** como identidad, como escena o como carta terminada.
- **Corregir:** un cambio concreto.
- **Rechazada:** por qué, para que no se repita.
