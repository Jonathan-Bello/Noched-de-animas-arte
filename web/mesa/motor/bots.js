// Bots para Noche de Ánimas. Solo leen la vista del jugador (vistaPara), nunca
// el estado completo: así juegan con la misma información que una persona.
// Las heurísticas vienen del simulador Python (sim/sim.py).
import * as D from "./data.js";
import { ANIMA } from "./engine.js";
export function azarConSemilla(semilla) {
    let a = semilla | 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const elegir = (r, a) => a[Math.floor(r() * a.length)];
const DEF = new Set(["ros", "esc", "ult", "copal"]);
const RIESGO = 4;
// ---------------------------------------------------------------- deducción
/** Parámetros de estrategia de los bots en el modo vaso (el simulador los ajusta). */
// Valores cercanos al equilibrio medido (docs/vaso-equilibrio.md).
/** Cordura con la que el bot técnico quiere quedarse tras pagar la repetición. */
/** Cordura con la que el bot guardaespaldas quiere quedarse tras proteger a otro. */
/** Cómo juega el bot a la Devota: activa = usa cada Rosario como copal en cuanto puede. */
export const DEVOTA_BOT = { activa: true };
export const GUARDA_BOT = { minimoTras: 5, protegerse: true };
export const TECNICO_BOT = { minimoTras: 5 };
export const ESTRATEGIA = { mentir: 0.45, desafiar: 0.8, falsoSi: 0.2, desafiarSi: 0.75 };
function compatibles(conf, desc, seguras) {
    const req = [...new Set([...conf, ...seguras])];
    return D.ANIMAS.filter((a) => req.every((e) => a.ev.includes(e)) && !desc.some((e) => a.ev.includes(e)));
}
/** Lecturas anunciadas bajo el vaso que nadie verificó y que forman parte de mi bloc. */
function dudosas(v) {
    if (!v.reglas?.vaso)
        return [];
    return (v.lecturas ?? []).filter((l) => !l.verificada && l.dicho !== "nada" && (l.dicho === "si" ? v.confirmadas : v.descartadas).includes(l.ev)
        && !(v.lecturas ?? []).some((x) => x.verificada && x.ev === l.ev));
}
/** Ánimas compatibles con lo confirmado, lo descartado y las pistas seguras de los espíritus.
 *  En el modo vaso, si algo no cuadra, sospecha de una lectura que nadie verificó. */
export function candidatas(v) {
    const seguras = v.pistas.filter((p) => p.fuente === "espiritu").map((p) => p.ev);
    const c = compatibles(v.confirmadas, v.descartadas, seguras);
    if (c.length)
        return c;
    const out = new Map();
    for (const l of dudosas(v)) {
        const conf = l.dicho === "si" ? v.confirmadas.filter((e) => e !== l.ev) : v.confirmadas;
        const desc = l.dicho === "no" ? v.descartadas.filter((e) => e !== l.ev) : v.descartadas;
        for (const a of compatibles(conf, desc, seguras))
            out.set(a.id, a);
    }
    return [...out.values()];
}
function utilesParaBuscar(v, c) {
    const conf = v.confirmadas.length;
    const pistas = new Set(v.pistas.map((p) => p.ev));
    const cnt = (e) => c.filter((a) => a.ev.includes(e)).length;
    const out = [];
    for (let e = 0; e <= 6; e = (e + 1)) {
        if (v.confirmadas.includes(e) || v.descartadas.includes(e))
            continue;
        const k = cnt(e);
        if (pistas.has(e) || (k > 0 && k < c.length) || (c.length && k === c.length && conf < 2))
            out.push(e);
    }
    return out.sort((x, y) => Number(!(pistas.has(x) || cnt(x) === c.length)) - Number(!(pistas.has(y) || cnt(y) === c.length)));
}
/** Evidencias que podría conocer un espíritu, según las preguntas que ya respondió. */
export function posiblesDelEspiritu(v, asiento) {
    let S = new Set(candidatas(v).flatMap((a) => a.ev));
    for (const p of v.preguntas) {
        if (p.espiritu !== asiento || !p.evs || !p.respuesta)
            continue;
        if (p.respuesta === "si")
            S = new Set([...S].filter((e) => p.evs.includes(e)));
        if (p.respuesta === "no")
            S = new Set([...S].filter((e) => !p.evs.includes(e)));
    }
    return [...S];
}
// ---------------------------------------------------------------- estimación del Espanto
/** Probabilidad estimada de que el Espanto deje como máximo a 1 investigador en pie (2 o más: todos muertos con 2).
 *  Solo usa lo que el ánima ve: cordura, número de cartas y qué defensas anula su Espanto. */
const FACTOR_DEF = 1.5; // los investigadores guardan defensas: en mano abundan más que en el mazo
function probEspanto(v, anima, objetivo) {
    const e = D.espantoDe(anima, v.nInv);
    const V = v.inv.filter((q) => q.vivo).map((q) => ({ ...q, h: q.nMano, oro: false }));
    const n0 = V.length, permitidos = n0 >= 3 ? 1 : 0;
    const pre = e.pre;
    const t = V.find((q) => q.asiento === objetivo);
    if (pre.k === "todos")
        V.forEach((q) => (q.c -= pre.n));
    if (pre.k === "elige" && t)
        t.c -= pre.n;
    if (pre.k === "porCarta")
        V.forEach((q) => (q.c -= Math.max(0, q.h)));
    if (pre.k === "porVivo")
        V.forEach((q) => (q.c -= n0));
    if (pre.k === "quedan1")
        V.forEach((q) => (q.h = Math.min(q.h, 1)));
    if (pre.k === "desc1")
        V.forEach((q) => (q.h = Math.max(0, q.h - 1)));
    if (pre.k === "rosarioOPierde")
        V.forEach((q) => { const pr = 1 - Math.pow(41 / 48, Math.max(0, q.h)); q.c -= 3 * (1 - pr); q.h -= pr; });
    if (pre.k === "paraliza" && t)
        t.h = t.h * 0.5;
    if (pre.k === "guardian")
        V.forEach((q) => { if (q.c > e.umbral && q.h >= 2)
            q.h -= 2;
        else
            q.oro = true; });
    const b = e.bloqueos ?? {};
    const f = Math.min(0.9, FACTOR_DEF * ((b.ros ? 0 : 7) + (b.esc ? 0 : 3) + (b.ult ? 0 : 2) + (b.copal ? 0 : 2)) / 48);
    const enRango = V.filter((q) => (q.c <= e.umbral || q.oro) && (!q.ruda || b.ruda));
    const alto = e.dobleAlAlto && enRango.length ? enRango.reduce((x, y) => (y.c > x.c ? y : x)) : null;
    const ps = V.map((q) => {
        if (!enRango.includes(q))
            return 1;
        const h = Math.max(0, q.h);
        const p1 = 1 - Math.pow(1 - f, h);
        const p2 = h >= 2 ? 1 - Math.pow(1 - f, h) - h * f * Math.pow(1 - f, h - 1) : 0;
        return e.rondas === 2 || q === alto ? p2 : p1;
    });
    if (pre.k === "cadenas" && V.length >= 2) {
        const lo = V.reduce((x, y) => (y.c < x.c ? y : x)), hi = V.filter((q) => q !== lo).reduce((x, y) => (y.c > x.c ? y : x));
        const i = V.indexOf(lo), j = V.indexOf(hi), ambos = ps[i] * ps[j];
        ps[i] = ambos;
        ps[j] = ambos;
    }
    let corazon = 1;
    if (e.corazon)
        for (const q of enRango)
            corazon *= Math.pow(46 / 48, Math.max(0, q.h) * FACTOR_DEF);
    let dist = [1];
    for (const p of ps) {
        const nd = new Array(dist.length + 1).fill(0);
        dist.forEach((x, k) => { nd[k] += x * (1 - p); nd[k + 1] += x * p; });
        dist = nd;
    }
    return corazon * dist.slice(0, permitidos + 1).reduce((a, x) => a + x, 0);
}
/** ¿Desata el Espanto? Cuanto más cerca están de acusarla bien, menos seguridad le exige. */
function convieneEspanto(v, anima, objetivo, alba = false) {
    const p = probEspanto(v, anima, objetivo);
    const c = candidatas(v).length;
    const exigir = alba ? 0.35 : c <= 1 ? 0.15 : c <= 3 ? 0.4 : 0.6;
    return p >= exigir;
}
/** A quién apunta el Espanto cuando pide elegir a alguien. */
function objetivoEspanto(v, r) {
    const libres = v.inv.filter((q) => q.vivo && !q.ruda);
    if (!libres.length)
        return undefined;
    const e = D.espantoDe(D.ANIMA_POR_ID[v.anima], v.nInv);
    if (e.pre.k === "paraliza") {
        const r2 = libres.filter((q) => q.c <= e.umbral);
        if (r2.length)
            return maxAzar(r, r2, (q) => q.nMano).asiento;
    }
    if (e.pre.k === "elige") {
        // al que quede justo dentro del alcance: el de menor cordura que todavía está fuera
        const fuera = libres.filter((q) => q.c > e.umbral);
        if (fuera.length)
            return minAzar(r, fuera, (q) => q.c).asiento;
    }
    return maxAzar(r, libres, (q) => q.c).asiento;
}
// ---------------------------------------------------------------- decisión
/** Empates al azar: sin esto el bot siempre escogía al primer asiento, que en la demo suele ser el humano. */
function minAzar(r, l, f) {
    const m = Math.min(...l.map(f));
    return elegir(r, l.filter((x) => f(x) === m));
}
function maxAzar(r, l, f) {
    return minAzar(r, l, (x) => -f(x));
}
export function decidir(v, r) {
    const p = v.pendiente;
    const yo = v.yo;
    const vivos = v.inv.filter((q) => q.vivo);
    const mio = yo >= 0 ? v.inv[yo] : null;
    switch (p.tipo) {
        case "habilidades":
            return { quien: yo, tipo: "habilidades", verdadera: elegir(r, p.datos.propias), falsa: elegir(r, p.datos.ajenas) };
        case "investigador": return turnoInvestigador(v, r);
        case "anima": return turnoAnima(v, r);
        case "copal": {
            if (!mio?.mano?.includes("copal")) {
                // La devota puede alzar su Rosario como copal.
                const m = p.datos?.motivo;
                const dev = p.datos?.devota === yo && mio?.mano?.includes("ros") && mio.c > 4 && ["caceria", "caceria_total", "habilidad", "manifestacion", "posesion", "muneca"].includes(m)
                    && (v.reglas?.modo !== "cadaQuien" || p.datos?.objetivo === yo || m === "caceria_total");
                // La devota juega activa: alza su Rosario como copal contra cualquier carta del ánima
                // (en Sálvese, solo si la carta la toca a ella o a todos). Medido: así rinde más que guardándolo.
                if (DEVOTA_BOT.activa && p.datos?.devota === yo && mio?.mano?.includes("ros")) {
                    const mia = v.reglas?.modo !== "cadaQuien" || p.datos?.objetivo === yo || p.datos?.objetivo === undefined || m === "interferencia";
                    return { quien: yo, tipo: "copal", usar: mia };
                }
                return { quien: yo, tipo: "copal", usar: !!dev };
            }
            const m = p.datos?.motivo;
            if (v.reglas?.modo === "cadaQuien") {
                // Por su cuenta: solo quema copal si el golpe es para él.
                const paraMi = p.datos?.objetivo === yo || (m === "caceria_total" && mio.c <= 4) || (m === "habilidad" && mio.c <= 6);
                return { quien: yo, tipo: "copal", usar: !!paraMi && m !== "interferencia" };
            }
            const usar = m === "salvar" || m === "caceria" || m === "caceria_total" || (m === "habilidad" && vivos.some((q) => q.c <= 6));
            return { quien: yo, tipo: "copal", usar };
        }
        case "defensa": {
            const op = p.datos.opciones;
            // Contra el Hacha nocturna, un Ultraje salva a toda la mesa.
            const orden = p.datos.fuente === "Hacha nocturna" && vivos.length >= 2 ? ["ult", "ros", "esc"] : ["ros", "ult", "esc"];
            const con = orden.find((x) => op.includes(x)) ?? (p.datos.guarda && GUARDA_BOT.protegerse ? "guarda" : null);
            return { quien: yo, tipo: "defensa", con };
        }
        case "detective": {
            // Pregunta por la evidencia que más divide a las sospechosas.
            const c = candidatas(v);
            const vals = p.datos.validos;
            return { quien: yo, tipo: "detective", ev: maxAzar(r, vals, (e) => { const k = c.filter((a) => a.ev.includes(e)).length; return Math.min(k, c.length - k); }) };
        }
        case "vigia": {
            const orden = mio.mano.map((c, i) => [valorBot(v, c), i]).sort((x, y) => x[0] - y[0]);
            return { quien: yo, tipo: "vigia", cartas: orden.slice(0, p.datos.n).map((x) => x[1]) };
        }
        case "vigiaGuarda": {
            const orden = mio.mano.map((c, i) => [valorBot(v, c), i]).sort((x, y) => y[0] - x[0]);
            return { quien: yo, tipo: "vigiaGuarda", carta: orden[0][1] };
        }
        case "guardaOtro": {
            // Protege a otro si después sigue fuera del alcance de una cacería.
            const d = p.datos;
            return { quien: yo, tipo: "guardaOtro", usar: d.cordura - d.costo >= GUARDA_BOT.minimoTras };
        }
        case "devota": {
            // Reza por otro solo en equipo y si le sobra una defensa o está lejos del peligro.
            const defs = mio.mano.filter((c) => ["ros", "esc", "ult"].includes(c)).length;
            return { quien: yo, tipo: "devota", usar: v.reglas?.modo !== "cadaQuien" && (mio.c > 6 || defs >= 2) };
        }
        case "tecnico": {
            // Repetir cuesta cordura: solo si después sigue fuera del alcance de una cacería.
            const d = p.datos;
            return { quien: yo, tipo: "tecnico", usar: !d.costo || d.cordura - d.costo >= TECNICO_BOT.minimoTras };
        }
        case "interferir":
            return { quien: yo, tipo: "interferir", usar: v.manoAnima.includes("interferencia") };
        case "revelar": {
            const ya = v.animaEv.filter((e) => v.confirmadas.includes(e));
            return { quien: yo, tipo: "revelar", ev: ya.length ? elegir(r, ya) : elegir(r, v.animaEv) };
        }
        case "anunciar": {
            // El ánima mira bajo el vaso: miente con probabilidad ESTRATEGIA.mentir.
            const d = p.datos;
            const verdad = d.verdad;
            if (verdad !== "si" && d.falsoSi && d.quedan > 0 && r() < ESTRATEGIA.falsoSi)
                return { quien: yo, tipo: "anunciar", dicho: "si" };
            if (verdad !== "no" || d.quedan <= 0 || r() >= ESTRATEGIA.mentir)
                return { quien: yo, tipo: "anunciar", dicho: verdad };
            return { quien: yo, tipo: "anunciar", dicho: "nada" }; // oculta el No
        }
        case "desafio": {
            const d = p.datos;
            if (!mio?.vivo || mio.c <= 2)
                return { quien: yo, tipo: "desafio", desafiar: false };
            // En «Cada quien» solo le importa a quien tiró.
            if (v.reglas?.modo === "cadaQuien" && d.asiento !== yo)
                return { quien: yo, tipo: "desafio", desafiar: false };
            // Si el anuncio contradice lo que ya sé, desconfío casi siempre.
            const conf = d.dicho === "si" ? [...v.confirmadas, d.ev] : v.confirmadas;
            const desc = d.dicho === "no" ? [...v.descartadas, d.ev] : v.descartadas;
            const seguras = v.pistas.filter((x) => x.fuente === "espiritu").map((x) => x.ev);
            if (d.dicho !== "nada" && !compatibles(conf, desc, seguras).length)
                return { quien: yo, tipo: "desafio", desafiar: r() < 0.9 };
            if (d.dicho === "si") {
                // Solo la habilidad falsa puede dar un Sí falso: si ya salieron las dos habilidades y esta no es una, es verdad.
                const hab = v.pistas.filter((x) => x.fuente === "habilidad").map((x) => x.ev);
                if (hab.length >= 2 + (v.habExtraN ?? 0) && !hab.includes(d.ev))
                    return { quien: yo, tipo: "desafio", desafiar: false };
            }
            const n = p.quien.length;
            const base = d.dicho === "si" ? ESTRATEGIA.desafiarSi : ESTRATEGIA.desafiar;
            const q = 1 - Math.pow(1 - base, 1 / n);
            return { quien: yo, tipo: "desafio", desafiar: r() < q };
        }
        case "rol": {
            // Elige al azar entre sus opciones, para que la mesa sea variada.
            const ops = p.datos.opciones[yo];
            return { quien: yo, tipo: "rol", rol: elegir(r, ops) };
        }
        case "espejo": return { quien: yo, tipo: "espejo" };
        case "tarot": {
            // Dice la evidencia que menos ayuda: la que menos sospechosas descarta.
            const c = candidatas(v);
            const vals = p.datos.validos;
            return { quien: yo, tipo: "tarot", ev: minAzar(r, vals, (e) => c.filter((a) => a.ev.includes(e)).length) };
        }
        case "aliado": {
            // Apuesta por quien más cerca está de ganar: más evidencias, luego más cordura.
            const vals = p.datos.validos;
            return { quien: yo, tipo: "aliado", objetivo: maxAzar(r, vals, (x) => (v.inv[x].conf?.length ?? 0) * 20 + v.inv[x].c) };
        }
        case "acusarYa": {
            // Encontró la prueba: acusa si la deducción ya apunta a una sola ánima (o a pocas con el Alba cerca).
            const c = candidatas(v);
            if (c.length === 1)
                return { quien: yo, tipo: "acusarYa", anima: c[0].id };
            const vivos2 = v.inv.filter((q) => q.vivo).length;
            if (v.nMazoInv < vivos2 && c.length <= 3 && c.length > 0)
                return { quien: yo, tipo: "acusarYa", anima: elegir(r, c).id };
            return { quien: yo, tipo: "acusarYa", anima: null };
        }
        case "objetivoHabilidad": {
            const vals = p.datos.validos;
            return { quien: yo, tipo: "objetivo", objetivo: minAzar(r, vals, (x) => v.inv[x].c) };
        }
        case "espiritu": {
            if (p.datos?.soloAliado) {
                if (p.datos.manifestarse && r() < 0.6)
                    return { quien: yo, tipo: "manifestarse" };
                return { quien: yo, tipo: "velar", objetivo: p.datos.aliado };
            }
            const sabe = mio.sabe;
            const yaSabido = sabe === null || v.confirmadas.includes(sabe) || v.pistas.some((x) => x.ev === sabe && x.fuente === "espiritu");
            if (!yaSabido)
                return { quien: yo, tipo: "responder" };
            if (p.datos.eco)
                return { quien: yo, tipo: "eco" };
            if (p.datos.manifestarse)
                return { quien: yo, tipo: "manifestarse" };
            return { quien: yo, tipo: "responder" };
        }
        case "pregunta": {
            const esp = p.datos.espiritu;
            const S = posiblesDelEspiritu(v, esp).sort((a, b) => Number(v.confirmadas.includes(a)) - Number(v.confirmadas.includes(b)));
            const evs = S.length <= 2 ? S.slice(0, 1) : S.slice(0, Math.ceil(S.length / 2));
            const texto = evs.length ? `¿Tu evidencia es ${evs.map((e) => D.EVIDENCIAS[e]).join(" o ")}?` : "¿Sigues aquí?";
            return { quien: yo, tipo: "pregunta", texto, evs };
        }
        case "respuesta": {
            const pr = v.preguntas[v.preguntas.length - 1];
            const sabe = mio.sabe;
            if (!pr.evs || sabe === null)
                return { quien: yo, tipo: "respuesta", valor: "talvez" };
            return { quien: yo, tipo: "respuesta", valor: pr.evs.includes(sabe) ? "si" : "no" };
        }
        case "kitEspiritu": {
            const u = utilesParaBuscar(v, candidatas(v));
            return { quien: yo, tipo: "kitEspiritu", ev: u.length ? u[0] : elegir(r, [0, 1, 2, 3, 4, 5, 6]) };
        }
        case "albaCaza": {
            const vals = p.datos.validos;
            if (!vals.length)
                return { quien: yo, tipo: "albaCaza", objetivo: null };
            return { quien: yo, tipo: "albaCaza", objetivo: minAzar(r, vals, (x) => v.inv[x].c) };
        }
        case "albaEspanto": {
            const a = D.ANIMA_POR_ID[v.anima];
            const obj = objetivoEspanto(v, r);
            // Apuesta final: si alguien acertó, el Espanto es la última oportunidad del ánima.
            if (p.datos?.aciertan)
                return { quien: yo, tipo: "albaEspanto", usar: true, objetivo: p.datos.aciertan[0] };
            return { quien: yo, tipo: "albaEspanto", usar: convieneEspanto(v, a, obj, true), objetivo: obj };
        }
        case "acusacionFinal": {
            let c = candidatas(v);
            const h = v.pistas.filter((x) => x.fuente === "habilidad").map((x) => x.ev);
            const conH = c.filter((a) => h.some((e) => a.ev.includes(e)));
            if (conH.length)
                c = conH;
            return { quien: yo, tipo: "acusar", anima: elegir(r, c.length ? c : D.ANIMAS).id };
        }
        case "cucuyDoble": {
            // El ánima elige al empatado con menos defensas a la vista: el que tenga menos cartas.
            const vals = p.datos.validos;
            return { quien: yo, tipo: "cucuyDoble", objetivo: vals.reduce((x, y) => (v.inv[y].nMano < v.inv[x].nMano ? y : x)) };
        }
        case "guardian": {
            // Con una defensa en la mano conviene quedarse el oro (cuesta 1 carta, no 2);
            // al alcance, quedárselo no cuesta nada. Sin defensa y fuera de alcance, se devuelve.
            const q = mio;
            const e = D.espantoDe(D.ANIMA_POR_ID["guardian"], v.nInv);
            const tieneDef = q.mano.some((c) => ["ros", "esc", "ult"].includes(c));
            if (q.c <= e.umbral || tieneDef || q.mano.length < 2)
                return { quien: yo, tipo: "guardian", eleccion: "quedarse" };
            const orden = q.mano.map((c, i) => [c, i]).sort((x, y) => Number(DEF.has(x[0])) - Number(DEF.has(y[0])));
            return { quien: yo, tipo: "guardian", eleccion: "descartar", cartas: [orden[0][1], orden[1][1]] };
        }
    }
    throw new Error("El bot no sabe decidir: " + p.tipo);
}
function turnoInvestigador(v, r) {
    const yo = v.yo;
    const q = v.inv[yo];
    const h = q.mano;
    const vivos = v.inv.filter((x) => x.vivo);
    const c = candidatas(v);
    const conf = v.confirmadas.length;
    if (conf >= 2 && c.length === 1)
        return { quien: yo, tipo: "acusar", anima: c[0].id };
    if (conf >= 2 && v.nMazoInv < vivos.length && c.length <= 3 && c.length > 0)
        return { quien: yo, tipo: "acusar", anima: elegir(r, c).id };
    const utiles = utilesParaBuscar(v, c);
    const idx = (x) => h.indexOf(x);
    const herr = h.map((x, i) => [x, i]).filter(([x]) => D.isTool(x) && utiles.includes(D.toolEv(x)))
        .sort((a, b) => utiles.indexOf(D.toolEv(a[0])) - utiles.indexOf(D.toolEv(b[0])));
    const puedeBuscar = !q.sinHerramientas && q.c >= 1;
    const jugar = (i, extra = {}) => ({ quien: yo, tipo: "jugar", carta: i, ...extra });
    if (q.c <= 3 && idx("te") >= 0)
        return jugar(idx("te"));
    if (q.c <= 3 && idx("ruda") >= 0)
        return jugar(idx("ruda"));
    if (q.c <= 3 && idx("resp") >= 0)
        return jugar(idx("resp"));
    const obj = objetoBot(v, r, q, h, c);
    if (obj)
        return obj;
    if (herr.length && puedeBuscar && q.c > RIESGO)
        return jugar(herr[0][1]);
    if (idx("kit") >= 0 && utiles.length && puedeBuscar && q.c > RIESGO)
        return jugar(idx("kit"), { ev: utiles[0] });
    if (q.rol === "curandera" && idx("te") >= 0 && v.reglas?.modo !== "cadaQuien") {
        const t = vivos.filter((x) => x.asiento !== yo && x.c <= 4 && x.c < q.c);
        if (t.length)
            return jugar(idx("te"), { objetivo: minAzar(r, t, (x) => x.c).asiento });
    }
    if (q.c < 7 && idx("te") >= 0)
        return jugar(idx("te"));
    if (q.c < 8 && idx("resp") >= 0)
        return jugar(idx("resp"));
    if (herr.length && puedeBuscar)
        return jugar(herr[0][1]);
    const basura = h.map((x, i) => [x, i]).filter(([x]) => !DEF.has(x) && x !== "kit" && !(D.isTool(x) && utiles.includes(D.toolEv(x))))
        .sort((a, b) => Number(!D.isTool(a[0])) - Number(!D.isTool(b[0])));
    if (q.rol === "improvisador" && puedeBuscar && q.c > RIESGO && utiles.length && basura.length === 1) {
        return { quien: yo, tipo: "improvisar", cartas: [basura[0][1]], ev: utiles[0] };
    }
    if (puedeBuscar && q.c > RIESGO && utiles.length && basura.length >= 2) {
        return { quien: yo, tipo: "improvisar", cartas: [basura[0][1], basura[1][1]], ev: utiles[0] };
    }
    const pref = h.map((x, i) => [x, i]);
    const tirar = pref.find(([x]) => D.isTool(x)) ?? pref.find(([x]) => !DEF.has(x)) ?? pref[0];
    return { quien: yo, tipo: "descartar", cartas: [tirar[1]] };
}
/** Cuándo usa un bot investigador un Objeto maldito. */
function objetoBot(v, r, q, h, c) {
    const yo = v.yo;
    const equipo = v.reglas?.modo !== "cadaQuien";
    const vivos = v.inv.filter((x) => x.vivo);
    const muertos = v.inv.filter((x) => !x.vivo && !x.fuera);
    const k = (x) => h.indexOf(x);
    const j = (i, extra = {}) => ({ quien: yo, tipo: "jugar", carta: i, ...extra });
    if (k("limpia") >= 0 && (v.muneca !== null && v.muneca !== undefined || v.pentagrama || vivos.reduce((a, x) => a + Math.min(2, 10 - x.c), 0) >= 4))
        return j(k("limpia"));
    if (k("tarot") >= 0 && c.length > 1)
        return j(k("tarot"));
    if (k("tablilla") >= 0 && equipo) {
        // No sabe qué le mostraron al espíritu, pero si aún no lo ha dicho, la tablilla lo destapa.
        const t = muertos.filter((x) => !v.preguntas.some((p) => p.espiritu === x.asiento && p.respuesta === "si"));
        if (t.length)
            return j(k("tablilla"), { objetivo: t[0].asiento });
    }
    if (k("mano") >= 0 && equipo && muertos.length && q.c <= 4)
        return j(k("mano"), { objetivo: muertos[0].asiento });
    if (k("radio") >= 0 && equipo) {
        const defs = h.filter((x) => ["ros", "esc", "ult"].includes(x));
        const t = vivos.filter((x) => x.asiento !== yo && x.c <= 5);
        if (defs.length && t.length && (defs.length >= 2 || q.c >= 7))
            return j(k("radio"), { objetivo: minAzar(r, t, (x) => x.c).asiento, dar: defs[0] });
    }
    return null;
}
/** Qué tanto le sirve una carta a un investigador (para el vigía). */
function valorBot(v, c) {
    if (["ros", "esc", "ult", "copal"].includes(c))
        return 9;
    if (c === "kit")
        return 7;
    if (D.isTool(c))
        return v.confirmadas.includes(D.toolEv(c)) || v.descartadas.includes(D.toolEv(c)) ? 1 : 6;
    if (c === "ruda" || c === "te")
        return 5;
    if (c === "resp")
        return 3;
    return 2;
}
function turnoAnima(v, r) {
    const yo = ANIMA;
    const mano = v.manoAnima;
    const vivos = v.inv.filter((q) => q.vivo);
    const elig = (th) => vivos.filter((q) => q.c <= th && !q.ruda);
    const libres = vivos.filter((q) => !q.ruda);
    const masBajo = (l) => minAzar(r, l, (q) => q.c);
    // Para desgastar (no para matar) reparte la presión: cualquiera a 2 puntos del más bajo.
    const presionar = (l) => { const m = Math.min(...l.map((q) => q.c)); return elegir(r, l.filter((q) => q.c <= m + 2)); };
    const i = (c) => mano.indexOf(c);
    const jugar = (k, objetivo) => ({ quien: yo, tipo: "jugar", carta: k, ...(objetivo !== undefined ? { objetivo } : {}) });
    if (!v.espantoUsado && v.confirmadas.length >= 2) {
        const a = D.ANIMA_POR_ID[v.anima];
        const obj = objetivoEspanto(v, r);
        if (convieneEspanto(v, a, obj))
            return { quien: yo, tipo: "espanto", objetivo: obj };
    }
    const uc = v.umbralCac ?? (v.nInv === 1 ? 3 : 4); // en Duelo, la Cacería solo alcanza a 3 o menos
    if (i("caceria_total") >= 0 && elig(uc).length >= 2)
        return jugar(i("caceria_total"));
    if (i("caceria") >= 0 && elig(uc).length)
        return jugar(i("caceria"), masBajo(elig(uc)).asiento);
    if (i("caceria_total") >= 0 && elig(uc).length)
        return jugar(i("caceria_total"));
    if (i("pentagrama") >= 0 && v.pentagrama === 0 && elig(uc + 1).length)
        return jugar(i("pentagrama"));
    if (i("muneca") >= 0 && libres.length && (v.muneca === null || v.muneca === undefined)) {
        const fuera = libres.filter((q) => q.c > uc);
        return jugar(i("muneca"), (fuera.length ? minAzar(r, fuera, (q) => q.c) : maxAzar(r, libres, (q) => q.c)).asiento);
    }
    const minC = Math.min(...vivos.map((q) => q.c));
    for (let k = 0; k < mano.length; k++) {
        const c = mano[k];
        if (!D.isHab(c))
            continue;
        const ok = c === "h0" || c === "h4" ? elig(4).length > 0
            : c === "h6" ? elig(6).length > 0
                : c === "h1" ? libres.length > 0
                    : c === "h2" ? minC <= 5
                        : c === "h3" ? vivos.some((q) => q.nMano >= 2)
                            : c === "h5" ? minC <= 6 : false;
        if (ok)
            return jugar(k);
    }
    if (i("posesion") >= 0 && libres.length)
        return jugar(i("posesion"), maxAzar(r, libres, (q) => q.nMano).asiento);
    if (i("manifestacion") >= 0 && libres.length)
        return jugar(i("manifestacion"), presionar(libres).asiento);
    for (const c of ["travesura", "escalofrio", "portazo", "presencia"])
        if (i(c) >= 0)
            return jugar(i(c));
    if (i("espejo_obsidiana") >= 0 && libres.length)
        return jugar(i("espejo_obsidiana"), elegir(r, libres).asiento);
    const hab = mano.findIndex((c) => D.isHab(c));
    const tirar = mano.findIndex((c, k) => !["caceria", "caceria_total"].includes(c) && k !== hab);
    return { quien: yo, tipo: "descartar", cartas: tirar >= 0 ? [tirar] : [] };
}
