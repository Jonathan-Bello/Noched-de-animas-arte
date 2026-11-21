// Datos del Reglamento v5 de Noche de Ánimas.
// Todo lo que aquí se define debe coincidir con docs/reglamento-v4.md.
export const EVIDENCIAS = [
    "Bajo cero",
    "Huellas de ceniza",
    "Susurros",
    "Objetos movidos",
    "Luces parpadeantes",
    "Marcas en el espejo",
    "Olor a azufre",
];
export const HERRAMIENTAS = [
    "Termómetro",
    "Lámpara UV",
    "Grabadora",
    "Cámara de movimiento",
    "Detector EMF",
    "Espejo de mano",
    "Sensor de gases",
];
export const INV_CARDS = {
    t0: { nombre: HERRAMIENTAS[0], cant: 2 },
    t1: { nombre: HERRAMIENTAS[1], cant: 2 },
    t2: { nombre: HERRAMIENTAS[2], cant: 2 },
    t3: { nombre: HERRAMIENTAS[3], cant: 2 },
    t4: { nombre: HERRAMIENTAS[4], cant: 2 },
    t5: { nombre: HERRAMIENTAS[5], cant: 2 },
    t6: { nombre: HERRAMIENTAS[6], cant: 2 },
    kit: { nombre: "Kit de campo", cant: 6 },
    te: { nombre: "Té de tila", cant: 8 },
    resp: { nombre: "Respirar hondo", cant: 4 },
    ros: { nombre: "Rosario", cant: 7, reaccion: true },
    esc: { nombre: "Esconderse", cant: 3, reaccion: true },
    ult: { nombre: "Ultraje espiritual", cant: 2, reaccion: true },
    ruda: { nombre: "Ruda", cant: 2 },
    copal: { nombre: "Copal", cant: 2, reaccion: true },
};
export function isTool(c) {
    return c.length === 2 && c[0] === "t" && c[1] >= "0" && c[1] <= "6";
}
export function toolEv(c) {
    return Number(c[1]);
}
export const GHOST_CARDS = {
    escalofrio: { nombre: "Escalofrío", cant: 5 },
    portazo: { nombre: "Portazo", cant: 3 },
    travesura: { nombre: "Travesura", cant: 1 },
    manifestacion: { nombre: "Manifestación", cant: 3, objetivo: true },
    posesion: { nombre: "Posesión demoníaca", cant: 1, objetivo: true },
    interferencia: { nombre: "Interferencia", cant: 3, reaccion: true },
    presencia: { nombre: "Presencia", cant: 2 },
    caceria: { nombre: "Cacería", cant: 4, objetivo: true },
    caceria_total: { nombre: "Cacería total", cant: 2 },
};
// Habilidades de evidencia: h0..h6, una por evidencia.
export const HABILIDADES = {
    h0: { nombre: "Helada", ev: 0, objetivo: "th4" },
    h1: { nombre: "Acecho", ev: 1, objetivo: "any" },
    h2: { nombre: "Lamento", ev: 2 },
    h3: { nombre: "Lluvia de objetos", ev: 3 },
    h4: { nombre: "Apagón", ev: 4, objetivo: "th4" },
    h5: { nombre: "Arrastrar", ev: 5 },
    h6: { nombre: "Furia", ev: 6, objetivo: "th6" },
};
// ---------- Expansión: Objetos malditos ----------
export const OBJETOS_INV = {
    radio: { nombre: "Radio", cant: 2, soloMesa: true },
    tablilla: { nombre: "Tablilla espiritista", cant: 1, soloMesa: true },
    mano: { nombre: "Mano del mono", cant: 1, soloMesa: true },
    limpia: { nombre: "Limpia con huevo", cant: 1 },
    espejo_plata: { nombre: "Espejo de plata", cant: 1 },
    tarot: { nombre: "Tarot", cant: 1 },
};
export const OBJETOS_ANIMA = {
    muneca: { nombre: "Muñeca de la isla", cant: 1, objetivo: true },
    espejo_obsidiana: { nombre: "Espejo de obsidiana", cant: 1, objetivo: true },
    pentagrama: { nombre: "Pentagrama", cant: 1 },
};
export function isObjeto(c) {
    return c in OBJETOS_INV || c in OBJETOS_ANIMA;
}
export function objetosInvestigador(nInv) {
    const d = [];
    for (const [k, v] of Object.entries(OBJETOS_INV))
        if (!(nInv === 1 && v.soloMesa))
            for (let i = 0; i < v.cant; i++)
                d.push(k);
    return d;
}
export function objetosAnima() {
    return Object.entries(OBJETOS_ANIMA).flatMap(([k, v]) => new Array(v.cant).fill(k));
}
export const ROLES = {
    vigia: { nombre: "El vigía", texto: "Cuando una carta o habilidad del ánima te haga descartar al azar, eliges tú qué cartas descartas; si te hace cambiar toda la mano, conservas 1." },
    improvisador: { nombre: "El improvisador", texto: "Al improvisar con 2 cartas detectas con 4 o más, como una herramienta. También puedes improvisar con 1 sola carta: detectas con 5 o 6." },
    tecnico: { nombre: "El técnico", texto: "Cuando una herramienta tuya da «Nada», puedes repetir el dado pagando 1 de cordura. Una repetición por herramienta, en cada herramienta que uses. También bajo el vaso." },
    detective: { nombre: "El detective", texto: "Una vez por partida, cuando confirmes una evidencia, pregunta en voz alta por otra y el ánima responde si la tiene. En Sálvese quien pueda, solo responde si sacas 4 o más. Es una pista: no cuenta para acusar." },
    curandera: { nombre: "El curandero", texto: "Tu Té de tila cura 3 y puedes dárselo a otro investigador." },
    padre: { nombre: "La devota", texto: "Tu Rosario puede salvar a otro investigador cazado, o cancelar como Copal una carta del ánima que no sea un Espanto." },
    sensitiva: { nombre: "El sensitivo", texto: "La primera vez que el ánima revele una habilidad, sabes si es la verdadera o la falsa. Es una pista: no cuenta para acusar." },
    guardaespaldas: { nombre: "El guardaespaldas", texto: "Una vez por partida, cuando cazan a alguien sin defensa, eliges: te pones frente a otro (pierdes 2 de cordura y la cacería se detiene) o, si te cazan a ti, aguantas el golpe y te quedas sin cordura. Necesitas 2 o más." },
};
export const ROLES_LISTA = Object.keys(ROLES);
export function isHab(c) {
    return c.length === 2 && c[0] === "h" && c[1] >= "0" && c[1] <= "6";
}
export function cardName(c) {
    if (c in INV_CARDS)
        return INV_CARDS[c].nombre;
    if (c in GHOST_CARDS)
        return GHOST_CARDS[c].nombre;
    if (c in HABILIDADES)
        return HABILIDADES[c].nombre;
    if (c in OBJETOS_INV)
        return OBJETOS_INV[c].nombre;
    if (c in OBJETOS_ANIMA)
        return OBJETOS_ANIMA[c].nombre;
    return c;
}
const A = (id, nombre, ev, espanto) => ({ id, nombre, ev, espanto });
// Espantos del Reglamento v5: una idea propia por ánima, sin descarte general previo.
export const ANIMAS = [
    A("llorona", "La Llorona", [0, 2, 5], { nombre: "Llanto eterno", umbral: 4, pre: { k: "todos", n: 3 } }),
    A("nahual", "Nahual", [1, 3, 6], { nombre: "La bestia", umbral: 6, pre: { k: "nada" } }),
    A("anima", "Ánima en pena", [1, 2, 4], { nombre: "Penitencia", umbral: 4, pre: { k: "rosarioOPierde", n: 3 } }),
    A("demonio", "Demonio", [2, 4, 6], { nombre: "Infierno", umbral: 5, pre: { k: "nada" }, bloqueos: { copal: true } }),
    A("aparecido", "Aparecido", [0, 3, 4], { nombre: "Aparición final", umbral: 4, pre: { k: "nada" }, bloqueos: { esc: true, ult: true, copal: true, ruda: true } }),
    A("bruja", "Bruja", [3, 5, 6], { nombre: "Aquelarre", umbral: 5, pre: { k: "elige", n: 4 } }),
    A("chaneque", "Chaneque", [1, 2, 3], { nombre: "Juego del monte", umbral: 4, pre: { k: "quedan1" } }),
    A("yohualtepuztli", "Yohualtepuztli", [0, 3, 6], { nombre: "Hacha nocturna", umbral: 5, pre: { k: "nada" }, bloqueos: { esc: true, ruda: true }, corazon: true }),
    A("cihuateteo", "Cihuateteo", [0, 1, 4], { nombre: "Encrucijada", umbral: 3, pre: { k: "nada" }, rondas: 2 }),
    A("tlahuelpuchi", "Tlahuelpuchi", [4, 5, 6], { nombre: "Vuelo de sangre", umbral: 5, pre: { k: "nada" }, cadena: true }),
    A("matlacihuatl", "Matlacíhuatl", [0, 1, 5], { nombre: "La red", umbral: 5, pre: { k: "nada" }, bloqueos: { ros: true } }),
    A("charro", "Charro Negro", [0, 1, 6], { nombre: "Trato con el diablo", umbral: 4, pre: { k: "desc1" }, bloqueos: { ult: true } }),
    A("planchada", "La Planchada", [3, 4, 5], { nombre: "Ronda nocturna", umbral: 5, pre: { k: "nada" }, bloqueos: { esc: true } }),
    A("xtabay", "Xtabay", [1, 2, 5], { nombre: "Canto de la ceiba", umbral: 4, pre: { k: "porVivo" } }),
    A("malaire", "El Mal Aire", [0, 4, 5], { nombre: "Soplo del mal viento", umbral: 3, pre: { k: "nada" }, bloqueos: { esc: true, ult: true } }),
    A("guardian", "El Guardián del Entierro", [0, 2, 3], { nombre: "Maldición del entierro", umbral: 5, pre: { k: "guardian" } }),
    A("cucuy", "El Cucuy", [1, 3, 5], { nombre: "Desde la penumbra", umbral: 3, pre: { k: "nada" }, dobleAlAlto: true }),
    A("cadejo", "El Cadejo Negro", [1, 4, 6], { nombre: "Arrastre de cadenas", umbral: 4, pre: { k: "cadenas" }, duelo: { umbral: 5, pre: { k: "nada" } } }),
    A("chocarrero", "El Espíritu Chocarrero", [2, 3, 4], { nombre: "Tornado de objetos", umbral: 5, pre: { k: "porCarta" } }),
    A("mulata", "La Mulata de Córdoba", [2, 5, 6], { nombre: "El barco en la pared", umbral: 5, pre: { k: "izquierda" }, duelo: { umbral: 4, pre: { k: "descartes" } } }),
    A("uaychivo", "El Uay Chivo", [0, 2, 6], { nombre: "Mirada de cabra", umbral: 4, pre: { k: "paraliza" } }),
];
/** El Espanto tal como se juega en esta mesa (con las excepciones de Duelo). */
export function espantoDe(a, nInv) {
    return nInv === 1 && a.espanto.duelo ? { ...a.espanto, ...a.espanto.duelo } : a.espanto;
}
export const ANIMA_POR_ID = Object.fromEntries(ANIMAS.map((a) => [a.id, a]));
// ---------- Constantes de partida ----------
export const CORDURA_INICIAL = 10;
export const CORDURA_MAX = 10;
export const UMBRAL_CAZA = 4;
export function manoInvestigador(nInv) {
    return nInv === 1 ? 4 : 3;
}
export function manoAnima(nInv) {
    return nInv === 1 ? 3 : nInv === 2 ? 4 : 5;
}
export function mazoInvestigadores() {
    const d = [];
    for (const [k, v] of Object.entries(INV_CARDS))
        for (let i = 0; i < v.cant; i++)
            d.push(k);
    return d;
}
export function mazoAnima() {
    const d = [];
    for (const [k, v] of Object.entries(GHOST_CARDS))
        for (let i = 0; i < v.cant; i++)
            d.push(k);
    return d;
}
