// Motor de reglas de Noche de Ánimas (Reglamento v5).
//
// El motor es una máquina de estados pura: no toca el DOM ni la red.
//   const s = nuevaPartida({ nInv: 3, semilla: 42 });
//   aplicar(s, { quien: -1, tipo: "habilidades", verdadera: 2, falsa: 5 });
// Cuando el motor necesita una decisión, deja `s.pendiente` con quién debe
// responder y qué. `aplicar` valida la respuesta y avanza hasta la siguiente
// decisión o el final de la partida.
import * as D from "./data.js";
export const ANIMA = -1;
/** Quien mira sin jugar (sala): ve solo lo público. */
export const ESPECTADOR = -2;
/** Costos del modo vaso: lo que pierde quien desafía en falso y las cartas que descarta el ánima si la atrapan. */
/** Ajustes de las expansiones (el simulador los mueve). */
export const EXPANSION = { manoExtraRoles: 1, munecaEnDuelo: false, improvisadorElige: true, costoGuardaespaldas: 0, vigiaGuarda: true,
    /** El detective pregunta en voz alta: la respuesta es para todos (en Sálvese quien pueda también). */
    detectivePublico: true,
    /** Sálvese quien pueda: el Tarot solo le habla a quien lo jugó. */
    tarotPrivado: true,
    /** El padre puede usar un Rosario como Copal para cancelar una carta del ánima (no un Espanto). */
    padreCopal: true,
    guardaV3: true,
    /** El detective solo obtiene respuesta si saca 4–6 en el dado. */
    detectiveDado: false,
    /** Habilidades extra del ánima en su mazo (además de 1 verdadera y 1 falsa). */
    habExtraV: 0, habExtraF: 0,
    /** Simulación: el Espejo de plata vuelve pistas las habilidades que ve en la mano del ánima. */
    espejoRevelaHab: false,
    /** Cartas extra en la mano del ánima según el número de investigadores (propuesta de mesa grande). */
    manoExtraPorMesa: {},
    /** Alcance de la carta Cacería según el número de investigadores (propuesta de mesa grande). */
    umbralCacMesa: {},
    /** Técnico v4 (17-nov): repite el dado de cualquier herramienta que dé «Nada», las veces que quiera, pagando esta cordura (0 = la regla vieja: una vez por partida, gratis). */
    tecnicoCosto: 1,
    /** Cordura mínima del guardaespaldas para usar su rol (17-nov: 2; antes 3). */
    guardaMin: 2,
    /** Guardaespaldas v4 (17-nov): una vez, elige proteger a otro (pierde 2) o protegerse a sí mismo (se queda sin cordura). */
    guardaElige: true,
    /** Cordura que pierde al protegerse a sí mismo (null = toda). */
    guardaPropio: null,
    /** En prueba: el Curandero empieza con un Té de tila y la Devota con un Rosario (del mazo). */
    cartaInicialRol: false, // (la regla de la partida es reglas.cartaInicial)
    /** En prueba: el Improvisador detecta con 4 si improvisa con 2 cartas y con 5 si improvisa con 1. */
    improvisadorV2: true,
    /** El guardaespaldas solo puede protegerse a sí mismo. */
    guardaSoloYo: true,
    /** Compensaciones a probar para los roles: cartas que se retiran del mazo de investigadores. */
    recorteMazoRoles: 6, sinCopalRoles: false,
    /** Si se da, en vez de quitar cartas al azar se retiran estas (nunca herramientas). */
    recorteFijo: ["te", "te", "resp", "resp", "ros", "ros"],
    /** Cordura inicial de los investigadores cuando juegan con roles (null = la normal). */
    corduraRoles: null,
    /** Cordura inicial por número de investigadores (en prueba). */
    corduraPorMesa: { 4: 8 },
    /** La Muñeca de la isla solo entra con al menos este número de investigadores. */
    munecaMinInv: 3,
    /** En Sálvese quien pueda, el detective necesita 4–6 en el dado para que el ánima responda. */
    detectiveDadoSalvese: true };
