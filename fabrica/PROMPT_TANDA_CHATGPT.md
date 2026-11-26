# Prompt para ChatGPT · nueva tanda de elección

Pegar en ChatGPT (con acceso al repositorio `Jonathan-Bello/Noched-de-animas-arte`, por ejemplo Codex) cambiando `<LOTE>` por el nombre de la tanda. Antes, Claude deja escritas sus variantes A y B en `fabrica/tirajes/<LOTE>/`.

```text
Vas a preparar una nueva tanda de elección de arte para el juego de cartas «Noche de Ánimas», en el repositorio Jonathan-Bello/Noched-de-animas-arte. Trabaja en la rama tanda-<LOTE> y termina con un Pull Request. Responde en español.

REPARTO DEL TRABAJO
- Claude ya escribió las variantes A y B de cada carta en fabrica/tirajes/<LOTE>/descripciones.json (guionistas a y b = "Claude") y sus fichas <id>.md. No las cambies.
- Tú escribes las variantes C y D (guionistas c y d = "ChatGPT"), publicas la tanda en el comparador web y, cuando Jonathan elija las escenas, ilustras las elegidas.
- Jonathan decide todo en el comparador web. Nada se aprueba en el chat.

1. LEE LA SKILL ANTES DE ESCRIBIR
- .agents/skills/fabrica-cartas-animas/SKILL.md
- .agents/skills/fabrica-cartas-animas/referencias/familias.md  (reglas por familia; prevalecen sobre fichas viejas)
- fabrica/PERSONAJES.md (rasgos de investigadores y ánimas) y fabrica/CONTINUIDAD.md (modelos de aparatos)
- fabrica/catalogo_juego.json (qué hace cada carta)
- AGENTS.md (reglas del repositorio)

2. LEE LA RETROALIMENTACIÓN DE JONATHAN
En fabrica/seleccion-visual.json, para cada carta de la tanda:
- "voto" y "lote": qué eligió antes.
- "nota": qué le gustó y qué no.
- "porque": por qué conservó el original.
- y la lista "notas": comentarios sin voto.
Escribe en tu respuesta, por carta, qué vas a evitar o repetir según esos comentarios. Si no hay comentario, dilo.

3. REGLAS QUE NO SE NEGOCIAN
- Identidades (id_*) y Espantos (es_*): SOLO el ánima. Nadie más: ni investigadores, ni manos ajenas, ni víctimas. La consecuencia del Espanto se cuenta con el entorno.
- Espantos: monocromo carmín (rojos, guinda, negro; crema y oro solo como luz). Sin azul, verde ni petróleo. Excepción: Juego del monte (Chaneque).
- Sin naipes, cartas, mazos ni barajas. La mecánica de cartas se traduce a un hecho de la casa (papeles, pertenencias, objetos, sombras). Excepciones: Espejo de mano, Espejo de plata, Espejo de obsidiana y Tarot.
- Herramientas, objetos, apoyos y evidencias: el protagonista es el objeto o el indicio; un investigador entra como mucho como mano.
- Escenas NUEVAS: distintas del arte actual (web/miniaturas/<id_arte>@2x.webp), de A y B y entre sí. Otro lugar, otro instante u otro sujeto.
- Lo que el filtro no ve: el aparato es el modelo de CONTINUIDAD.md (el sensor de gases es de aguja); una evidencia no muestra la herramienta que la busca; una evidencia muestra lo ya ocurrido; el dibujo cuenta el efecto de la carta.

4. ESCRIBE C Y D
Completa "c" y "d" en fabrica/tirajes/<LOTE>/descripciones.json (2 o 3 frases cada una, dibujables en vertical) y agrega «## Variante C · ChatGPT» y «## Variante D · ChatGPT» en cada ficha <id>.md.
Comprueba:
  python3 .agents/skills/fabrica-cartas-animas/scripts/revisar_guiones.py --lote <LOTE>
Debe dar 0 observaciones. Después revisa a ojo los cuatro puntos de «Lo que el filtro no ve».

5. PUBLICA LA TANDA EN EL COMPARADOR (etapa de guion)
  python3 .agents/skills/fabrica-cartas-animas/scripts/lote.py guiones <LOTE>
  python3 .agents/skills/fabrica-cartas-animas/scripts/lote.py comprobar
Esto pone las escenas A–D en texto junto al arte actual en revision.html?lote=<LOTE>. Cada carta tiene la casilla «¿Qué te gustó y qué no?» y, al conservar el original, la casilla opcional «¿Por qué conservas el original?». No cambies revision.js ni el formato del JSON de selección.
Haz commit y abre el Pull Request. En la descripción pon el enlace al comparador y la lista de cartas.

6. CUANDO JONATHAN VOTE
Él descarga seleccion-<LOTE>.json del comparador. Regístralo:
  python3 .agents/skills/fabrica-cartas-animas/scripts/lote.py registrar seleccion-<LOTE>.json
Esto guarda su voto, su "nota" y su "porque".

7. ILUSTRA LO ELEGIDO (etapa de arte)
Solo las cartas donde eligió A, B, C o D. Por cada una, con el bloque «Encargo» de su ficha y las imágenes que indica:
- Ilustración vertical 2:3, sin texto, marcos ni íconos, en el estilo de las cartas adjuntas.
- En Espantos: python3 .agents/skills/fabrica-cartas-animas/scripts/paleta_familia.py <id> imagen.png  (debe decir «pasa»).
- Guarda las propuestas en fabrica/entrada/AAAA-MM-DD_<id>/.
- Publica en el comparador como etapa de arte con herramientas/publicar_comparativa.py (cuatro imágenes por carta) o lote.py agregar (A y B). Nunca muestres las imágenes solo en el chat.

8. NO HAGAS
- No cambies reglas, IDs, cantidades ni catalogo/canon.cartas.json.
- No promuevas nada al canon: solo Jonathan aprueba.
- No uses como referencia imágenes rechazadas ni la carta actual como modelo de composición.
- No publiques fotografías personales.

Al terminar, responde con: enlace al PR, enlace al comparador, tabla de cartas con tus C y D en una línea cada una, y qué retroalimentación aplicaste.
```
