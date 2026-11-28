# Prompt para ChatGPT (Codex) · tanda estilo-03

Pega todo el bloque de abajo en ChatGPT con acceso al repositorio `Jonathan-Bello/Noched-de-animas-arte`. Son 57 cartas, todas las que tienen el arte sin aprobar, con dos ilustraciones por carta. El Kit de campo ya está en el lote con las imágenes del intento 3. Puede trabajar por bloques de familias en varias sesiones; cada bloque se publica en el selector en cuanto queda listo.

````text
Vas a ilustrar la tanda estilo-03 de Noche de Ánimas y publicarla en el selector para que Jonathan vote. Trabaja en el repositorio Jonathan-Bello/Noched-de-animas-arte, desde la rama main, en una rama nueva llamada tanda-estilo-03, y abre un PR contra main. No apruebes nada: votar y aprobar lo hace Jonathan.

ANTES DE EMPEZAR, lee y sigue la skill .agents/skills/fabrica-cartas-animas (SKILL.md, referencias/familias.md y referencias/estilo-simple.md). Las fichas de cada carta ya están en fabrica/tirajes/estilo-03/<id>.md.

ESTILO (lo más importante). El estilo correcto ya está probado con el Kit de campo, en el intento 3 (web/revision/estilo-03/kit-a.webp, que a Jonathan le encantó). En CADA generación adjunta las tres cartas de punto de estilo de guias/punto-de-estilo.json: web/miniaturas/a03@2x.webp (Travesura), web/miniaturas/id01@2x.webp (La Llorona) y web/miniaturas/i06@2x.webp (Espejo de mano). Adjunta también kit-a.webp como ejemplo de una ilustración nueva que acertó. Añade las referencias aprobadas que la ficha marca para esa carta (control.py plantilla las lista en «adjuntadas»). Nunca uses como referencia otra imagen de esta tanda ni de tandas anteriores. Copia este párrafo tal cual en cada generación:

Estilo: el mismo de las tres cartas adjuntas marcadas como «punto de estilo» (Travesura, La Llorona, Espejo de mano). Una familia de color dominante tiñe toda la escena, con acentos de crema, ámbar de vela y cempasúchil. Imítalas en nivel de detalle, textura, densidad del fondo y luz; no copies su composición.
Es papel recortado en capas con volumen: cada capa tiene contorno oscuro, sombra de capa y un sombreado suave interior con luz cálida de velas. Grano de papel visible en todo. Los objetos son reconocibles y con detalle de ilustración, no de catálogo. El fondo son los arcos de la casona en dos o tres planos, con velas, cempasúchil y papel picado, lleno y decorativo y más oscuro hacia los bordes. Adornos de flor calados en telas y cerámica.
Ni un extremo ni el otro: no hagas pintura digital realista (texturas de cuero o piedra, costuras, remaches, aparatos de producto real, perspectiva de azulejos) y tampoco vector plano (superficies de un solo color, fondo vacío, objetos reducidos a rectángulos).

ESCENAS. Para cada carta:
- Si Jonathan eligió antes una propuesta (está marcado en la lista), la variante A es esa misma escena en el estilo nuevo. Su texto está en web/revision/<lote>/lote.json, campo «descripcion» de esa opción, o en fabrica/tirajes/<lote>/descripciones.json.
- Si no, A y B salen de la ficha (escena A y escena B).
- Las reglas por familia de referencias/familias.md mandan sobre cualquier escena. Ejemplos: en Identidades y Espantos solo aparece el ánima; los Espantos van en monocromo carmín; en herramientas, el aparato va solo, sin manos; nunca hay naipes, salvo en el Tarot y en los espejos. Si una escena choca con una regla, ajústala y anótalo en observaciones.
- A y B deben ser escenas distintas entre sí.

