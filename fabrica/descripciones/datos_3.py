# Descripciones del catálogo · parte 3: evidencias, roles, espíritus, consulta, reglas y componentes.
C = {}

C["ev0"] = dict(e="conservar", p="Tomás",
  r="Evidencia Bajo cero (la busca el Termómetro).",
  a="Tomás (sombrero de fieltro, bigote, bufanda, gabardina petróleo) anota en su libreta mientras su aliento se vuelve vaho; ventana con escarcha y aplique con vela.",
  l="El aliento visible y la escarcha.",
  pr="Se conserva. Es la referencia de Tomás en el mazo y de la familia de evidencias.",
  alt="La taza de café de Tomás olvidada en la mesa, cubierta por una capa de escarcha.")
C["ev1"] = dict(e="rehacer",
  r="Evidencia Huellas de ceniza (la busca la Lámpara UV).",
  a="Pisadas de ceniza sobre un piso de talavera morado en un claustro.",
  l="Las pisadas que empiezan en mitad del cuarto.",
  pr="Tres pisadas de ceniza interrumpen una franja de piso recién barrido; la última termina antes del umbral. La evidencia ocupa la carta.",
  alt="Una escoba recargada en la pared y, delante, el polvo barrido que forma de nuevo una pisada.")
C["ev2"] = dict(e="rehacer", p="Tomás",
  r="Evidencia Susurros (la busca la Grabadora).",
  a="Una boca de humo morado sale de una grabadora de casete sobre carpeta de papel picado.",
  l="La voz que dice un nombre.",
  pr="Un vaso invertido contra la pared; del otro lado de la junta se insinúa una cinta de voz, y el oído de Tomás entra apenas por el borde.",
  alt="La libreta de Tomás abierta: alguien escribió su nombre con una letra que no es la suya, mientras la grabadora sigue encendida.")
C["ev3"] = dict(e="rehacer",
  r="Evidencia Objetos movidos (la busca la Cámara de movimiento).",
  a="Silla volcada en el piso y tres cuadros torcidos en una habitación naranja.",
  l="La distancia entre el objeto y donde estaba.",
  pr="Arte que el autor quiere modificar. Una silla desplazada deja cuatro marcas limpias en el polvo; el desplazamiento se lee por la distancia entre cada pata y su marca.",
  alt="La mesa puesta para la cena: un solo plato quedó al revés y su cubierto, al otro extremo.")
C["ev4"] = dict(e="rehacer",
  r="Evidencia Luces parpadeantes (la busca el Detector EMF).",
  a="Corredor con papel picado y focos colgantes; uno brilla más fuerte. Ofrenda al fondo.",
  l="El ritmo de luces encendidas y apagadas.",
  pr="Tres focos del mismo corredor en distintos momentos de luz; sus charcos luminosos interrumpidos dibujan un ritmo sobre el piso.",
  alt="Un solo foco parpadea tres veces sobre la ofrenda; la foto del difunto queda iluminada y a oscuras.")
C["ev5"] = dict(e="rehacer",
  r="Evidencia Marcas en el espejo (la busca el Espejo de mano).",
  a="Espejo oval con marco calado y una huella de mano gris en el vaho, entre veladoras y cempasúchil.",
  l="La huella en el vaho.",
  pr="Una huella de dedos estrechos en el vaho de un espejo; fuera de la huella se refleja una ventana y dentro se ve la plata limpia.",
  alt="Letras sin sentido trazadas en el vaho desde el otro lado del vidrio (sin texto legible).")
C["ev6"] = dict(e="rehacer", p="Amalia",
  r="Evidencia Olor a azufre (la busca el Sensor de gases).",
  a="Humo amarillo sale bajo una puerta guinda con aldaba, entre dos apliques con vela.",
  l="El humo amarillo y el gesto de olerlo.",
  pr="La rejilla de un patio deja escapar un hilo amarillo; Amalia levanta el rebozo hasta la nariz al reconocer el olor.",
  alt="Un cerillo recién apagado sobre la ofrenda, con el humo amarillo que no se disipa.")

ROL = "Ilustración aprobada (21-nov). Falta componer la carta con marco, emblema, título y leyenda. Solo aparece en su carta de rol."
C["rol_vigia"] = dict(e="rol aprobado", p="El Vigía · Jhonnatan",
  r="Rol de la familia mano: elige qué descarta cuando el ánima lo obliga.",
  a="Joven de cabello ondulado oscuro con raya al centro, camisa azul y morral cruzado; sostiene un farol en alto y aprieta un abanico de cartas, mirando atrás hacia una aparición en el corredor.",
  l="El farol y las cartas sujetas con fuerza.",
  pr=ROL,
  alt="El Vigía duerme sentado contra la puerta con las cartas en el regazo y el farol encendido a su lado.")
