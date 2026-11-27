# Montaje de la carta terminada (paso g)

**Solo bajo pedido.** El modo predeterminado de la skill entrega únicamente la ilustración. El montaje empieza cuando se cumplen dos condiciones:
- la ilustración del lote está aprobada por el autor, no solo votada;
- el autor pide la carta terminada.

Hasta entonces, las cartas Conservar y las ilustraciones de rol aprobadas siguen como están.

## Las cuatro capas (ver `fabrica/README.md`)

| Capa | Fuente |
|---|---|
| 1. Ilustración | La variante aprobada, en `fabrica/entrada/…` (original) y en `web/revision/<lote>/` (vista) |
| 2. Marco | Geometría de `web/plantillas/carta-base.svg`: 64 × 94 mm con sangrado y corte de 58 × 88. Franja de título de y = 3.2 a 11.7 mm, ilustración de 11.7 a 82.3 mm, leyenda de 82.3 a 90.8 mm. Filete oro `#E2A447` |
| 3. Textos e íconos | **Título:** `nombre` en `fabrica/catalogo_juego.json`; si el autor lo renombró (Cadenas → Penitencia), manda su indicación en `datos_*.py`. **Color de franja:** `web/plantillas/paleta.json` → `franjas[<tipo>]`. **Emblema:** `iconos/cartas/recursos-juego/` (`tipo_*.svg`, `ev_<n>.svg` para evidencias, `familia_<mano\|ojo\|corazon\|escudo>.webp` para roles; la asignación de roles está en `guias/ESTILO_DE_CARTAS.md`). **Leyenda narrativa:** hoy está fundida en la imagen aprobada (`web/miniaturas/<id_arte>@2x.webp`); se transcribe y se confirma con el autor |
| 4. Reverso | `reverso` de la carta en el catálogo (`back01`, `back05`…). Vista previa en `web/miniaturas/<reverso>@2x.webp`; para imprenta se usa el canon (`catalogo/canon.cartas.json` → `reversos`) |

**Tipografías:** «Titulo Carta» para los títulos y «Leyenda Carta» en itálica para la leyenda, como en las plantillas de cordura.

## Procedimiento

1. Verifica el emblema y el color contra una carta aprobada de la misma familia antes de componer. Un adorno recortado del reverso no sustituye al emblema.
2. Compón en SVG por código, nunca con IA. El ejemplo que ya funciona es `herramientas/tarjeta_cordura.py`: arma el SVG y lo renderiza con Playwright. Para un lote de montaje usa [`herramientas/montar_carta.py`](../herramientas/montar_carta.py) (`python3 herramientas/montar_carta.py <lote>`): monta las piezas, deja los SVG con sangrado en `fabrica/tirajes/<lote>/montaje/` y publica las vistas en el selector.
3. Revisa a 58 × 88 mm:
   - la cabeza o el objeto principal no quedan bajo la franja;
   - la leyenda tiene aire a los lados;
   - el panel de leyenda se apoya contra el marco inferior y solo redondea las esquinas superiores.
4. Prueba física en tabloide: 3 mm de sangrado en el frente y 2 mm en el reverso.
5. La aprobación de la carta terminada se registra **aparte** de la aprobación de la ilustración, en `catalogo/aprobaciones.json` con el alcance «carta terminada» y las palabras del autor. Solo después pasa al canon con su hash.
