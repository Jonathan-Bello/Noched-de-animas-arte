---
name: fabrica-cartas-animas
description: Prepara, revisa y publica tirajes de ilustraciones de las cartas de Noche de Ánimas a partir de un lote o una lista de IDs. Incluye fichas con referencias aprobadas, variantes A y B, revisión a 58 × 88 mm, publicación en el selector y registro de la elección del autor. El montaje final se hace solo bajo pedido. Úsala para rehacer, generar, corregir, comparar o montar cartas, y para retomar un lote.
---

# Fábrica de cartas · Noche de Ánimas

Esta skill vive en el repositorio de arte `Jonathan-Bello/Noched-de-animas-arte`. Las rutas son relativas a su raíz. Los scripts están en `scripts/`, junto a este archivo, y se ejecutan desde la raíz:

```
python3 .agents/skills/fabrica-cartas-animas/scripts/ficha.py t3 t4 ev3
```

En Claude Code la misma skill está en `.claude/skills/fabrica-cartas-animas/`, y cualquiera de las dos rutas funciona.

**Entrada del encargo:** un nombre de lote, una lista de IDs o las dos cosas.

**Modo predeterminado:** `arte`, que produce solo la ilustración, sin marco, título, íconos, leyenda ni reverso.

**Modo `montaje`:** se usa solo cuando el autor aprueba el lote y pide la carta terminada (paso g).

## Alcance del encargo

Una revisión de estilo, un comentario sobre una variante o una petición de pulir esta skill se atienden leyendo las fuentes, examinando los dibujos existentes y actualizando los criterios o fichas correspondientes. Para crear imágenes o publicarlas, comprobar que el encargo vigente pida esa operación. Registrar una preferencia por la composición con ese alcance.

## Antes de empezar

1. Lee `AGENTS.md` de la raíz y [referencias/fuentes.md](referencias/fuentes.md). Ese archivo dice dónde vive cada decisión artística. La skill no copia decisiones: si cambian, se corrigen en su fuente.
2. Reglas que no se rompen:
   - **El canon manda.** Nada pasa a `catalogo/canon.cartas.json` ni a `catalogo/aprobaciones.json` sin las palabras de Jonathan.
   - Un voto en el selector es una preferencia, no una aprobación.
   - La IA no escribe texto ni dibuja el marco.
   - Las fotos de personas reales nunca entran al repositorio.
   - Los IDs, cantidades y reglas los define el juego.
   - Las instrucciones nuevas del autor prevalecen sobre los registros anteriores.
3. Quién hace qué:
   - **ChatGPT** genera las ilustraciones.
   - **Claude o Codex** preparan las fichas, revisan, publican en el selector, registran las elecciones y montan.
   - Claude puede además **editar o rehacer una imagen por código**: recolorear (por ejemplo, el poncho de Fermín a naranja), recortar, reencuadrar o corregir una zona. Esa edición es una propuesta más: se guarda en `fabrica/entrada/` con un `.txt` que describe la operación y el comando usado.

## Procedimiento de un tiraje

### a) Fichas y alcance

```
python3 .agents/skills/fabrica-cartas-animas/scripts/ficha.py --lote <lote> <ids…> --escribir
```

El comando crea `fabrica/tirajes/<lote>/encargo.json` y una ficha `<id>.md` por carta, con la estructura de `fabrica/fichas/_plantilla.md`.

La ficha sale de `fabrica/descripciones/datos_*.py`, a través de `descripciones.json`, del catálogo del juego, de los votos y de PERSONAJES y CONTINUIDAD.

El comando nunca sobrescribe una ficha existente. Completa a mano cada línea `(completar)`. Si encuentras un error en la escena, el estado o la alternativa, corrígelo en `datos_*.py` y vuelve a generar con `python3 herramientas/descripciones.py`. Las páginas `.md` de descripciones nunca se editan a mano.

Respeta el estado de cada carta y no amplíes el alcance pedido:

| Estado | Qué hacer |
|---|---|
| Rehacer o Falta | Generar A y B. |
| Conservar | No se genera. Es la referencia de acabado de su familia. |
| Ilustración aprobada · falta carta | No se genera arte. Solo se monta en el paso g. |
| En espera de reglas o Documentación | Queda pendiente; se anota en `encargo.json` como «fuera del tiraje». |
| Por decidir | Preguntar al autor. |

### b) Referencias: abrir las imágenes y decir qué aporta cada una

La tabla «Adjuntar» de la ficha da, para cada imagen, su ruta real y su función:
- identidad del investigador;
- identidad en una carta elegida;
- identidad del ánima o del rol;
- modelo del aparato;
- concepto de escena;
- acabado de la familia;
- arte actual.

**Abre cada imagen** y escribe en la ficha el rasgo concreto que se conserva, por ejemplo «canto de la carcasa y rejilla del EMF». Al generador se le entregan **las imágenes mismas** junto con la ficha: un enlace o un hash solo identifica la versión. Las marcadas «no: solo consulta» no se adjuntan, porque son conceptos sin aprobación del dibujo o artes que el autor quiere cambiar.

