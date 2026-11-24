# Ficha · ev3 · Objetos movidos

> Lote `segunda-tirada-01` · preparada con la skill `fabrica-cartas-animas` (commit 561037d). Pega la ficha en un chat nuevo del proyecto de ChatGPT y adjunta las imágenes de «Adjuntar».

**Tipo:** evidencia · **Familia:** Evidencias · **Copias:** 1 · **Reverso:** `back05` · **Arte actual:** `e04`
**Qué hace en el juego:** La busca: Cámara de movimiento. El ánima la entrega cuando se confirma.
**Estado:** rehacer → Generar variantes A y B (solo ilustración).

## Qué debe contar la imagen
Evidencia Objetos movidos (la busca la Cámara de movimiento).

## Variante A · escena principal
Arte que el autor quiere modificar. Una silla desplazada deja cuatro marcas limpias en el polvo; el desplazamiento se lee por la distancia entre cada pata y su marca.

## Variante B · alternativa
La mesa puesta para la cena: un solo plato quedó al revés y su cubierto, al otro extremo.

**Igual en A y B:** el indicio es la distancia entre un objeto y el lugar donde estaba, sin aparatos y sin personas, con área de descanso alrededor del indicio (regla de la familia).
**Cambia:** A es una silla de pie desplazada con cuatro marcas limpias en el polvo; B es una mesa puesta donde un solo plato está volteado y su cubierto al otro extremo.

**Voto registrado:** lote `frentes-01`, opción `original`, alcance `preferencia_visual`.

## Debe verse
- La distancia entre el objeto y donde estaba.
- A: la silla **de pie** (no volcada) y, separadas de sus patas, cuatro marcas rectangulares limpias en un piso con polvo; la distancia entre cada pata y su marca se lee sin esfuerzo.
- B: el único plato al revés destaca entre platos iguales bien puestos; el cubierto que le corresponde está al extremo opuesto de la mesa.

## No debe verse
- Texto, letras, números, firmas, marco, franjas o íconos: los pone la plantilla.
- Celulares, aparatos inalámbricos o pantallas modernas (equipo atemporal: casete, botones físicos, pantallas sencillas, cámara compacta sobre trípode).
- Personas que no sean los cinco investigadores; los roles con nombre solo aparecen en su carta de rol.
- La escena de «Cámara de movimiento» (`t3`), que es otra carta: La cámara sobre su trípode, en primer plano, apunta a una silla de madera a medio caer, todavía apoyada en dos patas y a dos cuadros desplazados en la pared. Debe leerse cámara y suceso aunque se tape el título (indicación del autor del 24-nov).
- La escena de «Lluvia de objetos» (`h3`), que es otra carta: (se conserva) Remolino de objetos (cámara, microscopio, brújula, lupa, frascos, silla) sobre dos investigadores y sus morrales.
- Silla volcada y cuadros torcidos: es la escena del arte actual `e04` y pasa a la herramienta `t3`.
- Cámaras, trípodes o cualquier aparato: la evidencia no muestra la herramienta que la detecta.

## Composición
- Vertical 2:3 a sangre completa. Sujeto principal fuera del 12 % superior (título) y del 12 % inferior (leyenda); nada importante a menos del 5 % de los bordes laterales.
- A: vista en picado de tres cuartos para que el piso y las marcas ocupen el centro. B: vista cenital o casi cenital de la mesa.
- Luz: rasante desde un lado (veladora o ventana) para que el polvo y las marcas tengan relieve; paleta petróleo y crema de la familia, como `e01`.
- Acabado secundario: «Lluvia de objetos» (`h3`, `web/miniaturas/h04@2x.webp`, Conservar) para materiales de madera y loza, sin repetir su remolino.

## Adjuntar
Abrir cada imagen y entregar al generador **la imagen misma**, no el enlace.

| Imagen | Función | Qué aporta | ¿Adjuntar? |
|---|---|---|---|
| `web/miniaturas/e04@2x.webp` | voto original anterior · superado · arte actual · el autor quiere modificarlo | Indicación posterior del autor: quiere modificar esta carta. El voto ya no la vuelve referencia. No usar como referencia de estilo ni de composición; sirve para saber qué no repetir. | no: solo consulta |
| `web/miniaturas/e01@2x.webp` | acabado de la familia | «Bajo cero» (ev0), carta Conservar de Evidencias: materiales, planos y nivel de detalle. | sí |
| `web/miniaturas/h04@2x.webp` | acabado secundario (añadido a mano) | «Lluvia de objetos» (h3), Conservar, elegida en ESTILO_DE_CARTAS («Acciones y evidencias»): madera, loza y papel con volumen. No repetir su remolino. | sí |

## Cómo se revisa
- Ver cada variante ampliada y a 58 × 88 mm (`scripts/revisar.py`), con el título tapado.
- Al tapar el título debe leerse: La distancia entre el objeto y donde estaba.
- Comparar materiales, planos y nivel de detalle con las referencias de acabado; pasar `fabrica/CONTROL_IA.md`.
- **Criterio de aceptación:** a 58 × 88 mm y con el título tapado se señala dónde estaba el objeto y dónde está ahora (las cuatro marcas vacías en A; el plato volteado y su cubierto lejano en B). Puesta junto a `t3`, no comparte la silla volcada, los cuadros ni la cámara.
