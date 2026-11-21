# Sistema de iconos de Noche de Ánimas

## Referencia principal para las cartas

El sistema de pictogramas sólidos del juego y de impresión está documentado en **[cartas/README.md](cartas/README.md)**. Incluye 40 pictogramas con su significado, ejemplos de lectura, normas de tamaño y emblemas de roles. [Abrir la guía visual](cartas/sistema-original.html).

La colección siguiente conserva los iconos de demo y conceptos 3D como historial y recursos secundarios; no sustituye el sistema sólido de impresión.

## Colecciones históricas

Los iconos sí existían. Esta guía reúne su significado, uso y archivos recuperados, sin regenerar sus dibujos.

**23 iconos de demo + 4 familias + 10 conceptos HUD 3D.** Los recursos estaban archivados; la aprobación final de cada símbolo no se da por supuesta. Los iconos 3D se incluyen como referencia separada de arte, no como código ni reglas del juego.

## Lectura e integración

Consultar `manifest.json`: cada icono tiene ID original, clave con sistema, significado, uso, evidencia y formatos con SHA-256. Los binarios residen en `../objetos/` para conservar el historial y evitar copias. `../catalogo/inventario.json` indica la entrega original. Las ubicaciones de UI descritas aquí son recomendaciones cuando la documentación original solo proporcionó la etiqueta.

## Iconos de la demo

| ID | Nombre | Significado | Uso |
|---|---|---|---|
| `ev_0` | Bajo cero | Señal de temperatura bajo cero; dibujo de copo y termómetro. | Identificar esta evidencia en listados, fichas o leyendas de la demo. |
| `ev_1` | Huellas de ceniza | Rastro representado mediante huellas. | Identificar esta evidencia en listados, fichas o leyendas de la demo. |
| `ev_2` | Susurros | Señal auditiva; oreja y ondas. | Identificar esta evidencia en listados, fichas o leyendas de la demo. |
| `ev_3` | Objetos movidos | Desplazamiento de objetos; silla y marcas de movimiento. | Identificar esta evidencia en listados, fichas o leyendas de la demo. |
| `ev_4` | Luces parpadeantes | Cambios de iluminación; bombilla. | Identificar esta evidencia en listados, fichas o leyendas de la demo. |
| `ev_5` | Marcas en el espejo | Marcas o huella en un espejo de mano. | Identificar esta evidencia en listados, fichas o leyendas de la demo. |
| `ev_6` | Olor a azufre | Señal olfativa representada con trazos de humo. | Identificar esta evidencia en listados, fichas o leyendas de la demo. |
| `def_ros` | Rosario | Rosario con cuentas y cruz. | Identificar esta defensa en cartas, listados o fichas de referencia. |
| `def_esc` | Esconderse | Ocultamiento; armario con ojo. | Identificar esta defensa en cartas, listados o fichas de referencia. |
| `def_ultr` | Ultraje espiritual | Gesto de confrontación; puño levantado. | Identificar esta defensa en cartas, listados o fichas de referencia. |
| `def_copal` | Copal | Recipiente de copal con humo. | Identificar esta defensa en cartas, listados o fichas de referencia. |
| `def_ruda` | Ruda | Rama de ruda. | Identificar esta defensa en cartas, listados o fichas de referencia. |
| `tipo_herramienta` | Herramienta | Categoría Herramienta; usa una lupa. No representa por sí sola todos los efectos de herramienta. | Identificar el tipo de carta en encabezados, listados o filtros. |
| `tipo_habilidad` | Habilidad del ánima | Categoría de habilidad del ánima; mano espectral. | Identificar el tipo de carta en encabezados, listados o filtros. |
| `tipo_caceria` | Cacería | Categoría Cacería; calavera con trazos cruzados. | Identificar el tipo de carta en encabezados, listados o filtros. |
| `ui_camara` | Cámara | Control relacionado con cámara o captura. La acción exacta no está documentada; debe definirla el juego. | Control relacionado con cámara o captura. La acción exacta no está documentada; debe definirla el juego. |
| `ui_cartas` | Mis cartas | Abrir o identificar la mano/panel de cartas del jugador. | Abrir o identificar la mano/panel de cartas del jugador. |
| `ui_dado` | Dado | Identificar el dado o un control de tirada; el icono no define número de dados, resultado ni probabilidades. | Identificar el dado o un control de tirada; el icono no define número de dados, resultado ni probabilidades. |
| `ui_espiritu` | Espíritu | Identificar el estado o panel de espíritu. No equivale a perder acceso a toda acción. | Identificar el estado o panel de espíritu. No equivale a perder acceso a toda acción. |
| `ui_candado` | Candado | Identificar un elemento bloqueado o privado; explicar el motivo con texto. | Identificar un elemento bloqueado o privado; explicar el motivo con texto. |
| `ui_lupa` | Lupa | Control de inspección o ampliación; no confundir con la categoría Herramienta. | Control de inspección o ampliación; no confundir con la categoría Herramienta. |
| `ui_descargar` | Descargar | Descargar o exportar un recurso; indicar qué archivo se obtiene. | Descargar o exportar un recurso; indicar qué archivo se obtiene. |
| `ui_cerrar` | Cerrar | Cerrar un panel o diálogo; no usar para borrar datos sin una indicación distinta. | Cerrar un panel o diálogo; no usar para borrar datos sin una indicación distinta. |

