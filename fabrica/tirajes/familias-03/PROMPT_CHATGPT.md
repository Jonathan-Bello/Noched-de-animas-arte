# Prompt para ChatGPT · familias-03

Pegar en ChatGPT con acceso al repositorio `Jonathan-Bello/Noched-de-animas-arte` (por ejemplo Codex). Es una prueba: Claude y ChatGPT escriben escenas para las mismas diez cartas, una por familia, con las mismas reglas. Jonathan compara después las cuatro escenas de cada carta y decide si la skill de arte ya funciona.

```text
Vas a escribir dos escenas nuevas para cada una de diez cartas del juego «Noche de Ánimas», en el repositorio Jonathan-Bello/Noched-de-animas-arte. Responde en español.

RAMA
- Parte de la rama claude/project-thread-frgmpd (ahí están las reglas nuevas y el lote).
- Trabaja en una rama nueva llamada tanda-familias-03 y abre un Pull Request contra claude/project-thread-frgmpd.

REPARTO
- Claude ya escribió las variantes A y B de cada carta en fabrica/tirajes/familias-03/descripciones.json (guionistas a y b = "Claude"). No las cambies.
- Tú escribes las variantes C y D (guionistas c y d = "ChatGPT"). Es una comparación entre autores: tus escenas deben ser tuyas, distintas de A y B y entre sí.
- No publiques nada en el comparador; Claude arma la página de elección con las cuatro variantes.

1. LEE ANTES DE ESCRIBIR
- .agents/skills/fabrica-cartas-animas/SKILL.md
- .agents/skills/fabrica-cartas-animas/referencias/familias.md. Empieza por la sección «Lo que eligió estilo-01»: estilo general y composición por familia elegidos por Jonathan el 27-nov-2026. Prevalece sobre todo lo demás.
- guias/ESTILO_DE_CARTAS.md, sección «Estilo general elegido».
- fabrica/PERSONAJES.md (rasgos de investigadores y ánimas) y fabrica/CONTINUIDAD.md (modelos de aparatos).
- fabrica/catalogo_juego.json (qué hace cada carta).
- La ficha de cada carta: fabrica/tirajes/familias-03/<id>.md.
- Las escenas que ya se propusieron para estas cartas en fabrica/tirajes/comparativa-01, familias-01 y familias-02 (descripciones.json). Jonathan conservó el original frente a todas: no las repitas.

2. ESTILO Y COMPOSICIÓN (estilo-01)
- Estilo general: papel recortado cálido. Seis tintas (petróleo, crema, cempasúchil, ámbar, guinda, morado), una sola luz cálida, fondo en dos planos, rostros suaves. Amigable: el miedo sale de la atmósfera, nunca de heridas ni rostros deformes. Nada realista.
- Herramientas: el aparato solo, en su sitio, sin manos.
- Apoyos: como las herramientas; el remedio protagoniza, una mano como mucho.
- Reacciones: el investigador y su gesto, con emoción amable.
- Objetos: retrato del objeto, centrado.
- Acciones del ánima y habilidades: el investigador vive el efecto.
- Identidades: el ánima de cuerpo entero en el lugar de su leyenda. Solo ella.
- Espantos: el ánima domina. Solo ella. Monocromo carmín: rojos, guinda y negro; crema y oro solo como luz; sin azul, verde ni petróleo.
- Evidencias: el indicio de cerca, ya ocurrido; sin la herramienta que lo busca.
- Reglas: la mesa de trabajo (el equipo junto también vale).

3. REGLAS QUE NO SE NEGOCIAN
- Sin naipes, cartas, mazos ni barajas, salvo en el Tarot. La mecánica de cartas se traduce a un hecho de la casa.
- Escenas NUEVAS: otro lugar, otro instante u otro sujeto que el arte actual (web/miniaturas/<id_arte>@2x.webp), que A y B, y que las escenas ya rechazadas.
- El aparato es el modelo de CONTINUIDAD.md. El dibujo cuenta el efecto de la carta.

4. ESCRIBE C Y D, Y EXPLICA CÓMO
En fabrica/tirajes/familias-03/descripciones.json, por carta:
- "variantes" → "c" y "d": 2 o 3 frases cada una, dibujables en vertical.
- "como" → "c" y "d": una frase que diga qué regla o qué comentario de Jonathan aplicaste y qué decidiste (Claude hizo lo mismo en "como" → "a" y "b").
En cada ficha <id>.md, reemplaza «_Pendiente._» bajo «Variante C · ChatGPT» y «Variante D · ChatGPT» por tu escena y una línea «*Cómo:* …».
Comprueba:
  python3 .agents/skills/fabrica-cartas-animas/scripts/revisar_guiones.py --lote familias-03
Debe dar 0 observaciones. Después revisa a ojo: modelo del aparato, que una evidencia no muestre su herramienta, que la evidencia sea algo ya ocurrido, que el dibujo cuente el efecto.

5. ENTREGA
Haz commit y abre el Pull Request. Responde con: enlace al PR y una tabla con las diez cartas, tus C y D en una línea cada una.

6. NO HAGAS
- No cambies A ni B, ni reglas, IDs, cantidades o catalogo/canon.cartas.json.
- No ilustres todavía: Jonathan elige primero la escena.
```