export const VASO = {
    costoDesafio: 1, turnosPerdidos: 1, maxMentiras: 99, soloNo: true,
    /** Sí falso: el ánima puede anunciar «Sí» en la evidencia de su habilidad falsa. */
    falsoSi: false, // retirado el 16-nov: en Sálvese quien pueda le daba +10 puntos al ánima y en equipo no hacía falta
    /** Lo que pierde quien destapa un Sí que era verdad. */
    costoDesafioSi: 2,
};
/** Ajustes del modo «Cada quien» (calibrados con el simulador). */
export const CADA_QUIEN = {
    animaPorRonda: true, siPublico: true,
    /** En prueba (17-nov): al Alba todos los vivos apuestan en secreto (sin pedir evidencias); se revelan y el ánima puede lanzar su Espanto: gana quien acertó y sobrevive. */
    apuestaFinal: true,
};
// ---------------------------------------------------------------- utilidades
function rand(s) {
    s.rng = (s.rng + 0x6d2b79f5) | 0;
    let t = s.rng;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function entero(s, n) {
    return Math.floor(rand(s) * n);
}
function barajar(s, a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = entero(s, i + 1);
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
/**
 * Cómo se resuelve el azar de las herramientas (en prueba):
 * - "dado": un d6 normal.
 * - "baraja": 6 cartas de lectura (1–6) que se roban sin reponer y se rebarajan al acabarse.
 *   Mismas probabilidades que el dado, pero sin rachas largas de mala suerte.
 * - "rastro": cada «Nada» deja una ficha de rastro en esa evidencia; cada ficha suma +1 a la siguiente lectura de esa evidencia.
 */
export const AZAR = { modo: "dado", rebarajaAltos: false };
export function dado(s) {
    if (AZAR.modo === "baraja" || s.reglas.lectura === "cartas") {
        // Variante del playtest: en cuanto ya salieron el 4, el 5 y el 6, se rebaraja todo.
        if (!s.bolsa?.length || (AZAR.rebarajaAltos && !s.bolsa.some((x) => x >= 4)))
            s.bolsa = barajar(s, [1, 2, 3, 4, 5, 6]);
        return s.bolsa.pop();
    }
    return entero(s, 6) + 1;
}
function log(s, txt, tipo = "info", para) {
    s.bitacora.push({ n: s.nTurno, txt, tipo, ...(para ? { para } : {}) });
}
function marca(s, e) {
    const u = s.bitacora[s.bitacora.length - 1];
    if (u)
        u.e = e;
}
function apilar(s, ...marcos) {
    for (let i = marcos.length - 1; i >= 0; i--)
        s.pila.push(marcos[i]);
}
export function vivos(s) {
    return s.inv.filter((q) => q.vivo);
}
function quienAnima(s) {
    return `El ánima (${D.ANIMA_POR_ID[s.anima].nombre})`;
}
function nom(s, a) {
    return a === ANIMA ? "El ánima" : s.inv[a].nombre;
}
/** En prueba: el Curandero empieza con un Té y la Devota con un Rosario (se toman del mazo). */
function cartaInicial(s, q) {
    if (!(EXPANSION.cartaInicialRol || s.reglas.cartaInicial))
        return;
    const c = q.rol === "curandera" ? "te" : q.rol === "padre" ? "ros" : null;
    const i = c ? s.mazoInv.indexOf(c) : -1;
    if (c && i >= 0 && !q.mano.includes(c))
        q.mano.push(s.mazoInv.splice(i, 1)[0]);
}
function ganar(s, quien, motivo, ganadores, via, logro) {
    if (s.ganador)
        return;
    s.ganador = quien;
    if (via)
        s.via = via;
    if (logro)
        s.logro = logro;
    if (ganadores) {
        s.ganadores = ganadores;
        s.aliadosGanadores = s.inv.filter((q) => !q.vivo && q.aliado !== undefined && q.aliado !== null && ganadores.includes(q.aliado)).map((q) => q.asiento);
        if (s.aliadosGanadores.length)
            s.logro = (s.logro ?? "") + ` Como aliado, ${s.aliadosGanadores.map((x) => s.inv[x].nombre).join(" y ")} comparte el triunfo a medias.`;
    }
    s.motivo = motivo;
    s.pendiente = null;
    log(s, motivo, "fin");
}
function perder(s, q, n, delAnima = true) {
    if (!q.vivo || n <= 0)
        return;
    if (delAnima && q.veladoPor !== null)
        n -= 1;
    q.c = Math.max(0, q.c - n);
}
function curar(q, n) {
    q.c = Math.min(D.CORDURA_MAX, q.c + n);
}
function robarInv(s, q, n) {
    for (let i = 0; i < n && s.mazoInv.length; i++)
        q.mano.push(s.mazoInv.pop());
}
function descartarAlAzar(s, q, n) {
    if (q.rol === "vigia" && s.turno.de !== "espanto") {
        // El vigía elige qué suelta.
        if (q.mano.length)
            apilar(s, { k: "vigia", asiento: q.asiento, n: Math.min(n, q.mano.length) });
        return;
    }
    for (let i = 0; i < n && q.mano.length; i++)
        s.descInv.push(q.mano.splice(entero(s, q.mano.length), 1)[0]);
}
/** El vigía elige la carta que conserva cuando le hacen cambiar toda la mano. */
function vigiaGuarda(s, q, k) {
    const guarda = q.mano.splice(k, 1);
    const n = q.mano.length + 1;
    s.descInv.push(...q.mano);
    q.mano = [];
    robarInv(s, q, n - 1);
    q.mano.push(...guarda);
    log(s, `${q.nombre}, el vigía, se aferra a ${D.cardName(guarda[0])} y cambia el resto de su mano.`, "rol");
    marca(s, { k: "rol", de: q.asiento, rol: "vigia", n: n - 1 });
}
/** Elección libre de rol: cada investigador, en orden, toma uno de los que quedan. */
function pedirRolLibre(s) {
    const q = s.inv.find((x) => !x.rol);
    const tomados = s.inv.map((x) => x.rol).filter(Boolean);
    const quedan = D.ROLES_LISTA.filter((r) => !tomados.includes(r));
    s.pendiente = { tipo: "rol", quien: [q.asiento], datos: { libre: true, opciones: { [q.asiento]: quedan }, tomados } };
}
/** Qué tanto le sirve una carta a un investigador (para las decisiones automáticas de los roles). */
function valorCarta(s, c) {
    if (["ros", "esc", "ult", "copal"].includes(c))
        return 9;
    if (c === "kit")
        return 7;
    if (D.isTool(c))
        return s.confirmadas.includes(D.toolEv(c)) || s.descartadas.includes(D.toolEv(c)) ? 1 : 6;
    if (c === "ruda" || c === "te")
        return 5;
    if (c === "resp")
        return 3;
    return 2;
}
function robarAnimaUna(s) {
    if (!s.mazoAnima.length) {
        s.mazoAnima = barajar(s, s.descAnima);
        s.descAnima = [];
    }
    if (!s.mazoAnima.length)
        return false;
    s.manoAnima.push(s.mazoAnima.pop());
    return true;
}
function rellenarAnima(s) {
    const n = D.manoAnima(s.nInv) + (s.reglas.roles ? EXPANSION.manoExtraRoles : 0) + (EXPANSION.manoExtraPorMesa[s.nInv] ?? 0);
    while (s.manoAnima.length < n && robarAnimaUna(s))
        ;
}
export function animaDef(s) {
    return D.ANIMA_POR_ID[s.anima];
}
export function cadaQuien(s) {
    return s.reglas?.modo === "cadaQuien";
}
export function nuevaPartida(o) {
    if (o.nInv < 1 || o.nInv > 4)
        throw new Error("De 1 a 4 investigadores");
    const semilla = (o.semilla ?? Math.floor(Math.random() * 2 ** 31)) | 0;
    const s = {
        version: 4, semilla, rng: semilla, nInv: o.nInv, anima: "", animaEv: [], habilidades: null,
        inv: [], mazoInv: [], descInv: [], mazoAnima: [], descAnima: [], manoAnima: [],
        confirmadas: [], descartadas: [], pistas: [], preguntas: [],
        turno: { asiento: -1, de: "inicio" }, nTurno: 0, muertes: 0, espantoUsado: false, alba: false,
        ultimoNada: null, ultimoDado: null, cadenas: null, pendiente: null, pila: [], bitacora: [],
        ganador: null, motivo: "",
        // El vaso solo existe con 3 o 4 investigadores: en Duelo y con 2 le da demasiada ventaja al ánima.
        reglas: { modo: o.nInv >= 2 ? o.modo ?? "equipo" : "equipo", vaso: !!o.vaso && o.nInv >= 3 && (o.modo ?? "equipo") === "equipo", objetos: !!o.objetos, roles: !!o.roles?.some((x) => x) || (!!o.testigos && o.nInv >= 2), reparto: o.reparto ?? "robar", lectura: o.lectura ?? "dado", cartaInicial: o.cartaInicial ?? true }, lecturas: [],
        muneca: null, pentagrama: 0,
    };
    const a = o.anima ? D.ANIMA_POR_ID[o.anima] : D.ANIMAS[entero(s, D.ANIMAS.length)];
    if (!a)
        throw new Error("Ánima desconocida: " + o.anima);
    s.anima = a.id;
    s.animaEv = [...a.ev];
    s.mazoInv = barajar(s, [...D.mazoInvestigadores(), ...(o.objetos ? D.objetosInvestigador(o.nInv) : [])]);
    for (let i = 0; i < o.nInv; i++) {
        s.inv.push({
            asiento: i, nombre: o.nombres?.[i] ?? `Investigador ${i + 1}`, c: D.CORDURA_INICIAL, mano: [],
            vivo: true, ruda: false, sinHerramientas: false, sinHerramientasProx: false, sabe: null,
            veladoPor: null, ecoUsado: false, ultimoTurno: 0, conf: [], desc: [], fuera: false,
            rol: o.roles?.[i] ?? null, rolUsado: false,
        });
    }
    if (EXPANSION.corduraPorMesa[o.nInv])
        for (const q of s.inv)
            q.c = EXPANSION.corduraPorMesa[o.nInv];
    for (const q of s.inv)
        robarInv(s, q, D.manoInvestigador(o.nInv));
    if (o.nInv >= 2 && (o.testigos || o.roles)) {
        if (EXPANSION.sinCopalRoles)
            s.mazoInv = s.mazoInv.filter((c) => c !== "copal");
        if (EXPANSION.corduraRoles !== null)
            for (const q of s.inv)
                q.c = EXPANSION.corduraRoles;
        for (const q of s.inv)
            cartaInicial(s, q);
        if (EXPANSION.recorteFijo) {
            // Se retiran cartas concretas (nunca herramientas): nadie pierde una herramienta por azar.
            for (const c of EXPANSION.recorteFijo) {
                const i = s.mazoInv.indexOf(c);
                if (i >= 0)
                    s.mazoInv.splice(i, 1);
            }
        }
        else
            s.mazoInv.splice(0, EXPANSION.recorteMazoRoles);
    }
    if (o.testigos && o.nInv >= 2 && !o.roles) {
        // Cada quien roba 2 roles y se queda con uno. Los 8 roles sirven en los dos modos.
        const pool = barajar(s, [...D.ROLES_LISTA]);
        if (o.reparto === "azar")
            for (const q of s.inv) {
                q.rol = pool.pop();
                cartaInicial(s, q);
            }
        else if (o.reparto !== "libre") {
            const k = Math.min(2, Math.floor(pool.length / o.nInv));
            for (const q of s.inv)
                q.opcionesRol = pool.splice(0, k);
        }
    }
    log(s, "Cae la noche en la casona.");
    if (cadaQuien(s))
        log(s, "Modo «Cada quien»: cada investigador juega por su cuenta. Lo que ves en el dado solo lo sabes tú; gana quien acuse bien primero.");
    if (s.reglas.vaso)
        log(s, "Modo vaso: el dado se tira tapado. Solo el ánima lo ve y anuncia el resultado… y puede mentir. Cualquiera puede destapar el vaso.");
    log(s, `Eres ${a.nombre}. Tus evidencias: ${a.ev.map((e) => D.EVIDENCIAS[e]).join(", ")}.`, "anima", [ANIMA]);
    s.pendiente = { tipo: "habilidades", quien: [ANIMA], datos: { propias: [...a.ev], ajenas: [0, 1, 2, 3, 4, 5, 6].filter((e) => !a.ev.includes(e)) } };
    return s;
}
// ---------------------------------------------------------------- bucle
function correr(s) {
    let guard = 0;
    while (!s.pendiente && !s.ganador && s.pila.length) {
        if (++guard > 100000)
            throw new Error("Bucle infinito en el motor");
        paso(s, s.pila.pop());
    }
}
function paso(s, m) {
    switch (m.k) {
        case "turno": return turno(s, m.asiento);
        case "robar": return robarTurno(s, m.asiento);
        case "actuar":
            s.pendiente = { tipo: "investigador", quien: [m.asiento] };
            return;
        case "detective": return pedirDetective(s, m.asiento);
        case "vigia": {
            const q = s.inv[m.asiento];
            if (!q.vivo || !q.mano.length)
                return;
            s.pendiente = { tipo: "vigia", quien: [q.asiento], datos: { n: Math.min(m.n, q.mano.length) } };
            return;
        }
        case "vigiaGuarda": {
            const q = s.inv[m.asiento];
            if (!q.vivo || !q.mano.length)
                return;
            s.pendiente = { tipo: "vigiaGuarda", quien: [q.asiento], datos: {} };
            return;
        }
        case "finInv": {
            const q = s.inv[m.asiento];
            q.sinHerramientas = false;
            return;
        }
        case "turnoAnima":
            if (!vivos(s).length)
                return ganar(s, "anima", "Murieron todos los investigadores. El ánima se queda con la casona.", undefined, "todos_muertos", `${quienAnima(s)} ganó acabando con todos los investigadores.`);
            if (s.animaCastigada) {
                s.animaCastigada--;
                return log(s, "El ánima, descubierta en su mentira, pierde este turno.", "anima");
            }
            s.turno = { asiento: ANIMA, de: "anima" };
            if (s.pentagrama) {
                s.pentagrama--;
                if (!s.pentagrama)
                    log(s, "El Pentagrama se borra: el copal vuelve a arder.");
            }
            s.pendiente = { tipo: "anima", quien: [ANIMA] };
            return;
        case "rellenarAnima": return rellenarAnima(s);
        case "siguiente":
            return apilar(s, { k: "turno", asiento: (m.asiento + 1) % s.nInv });
        case "copal": return abrirCopal(s, m);
        case "efecto": return efecto(s, m.carta, m.objetivo);
        case "anulada":
            log(s, `El copal anula ${m.oculta ? "la habilidad del ánima, sin revelarla" : D.cardName(m.carta)}.`);
            marca(s, { k: "anula", carta: m.oculta ? "back02" : m.carta });
            return;
        case "habRevelar": return habRevelar(s, m.carta);
        case "caza": return caza(s, m);
        case "salvado":
            s.salvo = "copal";
            log(s, `${nom(s, m.asiento)} se salva gracias al copal.`);
            return;
        case "muerte": return muerte(s, m.asiento, m.fuente);
        case "herramienta": return herramienta(s, m);
        case "dado": return tirarDado(s, m);
        case "falla":
            log(s, `La herramienta de ${nom(s, m.asiento)} falla por la Interferencia.`, "peligro");
            return;
        case "espiritu": return turnoEspiritu(s, m.asiento);
        case "alba": return albaInicio(s);
        case "albaEspanto": return albaEspanto(s);
        case "acusacionFinal": return acusacionFinal(s);
        case "revelarAliado":
            if (!s.inv[m.asiento].vivo)
                s.pendiente = { tipo: "revelar", quien: [ANIMA], datos: { asiento: m.asiento } };
            return;
        case "elegirAliado": {
            const opciones = vivos(s).map((x) => x.asiento);
            if (!opciones.length)
                return;
            s.pendiente = { tipo: "aliado", quien: [m.asiento], datos: { validos: opciones } };
            return;
        }
        case "cadena": {
            const [a, ...resto] = m.lista;
            if (a === undefined)
                return;
            return apilar(s, { k: "caza", asiento: a, umbral: m.umbral, bloqueos: m.bloqueos, copalSalva: true, fuente: m.fuente }, { k: "cadenaSig", asiento: a, resto, umbral: m.umbral, bloqueos: m.bloqueos, fuente: m.fuente });
        }
        case "cadenaSig":
            if (s.inv[m.asiento].vivo && (s.salvo === "ruda" || s.salvo === "copal"))
                return log(s, `La ${s.salvo === "ruda" ? "ruda" : "humareda de copal"} ahuyenta al Tlahuelpuchi: el vuelo se detiene.`);
            return apilar(s, { k: "cadena", lista: m.resto, umbral: m.umbral, bloqueos: m.bloqueos, fuente: m.fuente });
        case "espPre": return espantoPre(s, m.objetivo);
        case "guardian":
            if (s.inv[m.asiento].vivo)
                s.pendiente = { tipo: "guardian", quien: [m.asiento] };
            return;
        case "espCazas": return espantoCazas(s);
        case "espCadenas": return espantoCadenas(s);
        case "espFin": return espantoFin(s, m.n0);
        default:
            throw new Error("Marco desconocido: " + m.k);
    }
}
// ---------------------------------------------------------------- turnos
function turno(s, asiento) {
    if (!vivos(s).length)
        return ganar(s, "anima", "Murieron todos los investigadores. El ánima se queda con la casona.", undefined, "todos_muertos", `${quienAnima(s)} ganó acabando con todos los investigadores.`);
    const q = s.inv[asiento];
    s.nTurno++;
    if (q.vivo) {
        s.turno = { asiento, de: "investigador" };
        q.ruda = false;
        q.sinHerramientas = q.sinHerramientasProx;
        q.sinHerramientasProx = false;
        if (s.muneca === asiento) {
            perder(s, q, 1);
            log(s, `La Muñeca de la isla mira a ${q.nombre}: pierde 1 de cordura.`, "peligro");
            marca(s, { k: "cordura", a: asiento, n: -1 });
        }
        const animaJuega = !(cadaQuien(s) && CADA_QUIEN.animaPorRonda) || finDeRonda(s, asiento);
        apilar(s, { k: "robar", asiento }, { k: "actuar", asiento }, { k: "finInv", asiento }, ...(animaJuega ? [{ k: "turnoAnima" }, { k: "rellenarAnima" }] : []), { k: "siguiente", asiento });
    }
    else if (cadaQuien(s)) {
        // «Sálvese quien pueda»: quien murió o salió juega como aliado de un vivo.
        s.turno = { asiento, de: "espiritu" };
        const aliadoVivo = q.aliado !== undefined && q.aliado !== null && s.inv[q.aliado].vivo;
        apilar(s, ...(aliadoVivo ? [] : [{ k: "elegirAliado", asiento }]), { k: "espiritu", asiento }, { k: "siguiente", asiento });
    }
    else {
        s.turno = { asiento, de: "espiritu" };
        apilar(s, { k: "espiritu", asiento }, { k: "siguiente", asiento });
    }
}
/** ¿Es este el último investigador vivo antes de volver a empezar la ronda? */
function finDeRonda(s, asiento) {
    for (let i = 1; i <= s.nInv; i++) {
        const x = (asiento + i) % s.nInv;
        if (s.inv[x].vivo)
            return x <= asiento;
    }
    return true;
}
function robarTurno(s, asiento) {
    const q = s.inv[asiento];
    const n = D.manoInvestigador(s.nInv);
    while (q.mano.length < n) {
        if (!s.mazoInv.length) {
            s.pila.length = 0; // la noche termina: nada de lo que seguía en el turno ocurre
            return apilar(s, { k: "alba" });
        }
        q.mano.push(s.mazoInv.pop());
    }
}
// ---------------------------------------------------------------- acciones
/**
 * Aplica una decisión. Es atómica: si la acción no es válida, lanza un error y
 * el estado queda exactamente como estaba. (Con `rapido` se omite la copia de
 * seguridad; úsalo solo en simulaciones con bots confiables.)
 */
export function aplicar(s, a, opciones = {}) {
    const p = s.pendiente;
    if (s.ganador)
        throw new Error("La partida ya terminó");
    if (!p)
        throw new Error("No hay ninguna decisión pendiente");
    if (!p.quien.includes(a.quien))
        throw new Error(`No le toca decidir a ${a.quien}`);
    const h = MANEJADORES[p.tipo];
    if (!h)
        throw new Error("Decisión desconocida: " + p.tipo);
    const copia = opciones.rapido ? null : structuredClone(s);
    try {
        h(s, a, p);
        correr(s);
    }
    catch (e) {
        if (copia)
            Object.assign(s, copia);
        throw e;
    }
    return s;
}
function exigir(cond, msg) {
    if (!cond)
        throw new Error(msg);
}
const MANEJADORES = {
    habilidades(s, a, p) {
        const { verdadera, falsa } = a;
        exigir(p.datos.propias.includes(verdadera), "La habilidad verdadera debe ser de tus evidencias");
        exigir(p.datos.ajenas.includes(falsa), "La habilidad falsa debe ser de una evidencia que no tienes");
        s.habilidades = { verdadera, falsa };
        const extraV = barajar(s, p.datos.propias.filter((e) => e !== verdadera)).slice(0, EXPANSION.habExtraV);
        const extraF = barajar(s, p.datos.ajenas.filter((e) => e !== falsa)).slice(0, EXPANSION.habExtraF);
        s.habExtra = { verdaderas: extraV, falsas: extraF };
        s.mazoAnima = barajar(s, [...D.mazoAnima(), "h" + verdadera, "h" + falsa, ...[...extraV, ...extraF].map((e) => "h" + e), ...(s.reglas.objetos ? D.objetosAnima().filter((c) => c !== "muneca" || s.nInv >= EXPANSION.munecaMinInv || (s.nInv === 1 && EXPANSION.munecaEnDuelo)) : [])]);
        s.pendiente = null;
        rellenarAnima(s);
        if (s.reglas.roles && s.reglas.reparto === "libre" && s.inv.some((q) => !q.rol)) {
            log(s, "El ánima prepara su mazo. Cada investigador, en orden, elige su rol.");
            return pedirRolLibre(s);
        }
        if (s.reglas.roles && s.reglas.reparto === "azar") {
            log(s, "El ánima prepara su mazo. Los roles se repartieron al azar.");
            for (const q of s.inv)
                if (q.rol)
                    log(s, `${q.nombre} es ${D.ROLES[q.rol].nombre.toLowerCase()}: ${D.ROLES[q.rol].texto}`);
            log(s, "Empieza la investigación.");
            return apilar(s, { k: "turno", asiento: 0 });
        }
        if (s.inv.some((q) => q.opcionesRol?.length)) {
            log(s, "El ánima prepara su mazo. Cada investigador elige quién es esta noche.");
            const opciones = {};
            for (const q of s.inv)
                opciones[q.asiento] = q.opcionesRol;
            s.pendiente = { tipo: "rol", quien: s.inv.map((q) => q.asiento), resp: {}, datos: { opciones } };
            return;
        }
        log(s, "El ánima prepara su mazo. Empieza la investigación.");
        apilar(s, { k: "turno", asiento: 0 });
    },
    rol(s, a, p) {
        if (p.datos.libre) {
            exigir(p.datos.opciones[a.quien]?.includes(a.rol), "Ese rol ya lo tiene otro investigador");
            const q = s.inv[a.quien];
            q.rol = a.rol;
            cartaInicial(s, q);
            log(s, `${q.nombre} elige ser ${D.ROLES[q.rol].nombre.toLowerCase()}: ${D.ROLES[q.rol].texto}`);
            s.pendiente = null;
            if (s.inv.some((x) => !x.rol))
                return pedirRolLibre(s);
            log(s, "Empieza la investigación.");
            return apilar(s, { k: "turno", asiento: 0 });
        }
        exigir(p.datos.opciones[a.quien]?.includes(a.rol), "Elige uno de tus dos roles");
        p.resp[a.quien] = a.rol;
        if (p.quien.some((x) => !(x in p.resp)))
            return;
        s.pendiente = null;
        for (const q of s.inv) {
            q.rol = p.resp[q.asiento];
            q.opcionesRol = [];
            cartaInicial(s, q);
            log(s, `${q.nombre} es ${D.ROLES[q.rol].nombre.toLowerCase()}: ${D.ROLES[q.rol].texto}`);
        }
        log(s, "Empieza la investigación.");
        apilar(s, { k: "turno", asiento: 0 });
    },
    investigador(s, a, p) {
        const q = s.inv[a.quien];
        switch (a.tipo) {
            case "acusar": {
                exigir(confirmadasDe(s, q.asiento).length >= 2, cadaQuien(s) ? "Necesitas 2 evidencias confirmadas por ti para acusar" : "Se necesitan 2 evidencias confirmadas para acusar");
                exigir(D.ANIMA_POR_ID[a.anima], "Ánima desconocida");
                s.pendiente = null;
                return resolverAcusacion(s, q.asiento, a.anima, false);
            }
            case "jugar": {
                const i = a.carta;
                const c = q.mano[i];
                exigir(c !== undefined, "Carta inválida");
                if (D.isTool(c) || c === "kit") {
                    exigir(q.c >= 1, "Necesitas al menos 1 de cordura para usar una herramienta");
                    exigir(!q.sinHerramientas, "Te escondiste: este turno no puedes usar herramientas");
                    const ev = c === "kit" ? a.ev : D.toolEv(c);
                    exigir(ev >= 0 && ev <= 6, "Elige una evidencia");
                    q.mano.splice(i, 1);
                    s.descInv.push(c);
                    s.pendiente = null;
                    log(s, `${q.nombre} usa ${c === "kit" ? "el Kit de campo" : D.cardName(c)} para buscar ${D.EVIDENCIAS[ev]}.`);
                    marca(s, { k: "juega", carta: c, de: q.asiento });
                    return apilar(s, { k: "herramienta", asiento: q.asiento, ev, umbral: c === "kit" ? 5 : 4, costo: 1 });
                }
                exigir(!D.INV_CARDS[c]?.reaccion, "Esa carta solo se usa como reacción; puedes descartarla");
                if (c in D.OBJETOS_INV)
                    return jugarObjeto(s, q, i, a);
                q.mano.splice(i, 1);
                s.descInv.push(c);
                s.pendiente = null;
                if (c === "te" && q.rol === "curandera") {
                    const t = a.objetivo !== undefined && s.inv[a.objetivo]?.vivo ? s.inv[a.objetivo] : q;
                    curar(t, 3);
                    log(s, t === q ? `${q.nombre}, el curandero, toma Té de tila (+3 de cordura).` : `${q.nombre}, el curandero, le da Té de tila a ${t.nombre} (+3 de cordura).`);
                    marca(s, { k: "rol", de: q.asiento, rol: "curandera", a: t.asiento });
                }
                else if (c === "te") {
                    curar(q, 2);
                    log(s, `${q.nombre} toma Té de tila (+2 de cordura).`);
                }
                else if (c === "resp") {
                    curar(q, 1);
                    robarInv(s, q, 1);
                    log(s, `${q.nombre} respira hondo (+1 de cordura y roba 1).`);
                }
                else if (c === "ruda") {
                    q.ruda = true;
                    log(s, `${q.nombre} cuelga la ruda: el ánima no puede elegirle ni cazarle hasta su siguiente turno.`);
                }
                marca(s, { k: "juega", carta: c, de: q.asiento });
                return;
            }
            case "descartar": {
                const idx = [...new Set(a.cartas)].sort((x, y) => y - x);
                exigir(idx.length >= 1, "Descarta al menos 1 carta: no se puede pasar");
                exigir(idx.every((i) => q.mano[i] !== undefined), "Carta inválida");
                for (const i of idx)
                    s.descInv.push(q.mano.splice(i, 1)[0]);
                s.pendiente = null;
                log(s, `${q.nombre} descarta ${idx.length} carta${idx.length > 1 ? "s" : ""}.`);
                marca(s, { k: "descarta", de: q.asiento, n: idx.length });
                return;
            }
            case "improvisar": {
                const idx = [...new Set(a.cartas)].sort((x, y) => y - x);
                const nImp = q.rol === "improvisador" && (idx.length === 1 || !EXPANSION.improvisadorElige) ? 1 : 2;
                exigir(idx.length === nImp && idx.every((i) => q.mano[i] !== undefined), `Improvisar pide descartar exactamente ${nImp} carta${nImp > 1 ? "s" : ""}`);
                exigir(q.c >= 1, "Necesitas al menos 1 de cordura");
                exigir(!q.sinHerramientas, "Te escondiste: este turno no puedes buscar evidencias");
                const ev = a.ev;
                exigir(ev >= 0 && ev <= 6, "Elige una evidencia");
                for (const i of idx)
                    s.descInv.push(q.mano.splice(i, 1)[0]);
                s.pendiente = null;
                log(s, `${q.nombre} improvisa con ${nImp} carta${nImp > 1 ? "s" : ""} para buscar ${D.EVIDENCIAS[ev]}.`);
                marca(s, { k: "juega", carta: "improvisar", de: q.asiento });
                const umbralImp = q.rol === "improvisador" && EXPANSION.improvisadorV2 ? (nImp === 1 ? 5 : 4) : nImp === 1 ? 6 : 5;
                return apilar(s, { k: "herramienta", asiento: q.asiento, ev, umbral: umbralImp, costo: 1 });
            }
        }
        throw new Error("Acción desconocida: " + a.tipo);
    },
    anima(s, a) {
        switch (a.tipo) {
            case "espanto": {
                exigir(!s.espantoUsado, "El Espanto solo se usa una vez");
                exigir(puedeEspanto(s), cadaQuien(s) ? "El Espanto solo se usa cuando algún investigador ya tiene 2 evidencias confirmadas" : "El Espanto solo se usa con 2 evidencias confirmadas");
                s.pendiente = null;
                return iniciarEspanto(s, a.objetivo);
            }
            case "jugar": {
                const i = a.carta;
                const c = s.manoAnima[i];
                exigir(c !== undefined, "Carta inválida");
                exigir(c !== "interferencia", "Interferencia es una reacción; puedes descartarla");
                if (D.isHab(c)) {
                    s.manoAnima.splice(i, 1);
                    s.pendiente = null;
                    log(s, "El ánima anuncia una habilidad de evidencia.", "anima");
                    marca(s, { k: "juega", carta: "habilidad", de: ANIMA });
                    return apilar(s, { k: "copal", motivo: "habilidad", entonces: [{ k: "habRevelar", carta: c }], anular: [{ k: "anulada", carta: c, oculta: true }], descarte: c });
                }
                const def = D.GHOST_CARDS[c] ?? D.OBJETOS_ANIMA[c];
                let objetivo;
                if (def.objetivo) {
                    objetivo = a.objetivo;
                    const t = s.inv[objetivo];
                    exigir(t && t.vivo && !t.ruda, "Objetivo inválido");
                    if (c === "caceria")
                        exigir(t.c <= umbralCaceria(s), `La Cacería solo alcanza a quien tiene ${umbralCaceria(s)} o menos de cordura`);
                }
                if (c === "caceria_total")
                    exigir(vivos(s).some((q) => q.c <= umbralCaceria(s) && !q.ruda), "Nadie está al alcance de una cacería");
                s.manoAnima.splice(i, 1);
                s.pendiente = null;
                log(s, `El ánima juega ${def.nombre}${objetivo !== undefined ? ` contra ${s.inv[objetivo].nombre}` : ""}.`, "anima");
                marca(s, { k: "juega", carta: c, de: ANIMA, ...(objetivo !== undefined ? { a: objetivo } : {}) });
                return apilar(s, { k: "copal", motivo: c, entonces: [{ k: "efecto", carta: c, objetivo }], anular: [{ k: "anulada", carta: c }], descarte: c });
            }
            case "descartar": {
                const idx = [...new Set(a.cartas ?? [])].sort((x, y) => y - x);
                exigir(idx.every((i) => s.manoAnima[i] !== undefined), "Carta inválida");
                for (const i of idx)
                    s.descAnima.push(s.manoAnima.splice(i, 1)[0]);
                s.pendiente = null;
                log(s, idx.length ? `El ánima descarta ${idx.length} carta${idx.length > 1 ? "s" : ""}.` : "El ánima espera.", "anima");
                if (idx.length)
                    marca(s, { k: "descarta", de: ANIMA, n: idx.length });
                return;
            }
        }
        throw new Error("Acción desconocida: " + a.tipo);
    },
    copal(s, a, p) {
        p.resp[a.quien] = !!a.usar;
        if (p.quien.some((x) => !(x in p.resp)))
            return; // faltan respuestas
        const d = p.datos;
        s.pendiente = null;
        const usa = p.quien.find((x) => p.resp[x] && s.inv[x].mano.includes("copal"));
        if (d.descarte)
            s.descAnima.push(d.descarte);
        const dev = d.devota;
        if (usa === undefined && dev !== null && dev !== undefined && p.resp[dev] && s.inv[dev].mano.includes("ros")) {
            const q = s.inv[dev];
            q.mano.splice(q.mano.indexOf("ros"), 1);
            s.descInv.push("ros");
            log(s, `${q.nombre}, la devota, alza su Rosario como si fuera copal.`, "rol");
            marca(s, { k: "rol", de: q.asiento, rol: "padre" });
            return apilar(s, ...d.anular);
        }
        if (usa !== undefined) {
            const q = s.inv[usa];
            q.mano.splice(q.mano.indexOf("copal"), 1);
            s.descInv.push("copal");
            log(s, `${q.nombre} quema copal.`);
            marca(s, { k: "copal", de: q.asiento });
            apilar(s, ...d.anular);
        }
        else
            apilar(s, ...d.entonces);
    },
    objetivoHabilidad(s, a, p) {
        const t = a.objetivo;
        exigir(p.datos.validos.includes(t), "Objetivo inválido");
        s.pendiente = null;
        efectoHabilidad(s, p.datos.carta, t);
    },
    espejo(s) {
        s.pendiente = null; // ya vio las cartas: sigue la partida
    },
    detective(s, a, p) {
        exigir(p.datos.validos.includes(a.ev), "Elige una evidencia que aún no se sepa");
        s.pendiente = null;
        responderDetective(s, a.quien, a.ev);
    },
    vigia(s, a, p) {
        const q = s.inv[a.quien];
        const idx = [...new Set(a.cartas ?? [])];
        exigir(idx.length === p.datos.n && idx.every((i) => q.mano[i] !== undefined), `Elige ${p.datos.n} carta${p.datos.n > 1 ? "s" : ""} para soltar`);
        s.pendiente = null;
        const sueltas = idx.sort((x, y) => y - x).map((i) => q.mano.splice(i, 1)[0]);
        s.descInv.push(...sueltas);
        log(s, `${q.nombre}, el vigía, elige qué soltar: ${sueltas.map(D.cardName).join(", ")}.`, "rol");
        marca(s, { k: "rol", de: q.asiento, rol: "vigia", n: sueltas.length });
    },
    vigiaGuarda(s, a, p) {
        const q = s.inv[a.quien];
        exigir(q.mano[a.carta] !== undefined, "Elige la carta que conservas");
        s.pendiente = null;
        vigiaGuarda(s, q, a.carta);
    },
    guardaOtro(s, a, p) {
        const d = p.datos;
        const g = s.inv[a.quien];
        s.pendiente = null;
        if (a.usar) {
            exigir(!g.rolUsado && g.c >= EXPANSION.guardaMin, "Ya no puedes proteger a nadie");
            g.rolUsado = true;
            perder(s, g, 2, false);
            log(s, `${g.nombre}, el guardaespaldas, se pone frente a ${s.inv[d.objetivo].nombre}: pierde 2 de cordura y la cacería se detiene.`, "rol");
            marca(s, { k: "rol", de: g.asiento, rol: "guardaespaldas", a: d.objetivo, n: -2 });
            return;
        }
        caza(s, { ...d.m, devotaVista: true, guardaVista: true });
    },
    devota(s, a, p) {
        const d = p.datos;
        const dev = s.inv[a.quien];
        s.pendiente = null;
        if (a.usar && dev.mano.includes("ros")) {
            dev.mano.splice(dev.mano.indexOf("ros"), 1);
            s.descInv.push("ros");
            log(s, `${dev.nombre}, la devota, reza su Rosario por ${s.inv[d.objetivo].nombre}: la cacería se disipa.`, "rol");
            marca(s, { k: "rol", de: dev.asiento, rol: "padre", a: d.objetivo });
            return;
        }
        caza(s, { ...d.m, devotaVista: true });
    },
    tecnico(s, a, p) {
        const d = p.datos;
        const q = s.inv[d.asiento];
        s.pendiente = null;
        if (d.vaso) {
            // Bajo el vaso: si repite, la tirada anterior se olvida y se vuelve a tirar tapado.
            const t = s.vasoTras;
            s.vasoTras = undefined;
            if (!a.usar)
                return seguirAnuncio(s, t.d, t.retadores, t.dudable);
            exigir(q.c >= EXPANSION.tecnicoCosto, `Necesitas ${EXPANSION.tecnicoCosto} de cordura para repetir`);
            perder(s, q, EXPANSION.tecnicoCosto, false);
            log(s, `${q.nombre}, el técnico, ajusta el aparato (pierde ${EXPANSION.tecnicoCosto} de cordura) y vuelve a tirar bajo el vaso.`, "rol");
            marca(s, { k: "rol", de: q.asiento, rol: "tecnico" });
            return tirarDado(s, { asiento: d.asiento, ev: d.ev, umbral: d.umbral, repetido: true });
        }
        let v = d.valor, verdad = "nada";
        if (a.usar) {
            if (EXPANSION.tecnicoCosto) {
                exigir(q.c >= EXPANSION.tecnicoCosto, `Necesitas ${EXPANSION.tecnicoCosto} de cordura para repetir`);
                perder(s, q, EXPANSION.tecnicoCosto, false);
                log(s, `${q.nombre}, el técnico, ajusta el aparato (pierde ${EXPANSION.tecnicoCosto} de cordura) y repite el dado (había salido ${v}).`, "rol");
            }
            else {
                q.rolUsado = true;
                log(s, `${q.nombre}, el técnico, ajusta el aparato y repite el dado (había salido ${v}).`, "rol");
            }
            marca(s, { k: "rol", de: q.asiento, rol: "tecnico" });
            v = dado(s);
            verdad = verdadDelDado(s, v, d.umbral, d.ev);
        }
        registrarLectura(s, d.asiento, d.ev, verdad, v, d.umbral);
        detective(s, d.asiento, verdad);
    },
    defensa(s, a, p) {
        const q = s.inv[a.quien];
        const con = a.con;
        const m = p.datos;
        s.pendiente = null;
        if (con === "guarda") {
            exigir(m.guarda, "Ya usaste tu rol de guardaespaldas");
            q.rolUsado = true;
            const pierde = EXPANSION.guardaElige ? Math.min(q.c, EXPANSION.guardaPropio ?? q.c) : 2;
            perder(s, q, pierde, false);
            log(s, EXPANSION.guardaElige ? `${q.nombre}, el guardaespaldas, aguanta el golpe con todo lo que tiene: se queda sin cordura, pero sigue en pie.` : `${q.nombre}, el guardaespaldas, aguanta el golpe: pierde 2 de cordura y sigue en pie.`, "rol");
            marca(s, { k: "rol", de: q.asiento, rol: "guardaespaldas", n: -pierde });
            return;
        }
        if (con) {
            exigir(m.opciones.includes(con), "No puedes defenderte con esa carta");
            q.mano.splice(q.mano.indexOf(con), 1);
            s.descInv.push(con);
            if (con === "esc") {
                q.sinHerramientasProx = true;
                log(s, `${q.nombre} se esconde y escapa de la cacería.`);
            }
            else if (con === "ult" && s.turno.de === "espanto" && espDef(s).corazon) {
                s.corazon = true;
                log(s, `${q.nombre} enfrenta al Hacha nocturna y le arranca el corazón: el Espanto se detiene para todos.`, "peligro");
            }
            else if (con === "ult") {
                robarAnimaUna(s);
                log(s, `${q.nombre} insulta al ánima y escapa; el ánima, ofendida, roba 1 carta.`);
            }
            else
                log(s, `${q.nombre} reza con su Rosario y la cacería se disipa.`);
            marca(s, { k: "defensa", carta: con, de: q.asiento });
            return;
        }
        if (m.copalSalva) {
            return apilar(s, { k: "copal", motivo: "salvar", objetivo: q.asiento, entonces: [{ k: "muerte", asiento: q.asiento, fuente: m.fuente }], anular: [{ k: "salvado", asiento: q.asiento }] });
        }
        apilar(s, { k: "muerte", asiento: q.asiento, fuente: m.fuente });
    },
    revelar(s, a, p) {
        exigir(s.animaEv.includes(a.ev), "Solo puedes mostrar una de tus evidencias");
        const q = s.inv[p.datos.asiento];
        q.sabe = a.ev;
        s.pendiente = null;
        log(s, `El ánima le muestra en secreto una evidencia al espíritu de ${q.nombre}.`);
        marca(s, { k: "muestra", a: q.asiento });
        log(s, `El ánima te mostró: ${D.EVIDENCIAS[a.ev]}.`, "evidencia", [q.asiento]);
        marca(s, { k: "muestra", a: q.asiento, ev: a.ev });
        if (cadaQuien(s) && q.aliado !== undefined && q.aliado !== null) {
            const t = s.inv[q.aliado];
            t.pistasPriv = [...new Set([...(t.pistasPriv ?? []), a.ev])];
            log(s, `Tu aliado ${q.nombre} te susurra: el ánima deja ${D.EVIDENCIAS[a.ev]}.`, "evidencia", [t.asiento]);
            marca(s, { k: "susurro", de: q.asiento, a: t.asiento, ev: a.ev });
        }
    },
    espiritu(s, a, p) {
        const q = s.inv[a.quien];
        s.pendiente = null;
        if (cadaQuien(s))
            exigir(["velar", "manifestarse"].includes(a.tipo), "Como aliado solo puedes velar o manifestarte");
        if (cadaQuien(s) && a.tipo === "velar")
            exigir(a.objetivo === q.aliado, "Solo puedes velar a tu aliado");
        switch (a.tipo) {
            case "responder":
                log(s, `Los vivos le harán una pregunta al espíritu de ${q.nombre}.`);
                s.pendiente = { tipo: "pregunta", quien: vivos(s).map((x) => x.asiento), datos: { espiritu: q.asiento } };
                return;
            case "manifestarse": {
                exigir(s.mazoInv.length > 0, "Solo queda el Alba: el espíritu no puede manifestarse");
                const c = s.mazoInv.pop();
                log(s, `El espíritu de ${q.nombre} se manifiesta y saca ${D.cardName(c)}.`);
                marca(s, { k: "manifiesta", carta: c, de: q.asiento });
                if (D.isTool(c)) {
                    s.descInv.push(c);
                    return apilar(s, { k: "herramienta", asiento: q.asiento, ev: D.toolEv(c), umbral: 5, costo: 0 });
                }
                if (c === "kit") {
                    s.descInv.push(c);
                    s.pendiente = { tipo: "kitEspiritu", quien: [q.asiento] };
                    return;
                }
                s.descInv.push(c);
                log(s, "No le sirve desde el más allá: se descarta.");
                return;
            }
            case "eco": {
                const u = s.ultimoNada;
                exigir(p.datos?.eco && u, "No hay un «Nada» reciente que repetir");
                q.ecoUsado = true;
                log(s, `El espíritu de ${q.nombre} hace eco: se repite el dado de ${D.EVIDENCIAS[u.ev]}.`);
                marca(s, { k: "eco", de: q.asiento });
                return apilar(s, { k: "dado", asiento: u.asiento, ev: u.ev, umbral: u.umbral, eco: true });
            }
            case "velar": {
                const t = s.inv[a.objetivo];
                exigir(t && t.vivo, "Elige a un investigador vivo");
                t.veladoPor = q.asiento;
                log(s, `El espíritu de ${q.nombre} vela a ${t.nombre}: hasta su siguiente turno pierde 1 menos de cordura cada vez.`);
                return;
            }
        }
        throw new Error("Acción desconocida: " + a.tipo);
    },
    kitEspiritu(s, a) {
        exigir(a.ev >= 0 && a.ev <= 6, "Elige una evidencia");
        s.pendiente = null;
        apilar(s, { k: "herramienta", asiento: a.quien, ev: a.ev, umbral: 6, costo: 0 });
    },
    pregunta(s, a, p) {
        exigir(typeof a.texto === "string" && a.texto.trim(), "Escribe la pregunta");
        const pr = { espiritu: p.datos.espiritu, texto: a.texto.trim(), ...(a.evs ? { evs: a.evs } : {}) };
        s.preguntas.push(pr);
        log(s, `${s.inv[a.quien].nombre} pregunta: «${pr.texto}»`);
        s.pendiente = { tipo: "respuesta", quien: [p.datos.espiritu] };
    },
    respuesta(s, a) {
        exigir(["si", "no", "talvez"].includes(a.valor), "Responde sí, no o tal vez");
        const pr = s.preguntas[s.preguntas.length - 1];
        pr.respuesta = a.valor;
        s.pendiente = null;
        log(s, `El espíritu de ${s.inv[a.quien].nombre} responde: ${a.valor === "si" ? "sí" : a.valor === "no" ? "no" : "tal vez"}.`);
        marca(s, { k: "respuesta", de: a.quien, valor: a.valor });
        if (a.valor === "si" && pr.evs?.length === 1 && !s.pistas.some((x) => x.ev === pr.evs[0] && x.fuente === "espiritu")) {
            s.pistas.push({ ev: pr.evs[0], fuente: "espiritu" });
        }
    },
    albaCaza(s, a, p) {
        const t = a.objetivo;
        if (p.datos.validos.length)
            exigir(t !== null && p.datos.validos.includes(t), "Elige a quién cazar");
        s.pendiente = null;
        if (t !== null && t !== undefined) {
            log(s, `Al despuntar el Alba, el ánima caza a ${s.inv[t].nombre}.`, "peligro");
            apilar(s, { k: "caza", asiento: t, umbral: p.datos.cualquiera ? null : D.UMBRAL_CAZA, bloqueos: {}, copalSalva: false, fuente: "Cacería del Alba" });
        }
    },
    albaEspanto(s, a, p) {
        exigir(!p.datos?.obligado || a.usar, "El ánima debe desatar su Espanto");
        s.pendiente = null;
        if (a.usar)
            return iniciarEspanto(s, a.objetivo);
        if (s.apuestas) {
            const g = vivos(s).filter((q) => s.apuestas[q.asiento] === s.anima).map((q) => q.asiento);
            return ganar(s, "investigadores", `Con la primera luz, ${g.map((x) => nom(s, x)).join(" y ")} ${g.length > 1 ? "acertaron" : "acertó"}: era ${animaDef(s).nombre}.`, g, "acusacion_alba", `${g.map((x) => nom(s, x)).join(" y ")} ${g.length > 1 ? "ganaron" : "ganó"} acertando la apuesta final.`);
        }
        apilar(s, { k: "acusacionFinal" });
    },
    acusacionFinal(s, a, p) {
        exigir(D.ANIMA_POR_ID[a.anima], "Ánima desconocida");
        if (cadaQuien(s)) {
            // Cada quien acusa en secreto; se revelan todas a la vez.
            p.resp[a.quien] = a.anima;
            if (p.quien.some((x) => !(x in p.resp)))
                return;
            s.pendiente = null;
            for (const x of p.quien)
                log(s, `${nom(s, x)} acusa: «¡Eres ${D.ANIMA_POR_ID[p.resp[x]].nombre}!»`, "peligro");
            if (CADA_QUIEN.apuestaFinal && !s.espantoUsado) {
                s.apuestas = { ...p.resp };
                const a0 = animaDef(s);
                const aciertan = p.quien.filter((x) => p.resp[x] === s.anima);
                const conPrueba = aciertan.filter((x) => s.inv[x].conf.length >= 1);
                marca(s, { k: "apuestas", anima: s.anima, lista: p.quien.map((x) => ({ de: x, anima: p.resp[x], acierta: p.resp[x] === s.anima, prueba: s.inv[x].conf.length })) });
                if (!aciertan.length)
                    return ganar(s, "anima", `Con la primera luz nadie acertó: era ${a0.nombre}. El ánima gana.`, undefined, "alba_nadie", `${quienAnima(s)} ganó resistiendo hasta el Alba sin que nadie acertara.`);
                if (conPrueba.length)
                    return ganar(s, "investigadores", `${aciertan.map((x) => nom(s, x)).join(" y ")} ${aciertan.length > 1 ? "acertaron" : "acertó"}: era ${a0.nombre}, y había pruebas.`, aciertan, "acusacion_alba", `${aciertan.map((x) => nom(s, x)).join(" y ")} ${aciertan.length > 1 ? "ganaron" : "ganó"} acertando la apuesta final con pruebas.`);
                // Acertaron sin ninguna evidencia: el ánima, furiosa, desata su Espanto. Gana quien sobreviva.
                log(s, `${aciertan.map((x) => nom(s, x)).join(" y ")} ${aciertan.length > 1 ? "adivinaron" : "adivinó"} sin pruebas: era ${a0.nombre}. Furiosa, el ánima desata su Espanto: hay que sobrevivir.`, "peligro");
                marca(s, { k: "apuestaEspanto", aciertan, anima: s.anima });
                s.pendiente = { tipo: "albaEspanto", quien: [ANIMA], datos: { aciertan, obligado: true } };
                return;
            }
            const bien = p.quien.filter((x) => p.resp[x] === s.anima);
            const a0 = animaDef(s);
            if (bien.length)
                return ganar(s, "investigadores", `Con la primera luz, ${bien.map((x) => nom(s, x)).join(" y ")} ${bien.length > 1 ? "acertaron" : "acertó"}: era ${a0.nombre}.`, bien, "acusacion_alba", `${bien.map((x) => nom(s, x)).join(" y ")} ${bien.length > 1 ? "ganaron" : "ganó"} acusando bien a ${a0.nombre} en la acusación final del Alba.`);
            return ganar(s, "anima", `Con la primera luz nadie acertó: era ${a0.nombre}. El ánima gana.`, undefined, "alba_nadie", `${quienAnima(s)} ganó resistiendo hasta el Alba sin que nadie acertara.`);
        }
        s.pendiente = null;
        resolverAcusacion(s, a.quien, a.anima, true);
    },
    cucuyDoble(s, a, p) {
        exigir(p.datos.validos.includes(a.objetivo), "Elige a uno de los empatados");
        s.pendiente = null;
        apilarCazasEspanto(s, a.objetivo);
    },
    guardian(s, a) {
        const q = s.inv[a.quien];
        s.pendiente = null;
        if (a.eleccion === "descartar") {
            const idx = [...new Set(a.cartas)].sort((x, y) => y - x);
            exigir(q.mano.length >= 2 && idx.length === 2 && idx.every((i) => q.mano[i] !== undefined), "Elige 2 cartas para devolver el oro");
            for (const i of idx)
                s.descInv.push(q.mano.splice(i, 1)[0]);
            log(s, `${q.nombre} devuelve el oro: descarta 2 cartas.`);
            marca(s, { k: "espantoFx", fx: "devuelve", a: q.asiento });
        }
        else {
            q.oro = true;
            log(s, `${q.nombre} se queda con el oro: el Guardián lo cazará sin importar su cordura.`, "peligro");
            marca(s, { k: "espantoFx", fx: "oro", a: q.asiento });
        }
    },
};
// La Interferencia necesita el marco de la herramienta: se maneja aparte.
MANEJADORES.interferir = (s, a, p) => {
    const m = p.datos;
    s.pendiente = null;
    if (a.usar) {
        const i = s.manoAnima.indexOf("interferencia");
        exigir(i >= 0, "No tienes Interferencia");
        s.manoAnima.splice(i, 1);
        log(s, "El ánima juega Interferencia.", "anima");
        marca(s, { k: "juega", carta: "interferencia", de: ANIMA, a: m.asiento });
        return apilar(s, { k: "copal", motivo: "interferencia", entonces: [{ k: "falla", asiento: m.asiento }], anular: [{ k: "dado", ...m }], descarte: "interferencia" });
    }
    apilar(s, { k: "dado", ...m });
};
/** Las evidencias confirmadas que cuentan para este investigador. */
export function confirmadasDe(s, asiento) {
    return cadaQuien(s) && asiento >= 0 ? s.inv[asiento].conf : s.confirmadas;
}
function puedeEspanto(s) {
    return cadaQuien(s) ? vivos(s).some((q) => q.conf.length >= 2) : s.confirmadas.length >= 2;
}
// ---------------------------------------------------------------- Objetos malditos
function jugarObjeto(s, q, i, a) {
    const c = q.mano[i];
    const sacar = () => { q.mano.splice(i, 1); s.descInv.push(c); s.pendiente = null; marca(s, { k: "juega", carta: c, de: q.asiento }); };
    switch (c) {
        case "radio": {
            const t = s.inv[a.objetivo];
            exigir(t && t.vivo && t !== q, "Elige a otro investigador vivo");
            const k = q.mano.findIndex((x, j) => j !== i && x === a.dar);
            exigir(k >= 0, "Elige qué carta pasar por la radio");
            sacar();
            const k2 = q.mano.indexOf(a.dar);
            t.mano.push(q.mano.splice(k2, 1)[0]);
            log(s, `${q.nombre} le pasa una carta a ${t.nombre} por la radio.`);
            marca(s, { k: "pasa", de: q.asiento, a: t.asiento });
            return;
        }
        case "tablilla": {
            const t = s.inv[a.objetivo];
            exigir(t && !t.vivo && !t.fuera, "Elige a un espíritu");
            sacar();
            log(s, `${q.nombre} pone la Tablilla espiritista: el espíritu de ${t.nombre} ya puede hablar.`);
            marca(s, { k: "tablilla", a: t.asiento });
            if (t.sabe !== null) {
                if (cadaQuien(s)) {
                    q.pistasPriv = [...new Set([...(q.pistasPriv ?? []), t.sabe])];
                    log(s, `El espíritu de ${t.nombre} te da a entender: ${D.EVIDENCIAS[t.sabe]}.`, "evidencia", [q.asiento, ANIMA]);
                }
                else {
                    if (!s.pistas.some((x) => x.ev === t.sabe && x.fuente === "espiritu"))
                        s.pistas.push({ ev: t.sabe, fuente: "espiritu" });
                    log(s, `El espíritu de ${t.nombre} da a entender: ${D.EVIDENCIAS[t.sabe]}.`, "evidencia");
                }
            }
            return;
        }
        case "mano": {
            const t = s.inv[a.objetivo];
            exigir(t && !t.vivo && !t.fuera, "Elige a un compañero muerto");
            sacar();
            const v = dado(s);
            log(s, `${q.nombre} pide un deseo a la Mano del mono y tira el dado: ${v}.`, "peligro");
            marca(s, { k: "manoMono", de: q.asiento, a: t.asiento, v });
            if (v <= 3)
                return apilar(s, { k: "muerte", asiento: q.asiento, fuente: "Mano del mono" });
            t.vivo = true;
            t.c = 5;
            t.mano = [];
            t.ruda = false;
            t.veladoPor = null;
            log(s, `${t.nombre} vuelve a la vida con 5 de cordura y sin cartas.`, "evidencia");
            marca(s, { k: "revive", a: t.asiento });
            return;
        }
        case "limpia": {
            sacar();
            s.muneca = null;
            s.pentagrama = 0;
            for (const x of vivos(s))
                curar(x, 2);
            log(s, `${q.nombre} hace una limpia con huevo: se van la Muñeca y el Pentagrama, y todos recuperan 2 de cordura.`);
            marca(s, { k: "limpia", de: q.asiento });
            return;
        }
        case "espejo_plata": {
            sacar();
            log(s, `${q.nombre} mira la mano del ánima en el Espejo de plata.`);
            marca(s, { k: "espejo", de: q.asiento, mira: ANIMA });
            log(s, `Mano del ánima: ${s.manoAnima.map(D.cardName).join(", ")}.`, "evidencia", [q.asiento]);
            marca(s, { k: "verCartas", cartas: [...s.manoAnima], de: ANIMA });
            // La partida espera a que quien mira termine de ver las cartas.
            s.pendiente = { tipo: "espejo", quien: [q.asiento], datos: { cartas: [...s.manoAnima], de: ANIMA } };
            s.espejoVistas = (s.espejoVistas ?? 0) + 1;
            const habs = s.manoAnima.filter(D.isHab).map((c) => Number(c[1])).filter((e) => !s.pistas.some((x) => x.ev === e && x.fuente === "habilidad"));
            s.espejoHabs = (s.espejoHabs ?? 0) + habs.length;
            if (EXPANSION.espejoRevelaHab && !cadaQuien(s))
                for (const e of habs)
                    s.pistas.push({ ev: e, fuente: "habilidad" });
            return;
        }
        case "tarot": {
            sacar();
            const v = dado(s);
            log(s, `${q.nombre} echa el Tarot y saca ${v}.`);
            if (v < 5)
                return log(s, "Las cartas no dicen nada.");
            const ya = cadaQuien(s) && EXPANSION.tarotPrivado ? q.desc : s.descartadas;
            const validos = [0, 1, 2, 3, 4, 5, 6].filter((e) => !s.animaEv.includes(e) && !ya.includes(e));
            if (!validos.length)
                return log(s, "Las cartas no tienen nada nuevo que decir.");
            s.pendiente = { tipo: "tarot", quien: [ANIMA], datos: { validos, quien: q.asiento } };
            return;
        }
    }
    throw new Error("Objeto desconocido: " + c);
}
MANEJADORES.tarot = (s, a, p) => {
    exigir(p.datos.validos.includes(a.ev), "Di una evidencia que no tengas y que no esté descartada");
    s.pendiente = null;
    const ev = a.ev;
    const quien = p.datos.quien;
    if (cadaQuien(s) && EXPANSION.tarotPrivado) {
        log(s, `El Tarot le habla en secreto a ${s.inv[quien].nombre}.`);
        log(s, `El Tarot dice: el ánima no deja ${D.EVIDENCIAS[ev]}.`, "evidencia", [quien, ANIMA]);
        marca(s, { k: "tarot", de: quien, ev });
        if (!s.inv[quien].desc.includes(ev))
            s.inv[quien].desc.push(ev);
        return;
    }
    log(s, `El Tarot habla por el ánima: no deja ${D.EVIDENCIAS[ev]}.`, "evidencia");
    marca(s, { k: "tarot", de: quien, ev });
    if (!s.descartadas.includes(ev))
        s.descartadas.push(ev);
    if (cadaQuien(s))
        for (const x of s.inv)
            if (!x.desc.includes(ev))
                x.desc.push(ev);
};
// ---------------------------------------------------------------- modo vaso
MANEJADORES_VASO();
MANEJADORES.aliado = (s, a, p) => {
    exigir(p.datos.validos.includes(a.objetivo), "Elige a un investigador vivo");
    const q = s.inv[a.quien], t = s.inv[a.objetivo];
    s.pendiente = null;
    const antes = q.aliado;
    q.aliado = t.asiento;
    t.veladoPor = q.asiento;
    if (antes !== undefined && antes !== null && antes !== t.asiento)
        log(s, `${q.nombre} cambia de aliado.`);
    log(s, `${q.nombre} pone su carta de Velar frente a ${t.nombre}: desde el más allá será su aliado.`);
    marca(s, { k: "velar", de: q.asiento, a: t.asiento });
    // si ya sabía una evidencia, se la pasa
    if (q.sabe !== null && !q.vivo && !q.fuera) {
        t.pistasPriv = [...new Set([...(t.pistasPriv ?? []), q.sabe])];
        log(s, `Tu aliado ${q.nombre} te susurra: el ánima deja ${D.EVIDENCIAS[q.sabe]}.`, "evidencia", [t.asiento]);
        marca(s, { k: "susurro", de: q.asiento, a: t.asiento, ev: q.sabe });
    }
};
MANEJADORES.acusarYa = (s, a) => {
    s.pendiente = null;
    if (!a.anima)
        return log(s, `${nom(s, a.quien)} se guarda su sospecha.`);
    exigir(D.ANIMA_POR_ID[a.anima], "Ánima desconocida");
    s._acusaYa = true;
    resolverAcusacion(s, a.quien, a.anima, false);
    s._acusaYa = false;
};
function MANEJADORES_VASO() {
    MANEJADORES.anunciar = (s, a, p) => {
        const dicho = a.dicho;
        exigir(["si", "no", "nada"].includes(dicho), "Anuncia Sí, No o Nada");
        const d = p.datos;
        const falsoSi = dicho === "si" && d.verdad !== "si" && VASO.falsoSi && esFalsa(s, d.ev);
        exigir(dicho === d.verdad || falsoSi || (dicho === "nada" && (d.verdad === "no" || !VASO.soloNo)), VASO.falsoSi ? "Bajo el vaso solo puedes ocultar un «No» diciendo «Nada», o decir «Sí» en la evidencia de tu habilidad falsa" : "Bajo el vaso solo puedes ocultar un «No» diciendo «Nada»");
        if (dicho !== d.verdad) {
            exigir((s.mentiras ?? 0) < VASO.maxMentiras, "Ya no te quedan engaños esta noche");
            s.mentiras = (s.mentiras ?? 0) + 1;
        }
        const quien = vivos(s).map((q) => q.asiento);
        s.pendiente = null;
        const privado = cadaQuien(s) && dicho !== "si";
        log(s, `El ánima mira bajo el vaso y anuncia: «${palabra(dicho)}» (${D.EVIDENCIAS[d.ev]}).`, "anima", privado ? [d.asiento, ANIMA] : undefined);
        marca(s, { k: "anuncio", de: d.asiento, dicho });
        if (privado) {
            log(s, `El ánima le responde en secreto a ${s.inv[d.asiento].nombre}.`, "anima");
            marca(s, { k: "anuncio", de: d.asiento, dicho: null });
        }
        if (dicho !== d.verdad)
            log(s, "Mentiste.", "anima", [ANIMA]);
        // Un No siempre es verdad. Se puede dudar de un «Nada» y, con el Sí falso, de un «Sí».
        // En «Sálvese quien pueda», un «Nada» solo lo destapa quien tiró; un «Sí» es público y lo destapa cualquiera.
        const retadores = cadaQuien(s) && dicho === "nada" ? quien.filter((x) => x === d.asiento) : quien;
        const dudable = dicho === "nada" || (dicho === "si" && VASO.falsoSi);
        // El técnico puede pagar y volver a tirar bajo el vaso antes de que alguien lo destape.
        const tec = s.inv[d.asiento];
        if (dicho === "nada" && !d.repetido && d.umbral === 4 && tec.vivo && tec.rol === "tecnico" && EXPANSION.tecnicoCosto && tec.c >= EXPANSION.tecnicoCosto) {
            s.vasoTras = { d: { ...d, dicho }, retadores, dudable };
            s.pendiente = { tipo: "tecnico", quien: [tec.asiento], datos: { vaso: true, ev: d.ev, umbral: d.umbral, asiento: d.asiento, costo: EXPANSION.tecnicoCosto, cordura: tec.c } };
            return;
        }
        seguirAnuncio(s, { ...d, dicho }, retadores, dudable);
    };
    MANEJADORES.desafio = (s, a, p) => {
        p.resp[a.quien] = !!a.desafiar;
        if (p.quien.some((x) => !(x in p.resp)))
            return;
        const d = p.datos;
        s.pendiente = null;
        // Desafía el primero que lo pidió, contando desde quien tiró.
        const orden = [...p.quien].sort((x, y) => ((x - d.asiento + s.nInv) % s.nInv) - ((y - d.asiento + s.nInv) % s.nInv));
        const reta = orden.find((x) => p.resp[x]);
        cerrarVaso(s, d, reta ?? null);
    };
}
function seguirAnuncio(s, d, retadores, dudable) {
    if (!retadores.length || !dudable)
        return cerrarVaso(s, d, null, true);
    s.pendiente = { tipo: "desafio", quien: retadores, resp: {}, datos: { ev: d.ev, dicho: d.dicho, asiento: d.asiento, umbral: d.umbral, valor: d.valor, verdad: d.verdad } };
}
function cerrarVaso(s, d, reta, sinDuda = false) {
    const ev = d.ev;
    if (reta === null) {
        s.lecturas.push({ ev, asiento: d.asiento, dicho: d.dicho, verificada: sinDuda });
        s.ultimoDado = { valor: 0, umbral: d.umbral, ev, resultado: d.dicho, oculto: true };
        if (!sinDuda)
            log(s, "Nadie destapa el vaso.");
        registrarLectura(s, d.asiento, ev, d.dicho, 0, d.umbral);
        return detective(s, d.asiento, d.dicho);
    }
    const q = s.inv[reta];
    const para = cadaQuien(s) && d.dicho === "nada" ? [reta, ANIMA] : undefined;
    if (para)
        log(s, `${q.nombre} destapa el vaso en secreto.`, "peligro");
    log(s, `${q.nombre} destapa el vaso: el dado marca ${d.valor}.`, "peligro", para);
    marca(s, { k: "destapa", de: q.asiento, mintio: d.dicho !== d.verdad, v: d.valor });
    s.lecturas.push({ ev, asiento: d.asiento, dicho: d.verdad, verificada: true });
    s.ultimoDado = { valor: d.valor, umbral: d.umbral, ev, resultado: d.verdad, de: d.asiento };
    if (d.dicho !== d.verdad) {
        s.animaCastigada = (s.animaCastigada ?? 0) + VASO.turnosPerdidos;
        log(s, `¡El ánima mintió! La verdad era «${palabra(d.verdad)}».`, "peligro", para);
        log(s, `El ánima, atrapada en una mentira, pierde su ${VASO.turnosPerdidos > 1 ? `próximos ${VASO.turnosPerdidos} turnos` : "próximo turno"}.`, "peligro");
        if (d.dicho === "si") {
            // Un Sí falso solo se puede decir en la habilidad falsa: atraparlo descarta esa evidencia.
            log(s, `Era su habilidad falsa: ${D.EVIDENCIAS[ev]} queda descartada.`, "evidencia");
            s.lecturas.push({ ev, asiento: d.asiento, dicho: "no", verificada: true });
            if (cadaQuien(s)) {
                // El Sí era público: todos ven que era mentira.
                for (const x of s.inv)
                    if (!x.desc.includes(ev))
                        x.desc.push(ev);
                if (!s.descartadas.includes(ev))
                    s.descartadas.push(ev);
                return;
            }
            return registrarLectura(s, d.asiento, ev, "no", 0, d.umbral);
        }
    }
    else {
        const costo = d.dicho === "si" ? VASO.costoDesafioSi : costoNada(s);
        perder(s, q, costo, false);
        log(s, `El ánima decía la verdad. ${q.nombre} pierde ${costo} de cordura por dudar.`, "peligro");
        marca(s, { k: "cordura", a: q.asiento, n: -costo });
    }
    registrarLectura(s, d.asiento, ev, d.verdad, d.valor, d.umbral);
    detective(s, d.asiento, d.verdad);
}
function resolverAcusacion(s, quien, anima, final) {
    const a = D.ANIMA_POR_ID[anima];
    log(s, `${nom(s, quien)} acusa: «¡Eres ${a.nombre}!»`, "peligro");
    if (cadaQuien(s)) {
        if (anima === s.anima) {
            s.acusacion = { quien, anima };
            const inmediata = s.pendiente === null && s._acusaYa;
            return ganar(s, "investigadores", `${nom(s, quien)} acertó: era ${a.nombre}. ${nom(s, quien)} gana la noche.`, [quien], inmediata ? "acusacion_inmediata" : "acusacion", `${nom(s, quien)} ganó acusando bien a ${a.nombre}${inmediata ? " en cuanto encontró la prueba" : " durante la noche"}, con ${s.inv[quien].conf.length} evidencias confirmadas.`);
        }
        // Acusar mal no termina la partida: ese investigador sale, pero el ánima sigue oculta.
        const q = s.inv[quien];
        q.fuera = true;
        q.vivo = false;
        s.descInv.push(...q.mano);
        q.mano = [];
        q.ruda = false;
        log(s, `No era ${a.nombre}. ${q.nombre} huye de la casona: ya no puede ganar, pero puede ayudar a alguien desde afuera.`, "muerte");
        marca(s, { k: "muerte", a: quien });
        if (vivos(s).length)
            apilar(s, { k: "elegirAliado", asiento: quien });
        if (!vivos(s).length)
            return ganar(s, "anima", `Nadie acertó y ya no queda nadie en la casona. Era ${animaDef(s).nombre}: el ánima gana.`, undefined, "todos_fuera", `${quienAnima(s)} ganó porque todos se equivocaron o murieron.`);
        return;
    }
    s.acusacion = { quien, anima };
    if (anima === s.anima)
        ganar(s, "investigadores", `Acertaron: era ${a.nombre}. Los investigadores liberan al ánima${final ? " con la primera luz" : ""}.`, undefined, final ? "acusacion_alba" : "acusacion", `Los investigadores ganaron cuando ${nom(s, quien)} acusó bien a ${a.nombre}${final ? " en la acusación final del Alba" : ` con ${s.confirmadas.length} evidencias confirmadas`}.`);
    else
        ganar(s, "anima", `${nom(s, quien)} acusó a ${a.nombre}, pero era ${animaDef(s).nombre}. El ánima gana.`, undefined, "acusacion_falla", `${quienAnima(s)} ganó porque ${nom(s, quien)} la confundió con ${a.nombre}.`);
}
// ---------------------------------------------------------------- copal
function abrirCopal(s, m) {
    const quien = s.pentagrama ? [] : vivos(s).map((q) => q.asiento);
    // La devota puede alzar su Rosario como copal contra una carta del ánima (no un Espanto ni para salvar).
    const dev = EXPANSION.padreCopal && m.motivo !== "salvar" && s.turno.de !== "espanto" ? vivos(s).find((q) => q.rol === "padre" && q.mano.includes("ros")) : undefined;
    if (!quien.length)
        return apilar(s, ...m.entonces);
    s.pendiente = { tipo: "copal", quien, resp: {}, datos: { motivo: m.motivo, objetivo: m.objetivo, entonces: m.entonces, anular: m.anular, descarte: m.descarte, devota: dev ? dev.asiento : null } };
}
// ---------------------------------------------------------------- efectos del ánima
function efecto(s, c, objetivo) {
    const V = vivos(s);
    const t = objetivo !== undefined ? s.inv[objetivo] : undefined;
    switch (c) {
        case "escalofrio":
            for (const q of V)
                perder(s, q, 1);
            log(s, "Un escalofrío recorre la mesa: todos pierden 1 de cordura.", "peligro");
            return;
        case "portazo":
            for (const q of V)
                descartarAlAzar(s, q, 1);
            log(s, "¡Portazo! Cada investigador descarta 1 carta al azar.", "peligro");
            return;
        case "travesura":
            for (const q of V) {
                if (q.rol === "vigia" && EXPANSION.vigiaGuarda && q.mano.length) {
                    apilar(s, { k: "vigiaGuarda", asiento: q.asiento });
                    continue;
                }
                const n = q.mano.length;
                s.descInv.push(...q.mano);
                q.mano = [];
                robarInv(s, q, n);
            }
            log(s, "Travesura: todos cambian su mano completa.", "peligro");
            marca(s, { k: "travesura" });
            return;
        case "manifestacion":
            if (t?.vivo && !t.ruda) {
                perder(s, t, 2);
                log(s, `${t.nombre} ve una figura y pierde 2 de cordura.`, "peligro");
            }
            return;
        case "posesion":
            if (t?.vivo && !t.ruda) {
                if (t.rol === "vigia" && EXPANSION.vigiaGuarda && t.mano.length)
                    apilar(s, { k: "vigiaGuarda", asiento: t.asiento });
                else {
                    const n = t.mano.length;
                    s.descInv.push(...t.mano);
                    t.mano = [];
                    robarInv(s, t, n);
                }
                log(s, `${t.nombre} es poseído: suelta su mano y roba otra.`, "peligro");
                marca(s, { k: "posesion", a: t.asiento, n: t.mano.length });
            }
            return;
        case "presencia":
            robarAnimaUna(s);
            robarAnimaUna(s);
            log(s, "Se siente una presencia: el ánima roba 2 cartas.", "anima");
            return;
        case "caceria":
            if (t)
                apilar(s, { k: "caza", asiento: t.asiento, umbral: umbralCaceria(s), bloqueos: {}, copalSalva: false, fuente: "Cacería" });
            return;
        case "muneca":
            if (t?.vivo && !t.ruda) {
                s.muneca = t.asiento;
                log(s, `La Muñeca de la isla queda frente a ${t.nombre}: perderá 1 de cordura al inicio de cada turno.`, "peligro");
                marca(s, { k: "muneca", a: t.asiento });
            }
            return;
        case "espejo_obsidiana":
            if (t?.vivo) {
                log(s, `El ánima mira en el Espejo de obsidiana la mano de ${t.nombre}.`, "anima");
                marca(s, { k: "espejo", de: ANIMA, mira: t.asiento });
                log(s, `Mano de ${t.nombre}: ${t.mano.map(D.cardName).join(", ") || "vacía"}.`, "anima", [ANIMA]);
                marca(s, { k: "verCartas", cartas: [...t.mano], de: t.asiento });
                s.pendiente = { tipo: "espejo", quien: [ANIMA], datos: { cartas: [...t.mano], de: t.asiento } };
            }
            return;
        case "pentagrama":
            s.pentagrama = 3; // este turno y los 2 siguientes del ánima
            log(s, "Un Pentagrama de ceniza aparece bajo la mesa: durante los 2 siguientes turnos del ánima nadie puede usar Copal.", "peligro");
            marca(s, { k: "pentagrama" });
            return;
        case "caceria_total":
            apilar(s, ...V.filter((q) => q.c <= umbralCaceria(s)).map((q) => ({ k: "caza", asiento: q.asiento, umbral: umbralCaceria(s), bloqueos: {}, copalSalva: false, fuente: "Cacería total" })));
            return;
    }
}
function habRevelar(s, c) {
    const h = D.HABILIDADES[c];
    log(s, `Se revela la habilidad: ${h.nombre}. Pista: ${D.EVIDENCIAS[h.ev]}.`, "evidencia");
    marca(s, { k: "revela", carta: c });
    if (!s.pistas.some((x) => x.ev === h.ev && x.fuente === "habilidad"))
        s.pistas.push({ ev: h.ev, fuente: "habilidad" });
    // La sensitiva siente si la habilidad es verdadera o falsa (una vez).
    const sen = vivos(s).find((x) => x.rol === "sensitiva" && !x.rolUsado && !(cadaQuien(s) ? x.conf.includes(h.ev) || x.desc.includes(h.ev) : s.confirmadas.includes(h.ev) || s.descartadas.includes(h.ev)));
    if (sen) {
        sen.rolUsado = true;
        const verdadera = s.animaEv.includes(h.ev);
        log(s, `${sen.nombre}, el sensitivo, siente la habilidad…`, "rol");
        log(s, `El sensitivo sabe que es ${verdadera ? "verdadera" : "falsa"}: el ánima ${verdadera ? "sí" : "no"} deja ${D.EVIDENCIAS[h.ev]}.`, "rol", cadaQuien(s) ? [sen.asiento, ANIMA] : undefined);
        marca(s, { k: "rol", de: sen.asiento, rol: "sensitiva", ev: h.ev, r: verdadera ? "si" : "no" });
        pistaDeRol(s, sen, h.ev, verdadera);
    }
    if (h.objetivo) {
        const validos = vivos(s).filter((q) => !q.ruda && (h.objetivo === "any" || q.c <= (h.objetivo === "th6" ? 6 : D.UMBRAL_CAZA))).map((q) => q.asiento);
        if (!validos.length)
            return log(s, "Nadie está a su alcance: no tiene efecto.");
        s.pendiente = { tipo: "objetivoHabilidad", quien: [ANIMA], datos: { carta: c, validos } };
        return;
    }
    efectoHabilidad(s, c);
}
function efectoHabilidad(s, c, objetivo) {
    const V = vivos(s);
    const caza = (umbral, bloqueos) => apilar(s, { k: "caza", asiento: objetivo, umbral, bloqueos, copalSalva: false, fuente: D.HABILIDADES[c].nombre });
    switch (c) {
        case "h0": return caza(D.UMBRAL_CAZA, { esc: true });
        case "h1": {
            // Acecho: con 4 o menos te caza; con 5 o más pierdes 2.
            const t = objetivo !== undefined ? s.inv[objetivo] : undefined;
            if (t && t.c > D.UMBRAL_CAZA) {
                perder(s, t, 2);
                return log(s, `Acecho: ${t.nombre} siente que lo siguen y pierde 2 de cordura.`, "peligro");
            }
            return caza(D.UMBRAL_CAZA, {});
        }
        case "h2":
            for (const q of V)
                perder(s, q, 2);
            return log(s, "Lamento: todos pierden 2 de cordura.", "peligro");
        case "h3":
            for (const q of V)
                descartarAlAzar(s, q, 2);
            return log(s, "Lluvia de objetos: cada investigador descarta 2 cartas al azar.", "peligro");
        case "h4": return caza(D.UMBRAL_CAZA, { ros: true });
        case "h5": {
            const b = V.reduce((x, y) => (y.c < x.c ? y : x));
            perder(s, b, 3);
            return log(s, `Arrastrar: ${b.nombre} pierde 3 de cordura.`, "peligro");
        }
        case "h6": return caza(6, {});
    }
}
// ---------------------------------------------------------------- cacerías y muerte
/** Las cartas de Cacería alcanzan a 4 o menos; en Duelo, solo a 3 o menos. */
export function umbralCaceria(s) {
    return EXPANSION.umbralCacMesa[s.nInv] ?? (s.nInv === 1 ? 3 : D.UMBRAL_CAZA);
}
/** Regla de mesa grande: con 4 investigadores y el vaso, destapar en falso siempre cuesta 2.
 *  (Se probó también que la Cacería alcanzara 5: en el equilibrio no aportaba nada.) */
export const MESA_GRANDE = { costoNada: 2 };
export function mesaGrande(s) {
    return s.nInv === 4 && s.reglas.vaso;
}
/** Lo que pierde quien destapa un «Nada» que era verdad. */
export function costoNada(s) {
    return mesaGrande(s) ? MESA_GRANDE.costoNada : VASO.costoDesafio;
}
function caza(s, m) {
    const q = s.inv[m.asiento];
    if (!q || !q.vivo)
        return;
    if (m.umbral !== null && q.c > m.umbral)
        return;
    if (s.corazon && s.turno.de === "espanto")
        return; // le arrancaron el corazón al Hacha nocturna
    const b = m.bloqueos ?? {};
    s.salvo = null;
    if (q.ruda && !b.ruda) {
        s.salvo = "ruda";
        return log(s, `La ruda protege a ${q.nombre}.`);
    }
    if (!m.devotaVista) {
        log(s, `¡Cacería contra ${q.nombre}!`, "peligro");
        marca(s, { k: "caza", a: q.asiento });
    }
    const par = s.paralizado === q.asiento && s.turno.de === "espanto";
    const opciones = ["ros", "esc", "ult"].filter((x) => !b[x] && q.mano.includes(x) && !(par && x !== "ros"));
    if (!opciones.length && EXPANSION.guardaV3 && !EXPANSION.guardaSoloYo) {
        // Guardaespaldas v3: una vez, cuando cazan a alguien sin defensa (a ti mismo, o a otro en equipo), te pones en medio y pierdes 2.
        const g = vivos(s).find((x) => x.rol === "guardaespaldas" && !x.rolUsado && x.c >= EXPANSION.guardaMin && (x === q || (!cadaQuien(s) && !EXPANSION.guardaSoloYo)));
        if (g) {
            g.rolUsado = true;
            perder(s, g, 2, false);
            log(s, g === q ? `${g.nombre}, el guardaespaldas, aguanta el golpe: pierde 2 de cordura y sigue en pie.` : `${g.nombre}, el guardaespaldas, se pone frente a ${q.nombre}: pierde 2 de cordura y la cacería se detiene.`, "peligro");
            marca(s, { k: "cordura", a: g.asiento, n: -2 });
            return;
        }
    }
    if (!opciones.length && EXPANSION.guardaElige && !m.guardaVista && (cadaQuien(s) || m.devotaVista || !vivos(s).some((x) => x !== q && x.rol === "padre" && x.mano.includes("ros") && !b.ros))) {
        // Guardaespaldas v4: puede ponerse frente a otro cazado sin defensa. Él decide.
        const g = vivos(s).find((x) => x !== q && x.rol === "guardaespaldas" && !x.rolUsado && x.c >= EXPANSION.guardaMin);
        if (g) {
            s.pendiente = { tipo: "guardaOtro", quien: [g.asiento], datos: { objetivo: q.asiento, costo: 2, cordura: g.c, m } };
            return;
        }
    }
    if (!opciones.length && !cadaQuien(s)) {
        // Los testigos: el padre reza por otro; el guardaespaldas se pone en medio.
        // La devota puede rezar por quien no tiene defensa: ella decide.
        const dev = m.devotaVista ? undefined : vivos(s).find((x) => x !== q && x.rol === "padre" && x.mano.includes("ros") && !b.ros);
        if (dev) {
            s.pendiente = { tipo: "devota", quien: [dev.asiento], datos: { objetivo: q.asiento, m } };
            return;
        }
        const g = EXPANSION.guardaV3 ? undefined : vivos(s).find((x) => x !== q && x.rol === "guardaespaldas" && !x.rolUsado && !x.ruda);
        if (g) {
            const alcance = m.umbral === null || g.c <= m.umbral;
            const defG = ["ros", "esc", "ult"].filter((x) => !b[x] && g.mano.includes(x));
            if (!alcance || defG.length) {
                g.rolUsado = true;
                log(s, `${g.nombre}, el guardaespaldas, se pone frente a ${q.nombre}.`, "peligro");
                if (!alcance) {
                    if (EXPANSION.costoGuardaespaldas)
                        perder(s, g, EXPANSION.costoGuardaespaldas, false);
                    log(s, EXPANSION.costoGuardaespaldas ? `${g.nombre} recibe el golpe y pierde ${EXPANSION.costoGuardaespaldas} de cordura.` : `La cacería no alcanza a ${g.nombre}: se disipa.`, "peligro");
                    return;
                }
                return caza(s, { ...m, asiento: g.asiento });
            }
        }
    }
    // El guardaespaldas puede aguantar el golpe (una vez, con 2 o más de cordura).
    const guarda = EXPANSION.guardaV3 && q.rol === "guardaespaldas" && !q.rolUsado && q.c >= EXPANSION.guardaMin;
    s.pendiente = { tipo: "defensa", quien: [q.asiento], datos: { opciones, copalSalva: m.copalSalva && !b.copal, fuente: m.fuente, guarda } };
}
function muerte(s, asiento, fuente) {
    const q = s.inv[asiento];
    if (!q.vivo)
        return;
    q.vivo = false;
    s.descInv.push(...q.mano);
    q.mano = [];
    q.ruda = false;
    q.ultimoTurno = s.nTurno;
    for (const x of s.inv)
        if (x.veladoPor === asiento)
            x.veladoPor = null;
    if (s.muneca === asiento)
        s.muneca = null;
    s.muertes++;
    log(s, `${q.nombre} muere (${fuente}).${cadaQuien(s) ? "" : " Su espíritu sigue en la casona."}`, "muerte");
    marca(s, { k: "muerte", a: q.asiento });
    if (!vivos(s).length)
        return ganar(s, "anima", "Murieron todos los investigadores. El ánima se queda con la casona.", undefined, "todos_muertos", `${quienAnima(s)} ganó acabando con todos los investigadores.`);
    if (s.turno.de === "espanto")
        return; // el Espanto decide la partida; no hace falta revelar
    if (cadaQuien(s)) {
        // En «Sálvese quien pueda» el muerto elige a quién ayudar y el ánima le susurra una evidencia, que comparte con su aliado.
        apilar(s, { k: "elegirAliado", asiento }, { k: "revelarAliado", asiento });
        return;
    }
    s.pendiente = { tipo: "revelar", quien: [ANIMA], datos: { asiento } };
}
// ---------------------------------------------------------------- herramientas y dado
function herramienta(s, m) {
    const q = s.inv[m.asiento];
    if (m.costo)
        q.c = Math.max(0, q.c - m.costo);
    s.pendiente = { tipo: "interferir", quien: [ANIMA], datos: { asiento: m.asiento, ev: m.ev, umbral: m.umbral } };
}
function verdadDelDado(s, v, umbral, ev) {
    return v < umbral ? "nada" : s.animaEv.includes(ev) ? "si" : "no";
}
/** ¿Es la evidencia de una habilidad falsa del ánima? */
function esFalsa(s, ev) {
    return s.habilidades?.falsa === ev || !!s.habExtra?.falsas.includes(ev);
}
function tirarDado(s, m) {
    const ev = m.ev;
    let v = dado(s);
    if (AZAR.modo === "rastro") {
        const extra = s.rastro?.[ev] ?? 0;
        v = Math.min(6, v + extra);
        // Cada «Nada» deja una ficha; una respuesta limpia las fichas de esa evidencia.
        s.rastro ??= {};
        if (v < m.umbral)
            s.rastro[ev] = extra + 1;
        else
            delete s.rastro[ev];
    }
    let verdad = verdadDelDado(s, v, m.umbral, ev);
    const tec = s.inv[m.asiento];
    const tecPuede = EXPANSION.tecnicoCosto ? tec.c >= EXPANSION.tecnicoCosto : !tec.rolUsado;
    if (verdad === "nada" && m.umbral === 4 && !s.reglas.vaso && tec.vivo && tec.rol === "tecnico" && tecPuede && !m.eco) {
        // El técnico decide si gasta su repetición.
        log(s, `${tec.nombre} saca ${v}: la herramienta no detecta nada… por ahora.`, undefined, cadaQuien(s) ? [tec.asiento, ANIMA] : undefined);
        s.pendiente = { tipo: "tecnico", quien: [tec.asiento], datos: { ev, valor: v, umbral: m.umbral, asiento: m.asiento, costo: EXPANSION.tecnicoCosto, cordura: tec.c } };
        return;
    }
    if (s.reglas.vaso) {
        // El dado queda bajo el vaso: solo el ánima lo ve y anuncia.
        const quien = nomTirada(s, m.asiento);
        log(s, `${quien} tira el dado bajo el vaso buscando ${D.EVIDENCIAS[ev]}.`);
        marca(s, { k: "dado", v: 0, r: "oculto", ev, de: m.asiento });
        log(s, `Bajo el vaso hay un ${v}: la verdad es «${palabra(verdad)}».`, "anima", [ANIMA]);
        s.ultimoDado = { valor: v, umbral: m.umbral, ev, resultado: verdad, oculto: true };
        s.pendiente = { tipo: "anunciar", quien: [ANIMA], datos: { repetido: !!m.repetido, valor: v, umbral: m.umbral, ev, verdad, asiento: m.asiento, quedan: Math.max(0, VASO.maxMentiras - (s.mentiras ?? 0)), falsoSi: VASO.falsoSi && esFalsa(s, ev) && verdad !== "si" } };
        return;
    }
    registrarLectura(s, m.asiento, ev, verdad, v, m.umbral);
    detective(s, m.asiento, verdad);
}
/** El detective, al confirmar una evidencia, pregunta por otra (una vez). Se elige la que más divide a las sospechosas. */
function detective(s, asiento, r) {
    const q = s.inv[asiento];
    if (r !== "si" || !q.vivo || q.rol !== "detective" || q.rolUsado)
        return;
    // El detective elige por cuál evidencia pregunta (después de lo que esté pendiente).
    apilar(s, { k: "detective", asiento });
}
function pedirDetective(s, asiento) {
    const q = s.inv[asiento];
    if (!q.vivo || q.rolUsado || s.ganador)
        return;
    const conf = cadaQuien(s) ? q.conf : s.confirmadas, desc = cadaQuien(s) ? q.desc : s.descartadas;
    const validos = [0, 1, 2, 3, 4, 5, 6].filter((e) => !conf.includes(e) && !desc.includes(e));
    if (!validos.length)
        return;
    s.pendiente = { tipo: "detective", quien: [asiento], datos: { validos, conDado: EXPANSION.detectiveDado || (cadaQuien(s) && EXPANSION.detectiveDadoSalvese) } };
}
function responderDetective(s, asiento, mejor) {
    const q = s.inv[asiento];
    q.rolUsado = true;
    if (EXPANSION.detectiveDado || (cadaQuien(s) && EXPANSION.detectiveDadoSalvese)) {
        const v = dado(s);
        if (v < 4) {
            log(s, `${q.nombre}, el detective, pregunta por ${D.EVIDENCIAS[mejor]} y saca ${v}: el ánima no responde.`, "rol");
            marca(s, { k: "rol", de: q.asiento, rol: "detective" });
            return;
        }
    }
    const tiene = s.animaEv.includes(mejor);
    log(s, `${q.nombre}, el detective, le pregunta al ánima por ${D.EVIDENCIAS[mejor]}.`);
    const publico = !cadaQuien(s) || EXPANSION.detectivePublico;
    log(s, `El detective averigua: el ánima ${tiene ? "SÍ" : "NO"} deja ${D.EVIDENCIAS[mejor]}.`, "rol", publico ? undefined : [asiento, ANIMA]);
    marca(s, { k: "rol", de: asiento, rol: "detective", ev: mejor, r: tiene ? "si" : "no" });
    if (publico && cadaQuien(s))
        for (const x of s.inv)
            pistaDeRol(s, x, mejor, tiene);
    else
        pistaDeRol(s, q, mejor, tiene);
}
/** Lo que averigua un rol cuenta como pista, no como evidencia confirmada: un Sí no sirve para completar la acusación; un No sí descarta. */
function pistaDeRol(s, q, ev, tiene) {
    if (cadaQuien(s)) {
        if (tiene)
            q.pistasPriv = [...new Set([...(q.pistasPriv ?? []), ev])];
        else if (!q.desc.includes(ev))
            q.desc.push(ev);
        return;
    }
    if (tiene) {
        if (!s.pistas.some((x) => x.ev === ev && x.fuente === "espiritu"))
            s.pistas.push({ ev, fuente: "espiritu" });
    }
    else if (!s.descartadas.includes(ev))
        s.descartadas.push(ev);
}
function palabra(r) {
    return r === "si" ? "Sí" : r === "no" ? "No" : "Nada";
}
function nomTirada(s, asiento) {
    return s.inv[asiento].vivo ? s.inv[asiento].nombre : `El espíritu de ${s.inv[asiento].nombre}`;
}
/** Anota el resultado de una búsqueda (en «Cada quien», solo para quien tiró). `v` es 0 si el dado no se vio. */
function registrarLectura(s, asiento, ev, r, v, umbral) {
    const quien = nomTirada(s, asiento);
    const visto = v > 0 ? `saca ${v}: ` : "";
    if (!s.reglas.vaso)
        s.ultimoDado = { valor: v, umbral, ev, resultado: r, de: asiento };
    // «Cada quien»: si el número fuera público, un 5 o 6 sin Sí delataría el No. Solo un Sí se anuncia;
    // un No y un Nada se ven igual desde fuera.
    if (cadaQuien(s) && !(CADA_QUIEN.siPublico && r === "si")) {
        const roller = s.inv[asiento];
        const q = !roller.vivo && roller.aliado !== undefined && roller.aliado !== null ? s.inv[roller.aliado] : roller;
        if (r !== "nada") {
            const lista = r === "si" ? q.conf : q.desc;
            if (!lista.includes(ev))
                lista.push(ev);
        }
        else
            s.ultimoNada = { asiento, ev, umbral, nTurno: s.nTurno };
        log(s, `${quien} busca ${D.EVIDENCIAS[ev]}: no hay nada que anunciar. Solo ${q.nombre} sabe qué vio.`, "evidencia");
        marca(s, { k: "dado", v: 0, r: "oculto", ev, de: asiento });
        const det = v > 0 ? `Sacaste ${v}: ` : "";
        log(s, r === "si" ? `${det}¡Sí! ${D.EVIDENCIAS[ev]} está en la casona (solo tú lo sabes).` : r === "no" ? `${det}No: el ánima no deja ${D.EVIDENCIAS[ev]} (solo tú lo sabes).` : `${det}Nada.`, "evidencia", [...new Set([asiento, q.asiento, ANIMA])]);
        marca(s, { k: "dado", v, r, ev, de: asiento });
        return;
    }
    if (r === "nada") {
        s.ultimoNada = { asiento, ev, umbral, nTurno: s.nTurno };
        log(s, `${quien} ${visto || "obtiene "}Nada.`);
        marca(s, { k: "dado", v, r: "nada", ev, de: asiento });
        return;
    }
    if (r === "si" && cadaQuien(s)) {
        for (const x of s.inv)
            if (!x.conf.includes(ev))
                x.conf.push(ev);
        if (!s.confirmadas.includes(ev))
            s.confirmadas.push(ev);
        log(s, `${quien} ${visto}¡Sí! ${D.EVIDENCIAS[ev]} queda confirmada.`, "evidencia");
        marca(s, { k: "dado", v, r, ev, de: asiento });
        // Quien encuentra la prueba puede acusar en ese mismo momento, antes que nadie.
        const q = s.inv[asiento];
        if (q.vivo && q.conf.length >= 2 && s.turno.de === "investigador" && s.turno.asiento === asiento)
            s.pendiente = { tipo: "acusarYa", quien: [asiento] };
        // si lo encontró un aliado desde el más allá, su vivo puede acusar primero
        else if (!q.vivo && q.aliado !== undefined && q.aliado !== null && s.inv[q.aliado].vivo && s.inv[q.aliado].conf.length >= 2 && s.turno.de === "espiritu" && s.turno.asiento === asiento)
            s.pendiente = { tipo: "acusarYa", quien: [q.aliado] };
        return;
    }
    if (r === "si") {
        if (!s.confirmadas.includes(ev))
            s.confirmadas.push(ev);
        log(s, `${quien} ${visto}¡Sí! ${D.EVIDENCIAS[ev]} queda confirmada.`, "evidencia");
    }
    else {
        if (!s.descartadas.includes(ev))
            s.descartadas.push(ev);
        log(s, `${quien} ${visto}No. El ánima no deja ${D.EVIDENCIAS[ev]}.`, "evidencia");
    }
    marca(s, { k: "dado", v, r, ev, de: asiento });
}
// ---------------------------------------------------------------- espíritus
function turnoEspiritu(s, asiento) {
    const q = s.inv[asiento];
    for (const x of s.inv)
        if (x.veladoPor === asiento)
            x.veladoPor = null;
    if (cadaQuien(s) && (q.aliado === undefined || q.aliado === null || !s.inv[q.aliado].vivo))
        return;
    s.pendiente = {
        tipo: "espiritu", quien: [asiento],
        datos: {
            manifestarse: s.mazoInv.length > 0,
            eco: !cadaQuien(s) && !q.ecoUsado && !!s.ultimoNada && s.ultimoNada.nTurno > q.ultimoTurno,
            ...(cadaQuien(s) ? { aliado: q.aliado, soloAliado: true } : {}),
        },
    };
    q.ultimoTurno = s.nTurno;
}
// ---------------------------------------------------------------- el Alba
function albaInicio(s) {
    s.alba = true;
    s.turno = { asiento: ANIMA, de: "alba" };
    log(s, "Se acaba el mazo: despunta el Alba.", "peligro");
    marca(s, { k: "alba" });
    const cualquiera = s.muertes === 0;
    const validos = vivos(s).filter((q) => !q.ruda && (cualquiera || q.c <= D.UMBRAL_CAZA)).map((q) => q.asiento);
    apilar(s, { k: "albaEspanto" });
    s.pendiente = { tipo: "albaCaza", quien: [ANIMA], datos: { validos, cualquiera } };
}
function albaEspanto(s) {
    if (vivos(s).length && cadaQuien(s) && CADA_QUIEN.apuestaFinal)
        return apilar(s, { k: "acusacionFinal" });
    if (!vivos(s).length)
        return ganar(s, "anima", "Murieron todos los investigadores. El ánima se queda con la casona.", undefined, "todos_muertos", `${quienAnima(s)} ganó acabando con todos los investigadores.`);
    if (s.espantoUsado)
        return apilar(s, { k: "acusacionFinal" });
    s.pendiente = { tipo: "albaEspanto", quien: [ANIMA] };
}
function acusacionFinal(s) {
    if (cadaQuien(s) && CADA_QUIEN.apuestaFinal) {
        log(s, "Apuesta final: cada investigador apuesta en secreto a un ánima, aunque no tenga evidencias.", "peligro");
        marca(s, { k: "apuesta" });
        s.pendiente = { tipo: "acusacionFinal", quien: vivos(s).map((q) => q.asiento), resp: {} };
        return;
    }
    if (cadaQuien(s)) {
        const quien = vivos(s).filter((q) => q.conf.length >= 1).map((q) => q.asiento);
        if (!quien.length)
            return ganar(s, "anima", `Llegó el Alba y nadie tiene una evidencia confirmada. Era ${animaDef(s).nombre}: el ánima gana.`, undefined, "alba_sin_evidencia", `${quienAnima(s)} ganó llegando al Alba sin dejar ninguna evidencia confirmada.`);
        s.pendiente = { tipo: "acusacionFinal", quien, resp: {} };
        return;
    }
    if (!s.confirmadas.length)
        return ganar(s, "anima", `Llegó el Alba sin una sola evidencia confirmada. Era ${animaDef(s).nombre}: el ánima gana.`, undefined, "alba_sin_evidencia", `${quienAnima(s)} ganó llegando al Alba sin dejar ninguna evidencia confirmada.`);
    s.pendiente = { tipo: "acusacionFinal", quien: vivos(s).map((q) => q.asiento) };
}
// ---------------------------------------------------------------- el Espanto
function iniciarEspanto(s, objetivo) {
    const a = animaDef(s);
    s.espantoUsado = true;
    s.turno = { asiento: ANIMA, de: "espanto" };
    s.pila.length = 0; // el Espanto decide la partida
    log(s, `¡ESPANTO! El ánima se revela: es ${a.nombre}. ${espDef(s).nombre}.`, "anima");
    marca(s, { k: "espanto", anima: a.id });
    s.paralizado = null;
    s.corazon = false;
    s.salvo = null;
    apilar(s, { k: "espPre", objetivo }, { k: "espCazas" }, { k: "espCadenas" }, { k: "espFin", n0: vivos(s).length });
}
/** El Espanto de esta partida, con las excepciones de Duelo. */
export function espDef(s) {
    return D.espantoDe(animaDef(s), s.nInv);
}
function espantoPre(s, objetivo) {
    const e = espDef(s);
    const V = vivos(s);
    const pre = e.pre;
    const elegido = () => (objetivo !== undefined && s.inv[objetivo]?.vivo ? s.inv[objetivo] : V.reduce((x, y) => (y.c > x.c ? y : x)));
    switch (pre.k) {
        case "todos":
            for (const q of V)
                perder(s, q, pre.n);
            log(s, `Todos pierden ${pre.n} de cordura.`, "peligro");
            return marca(s, { k: "espantoFx", fx: "todos" });
        case "elige": {
            const t = elegido();
            perder(s, t, pre.n);
            log(s, `El ánima elige a ${t.nombre}: pierde ${pre.n} de cordura.`, "peligro");
            return marca(s, { k: "espantoFx", fx: "elige", a: t.asiento });
        }
        case "quedan1":
            for (const q of V)
                descartarAlAzar(s, q, Math.max(0, q.mano.length - 1));
            log(s, "Cada investigador se queda con una sola carta al azar.", "peligro");
            return marca(s, { k: "espantoFx", fx: "manos" });
        case "rosarioOPierde":
            marca(s, { k: "espantoFx", fx: "rezo" });
            for (const q of V) {
                const i = q.mano.indexOf("ros");
                if (i >= 0) {
                    s.descInv.push(q.mano.splice(i, 1)[0]);
                    log(s, `${q.nombre} reza por el ánima: descarta un Rosario.`);
                }
                else {
                    perder(s, q, pre.n);
                    log(s, `${q.nombre} no tiene con qué rezar: pierde ${pre.n} de cordura.`, "peligro");
                }
            }
            return;
        case "porVivo":
            for (const q of V)
                perder(s, q, V.length);
            log(s, `El canto atrae a todos: cada uno pierde ${V.length} de cordura.`, "peligro");
            return marca(s, { k: "espantoFx", fx: "canto" });
        case "paraliza": {
            const t = objetivo !== undefined && s.inv[objetivo]?.vivo ? s.inv[objetivo] : V.reduce((x, y) => (y.c < x.c ? y : x));
            s.paralizado = t.asiento;
            log(s, `La mirada de cabra paraliza a ${t.nombre}: solo podrá defenderse con el Rosario.`, "peligro");
            return marca(s, { k: "espantoFx", fx: "mirada", a: t.asiento });
        }
        case "guardian":
            return apilar(s, ...V.map((q) => ({ k: "guardian", asiento: q.asiento })));
        case "desc1":
            for (const q of V)
                descartarAlAzar(s, q, 1);
            log(s, "El Charro cobra su parte: cada investigador descarta 1 carta al azar.", "peligro");
            return marca(s, { k: "espantoFx", fx: "manos" });
        case "cadenas": {
            if (V.length < 2)
                return;
            const bajo = V.reduce((x, y) => (y.c < x.c ? y : x));
            const alto = V.filter((q) => q !== bajo).reduce((x, y) => (y.c > x.c ? y : x));
            s.cadenas = [bajo.asiento, alto.asiento];
            log(s, `El Cadejo encadena a ${bajo.nombre} con ${alto.nombre}.`, "peligro");
            return marca(s, { k: "espantoFx", fx: "cadenas", a: bajo.asiento, b: alto.asiento });
        }
        case "porCarta":
            for (const q of V)
                perder(s, q, q.mano.length);
            log(s, "Cada investigador pierde 1 de cordura por cada carta en su mano.", "peligro");
            return marca(s, { k: "espantoFx", fx: "tornado" });
        case "izquierda": {
            if (V.length < 2)
                return;
            const manos = V.map((q) => q.mano);
            V.forEach((q, i) => (q.mano = manos[(i - 1 + V.length) % V.length]));
            log(s, "Cada investigador pasa su mano al de su izquierda.", "peligro");
            return marca(s, { k: "espantoFx", fx: "izquierda", lista: V.map((q) => q.asiento) });
        }
        case "descartes": {
            for (const q of V) {
                const n = q.mano.length, nuevas = s.descInv.splice(Math.max(0, s.descInv.length - n), n);
                s.descInv.push(...q.mano);
                q.mano = nuevas;
            }
            log(s, "El barco se lleva tu mano: la cambias por las últimas cartas descartadas.", "peligro");
            return marca(s, { k: "espantoFx", fx: "manos" });
        }
    }
}
function espantoCazas(s) {
    const e = espDef(s);
    if (e.cadena) {
        const lista = vivos(s).filter((q) => q.c <= e.umbral).sort((x, y) => x.c - y.c).map((q) => q.asiento);
        if (lista.length) {
            log(s, "El Tlahuelpuchi vuela del más débil al más fuerte.", "peligro");
            marca(s, { k: "espantoFx", fx: "vuelo", lista });
        }
        return apilar(s, { k: "cadena", lista, umbral: e.umbral, bloqueos: e.bloqueos ?? {}, fuente: e.nombre });
    }
    const V = vivos(s).filter((q) => q.c <= e.umbral);
    if (e.dobleAlAlto && V.length) {
        // Cucuy: el de más cordura entre los cazables recibe una segunda cacería; si hay empate, decide el ánima.
        const max = Math.max(...V.map((q) => q.c));
        const empatados = V.filter((q) => q.c === max).map((q) => q.asiento);
        if (empatados.length > 1) {
            s.pendiente = { tipo: "cucuyDoble", quien: [ANIMA], datos: { validos: empatados } };
            return;
        }
        return apilarCazasEspanto(s, empatados[0]);
    }
    apilarCazasEspanto(s);
}
function apilarCazasEspanto(s, doble) {
    const e = espDef(s);
    const marcos = [];
    const cazables = vivos(s).filter((x) => x.c <= e.umbral || x.oro);
    for (let r = 0; r < (e.rondas ?? 1); r++)
        for (const q of cazables) {
            const m = { k: "caza", asiento: q.asiento, umbral: q.oro ? null : e.umbral, bloqueos: e.bloqueos ?? {}, copalSalva: true, fuente: e.nombre };
            marcos.push(m);
            if (r === 0 && q.asiento === doble)
                marcos.push({ ...m });
        }
    if (doble !== undefined) {
        log(s, `Desde la penumbra, el Cucuy acecha dos veces a ${s.inv[doble].nombre}.`, "peligro");
        marca(s, { k: "espantoFx", fx: "doble", a: doble });
    }
    if (e.rondas === 2 && cazables.length) {
        log(s, "En la encrucijada, las Cihuateteo atacan dos veces.", "peligro");
        marca(s, { k: "espantoFx", fx: "encrucijada" });
    }
    apilar(s, ...marcos);
}
function espantoCadenas(s) {
    if (!s.cadenas)
        return;
    const [a, b] = s.cadenas.map((i) => s.inv[i]);
    if (a.vivo !== b.vivo) {
        const otro = a.vivo ? a : b;
        log(s, `La cadena arrastra también a ${otro.nombre}.`, "peligro");
        marca(s, { k: "espantoFx", fx: "arrastre", a: otro.asiento });
        muerte(s, otro.asiento, "Arrastre de cadenas");
    }
}
function espantoFin(s, n0) {
    if (s.ganador)
        return;
    const vivosAhora = vivos(s).length;
    const gana = n0 >= 3 ? vivosAhora <= 1 : vivosAhora === 0;
    if (s.apuestas) {
        // Apuesta final: gana quien acertó y sigue en pie.
        const g = vivos(s).filter((q) => s.apuestas[q.asiento] === s.anima).map((q) => q.asiento);
        if (!g.length)
            return ganar(s, "anima", `El Espanto de ${animaDef(s).nombre} alcanzó a todos los que acertaron. El ánima gana.`, undefined, "espanto", `${quienAnima(s)} ganó con su Espanto en el Alba.`);
        return ganar(s, "investigadores", `${g.map((x) => nom(s, x)).join(" y ")} ${g.length > 1 ? "acertaron y sobrevivieron" : "acertó y sobrevivió"} al Espanto: era ${animaDef(s).nombre}.`, g, "acusacion_alba", `${g.map((x) => nom(s, x)).join(" y ")} ${g.length > 1 ? "ganaron" : "ganó"} acertando la apuesta final y sobreviviendo al Espanto.`);
    }
    if (gana)
        return ganar(s, "anima", `El Espanto de ${animaDef(s).nombre} deja ${vivosAhora === 0 ? "a todos muertos" : "a un solo investigador en pie"}. El ánima gana.`, undefined, "espanto", `${quienAnima(s)} ganó desatando su Espanto, ${espDef(s).nombre}.`);
    if (cadaQuien(s)) {
        // El ánima quedó expuesta: gana quien más evidencias confirmó por su cuenta (desempata la cordura).
        const V = vivos(s);
        const mejor = (q) => q.conf.length * 100 + q.c;
        const top = Math.max(...V.map(mejor));
        const g = V.filter((q) => mejor(q) === top).map((q) => q.asiento);
        return ganar(s, "investigadores", `El ánima (${animaDef(s).nombre}) quedó expuesta. Gana ${g.map((x) => nom(s, x)).join(" y ")}, quien más evidencias confirmó.`, g, "espanto_falla", `${g.map((x) => nom(s, x)).join(" y ")} ${g.length > 1 ? "ganaron" : "ganó"} sobreviviendo al Espanto con más evidencias confirmadas que nadie.`);
    }
    ganar(s, "investigadores", `${vivosAhora === 1 ? "Sobrevive 1 investigador" : `Sobreviven ${vivosAhora} investigadores`} al Espanto. El ánima (${animaDef(s).nombre}) quedó expuesta: ganan los investigadores.`, undefined, "espanto_falla", `Los investigadores ganaron sobreviviendo al Espanto de ${animaDef(s).nombre}.`);
}
// ---------------------------------------------------------------- vistas
/** Lo que puede ver un jugador: la red solo debe transmitir esto. */
export function vistaPara(s, quien) {
    const fin = !!s.ganador;
    const revelada = fin || s.espantoUsado;
    const esAnima = quien === ANIMA;
    return {
        yo: quien,
        nInv: s.nInv,
        anima: esAnima || revelada ? s.anima : null,
        animaEv: esAnima || fin ? s.animaEv : null,
        habilidades: esAnima || fin ? s.habilidades : null,
        /** Cuántas habilidades extra hay en el mazo del ánima (dato público). */
        habExtraN: (s.habExtra?.verdaderas.length ?? 0) + (s.habExtra?.falsas.length ?? 0),
        umbralCac: umbralCaceria(s),
        costoNada: costoNada(s),
        mesaGrande: mesaGrande(s),
        reglas: s.reglas,
        ganadores: s.ganadores ?? null,
        via: s.ganador ? s.via ?? null : null,
        logro: s.ganador ? s.logro ?? null : null,
        lecturas: s.lecturas,
        inv: s.inv.map((q) => ({
            asiento: q.asiento, nombre: q.nombre, c: q.c, vivo: q.vivo, ruda: q.ruda, fuera: q.fuera, aliado: q.aliado ?? null,
            conf: !cadaQuien(s) || q.asiento === quien || esAnima || fin ? q.conf : null,
            desc: !cadaQuien(s) || q.asiento === quien || esAnima || fin ? q.desc : null,
            sinHerramientas: q.sinHerramientas, veladoPor: q.veladoPor, ecoUsado: q.ecoUsado,
            nMano: q.mano.length,
            mano: q.asiento === quien || fin ? q.mano : null,
            sabe: q.asiento === quien || esAnima || fin ? q.sabe : null,
            rol: q.rol ?? null, rolUsado: !!q.rolUsado,
        })),
        muneca: s.muneca ?? null,
        pentagrama: s.pentagrama ?? 0,
        nMazoInv: s.mazoInv.length,
        // Cartas de lectura que quedan por salir (públicas, salvo bajo el vaso).
        lecturaQuedan: s.reglas.lectura === "cartas" && !s.reglas.vaso ? [...(s.bolsa?.length ? s.bolsa : [1, 2, 3, 4, 5, 6])].sort() : null,
        cadenas: s.cadenas ?? null,
        animaCastigada: s.animaCastigada ?? 0,
        descInv: s.descInv,
        nMazoAnima: s.mazoAnima.length,
        nDescAnima: s.descAnima.length,
        manoAnima: esAnima || fin ? s.manoAnima : null,
        nManoAnima: s.manoAnima.length,
        confirmadas: cadaQuien(s) ? (quien >= 0 ? s.inv[quien].conf : quien === ANIMA ? masAvanzado(s).conf : publicas(s, "conf")) : s.confirmadas,
        descartadas: cadaQuien(s) ? (quien >= 0 ? s.inv[quien].desc : quien === ANIMA ? masAvanzado(s).desc : publicas(s, "desc")) : s.descartadas,
        pistas: quien >= 0 && s.inv[quien].pistasPriv?.length ? [...s.pistas, ...s.inv[quien].pistasPriv.filter((e) => !s.pistas.some((x) => x.ev === e && x.fuente === "espiritu")).map((ev) => ({ ev, fuente: "espiritu" }))] : s.pistas,
        aliadosGanadores: s.ganador ? s.aliadosGanadores ?? [] : [],
        preguntas: s.preguntas,
        turno: s.turno,
        nTurno: s.nTurno,
        muertes: s.muertes,
        espantoUsado: s.espantoUsado,
        alba: s.alba,
        ultimoNada: s.ultimoNada,
        ultimoDado: dadoVisible(s, quien),
        pendiente: s.pendiente ? { tipo: s.pendiente.tipo, quien: s.pendiente.quien, datos: pendientePublico(s, quien), yaRespondio: s.pendiente.resp ? quien in s.pendiente.resp : undefined } : null,
        bitacora: s.bitacora.filter((e) => !e.para || e.para.includes(quien) || fin),
        ganador: s.ganador,
        motivo: s.motivo,
        acusacion: s.acusacion ?? null,
    };
}
/** En «Cada quien», el ánima ve el bloc del investigador más avanzado (para saber si ya puede desatar su Espanto). */
function masAvanzado(s) {
    const V = vivos(s).length ? vivos(s) : s.inv;
    return V.reduce((x, y) => (y.conf.length > x.conf.length ? y : x));
}
/** Sálvese quien pueda: lo que todos saben (está en la lista de cada investigador). */
function publicas(s, k) {
    const [p, ...r] = s.inv;
    return p ? p[k].filter((e) => r.every((q) => q[k].includes(e))) : [];
}
function dadoVisible(s, quien) {
    const u = s.ultimoDado;
    if (!u)
        return null;
    if (u.oculto && quien !== ANIMA && !s.ganador)
        return { ...u, valor: 0, resultado: s.pendiente?.tipo === "anunciar" ? null : u.resultado };
    // «Cada quien»: el dado de otro solo se ve si salió Sí.
    if (cadaQuien(s) && quien !== ANIMA && !s.ganador && u.de !== undefined && u.de !== quien && u.resultado !== "si")
        return { ...u, valor: 0, resultado: null, oculto: true };
    return u;
}
function pendientePublico(s, quien) {
    const p = s.pendiente;
    // El copal es público; los demás detalles solo los ve quien decide.
    if (p.tipo === "copal")
        return { motivo: p.datos.motivo, objetivo: p.datos.objetivo, devota: p.datos.devota ?? null };
    if (!p.quien.includes(quien))
        return undefined;
    return p.datos;
}
/** Solo para pruebas. */
export const _pruebas = { caza };