## Familias impresas de roles

| Símbolo | Cartas donde se usa |
|---|---|
| Mano | El Vigía, El Improvisador, Manifestar |
| Ojo | El Técnico, El Detective, El Sensitivo |
| Corazón | El Curandero |
| Escudo | La Devota, El Guardaespaldas, Velar |

Las asociaciones proceden de la maquetación v04 y el manifiesto v09. No son reglas mecánicas: un ojo no concede una habilidad de investigación por sí mismo, ni un escudo vuelve inmune a un personaje.

## HUD 3D · referencias conceptuales

| ID | Nombre | Uso conceptual |
|---|---|---|
| `icono_apagar` | Apagar | Control conceptual de apagar; debe concretarse el objetivo interactuable. |
| `icono_apagon` | Apagón | Evento o habilidad conceptual de apagón. |
| `icono_cazar` | Cazar | Control conceptual de iniciar o representar una cacería. |
| `icono_escalofrio` | Escalofrío | Evento o habilidad conceptual de escalofrío. |
| `icono_guarida` | Guarida | Marcador conceptual de guarida. |
| `icono_interferencia` | Interferencia | Evento o habilidad conceptual de interferencia. |
| `icono_mover` | Mover | Control conceptual de movimiento; objetivo o selección por definir. |
| `icono_mudanza` | Mudanza | Evento o habilidad conceptual Mudanza; no confundir con Mover. |
| `icono_portazo` | Portazo | Evento o habilidad conceptual de portazo. |
| `icono_susurro` | Susurro | Evento o habilidad conceptual de susurro; distinto del ID de evidencia ev_2. |

Los efectos, costes, condiciones y controles del HUD 3D deben definirse en su GDD. No traducir automáticamente un icono en una mecánica.

## Reglas visuales y accesibilidad

- **evidencias**: Conservar IDs ev_0 a ev_6 y su orden.
- **semantica**: No inferir costes, bonificadores, tiradas, daño ni compatibilidades de un dibujo.
- **colisiones**: tipo_herramienta y ui_lupa tienen el mismo trazado con IDs y etiquetas distintos. Mano de familia no equivale a tipo_habilidad. Espíritu de UI no equivale a una habilidad concreta.
- **tinte_svg**: SVG tiene grupo con color inline #f3e6cf. Cambiar solo color en el grupo o usar máscara CSS; un img externo no hereda currentColor del padre. Conservar geometría.
- **png**: Conservar canal alfa y proporción. No rellenar fondo ni deformar. PNG de demo 256x256, símbolos de familia y concepto con tamaño real en cada entrada.
- **accesibilidad**: Mantener etiqueta visible o accesible; tooltip para iconos aislados. No comunicar estado solo por color.
- **estados**: Bloqueo, selección o deshabilitado corresponden a la UI; no modificar el significado base del ID.

## Fuentes

- `Arte_Demo_Actual/iconos_manifest.json`, `PARA_EL_OTRO_CHAT.txt` y el generador histórico `work/crear_iconos_demo.py`.
- `Noche_de_Animas_Roles_v04/montar_entrega.py` y `Noche_de_Animas_Roles_v09/manifest.json`.
- `Arte_Produccion_3D_v02/LEEME_Claude.md` y archivos `06_interfaz/icono_*.png`.

[Ver galería visual](galeria.html).

## Dibujos compartidos detectados por hash

Estos IDs apuntan al mismo PNG, aunque sus etiquetas son distintas; no tratarlos como señales visualmente diferenciadas:

- demo.tipo_herramienta, demo.ui_lupa
- concepto3d.icono_apagar, concepto3d.icono_apagon
- concepto3d.icono_escalofrio, concepto3d.icono_susurro
- concepto3d.icono_guarida, concepto3d.icono_portazo
- concepto3d.icono_mover, concepto3d.icono_mudanza

En el HUD 3D conviene resolver estas coincidencias antes de asignar botones simultáneos; esta documentación no cambia los recursos ni aprueba su sustitución.