C["rol_improvisador"] = dict(e="rol aprobado", p="El Improvisador · Ángel",
  r="Rol de la familia mano: improvisa con menos cartas y detecta mejor.",
  a="Joven de cabello rizado y lentes, sudadera guinda con bordado crema y tenis; arma un péndulo con una cuchara y un aparato de bobina sobre el piso de azulejo.",
  l="El invento armado con lo que había a mano.",
  pr=ROL,
  alt="El Improvisador convierte una lata y un hilo en un teléfono para escuchar la pared.")
C["rol_tecnico"] = dict(e="rol aprobado", p="El Técnico · Robert",
  r="Rol de la familia ojo: repite el dado de una herramienta pagando cordura.",
  a="Joven corpulento de cabello ondulado, overol morado con herramientas y camisa crema; suelda un aparato de válvulas con medidor. Al fondo, una asistente fantasma.",
  l="Las manos reparando el aparato.",
  pr=ROL,
  alt="El Técnico golpea el medidor con dos dedos y la aguja vuelve a saltar.")
C["rol_detective"] = dict(e="rol aprobado", p="El Detective · Fermín",
  r="Rol de la familia ojo: pregunta por una segunda evidencia.",
  a="Hombre de bigote y sombrero de ala con poncho petróleo de greca crema; examina con lupa una fotografía frente a un tablero de pistas unido con hilo rojo.",
  l="La lupa y el tablero de pistas.",
  pr="Ilustración aprobada, con un cambio pedido por Jonathan (24-nov): su vestuario pasa a naranja (poncho naranja cempasúchil con greca crema) para no confundirlo con Tomás, que conserva el petróleo. Recolorear solo la ropa; rostro, pose y escena se mantienen. Después, componer la carta con marco, emblema, título y leyenda.",
  alt="El Detective, con su poncho naranja, une dos fotografías con hilo rojo y una tercera cae sola del tablero.")
C["rol_curandero"] = dict(e="rol aprobado", p="El Curandero · Alex",
  r="Rol de la familia corazón: su Té cura más y puede darlo a otro.",
  a="Joven de lentes, cabello rizado con mechones rojizos, camisa guinda bordada y rebozo petróleo; sirve té de un jarro de barro a una taza. Hierbas colgadas al fondo.",
  l="El té que se sirve para otro.",
  pr=ROL,
  alt="El Curandero ofrece la taza a un compañero sentado en el suelo; el vapor forma un corazón.")
C["rol_sensitivo"] = dict(e="rol aprobado", p="El Sensitivo · Alex",
  r="Rol de la familia ojo: sabe si la primera habilidad revelada es verdadera o falsa.",
  a="Persona con maquillaje de catrina en rojo y blanco y camisa guinda bordada, con las manos sobre una carta en la mesa; dos espíritus, uno verde y uno oscuro, a sus espaldas.",
  l="Los dos espíritus: el verdadero y el falso.",
  pr=ROL + " Comparte identidad base con el Curandero (Alex): mantener el mismo rostro.",
  alt="El Sensitivo con los ojos cerrados sostiene dos cartas; una arde en luz verde y la otra se oscurece.")
C["rol_devota"] = dict(e="rol aprobado", p="La Devota · Jenny",
  r="Rol de la familia escudo: su Rosario salva a otro o sirve de Copal.",
  a="Mujer de cabello corto rizado, blusa crema bordada y rebozo petróleo, falda guinda; levanta un rosario ámbar con cruz y sostiene un sahumerio con copal. Vitral detrás.",
  l="El rosario en alto y el copal.",
  pr=ROL,
  alt="La Devota se pone frente a un compañero cazado y el humo del copal los rodea a ambos.")
C["rol_guardaespaldas"] = dict(e="rol aprobado", p="El Guardaespaldas · Jorge",
  r="Rol de la familia escudo: se interpone en una cacería.",
  a="Hombre de lentes y cabello corto con gabardina café extiende el brazo para proteger a un joven asustado con farol; un fantasma blanco se acerca por la izquierda.",
  l="El brazo extendido que protege.",
  pr=ROL,
  alt="El Guardaespaldas recibe el golpe de espaldas a la aparición, con la gabardina abierta como escudo.")

C["rol_velar"] = dict(e="rehacer",
  r="Carta de espíritu: ese vivo pierde 1 menos de cordura hasta el siguiente turno del espíritu. Rehacer (confirmado por Jonathan).",
  a="Un espíritu traslúcido verde con lentes se interpone entre un joven caído y una sombra guinda. El espíritu tiene la cara del Curandero (rol).",
  l="La mano traslúcida que protege.",
  pr="Sustituir al espíritu por uno de los cinco investigadores (los roles solo aparecen en su carta). Un espíritu aliado posa una mano traslúcida sobre el hombro de un investigador vivo; el abrigo y el fondo se ven a través de sus dedos.",
  alt="El espíritu de Rafael, traslúcido, sostiene el farol de Inés para que no se apague.")