POR CARTA, en este orden:
1. python3 .agents/skills/fabrica-cartas-animas/scripts/control.py plantilla estilo-03 <id>
2. Genera A, vertical 2:3 a sangre, sin texto, letras, números ni marcos; deja libre el 12 % superior y el 12 % inferior. Ponla junto a las tres cartas de punto de estilo. Si se ve más realista (texturas de cuero o piedra, costuras, aparatos de producto real) o más plana (superficies lisas de un color, fondo vacío) que ellas, rehazla. Luego genera B igual.
3. python3 .agents/skills/fabrica-cartas-animas/scripts/revisar.py <id> --a A.png --b B.png --salida web/revision/estilo-03/hojas/<id>-58x88.webp
4. Llena fabrica/tirajes/estilo-03/control/<id>.json con honestidad: el guion de cada variante, las rutas que adjuntaste de verdad («adjuntadas»), imagen_sha256, lectura_ciega (qué se entiende con el título tapado a 58 × 88 mm), los siete «limites» (true solo si cumple en las dos direcciones), acabado «encaja» y qa. Si algo no cumple, regenera; no marques true para pasar el control.
5. python3 .agents/skills/fabrica-cartas-animas/scripts/lote.py agregar estilo-03 <id> --a A.png --b B.png
   Las cartas Ultraje, Tarot, Escalofrío y las que el script marque como referencia de estilo pueden necesitar --forzar; úsalo solo para esas. El control de calidad no se salta con --forzar.

AL TERMINAR CADA BLOQUE: corre lote.py comprobar, haz commit de fabrica/tirajes/estilo-03/control/, web/revision/estilo-03/ y web/revision/lotes.json, y empuja. No subas los PNG de trabajo. En el PR, lista las cartas publicadas y cualquier escena que ajustaste. El selector queda en revision.html?lote=estilo-03.

CARTAS (57), por bloques:

**Herramientas** (6)
- `t0` Termómetro · elegiste la C de `estilo-01`
- `t1` Lámpara UV · elegiste la B de `comparativa-01`
- `t2` Grabadora · elegiste la C de `comparativa-01`
- `t3` Cámara de movimiento · elegiste la A de `comparativa-01`
- `t4` Detector EMF
- `t6` Sensor de gases

**Apoyos y reacciones** (2)
- `resp` Respirar hondo
- `esc` Esconderse · elegiste la A de `estilo-01`

**Alba y objetos malditos** (7)
- `alba` Alba
- `radio` Radio
- `tablilla` Tablilla espiritista · elegiste la C de `estilo-01`
- `mano` Mano del mono · elegiste la C de `comparativa-01`
- `espejo_plata` Espejo de plata · elegiste la A de `comparativa-01`
- `tarot` Tarot
- `pentagrama` Pentagrama · elegiste la A de `comparativa-01`

**Acciones del ánima** (4)
- `escalofrio` Escalofrío
- `portazo` Portazo
- `interferencia` Interferencia · elegiste la C de `estilo-01`
- `presencia` Presencia

**Habilidades de evidencia** (4)
- `h0` Helada
- `h1` Acecho
- `h2` Lamento
- `h4` Apagón · elegiste la B de `estilo-02`

**Identidades de las ánimas** (14)
- `id_nahual` Nahual
- `id_bruja` Bruja · elegiste la A de `estilo-01`
- `id_chaneque` Chaneque
- `id_yohualtepuztli` Yohualtepuztli
- `id_cihuateteo` Cihuateteo
- `id_tlahuelpuchi` Tlahuelpuchi
- `id_matlacihuatl` Matlacíhuatl
- `id_planchada` La Planchada
- `id_xtabay` Xtabay
- `id_malaire` El Mal Aire
- `id_guardian` El Guardián del Entierro
- `id_cadejo` El Cadejo Negro
- `id_mulata` La Mulata de Córdoba
- `id_uaychivo` El Uay Chivo

**Espantos** (13)
- `es_demonio` Infierno
- `es_aparecido` Aparición final
- `es_chaneque` Juego del monte
- `es_yohualtepuztli` Hacha nocturna
- `es_cihuateteo` Encrucijada
- `es_tlahuelpuchi` Vuelo de sangre
- `es_matlacihuatl` La red
- `es_guardian` Maldición del entierro · elegiste la C de `estilo-01`
- `es_cucuy` Desde la penumbra
- `es_cadejo` Arrastre de cadenas
- `es_chocarrero` Tornado de objetos
- `es_mulata` El barco en la pared
- `es_uaychivo` Mirada de cabra

**Evidencias** (6)
- `ev1` Huellas de ceniza
- `ev2` Susurros
- `ev3` Objetos movidos
- `ev4` Luces parpadeantes · elegiste la A de `estilo-01`
- `ev5` Marcas en el espejo
- `ev6` Olor a azufre

**Cartas de espíritu** (1)
- `rol_velar` Velar

````
