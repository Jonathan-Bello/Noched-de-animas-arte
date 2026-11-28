# Biblioteca de arte de Noche de Ánimas
Este repositorio contiene recursos gráficos y su historia; no el motor del juego de cartas ni el juego 3D.
Antes de editar, leer guias/parametros_artisticos.json y catalogo/aprobaciones.json; abrir las referencias indicadas en el inventario.
No confundir identidad aprobada con aprobación de todas las escenas, ni una exportación entregada con aprobación final.
Usar catalogo/canon.cartas.json como fuente de arte final, con sus hashes. Nunca seleccionar automáticamente por número de versión o fecha más reciente.
Las propuestas, alternativas, rechazos y pendientes permanecen en historial/ y catalogo/inventario.json. No promoverlos sin evidencia del usuario.
Las ocho ilustraciones de roles aprobadas se identifican en catalogo/ilustraciones_roles_aprobadas.json. Pentagrama pendiente. Consultar PENDIENTES.md.
Fotografías personales se conservan únicamente en la carpeta local original y no deben publicarse. Las referencias de identidad se documentan con ilustraciones.
No cambiar reglas, IDs o cantidades al actualizar arte. El role_id de Devota sigue siendo padre por compatibilidad.
Nuevas instrucciones del usuario prevalecen sobre metadatos históricos.

Fábrica de arte: leer fabrica/README.md antes de pedir, revisar o aprobar arte. Para generar, corregir o revisar una sola ilustración o un tiraje, usar la skill .agents/skills/fabrica-cartas-animas/SKILL.md; se edita solo ahí y se copia a .claude/skills con herramientas/sincronizar_skill.py. El catálogo del juego (fabrica/catalogo_juego.json) se genera con herramientas/catalogo_juego.mjs desde el repo del juego; no editarlo a mano. Las propuestas nuevas van a fabrica/entrada/ y solo pasan al canon con aprobación explícita de Jonathan.

Sitio web: el sitio público es el proyecto Astro + Tailwind de sitio/ (ver sitio/README.md). Las páginas nuevas o migradas se escriben ahí, nunca como HTML suelto en la raíz. Los datos de las cartas se leen del catálogo, no se copian a mano. El sitio solo usa archivos fuera de Git LFS (web/, íconos SVG, JSON).