C["rol_manifestar"] = dict(e="rehacer",
  r="Carta de espíritu: roba 1 carta y, si es herramienta, la usa (5 o 6). Rehacer (confirmado por Jonathan).",
  a="El Curandero (rol) mira asustado a un espíritu traslúcido con sombrero y poncho (el Detective, rol) que enciende un aparato de radio. La ilustración original de Manifestar está aprobada como arte sin marco.",
  l="El espíritu que usa una herramienta.",
  pr="Sustituir a los roles por investigadores. Un compañero espectral levanta una carta del mazo para señalar una herramienta que los vivos habían pasado por alto. Enfocar la mano y la carta.",
  alt="El espíritu de Tomás, traslúcido, gira la perilla de la grabadora mientras Padre Mateo escucha.")

DOC = "Carta de documentación: texto e íconos sobre fondo crema con marco ornamental. Sin ilustración."
for i, t in [(1, "Evidencias I"), (2, "Peligros"), (3, "Protecciones II"), (4, "Cartas y objetivos"), (5, "Investigación")]:
    C[f"Q{i}"] = dict(e="en espera",
      r=f"Carta de consulta «{t}»: explica los íconos.",
      a=DOC + " Pendiente: Q2 habla de «la franja» y del descarte previo a los Espantos, que ya no existen.",
      l="Los íconos alineados con su explicación.",
      pr="En espera: se rehace cuando se cierren las reglas.",
      alt="—")

C["R01"] = dict(e="en espera",
  r="Frente de la carta de reglas «Tu turno».",
  a="Manos que roban del mazo junto a un farol y cempasúchil, sobre mesa de madera.",
  l="Robar, jugar, descartar.",
  pr="En espera: se rehace después de cerrar las reglas. Idea guardada: Una mano toma la primera carta del mazo; las restantes y una herramienta forman tres grupos legibles sobre la mesa.",
  alt="Vista cenital de la mesa de juego: cuatro manos de investigadores y el mazo al centro.")
C["R02"] = dict(e="en espera",
  r="Frente de la carta de reglas «Investigar».",
  a="Repite la ilustración del Termómetro.",
  l="Instrumento y pista.",
  pr="En espera: se rehace después de cerrar las reglas. Idea guardada: Ilustración propia (hoy está duplicada). Un investigador contrasta la lectura de un instrumento con una pista visible; la línea entre la sonda y la pista organiza la imagen.",
  alt="La libreta abierta con tres casillas de evidencia y el dado junto a ella.")
C["R03"] = dict(e="en espera",
  r="Frente de la carta de reglas «Peligro».",
  a="Repite la ilustración de Cacería.",
  l="El instante antes del peligro.",
  pr="En espera: se rehace después de cerrar las reglas. Idea guardada: Ilustración propia (hoy está duplicada). La luz del farol descubre una sombra cruzando el umbral; las manos de dos investigadores se detienen en seco.",
  alt="La tarjeta de cordura con el clip bajando hacia el 4, y una sombra sobre ella.")
C["R04"] = dict(e="en espera",
  r="Frente de la carta de reglas «El ánima».",
  a="Repite la ilustración de Presencia.",
  l="El punto de vista del ánima.",
  pr="En espera: se rehace después de cerrar las reglas. Idea guardada: Ilustración propia (hoy está duplicada). Vista desde el lado del ánima: sus manos traslúcidas separan una carta detrás de un biombo; las luces de los investigadores asoman al otro lado.",
  alt="La identidad boca abajo bajo una mano traslúcida, con el Espanto esperando a un lado.")
C["R05"] = dict(e="en espera", p="Inés, Rafael, Tomás y un espíritu",
  r="Frente de la carta de reglas «El espíritu».",
  a="Inés, Rafael y Tomás alrededor de una tablilla; un espíritu traslúcido con barba señala la pieza.",
  l="El asiento del muerto que todavía participa.",
  pr="En espera: se rehace después de cerrar las reglas. Idea guardada: Arte que el autor quiere modificar. Un asiento vacío junto a los vivos; sobre la mesa, una mano traslúcida inclina una carta hacia ellos. El reflejo de la ventana atraviesa el brazo.",
  alt="Los cinco investigadores en la mesa; uno de ellos ya traslúcido, señalando la libreta sin hablar.")

C["cordura"] = dict(e="por decidir",
  r="Componente: cada investigador marca su cordura de 10 a 0 con un clip.",
  a="No existe.",
  l="Que la zona de 4 o menos se lea como peligro.",
  pr="Por decidir si se queda en el juego. Si se queda: una tarjeta por investigador con su retrato; la luz baja de cálida (10) a fría (0) y la franja de 4 o menos se ve más oscura. La escala la compone la plantilla.",
  alt="Una veladora que se consume de arriba abajo a lo largo de la escala.")