`ficha.py … --comprobar` falla si una referencia no existe.

### c) Personajes y continuidad

Aplica [PERSONAJES.md](../../../fabrica/PERSONAJES.md) y [CONTINUIDAD.md](../../../fabrica/CONTINUIDAD.md):
- Las personas son los cinco investigadores: Inés, Rafael, Tomás, Amalia y Padre Mateo. No hay extras anónimos.
- Los ocho roles aparecen solo en su carta de rol.
- Cada Espanto repite la figura de la identidad de su ánima.
- El equipo es atemporal: casete, botones físicos, pantallas sencillas, indicadores de color y cámara compacta sobre trípode. Nada de celulares ni aparatos inalámbricos.
- Conserva los rasgos fijos de cada personaje y el modelo de cada aparato.

### d) Variantes A y B

- Preparar el encargo y revisar el resultado con [la dirección y revisión visual](referencias/revision-visual.md). Tras un tiraje rechazado, adjuntar exclusivamente las fuentes indicadas por el autor.
- **A** es la escena principal de la ficha y **B**, la alternativa.
- Anota en la ficha qué debe reconocerse en las dos (aparato o indicio, personaje, acabado) y qué cambia entre ellas: el lugar del observador o el instante.
- Si el autor aprobó solo un concepto, como el voto B de t4, la idea se usa para la acción y se describe con palabras. El acabado se toma de las cartas elegidas, nunca del dibujo votado.
- Revisa las cartas relacionadas que lista la ficha, como una herramienta y la evidencia que busca: sus escenas deben distinguirse.
- Formato y prompt base: `fabrica/PROMPT_CHATGPT.md`. Una carta por chat nuevo.
- Las propuestas recibidas se guardan como `fabrica/entrada/AAAA-MM-DD_<id>/<id>__a-v<n>.png` y `<id>__b-v<n>.png`, cada una con su `.txt` (el prompt o la operación).

### e) Revisión ampliada y a 58 × 88 mm

```
python3 .agents/skills/fabrica-cartas-animas/scripts/revisar.py <id> --a <imagen A> --b <imagen B> --salida <hoja.png>
```

La hoja muestra las dos variantes ampliadas y montadas en la carta a 58 × 88 mm, con la franja del título y la leyenda tapadas, junto a las referencias al mismo tamaño. Con el título tapado comprueba que se entienden la herramienta, la acción y la evidencia que pide la ficha, y su «Criterio de aceptación».

Compara materiales, planos y nivel de detalle con las referencias de acabado y pasa `fabrica/CONTROL_IA.md`. Si una variante falla, devuélvela con **una sola** corrección concreta y la zona donde aplicarla.

### f) Publicar en el selector y registrar la elección

Funcionamiento completo en [referencias/selector.md](referencias/selector.md).

```
python3 .agents/skills/fabrica-cartas-animas/scripts/lote.py agregar <lote> <id> --a <A> --b <B>
python3 .agents/skills/fabrica-cartas-animas/scripts/lote.py comprobar
```

- El selector (`revision.html?lote=<lote>`) muestra A, B y la versión vigente de la carta.
- El ID es el del juego y no cambia.
- Repetir `agregar` con las mismas imágenes no cambia nada. Con imágenes nuevas, el hash previo pasa a `anteriores` y el voto viejo de esa opción queda pendiente; los demás votos se conservan.
- El autor vota y descarga `seleccion-<lote>.json`. Para registrarlo:

```
python3 .agents/skills/fabrica-cartas-animas/scripts/lote.py registrar seleccion-<lote>.json [--alcance t4=concepto_sin_aprobacion_del_dibujo]
```

La elección queda en `fabrica/seleccion-visual.json`, que es de donde la leen Claude y Codex en cualquier sesión. Después se hace commit y PR. La aprobación final es otro paso: `catalogo/aprobaciones.json`, con las palabras del autor.

### g) Montaje de la carta terminada (solo bajo pedido)

Solo cuando el autor apruebe la ilustración del lote y pida las cartas terminadas, con título, íconos, marco, leyenda y reverso. El procedimiento está en [referencias/montaje.md](referencias/montaje.md).

## Retomar un lote desde una sesión nueva

```
python3 .agents/skills/fabrica-cartas-animas/scripts/lote.py estado <lote>
python3 .agents/skills/fabrica-cartas-animas/scripts/ficha.py --lote <lote>
```

`estado` muestra, por carta:
- la acción que le toca;
- si su ficha está lista o tiene partes por completar;
- cuántas propuestas hay en `fabrica/entrada/`;
- si ya está en el selector;
- el voto registrado.

Continúa desde la primera columna incompleta.

## Uso desde cada asistente

Claude Code, Codex y un chat con acceso a GitHub: ver [referencias/entradas.md](referencias/entradas.md).

## Mantener la skill

Se edita **solo** `.agents/skills/fabrica-cartas-animas/`. Después:

```
python3 herramientas/sincronizar_skill.py             # copia a .claude/skills/
python3 herramientas/sincronizar_skill.py --comprobar # falla si las dos copias difieren (también en CI)
```
