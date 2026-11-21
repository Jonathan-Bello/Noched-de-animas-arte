# Fábrica de arte de Noche de Ánimas

Este repositorio es la **única fuente de arte** del proyecto. El juego de cartas, la demo web, el juego 3D y la imprenta toman su arte de aquí, nunca de copias sueltas.

La fábrica existe para tres cosas:
1. Saber **qué cartas tiene el juego** y en qué estado está su arte.
2. **Pedir, revisar y aprobar** arte nuevo sin que el estilo se desvíe.
3. **Entregar** el arte aprobado a cada proyecto en el formato que necesita.

## Quién hace qué

| Quién | Papel | Hace | No hace |
|---|---|---|---|
| **Jonathan** | Director | Decide qué se rehace, aprueba o rechaza cada pieza, da las referencias personales (fotos) | — |
| **Claude** | Producción central | Mantiene el catálogo del juego, escribe la ficha de cada pieza, revisa lo que llega de la IA, compone marco y textos, registra aprobaciones, exporta a juego, demo e imprenta | Aprobar por su cuenta |
| **ChatGPT** | Ilustrador | Genera la **ilustración** de una ficha, con sus referencias | Marcos, títulos, textos, íconos, aprobar |

## Una carta tiene cuatro capas

| Capa | Qué es | Quién la hace | Por qué separada |
|---|---|---|---|
| 1. Ilustración | La escena, sin marco ni letras | ChatGPT, con ficha y referencias | Es lo único que necesita IA |
| 2. Marco | Marco ornamental, franja de título con su emblema, panel de leyenda | Plantilla fija, compuesta por código | La IA deforma marcos y letras; una plantilla sale igual siempre |
| 3. Textos e íconos | Título, leyenda, y en su caso íconos de reglas | Generados desde el catálogo del juego | Las reglas cambian; el arte no debe regenerarse por eso |
| 4. Reverso | Uno por tipo de carta | Arte aprobado, fijo | Todas las cartas de un mazo deben ser idénticas por detrás |

Las 99 cartas ya aprobadas tienen las capas 1–3 fundidas en una imagen. **No se regeneran.** Las capas separadas se usan para todo lo nuevo o lo que se rehace (ver `PLAN.md`, fase 2).

## El camino de una pieza

```
Ficha → Generación → Propuesta → Revisión técnica → Revisión de arte → Aprobada → Canon → Exportación
```

1. **Ficha** (`fichas/<id>.md`). Claude la escribe con el catálogo del juego y la guía de estilo: qué es la carta, qué debe verse, qué conservar, qué evitar, qué referencias usar.
2. **Generación.** Jonathan pega la ficha en el proyecto de ChatGPT (`PROMPT_CHATGPT.md`) con las imágenes de referencia que indica.
3. **Propuesta.** El resultado se guarda en `entrada/AAAA-MM-DD_<id>/` con el nombre `<id>__v<n>.png` y, al lado, el prompt exacto que se usó (`<id>__v<n>.txt`).
4. **Revisión técnica** (Claude): resolución, proporción, zonas libres para título y leyenda, parecido, errores típicos de IA (`CONTROL_IA.md`). Si falla, vuelve a generación con una sola corrección concreta.
5. **Revisión de arte** (Jonathan): la propuesta se muestra junto a las cartas aprobadas de su familia, primero sola y después con el marco a tamaño real.
6. **Aprobada.** Se registra en `catalogo/aprobaciones.json` con fecha, alcance (identidad, escena o carta terminada) y las palabras de Jonathan.
7. **Canon.** Solo entonces entra en `catalogo/canon.cartas.json`, con su hash.
8. **Exportación.** `herramientas/exportar.py` entrega el canon a cada proyecto con su candado (`arte.lock.json`).

Los rechazos no se borran: quedan en `entrada/` con una línea que diga por qué, para no repetir el error.

## Estados del arte

| Estado | Significa |
|---|---|
| ✅ Aprobado | En el canon; es la versión que usan todos los proyectos |
| 🟡 Arte aprobado, falta carta | La ilustración está aprobada pero no la carta terminada con marco |
| 🟡 Candidato | Hay propuesta entregada; falta que Jonathan la valore |
| 🔴 Rehacer | Jonathan pidió corregirla |
| ⬜ Falta | No existe todavía |

El estado de cada carta está en `CARTAS_DEL_JUEGO.md`.

## Archivos de la fábrica

| Archivo | Qué es |
|---|---|
| `CARTAS_DEL_JUEGO.md` | Todas las cartas del juego: ids, copias, reverso, qué hace y estado del arte. Generado |
| `catalogo_juego.json` | Lo mismo, para programas. Generado con `herramientas/catalogo_juego.mjs` |
| `PLAN.md` | Plan de trabajo por fases y decisiones pendientes |
| `PROMPT_CHATGPT.md` | Instrucciones fijas para el proyecto de ChatGPT |
| `CONTROL_IA.md` | Problemas típicos de la IA y cómo se evitan |
| `fichas/` | Una ficha por pieza a crear o rehacer |
| `entrada/` | Propuestas recibidas, con su prompt, aprobadas o no |

## Reglas que no se rompen

- **El canon manda.** Nunca se usa una imagen por ser la más reciente.
- **Las referencias de estilo son siempre cartas aprobadas**, nunca la propuesta anterior. Iterar sobre la última imagen hace que el estilo se desvíe poco a poco.
- **La IA no escribe texto.** Títulos, leyendas y números los pone la plantilla.
- **Un cambio por pedido.** Si una propuesta tiene tres problemas, se corrigen de uno en uno o se vuelve a la ficha.
- **Las fotos de personas reales nunca se suben al repositorio.**
- **Los ids, cantidades y reglas los define el juego**, no este repositorio.
