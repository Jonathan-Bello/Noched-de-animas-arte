# Plan de trabajo de la fábrica de arte

Claude coordina; Jonathan decide. Cada fase termina con algo que se puede usar.

## Dónde estamos (21-nov-2026)

El juego tiene **111 caras distintas y 169 cartas físicas** (165 cartas y 4 tarjetas de cordura). Ver `CARTAS_DEL_JUEGO.md`.

| Estado del arte | Caras | Cuáles |
|---|---|---|
| ✅ Aprobado | 99 | Todo el juego base, los objetos malditos (menos el Pentagrama), consulta y reglas |
| 🟡 Candidato | 8 | 7 roles y Velar |
| 🟡 Arte aprobado, falta carta | 1 | Manifestar |
| 🔴 Rehacer | 1 | El Vigía |
| ⬜ Falta | 2 | Pentagrama y tarjeta de cordura |

Además faltan 3 reversos por aprobar: el de roles, el de rol usado y el de espíritus.

**Hallazgo:** las imágenes WebP del canon miden **1160 × 1760 px**, unos 500 dpi a tamaño de carta. El juego y el PDF de imprenta del 20-nov usaban copias de 580 × 880 px. Imprimir desde el canon da el doble de nitidez.

## Fase 0 · Base de la fábrica ✅ (hecha)

- Catálogo del juego con las dos numeraciones (juego ↔ arte), copias, reversos, qué hace cada carta y estado del arte (`catalogo_juego.json`, `CARTAS_DEL_JUEGO.md`). Se regenera con `herramientas/catalogo_juego.mjs`.
- Sistema de trabajo (`README.md`), control de calidad de IA (`CONTROL_IA.md`), prompt fijo para ChatGPT (`PROMPT_CHATGPT.md`).
- Fichas de lo que falta: Vigía, Pentagrama y tarjeta de cordura.

## Fase 1 · Ordenar y decidir (Claude prepara, Jonathan decide)

1. **Página de revisión de roles:** los 8 roles, Velar, Manifestar y los 3 reversos, cada uno junto a su identidad aprobada, con ✓ / ✗ / corregir. Tus respuestas se registran como aprobación en `catalogo/aprobaciones.json`.
2. **Imágenes fuera de LFS:** las 3 pruebas de `archivo/arte/` se guardaron como archivo normal; pasarlas a LFS o al historial.
3. **Enlaces rotos:** la portada ofrece dos PDF de imprenta que no están en el repo. Se generan desde el canon y se suben como Release.
4. **Derechos:** agregar `LICENSE` («Todos los derechos reservados») y decidir si el repo sigue público.

## Fase 2 · Plantillas de carta (Claude)

Para que el arte nuevo salga igual al aprobado sin que la IA dibuje marcos ni letras.

1. Reconstruir el **marco** de cada tipo de carta a partir de las cartas aprobadas: borde ornamental, franja de título con su color y emblema, panel de leyenda.
2. Identificar las **tipografías** del título y la leyenda (o la más parecida libre de uso).
3. **Compositor:** ilustración + marco + título + leyenda → carta terminada a 1160 × 1760 y versión de imprenta con 3 mm de sangrado.
4. **Prueba de igualdad:** recomponer 5 cartas aprobadas desde sus partes y compararlas con las originales. Si no salen iguales, no se usa.

## Fase 3 · Producción de pendientes (ChatGPT ilustra, Claude revisa y compone, Jonathan aprueba)

En este orden, por lo que bloquean:
1. **El Vigía** (ficha lista).
2. **Pentagrama** (ficha lista; falta que apruebes el concepto).
3. Roles que marques «corregir» en la fase 1.
4. **Tarjetas de cordura** (ficha lista; faltan 2 decisiones).
5. Después de imprimir el prototipo: bloc de deducción, caja y portada del reglamento.

## Fase 4 · Uso de las cartas en la mesa (decisión de diseño)

Hoy las cartas llevan solo título y leyenda. Para jugar sin la demo, cada jugador necesita saber qué hace cada carta. Hay tres caminos, y se puede combinar:

| Opción | Qué es | A favor | En contra |
|---|---|---|---|
| A. Solo arte + consulta | Las cartas quedan como están; el efecto se lee en cartas de consulta y en el bloc (tabla de ánimas con sus evidencias) | Respeta tu decisión de roles sin texto | Hay que buscar en la consulta a cada rato |
| B. Íconos en la carta | Una banda de íconos (ya existe el sistema de 40 pictogramas) bajo el título: costo, tirada, efecto | Se lee de un vistazo y no tiene idioma | Hay que aprender los íconos |
| C. Texto corto en la carta | Un panel con el efecto en una línea, como en las pruebas de `archivo/arte/` | Lo más claro para quien empieza | Tapa parte del arte; cada cambio de regla obliga a reimprimir |

**Recomendación:** B para el mazo de investigadores, el del ánima y los Espantos; A para los roles (como ya decidiste) más una carta de consulta de roles; y en las identidades, los 3 íconos de sus evidencias. Con las plantillas de la fase 2, los íconos salen del catálogo del juego y se actualizan solos cuando cambia una regla.

## Fase 5 · Entregas a cada proyecto (Claude)

1. **Juego de cartas y demo web:** que tomen su arte de aquí con los ids del juego (`t0`, `es_llorona`, …), con candado de versión, en vez de su copia propia.
2. **Imprenta:** el PDF tabloide desde el canon a 1160 × 1760, con sangrado real; versión RGB y CMYK; publicado como Release con etiqueta (`arte-AAAA-MM-DD`).
3. **Juego 3D:** exportación por personaje (retratos, hojas de personaje) sin mezclar con las cartas.

## Fase 6 · Revisión automática (Claude)

En cada cambio, GitHub comprueba sin descargar imágenes (para no gastar el límite de LFS):
- que el catálogo del juego y el canon coinciden en ids, copias y reversos;
- que ninguna imagen nueva quedó fuera de LFS;
- que lo que está en el canon tiene una aprobación registrada.

## Decisiones que necesito de ti

1. **Roles, Velar, Manifestar y sus reversos:** aprobar o pedir cambios (fase 1).
2. **Concepto del Pentagrama:** ¿te sirve la propuesta de la ficha?
3. **Tarjetas de cordura:** ¿con retrato de cada investigador o iguales? ¿Escala al lado o abajo?
4. **Uso en la mesa:** ¿A, B, C o la combinación recomendada? (fase 4)
5. **Visibilidad del repo:** ¿público o privado? Ahora mismo cualquiera puede descargar el arte y las caras de tus amigos.
