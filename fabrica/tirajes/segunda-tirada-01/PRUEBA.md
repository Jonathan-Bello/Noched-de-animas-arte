# Prueba de la skill `fabrica-cartas-animas` · 24-nov-2026

Esta prueba prepara las fichas de t3, t4 y ev3 **sin generar imágenes**. El tiraje y la publicación en el selector corresponden al siguiente encargo. Este lote (`segunda-tirada-01`) queda listo para retomarse.

## Resultado por carta

| ID | Ficha | Referencias (rutas reales) | Elementos obligatorios | Criterio de aceptación |
|---|---|---|---|---|
| `t3` Cámara de movimiento | [t3.md](t3.md) | **Modelo y versión preferida:** `web/miniaturas/i04@2x.webp`. **Acabado:** `web/miniaturas/i06@2x.webp` (Espejo de mano) | Cámara compacta sobre trípode con las patas en el piso; lente apuntando al mueble movido; A: silla a medio caer y dos cuadros torcidos; B: pantalla sencilla con la mecedora quieta frente a la real en balanceo | Con el título tapado, a 58 × 88 mm, se señalan la cámara con su trípode, hacia dónde apunta y el mueble movido en ese eje |
| `t4` Detector EMF | [t4.md](t4.md) | **Identidad:** `web/mesa/arte/inv_rafael.webp` y `web/miniaturas/i10@2x.webp` (Respirar hondo). **Modelo del aparato:** `web/miniaturas/i05@2x.webp`. **Concepto, solo consulta:** `web/revision/herramientas-02/t4-b.webp`. **Acabado:** `web/miniaturas/i06@2x.webp` | A (concepto del voto B): Rafael con el EMF de cinco luces y focos de cuartos contiguos parpadeando. B (alternativa de la ficha): EMF en repisa y focos de papel picado apagándose hacia él | Se cuentan las cinco luces; en A, al menos una lámpara de otro cuarto en distinto estado de luz; Rafael se reconoce por chaleco verde y paliacate rojo; el aparato coincide con `i05` |
| `ev3` Objetos movidos | [ev3.md](ev3.md) | **Acabado:** `web/miniaturas/e01@2x.webp` (Bajo cero) y `web/miniaturas/h04@2x.webp` (Lluvia de objetos, añadida a mano). **Arte actual, solo consulta:** `web/miniaturas/e04@2x.webp` | A: silla de pie desplazada y cuatro marcas limpias en el polvo; B: un plato volteado entre platos bien puestos y su cubierto en el otro extremo; sin aparatos ni personas | Con el título tapado se señala dónde estaba el objeto y dónde está; junto a `t3` no comparte silla volcada, cuadros ni cámara |

## Distinción entre t3 y ev3

| | `t3` | `ev3` |
|---|---|---|
| Tipo y reverso | herramienta · `back01` | evidencia · `back05` |
| Arte vigente | `i04` | `e04` |
| Qué se ve | El aparato que detecta | El indicio que se detecta, sin aparato |
| Escena A | Cámara + silla **caída** + cuadros torcidos | Silla **de pie** + marcas en el polvo |
| Relación | `ficha.py` lista ev3 en «No debe verse» de t3 | `ficha.py` lista t3 (y h3) en «No debe verse» de ev3 |
| Entrada en el selector | `web/revision/segunda-tirada-01/t3-a.webp`… | `web/revision/segunda-tirada-01/ev3-a.webp`… |

El arte vigente de ev3 (`e04`: silla volcada y cuadros torcidos) es casi la escena A de t3. Por eso la ficha de ev3 lo marca como «no repetir», y la escena nueva usa una silla de pie.

## Pruebas ejecutadas en esta sesión

| Prueba | Resultado |
|---|---|
| `ficha.py t3 t4 ev3 --comprobar` desde `.agents/skills/…` | OK: 3 fichas, 9 referencias encontradas |
| La misma comprobación desde `.claude/skills/…` | OK, y la salida `--json` es idéntica desde las dos entradas |
| `sincronizar_skill.py --comprobar` | OK. Al editar la copia de `.claude` a mano, falla y nombra el archivo; un archivo de más también se detecta |
| Enlaces relativos de la skill desde las dos entradas | Todos abren (los valida `--comprobar`) |
| `lote.py comprobar` sobre los lotes reales | OK: 2 lotes, 72 cartas, IDs únicos, archivos y hashes correctos |
| `revisar.py t3` con las propuestas de `herramientas-02` | La hoja muestra A y B ampliadas y a 58 × 88 mm con título tapado. Confirma por qué se descartaron: ninguna muestra la cámara |
| Ciclo completo en una **copia** del repo (lote `prueba-01`, no publicado) | `agregar` t3, t4, ev3 → 3 cartas. Repetir t3 → «sin cambios». Carta Conservar (t5) → rechazada |
| Selector en Chromium con el lote de prueba | El menú lista los 3 lotes desde `lotes.json`; `?lote=` abre el pedido; sin parámetro, el primero; un lote inexistente avisa; `frentes-01` sigue funcionando. Votar A/B/original y descargar el JSON funciona |
| `registrar` dos veces el mismo JSON | 3 elecciones la primera vez, 0 la segunda. t4 conserva su voto anterior en `historial` |
| Sustituir A de t3 y de t4 y agregar t0 | El selector muestra «2 de 4»: el voto A de t3 queda pendiente; t4 (votado B) y ev3 se conservan; t0 es nueva. `lote.py estado` avisa «la imagen cambió: votar de nuevo» |

## Pendientes de otra sesión o de otro asistente

- **Codex:** que `$fabrica-cartas-animas` aparezca en `/skills` y ejecute `ficha.py --lote segunda-tirada-01`. Requiere una sesión de Codex sobre un checkout.
- **Claude Code en tu computadora:** que `/fabrica-cartas-animas` aparezca al abrir el repo clonado. Aún no está clonado.
- **ChatGPT Work:** abrir `.agents/skills/fabrica-cartas-animas/SKILL.md` en GitHub, encontrar `fabrica/tirajes/segunda-tirada-01/t4.md` y ver `web/mesa/arte/inv_rafael.webp` por su ruta.
- **El CI `Skill`** corre al abrir el PR.
