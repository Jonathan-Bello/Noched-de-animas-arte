// Mesa virtual de Noche de Ánimas: une el motor, los bots, la red, la escena 3D y el HUD.
//
// Tres modos comparten la misma interfaz, que solo lee la VISTA del jugador:
//   local      — el motor corre aquí; los demás asientos son bots.
//   anfitrion  — el motor corre aquí; publica en la base de datos la vista de cada asiento
//                y aplica las acciones que mandan los demás jugadores.
//   invitado   — no corre motor: lee su vista y escribe sus acciones.
import { ESPANTO_EFECTO } from "./espantos.js";
import { personajesDe, nombresBots, PERSONAJES, arteRol, cartaRol, FAMILIA_ROL } from "./personajes.js";
import { almasDePartida, clasificacion, fmtAlmas } from "./sesion.js";
import {
  nuevaPartida, aplicar, vistaPara, decidir, azarConSemilla,
  ANIMA, ANIMAS, ANIMA_POR_ID, EVIDENCIAS, HABILIDADES, cardName, isTool, isHab, toolEv, VASO, ROLES, ESPECTADOR,
} from "./motor/index.js";
import { crearEscena, COLORES_INV } from "./escena.js";

const $ = (s) => document.querySelector(s);
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const guardar = (k, v) => { try { localStorage.setItem("nda3d_" + k, JSON.stringify(v)); } catch (e) {} };
const borrar = (k) => { try { localStorage.removeItem("nda3d_" + k); } catch (e) {} };
const leer = (k, d) => { try { const v = localStorage.getItem("nda3d_" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const pausa = (ms) => new Promise((r) => setTimeout(r, matchMedia("(prefers-reduced-motion: reduce)").matches ? Math.min(ms, 120) : ms));
const clave = (asiento) => (asiento === ANIMA ? "a" : String(asiento));

// ------------------------------------------------------------------ textos de cartas

const TIPO = { herramienta: "Herramienta", apoyo: "Apoyo", defensa: "Reacción", anima: "Ánima", habilidad: "Habilidad", objeto: "Objeto maldito" };
const OBJETOS_INV = ["radio", "tablilla", "mano", "limpia", "espejo_plata", "tarot"];
const OBJETOS_ANIMA = ["muneca", "espejo_obsidiana", "pentagrama"];
const TEXTO = {
  kit: "Eliges la evidencia; detecta con 5 o 6. Cuesta 1 de cordura.", te: "Recuperas 2 de cordura.", resp: "Recuperas 1 de cordura y robas 1 carta.",
  ros: "Reacción: cancela una cacería contra ti.", esc: "Reacción: cancela una cacería; tu siguiente turno, sin herramientas.",
  ult: "Reacción: cancela una cacería; el ánima roba 1 carta.", ruda: "Hasta tu siguiente turno el ánima no puede elegirte ni cazarte.",
  copal: "Reacción de cualquiera: cancela una carta del ánima o salva de un Espanto.",
  escalofrio: "Todos pierden 1 de cordura.", portazo: "Cada investigador descarta 1 carta al azar.", travesura: "Todos cambian su mano completa.",
  manifestacion: "Elige a uno: pierde 2 de cordura.", posesion: "Elige a uno: cambia su mano completa.", interferencia: "Reacción: una herramienta falla.",
  presencia: "Robas 2 cartas.", caceria: "Caza a uno con 4 o menos de cordura (en Duelo, 3 o menos).", caceria_total: "Caza a todos con 4 o menos (en Duelo, 3 o menos).",
  h0: "Caza a uno con 4 o menos; Esconderse no sirve.", h1: "Elige a cualquiera: con 4 o menos lo caza; con 5 o más pierde 2 de cordura.", h2: "Todos pierden 2 de cordura.",
  radio: "Pasa 1 carta de tu mano a otro investigador vivo.", tablilla: "Elige a un espíritu: desde ahora puede hablar con normalidad.",
  mano: "Solo si hay un muerto. Tira el dado: con 1–3 mueres tú; con 4–6 revive el compañero que elijas, con 5 de cordura.",
  limpia: "Quita la Muñeca y el Pentagrama; cada vivo recupera 2 de cordura.", espejo_plata: "Mira en secreto la mano del ánima.",
  tarot: "Tira el dado: con 5 o 6, el ánima dice una evidencia que no tiene.",
  muneca: "Frente a un investigador: pierde 1 de cordura al inicio de cada turno suyo.", espejo_obsidiana: "Mira en secreto la mano de un investigador.",
  pentagrama: "Durante tus 2 siguientes turnos nadie puede usar Copal.",
  rol_manifestar: "Carta de espíritu. En tu turno, roba 1 carta: si es una herramienta, detecta con 5 o 6. Cualquier otra carta se descarta.",
  rol_velar: "Carta de espíritu. Ponla frente a un vivo: hasta tu siguiente turno, pierde 1 menos de cordura cada vez que el ánima lo dañe. En Sálvese quien pueda, marca a tu aliado.",
  h3: "Cada uno descarta 2 cartas al azar.", h4: "Caza a uno con 4 o menos; el Rosario no sirve.", h5: "El de menos cordura pierde 3.", h6: "Caza a uno con 6 o menos.",
};
function tipoDe(c) {
  if (isTool(c) || c === "kit") return "herramienta";
  if (["te", "resp", "ruda"].includes(c)) return "apoyo";
  if (["ros", "esc", "ult", "copal"].includes(c)) return "defensa";
  if (isHab(c)) return "habilidad";
  if (OBJETOS_INV.includes(c) || OBJETOS_ANIMA.includes(c)) return "objeto";
  return "anima";
}
function textoDe(c) {
  if (isTool(c)) return `Busca ${EVIDENCIAS[toolEv(c)]}; detecta con 4 o más. Cuesta 1 de cordura.`;
  if (isHab(c)) return `Deja una pista de ${EVIDENCIAS[HABILIDADES[c].ev]}. ${TEXTO[c]}`;
  return TEXTO[c] ?? "";
}
const ARTE = (id) => `cartas/${id}.webp`;

// ------------------------------------------------------------------ estado de la interfaz

let MESA = null; // { modo, yo, id, enviar(a), salir() }
let V = null; // vista actual
let sel = [];
let modo = null;
let escena = null;
let vistos = -1; // última entrada de bitácora animada
let bitacoraAbierta = leer("bitacora", true);
let notas = { ev: {}, tachadas: [] };
let minim = leer("minim", {});
let albaMax = 1;
// Historial completo de la partida (la vista solo trae las últimas entradas) y una serie para graficar.
let HIST = [], SERIE = [], histMax = -1;
function registrar(v) {
  const cord = v.inv.map((q) => (q.vivo ? q.c : 0));
  for (const e of v.bitacora) {
    if (e.i <= histMax) continue;
    histMax = e.i;
    HIST.push({ i: e.i, turno: v.nTurno, alba: v.nMazoInv, conf: v.confirmadas.length, cord, tipo: e.tipo, txt: e.txt, privada: !!e.para, ev: e.e || null });
  }
  const u = SERIE[SERIE.length - 1], clave = cord.join(",") + "|" + v.confirmadas.length + "|" + v.muertes;
  if (!u || u.clave !== clave) SERIE.push({ clave, turno: v.nTurno, cord, conf: v.confirmadas.length, alba: v.nMazoInv, vivos: v.inv.map((q) => q.vivo) });
} // cartas en el mazo al empezar: base para la barra de progreso del Alba
// Modo stream del ánima: difumina todo lo que delata su identidad; «Mirar» lo enseña unos segundos.
let stream = leer("stream", false), espiarT = 0;
const enStream = () => stream && MESA && yo() === ANIMA && !V?.ganador;
const sec = (html) => `<span class="secreto">${html}</span>`; // ventanas minimizadas: { bloc, bitacora, panel, mano }
let claveNotas = "";

// ------------------------------------------------------------------ motor local (y del anfitrión)

// Corre el motor con bots. `humanos` dice qué asientos son personas; el resto son bots.
function crearMotor({ nInv, nombres, humanos, alCambiar, estado = null, anima = null, modo = "equipo", vaso = false, objetos = false, testigos = false, reparto = "robar", lectura = false, cartaInicial = true }) {
  const semilla = Math.floor(Math.random() * 2 ** 31);
  const S = estado || nuevaPartida({ nInv, semilla, nombres, modo: nInv >= 2 ? modo : "equipo", vaso, objetos, testigos: testigos && nInv >= 2, reparto, lectura: lectura ? "cartas" : "dado", cartaInicial, ...(anima ? { anima } : {}) });
  const azar = azarConSemilla(semilla ^ 0x5bd1);
  let ocupado = false, detenido = false;
  const esHumano = (a) => humanos.has(clave(a));

  // Decisiones sin opciones reales: el motor las contesta solo, con una pausa que no delata nada.
  function trivial(p, a) {
    if (p.tipo === "copal") return !S.inv[a].mano.includes("copal") && !(p.datos.devota === a && S.inv[a].mano.includes("ros")) && { tipo: "copal", usar: false };
    if (p.tipo === "defensa") return !p.datos.opciones.length && !p.datos.copalSalva && !p.datos.guarda && { tipo: "defensa", con: null };
    if (p.tipo === "interferir") return !S.manoAnima.includes("interferencia") && { tipo: "interferir", usar: false };
    return false;
  }

  async function avanzar() {
    if (ocupado || detenido) return;
    ocupado = true;
    try {
      while (S.pendiente && !S.ganador && !detenido) {
        const p = S.pendiente;
        const faltan = p.quien.filter((x) => !(p.resp && x in p.resp));
        let quien = null, accion = null;
        if (p.tipo === "pregunta" || (p.tipo === "acusacionFinal" && !p.resp)) {
          if (faltan.some(esHumano)) break; // una persona decide por el equipo
          quien = faltan[0];
        } else {
          for (const x of faltan) {
            const t = esHumano(x) ? trivial(p, x) : null;
            if (t) { quien = x; accion = t; break; }
            if (!esHumano(x)) { quien = x; break; }
          }
          if (quien === null) break; // solo faltan personas
        }
        await pausa((accion ? 380 : retraso(p.tipo)) * 4 / velocidad());
        if (detenido || S.pendiente !== p) continue;
        aplicar(S, accion ? { quien, ...accion } : decidir(vistaPara(S, quien), azar));
        alCambiar();
      }
    } finally {
      ocupado = false;
    }
  }

  return {
    S,
    vista: (a) => recortar(vistaPara(S, a)),
    actuar(a) { aplicar(S, a); alCambiar(); avanzar(); },
    // Se acabó el tiempo de una persona: un bot decide por ella esta vez.
    forzar(a) {
      const p = S.pendiente;
      if (!p || S.ganador || !p.quien.includes(a) || (p.resp && a in p.resp)) return false;
      try { aplicar(S, decidir(vistaPara(S, a), azar)); alCambiar(); avanzar(); return true; } catch { return false; }
    },
    avanzar,
    detener() { detenido = true; },
  };
}
// Velocidad de los bots: 1x, 2x o 4x (4x es el ritmo original). Se recuerda en este navegador.
const VELOCIDADES = [1, 2, 4];
const velocidad = () => { const x = Number(leer("velocidad", 1)); return VELOCIDADES.includes(x) ? x : 1; };
function retraso(t) {
  return { anima: 900, investigador: 800, copal: 300, defensa: 600, interferir: 350, espiritu: 700, pregunta: 800, respuesta: 800, revelar: 400, anunciar: 900, desafio: 450 }[t] ?? 500;
}
// La vista viaja por la red: se recorta la bitácora y se numeran las entradas.
function recortar(v) {
  const total = v.bitacora.length, desde = Math.max(0, total - 60);
  return { ...v, bitacora: v.bitacora.slice(desde).map((e, k) => ({ ...e, i: desde + k })) };
}

let guardarT = 0;
// ------------------------------------------------------------------ sesión «Una tarde en la casona»

let SESION = leer("sesion", null);
function nuevaSesion(cfg) {
  const bots = nombresBots(cfg.nInv, false);
  SESION = { cfg, jugadores: ["Tú", ...bots], ronda: 0, almas: {}, aciertos: {}, ganoComoAnima: {}, historial: [], contada: -1 };
  guardar("sesion", SESION);
}
/** Quién es el ánima esta ronda y cómo se sientan los demás. */
function mesaDeSesion() {
  const J = SESION.jugadores.length, g = (SESION.ronda + 1) % J; // tú llevas el ánima en la última partida
  const inv = [...Array(J).keys()].filter((x) => x !== g);
  return { ghost: g, inv, yo: g === 0 ? ANIMA : inv.indexOf(0), nombres: inv.map((i) => SESION.jugadores[i]) };
}
function contarSesion(v) {
  if (!SESION || SESION.contada === SESION.ronda || !v.ganador) return;
  const m = mesaDeSesion();
  const r = almasDePartida(v, (a) => m.inv[a], m.ghost);
  for (const [k, n] of Object.entries(r.almas)) SESION.almas[k] = (SESION.almas[k] || 0) + n;
  SESION.ultimas = r.almas; // para que las almas vuelen al marcador
  for (const k of Object.keys(r.aciertos)) SESION.aciertos[k] = (SESION.aciertos[k] || 0) + 1;
  if (r.animaGano) SESION.ganoComoAnima[m.ghost] = (SESION.ganoComoAnima[m.ghost] || 0) + 1;
  SESION.historial.push({ ronda: SESION.ronda + 1, anima: SESION.jugadores[m.ghost], logro: v.logro || v.motivo });
  SESION.contada = SESION.ronda;
  guardar("sesion", SESION);
}
function sesionHTML() {
  if (!SESION) return "";
  const J = SESION.jugadores.length, fin = SESION.contada === J - 1;
  const tabla = clasificacion(SESION).map((x, k) => `<tr class="${x.i === 0 ? "yo" : ""}" data-j="${x.i}"><td>${k + 1}.</td><td>${esc(x.nombre)}</td><td><b>${fmtAlmas(x.almas)}</b> almas</td><td class="nota">${x.aciertos} acierto${x.aciertos === 1 ? "" : "s"}</td></tr>`).join("");
  const ganador = fin ? clasificacion(SESION)[0] : null;
  return `<div class="sesion"><p class="fin-eti">Una tarde en la casona · partida ${SESION.contada + 1} de ${J}</p>
    ${ganador ? `<p class="fin-logro">${ganador.i === 0 ? "¡Ganaste la tarde!" : `${esc(ganador.nombre)} gana la tarde`} con ${fmtAlmas(ganador.almas)} almas.</p>` : ""}
    <table class="tabla-almas">${tabla}</table>
    ${fin ? `<button class="primario" data-accion="sesionNueva">Otra tarde</button>` : `<button class="primario" data-accion="sesionSig">Siguiente partida · ánima: ${esc(SESION.jugadores[(SESION.ronda + 2) % J])}</button>`}</div>`;
}
/** Las almas ganadas en la partida vuelan al marcador de cada jugador. */
let almasAnimadas = -1;
function animarAlmas() {
  if (!SESION?.ultimas || almasAnimadas === SESION.contada || !$(".tabla-almas")) return;
  almasAnimadas = SESION.contada;
  if (MOV_REDUCIDO()) return;
  let k = 0;
  for (const [j, n] of Object.entries(SESION.ultimas)) {
    if (!n) continue;
    const celda = $(`.tabla-almas tr[data-j="${j}"] b`);
    if (!celda) continue;
    const r = celda.getBoundingClientRect();
    for (let o = 0; o < Math.min(4, Math.ceil(n)); o++) {
      const a = document.createElement("i");
      a.className = "alma-vuela";
      capaEfectos().appendChild(a);
      const x0 = innerWidth / 2 + (Math.random() - 0.5) * 200, y0 = innerHeight * 0.2;
      a.animate([
        { transform: `translate(${x0}px, ${y0}px) scale(.3)`, opacity: 0 },
        { transform: `translate(${x0 + (Math.random() - 0.5) * 120}px, ${y0 + 60}px) scale(1)`, opacity: 1, offset: 0.3 },
        { transform: `translate(${r.left + r.width / 2}px, ${r.top + r.height / 2}px) scale(.5)`, opacity: 0.9 },
      ], { duration: 1300, delay: 300 + (k * 4 + o) * 120, easing: "cubic-bezier(.4,0,.2,1)", fill: "backwards" }).onfinish = () => { a.remove(); celda.classList.remove("suma"); void celda.offsetWidth; celda.classList.add("suma"); };
    }
    const fila = celda.closest("tr");
    setTimeout(() => { const p = document.createElement("span"); p.className = "alma-mas"; p.textContent = `+${fmtAlmas(n)}`; celda.after(p); }, 1500 + k * 480);
    k++;
  }
}
function jugarSesion(estado = null) {
  const m = mesaDeSesion();
  jugarSolo({ ...SESION.cfg, rol: m.yo === ANIMA ? "anima" : "investigador" }, estado, m);
}

function jugarSolo(cfg, estado = null, mesa = null) {
  const yo = mesa ? mesa.yo : cfg.rol === "anima" ? ANIMA : 0;
  const nombres = mesa ? mesa.nombres : nombresBots(4, cfg.rol !== "anima");
  let motor = null;
  const respaldar = () => {
    clearTimeout(guardarT);
    guardarT = setTimeout(() => {
      if (!motor) return;
      if (motor.S.ganador) { borrar("partidaLocal"); if (mesa) { contarSesion(motor.vista(yo)); pintar(); } }
      else guardar("partidaLocal", { estado: motor.S, cfg, t: Date.now(), sesion: !!mesa });
    }, 400);
  };
  motor = crearMotor({ nInv: cfg.nInv, nombres, humanos: new Set([clave(yo)]), estado, anima: cfg.anima && cfg.anima !== "azar" ? cfg.anima : null, modo: cfg.modo || "equipo", vaso: !!cfg.vaso, objetos: !!cfg.objetos, testigos: !!cfg.testigos, reparto: cfg.reparto || "robar", lectura: !!cfg.lectura, cartaInicial: cfg.cartaInicial !== false, alCambiar: () => { if (motor) { recibir(motor.vista(yo)); respaldar(); } } });
  MESA = { modo: "local", yo, id: "solo-" + motor.S.semilla, enviar(a) { motor.actuar({ quien: yo, ...a }); }, salir() { motor.detener(); }, estado: () => motor.S };
  entrarAlJuego();
  recibir(motor.vista(yo));
  motor.avanzar();
}

function pintarContinuar() {
  const g = leer("partidaLocal", null);
  const el = $("#continuar");
  if (!el) return;
  if (!g?.estado || g.estado.ganador) { el.innerHTML = ""; return; }
  const min = Math.max(1, Math.round((Date.now() - g.t) / 60000));
  const hace = min < 60 ? `hace ${min} min` : min < 1440 ? `hace ${Math.round(min / 60)} h` : `hace ${Math.round(min / 1440)} días`;
  const extras = [g.estado.reglas?.modo === "cadaQuien" ? (g.sesion ? "sesión" : "sálvese quien pueda") : "", g.estado.reglas?.vaso ? "con vaso" : "", g.estado.reglas?.objetos ? "objetos" : "", g.estado.reglas?.roles ? "roles" : ""].filter(Boolean).join(", ");
  el.innerHTML = `<button data-accion="continuar">▶ Continuar tu partida</button><p class="nota">${g.cfg.rol === "anima" ? "Como ánima" : "Como investigador"} · ${g.cfg.nInv} investigador${g.cfg.nInv === 1 ? "" : "es"}${extras ? " · " + extras : ""} · turno ${g.estado.nTurno} · ${hace}</p>`;
}
const salaReciente = () => leer("ultimaSala", null);
function pintarSalaReciente() {
  const el = $("#salaReciente"), c = salaReciente();
  if (!el) return;
  el.innerHTML = c && DB ? `<button data-accion="volverASalaReciente">↩ Volver a la sala ${esc(c)}</button>` : "";
}

// ------------------------------------------------------------------ salas en línea

// Cómo viajan los datos:
// - El anfitrión (dueño o editor del artefacto) corre el motor y escribe la sala y las vistas en `db`.
// - Los invitados solo LEEN `db`; su nombre, su asiento y sus jugadas viajan por la presencia del
//   cuarto en vivo (`room`), que el anfitrión escucha. Así basta con invitarlos por correo, a cualquier
//   nivel, sin darles permiso de editar el artefacto.
let DB = null, MI_ID = null, CUARTOS = null, PUEDE_ESCRIBIR = null;
(async () => {
  try {
    if (!window.claude?.use) throw 0;
    const [db, user, room] = await Promise.all([window.claude.use("db"), window.claude.use("user"), window.claude.use("room")]);
    if (!db || !user) throw 0;
    MI_ID = await user.id();
    if (!MI_ID) throw 0;
    DB = db; CUARTOS = room;
    PUEDE_ESCRIBIR = await user.can("data.write").catch(() => null);
    if (!CUARTOS && PUEDE_ESCRIBIR === false) throw 1;
    $("#enLinea").hidden = false;
    pintarSalaReciente();
    $("#sinLinea").hidden = PUEDE_ESCRIBIR !== false;
    if (PUEDE_ESCRIBIR === false) {
      $("[data-accion=crearSala]").disabled = true;
      $("#sinLinea").textContent = "Puedes unirte a la sala de quien te invitó. Crear salas solo pueden el dueño y los editores de la mesa.";
    }
  } catch (e) {
    $("#sinLinea").hidden = false;
    $("#sinLinea").textContent = e === 1
      ? "Para jugar en línea, pide que te inviten a la mesa por correo (Compartir → invitar personas). Con el enlace público solo se puede jugar con bots."
      : "Las salas solo funcionan al abrir la mesa en claude.ai con tu sesión iniciada. Mientras, puedes jugar con bots.";
  }
})();

function codigoNuevo() {
  const L = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => L[Math.floor(Math.random() * L.length)]).join("");
}

// Una escritura a la vez por documento; si llegan varias, gana la última.
function escritor(ref) {
  let enCurso = false, siguiente = null;
  return async function escribir(datos) {
    siguiente = datos;
    if (enCurso) return;
    enCurso = true;
    try {
      while (siguiente) { const d = siguiente; siguiente = null; await ref.set(d); }
    } catch (e) {
      aviso("No se pudo guardar en la sala: " + (e?.message || "error de red"));
    } finally { enCurso = false; }
  };
}

const REGLAS_BASE = { anima: "azar", quien: "libre", tiempo: 90, modo: "equipo", vaso: false, sesion: false, objetos: false, testigos: false, reparto: "robar", lectura: false, cartaInicial: true };
const MODOS = { equipo: "En equipo", cadaQuien: "Sálvese quien pueda" };
const reglasDe = (d) => ({ ...REGLAS_BASE, ...(d?.reglas || {}) });
let LIMITE = 0; // hora límite de la decisión en curso (multijugador con tiempo)
let SALA = null; // { codigo, nombre, datos, jugadores, des[], cuarto, alAccion }

async function entrarAlCuarto(codigo) {
  if (!CUARTOS) return null;
  try { return await CUARTOS.join("sala-" + codigo.toLowerCase()); } catch { return null; }
}

async function crearSala(nombre, nInv) {
  const codigo = codigoNuevo();
  const asientos = { a: null };
  for (let i = 0; i < nInv; i++) asientos[i] = null;
  await DB.doc("salas/" + codigo).set({ codigo, anfitrion: MI_ID, estado: "lobby", nInv, asientos, creada: Date.now(), reglas: { ...REGLAS_BASE }, rotacion: 0 });
  await DB.doc(`salas/${codigo}/jugadores/${MI_ID}`).set({ nombre, t: Date.now() });
  await abrirLobby(codigo, nombre);
}

async function unirse(codigo, nombre) {
  codigo = codigo.trim().toUpperCase();
  const s = await DB.doc("salas/" + codigo).get();
  if (!s.exists) return aviso("No hay ninguna sala con ese código.");
  await abrirLobby(codigo, nombre);
  // Primero, escribir directo (dueño, editores o contribuyentes). Si la mesa no lo permite, por el cuarto en vivo.
  try {
    if (PUEDE_ESCRIBIR === false) throw 0;
    await DB.doc(`salas/${codigo}/jugadores/${MI_ID}`).set({ nombre, t: Date.now() });
    SALA.via = "db";
  } catch {
    if (SALA.cuarto) { SALA.via = "cuarto"; SALA.cuarto.presence({ sala: codigo, id: MI_ID, nombre }).catch(() => {}); }
    else { salirDeSala(); mostrar("inicio"); return aviso("No puedes conectarte a la sala: pide que te inviten a la mesa por correo."); }
  }
  pintarLobby();
}

async function abrirLobby(codigo, nombre) {
  guardar("nombre", nombre);
  guardar("ultimaSala", codigo);
  SALA = { codigo, nombre, datos: null, jugadores: {}, des: [], cuarto: null, alAccion: null, vistos: {}, via: "db" };
  mostrar("lobby");
  $("#lobby").innerHTML = `<div class="portada"><p class="espera"><span class="latido"></span>Entrando a la sala ${esc(codigo)}…</p></div>`;
  SALA.cuarto = await entrarAlCuarto(codigo);
  SALA.des.push(DB.doc("salas/" + codigo).onSnapshot((snap) => {
    SALA.datos = limpiarSala(snap.data() || null);
    if (!SALA.datos) return;
    if (SALA.datos.estado === "juego" && !MESA && SALA.datos.anfitrion !== MI_ID) entrarComoInvitado();
    if (SALA.datos.estado === "lobby" && (MESA?.modo === "invitado" || MESA?.modo === "espectador")) { MESA.salir(); MESA = null; V = null; $("#ayuda").hidden = true; mostrar("lobby"); }
    const an = SALA.datos.anuncio;
    if (an && an.t !== SALA.anuncioVisto) { if (SALA.anuncioVisto !== undefined || Date.now() - an.t < 15000) aviso(an.texto, "info"); SALA.anuncioVisto = an.t; }
    pintarLobby();
  }, () => aviso("Se perdió la conexión con la sala.")));
  SALA.des.push(DB.collection(`salas/${codigo}/jugadores`).onSnapshot((q) => {
    SALA.jugadores = Object.fromEntries(q.docs.map((d) => [d.id, d.data()]));
    pintarLobby();
  }));
  if (SALA.cuarto) {
    SALA.des.push(SALA.cuarto.onPeers((c) => { if (soyAnfitrion()) atenderInvitados(c.peers); else pintarLobby(); }));
    const cuarto = SALA.cuarto;
    SALA.des.push(() => cuarto.leave().catch(() => {}));
  }
}

// El anfitrión lee la presencia de cada invitado: nombre, asiento que pide y su última jugada.
function atenderInvitados(peers) {
  if (!SALA?.datos) return;
  for (const p of peers) {
    if (p.isMe || p.kind !== "viewer") continue;
    const pr = p.presence || {};
    if (pr.sala !== SALA.codigo) continue;
    const uid = p.by || (typeof pr.id === "string" ? pr.id : null);
    if (!uid) continue;
    const nombre = String(pr.nombre || "Invitado").slice(0, 20);
    if (SALA.jugadores[uid]?.nombre !== nombre) {
      SALA.jugadores[uid] = { nombre };
      DB.doc(`salas/${SALA.codigo}/jugadores/${uid}`).set({ nombre, t: Date.now() }).catch(() => {});
    }
    const vis = (SALA.vistos[uid] ||= {});
    if (pr.quiere && pr.quiere.n !== vis.quiere && SALA.datos.estado === "lobby") {
      vis.quiere = pr.quiere.n;
      asignarAsiento(uid, String(pr.quiere.k)).catch(() => {});
    }
    if (pr.acc && pr.acc.n !== vis.acc) {
      vis.acc = pr.acc.n;
      SALA.alAccion?.(uid, pr.acc);
    }
  }
}

function soyAnfitrion() { return SALA?.datos?.anfitrion === MI_ID; }
function miAsiento() {
  const a = SALA?.datos?.asientos || {};
  return Object.keys(a).find((k) => a[k] === MI_ID);
}

async function asignarAsiento(uid, k) {
  const d = SALA.datos;
  if (!(k in d.asientos) || (d.asientos[k] && d.asientos[k] !== uid)) return;
  const asientos = { ...d.asientos };
  for (const x of Object.keys(asientos)) if (asientos[x] === uid) asientos[x] = null;
  asientos[k] = uid;
  SALA.datos = { ...d, asientos }; // la foto de la base viene congelada: se reemplaza, no se modifica
  await DB.doc("salas/" + SALA.codigo).update({ asientos });
}

/** La base fusiona los cambios: un lugar cerrado puede quedar guardado. Solo cuentan el ánima y los lugares abiertos. */
function limpiarSala(d) {
  if (!d?.asientos) return d;
  const asientos = { a: d.asientos.a ?? null };
  for (let i = 0; i < d.nInv; i++) asientos[i] = d.asientos[i] ?? null;
  return { ...d, asientos };
}
/** Los 4 lugares de investigador se escriben siempre: los cerrados quedan en null para que no reaparezcan. */
function asientosParaGuardar(asientos, n) {
  const x = { a: asientos.a ?? null };
  for (let i = 0; i < 4; i++) x[i] = i < n ? asientos[i] ?? null : null;
  return x;
}

/** El anfitrión cambia cuántos investigadores hay sin cerrar la sala. Quien quede fuera sigue en la sala, sin lugar. */
async function cambiarInvSala(delta) {
  const d = SALA.datos;
  const n = Math.max(1, Math.min(4, d.nInv + delta));
  if (n === d.nInv || d.estado !== "lobby") return;
  const asientos = { a: d.asientos.a ?? null };
  for (let i = 0; i < n; i++) asientos[i] = d.asientos[i] ?? null;
  SALA.datos = { ...d, nInv: n, asientos };
  await DB.doc("salas/" + SALA.codigo).update({ nInv: n, asientos: asientosParaGuardar(asientos, n) });
  pintarLobby();
}

/** Cierra un lugar de investigador: los demás se recorren y quien estaba sentado ahí pasa a mirar. */
async function cerrarLugar(i) {
  const d = SALA.datos;
  if (d.estado !== "lobby" || d.nInv <= 1) return;
  const quedan = [];
  for (let j = 0; j < d.nInv; j++) if (j !== i) quedan.push(d.asientos[j] ?? null);
  const asientos = { a: d.asientos.a ?? null };
  quedan.forEach((u, j) => (asientos[j] = u));
  SALA.datos = { ...d, nInv: quedan.length, asientos };
  await DB.doc("salas/" + SALA.codigo).update({ nInv: quedan.length, asientos: asientosParaGuardar(asientos, quedan.length) });
  pintarLobby();
}

/** Selector visual de ánima, como en la partida: cartas en grande y «al azar». */
let SELECTOR_ANIMA = null;
function abrirSelectorAnima(actual, alElegir) {
  SELECTOR_ANIMA = alElegir;
  const el = $("#ayuda");
  el.hidden = false;
  el.innerHTML = `<div class="ayuda-caja mis-cartas selector-anima" role="dialog" aria-label="Elegir ánima"><div class="ayuda-cab"><b>¿Qué ánima ronda la casona?</b><button class="icono" data-accion="cerrarAyuda" aria-label="Cerrar">✕</button></div>
    <div class="mc-cuerpo"><div class="animas animas-grandes">
      <button class="anima-op${actual === "azar" ? " on" : ""}" data-accion="animaVisual" data-anima="azar"><img src="${ARTE("back02")}" alt=""><span>Al azar</span></button>
      ${ANIMAS.map((a) => `<button class="anima-op${actual === a.id ? " on" : ""}" data-accion="animaVisual" data-anima="${a.id}" data-vista="anima:${a.id}"><img src="${ARTE("id_" + a.id)}" alt="" loading="lazy"><span>${esc(a.nombre)}</span></button>`).join("")}
    </div></div></div>`;
}
function pintarAnimaMenu() {
  const id = $("#animaSel").value, a = id !== "azar" ? ANIMA_POR_ID[id] : null;
  const b = $("#animaVisualBtn");
  if (!b) return;
  b.innerHTML = `<img src="${ARTE(a ? "id_" + a.id : "back02")}" alt=""><span>${esc(a ? a.nombre : "Al azar")}</span><small>Cambiar</small>`;
  if (a) b.dataset.vista = "anima:" + a.id; else delete b.dataset.vista;
}

/** Deja un lugar libre (lo juega un bot); la persona sigue en la sala y puede volver a sentarse. */
async function liberarAsiento(k) {
  const d = SALA.datos;
  if (!(k in d.asientos)) return;
  const asientos = { ...d.asientos, [k]: null };
  SALA.datos = { ...d, asientos };
  await DB.doc("salas/" + SALA.codigo).update({ asientos });
  pintarLobby();
}

// ------------------------------------------------------------------ círculos de la sala
// Cada persona en la sala es un círculo que flota; al sentarse, vuela a su lugar con un chasquido.
const ORBES = new Map(); // uid → { el, k }
function capaOrbes() {
  let c = $("#orbes");
  if (!c) { c = document.createElement("div"); c.id = "orbes"; c.setAttribute("aria-hidden", "true"); document.body.appendChild(c); }
  return c;
}
function ocultarOrbes() { const c = $("#orbes"); if (c) c.hidden = true; }
function colorDe(uid) { let h = 0; for (const ch of String(uid)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return `hsl(${Math.round((h * 137.508) % 360)} 65% 62%)`; }
function actualizarOrbes() {
  if (!SALA?.datos || $("#lobby").hidden) return ocultarOrbes();
  const capa = capaOrbes();
  capa.hidden = false;
  const d = SALA.datos, jug = SALA.jugadores || {};
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let chasquear = false;
  for (const [uid, o] of ORBES) if (!(uid in jug)) { o.el.remove(); ORBES.delete(uid); }
  const W = innerWidth, H = innerHeight;
  Object.entries(jug).forEach(([uid, j], i) => {
    let o = ORBES.get(uid);
    if (!o) {
      const el = document.createElement("div");
      el.className = "orbe flota";
      el.style.setProperty("--c", colorDe(uid));
      el.style.setProperty("--dur", (7 + Math.random() * 6).toFixed(1) + "s");
      el.style.setProperty("--dx", (Math.random() * 80 - 40).toFixed(0) + "px");
      el.style.setProperty("--dy", (Math.random() * 80 - 40).toFixed(0) + "px");
      // empieza flotando en un costado de la pantalla
      const lado = i % 2 ? 0.86 : 0.08;
      el.style.left = (W * (lado + Math.random() * 0.06)) + "px";
      el.style.top = (H * (0.18 + Math.random() * 0.64)) + "px";
      capa.appendChild(el);
      o = { el, k: null, casa: { x: parseFloat(el.style.left), y: parseFloat(el.style.top) } };
      ORBES.set(uid, o);
    }
    o.el.textContent = (j.nombre || "?").trim().charAt(0).toUpperCase();
    o.el.title = j.nombre || "";
    o.el.classList.toggle("yo", uid === MI_ID);
    const k = Object.keys(d.asientos).find((x) => d.asientos[x] === uid) ?? null;
    if (k !== null) {
      const punto = $(`#lobby .asiento[data-k="${k}"] .punto`);
      if (!punto) return;
      const r = punto.getBoundingClientRect();
      o.el.classList.remove("flota");
      o.el.classList.add("sentado");
      o.el.style.left = r.left + r.width / 2 + "px";
      o.el.style.top = r.top + r.height / 2 + "px";
      if (o.k !== k) {
        if (o.k !== null || !reduce) chasquear = true;
        o.el.classList.remove("llega"); void o.el.offsetWidth; o.el.classList.add("llega");
      }
    } else if (o.k !== null || !o.el.classList.contains("flota")) {
      o.el.classList.remove("sentado", "llega");
      o.el.classList.add("flota");
      o.el.style.left = o.casa.x + "px";
      o.el.style.top = o.casa.y + "px";
    }
    o.k = k;
  });
  if (chasquear && MUSICA.ctx && MUSICA.efx && !MUSICA.mudo && MUSICA.ctx.state === "running") try { SFX.chasquido(MUSICA.ctx, MUSICA.ctx.currentTime + 0.42); } catch {}
}
addEventListener("resize", () => { if (!$("#lobby")?.hidden) actualizarOrbes(); });
$("#lobby").addEventListener("scroll", () => actualizarOrbes(), { passive: true });

async function tomarAsiento(k) {
  const d = SALA.datos;
  if (d.asientos[k] && d.asientos[k] !== MI_ID) return aviso("Ese lugar ya está ocupado.");
  if (soyAnfitrion() || SALA.via === "db") {
    try { return await asignarAsiento(MI_ID, k); } catch (e) { if (soyAnfitrion() || !SALA.cuarto) throw e; SALA.via = "cuarto"; }
  }
  if (!SALA.cuarto) return aviso("No pudiste conectarte a la sala. Pide al anfitrión que te invite por correo desde Compartir.");
  await SALA.cuarto.presence({ sala: SALA.codigo, id: MI_ID, nombre: SALA.nombre, quiere: { k, n: Date.now() } });
  aviso("Pediste ese lugar; el anfitrión lo confirma en un momento.");
}

function anfitrionPresente() {
  if (!SALA?.cuarto) return false;
  return SALA.cuarto.peers().some((p) => !p.isMe && p.by === SALA.datos?.anfitrion);
}

function reglasHTML(d) {
  const r = reglasDe(d);
  const nombreAnima = r.anima === "azar" ? "al azar" : ANIMA_POR_ID[r.anima]?.nombre || "al azar";
  const quien = { libre: "cada quien elige su lugar", rotacion: "por turnos: rota cada partida", dado: "lo decide el dado" }[r.quien];
  if (!soyAnfitrion()) return `<p class="nota reglas-ro">Reglas de la sala · Modo: <b>${esc(MODOS[r.modo] || MODOS.equipo)}${r.vaso ? ", dado bajo el vaso" : ""}${r.objetos ? ", Objetos malditos" : ""}${r.testigos ? ", Los testigos de la casona" : ""}${r.lectura ? ", cartas de lectura" : ""}</b> · Ánima: <b>${esc(nombreAnima)}</b> · Quién la juega: <b>${esc(quien)}</b> · Tiempo por decisión: <b>${r.tiempo ? r.tiempo + " s" : "sin límite"}</b></p>`;
  const op = (v, t, act) => `<option value="${v}"${act === v ? " selected" : ""}>${t}</option>`;
  const chk = (k, t, on, vista, extra = "") => `<label class="check regla-check" data-vista="${vista}"><input type="checkbox" data-regla="${k}"${on ? " checked" : ""}${extra}> ${t}</label>`;
  const a = r.anima !== "azar" ? ANIMA_POR_ID[r.anima] : null;
  return `<div class="reglas-sala">
    <label>Modo de juego<select data-regla="modo">${op("equipo", MODOS.equipo, r.modo)}${op("cadaQuien", MODOS.cadaQuien + " (2–4)", r.modo)}</select></label>
    <label>Quién juega el ánima<select data-regla="quien">${op("libre", "Cada quien elige su lugar", r.quien)}${op("rotacion", "Por turnos (rota cada partida)", r.quien)}${op("dado", "Lo decide el dado", r.quien)}</select></label>
    <label>Tiempo por decisión<select data-regla="tiempo">${op("0", "Sin límite", String(r.tiempo))}${op("60", "60 segundos", String(r.tiempo))}${op("90", "90 segundos", String(r.tiempo))}${op("120", "2 minutos", String(r.tiempo))}</select></label>
    <div class="regla-anima"><span class="eti">Qué ánima es</span><button type="button" class="anima-elegida" data-accion="elegirAnimaSala" ${a ? `data-vista="anima:${a.id}"` : ""}><img src="${ARTE(a ? "id_" + a.id : "back02")}" alt=""><span>${esc(a ? a.nombre : "Al azar")}</span><small>Cambiar</small></button></div>
    <div class="reglas-checks">
      ${chk("vaso", "Dado bajo el vaso", r.vaso && r.modo !== "cadaQuien", "exp:vaso", r.modo === "cadaQuien" ? ' disabled title="En Sálvese quien pueda el dado siempre está a la vista"' : d.nInv < 3 ? ' disabled title="Solo con 3 o 4 investigadores"' : "")}
      ${chk("objetos", "Objetos malditos", r.objetos, "exp:objetos")}
      ${chk("testigos", "Los testigos de la casona", r.testigos, "exp:testigos", d.nInv < 2 ? ' disabled title="Los roles no se usan en el Duelo"' : "")}
      ${chk("lectura", "Cartas de lectura (en prueba)", r.lectura, "exp:lectura")}
      ${chk("cartaInicial", "Curandero y Devota empiezan con su carta", r.cartaInicial !== false, "exp:cartaInicial")}
      ${r.modo === "cadaQuien" ? chk("sesion", "Una tarde en la casona", r.sesion, "exp:sesion") : ""}
    </div>
    ${r.testigos ? `<label>Cómo se reparten los roles<select data-regla="reparto">${op("robar", "Roba 2 y quédate con 1", r.reparto || "robar")}${op("azar", "Al azar", r.reparto || "robar")}${op("libre", "Cada quien elige (en orden)", r.reparto || "robar")}</select></label>` : ""}
    ${r.quien !== "libre" ? `<p class="nota">Al empezar, ${r.quien === "dado" ? "el dado elige" : "la rotación decide"} quién será el ánima entre los que están en la sala; el resto se reparte los lugares de investigador.</p>` : ""}
    ${r.anima !== "azar" ? `<p class="nota">Quien elige el ánima ya sabe cuál es: úsalo para practicar o si tú vas a ser el ánima.</p>` : ""}
    ${r.tiempo ? `<p class="nota">Si alguien se queda sin tiempo, un bot decide por esa vez.</p>` : ""}
  </div>`;
}
document.addEventListener("change", (ev) => {
  const k = ev.target.dataset?.regla;
  if (!k || !SALA?.datos || !soyAnfitrion()) return;
  const v = ev.target.type === "checkbox" ? ev.target.checked : k === "tiempo" ? Number(ev.target.value) : ["vaso", "sesion", "objetos", "testigos", "lectura", "cartaInicial"].includes(k) ? ev.target.value === "si" : ev.target.value;
  DB.doc("salas/" + SALA.codigo).update({ reglas: { ...reglasDe(SALA.datos), [k]: v } }).catch(() => aviso("No se pudo guardar la regla."));
});

/** Marcador de almas de la tarde en la sala. */
function marcadorSalaHTML(d) {
  const m = d?.marcador;
  if (!m || !Object.keys(m).length) return "";
  const filas = Object.entries(m).map(([k, x]) => ({ k, ...x })).sort((a, b) => b.almas - a.almas || b.aciertos - a.aciertos || b.comoAnima - a.comoAnima);
  return `<div class="sesion"><p class="fin-eti">Una tarde en la casona · ${d.partidas || 0} partida${d.partidas === 1 ? "" : "s"}</p>
    <table class="tabla-almas">${filas.map((x, i) => `<tr class="${x.k === MI_ID ? "yo" : ""}"><td>${i + 1}.</td><td>${esc(x.nombre)}</td><td><b>${fmtAlmas(x.almas)}</b> almas</td><td class="nota">${x.aciertos} acierto${x.aciertos === 1 ? "" : "s"}</td></tr>`).join("")}</table>
    ${soyAnfitrion() ? `<button data-accion="reiniciarMarcador">Empezar otra tarde (borrar marcador)</button>` : ""}</div>`;
}

function pintarLobby() {
  if (!SALA?.datos || $("#lobby").hidden) { ocultarOrbes(); return; }
  requestAnimationFrame(actualizarOrbes);
  const d = SALA.datos, jug = SALA.jugadores;
  const orden = Object.keys(d.asientos).sort((x, y) => (x === "a" ? -1 : y === "a" ? 1 : x - y));
  const filas = orden.map((k) => {
    const uid = d.asientos[k];
    const mio = uid === MI_ID;
    const color = k === "a" ? "#b45a9b" : COLORES_INV[Number(k)];
    return `<li class="asiento${mio ? " mio" : ""}" data-k="${k}" style="--c:${color}"><span class="punto"></span>
      <span class="a-lugar">${k === "a" ? "El ánima" : "Investigador " + (Number(k) + 1)}</span>
      <span class="a-quien">${uid ? esc(jug[uid]?.nombre || "Jugador") + (mio ? " (tú)" : "") : "Bot"}</span>
      ${soyAnfitrion() && d.estado === "lobby" && k !== "a" && d.nInv > 1 ? `<button class="mini cerrar-lugar" data-accion="cerrarLugar" data-k="${k}" title="Cerrar este lugar: quien esté sentado pasa a mirar">✕</button>` : ""}
      ${uid ? (mio ? `<button data-accion="levantarse" title="Deja tu lugar libre (lo jugará un bot)">Levantarme</button>` : soyAnfitrion() && d.estado === "lobby" ? `<button data-accion="liberarAsiento" data-k="${k}" title="Deja este lugar libre; la persona sigue en la sala">Liberar</button>` : "") : `<button data-accion="sentarse" data-k="${k}">Sentarme</button>`}</li>`;
  }).join("");
  const nI = d.nInv;
  // Lugares cerrados: hasta 4 investigadores; el anfitrión abre o cierra lugares sin salir de la sala.
  const cerrados = [];
  for (let i = nI; i < 4; i++) cerrados.push(`<li class="asiento cerrado" style="--c:${COLORES_INV[i]}"><span class="punto"></span><span class="a-lugar">Investigador ${i + 1}</span><span class="a-quien">Lugar cerrado</span>${soyAnfitrion() && d.estado === "lobby" && i === nI ? `<button data-accion="abrirLugar">Abrir lugar</button>` : ""}</li>`);
  const sentados = new Set(Object.values(d.asientos).filter(Boolean));
  const espect = Object.entries(jug).filter(([id]) => !sentados.has(id)).map(([id, j]) => esc(j.nombre) + (id === MI_ID ? " (tú)" : ""));
  const mesaCtl = "";
  const presentes = Object.entries(jug).map(([id, j]) => esc(j.nombre) + (id === MI_ID ? " (tú)" : "")).join(", ");
  $("#lobby").innerHTML = `<div class="portada lobby-caja">
    <p class="fin-eti">Código de la sala</p><h2 class="codigo">${esc(SALA.codigo)}</h2>
    <div class="fila centro"><button data-accion="copiarCodigo">Copiar código</button></div>
    ${soyAnfitrion() ? `<p class="nota">Invita a tus amigos por correo desde <b>Compartir</b> (basta con el nivel de lector). Quien entra solo con el enlace público no puede conectarse a la sala.</p>` : ""}
    ${reglasHTML(d)}
    ${marcadorSalaHTML(d)}
    ${soyAnfitrion() && d.estado !== "lobby" && !MESA ? `<div class="retomar"><p><b>Hay una partida en curso en esta sala.</b> Si se cerró tu pestaña, puedes retomarla donde iba.</p><div class="fila centro"><button class="primario" data-accion="retomarSala">▶ Retomar la partida</button><button data-accion="terminarSala">Terminarla y volver a la sala</button></div></div>` : ""}
    ${mesaCtl}
    <ul class="asientos">${filas}${cerrados.join("")}</ul>
    ${espect.length ? `<p class="nota espectadores">👁 Mirando sin lugar: ${espect.join(", ")}. Si empieza la noche así, verán la partida como espectadores.</p>` : ""}
    <p class="nota">En la sala: ${presentes || "nadie todavía"}. Los lugares vacíos los juega un bot.</p>
    ${soyAnfitrion()
      ? `<button class="primario" data-accion="iniciarSala" ${off(reglasDe(d).quien === "libre" && !miAsiento(), "Siéntate en algún lugar para empezar.")}>Empezar la noche</button>${reglasDe(d).quien === "libre" && !miAsiento() ? `<p class="nota">Siéntate en algún lugar para empezar.</p>` : ""}<p class="nota">Eres el anfitrión: la partida corre en tu navegador. No cierres esta pestaña mientras juegan.</p>`
      : SALA.via === "cuarto" && !anfitrionPresente() ? `<p class="nota" style="color:#ffb4a8">El anfitrión no te escucha todavía. Si no te asigna lugar en unos segundos, pídele que te dé permiso de Contribuidor o Editor en Compartir.</p>`
      : true ? `<p class="espera"><span class="latido"></span>Esperando a que el anfitrión empiece…</p>` : `<p class="espera"><span class="latido"></span>El anfitrión no está conectado ahora mismo.</p>`}
    <div class="fila centro"><button data-accion="salirSala">Salir de la sala</button></div></div>`;
}

// El anfitrión corre el motor, publica las vistas y aplica las acciones remotas.
async function iniciarComoAnfitrion(reanudar = null) {
  let d = SALA.datos;
  const codigo = SALA.codigo;
  const reglas = reglasDe(d);
  let inicio, estadoPrevio = null;
  if (reanudar) {
    d = { ...d, asientos: reanudar.asientos };
    inicio = reanudar.inicio;
    estadoPrevio = JSON.parse(reanudar.estado);
  } else {
    inicio = Date.now();
    if (reglas.modo === "cadaQuien" && reglas.sesion) reglas.quien = "rotacion"; // en la tarde en la casona, el ánima rota
    if (reglas.quien !== "libre") {
      // Rotación o dado: entre la gente de la sala, uno es el ánima y el resto se reparte los lugares.
      const gente = Object.entries(SALA.jugadores).sort((x, y) => (x[1].t || 0) - (y[1].t || 0)).map(([id]) => id).slice(0, d.nInv + 1);
      if (!gente.includes(MI_ID)) gente.unshift(MI_ID);
      const ia = reglas.quien === "rotacion" ? (d.rotacion || 0) % gente.length : Math.floor(Math.random() * gente.length);
      const anima = gente[ia], resto = gente.filter((x) => x !== anima);
      const asientos = { a: anima };
      for (let i = 0; i < d.nInv; i++) asientos[i] = resto[i] || null;
      d = { ...d, asientos };
      const quien = SALA.jugadores[anima]?.nombre || "alguien";
      const texto = reglas.quien === "dado" ? `🎲 El dado eligió a ${quien} como el ánima.` : `🔄 Por rotación, esta noche ${quien} es el ánima.`;
      await DB.doc("salas/" + codigo).update({ asientos, rotacion: (d.rotacion || 0) + 1, anuncio: { t: Date.now(), texto } });
    }
  }
  const nombres = [];
  for (let i = 0; i < d.nInv; i++) {
    const uid = d.asientos[i];
    nombres.push(uid ? SALA.jugadores[uid]?.nombre || `Investigador ${i + 1}` : PERSONAJES[i].nombre + " (bot)");
  }
  const humanos = new Set(Object.keys(d.asientos).filter((k) => d.asientos[k]));
  const yoK = Object.keys(d.asientos).find((k) => d.asientos[k] === MI_ID);
  if (yoK === undefined) return aviso("No tienes lugar en esta partida.");
  const yo = yoK === "a" ? ANIMA : Number(yoK);
  const escritores = {};
  for (const k of Object.keys(d.asientos)) escritores[k] = escritor(DB.doc(`salas/${codigo}/vistas/${k}`));
  escritores.publico = escritor(DB.doc(`salas/${codigo}/vistas/publico`)); // para quien mira sin lugar
  const respaldo = escritor(DB.doc(`data/users/${MI_ID}/sala_${codigo}`));
  let motor = null;
  const publicar = () => {
    if (!motor) return;
    for (const k of Object.keys(d.asientos)) {
      if (!d.asientos[k] || d.asientos[k] === MI_ID) continue;
      escritores[k]({ vista: JSON.stringify(motor.vista(k === "a" ? ANIMA : Number(k))), inicio, limite: LIMITE, t: Date.now() });
    }
    escritores.publico({ vista: JSON.stringify(motor.vista(ESPECTADOR)), inicio, limite: 0, t: Date.now() });
    respaldo({ estado: JSON.stringify(motor.S), asientos: d.asientos, inicio, t: Date.now() });
    if (motor.S.ganador && !publicar.contada) {
      publicar.contada = true;
      const cambios = { estado: "fin" };
      if (reglas.modo === "cadaQuien" && reglas.sesion) {
        // Almas de esta partida al marcador de la tarde (las claves son los jugadores, los bots por nombre).
        const llave = (k) => d.asientos[k] || "bot:" + nombres[Number(k)];
        const v = motor.vista(ANIMA);
        const r = almasDePartida(v, (a) => llave(a), llave("a"));
        const prev = d.marcador || {};
        const marc = { ...prev };
        for (const [k, n] of Object.entries(r.almas)) marc[k] = { almas: (marc[k]?.almas || 0) + n, aciertos: (marc[k]?.aciertos || 0) + (r.aciertos[k] ? 1 : 0), comoAnima: (marc[k]?.comoAnima || 0) + (r.animaGano && k === llave("a") ? 1 : 0), nombre: marc[k]?.nombre || (k.startsWith("bot:") ? k.slice(4) : SALA.jugadores[k]?.nombre || "Jugador") };
        for (const k of Object.keys(d.asientos)) { const key = llave(k); if (!marc[key]) marc[key] = { almas: 0, aciertos: 0, comoAnima: 0, nombre: key.startsWith("bot:") ? key.slice(4) : SALA.jugadores[key]?.nombre || "Jugador" }; }
        cambios.marcador = marc;
        cambios.partidas = (d.partidas || 0) + 1;
      }
      DB.doc("salas/" + codigo).update(cambios).catch(() => {});
    }
  };
  // Reloj por decisión: si una persona se pasa del tiempo, un bot decide por ella esa vez.
  let relojClave = "", relojT = 0;
  const vigilar = () => {
    const S = motor.S, p = S.pendiente;
    const pend = p && !S.ganador ? p.quien.filter((a) => humanos.has(clave(a)) && !(p.resp && a in p.resp)) : [];
    if (!reglas.tiempo || !pend.length) { LIMITE = 0; relojClave = ""; clearTimeout(relojT); return; }
    const k = p.tipo + "|" + p.quien.join(",") + "|" + S.bitacora.length;
    if (k === relojClave) return;
    relojClave = k;
    LIMITE = Date.now() + reglas.tiempo * 1000;
    clearTimeout(relojT);
    relojT = setTimeout(() => {
      const q = motor.S.pendiente;
      if (!q || relojClave !== k) return;
      for (const a of q.quien.filter((x) => humanos.has(clave(x)) && !(q.resp && x in q.resp))) {
        if (motor.forzar(a)) aviso(`Se acabó el tiempo de ${a === ANIMA ? "el ánima" : motor.S.inv[a].nombre}: decidió un bot por esta vez.`);
      }
    }, reglas.tiempo * 1000 + 300);
  };
  motor = crearMotor({ nInv: d.nInv, nombres, humanos, estado: estadoPrevio, anima: reglas.anima !== "azar" ? reglas.anima : null, modo: reglas.modo, vaso: !!reglas.vaso, objetos: !!reglas.objetos, testigos: !!reglas.testigos, reparto: reglas.reparto || "robar", lectura: !!reglas.lectura, cartaInicial: reglas.cartaInicial !== false,
    alCambiar: () => { vigilar(); recibir(motor.vista(yo)); publicar(); } });
  const aplicarRemota = (uid, a) => {
    if (!a || a.inicio !== inicio) return;
    const k = Object.keys(d.asientos).find((x) => d.asientos[x] === uid);
    if (k === undefined) return;
    try { motor.actuar({ ...JSON.parse(a.accion), quien: k === "a" ? ANIMA : Number(k) }); } catch (e) { /* acción vieja o inválida */ }
  };
  // Al retomar, las jugadas que ya estaban en la sala son viejas: se anotan sin aplicarlas.
  if (reanudar && SALA.cuarto) for (const p of SALA.cuarto.peers()) { const uid = p.by || p.presence?.id; if (uid && p.presence?.acc) (SALA.vistos[uid] ||= {}).acc = p.presence.acc.n; }
  SALA.alAccion = aplicarRemota;
  // Invitados con permiso de edición y sin cuarto en vivo escriben su jugada en db.
  const ultimos = {};
  let primeraFoto = !!reanudar;
  const desAcc = DB.collection(`salas/${codigo}/acciones`).onSnapshot((q) => {
    for (const doc of q.docs) {
      const a = doc.data();
      if (!a || ultimos[doc.id] === a.n) continue;
      ultimos[doc.id] = a.n;
      if (!primeraFoto) aplicarRemota(doc.id, a);
    }
    primeraFoto = false;
  });
  await DB.doc("salas/" + codigo).update({ estado: "juego", inicio, asientos: d.asientos });
  MESA = { modo: "anfitrion", yo, id: "sala-" + codigo + "-" + inicio, enviar(a) { motor.actuar({ quien: yo, ...a }); }, salir() { motor.detener(); desAcc(); clearTimeout(relojT); LIMITE = 0; } };
  entrarAlJuego();
  vigilar();
  recibir(motor.vista(yo));
  publicar();
  motor.avanzar();
  if (SALA.cuarto) atenderInvitados(SALA.cuarto.peers());
}

function entrarComoInvitado() {
  const d = SALA.datos;
  let k = miAsiento();
  const mira = k === undefined;
  if (mira) { k = "publico"; aviso("La partida empezó sin lugar para ti: entras como espectador."); }
  const yo = mira ? ESPECTADOR : k === "a" ? ANIMA : Number(k);
  let n = 0;
  const cuarto = SALA.cuarto, codigo = SALA.codigo, nombre = SALA.nombre;
  let via = SALA.via;
  const accRef = DB.doc(`salas/${codigo}/acciones/${MI_ID}`);
  MESA = {
    modo: mira ? "espectador" : "invitado", yo, id: "sala-" + codigo + "-" + d.inicio,
    enviar(a) {
      if (mira) return;
      n++;
      const acc = { n: Date.now() + "-" + n, accion: JSON.stringify(a), inicio: d.inicio };
      const porCuarto = () => cuarto ? cuarto.presence({ sala: codigo, id: MI_ID, nombre, acc }) : Promise.reject(new Error("sin conexión"));
      const envio = via === "db" ? accRef.set(acc).catch(() => { via = "cuarto"; return porCuarto(); }) : porCuarto();
      envio.catch(() => { enviando = false; pintar(); aviso("No se pudo enviar tu jugada. Revisa tu conexión."); });
      sel = []; modo = null;
      enviando = true;
      pintar();
    },
    salir() { des(); },
  };
  const des = DB.doc(`salas/${codigo}/vistas/${k}`).onSnapshot((snap) => {
    const x = snap.data();
    if (x?.vista && x.inicio === d.inicio) { enviando = false; LIMITE = x.limite || 0; recibir(JSON.parse(x.vista)); }
  });
  entrarAlJuego();
  LIMITE = 0;
  $("#panel").innerHTML = `<p class="espera"><span class="latido"></span>Conectando con el anfitrión…</p>`;
}
let enviando = false;

function salirDeSala() {
  SALA?.des.forEach((f) => { try { f(); } catch {} });
  SALA = null;
}

// ------------------------------------------------------------------ recibir una vista

function entrarAlJuego() {
  mostrar("juego");
  if (!escena) escena = crearEscena($("#lienzo"), { alPulsarAyuda: () => abrirAyuda(0), alPulsarMisCartas: () => abrirMisCartas(), alPulsarRol: (a) => abrirRol(a), alPulsarVelar: (a) => abrirVelar(a) });
  vistos = -1;
  V = null;
  sel = []; modo = null;
  claveNotas = "notas_" + MESA.id;
  albaMax = 1;
  HIST = []; SERIE = []; histMax = -1;
  notas = leer(claveNotas, { ev: {}, tachadas: [] });
}

let finListo = null, finT = 0, finVisto = null, menuBarra = false;
function recibir(v) {
  if (!MESA) return;
  const primera = !V;
  if (primera && v.ganador) finVisto = MESA.id; // al recargar una partida terminada, el cartel sale de inmediato
  const antes = V;
  V = v;
  const pistasNuevas = marcarPistasHabilidad(v);
  registrar(v);
  if (!primera) sonarCambios(antes, v);
  escena.actualizar(v, { reiniciar: primera });
  const ult = v.bitacora.length ? v.bitacora[v.bitacora.length - 1].i : -1;
  if (vistos < 0) vistos = ult;
  for (const e of v.bitacora) if (e.i > vistos && e.e) { escena.animar(e.e, v); if (!primera) sonar(e.e, v); }
  // Lo que hace un rol se avisa en pantalla, sin tener que leer la bitácora.
  if (!primera) for (const e of v.bitacora) if (e.i > vistos && e.tipo === "rol") aviso(e.txt, "rol");
  const nuevos = primera ? [] : v.bitacora.filter((e) => e.i > vistos && e.e).map((e) => e.e);
  vistos = Math.max(vistos, ult);
  if (!v.pendiente?.quien.includes(MESA.yo)) { sel = []; if (modo && modo.tipo !== "pregunta") modo = null; }
  pintar();
  if (!primera) efectos2D(antes, v, nuevos, pistasNuevas);
  else abrirEspejoPendiente(v);
}

// ------------------------------------------------------------------ efectos en pantalla (feedback sin leer la bitácora)

const MOV_REDUCIDO = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
function efectos2D(antes, v, eventos, pistasNuevas) {
  try {
    // 1) Cartas que se ven en un espejo: vuelan a tu pantalla y regresan al continuar.
    abrirEspejoPendiente(v);
    // 2) Evidencias nuevas en el bloc: la ficha vuela desde la mesa.
    const vuelan = new Map();
    for (const e of v.confirmadas) if (!antes.confirmadas.includes(e)) vuelan.set(e, "si");
    for (const e of v.descartadas) if (!antes.descartadas.includes(e)) vuelan.set(e, "no");
    for (const e of eventos) {
      if ((e.k === "rol" && e.ev !== undefined && e.r) && !vuelan.has(e.ev)) vuelan.set(e.ev, e.r === "si" ? "si" : "no");
      if (e.k === "tarot" && !vuelan.has(e.ev)) vuelan.set(e.ev, "no");
      // Lo que el ánima le muestra a un espíritu, o lo que un aliado susurra, llega a tu bloc.
      if ((e.k === "muestra" || e.k === "susurro") && e.ev !== undefined && e.a === MESA.yo && !vuelan.has(e.ev)) vuelan.set(e.ev, "si");
    }
    // Apuesta final de Sálvese quien pueda: carteles que cuentan qué pasa.
    for (const e of eventos) {
      if (e.k === "apuesta") cartel("Apuesta final", `<p>Despunta el Alba. Cada investigador apuesta <b>en secreto</b> a un ánima, aunque no tenga evidencias.</p><ul><li>Acertar con <b>al menos 1 evidencia</b>: ganas.</li><li>Acertar <b>sin evidencias</b>: el ánima, furiosa, desata su Espanto. Ganas solo si sobrevives.</li></ul>`, "alba");
      if (e.k === "apuestas") {
        const a = ANIMA_POR_ID[e.anima];
        cartel("Se revelan las apuestas", `<div class="cartel-apuestas">${e.lista.map((x) => `<figure class="${x.acierta ? "bien" : "mal"}"><img src="${ARTE("id_" + x.anima)}" alt=""><figcaption><b>${esc(v.inv[x.de].nombre)}</b><br>${esc(ANIMA_POR_ID[x.anima].nombre)}<br>${x.acierta ? (x.prueba ? "✓ con pruebas" : "✓ sin pruebas") : "✗"}</figcaption></figure>`).join("")}</div><p class="cartel-anima"><img src="${ARTE("id_" + a.id)}" alt=""><span>Era <b>${esc(a.nombre)}</b>.</span></p>`, "revelar");
      }
      if (e.k === "apuestaEspanto") {
        const a = ANIMA_POR_ID[e.anima], nombres = e.aciertan.map((x) => esc(v.inv[x].nombre)).join(" y ");
        const soloYo = e.aciertan.length === 1 && e.aciertan[0] === MESA.yo, varios = e.aciertan.length > 1;
        cartel(soloYo ? "¡Descubriste al ánima!" : "¡El ánima fue descubierta!", soloYo
          ? `<p>Adivinaste que era <b>${esc(a.nombre)}</b> sin una sola prueba.</p><p>El ánima, enojada, te atrapa y desata su Espanto: <b>${esc(a.espanto.nombre)}</b>. Si te defiendes y sigues en pie, ganas.</p>`
          : `<p><b>${nombres}</b> ${varios ? "detectaron" : "detectó"} a ${esc(a.nombre)} sin una sola prueba.</p><p>El ánima, enojada, ${varios ? "los" : "lo"} atrapa y desata su Espanto: <b>${esc(a.espanto.nombre)}</b>. Si ${varios ? "alguno se defiende" : "se defiende"} y sigue en pie, gana.</p>`, "peligro", "es_" + a.id);
      }
    }
    if (v.ganador && !antes.ganador && v.bitacora.some((x) => x.e?.k === "apuestaEspanto")) {
      const gan = v.ganadores ?? [];
      const gYo = (v.ganadores ?? []).includes(MESA.yo);
      cartel(v.ganador === "anima" ? "El Espanto los alcanzó" : gYo ? "¡Sobreviviste!" : "¡Sobrevivió!", v.ganador === "anima" ? `<p>Nadie que acertó quedó en pie. El ánima gana.</p>` : `<p><b>${gan.map((x) => esc(v.inv[x].nombre)).join(" y ")}</b> ${gan.length > 1 ? "resistieron" : "resistió"} el Espanto y ${gan.length > 1 ? "ganan" : "gana"}.</p>`, v.ganador === "anima" ? "peligro" : "alba");
    }
    // Tablilla: el puntero se desliza a la respuesta del espíritu.
    const resp = eventos.find((e) => e.k === "respuesta");
    if (resp) mostrarTablilla(v.inv[resp.de]?.nombre ?? "El espíritu", resp.valor);
    // Anuncio del vaso: un globo sobre el vaso con lo que dice el ánima.
    const an = eventos.find((e) => e.k === "anuncio" && e.dicho) ?? eventos.find((e) => e.k === "anuncio");
    if (an) globo(escena.aPantalla("vaso"), an.dicho ? { si: "¡Sí!", no: "No", nada: "Nada" }[an.dicho] : "…en secreto", an.dicho ?? "secreto");
    // Mano del mono: el dado decide.
    const mm = eventos.find((e) => e.k === "manoMono");
    if (mm) setTimeout(() => globo(escena.aPantalla(mm.de), `🎲 ${mm.v} · ${mm.v <= 3 ? "la mano cobra" : "¡revive!"}`, mm.v <= 3 ? "no" : "si"), 1000);
    // Reloj del Alba: late cuando baja el mazo.
    if (v.nMazoInv < antes.nMazoInv) {
      const b = $(".b-alba");
      if (b) { b.classList.remove("late"); void b.offsetWidth; b.classList.add("late"); }
    }
    if (MESA.yo !== ANIMA) for (const e of pistasNuevas) if (!vuelan.has(e)) vuelan.set(e, "duda");
    let k = 0;
    for (const [e, est] of vuelan) setTimeout(() => fichaAlBloc(e, est), 700 + k++ * 260);
    // 3) Cordura que sube o baja: el número flota sobre el retrato.
    v.inv.forEach((q, i) => {
      const d = q.c - (antes.inv[i]?.c ?? q.c);
      if (d && (q.vivo || antes.inv[i]?.vivo)) setTimeout(() => numeroFlotante(i, d), 350);
    });
  } catch (err) { console.warn("efectos", err); }
}

function capaEfectos() {
  let c = $("#efectos");
  if (!c) { c = document.createElement("div"); c.id = "efectos"; document.body.appendChild(c); }
  return c;
}
function fichaAlBloc(e, est) {
  const destino = $(`#bloc [data-ev="${e}"]`);
  const r = destino?.getBoundingClientRect();
  const fin = r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: innerWidth - 40, y: innerHeight / 2 };
  const marca = { si: "✓", no: "✗", duda: "?" }[est];
  const f = document.createElement("div");
  f.className = `ficha-vuela ev-${est}`;
  f.innerHTML = `<span class="m">${marca}</span>${ico("ev_" + e)}${esc(EVIDENCIAS[e])}`;
  f.style.left = innerWidth / 2 + "px"; f.style.top = innerHeight * 0.42 + "px";
  capaEfectos().appendChild(f);
  const llegar = () => {
    f.remove();
    const b = $(`#bloc [data-ev="${e}"]`);
    if (b) { b.classList.remove("destello"); void b.offsetWidth; b.classList.add("destello"); setTimeout(() => b.classList.remove("destello"), 1400); }
  };
  if (MOV_REDUCIDO()) return setTimeout(llegar, 500);
  f.animate([
    { transform: "translate(-50%,-50%) scale(0.4)", opacity: 0 },
    { transform: "translate(-50%,-50%) scale(1.25)", opacity: 1, offset: 0.25 },
    { transform: "translate(-50%,-50%) scale(1.25)", opacity: 1, offset: 0.55 },
    { transform: `translate(calc(-50% + ${fin.x - innerWidth / 2}px), calc(-50% + ${fin.y - innerHeight * 0.42}px)) scale(0.6)`, opacity: 0.9 },
  ], { duration: 1500, easing: "cubic-bezier(.5,0,.3,1)" }).onfinish = llegar;
}
/** Carteles grandes que anuncian lo que pasa. Se muestran en fila: uno tras otro. */
const colaCarteles = [];
function cartel(titulo, html, clase = "", carta = null) {
  colaCarteles.push({ titulo, html, clase, carta });
  if (colaCarteles.length === 1) mostrarCartel();
}
function mostrarCartel() {
  const c = colaCarteles[0];
  if (!c) return;
  const el = document.createElement("div");
  el.id = "cartel";
  el.className = c.clase;
  el.innerHTML = `<div class="cartel-caja" role="dialog" aria-label="${esc(c.titulo)}">${c.carta ? `<img class="cartel-carta" src="${ARTE(c.carta)}" alt="">` : ""}<h2>${esc(c.titulo)}</h2>${c.html}<button class="primario" data-cartel="ok">Continuar</button></div>`;
  document.body.appendChild(el);
  el.querySelector("[data-cartel]").addEventListener("click", () => { el.remove(); colaCarteles.shift(); mostrarCartel(); });
}
/** Globo de diálogo en un punto de la pantalla. */
function globo(p, texto, tipo = "") {
  if (!p) return;
  const g = document.createElement("div");
  g.className = "globo " + tipo;
  g.textContent = texto;
  g.style.left = p.x + "px"; g.style.top = p.y + "px";
  capaEfectos().appendChild(g);
  setTimeout(() => g.remove(), 2600);
}
/** Tablilla espiritista: el puntero se desliza hasta la respuesta. */
function mostrarTablilla(nombre, valor) {
  $("#tablillaFx")?.remove();
  const t = document.createElement("div");
  t.id = "tablillaFx";
  t.innerHTML = `<p>El espíritu de ${esc(nombre)} responde…</p><div class="tab-tablero"><span data-v="si">SÍ</span><span data-v="talvez">TAL VEZ</span><span data-v="no">NO</span><i class="tab-puntero"></i></div>`;
  capaEfectos().appendChild(t);
  const destino = t.querySelector(`[data-v="${valor}"]`), pun = t.querySelector(".tab-puntero"), tab = t.querySelector(".tab-tablero");
  const r = destino.getBoundingClientRect(), rt = tab.getBoundingClientRect();
  const x = r.left + r.width / 2 - rt.left, y = r.top + r.height / 2 - rt.top;
  if (MOV_REDUCIDO()) pun.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;
  else pun.animate([
    { transform: `translate(${rt.width / 2}px, ${rt.height}px) translate(-50%,-50%)` },
    { transform: `translate(${rt.width * 0.3}px, ${rt.height * 0.4}px) translate(-50%,-50%)`, offset: 0.35 },
    { transform: `translate(${rt.width * 0.7}px, ${rt.height * 0.6}px) translate(-50%,-50%)`, offset: 0.65 },
    { transform: `translate(${x}px, ${y}px) translate(-50%,-50%)` },
  ], { duration: 1600, easing: "ease-in-out", fill: "forwards" });
  setTimeout(() => destino.classList.add("elegida"), MOV_REDUCIDO() ? 0 : 1600);
  setTimeout(() => t.remove(), 3400);
}
function numeroFlotante(i, d) {
  const p = i === MESA.yo ? { x: innerWidth / 2, y: innerHeight - 170 } : escena.aPantalla(i);
  if (!p) return;
  const n = document.createElement("div");
  n.className = "num-flota " + (d > 0 ? "sube" : "baja");
  n.textContent = (d > 0 ? "+" : "−") + Math.abs(d);
  n.style.left = p.x + "px"; n.style.top = p.y + "px";
  capaEfectos().appendChild(n);
  setTimeout(() => n.remove(), 1900);
}
/** Si te toca mirar un espejo, sus cartas vuelan a tu pantalla. La partida espera a que le des a Continuar. */
function abrirEspejoPendiente(v, forzar = false) {
  const p = v.pendiente;
  if (p?.tipo !== "espejo" || !p.quien.includes(MESA.yo) || p.yaRespondio || !p.datos) return;
  if ($("#cartasVistas") && !forzar) return;
  const d = p.datos;
  const titulo = d.de === ANIMA ? "Mano del ánima" : `Mano de ${v.inv[d.de]?.nombre ?? "?"}`;
  mostrarCartasVistas(titulo, d.cartas, escena.aPantalla(d.de), () => { if (V?.pendiente?.tipo === "espejo" && V.pendiente.quien.includes(MESA.yo)) responder({ tipo: "espejo" }); });
}
/** Las cartas que muestra un espejo vuelan hasta tu pantalla; al continuar, regresan a su dueño. */
function mostrarCartasVistas(titulo, cartas, desde, alContinuar = () => {}) {
  $("#cartasVistas")?.remove();
  const o = desde ?? { x: innerWidth / 2, y: 80 };
  const capa = document.createElement("div");
  capa.id = "cartasVistas";
  capa.innerHTML = `<div class="cv-caja"><h3>${esc(titulo)}</h3><div class="cv-cartas">${cartas.length ? cartas.map((c) => `<img src="${ARTE(c)}" alt="${esc(cardName(c))}" title="${esc(cardName(c))}" data-vista="${c}">`).join("") : `<p class="nota">No tiene cartas.</p>`}</div><button class="primario" data-cv="ok">Continuar</button></div>`;
  document.body.appendChild(capa);
  const imgs = [...capa.querySelectorAll(".cv-cartas img")];
  const delta = (img) => { const r = img.getBoundingClientRect(); return `${o.x - (r.left + r.width / 2)}px, ${o.y - (r.top + r.height / 2)}px`; };
  const quieto = MOV_REDUCIDO();
  if (!quieto) imgs.forEach((img, j) => img.animate([{ transform: `translate(${delta(img)}) scale(0.2) rotate(-25deg)`, opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 650, delay: j * 90, easing: "cubic-bezier(.2,.8,.3,1.1)", fill: "backwards" }));
  capa.querySelector("[data-cv]").addEventListener("click", () => {
    alContinuar();
    if (quieto) return capa.remove();
    capa.classList.add("cierra");
    const anims = imgs.map((img, j) => img.animate([{ transform: "none", opacity: 1 }, { transform: `translate(${delta(img)}) scale(0.2) rotate(25deg)`, opacity: 0 }], { duration: 520, delay: j * 60, easing: "cubic-bezier(.5,0,.8,.4)", fill: "forwards" }));
    Promise.all(anims.map((a) => a.finished)).finally(() => capa.remove());
    if (!anims.length) capa.remove();
  });
}

function responder(a) {
  try {
    MESA.enviar(a);
  } catch (e) {
    aviso(e.message);
    return;
  }
  sel = []; modo = null;
  pintar();
}

let avisoT = 0;
function aviso(t, tipo = "") {
  const el = $("#aviso");
  el.textContent = t;
  el.className = tipo;
  el.hidden = false;
  clearTimeout(avisoT);
  avisoT = setTimeout(() => (el.hidden = true), 3500);
}

function mostrar(pantalla) {
  for (const id of ["inicio", "lobby", "juego"]) $("#" + id).hidden = id !== pantalla;
  if (pantalla !== "lobby") ocultarOrbes();
  if (pantalla === "inicio") { pintarContinuar(); pintarSalaReciente(); }
}

// ------------------------------------------------------------------ HUD

function pintar() {
  if (!V || $("#juego").hidden) return;
  $("#barraInfo").innerHTML = barraHTML(V);
  $("#mano").innerHTML = manoHTML(V);
  $("#panel").innerHTML = relojHTML(V) + panelHTML(V);
  $("#bitacora").innerHTML = bitacoraHTML(V);
  $("#bitacora").classList.toggle("cerrada", !bitacoraAbierta);
  $("#bloc").innerHTML = blocHTML(V);
  // El cartel del final espera un momento para que se vea el amanecer (o el apagón) en la mesa.
  if (V.ganador && finListo !== MESA.id) {
    if (!finT) finT = setTimeout(() => { finListo = MESA.id; finT = 0; pintar(); }, finVisto === MESA.id || MOV_REDUCIDO() ? 0 : 2600);
  }
  if (!V.ganador) { finListo = null; clearTimeout(finT); finT = 0; }
  $("#fin").hidden = !V.ganador || finListo !== MESA.id;
  if (V.ganador && finListo === MESA.id) { $("#fin").innerHTML = finHTML(V); animarAlmas(); }
  pintarDock();
  document.body.classList.toggle("stream", !!enStream());
}

// Cada ventana se puede minimizar a una pestaña pegada al borde de la pantalla.
const VENTANAS = { bloc: "Bloc", bitacora: "Bitácora", panel: "Acciones", mano: "Mano" };
const LADO = { bloc: "der", bitacora: "der", panel: "der", mano: "izq" };
function pintarDock() {
  document.body.classList.toggle("sin-bloc", !!minim.bloc);
  const p = V?.pendiente;
  const meToca = p && p.quien.includes(yo()) && !p.yaRespondio && !trivialParaMi(p, V);
  for (const k of Object.keys(VENTANAS)) {
    const w = $("#w-" + k);
    if (!w.classList.contains("saliendo")) w.hidden = !!minim[k];
    const t = $("#tab-" + k);
    t.hidden = !minim[k];
    t.classList.toggle("llama", k === "panel" && !!meToca);
  }
  // Cada pestaña queda a la altura donde estaba su ventana; si dos chocan, la de abajo se recorre.
  for (const lado of ["der", "izq"]) {
    const ks = Object.keys(VENTANAS).filter((k) => LADO[k] === lado && minim[k]).sort((a, b) => (minim[a].y ?? 0) - (minim[b].y ?? 0));
    let ultimo = -Infinity;
    for (const k of ks) {
      const y = Math.max(70, minim[k].y ?? innerHeight / 2, ultimo + 54);
      $("#tab-" + k).style.top = Math.min(innerHeight - 30, y) + "px";
      ultimo = y;
    }
  }
}
// La ventana se desliza hacia su borde; la pestaña aparece a la misma altura donde estaba.
function minimizar(k) {
  const w = $("#w-" + k), r = w.getBoundingClientRect();
  const fija = { bloc: 110, bitacora: Math.round(innerHeight * 0.48) }[k]; // lugar original en la columna derecha
  minim[k] = { y: fija && innerWidth > 760 ? fija : Math.round(r.top + Math.min(r.height, 120) / 2) };
  guardar("minim", minim);
  ocultarVista();
  const quieto = matchMedia("(prefers-reduced-motion: reduce)").matches;
  w.style.setProperty("--salida", LADO[k] === "der" ? `${innerWidth - r.left + 20}px` : `${-(r.right + 20)}px`);
  w.classList.add("saliendo");
  setTimeout(() => { w.classList.remove("saliendo"); pintarDock(); }, quieto ? 0 : 320);
}
function restaurar(k) {
  minim[k] = false;
  guardar("minim", minim);
  pintarDock();
  const w = $("#w-" + k);
  w.style.setProperty("--salida", LADO[k] === "der" ? "110%" : "-110%");
  w.classList.add("entrando");
  setTimeout(() => w.classList.remove("entrando"), 340);
}

const yo = () => MESA.yo;
const esEspectador = () => MESA?.yo === ESPECTADOR;
function manoMia(v = V) { return yo() >= 0 ? v.inv[yo()].mano || [] : yo() === ANIMA ? v.manoAnima || [] : []; }

function barraHTML(v) {
  const t = v.turno;
  const quien = t.de === "anima" ? (yo() === ANIMA ? "Tu turno, ánima" : "Turno del ánima")
    : t.de === "espiritu" ? (t.asiento === yo() ? "Tu turno como espíritu" : `Turno del espíritu de ${v.inv[t.asiento].nombre}`)
    : t.de === "investigador" ? (t.asiento === yo() ? "Tu turno" : `Turno de ${v.inv[t.asiento].nombre}`)
    : t.de === "alba" ? "El Alba" : t.de === "espanto" ? "¡Espanto!" : "Preparación";
  const mi = yo() === ANIMA ? null : esEspectador() ? "Estás mirando la partida" : v.inv[yo()].vivo ? `Eres ${v.inv[yo()].nombre} · cordura ${v.inv[yo()].c}` : `Eres el espíritu de ${v.inv[yo()].nombre}`;
  return `<div class="b-turno">${esc(quien)}</div>
    <div class="b-alba${v.nMazoInv <= 8 ? " cerca" : ""}" title="Cartas que quedan en el mazo antes de que despunte el Alba">${solAlba(v.alba ? 1 : 1 - v.nMazoInv / (albaMax = Math.max(albaMax, v.nMazoInv)))}<b>${v.nMazoInv}</b><span>para el Alba</span></div>${v.lecturaQuedan ? `<div class="b-lectura" title="Cartas de lectura que quedan antes de rebarajar. Las que ya salieron no vuelven hasta entonces.">${[1, 2, 3, 4, 5, 6].map((n) => `<i class="${v.lecturaQuedan.includes(n) ? "" : "salio"}">${n}</i>`).join("")}</div>` : ""}
    <div class="b-dato">✓ ${v.confirmadas.length} confirmada${v.confirmadas.length === 1 ? "" : "s"}</div>
    ${yo() >= 0 ? corduraHUD(v.inv[yo()]) : ""}
    <div class="b-yo">${mi === null ? `Eres el ánima: ${sec(esc(ANIMA_POR_ID[v.anima].nombre))}` : esEspectador() ? `👁 ${esc(mi)}` : `<img class="avatar" src="${v.inv[yo()].rol ? `arte/avatar_rol_${arteRol(v.inv[yo()].rol)}_${v.inv[yo()].vivo ? "vivo" : "muerto"}` : `arte/avatar_${personajesDe(v.inv)[yo()]}`}.webp" alt="">${esc(mi)}`}</div>
    ${yo() === ANIMA && !v.ganador ? `<div class="b-stream"><button class="${stream ? "on" : ""}" data-accion="stream" aria-pressed="${stream}" title="Difumina tu identidad, tus evidencias y tus habilidades para transmitir en vivo">🎥 Modo stream</button>${stream ? `<button data-accion="espiar" title="Muestra lo oculto 6 segundos (¡ojo, también sale en la transmisión!)">👁 Mirar</button>` : ""}</div>` : ""}
    <div class="b-botones${menuBarra ? " abierto" : ""}"><button class="b-menu" data-accion="menuBarra" aria-expanded="${menuBarra}" aria-label="Opciones">☰</button><div class="b-items"><button class="icono" data-accion="girarIzq" aria-label="Girar la cámara a la izquierda" title="Girar (o arrastra la mesa)">⟲</button><button class="icono" data-accion="girarDer" aria-label="Girar la cámara a la derecha" title="Girar (o arrastra la mesa)">⟳</button><button class="icono" data-accion="alzar" data-d="0.5" aria-label="Subir la cámara" title="Subir la cámara (o arrastra hacia arriba)">⤒</button><button class="icono" data-accion="alzar" data-d="-0.5" aria-label="Bajar la cámara" title="Bajar la cámara">⤓</button>${esEspectador() ? "" : `<button data-accion="misCartas" title="${yo() === ANIMA ? "Tu identidad, tu Espanto, tus evidencias y tus habilidades" : "Tu rol, tu mano y, como espíritu, tus cartas de espíritu"}">${ico("ui_cartas")}Mis cartas</button>`}${MESA.modo === "local" || MESA.modo === "anfitrion" ? `<button data-accion="velocidad" title="Velocidad de los bots: cuánto esperan antes de jugar" aria-label="Velocidad de los bots: ${velocidad()}x">⏵ <span class="m-eti">Velocidad de los bots: </span>${velocidad()}x</button>` : ""}<button data-accion="ayuda">Consulta</button><button data-accion="salirMesa">${MESA.modo === "local" ? "Salir" : "Sala"}</button><button class="solo-movil" data-accion="musica">${MUSICA.mudo ? "🔇 Activar sonido" : "🔊 Silenciar"}</button></div></div>`;
}

// Tu cordura en grande: diez fichas de tu color, las perdidas se apagan; con 4 o menos laten en rojo.
function corduraHUD(q) {
  if (!q.vivo) return `<div class="b-cordura espiritu" title="Eres un espíritu">${ico("ui_espiritu")} <span>espíritu</span></div>`;
  const color = COLORES_INV[q.asiento];
  const fichas = Array.from({ length: 10 }, (_, k) => `<i class="${k < q.c ? "on" : ""}"></i>`).join("");
  return `<div class="b-cordura${q.c <= 4 ? " peligro" : ""}" style="--c:${color}" title="Tu cordura: ${q.c} de 10${q.c <= 4 ? ". ¡Te pueden cazar!" : ""}"><span class="fichas">${fichas}</span><b>${q.c}</b><span>cordura</span></div>`;
}

// El sol de la esquina se llena conforme se acaba el mazo: azul de noche que se vuelve amarillo de amanecer.
function solAlba(p) {
  p = Math.max(0, Math.min(1, p));
  // azul noche → violeta → rosa de madrugada → amarillo (el tono gira pasando por el amanecer)
  const color = `hsl(${Math.round(228 + 177 * p) % 360}, ${Math.round(68 + 32 * p)}%, ${Math.round(62 + 3 * p)}%)`;
  const rayos = Array.from({ length: 10 }, (_, k) => {
    const a = -Math.PI / 2 + (k / 10) * Math.PI * 2, on = k / 10 < p;
    return `<line x1="${20 + Math.cos(a) * 13}" y1="${20 + Math.sin(a) * 13}" x2="${20 + Math.cos(a) * 18}" y2="${20 + Math.sin(a) * 18}" stroke="${color}" stroke-width="2.6" stroke-linecap="round" opacity="${on ? 1 : 0.18}"/>`;
  }).join("");
  const alto = 18 * p;
  return `<svg class="sol" viewBox="0 0 40 40" width="34" height="34" aria-hidden="true"><defs><clipPath id="solLleno"><rect x="0" y="${29 - alto}" width="40" height="${alto}"/></clipPath></defs>
    ${rayos}<circle cx="20" cy="20" r="9" fill="none" stroke="${color}" stroke-width="2"/><circle cx="20" cy="20" r="9" fill="${color}" clip-path="url(#solLleno)"/></svg>`;
}

// Botón apagado que explica por qué: se ve desactivado pero al tocarlo dice qué falta.
const off = (apagado, motivo) => (apagado ? `aria-disabled="true" data-motivo="${esc(motivo)}" title="${esc(motivo)}"` : "");
function explicar(b) {
  const motivo = b.dataset.motivo;
  if (!motivo) return;
  b.classList.remove("niega"); void b.offsetWidth; b.classList.add("niega");
  const caja = b.closest("#panel, .portada, #mano") || document.body;
  let p = caja.querySelector(":scope > .pista");
  if (!p) { p = document.createElement("p"); p.className = "pista"; p.setAttribute("role", "status"); caja.appendChild(p); }
  p.textContent = motivo;
  if (caja === document.body || caja.id === "mano") { p.remove(); aviso(motivo); }
}

function cartaHTML(c, i, { seleccionable, marcada }) {
  return `<div class="carta-caja${marcada ? " sel" : ""}${isHab(c) ? " secreto" : ""}">
    <button class="carta" data-carta="${i}" ${off(!seleccionable, V?.ganador ? "La partida terminó." : "Espera tu turno para elegir cartas.")} aria-pressed="${marcada}" aria-label="${esc(cardName(c))}: ${esc(textoDe(c))}">
      <img src="${ARTE(c)}" alt="" draggable="false"><span class="c-tipo t-${tipoDe(c)}">${TIPO[tipoDe(c)]}</span>
      <span class="c-texto">${esc(textoDe(c))}</span>
    </button>
    <button class="c-lupa" data-accion="zoom" data-id="${c}" aria-label="Ver ${esc(cardName(c))} en grande">${ico("ui_lupa")}</button></div>`;
}

function manoHTML(v) {
  if (yo() >= 0 && !v.inv[yo()].vivo) {
    const sabe = v.inv[yo()].sabe;
    return `<div class="espiritu-mano">${sabe !== null ? `<img src="${ARTE("ev" + sabe)}" alt="${esc(EVIDENCIAS[sabe])}">` : ""}<p>Eres un espíritu. ${sabe !== null ? `El ánima te mostró <b>${esc(EVIDENCIAS[sabe])}</b>.` : ""} No puedes hablar: responde con sí, no o tal vez.</p></div>`;
  }
  const mano = manoMia(v);
  if (!mano.length) return `<div class="vacia">Sin cartas en la mano</div>`;
  const p = v.pendiente;
  const puedo = p && p.quien.includes(yo()) && ["investigador", "anima", "guardian", "vigia", "vigiaGuarda"].includes(p.tipo) && !enviando;
  return mano.map((c, i) => cartaHTML(c, i, { seleccionable: puedo, marcada: sel.includes(i) })).join("");
}

/** Ícono SVG de un solo color: se tiñe con el color del texto (máscara CSS). */
const ico = (nombre, extra = "") => `<i class="ico${extra ? " " + extra : ""}" style="--ico:url('iconos/${nombre}.svg')" aria-hidden="true"></i>`;
function chipsEv(evs, accion, activos = [], vista = "") {
  return `<div class="chips">${evs.map((e) => `<button class="chip${activos.includes(e) ? " on" : ""}" aria-pressed="${activos.includes(e)}" data-accion="${accion}" data-ev="${e}"${vista ? ` data-vista="${vista}${e}"` : ""}>${ico("ev_" + e)}${esc(EVIDENCIAS[e])}</button>`).join("")}</div>`;
}
function botonesObjetivo(lista, accion, v) {
  if (!lista.length) return `<p class="nota">No hay a quién elegir.</p>`;
  return `<div class="chips">${lista.map((a) => `<button class="chip" data-accion="${accion}" data-objetivo="${a}"><span class="punto" style="--c:${COLORES_INV[a]}"></span>${esc(v.inv[a].nombre)} · cordura ${v.inv[a].c}</button>`).join("")}</div>`;
}

function relojHTML(v) {
  if (!LIMITE || !v.pendiente || v.ganador || MESA?.modo === "local") return "";
  return `<div class="reloj" data-limite="${LIMITE}"><i></i><span></span></div>`;
}
setInterval(() => {
  for (const r of document.querySelectorAll(".reloj")) {
    const lim = Number(r.dataset.limite), total = (reglasDe(SALA?.datos).tiempo || 90) * 1000;
    const quedan = Math.max(0, lim - Date.now());
    const s = Math.ceil(quedan / 1000);
    r.querySelector("span").textContent = `⏳ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    r.querySelector("i").style.width = Math.min(100, (quedan / total) * 100) + "%";
    r.classList.toggle("urge", s <= 10);
  }
}, 500);

function panelHTML(v) {
  const p = v.pendiente;
  if (v.ganador) return "";
  if (esEspectador()) return `<h3>Modo espectador</h3><p class="nota">No tienes lugar en esta partida: la miras sin ver cartas ocultas. Cuando termine, el anfitrión puede abrirte un lugar.</p>${p ? `<p class="espera"><span class="latido"></span>${esc(esperaTexto(v))}</p>` : ""}`;
  if (!p) return `<p class="espera">…</p>`;
  if (enviando) return `<p class="espera"><span class="latido"></span>Enviando tu jugada…</p>`;
  const mio = p.quien.includes(yo()) && !p.yaRespondio && !trivialParaMi(p, v);
  if (!mio) return `<p class="espera"><span class="latido"></span>${esc(esperaTexto(v))}</p>`;
  const vivos = v.inv.filter((q) => q.vivo);
  switch (p.tipo) {
    case "habilidades":
      return `<h3>Prepara tu mazo</h3><p>Mete en tu mazo una habilidad <b>verdadera</b> (de tus evidencias) y una <b>falsa</b> para engañar.</p>
        <p class="sub">Verdadera</p>${sec(chipsEv(p.datos.propias, "verdadera", [modo?.verdadera], "h"))}
        <p class="sub">Falsa</p>${sec(chipsEv(p.datos.ajenas, "falsa", [modo?.falsa], "h"))}
        <button class="primario" data-accion="confirmarHab" ${off(modo?.verdadera === undefined || modo?.falsa === undefined, modo?.verdadera === undefined ? "Elige primero tu habilidad verdadera." : "Ahora elige tu habilidad falsa.")}>Barajar y empezar</button>`;
    case "investigador": return panelInvestigador(v);
    case "anima": return panelAnima(v);
    case "copal": {
      const m = p.datos?.motivo;
      const que = m === "habilidad" ? "El ánima anuncia una habilidad oculta. Si la bloqueas, no hay pista." : m === "salvar" ? `${v.inv[p.datos.objetivo].nombre} va a morir.` : m === "interferencia" ? "El ánima interfiere una herramienta." : `El ánima juega ${cardName(m)}.`;
      const conCopal = (v.inv[yo()]?.mano || []).includes("copal");
      if (!conCopal && p.datos?.devota === yo()) return `<h3>¿Alzar tu Rosario?</h3><p>${esc(que)}</p><div class="rol-nota"><img src="cartas/rol_devota.webp" alt="" data-vista="rol:padre"><p class="nota"><b>Eres la devota:</b> puedes gastar un Rosario como si fuera copal y cancelar esta carta.</p></div><div class="fila">
        <button class="primario rol-btn" data-accion="copal" data-usar="1"><img class="fam" src="iconos/familia_escudo.webp" alt="">Alzar el Rosario</button><button data-accion="copal" data-usar="0">Dejarlo pasar</button></div>`;
      return `<h3>¿Quemar copal?</h3><p>${esc(que)}</p><div class="fila">
        <button class="primario" data-accion="copal" data-usar="1">${ico("def_copal")}Quemar copal</button><button data-accion="copal" data-usar="0">Dejarlo pasar</button></div>`;
    }
    case "defensa": {
      const op = p.datos.opciones;
      const nombre = { ros: "Rezar el Rosario", esc: "Esconderse", ult: "Ultraje espiritual" };
      const guarda = p.datos.guarda ? `<button class="primario rol-btn" data-accion="defensa" data-con="guarda" title="Una vez por partida: te quedas sin cordura, pero sigues en pie"><img class="fam" src="iconos/familia_escudo.webp" alt="">Aguantar el golpe (te quedas en 0)</button>` : "";
      return `<h3 class="peligro">¡Te cazan!</h3><p>Defiéndete o muere.${p.datos.copalSalva ? " Si no te defiendes, un compañero todavía puede salvarte con copal." : ""}</p>
        ${p.datos.guarda ? `<div class="rol-nota"><img src="cartas/rol_guardaespaldas.webp" alt="" data-vista="rol:guardaespaldas"><p class="nota"><b>Eres el guardaespaldas:</b> puedes aguantar este golpe una vez. Te quedas <b>sin cordura</b>, pero sigues en pie (con 0 no puedes usar herramientas hasta recuperarte).</p></div>` : ""}
        <div class="fila">${guarda}${op.map((o) => `<button class="primario" data-accion="defensa" data-con="${o}">${ico({ ros: "def_ros", esc: "def_esc", ult: "def_ultr" }[o])}${nombre[o]}</button>`).join("")}<button data-accion="defensa" data-con="">Sin defensa</button></div>`;
    }
    case "detective":
      return `<h3>Tu pregunta de detective</h3><div class="rol-nota"><img src="cartas/rol_detective.webp" alt="" data-vista="rol:detective"><p class="nota">Confirmaste una evidencia. <b>Eres el detective:</b> elige otra y pregunta en voz alta si el ánima la tiene.${p.datos.conDado ? " En Sálvese quien pueda, solo responde si sacas 4 o más." : ""} Es una pista: no cuenta para acusar.</p></div>${chipsEv(p.datos.validos, "detectiveEv")}`;
    case "vigia": {
      const n = p.datos.n;
      return `<h3>El vigía ve venir el golpe</h3><div class="rol-nota"><img src="cartas/rol_vigia.webp" alt="" data-vista="rol:vigia"><p class="nota">Te toca descartar ${n} carta${n > 1 ? "s" : ""}. <b>Eres el vigía:</b> en lugar de al azar, eliges tú cuál${n > 1 ? "es" : ""}. Tócala${n > 1 ? "s" : ""} en tu mano.</p></div>
        <div class="fila"><button class="primario" data-accion="vigiaSoltar" ${off(sel.length !== n, `Elige ${n} carta${n > 1 ? "s" : ""} de tu mano (llevas ${sel.length}).`)}>Soltar ${n > 1 ? "estas" : "esta"}</button></div>`;
    }
    case "vigiaGuarda":
      return `<h3>Te cambian toda la mano</h3><div class="rol-nota"><img src="cartas/rol_vigia.webp" alt="" data-vista="rol:vigia"><p class="nota"><b>Eres el vigía:</b> elige 1 carta de tu mano para conservarla; las demás se cambian.</p></div>
        <div class="fila"><button class="primario" data-accion="vigiaConservar" ${off(sel.length !== 1, "Toca una sola carta de tu mano.")}>Conservar esta</button></div>`;
    case "guardaOtro": {
      const t = v.inv[p.datos.objetivo], queda = p.datos.cordura - p.datos.costo;
      return `<h3>${esc(t.nombre)} va a ser cazado</h3><div class="rol-nota"><img src="cartas/rol_guardaespaldas.webp" alt="" data-vista="rol:guardaespaldas"><p class="nota">No tiene con qué defenderse. <b>Eres el guardaespaldas:</b> una vez por partida puedes ponerte frente a él. Pierdes <b>${p.datos.costo} de cordura</b> (quedarías en ${queda}${queda <= 4 ? ", al alcance de una cacería" : ""}) y la cacería se detiene.</p></div>
        <div class="fila"><button class="primario rol-btn" data-accion="guardaOtro" data-usar="1"><img class="fam" src="iconos/familia_escudo.webp" alt="">Proteger a ${esc(t.nombre)}</button><button data-accion="guardaOtro" data-usar="0">No esta vez</button></div>`;
    }
    case "devota": {
      const t = v.inv[p.datos.objetivo];
      return `<h3>${esc(t.nombre)} va a ser cazado</h3><div class="rol-nota"><img src="cartas/rol_devota.webp" alt="" data-vista="rol:padre"><p class="nota">No tiene con qué defenderse. <b>Eres la devota:</b> puedes gastar tu Rosario para rezar por él y la cacería se disipa.</p></div>
        <div class="fila"><button class="primario rol-btn" data-accion="devota" data-usar="1"><img class="fam" src="iconos/familia_escudo.webp" alt="">Rezar por ${esc(t.nombre)}</button><button data-accion="devota" data-usar="0">No esta vez</button></div>`;
    }
    case "tecnico":
      return `<h3>${p.datos.vaso ? "El ánima dice «Nada»" : "Tu herramienta no detecta nada"}</h3><div class="rol-nota"><img src="cartas/rol_tecnico.webp" alt="" data-vista="rol:tecnico"><p class="nota">${p.datos.vaso ? `Bajo el vaso, buscando ${esc(EVIDENCIAS[p.datos.ev])}, el ánima anunció «Nada». Si repites, esa tirada se olvida (aunque fuera mentira) y vuelves a tirar tapado.` : `Sacaste <b>${p.datos.valor}</b> buscando ${esc(EVIDENCIAS[p.datos.ev])}.`} <b>Eres el técnico:</b> ${p.datos.costo ? `puedes ajustar el aparato y repetir el dado pagando <b>${p.datos.costo} de cordura</b> (tienes ${p.datos.cordura}; quedarías en ${p.datos.cordura - p.datos.costo}${p.datos.cordura - p.datos.costo <= 4 ? ", al alcance de una cacería" : ""}).` : "una vez por partida puedes ajustar el aparato y repetir el dado."}</p></div>
        <div class="fila"><button class="primario rol-btn" data-accion="tecnico" data-usar="1"><img class="fam" src="iconos/familia_ojo.webp" alt="">Repetir el dado${p.datos.costo ? ` (−${p.datos.costo} de cordura)` : " (Técnico)"}</button><button data-accion="tecnico" data-usar="0">${p.datos.costo ? "Dejarlo así" : "Guardarlo para después"}</button></div>`;
    case "interferir":
      return `<h3>Interferencia</h3><p>${esc(v.inv[p.datos.asiento].nombre)} busca ${esc(EVIDENCIAS[p.datos.ev])} ${sec(v.animaEv?.includes(p.datos.ev) ? "(¡la tienes!)" : "(no la tienes)")}.</p>
        <div class="fila"><button class="primario" data-accion="interferir" data-usar="1">Interferir</button><button data-accion="interferir" data-usar="0">Dejar</button></div>`;
    case "revelar":
      return `<h3>Un investigador murió</h3><p>Muéstrale en secreto una de tus evidencias a su espíritu.</p>${sec(chipsEv(v.animaEv, "revelar"))}`;
    case "rol": {
      const ops = p.datos.opciones[yo()] || [];
      if (p.yaRespondio) return `<p class="espera"><span class="latido"></span>Esperando a que los demás elijan su rol…</p>`;
      if (p.datos.libre) {
        const todos = Object.keys(ROLES);
        return `<h3>¿Quién eres esta noche?</h3><p>Elige tu rol. Los que ya tomaron otros aparecen apagados. Pasa el cursor para verlo en grande.</p>
          <div class="animas roles-op">${todos.map((r) => { const libre = ops.includes(r); return `<button class="anima-op${libre ? "" : " apagada"}" data-accion="rolElegir" data-rol="${r}" data-vista="rol:${r}" ${libre ? "" : 'disabled aria-disabled="true" title="Ya lo eligió otro investigador"'}><img src="cartas/rol_${arteRol(r)}.webp" alt=""><span>${esc(ROLES[r].nombre)}</span></button>`; }).join("")}</div>`;
      }
      return `<h3>¿Quién eres esta noche?</h3><p>Robaste ${ops.length === 1 ? "este rol" : "estos roles"}. Quédate con uno: estará boca arriba frente a ti.</p>
        <div class="pila">${ops.map((r) => `<button class="opcion-rol" data-accion="rolElegir" data-rol="${r}"><img src="cartas/rol_${arteRol(r)}.webp" alt="" data-vista="rol:${r}"><span class="txt"><b><img class="fam" src="iconos/familia_${FAMILIA_ROL[r]}.webp" alt="">${esc(ROLES[r].nombre)}</b><span>${esc(ROLES[r].texto)}</span></span></button>`).join("")}</div>`;
    }
    case "espejo":
      return `<h3>El espejo</h3><p>Mira bien las cartas. La partida sigue cuando le des a <b>Continuar</b>.</p><button class="primario" data-accion="verEspejo">Ver de nuevo</button>`;
    case "tarot":
      return `<h3>El Tarot habla</h3><p>Sacaron 5 o 6. Di en voz alta una evidencia que <b>no</b> tienes. Elige la que menos les ayude.</p>${chipsEv(p.datos.validos, "tarotEv")}`;
    case "objetivoHabilidad":
      return `<h3>${sec(esc(HABILIDADES[p.datos.carta].nombre))}</h3><p>Elige a tu víctima.</p>${botonesObjetivo(p.datos.validos, "objetivoHab", v)}`;
    case "espiritu":
      if (p.datos?.soloAliado) return `<h3>Turno de aliado</h3><p>Ayudas a ${esc(v.inv[p.datos.aliado].nombre)}.</p>${CARTAS_ESPIRITU}<div class="fila">
        <button class="primario" data-accion="velar" data-objetivo="${p.datos.aliado}" title="Hasta tu siguiente turno pierde 1 menos de cordura cada vez">Velar a mi aliado</button>
        <button data-accion="espiritu" data-tipo="manifestarse" ${off(!p.datos.manifestarse, "Ya no quedan cartas antes del Alba.")} title="Robas 1 carta; si es herramienta, lo que veas se lo dices a tu aliado">Manifestarme</button></div>`;
      return `<h3>Tu turno como espíritu</h3><p>Elige una sola cosa.</p>${CARTAS_ESPIRITU}<div class="fila">
        <button class="primario" data-accion="espiritu" data-tipo="responder">Que me pregunten</button>
        <button data-accion="espiritu" data-tipo="manifestarse" ${off(!p.datos.manifestarse, "Ya no quedan cartas antes del Alba para manifestarte.")} title="Robas 1 carta; si es herramienta, detecta con 5 o 6">Manifestarme</button>
        <button data-accion="espiritu" data-tipo="eco" ${off(!p.datos.eco, "El Eco se usa una vez por partida y solo si hubo un «Nada» reciente.")} title="Repite el dado de un «Nada» reciente">Eco</button>
        <button data-accion="velarModo" class="${modo?.tipo === "velar" ? "on" : ""}" aria-pressed="${modo?.tipo === "velar"}" title="Hasta tu siguiente turno pierde 1 menos de cordura">Velar a un vivo</button></div>
        ${modo?.tipo === "velar" ? botonesObjetivo(vivos.map((q) => q.asiento), "velar", v) : ""}`;
    case "pregunta": {
      const esp = p.datos.espiritu;
      const marcados = modo?.evs ?? [];
      return `<h3>Pregunta al espíritu de ${esc(v.inv[esp].nombre)}</h3><p class="sub">Solo responde sí, no o tal vez. Marca evidencias para preguntar «¿tu evidencia es alguna de estas?».</p>
        ${chipsEv([0, 1, 2, 3, 4, 5, 6], "marcarEv", marcados)}
        <div class="fila"><input id="txtPregunta" type="text" maxlength="120" placeholder="¿Tu evidencia es…?" value="${esc(marcados.length ? "¿Tu evidencia es " + marcados.map((e) => EVIDENCIAS[e]).join(" o ") + "?" : modo?.texto ?? "")}">
        <button class="primario" data-accion="preguntar">Preguntar</button></div>`;
    }
    case "respuesta": {
      const pr = v.preguntas[v.preguntas.length - 1];
      return `<h3>Te preguntan</h3><p class="pregunta">«${esc(pr.texto)}»</p><div class="fila">
        <button class="primario" data-accion="responder" data-valor="si">Sí</button><button data-accion="responder" data-valor="no">No</button><button data-accion="responder" data-valor="talvez">Tal vez</button></div>`;
    }
    case "kitEspiritu":
      return `<h3>Sacaste un Kit de campo</h3><p>Elige qué buscar. Desde el más allá solo detecta con 6.</p>${chipsEv([0, 1, 2, 3, 4, 5, 6], "kitEspiritu")}`;
    case "albaCaza":
      return `<h3>Despunta el Alba</h3><p>Cacería gratis${p.datos.cualquiera ? ": nadie ha muerto, puedes cazar a cualquiera" : " contra alguien con 4 o menos"}.</p>
        ${p.datos.validos.length ? botonesObjetivo(p.datos.validos, "albaCaza", v) : `<button data-accion="albaCaza" data-objetivo="">Nadie está a tu alcance</button>`}`;
    case "albaEspanto":
      if (p.datos?.obligado) return `<h3>¡Te descubrieron!</h3><p>${p.datos.aciertan.map((x) => esc(v.inv[x].nombre)).join(" y ")} ${p.datos.aciertan.length > 1 ? "adivinaron" : "adivinó"} quién eres sin una sola prueba. Desata tu Espanto, ${sec(esc(ANIMA_POR_ID[v.anima].espanto.nombre))}: si no sobreviven, ganas.</p>
        <div class="fila"><button class="primario peligro" data-accion="albaEspanto" data-usar="1">Desatar el Espanto</button></div>`;
      return `<h3>Última oportunidad</h3><p>Antes de la acusación final puedes desatar tu Espanto: ${sec(esc(ANIMA_POR_ID[v.anima].espanto.nombre))}.</p>
        <div class="fila"><button class="primario peligro" data-accion="albaEspanto" data-usar="1">Desatar el Espanto</button><button data-accion="albaEspanto" data-usar="0">Dejar que acusen</button></div>`;
    case "acusacionFinal":
      return v.reglas?.modo === "cadaQuien"
        ? `<h3>Apuesta final</h3><p>Con la primera luz, cada quien apuesta en secreto a un ánima, aunque no tenga evidencias.</p><ul class="nota"><li>Si aciertas y tienes al menos <b>1 evidencia confirmada</b>, ganas.</li><li>Si aciertas <b>sin evidencias</b>, el ánima, furiosa, desata su Espanto: ganas solo si sobrevives.</li></ul>${selectorAnimas("acusarFinal")}`
        : `<h3>Acusación final</h3><p>Con la primera luz, una sola oportunidad. Basta 1 evidencia confirmada.</p>${selectorAnimas("acusarFinal")}`;
    case "aliado":
      return `<h3>Desde el más allá</h3><p>Ya no puedes ganar por tu cuenta, pero sí ayudar a alguien. Pon tu carta de Velar frente a un investigador vivo: lo protegerás, le pasarás lo que sepas y, si gana, compartes su triunfo a medias.</p>${botonesObjetivo(p.datos.validos, "aliado", v)}`;
    case "acusarYa":
      return `<h3>¡Encontraste la prueba!</h3><p>Ya tienes ${v.confirmadas.length} evidencias confirmadas. Puedes acusar ahora mismo, antes de que el siguiente aproveche tu hallazgo. Si fallas, quedas fuera.</p>
        ${selectorAnimas("acusarYa")}<button data-accion="acusarYa" data-anima="">Seguir sin acusar</button>`;
    case "anunciar": {
      const d = p.datos;
      const quien = v.inv[d.asiento].nombre;
      const puede = d.verdad === "no";
      return `<h3>Bajo el vaso</h3><p>${esc(quien)} busca ${esc(EVIDENCIAS[d.ev])}. ${sec(`El dado marca <b>${d.valor}</b>: la verdad es <b>«${{ si: "Sí", no: "No", nada: "Nada" }[d.verdad]}»</b>.`)}</p>
        <p class="sub">Puedes ocultar un «No» diciendo «Nada»${d.falsoSi ? `, y como esta es la evidencia de tu <b>habilidad falsa</b>, también puedes decir «Sí»` : ""}. Si te destapan, pierdes tu próximo turno${d.falsoSi ? " (y un Sí falso deja descartada esa evidencia)" : ""}.</p>
        <div class="fila"><button class="primario" data-accion="anunciar" data-dicho="${d.verdad}">Decir la verdad</button><button data-accion="anunciar" data-dicho="nada" ${off(!puede, d.verdad === "nada" ? "Salió «Nada»: no hay nada que ocultar." : "Un «Sí» no se puede ocultar; solo un «No».")}>Decir «Nada»</button>${d.falsoSi ? `<button data-accion="anunciar" data-dicho="si">Decir «Sí» (farol)</button>` : ""}</div>`;
    }
    case "desafio": {
      const d = p.datos;
      const si = d.dicho === "si";
      const costo = si ? VASO.costoDesafioSi : (v.costoNada ?? VASO.costoDesafio);
      return `<h3>¿Destapar el vaso?</h3><p>El ánima dice <b>«${si ? "Sí" : "Nada"}»</b> sobre ${esc(EVIDENCIAS[d.ev])} (tiró ${esc(v.inv[d.asiento].nombre)}).</p>
        <p class="sub">${si ? "Un «Sí» solo puede ser falso si es la evidencia de su habilidad falsa. Si mintió, el ánima pierde su próximo turno y esa evidencia queda descartada." : "Si mintió y en realidad era un «No», se sabe la verdad y el ánima pierde su próximo turno."} Si dijo la verdad, pierdes ${costo} de cordura.</p>
        <div class="fila"><button class="primario" data-accion="desafio" data-si="1" ${off(v.inv[yo()].c < 1, "No te queda cordura para arriesgarte.")}>Destapar</button><button data-accion="desafio" data-si="0">Creerle</button></div>`;
    }
    case "cucuyDoble":
      return `<h3 class="peligro">Desde la penumbra</h3><p>Hay empate entre los de más cordura al alcance: elige a quién cazar dos veces.</p>${botonesObjetivo(p.datos.validos, "cucuyDoble", v)}`;
    case "guardian":
      return `<h3>Maldición del entierro</h3><p>Devuelve el oro (elige 2 cartas de tu mano) o quédatelo y pierde 3 de cordura.</p>
        <div class="fila"><button class="primario" data-accion="guardianDesc" ${off(sel.length !== 2, "Elige exactamente 2 cartas de tu mano para devolver el oro.")}>Devolver el oro (${sel.length}/2)</button><button data-accion="guardianPerder">Perder 3</button></div>`;
  }
  return `<p>${esc(p.tipo)}</p>`;
}

// El motor contesta solo estas decisiones; aquí solo se evita mostrar botones sin opción real.
function trivialParaMi(p, v) {
  if (p.tipo === "copal") return !manoMia(v).includes("copal") && !(p.datos?.devota === yo() && manoMia(v).includes("ros"));
  if (p.tipo === "defensa") return !p.datos?.opciones?.length && !p.datos?.copalSalva && !p.datos?.guarda;
  if (p.tipo === "interferir") return !(v.manoAnima || []).includes("interferencia");
  return false;
}

function esperaTexto(v) {
  const p = v.pendiente;
  const n = (a) => (a === ANIMA ? "el ánima" : v.inv[a].nombre);
  switch (p.tipo) {
    case "investigador": return `${n(p.quien[0])} decide su jugada…`;
    case "anima": return "El ánima mueve sus cartas en la oscuridad…";
    case "copal": return "Los investigadores deciden si queman copal…";
    case "defensa": return `${n(p.quien[0])} intenta defenderse…`;
    case "tecnico": return `${n(p.quien[0])} revisa su aparato…`;
    case "detective": return `${n(p.quien[0])}, el detective, piensa qué preguntar…`;
    case "vigia": case "vigiaGuarda": return `${n(p.quien[0])}, el vigía, elige qué cartas soltar…`;
    case "devota": return `${n(p.quien[0])}, la devota, decide si reza por alguien…`;
    case "guardaOtro": return `${n(p.quien[0])}, el guardaespaldas, decide si se pone en medio…`;
    case "interferir": return "El ánima escucha la herramienta…";
    case "revelar": return "El ánima le susurra algo al nuevo espíritu…";
    case "espiritu": return `El espíritu de ${n(p.quien[0])} se agita…`;
    case "pregunta": return "Los vivos formulan una pregunta…";
    case "respuesta": return "El espíritu busca la tablilla…";
    case "albaCaza": return "El cielo aclara y el ánima elige a su presa…";
    case "albaEspanto": return p.datos?.obligado ? "El ánima, furiosa, prepara su Espanto…" : "El ánima duda antes del amanecer…";
    case "acusacionFinal": return v.reglas?.modo === "cadaQuien" ? "Cada investigador escribe su apuesta en secreto…" : "Los investigadores eligen su acusación final…";
    case "guardian": return `${n(p.quien[0])} decide si devuelve el oro…`;
    case "anunciar": return "El ánima mira bajo el vaso…";
    case "acusarYa": return `${n(p.quien[0])} encontró una prueba y piensa si acusar…`;
    case "aliado": return `${n(p.quien[0])} elige a quién ayudar desde el más allá…`;
    case "desafio": return "Los investigadores deciden si destapan el vaso…";
    case "cucuyDoble": return "Desde la penumbra, el Cucuy elige a quién acechar dos veces…";
    case "habilidades": return "El ánima prepara su mazo…";
    case "rol": return p.datos?.libre ? `${n(p.quien[0])} elige su rol…` : "Los investigadores eligen su rol…";
    case "tarot": return "El ánima escucha al Tarot…";
    case "espejo": return p.quien[0] === ANIMA ? "El ánima se asoma al Espejo de obsidiana…" : `${n(p.quien[0])} se asoma al Espejo de plata…`;
  }
  return "Esperando…";
}

function panelInvestigador(v) {
  const q = v.inv[yo()];
  const c = q.mano.map((x, i) => [x, i]).filter(([, i]) => sel.includes(i));
  const una = c.length === 1 ? c[0][0] : null;
  const evs = [0, 1, 2, 3, 4, 5, 6].filter((e) => !v.confirmadas.includes(e) && !v.descartadas.includes(e));
  if (modo?.tipo === "objInv") {
    const c0 = q.mano[modo.idx];
    if (c0 === "radio" && modo.objetivo !== undefined) {
      const otras = q.mano.map((x, i) => [x, i]).filter(([, i]) => i !== modo.idx);
      return `<h3>Radio</h3><p>¿Qué carta le pasas a ${esc(v.inv[modo.objetivo].nombre)}?</p><div class="chips">${otras.map(([x]) => `<button class="chip" data-accion="radioDar" data-carta="${x}">${esc(cardName(x))}</button>`).join("")}</div><button data-accion="cancelar">Cancelar</button>`;
    }
    const val = c0 === "te" ? v.inv.filter((x) => x.vivo).map((x) => x.asiento)
      : c0 === "radio" ? v.inv.filter((x) => x.vivo && x.asiento !== yo()).map((x) => x.asiento)
      : v.inv.filter((x) => !x.vivo && !x.fuera).map((x) => x.asiento);
    const pide = c0 === "te" ? "¿A quién le das el Té de tila? (+3 de cordura)" : c0 === "radio" ? "¿A quién le hablas por la radio?" : c0 === "tablilla" ? "¿Con qué espíritu hablas?" : "¿A quién quieres revivir? Si sacas 1–3 en el dado, mueres tú.";
    return `<h3>${esc(cardName(c0))}</h3><p>${pide}</p><div class="chips">${val.map((a) => `<button class="chip" data-accion="objInvObj" data-objetivo="${a}"><span class="punto" style="--c:${COLORES_INV[a]}"></span>${esc(v.inv[a].nombre)}${v.inv[a].vivo ? " · cordura " + v.inv[a].c : " · espíritu"}</button>`).join("")}</div><button data-accion="cancelar">Cancelar</button>`;
  }
  if (modo?.tipo === "kit" || modo?.tipo === "improvisar") {
    const uno = modo.tipo === "improvisar" && sel.length === 1;
    return `<h3>${modo.tipo === "kit" ? "Kit de campo" : uno ? "Improvisar con 1 carta" : "Improvisar"}</h3><p>¿Qué evidencia buscas? Detecta ${uno ? "solo con 6" : "con 5 o 6"} y cuesta 1 de cordura.</p>${chipsEv(evs, modo.tipo === "kit" ? "kitEv" : "impEv")}<button data-accion="cancelar">Cancelar</button>`;
  }
  if (modo?.tipo === "acusar") {
    return `<h3 class="peligro">Acusar</h3><p>¿Quién es? ${v.reglas?.modo === "cadaQuien" ? "Si aciertas, ganas tú solo. Si fallas, quedas fuera de la partida." : "Si fallan, gana el ánima."} Las que tachaste en tu bloc aparecen apagadas.</p>${selectorAnimas("acusar")}<button data-accion="cancelar">Cancelar</button>`;
  }
  const reaccion = una && ["ros", "esc", "ult", "copal"].includes(una);
  const impro = q.rol === "improvisador";
  const nImp = impro && c.length === 1 ? 1 : 2;
  const sinMuertos = una && ["tablilla", "mano"].includes(una) && !v.inv.some((x) => !x.vivo && !x.fuera);
  const herr = una && (isTool(una) || una === "kit");
  const motivo = reaccion ? "Es una reacción: se usa sola cuando la necesitas. Puedes descartarla." : sinMuertos ? "Solo sirve cuando hay un investigador muerto." : una === "radio" && q.mano.length < 2 ? "No te queda otra carta que pasar." : herr && q.sinHerramientas ? "Te escondiste: este turno no puedes usar herramientas." : herr && q.c < 1 ? "Necesitas al menos 1 de cordura." : "";
  const guia = !c.length ? "Toca una carta para elegirla. Toca dos para improvisar o descartarlas." : c.length === 1 ? `Elegiste ${cardName(una)}.` : `Elegiste ${c.length} cartas.`;
  return `<h3>Tu turno</h3><p class="sub">${esc(guia)}</p><div class="fila">
      <button class="primario" data-accion="jugar" ${off(!una || motivo, !c.length ? "Primero toca una carta de tu mano." : c.length > 1 ? "Para jugar elige solo 1 carta. Con 2 puedes improvisar o descartarlas." : motivo)}>Jugar${una ? " " + esc(cardName(una)) : ""}</button>
      <button data-accion="descartar" ${off(!c.length, "Toca las cartas que quieres descartar.")}>Descartar${c.length ? " " + c.length : ""}</button>
      <button data-accion="improvisar" ${off(c.length !== nImp || q.sinHerramientas || q.c < 1, c.length !== nImp ? (impro ? `Como improvisador, elige 1 carta (detecta con 6) o 2 (detecta con 5 o 6). Llevas ${c.length}.` : `Elige exactamente 2 cartas para improvisar (llevas ${c.length}).`) : q.sinHerramientas ? "Te escondiste: este turno no puedes buscar." : "Necesitas al menos 1 de cordura.") || (nImp === 1 ? 'title="Descarta 1 carta y busca: solo detecta con 6"' : 'title="Descarta 2 cartas y busca como con un Kit de campo"')}>Improvisar con ${nImp}</button>
      <button class="peligro" data-accion="acusarModo" ${off(v.confirmadas.length < 2, v.reglas?.modo === "cadaQuien" ? `Para acusar necesitas 2 evidencias confirmadas por ti (llevas ${v.confirmadas.length}).` : `Para acusar necesitan 2 evidencias confirmadas (van ${v.confirmadas.length}).`)}>Acusar</button></div>
      ${motivo ? `<p class="nota">${esc(motivo)}</p>` : ""}${rolHTML(q)}`;
}

const CARTAS_ESPIRITU = `<div class="cartas-espiritu"><img src="cartas/rol_manifestar.webp" alt="Manifestar" data-vista="rol_manifestar" data-accion="verCarta" data-id="rol_manifestar" title="Toca para verla en grande"><img src="cartas/rol_velar.webp" alt="Velar" data-vista="rol_velar" data-accion="verCarta" data-id="rol_velar" title="Toca para verla en grande"></div>`;

function rolHTML(q) {
  const vela = q.vivo && q.veladoPor !== null && q.veladoPor !== undefined
    ? `<div class="rol-nota"><img src="cartas/rol_velar.webp" alt="Velar" data-accion="verVelar" data-a="${q.asiento}" data-vista="rol_velar" title="Toca para verla en grande"><p class="nota"><b>Te vela el espíritu de ${esc(V.inv[q.veladoPor]?.nombre ?? "alguien")}</b>: hasta su siguiente turno pierdes 1 menos de cordura cada vez.</p></div>` : "";
  return vela + rolSoloHTML(q);
}
function rolSoloHTML(q) {
  if (!q.rol) return "";
  const r = ROLES[q.rol];
  return `<div class="rol-nota"><img src="cartas/${cartaRol(q)}.webp" alt="" data-vista="rol:${q.rol}"><p class="nota"><b>${esc(r.nombre)}</b>${q.rolUsado ? " (ya lo usaste)" : ""}: ${esc(r.texto)}</p></div>`;
}

function panelAnima(v) {
  const c = v.manoAnima.map((x, i) => [x, i]).filter(([, i]) => sel.includes(i));
  const una = c.length === 1 ? c[0][0] : null;
  const vivos = v.inv.filter((q) => q.vivo);
  const def = ANIMA_POR_ID[v.anima].espanto;
  if (modo?.tipo === "objetivo") {
    const val = vivos.filter((q) => !q.ruda && (modo.carta !== "caceria" || q.c <= (v.umbralCac ?? 4))).map((q) => q.asiento);
    return `<h3>${esc(cardName(modo.carta))}</h3><p>Elige a tu objetivo.</p>${botonesObjetivo(val, "objetivoAnima", v)}<button data-accion="cancelar">Cancelar</button>`;
  }
  if (modo?.tipo === "espanto") {
    const val = vivos.filter((q) => !q.ruda).map((q) => q.asiento);
    return `<h3 class="peligro">${sec(esc(def.nombre))}</h3><p>${def.pre.k === "fiebre" ? "Elige a quién mirar: su cordura baja a 3." : "Si sobreviven, te delatas y pierdes."}</p>
      ${def.pre.k === "fiebre" ? botonesObjetivo(val, "espantoObj", v) : `<button class="primario peligro" data-accion="espantoYa">Desatar el Espanto</button>`}<button data-accion="cancelar">Cancelar</button>`;
  }
  const puedeEsp = !v.espantoUsado && v.confirmadas.length >= 2;
  const libres = vivos.filter((q) => !q.ruda);
  const alcance = libres.filter((q) => q.c <= (v.umbralCac ?? 4));
  const porQue = !una ? "" : una === "interferencia" ? "Interferencia se usa sola cuando buscan una evidencia."
    : ["caceria", "caceria_total"].includes(una) && !alcance.length ? `Nadie tiene ${v.umbralCac ?? 4} o menos de cordura (o está protegido con ruda).`
    : ["manifestacion", "posesion"].includes(una) && !libres.length ? "Todos están protegidos con ruda." : "";
  return `<h3>Tu turno</h3><p class="sub">${una ? `Elegiste ${isHab(una) ? sec(esc(cardName(una))) : esc(cardName(una))}.` : esc(c.length ? `Elegiste ${c.length} cartas.` : "Toca una carta para jugarla, o varias para descartarlas.")}</p><div class="fila">
    <button class="primario" data-accion="jugarAnima" ${off(!una || porQue, !c.length ? "Primero toca una carta de tu mano." : c.length > 1 ? "Para jugar elige solo 1 carta; con varias puedes descartarlas." : porQue)}>Jugar${una ? " " + (isHab(una) ? sec(esc(cardName(una))) : esc(cardName(una))) : ""}</button>
    <button data-accion="descartarAnima">${c.length ? `Descartar ${c.length}` : "Esperar"}</button>
    <button class="peligro" data-accion="espantoModo" ${off(!puedeEsp, v.espantoUsado ? "Ya usaste tu Espanto." : `Tu Espanto se desata cuando ya hay 2 evidencias confirmadas (van ${v.confirmadas.length}).`)}>Espanto</button></div>
    ${porQue ? `<p class="nota">${esc(porQue)}</p>` : ""}`;
}

function selectorAnimas(accion) {
  const t = new Set(notas.tachadas);
  const comp = V ? compatibles(V) : { hay: false, ok: new Set() };
  return `<div class="animas">${ANIMAS.map((a) => `<button class="anima-op${t.has(a.id) || (comp.hay && !comp.ok.has(a.id)) ? " apagada" : ""}" data-accion="${accion}" data-anima="${a.id}" data-vista="anima:${a.id}"><img src="${ARTE("id_" + a.id)}" alt="" loading="lazy"><span>${esc(a.nombre)}</span></button>`).join("")}</div>`;
}

function bitacoraHTML(v) {
  // Cada línea toma el color de quien actúa; las tuyas van en itálicas. Los nombres mencionados llevan su color.
  const quienes = v.inv.map((q, i) => ({ n: q.nombre, c: COLORES_INV[i], yo: i === yo() }))
    .concat([{ n: "El ánima", c: "#d7a6e8", yo: yo() === ANIMA }])
    .sort((x, y) => y.n.length - x.n.length);
  const marcarNombres = (txt) => {
    let h = esc(txt);
    for (const q of quienes) h = h.split(esc(q.n)).join(`<b style="color:${q.c}">${esc(q.n)}</b>`);
    return h;
  };
  const items = v.bitacora.slice(-40).reverse().map((e) => {
    const actor = quienes.find((q) => e.txt.startsWith(q.n));
    const estilo = actor ? ` style="--actor:${actor.c}"` : "";
    const cls = `l-${e.tipo}${actor ? " l-actor" : ""}${actor?.yo ? " l-mio" : ""}`;
    const cuerpo = marcarNombres(e.txt);
    return `<li class="${cls}"${estilo}>${e.para && yo() === ANIMA ? sec(cuerpo) : cuerpo}</li>`;
  }).join("");
  return `<button class="b-tit" data-accion="bitacora" aria-expanded="${bitacoraAbierta}">Bitácora <span>${bitacoraAbierta ? "▾" : "▸"}</span></button><ol>${items}</ol>`;
}

// Bloc de deducción manual: parte de la magia es llevar la cuenta uno mismo.
const ESTADOS_EV = ["", "si", "no", "duda"];
function estadoEv(v, e) {
  return v.confirmadas.includes(e) ? "si" : v.descartadas.includes(e) ? "no" : notas.ev[e] || "";
}
// Las ánimas que encajan con lo que marcaste: todas tus ✓ y ninguna de tus ✗.
function compatibles(v) {
  const si = [], no = [];
  for (let e = 0; e < 7; e++) { const x = estadoEv(v, e); if (x === "si") si.push(e); if (x === "no") no.push(e); }
  return { hay: si.length + no.length > 0, ok: new Set(ANIMAS.filter((a) => si.every((e) => a.ev.includes(e)) && !no.some((e) => a.ev.includes(e))).map((a) => a.id)) };
}
/** Cuando el ánima revela una habilidad, su evidencia se marca sola como «posible» (?) en el bloc.
 *  Es solo una sugerencia: puede ser la falsa. Si la desmarcas, no vuelve a aparecer. */
function marcarPistasHabilidad(v) {
  const nuevas = [];
  if (MESA.yo === ANIMA || !v.pistas) return nuevas;
  notas.auto ??= [];
  let cambio = false;
  for (const p of v.pistas) {
    if (p.fuente !== "habilidad" || notas.auto.includes(p.ev)) continue;
    notas.auto.push(p.ev);
    if (!notas.ev[p.ev] && !v.confirmadas.includes(p.ev) && !v.descartadas.includes(p.ev)) { notas.ev[p.ev] = "duda"; nuevas.push(p.ev); }
    cambio = true;
  }
  if (cambio) guardar(claveNotas, notas);
  return nuevas;
}

function blocHTML(v) {
  const evRow = [0, 1, 2, 3, 4, 5, 6].map((e) => {
    const oficial = v.confirmadas.includes(e) ? "si" : v.descartadas.includes(e) ? "no" : "";
    const est = oficial || notas.ev[e] || "";
    const marca = { si: "✓", no: "✗", duda: "?" }[est] || "·";
    const deHab = !oficial && est === "duda" && v.pistas?.some((p) => p.ev === e && p.fuente === "habilidad");
    return `<button class="ev ev-${est || "vacia"}${oficial ? " oficial" : ""}${deHab ? " de-hab" : ""}" data-accion="marcaEv" data-ev="${e}" title="${oficial ? (oficial === "si" ? "Confirmada por una herramienta" : "Descartada por una herramienta") : deHab ? "Posible: la mostró una habilidad del ánima, que puede ser la falsa. Toca para cambiar o desmarcar." : "Toca para marcar: sí, no, duda"}"><span class="m">${marca}</span>${ico("ev_" + e)}${esc(EVIDENCIAS[e])}</button>`;
  }).join("");
  const t = new Set(notas.tachadas);
  const comp = compatibles(v);
  const marcas = (a) => a.ev.map((e) => { const x = estadoEv(v, e); return `<i class="m-${x || "nada"}">${esc(EVIDENCIAS[e].split(" ")[0])}</i>`; }).join(" · ");
  const lista = ANIMAS.map((a) => {
    const cls = t.has(a.id) ? "tachada" : comp.hay ? (comp.ok.has(a.id) ? "posible" : "fuera") : "";
    return `<li><button class="${cls}" aria-pressed="${t.has(a.id)}" data-accion="tachar" data-anima="${a.id}" data-vista="anima:${a.id}" title="${cls === "fuera" ? "No encaja con tus marcas" : ""}"><span>${esc(a.nombre)}</span><small>${marcas(a)}</small></button></li>`;
  }).join("");
  const nPos = ANIMAS.filter((a) => !t.has(a.id) && (!comp.hay || comp.ok.has(a.id))).length;
  const pistas = v.pistas.length ? `<p class="nota">Pistas: ${v.pistas.map((p) => `${esc(EVIDENCIAS[p.ev])} (${p.fuente === "espiritu" ? "segura" : "habilidad, puede mentir"})`).join(", ")}</p>` : "";
  return `<div class="bloc-cab"><b>Bloc de deducción</b><span class="cuenta" title="Ánimas que siguen en pie según tus marcas">${nPos} posible${nPos === 1 ? "" : "s"}</span><button class="mini" data-accion="limpiarBloc">Borrar notas</button></div>
    <div class="evs">${evRow}</div>${pistas}${rolesMesaHTML(v)}
    <ul class="lista-animas">${lista}</ul>`;
}

/** Las cartas de rol están siempre boca arriba: cualquiera puede consultarlas. */
function rolesMesaHTML(v) {
  const con = v.inv.filter((q) => q.rol);
  if (!con.length) return "";
  return `<details class="roles-mesa"><summary>Roles en la mesa</summary><ul>${con.map((q) => `<li><img class="mini-rol" src="cartas/${cartaRol(q)}.webp" alt="" data-vista="rol:${q.rol}"><span class="punto" style="--c:${COLORES_INV[q.asiento]}"></span><b>${esc(q.asiento === yo() ? "Tú" : q.nombre)}</b> · ${esc(ROLES[q.rol].nombre)}${q.rolUsado ? " <i>(ya usado)</i>" : ""}${q.vivo ? "" : " <i>(espíritu)</i>"}<br><small>${esc(ROLES[q.rol].texto)}</small></li>`).join("")}</ul></details>`;
}

function finHTML(v) {
  const gano = v.ganadores && yo() !== ANIMA ? v.ganadores.includes(yo()) : (v.ganador === "anima") === (yo() === ANIMA);
  const a = ANIMA_POR_ID[v.anima];
  const ac = v.acusacion;
  const fallo = ac && ac.anima !== v.anima;
  const arte = fallo
    ? `<div class="fin-cartas"><figure class="acusada"><img src="${ARTE("id_" + ac.anima)}" alt=""><figcaption>Dijeron: ${esc(ANIMA_POR_ID[ac.anima].nombre)}</figcaption></figure><figure><img src="${ARTE("id_" + v.anima)}" alt=""><figcaption>Era: ${esc(a.nombre)}</figcaption></figure></div>`
    : `<img class="fin-arte" src="${ARTE("id_" + v.anima)}" alt="${esc(a.nombre)}">`;
  const fondo = `arte/${v.ganador === "anima" ? "final_anima" : "final_vivos"}.webp`;
  return `<div class="fin-caja${fallo ? " doble" : ""}" style="--fondo-fin:url('${fondo}')">${arte}<div class="fin-texto"><p class="fin-eti">${esEspectador() ? (v.ganador === "anima" ? "Ganó el ánima" : "Ganaron los investigadores") : gano ? "Ganaste" : "Perdiste"}</p><h2>${esc(v.ganador === "anima" ? "La casona se queda con sus almas" : "Amanece en la casona")}</h2>
    ${v.logro ? `<p class="fin-logro">${esc(v.logro)}</p>` : ""}<p>${esc(v.motivo)}</p><p class="nota">Era ${esc(a.nombre)}: ${a.ev.map((e) => esc(EVIDENCIAS[e])).join(", ")}.</p>
    ${MESA.modo === "local" && SESION && V?.reglas?.modo === "cadaQuien" ? sesionHTML() : ""}
    ${MESA.modo !== "local" && SALA?.datos?.marcador ? marcadorSalaHTML(SALA.datos) : ""}
    <div class="fila">${MESA.modo === "local" && SESION && V?.reglas?.modo === "cadaQuien" ? "" : MESA.modo === "local" ? `<button class="primario" data-accion="otra">Jugar otra</button>` : `<button class="primario" data-accion="volverSala">Volver a la sala</button>`}<button data-accion="resumen">📊 Resumen e historial</button><button data-accion="salirInicio">Salir al inicio</button></div></div></div>`;
}

// ------------------------------------------------------------------ cartas del ánima

/** La carta de un rol en grande (desde la consulta). */
function abrirCartaRol(r) {
  const el = $("#ayuda");
  el.hidden = false;
  el.innerHTML = `<div class="ayuda-caja zoom" role="dialog"><div class="ayuda-cab"><b>${esc(ROLES[r].nombre)}</b><div class="fila"><button data-accion="ayuda">‹ Volver a la consulta</button><button class="icono" data-accion="cerrarAyuda" aria-label="Cerrar">✕</button></div></div>
    <div class="ayuda-cuerpo zoom-rol"><img src="cartas/rol_${arteRol(r)}.webp" alt=""><div><p><img class="fam" src="iconos/familia_${FAMILIA_ROL[r]}.webp" alt="">${esc(ROLES[r].texto)}</p></div></div></div>`;
}

/** Una carta cualquiera en grande, con su texto. */
function abrirCarta(id) {
  const el = $("#ayuda");
  el.hidden = false;
  el.innerHTML = `<div class="ayuda-caja zoom" role="dialog"><div class="ayuda-cab"><b>${esc(NOMBRE_ESPIRITU[id] || cardName(id))}</b><div class="fila"><button data-accion="ayuda">Consulta</button><button class="icono" data-accion="cerrarAyuda" aria-label="Cerrar">✕</button></div></div>
    <div class="ayuda-cuerpo zoom-rol"><img src="${ARTE(id)}" alt=""><div><p>${esc(TEXTO[id] || textoDe(id))}</p></div></div></div>`;
}

/** La carta Velar frente a un vivo: quién lo vela y qué hace. */
function abrirVelar(a) {
  const q = V?.inv[a];
  if (!q || q.veladoPor === null || q.veladoPor === undefined) return;
  const e = V.inv[q.veladoPor];
  const aliado = V.reglas?.modo === "cadaQuien" && e?.aliado === a;
  const el = $("#ayuda");
  el.hidden = false;
  el.innerHTML = `<div class="ayuda-caja zoom" role="dialog"><div class="ayuda-cab"><b>Velar · ${esc(a === yo() ? "a ti" : q.nombre)}</b><button class="icono" data-accion="cerrarAyuda" aria-label="Cerrar">✕</button></div>
    <div class="ayuda-cuerpo zoom-rol"><img src="${ARTE("rol_velar")}" alt=""><div><p>${q.veladoPor === yo() ? `Tu espíritu vela a <b>${esc(q.nombre)}</b>.` : a === yo() ? `El espíritu de <b>${esc(e?.nombre ?? "alguien")}</b> te vela.` : `El espíritu de <b>${esc(e?.nombre ?? "alguien")}</b> vela a <b>${esc(q.nombre)}</b>.`}</p><p>${esc(TEXTO.rol_velar)}</p>${aliado ? `<p class="nota">Son aliados: si ${esc(q.nombre)} gana, el espíritu se lleva ½ alma.</p>` : ""}</div></div></div>`;
}

/** Cualquier jugador puede ver en grande la carta de rol de otro: están boca arriba. */
function abrirRol(a) {
  const q = V?.inv[a];
  if (!q?.rol) return;
  const r = ROLES[q.rol];
  const el = $("#ayuda");
  el.hidden = false;
  el.innerHTML = `<div class="ayuda-caja zoom" role="dialog" aria-label="Rol de ${esc(q.nombre)}"><div class="ayuda-cab"><b>${esc(a === yo() ? "Tu rol" : q.nombre)} · ${esc(r.nombre)}</b><button class="icono" data-accion="cerrarAyuda" aria-label="Cerrar">✕</button></div>
    <div class="ayuda-cuerpo zoom-rol"><img src="cartas/rol_${arteRol(q.rol)}.webp" alt=""><div><p><img class="fam" src="iconos/familia_${FAMILIA_ROL[q.rol]}.webp" alt="">${esc(r.texto)}</p>${q.rolUsado ? `<p class="nota">Ya lo usó: su carta está volteada.</p>` : ""}</div></div></div>`;
}

function abrirMisCartas() {
  if (!V) return;
  if (yo() !== ANIMA) return abrirMisCartasInv();
  const a = ANIMA_POR_ID[V.anima], h = V.habilidades;
  const carta = (id, pie) => `<figure><img src="${ARTE(id)}" alt="" data-accion="zoomMia" data-id="${id}" title="Toca para verla en grande"><figcaption>${pie}</figcaption></figure>`;
  const el = $("#ayuda");
  el.hidden = false;
  el.innerHTML = `<div class="ayuda-caja mis-cartas" role="dialog" aria-label="Tus cartas de ánima">
    <div class="ayuda-cab"><b>Tus cartas de ánima</b><div class="fila">${enStream() ? `<button data-accion="espiar" title="Muestra tus cartas 6 segundos">👁 Mirar</button>` : ""}<button data-accion="ayuda" data-k="3">Reglas del ánima</button><button class="icono" data-accion="cerrarAyuda" aria-label="Cerrar">✕</button></div></div>
    <div class="mc-cuerpo secreto-bloque">
      <h3>Identidad y Espanto</h3>
      <div class="mc-fila">${carta("id_" + a.id, esc(a.nombre))}${carta("es_" + a.id, esc(a.espanto.nombre))}
        <div class="mc-texto"><p><b>${esc(a.espanto.nombre)}</b></p><p>${esc(ESPANTO_EFECTO[a.id])}.</p><p class="nota">Solo puedes desatarlo cuando ya hay 2 evidencias confirmadas. Si sobreviven 2 o más, te delatas y pierdes.</p></div></div>
      <h3>Tus evidencias</h3>
      <div class="mc-fila">${a.ev.map((e) => carta("ev" + e, esc(EVIDENCIAS[e]) + (V.confirmadas.includes(e) ? " · <b>ya confirmada</b>" : ""))).join("")}</div>
      ${h ? `<h3>Tus habilidades en el mazo</h3><div class="mc-fila">${carta("h" + h.verdadera, "Verdadera: " + esc(HABILIDADES["h" + h.verdadera].nombre))}${carta("h" + h.falsa, "Falsa: " + esc(HABILIDADES["h" + h.falsa].nombre))}</div>` : ""}
    </div></div>`;
}

/** Las cartas de un investigador o de un espíritu: su rol, su mano, y como espíritu, Manifestar y Velar. */
function abrirMisCartasInv() {
  const q = V.inv[yo()];
  if (!q) return;
  const carta = (id, pie) => `<figure><img src="${ARTE(id)}" alt="" data-accion="zoomMia" data-id="${id}" title="Toca para verla en grande"><figcaption>${pie}</figcaption></figure>`;
  const el = $("#ayuda");
  el.hidden = false;
  el.innerHTML = `<div class="ayuda-caja mis-cartas" role="dialog" aria-label="Tus cartas">
    <div class="ayuda-cab"><b>${q.vivo ? "Tus cartas" : "Tus cartas de espíritu"}</b><div class="fila"><button data-accion="ayuda">Reglas</button><button class="icono" data-accion="cerrarAyuda" aria-label="Cerrar">✕</button></div></div>
    <div class="mc-cuerpo">
      ${q.rol ? `<h3>Tu rol</h3><div class="mc-fila">${carta(cartaRol(q), esc(ROLES[q.rol].nombre) + (q.rolUsado ? " · ya usado" : ""))}<div class="mc-texto"><p><b>${esc(ROLES[q.rol].nombre)}</b></p><p>${esc(ROLES[q.rol].texto)}</p></div></div>` : ""}
      ${q.vivo ? `<h3>Tu mano</h3><div class="mc-fila">${q.mano.length ? q.mano.map((c) => carta(c, esc(cardName(c)))).join("") : `<p class="nota">No tienes cartas.</p>`}</div>`
        : `<h3>Lo que puedes hacer</h3><div class="mc-fila">${carta("rol_manifestar", "Manifestar")}${carta("rol_velar", "Velar")}<div class="mc-texto"><p><b>Manifestar:</b> robas 1 carta; si es herramienta, detecta con 5 o 6.</p><p><b>Velar:</b> pon tu carta frente a un vivo; hasta tu siguiente turno pierde 1 menos de cordura.</p></div></div>
          ${q.sabe !== null && q.sabe !== undefined ? `<h3>Lo que te mostró el ánima</h3><div class="mc-fila">${carta("ev" + q.sabe, esc(EVIDENCIAS[q.sabe]))}</div>` : ""}`}
    </div></div>`;
}

// ------------------------------------------------------------------ resumen de la partida

function quienesDe(v) {
  return v.inv.map((q, i) => ({ n: q.nombre, c: COLORES_INV[i] })).concat([{ n: "El ánima", c: "#d7a6e8" }]);
}
function graficaCordura(v) {
  const W = 640, H = 240, M = { l: 34, r: 12, t: 14, b: 26 };
  const n = Math.max(2, SERIE.length);
  const x = (k) => M.l + (k / (n - 1)) * (W - M.l - M.r);
  const y = (c) => M.t + (1 - c / 10) * (H - M.t - M.b);
  let svg = `<svg viewBox="0 0 ${W} ${H}" class="graf" role="img" aria-label="Cordura de cada investigador a lo largo de la partida">`;
  for (const c of [0, 2, 4, 6, 8, 10]) svg += `<line x1="${M.l}" x2="${W - M.r}" y1="${y(c)}" y2="${y(c)}" class="${c === 4 ? "umbral" : "rejilla"}"/><text x="${M.l - 6}" y="${y(c) + 4}" class="eje" text-anchor="end">${c}</text>`;
  svg += `<text x="${W - M.r}" y="${y(4) - 5}" class="eje umbral-t" text-anchor="end">zona de cacería</text>`;
  // marcas: evidencia confirmada (dorada) y muertes (rojas)
  SERIE.forEach((p, k) => {
    const prev = SERIE[k - 1];
    if (prev && p.conf > prev.conf) svg += `<line x1="${x(k)}" x2="${x(k)}" y1="${M.t}" y2="${H - M.b}" class="m-ev"/><text x="${x(k) > W - 60 ? x(k) - 3 : x(k) + 3}" y="${M.t + 10}" class="eje m-ev-t" text-anchor="${x(k) > W - 60 ? "end" : "start"}">✓${p.conf}</text>`;
    if (prev) p.vivos.forEach((viv, i) => { if (!viv && prev.vivos[i]) svg += `<text x="${x(k)}" y="${y(0) - 4}" class="m-muerte" text-anchor="middle" fill="${COLORES_INV[i]}">✝</text>`; });
  });
  v.inv.forEach((q, i) => {
    const pts = SERIE.map((p, k) => `${x(k).toFixed(1)},${y(p.cord[i]).toFixed(1)}`).join(" ");
    svg += `<polyline points="${pts}" fill="none" stroke="${COLORES_INV[i]}" stroke-width="2.5" stroke-linejoin="round"/>`;
  });
  svg += `<text x="${M.l}" y="${H - 6}" class="eje">inicio</text><text x="${W - M.r}" y="${H - 6}" class="eje" text-anchor="end">final</text></svg>`;
  return svg;
}
function resumenHTML(v) {
  const evs = HIST.map((h) => h.ev).filter(Boolean);
  const dados = evs.filter((e) => e.k === "dado");
  const juegos = evs.filter((e) => e.k === "juega");
  const porJugador = v.inv.map((q, i) => ({ q, i, n: juegos.filter((e) => e.de === i).length, dados: dados.filter((e) => e.de === i).length, si: dados.filter((e) => e.de === i && e.r === "si").length }));
  const turnos = Math.max(0, ...HIST.map((h) => h.turno));
  const tile = (n, t) => `<div class="tile"><b>${n}</b><span>${t}</span></div>`;
  const quienes = quienesDe(v).sort((a, b) => b.n.length - a.n.length);
  const lineas = HIST.map((h) => {
    let t = esc(h.txt);
    for (const q of quienes) t = t.split(esc(q.n)).join(`<b style="color:${q.c}">${esc(q.n)}</b>`);
    return `<li class="l-${h.tipo}"><span class="h-t">T${h.turno}</span>${t}</li>`;
  }).join("");
  return `<div class="ayuda-caja resumen" role="dialog" aria-label="Resumen de la partida">
    <div class="ayuda-cab"><b>Resumen de la noche</b><div class="fila"><button data-accion="csv">${ico("ui_descargar")}Descargar CSV</button><button class="icono" data-accion="cerrarAyuda" aria-label="Cerrar">✕</button></div></div>
    <div class="res-cuerpo">
      <div class="tiles">${tile(turnos, "turnos")}${tile(v.confirmadas.length, "evidencias confirmadas")}${tile(v.muertes, v.muertes === 1 ? "muerte" : "muertes")}${tile(`${dados.filter((e) => e.r === "si").length}/${dados.length}`, "tiradas con éxito")}${tile(v.nMazoInv, "cartas para el Alba al final")}</div>
      <h3>Cordura de cada investigador</h3>
      <div class="graf-caja">${graficaCordura(v)}</div>
      <div class="leyenda">${v.inv.map((q, i) => `<span><i style="background:${COLORES_INV[i]}"></i>${esc(q.nombre)}</span>`).join("")}<span><i class="ley-ev"></i>evidencia confirmada</span><span>✝ muerte</span></div>
      <table class="por-jugador"><thead><tr><th>Investigador</th><th>Cartas jugadas</th><th>Tiradas</th><th>Con éxito</th><th>Cordura final</th></tr></thead><tbody>
        ${porJugador.map((p) => `<tr><td><span class="punto" style="--c:${COLORES_INV[p.i]}"></span>${esc(p.q.nombre)}</td><td>${p.n}</td><td>${p.dados}</td><td>${p.si}</td><td>${p.q.vivo ? p.q.c : "✝"}</td></tr>`).join("")}
      </tbody></table>
      <h3>Historial completo</h3>
      <ol class="historial">${lineas}</ol>
    </div></div>`;
}
function abrirResumen() {
  if (!V) return;
  const el = $("#ayuda");
  el.hidden = false;
  el.innerHTML = resumenHTML(V);
}
function csvPartida(v) {
  const q = (x) => `"${String(x ?? "").replace(/"/g, '""')}"`;
  const nombres = v.inv.map((p) => p.nombre);
  const cab = ["n", "turno", "cartas_para_alba", "evidencias_confirmadas", ...nombres.map((n) => "cordura_" + n), "tipo", "evento", "texto"];
  const filas = HIST.map((h, k) => [k + 1, h.turno, h.alba, h.conf, ...h.cord, h.tipo, h.ev ? h.ev.k + (h.ev.carta ? ":" + h.ev.carta : "") + (h.ev.r ? ":" + h.ev.r : "") : "", h.txt]);
  const a = ANIMA_POR_ID[v.anima];
  const meta = [["partida", MESA.id], ["anima", a.nombre], ["evidencias_del_anima", a.ev.map((e) => EVIDENCIAS[e]).join(" / ")], ["ganador", v.ganador], ["motivo", v.motivo], ["fecha", new Date().toISOString()], []];
  return "\ufeff" + [...meta, cab, ...filas].map((f) => f.map(q).join(",")).join("\r\n");
}
async function descargarCSV() {
  if (!V) return;
  const datos = csvPartida(V);
  const fecha = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
  const nombre = `noche-de-animas_${fecha}.csv`;
  try {
    const dl = await window.claude?.use?.("downloads");
    if (!dl) throw { code: "unavailable" };
    await dl.save({ filename: nombre, data: datos });
  } catch (e) {
    if (e?.code === "declined") return;
    try { await navigator.clipboard.writeText(datos); aviso("No se pudo descargar aquí; copié el CSV al portapapeles."); }
    catch { aviso("No se pudo descargar el CSV en esta vista."); }
  }
}

// ------------------------------------------------------------------ volver a la sala (multijugador)

async function volverASala() {
  if (!SALA) return;
  const anfitrion = MESA?.modo === "anfitrion";
  MESA?.salir(); MESA = null; V = null;
  $("#ayuda").hidden = true;
  if (anfitrion) await DB.doc("salas/" + SALA.codigo).update({ estado: "lobby" }).catch(() => {});
  mostrar("lobby");
  pintarLobby();
}
let salirArmado = 0;

// ------------------------------------------------------------------ consulta y zoom

// Una sección por carta de reglas: el reverso con el texto y el frente con su arte e íconos.
const AYUDA = [
  { grupo: "Reglas", t: "Tu turno", caras: ["R01B", "R01"], clave: "turno robar acusar actuar improvisar manos" },
  { grupo: "Reglas", t: "Investigar", caras: ["R02B", "R02"], clave: "herramienta kit dado evidencia buscar" },
  { grupo: "Reglas", t: "Peligro", caras: ["R03B", "R03"], clave: "cacería cordura muerte defensa rosario esconderse" },
  { grupo: "Reglas", t: "El ánima", caras: ["R04B", "R04"], clave: "ánima habilidad espanto mano cartas" },
  { grupo: "Reglas", t: "El espíritu", caras: ["R05B", "R05"], clave: "espíritu muerto pregunta sí no eco velar" },
  { grupo: "Consulta de íconos", t: "Evidencias", caras: ["Q1", "Q1B"], clave: "evidencias íconos bajo cero huellas susurros" },
  { grupo: "Consulta de íconos", t: "Peligros y protecciones", caras: ["Q2", "Q2B"], clave: "peligros protecciones cacería copal ruda" },
  { grupo: "Consulta de íconos", t: "Protecciones y cordura", caras: ["Q3", "Q3B"], clave: "protecciones cordura cartas té respirar" },
  { grupo: "Consulta de íconos", t: "Cartas, objetivos y dado", caras: ["Q4", "Q4B"], clave: "cartas objetos objetivos dado" },
  { grupo: "Consulta de íconos", t: "Investigación y ritmo", caras: ["Q5", "Q5B"], clave: "investigación ritmo noche alba" },
  { grupo: "Modos alternativos", t: "Sálvese quien pueda", caras: ["back02"], clave: "modo sálvese quien pueda cada quien clue competitivo solo acusar aliado sesión almas", html: `
    <p>Para 2 a 4 investigadores. Ya no son un equipo: <b>gana solo quien acierte</b>.</p>
    <ul><li>Un <b>Sí</b> se anuncia a todos. Un <b>No</b> o un <b>Nada</b> solo los ve quien tiró: los demás ni siquiera ven el número, así que no pueden distinguirlos.</li>
    <li>Para acusar necesitas <b>2 evidencias confirmadas</b>. Si fallas, <b>quedas fuera</b> pero la partida sigue.</li>
    <li>Si tu tirada saca un <b>Sí</b> y ya tienes 2, <b>puedes acusar en ese mismo momento</b>, antes de que el siguiente aproveche tu hallazgo.</li>
    <li>El ánima juega <b>una vez por ronda</b>, después del último investigador.</li>
    <li>Quien muere o acusa mal <b>se vuelve aliado</b> de un vivo: pone su carta de Velar frente a él, lo protege y le pasa lo que sabe. Si su aliado gana, comparte el triunfo a medias.</li>
    <li>Si el Espanto falla, gana quien más evidencias haya confirmado (desempata la cordura).</li>
    <li>Al Alba, cada quien acusa en secreto; ganan todos los que acierten.</li></ul>
    <p class="nota">El Copal sigue sirviendo para salvar a otros… si te conviene.</p>
    <p><b>Una tarde en la casona (sesión):</b> se juega una partida por jugador y el ánima rota. Acusar bien vale 2 almas; ganar de otra forma, 1; ser aliado de quien gana, ½; ganar como ánima, 1 alma por cada investigador. Desempata quien acertó más veces y luego quien ganó como ánima.</p>` },
  { grupo: "Expansiones", t: "Objetos malditos", caras: ["back02", "muneca"], clave: "objetos malditos radio tablilla mano mono limpia espejo tarot muñeca obsidiana pentagrama", html: `
    <p>Diez cartas extra: 7 en el mazo de investigadores y 3 en el del ánima. Se juegan como cualquier carta y cuentan como tu jugada del turno.</p>
    <div class="galeria-roles">${["radio", "tablilla", "mano", "limpia", "espejo_plata", "tarot", "muneca", "espejo_obsidiana", "pentagrama"].map((c) => `<figure><img src="${ARTE(c)}" alt="" data-accion="verCarta" data-id="${c}" data-vista="${c}" title="Toca para verla en grande"><figcaption><b>${esc(cardName(c))}</b></figcaption></figure>`).join("")}</div>
    <ul><li><b>Radio (2):</b> pasa 1 carta a otro investigador vivo.</li><li><b>Tablilla espiritista:</b> un espíritu puede hablar con normalidad.</li>
    <li><b>Mano del mono:</b> con un muerto en la mesa, tira el dado: 1–3 mueres tú; 4–6 revive quien elijas con 5 de cordura y sin cartas.</li>
    <li><b>Limpia con huevo:</b> quita la Muñeca y el Pentagrama; todos los vivos +2 de cordura.</li><li><b>Espejo de plata:</b> miras en secreto la mano del ánima.</li>
    <li><b>Tarot:</b> con 5 o 6, el ánima dice una evidencia que no tiene (en Sálvese quien pueda, solo a ti).</li>
    <li><b>Muñeca de la isla</b> (ánima): su objetivo pierde 1 de cordura al inicio de cada turno. Se quita con Copal al jugarse o con la Limpia. Solo se usa con 3 o 4 investigadores.</li>
    <li><b>Espejo de obsidiana</b> (ánima): mira la mano de un investigador.</li><li><b>Pentagrama</b> (ánima): 2 turnos del ánima sin Copal.</li></ul>
    <p class="nota">En el Duelo se retiran las Radios, la Tablilla y la Mano del mono. La Muñeca no se usa con 1 ni 2 investigadores.</p>` },
  { grupo: "Expansiones", t: "Los testigos de la casona", caras: ["rol_reverso", "rol_vigia"], clave: "roles testigos vigia improvisador tecnico detective curandero devota sensitivo guardaespaldas", html: `
    <p>Cada investigador roba 2 roles y se queda con 1. Las cartas de rol están siempre boca arriba: puedes consultarlas en el bloc, en «Roles en la mesa». Para compensar, el ánima juega con 1 carta más en la mano y se retiran del mazo <b>2 Té de tila, 2 Respirar hondo y 2 Rosarios</b> (nunca herramientas). No se usa en el Duelo; los 8 roles sirven en los dos modos.</p>
    <div class="galeria-roles">${Object.entries(ROLES).map(([k, r]) => `<figure><img src="cartas/rol_${arteRol(k)}.webp" alt="" data-accion="verRol" data-rol="${k}" data-vista="rol:${k}" title="Toca para verla en grande"><figcaption><b>${esc(r.nombre)}:</b> ${esc(r.texto)}</figcaption></figure>`).join("")}</div>
    <p>Los roles de un solo uso (Detective, Sensitivo, Guardaespaldas) se voltean al usarse: muestran el reverso gris. El Técnico puede repetir cada vez que una herramienta suya dé «Nada», pagando 2 de cordura.</p>
    <p class="nota">El Técnico y el Guardaespaldas te preguntan en el momento justo: el Técnico cuando tu herramienta no detecta nada, y el Guardaespaldas cuando cazan a alguien sin defensa (a ti o a otro). El Vigía, la Devota y el Detective también te preguntan cuando les toca; el Sensitivo se activa solo al revelarse la primera habilidad. Lo que averigua un rol es una pista: no cuenta para las 2 evidencias de la acusación.</p>` },
  { grupo: "Reglas en prueba", t: "Ajustes del 17 de noviembre (playtest)", caras: ["rol_tecnico", "rol_improvisador"], clave: "playtest apuesta final salvese vaso tecnico improvisador curandero devota", html: `
    <ul><li><b>Sálvese quien pueda va siempre sin vaso.</b> En la mesa no se entendía y casi todo salía «Nada». Sin vaso ya queda en su punto.</li>
    <li><b>Apuesta final</b> (Sálvese quien pueda): al Alba todos apuestan en secreto, aunque no tengan evidencias. Quien acierta con al menos 1 evidencia gana. Quien acierta <b>sin evidencias</b> enfrenta el Espanto del ánima: gana si sobrevive.</li>
    <li><b>Técnico:</b> repetir cuesta 1 de cordura, una vez por herramienta, en todas las que use. También bajo el vaso.</li>
    <li><b>Improvisador:</b> con 2 cartas detecta con 4 o más (como una herramienta); con 1 carta, con 5 o 6.</li>
    <li><b>Curandero y Devota</b> (opcional, activado): empiezan con un Té o un Rosario del mazo.</li></ul>` },
  { grupo: "Reglas en prueba", t: "Ajustes del 16 de noviembre", caras: ["back01"], clave: "cambios prueba cordura 8 cuatro matlacihuatl lectura cartas recorte", html: `
    <p>Ajustes medidos con 3 000 partidas por mesa. Están en prueba hasta jugarlos con personas.</p>
    <ul><li><b>Con 4 investigadores se empieza con 8 de cordura.</b> La mesa de 4 era la más fácil para los investigadores.</li>
    <li><b>Ya no existe el «Sí falso»</b> en el vaso: el ánima solo puede ocultar un No. Más simple, y en Sálvese quien pueda el ánima quedaba muy fuerte.</li>
    <li><b>Los testigos de la casona:</b> en vez de quitar 6 cartas al azar, se retiran 2 Té de tila, 2 Respirar hondo y 2 Rosarios. Nunca una herramienta.</li>
    <li><b>Matlacíhuatl:</b> su Espanto «La red» caza con 5 o menos (antes 4).</li>
    <li><b>Cartas de lectura</b> (opcional): 6 cartas del 1 al 6 en vez del dado. Se roban sin reponer y se rebarajan al acabarse.</li></ul>` },
  { grupo: "Modos alternativos", t: "El dado bajo el vaso", caras: ["back03"], clave: "modo vaso dado oculto mentir destapar farol", html: `
    <p>El dado se tira tapado. <b>Solo el ánima lo ve</b> y anuncia «Sí», «No» o «Nada».</p>
    <ul><li>El ánima <b>puede ocultar un No</b> diciendo «Nada».</li>
    <li>Nunca puede inventar un Sí ni un No.</li>
    <li>Cuando dice «Nada», cualquier investigador puede <b>destapar el vaso</b>.</li>
    <li><b>Solo en el modo En equipo.</b> En Sálvese quien pueda el dado siempre está a la vista.</li>
    <li>Si mintió, se sabe la verdad y el ánima <b>pierde su próximo turno</b>.</li>
    <li>Si dijo la verdad, quien destapó pierde <b>${VASO.costoDesafio}</b> de cordura (<b>2 con 4 investigadores</b>).</li></ul>
    <p class="nota">Decir la verdad también es una jugada: cada vez que te destapan en falso, el investigador pierde cordura y queda más cerca de tus cacerías.</p>
    <p class="nota">Solo se juega con 3 o 4 investigadores: en Duelo y con 2 le da demasiada ventaja al ánima.</p>` },
];
let ayudaI = 0, ayudaFiltro = "";
const sinAcentos = (x) => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function indiceAyuda() {
  const f = sinAcentos(ayudaFiltro.trim());
  let grupo = "";
  return AYUDA.map((a, k) => {
    if (f && !sinAcentos(a.t + " " + a.clave).includes(f)) return "";
    const cab = a.grupo !== grupo ? `<p class="ay-grupo">${esc((grupo = a.grupo))}</p>` : "";
    return `${cab}<button class="${k === ayudaI ? "on" : ""}" data-accion="ayudaIr" data-k="${k}"><img src="${ARTE(a.caras[1] ?? a.caras[0])}" alt=""><span>${esc(a.t)}</span></button>`;
  }).join("") || `<p class="nota">Nada coincide con «${esc(ayudaFiltro)}».</p>`;
}
function abrirAyuda(i) {
  ayudaI = i;
  const el = $("#ayuda");
  const a = AYUDA[i];
  if (el.hidden || !el.querySelector(".ayuda-caja.reglas")) {
    el.hidden = false;
    el.innerHTML = `<div class="ayuda-caja reglas" role="dialog" aria-label="Cartas de consulta">
      <div class="ayuda-cab"><b>Cartas de consulta</b><button class="icono" data-accion="cerrarAyuda" aria-label="Cerrar">✕</button></div>
      <div class="ay-cuerpo"><nav class="ay-indice"><input id="ayudaBuscar" type="search" placeholder="Buscar: cacería, dado, copal…" aria-label="Buscar sección" value="${esc(ayudaFiltro)}"><div class="ay-lista"></div></nav>
      <section class="ay-seccion"></section></div></div>`;
  }
  el.querySelector(".ay-lista").innerHTML = indiceAyuda();
  el.querySelector(".ay-seccion").innerHTML = `<div class="ay-tit"><button class="nav" data-accion="ayudaPrev" aria-label="Sección anterior">‹</button><h3><small>${esc(a.grupo)}</small>${esc(a.t)}</h3><button class="nav" data-accion="ayudaSig" aria-label="Sección siguiente">›</button></div>
    ${a.html ? `<div class="ay-texto">${a.html}</div>` : `<div class="ay-caras">${a.caras.map((c) => `<img src="${ARTE(c)}" alt="${esc(a.t)}" data-accion="zoomRegla" data-id="${c}" title="Toca para verla en grande">`).join("")}</div>`}`;
}
document.addEventListener("input", (ev) => {
  if (ev.target.id !== "ayudaBuscar") return;
  ayudaFiltro = ev.target.value;
  $("#ayuda .ay-lista").innerHTML = indiceAyuda();
});
function abrirZoom(id) {
  const el = $("#ayuda");
  el.hidden = false;
  el.innerHTML = `<div class="ayuda-caja zoom" role="dialog" aria-label="${esc(cardName(id))}"><div class="ayuda-cab"><b>${esc(cardName(id))}</b><button class="icono" data-accion="cerrarAyuda" aria-label="Cerrar">✕</button></div>
    <div class="ayuda-cuerpo zoom-rol"><img src="${ARTE(id)}" alt=""><div><p><b>${esc(cardName(id))}</b></p><p>${esc(textoDe(id))}</p></div></div></div>`;
}

// La columna del bloc y la bitácora termina justo encima del panel de acciones, mida lo que mida.
if (window.ResizeObserver) {
  new ResizeObserver(() => {
    const r = $("#abajo").getBoundingClientRect();
    document.documentElement.style.setProperty("--alto-abajo", Math.round(innerHeight - r.top + 10) + "px");
  }).observe($("#abajo"));
}

// ------------------------------------------------------------------ eventos

document.addEventListener("click", (ev) => {
  // Menú de la barra en el celular: se cierra al tocar fuera o al elegir una opción.
  if (menuBarra && !ev.target.closest('[data-accion="menuBarra"]') && (ev.target.closest(".b-items") || !ev.target.closest(".b-botones"))) {
    menuBarra = false;
    $(".b-botones")?.classList.remove("abierto");
    $('[data-accion="menuBarra"]')?.setAttribute("aria-expanded", "false");
  }
  const b = ev.target.closest("[data-accion],[data-carta]");
  if (!b || b.disabled) return;
  if (b.getAttribute("aria-disabled") === "true") return explicar(b);
  if (b.dataset.carta !== undefined && !b.dataset.accion) {
    const i = Number(b.dataset.carta);
    sel = sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i];
    if (modo && modo.tipo !== "acusar") modo = null;
    return pintar();
  }
  const d = b.dataset;
  if (["solo", "crearSala", "unirse"].includes(d.accion)) iniciarMusica();
  const mano = V && MESA ? manoMia() : [];
  switch (d.accion) {
    // inicio y salas
    case "musica": MUSICA.mudo = !MUSICA.mudo; guardar("mudo", MUSICA.mudo); iniciarMusica(); ajustarVolumen(); return V && !$("#juego").hidden ? pintar() : undefined;
    case "menuBarra":
      menuBarra = !menuBarra;
      b.closest(".b-botones")?.classList.toggle("abierto", menuBarra);
      return b.setAttribute("aria-expanded", String(menuBarra));
    case "solo": {
      const cfg = { rol: $("#rol").value, nInv: Number($("#nInv").value), anima: $("#animaSel").value, modo: $("#modoSel").value, vaso: $("#vasoSel").checked && Number($("#nInv").value) >= 3 && $("#modoSel").value !== "cadaQuien", sesion: $("#sesionSel").checked, objetos: $("#objSel").checked, testigos: $("#testigosSel").checked && Number($("#nInv").value) >= 2, reparto: $("#repartoSel").value, lectura: $("#lecturaSel").checked, cartaInicial: $("#cartaInicialSel").checked };
      if (cfg.modo === "cadaQuien" && cfg.nInv < 2) return aviso("«Sálvese quien pueda» necesita de 2 a 4 investigadores.");
      guardar("cfg", cfg);
      if (cfg.modo === "cadaQuien" && cfg.sesion) { borrar("partidaLocal"); nuevaSesion(cfg); return jugarSesion(); }
      SESION = null; borrar("sesion");
      return jugarSolo(cfg);
    }
    case "continuar": { const g = leer("partidaLocal", null); if (!g?.estado) { pintarContinuar(); return aviso("Ya no hay partida guardada."); } if (g.sesion && SESION) return jugarSesion(g.estado); return jugarSolo(g.cfg, g.estado); }
    case "reiniciarMarcador": DB.doc("salas/" + SALA.codigo).update({ marcador: {}, partidas: 0 }).catch(() => aviso("No se pudo borrar el marcador.")); return;
    case "sesionSig": MESA?.salir(); MESA = null; V = null; SESION.ronda++; guardar("sesion", SESION); return jugarSesion();
    case "sesionNueva": MESA?.salir(); MESA = null; V = null; nuevaSesion(SESION.cfg); return jugarSesion();
    case "volverASalaReciente": { const n = $("#nombre").value.trim() || leer("nombre", ""); if (!n) return aviso("Escribe tu nombre."); return unirse(salaReciente(), n).catch((e) => aviso("No se pudo entrar: " + (e?.message || ""))); }
    case "retomarSala": return DB.doc(`data/users/${MI_ID}/sala_${SALA.codigo}`).get().then((x) => {
      const b = x.data();
      if (!b?.estado) return aviso("No encontré la partida guardada de esta sala.");
      return iniciarComoAnfitrion(b);
    }).catch((e) => aviso("No se pudo retomar: " + (e?.message || "")));
    case "terminarSala": return DB.doc("salas/" + SALA.codigo).update({ estado: "lobby" }).catch(() => {});
    case "crearSala": { const n = $("#nombre").value.trim(); if (!n) return aviso("Escribe tu nombre."); return crearSala(n, Number($("#nInvSala").value)).catch((e) => aviso("No se pudo crear la sala: " + (e?.message || ""))); }
    case "unirse": { const n = $("#nombre").value.trim(), c = $("#codigo").value.trim(); if (!n || !c) return aviso("Escribe tu nombre y el código."); return unirse(c, n).catch((e) => aviso("No se pudo entrar: " + (e?.message || ""))); }
    case "sentarse": return tomarAsiento(d.k).catch((e) => aviso(e?.message || "No se pudo tomar el lugar."));
    case "nInvSala": if (soyAnfitrion()) return cambiarInvSala(Number(d.d)).catch(() => aviso("No se pudo cambiar la mesa.")); return;
    case "abrirLugar": if (soyAnfitrion()) return cambiarInvSala(1).catch(() => aviso("No se pudo abrir el lugar.")); return;
    case "cerrarLugar": if (soyAnfitrion()) return cerrarLugar(Number(d.k)).catch(() => aviso("No se pudo cerrar el lugar.")); return;
    case "elegirAnimaSala": return abrirSelectorAnima(reglasDe(SALA.datos).anima, (id) => DB.doc("salas/" + SALA.codigo).update({ reglas: { ...reglasDe(SALA.datos), anima: id } }).catch(() => aviso("No se pudo guardar la regla.")));
    case "elegirAnimaMenu": return abrirSelectorAnima($("#animaSel").value, (id) => { $("#animaSel").value = id; pintarAnimaMenu(); });
    case "animaVisual": { const f = SELECTOR_ANIMA; SELECTOR_ANIMA = null; $("#ayuda").hidden = true; $("#ayuda").innerHTML = ""; f?.(d.anima); return; }
    case "liberarAsiento": if (soyAnfitrion()) return liberarAsiento(d.k).catch(() => aviso("No se pudo liberar el lugar.")); return;
    case "levantarse": { const k = miAsiento(); if (k === null || k === undefined) return; if (soyAnfitrion() || SALA.via === "db") return liberarAsiento(k).catch(() => aviso("No se pudo dejar el lugar.")); return aviso("Pide al anfitrión que libere tu lugar."); }
    case "iniciarSala": return iniciarComoAnfitrion().catch((e) => aviso("No se pudo empezar: " + (e?.message || "")));
    case "copiarCodigo": navigator.clipboard?.writeText(SALA.codigo).then(() => aviso("Código copiado."), () => aviso("Código: " + SALA.codigo)); return;
    case "salirSala": salirDeSala(); return mostrar("inicio");
    // mesa
    case "resumen": return abrirResumen();
    case "misCartas": return abrirMisCartas();
    case "verCarta": return abrirCarta(d.id);
    case "verRol": return abrirCartaRol(d.rol);
    case "verVelar": return abrirVelar(Number(d.a));
    case "zoomMia": { $("#ayuda").innerHTML = `<div class="ayuda-caja zoom secreto-bloque" role="dialog"><div class="ayuda-cab"><b>&nbsp;</b><button data-accion="misCartas">‹ Volver a tus cartas</button></div><div class="ayuda-cuerpo zoom-rol"><img src="${ARTE(d.id)}" alt=""><div><p><b>${esc(NOMBRE_ESPIRITU[d.id] || cardName(d.id))}</b></p><p>${esc(TEXTO[d.id] || textoDe(d.id))}</p></div></div></div>`; return; }
    case "csv": return descargarCSV();
    case "volverSala": return volverASala();
    case "salirInicio": MESA?.salir(); MESA = null; V = null; salirDeSala(); $("#ayuda").hidden = true; return mostrar("inicio");
    case "salirMesa":
      if (MESA && MESA.modo !== "local" && SALA && !V?.ganador) {
        if (MESA.modo === "invitado") return aviso("Solo el anfitrión puede terminar la partida. Al acabar podrán volver a la sala.");
        if (Date.now() - salirArmado > 3000) { salirArmado = Date.now(); return aviso("Toca «Sala» otra vez para terminar la partida y volver todos a la sala."); }
        return volverASala();
      }
      if (MESA && MESA.modo !== "local" && SALA) return volverASala();
      MESA?.salir(); MESA = null; V = null; salirDeSala(); $("#ayuda").hidden = true; return mostrar("inicio");
    case "otra": MESA?.salir(); MESA = null; V = null; return jugarSolo(leer("cfg", { rol: "investigador", nInv: 3 }));
    case "girarIzq": return escena?.girar(-0.5);
    case "girarDer": return escena?.girar(0.5);
    case "ayuda": $("#ayuda").innerHTML = ""; return abrirAyuda(d.k ? Number(d.k) : ayudaI);
    case "ayudaPrev": return abrirAyuda((ayudaI + AYUDA.length - 1) % AYUDA.length);
    case "ayudaSig": return abrirAyuda((ayudaI + 1) % AYUDA.length);
    case "ayudaIr": return abrirAyuda(Number(d.k));
    case "zoomRegla": { $("#ayuda").innerHTML = `<div class="ayuda-caja zoom" role="dialog"><div class="ayuda-cab"><b>${esc(AYUDA[ayudaI].t)}</b><button data-accion="ayuda" data-k="${ayudaI}">‹ Volver a la consulta</button></div><div class="ayuda-cuerpo zoom-rol"><img src="${ARTE(d.id)}" alt=""><div><p><b>${esc(NOMBRE_ESPIRITU[d.id] || cardName(d.id))}</b></p><p>${esc(TEXTO[d.id] || textoDe(d.id))}</p></div></div></div>`; return; }
    case "cerrarAyuda": $("#ayuda").hidden = true; return;
    case "minimizar": return minimizar(d.v);
    case "restaurar": return restaurar(d.v);
    case "alzar": return escena?.alzar(Number(d.d));
    case "zoom": if (enStream() && isHab(d.id) && !document.body.classList.contains("espiando")) return aviso("Oculta por el modo stream. Usa «Mirar» para verla."); return abrirZoom(d.id);
    case "stream": stream = !stream; guardar("stream", stream); document.body.classList.remove("espiando"); return pintar();
    case "espiar": {
      document.body.classList.add("espiando");
      clearTimeout(espiarT);
      espiarT = setTimeout(() => document.body.classList.remove("espiando"), 6000);
      return;
    }
    case "bitacora": bitacoraAbierta = !bitacoraAbierta; guardar("bitacora", bitacoraAbierta); return pintar();
    case "marcaEv": {
      const e = Number(d.ev);
      if (V.confirmadas.includes(e) || V.descartadas.includes(e)) return;
      notas.ev[e] = ESTADOS_EV[(ESTADOS_EV.indexOf(notas.ev[e] || "") + 1) % ESTADOS_EV.length];
      guardar(claveNotas, notas);
      return pintar();
    }
    case "tachar": {
      const t = new Set(notas.tachadas);
      t.has(d.anima) ? t.delete(d.anima) : t.add(d.anima);
      notas.tachadas = [...t];
      guardar(claveNotas, notas);
      return pintar();
    }
    case "limpiarBloc": notas = { ev: {}, tachadas: [], auto: notas.auto || [] }; guardar(claveNotas, notas); return pintar();
    // decisiones
    case "verdadera": modo = { ...(modo || {}), verdadera: Number(d.ev) }; return pintar();
    case "falsa": modo = { ...(modo || {}), falsa: Number(d.ev) }; return pintar();
    case "confirmarHab": return responder({ tipo: "habilidades", verdadera: modo.verdadera, falsa: modo.falsa });
    case "jugar": {
      if (mano[sel[0]] === "kit") { modo = { tipo: "kit" }; return pintar(); }
      const qq = V.inv[yo()];
      if (["radio", "tablilla", "mano"].includes(mano[sel[0]]) || (mano[sel[0]] === "te" && qq.rol === "curandera" && V.reglas?.modo !== "cadaQuien")) { modo = { tipo: "objInv", idx: sel[0] }; return pintar(); }
      return responder({ tipo: "jugar", carta: sel[0] });
    }
    case "objInvObj": {
      if (mano[modo.idx] === "radio") { modo = { ...modo, objetivo: Number(d.objetivo) }; return pintar(); }
      return responder({ tipo: "jugar", carta: modo.idx, objetivo: Number(d.objetivo) });
    }
    case "radioDar": return responder({ tipo: "jugar", carta: modo.idx, objetivo: modo.objetivo, dar: d.carta });
    case "rolElegir": return responder({ tipo: "rol", rol: d.rol });
    case "tarotEv": return responder({ tipo: "tarot", ev: Number(d.ev) });
    case "verEspejo": return abrirEspejoPendiente(V, true);
    case "velocidad": {
      const sig = VELOCIDADES[(VELOCIDADES.indexOf(velocidad()) + 1) % VELOCIDADES.length];
      guardar("velocidad", sig);
      aviso(`Bots a ${sig}x${sig === 1 ? ": con calma" : sig === 4 ? ": a toda prisa" : ""}`);
      return pintar();
    }
    case "kitEv": return responder({ tipo: "jugar", carta: sel[0], ev: Number(d.ev) });
    case "descartar": return responder({ tipo: "descartar", cartas: sel });
    case "improvisar": modo = { tipo: "improvisar" }; return pintar();
    case "impEv": return responder({ tipo: "improvisar", cartas: sel, ev: Number(d.ev) });
    case "acusarModo": modo = { tipo: "acusar" }; return pintar();
    case "acusar": case "acusarFinal": return responder({ tipo: "acusar", anima: d.anima });
    case "acusarYa": return responder({ tipo: "acusarYa", anima: d.anima || null });
    case "aliado": return responder({ tipo: "aliado", objetivo: Number(d.objetivo) });
    case "cancelar": modo = null; return pintar();
    case "jugarAnima": {
      const c = mano[sel[0]];
      if (["manifestacion", "posesion", "caceria", "muneca", "espejo_obsidiana"].includes(c)) { modo = { tipo: "objetivo", carta: c, idx: sel[0] }; return pintar(); }
      return responder({ tipo: "jugar", carta: sel[0] });
    }
    case "objetivoAnima": return responder({ tipo: "jugar", carta: modo.idx, objetivo: Number(d.objetivo) });
    case "descartarAnima": return responder({ tipo: "descartar", cartas: sel });
    case "espantoModo": modo = { tipo: "espanto" }; return pintar();
    case "espantoYa": return responder({ tipo: "espanto" });
    case "espantoObj": return responder({ tipo: "espanto", objetivo: Number(d.objetivo) });
    case "copal": return responder({ tipo: "copal", usar: d.usar === "1" });
    case "defensa": return responder({ tipo: "defensa", con: d.con || null });
    case "tecnico": return responder({ tipo: "tecnico", usar: d.usar === "1" });
    case "detectiveEv": return responder({ tipo: "detective", ev: Number(d.ev) });
    case "vigiaSoltar": return responder({ tipo: "vigia", cartas: sel });
    case "vigiaConservar": return responder({ tipo: "vigiaGuarda", carta: sel[0] });
    case "devota": return responder({ tipo: "devota", usar: d.usar === "1" });
    case "guardaOtro": return responder({ tipo: "guardaOtro", usar: d.usar === "1" });
    case "interferir": return responder({ tipo: "interferir", usar: d.usar === "1" });
    case "revelar": return responder({ tipo: "revelar", ev: Number(d.ev) });
    case "objetivoHab": return responder({ tipo: "objetivo", objetivo: Number(d.objetivo) });
    case "espiritu": return responder({ tipo: d.tipo });
    case "velarModo": modo = modo?.tipo === "velar" ? null : { tipo: "velar" }; return pintar();
    case "velar": return responder({ tipo: "velar", objetivo: Number(d.objetivo) });
    case "marcarEv": {
      const e = Number(d.ev);
      const evs = modo?.evs ?? [];
      modo = { tipo: "pregunta", evs: evs.includes(e) ? evs.filter((x) => x !== e) : [...evs, e] };
      return pintar();
    }
    case "preguntar": {
      const texto = $("#txtPregunta").value.trim();
      if (!texto) return aviso("Escribe la pregunta.");
      return responder({ tipo: "pregunta", texto, ...(modo?.evs?.length ? { evs: modo.evs } : {}) });
    }
    case "responder": return responder({ tipo: "respuesta", valor: d.valor });
    case "kitEspiritu": return responder({ tipo: "kitEspiritu", ev: Number(d.ev) });
    case "albaCaza": return responder({ tipo: "albaCaza", objetivo: d.objetivo === "" ? null : Number(d.objetivo) });
    case "albaEspanto": return responder({ tipo: "albaEspanto", usar: d.usar === "1" });
    case "anunciar": return responder({ tipo: "anunciar", dicho: d.dicho });
    case "desafio": return responder({ tipo: "desafio", desafiar: d.si === "1" });
    case "cucuyDoble": return responder({ tipo: "cucuyDoble", objetivo: Number(d.objetivo) });
    case "guardianDesc": return responder({ tipo: "guardian", eleccion: "descartar", cartas: sel });
    case "guardianPerder": return responder({ tipo: "guardian", eleccion: "perder" });
  }
});
document.addEventListener("input", (ev) => {
  if (ev.target.id === "txtPregunta") modo = { tipo: "pregunta", texto: ev.target.value, evs: [] };
});
document.addEventListener("keydown", (ev) => {
  if ($("#ayuda").hidden) return;
  if (ev.key === "Escape") $("#ayuda").hidden = true;
  if (!$("#ayuda .nav")) return;
  if (ev.target.id === "ayudaBuscar") return;
  if (ev.key === "ArrowRight") abrirAyuda((ayudaI + 1) % AYUDA.length);
  if (ev.key === "ArrowLeft") abrirAyuda((ayudaI + AYUDA.length - 1) % AYUDA.length);
});
$("#ayuda").addEventListener("click", (ev) => { if (ev.target.id === "ayuda") $("#ayuda").hidden = true; });

// ------------------------------------------------------------------ música ambiental
// Se reproduce con Web Audio para que el bucle no tenga corte. El MP3 trae un poco de silencio de
// relleno al inicio y al final: se salta midiendo dónde empieza el sonido y usando la duración exacta del bucle.
const DURACION_BUCLE = 216.508;
const MUSICA = { ctx: null, gan: null, efx: null, vol: leer("volumen", 0.5), volEfx: leer("volEfectos", 0.7), mudo: leer("mudo", false) };
function iniciarMusica() {
  if (MUSICA.ctx) { if (MUSICA.ctx.state === "suspended") MUSICA.ctx.resume().catch(() => {}); return; }
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return;
  try {
    MUSICA.ctx = new C();
    MUSICA.gan = MUSICA.ctx.createGain();
    MUSICA.gan.gain.value = 0;
    MUSICA.gan.connect(MUSICA.ctx.destination);
    MUSICA.efx = MUSICA.ctx.createGain();
    MUSICA.efx.gain.value = MUSICA.mudo ? 0 : MUSICA.volEfx;
    MUSICA.efx.connect(MUSICA.ctx.destination);
  } catch { MUSICA.ctx = null; return; }
  fetch("audio/ambiente.mp3")
    .then((r) => r.arrayBuffer())
    .then((b) => MUSICA.ctx.decodeAudioData(b))
    .then((buf) => {
      cargarMuestras();
      const f = MUSICA.ctx.createBufferSource();
      f.buffer = buf; f.loop = true;
      const d = buf.getChannelData(0);
      let i = 0;
      while (i < d.length && Math.abs(d[i]) < 1e-4) i++;
      const ini = i / buf.sampleRate;
      if (ini + DURACION_BUCLE <= buf.duration + 0.01) { f.loopStart = ini; f.loopEnd = Math.min(buf.duration, ini + DURACION_BUCLE); }
      f.connect(MUSICA.gan); f.start(0, f.loopStart || 0);
      ajustarVolumen(4);
    })
    .catch(() => {});
}
function ajustarVolumen(seg = 0.25) {
  pintarSonido();
  if (!MUSICA.gan) return;
  const t = MUSICA.ctx.currentTime, g = MUSICA.gan.gain;
  g.cancelScheduledValues(t);
  g.setValueAtTime(g.value, t);
  g.linearRampToValueAtTime(MUSICA.mudo ? 0 : MUSICA.vol * MUSICA.vol, t + seg);
  MUSICA.efx?.gain.setTargetAtTime(MUSICA.mudo ? 0 : MUSICA.volEfx, t, 0.05);
}
function pintarSonido() {
  const b = $("#btnMusica"), r = $("#volumen");
  if (!b || !r) return;
  const callado = MUSICA.mudo || MUSICA.vol === 0;
  b.textContent = callado ? "🔇" : MUSICA.vol < 0.4 ? "🔈" : "🔊";
  b.setAttribute("aria-pressed", String(!callado));
  b.setAttribute("aria-label", callado ? "Activar la música" : "Silenciar la música");
  r.value = String(Math.round(MUSICA.vol * 100));
  const re = $("#volEfectos");
  if (re) re.value = String(Math.round(MUSICA.volEfx * 100));
}
document.addEventListener("pointerdown", () => { if (MUSICA.ctx?.state === "suspended") MUSICA.ctx.resume().catch(() => {}); });
$("#volumen").addEventListener("input", (ev) => {
  MUSICA.vol = Number(ev.target.value) / 100;
  MUSICA.mudo = false;
  guardar("volumen", MUSICA.vol); guardar("mudo", false);
  iniciarMusica(); ajustarVolumen(0.1);
});
$("#volEfectos").addEventListener("input", (ev) => {
  MUSICA.volEfx = Number(ev.target.value) / 100;
  MUSICA.mudo = false;
  guardar("volEfectos", MUSICA.volEfx); guardar("mudo", false);
  iniciarMusica(); ajustarVolumen(0.1);
});
$("#volEfectos").addEventListener("change", () => sonar({ k: "juega" }));
pintarSonido();

// ------------------------------------------------------------------ efectos de sonido
// Grabaciones de cartas, dado y fichas: «Casino Audio» de Kenney (kenney.nl), licencia CC0.
const MUESTRAS = { carta: ["card-place-1", "card-place-2", "card-place-3", "card-place-4"], abanico: ["card-fan-1", "card-fan-2"], dado: ["die-throw-1", "die-throw-2", "die-throw-3", "die-throw-4"], ficha: ["chip-lay-1", "chip-lay-2", "chip-lay-3"] };
const BUF = {};
let muestrasPedidas = false;
function cargarMuestras() {
  if (muestrasPedidas || !MUSICA.ctx) return;
  muestrasPedidas = true;
  for (const [grupo, lista] of Object.entries(MUESTRAS)) {
    BUF[grupo] = [];
    for (const n of lista) fetch(`audio/sfx/${n}.mp3`).then((r) => r.arrayBuffer()).then((b) => MUSICA.ctx.decodeAudioData(b)).then((x) => BUF[grupo].push(x)).catch(() => {});
  }
}
function tocar(grupo, t, vol = 0.8, ritmo = 1) {
  const lista = BUF[grupo];
  if (!lista?.length) return false;
  const ctx = MUSICA.ctx, f = ctx.createBufferSource(), g = ctx.createGain();
  f.buffer = lista[Math.floor(Math.random() * lista.length)];
  f.playbackRate.value = ritmo * (0.95 + Math.random() * 0.1);
  g.gain.value = vol;
  f.connect(g).connect(MUSICA.efx);
  f.start(t);
  return true;
}
// Sintetizados con Web Audio: no pesan nada y se pueden cambiar por grabaciones cuando existan.
let ECO = null;
function eco(ctx) {
  if (ECO) return ECO;
  const n = ctx.sampleRate * 3.2, b = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2); }
  ECO = ctx.createConvolver(); ECO.buffer = b; ECO.connect(MUSICA.efx);
  return ECO;
}
function ruido(ctx, seg) {
  const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * seg), ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const f = ctx.createBufferSource(); f.buffer = b; return f;
}
function env(ctx, g, t, ataque, pico, caida) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(pico, t + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + ataque + caida);
}
const SFX = {
  roce(ctx, t, fuerte = 0.35) { // carta que se desliza
    const f = ruido(ctx, 0.35), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = "bandpass"; bp.Q.value = 1.2; bp.frequency.setValueAtTime(900, t); bp.frequency.exponentialRampToValueAtTime(3800, t + 0.25);
    env(ctx, g, t, 0.03, fuerte, 0.28);
    f.connect(bp).connect(g).connect(MUSICA.efx); f.start(t);
  },
  dado(ctx, t) {
    for (let i = 0; i < 7; i++) {
      const tt = t + i * 0.07 + Math.random() * 0.05, f = ruido(ctx, 0.05), hp = ctx.createBiquadFilter(), g = ctx.createGain();
      hp.type = "highpass"; hp.frequency.value = 1800 + Math.random() * 1500;
      env(ctx, g, tt, 0.003, 0.45 * (1 - i / 9), 0.05);
      f.connect(hp).connect(g).connect(MUSICA.efx); f.start(tt);
    }
  },
  chasquido(ctx, t) { // alguien toma su lugar en la sala: un chasquido de dedos con brillo
    const f = ruido(ctx, 0.04), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = "bandpass"; bp.frequency.value = 2600; bp.Q.value = 1.4;
    env(ctx, g, t, 0.002, 0.9, 0.05);
    f.connect(bp).connect(g).connect(MUSICA.efx); f.start(t);
    const o = ctx.createOscillator(), g2 = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(1320, t + 0.01); o.frequency.exponentialRampToValueAtTime(1760, t + 0.12);
    env(ctx, g2, t + 0.01, 0.005, 0.12, 0.22);
    o.connect(g2).connect(MUSICA.efx); o.start(t + 0.01); o.stop(t + 0.3);
  },
  campanita(ctx, t, base = 880) { // evidencia confirmada
    [1, 1.5, 2.01].forEach((m, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = base * m; env(ctx, g, t + i * 0.09, 0.005, 0.18, 1.4);
      o.connect(g).connect(MUSICA.efx); o.start(t + i * 0.09); o.stop(t + 2);
    });
  },
  campana(ctx, t, base = 196, fuerte = 0.35) { // muerte y Alba
    const g0 = ctx.createGain(); g0.connect(MUSICA.efx); g0.connect(eco(ctx));
    [1, 2, 2.4, 3, 4.2, 5.4].forEach((m, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = base * m; env(ctx, g, t, 0.004, fuerte / (i + 1), 3.5 - i * 0.4);
      o.connect(g).connect(g0); o.start(t); o.stop(t + 4);
    });
  },
  grito(ctx, t, lejos = true) { // lamento que se pierde en la casona
    const dur = 1.9, salida = ctx.createGain(), lp = ctx.createBiquadFilter();
    lp.type = "lowpass"; lp.frequency.value = lejos ? 1800 : 4200;
    const seco = ctx.createGain(); seco.gain.value = lejos ? 0.12 : 0.6;
    const mojado = ctx.createGain(); mojado.gain.value = lejos ? 1 : 0.5;
    salida.connect(lp); lp.connect(seco).connect(MUSICA.efx); lp.connect(mojado).connect(eco(ctx));
    env(ctx, salida, t, 0.09, lejos ? 0.5 : 0.8, dur);
    const vib = ctx.createOscillator(), vg = ctx.createGain();
    vib.frequency.value = 6.5; vg.gain.value = 28; vib.connect(vg);
    for (const det of [0, 9]) {
      const o = ctx.createOscillator(); o.type = "sawtooth";
      o.frequency.setValueAtTime(620 + det, t);
      o.frequency.exponentialRampToValueAtTime(980 + det, t + 0.35);
      o.frequency.exponentialRampToValueAtTime(360 + det, t + dur);
      vg.connect(o.frequency);
      for (const [fq, q] of [[900, 5], [1350, 6], [2600, 8]]) {
        const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = fq; bp.Q.value = q;
        o.connect(bp).connect(salida);
      }
      o.start(t); o.stop(t + dur + 0.2);
    }
    vib.start(t); vib.stop(t + dur + 0.2);
  },
  retumbo(ctx, t) { // el Espanto
    const f = ruido(ctx, 3), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = "lowpass"; lp.frequency.value = 140;
    env(ctx, g, t, 0.4, 1.4, 2.4);
    f.connect(lp).connect(g).connect(MUSICA.efx); f.start(t);
  },
  latido(ctx, t) {
    [0, 0.28].forEach((d, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(70, t + d); o.frequency.exponentialRampToValueAtTime(38, t + d + 0.15);
      env(ctx, g, t + d, 0.01, i ? 0.45 : 0.6, 0.2);
      o.connect(g).connect(MUSICA.efx); o.start(t + d); o.stop(t + d + 0.3);
    });
  },
  susurro(ctx, t) { // manifestación
    const f = ruido(ctx, 1.4), bp = ctx.createBiquadFilter(), g = ctx.createGain(), trem = ctx.createOscillator(), tg = ctx.createGain();
    bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = 3;
    trem.frequency.value = 9; tg.gain.value = 0.12; trem.connect(tg).connect(g.gain);
    env(ctx, g, t, 0.2, 0.25, 1.1);
    f.connect(bp).connect(g); g.connect(MUSICA.efx); g.connect(eco(ctx));
    f.start(t); trem.start(t); trem.stop(t + 1.5);
  },
  puerta(ctx, t) { // Portazo: golpe seco de madera y el marco que vibra
    const f = ruido(ctx, 0.5), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    lp.type = "lowpass"; lp.frequency.value = 900;
    env(ctx, g, t, 0.004, 1.2, 0.35);
    f.connect(lp).connect(g); g.connect(MUSICA.efx); g.connect(eco(ctx)); f.start(t);
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.25);
    env(ctx, og, t, 0.003, 0.9, 0.3);
    o.connect(og).connect(MUSICA.efx); o.start(t); o.stop(t + 0.4);
    const k = ruido(ctx, 0.06), hp = ctx.createBiquadFilter(), kg = ctx.createGain();
    hp.type = "bandpass"; hp.frequency.value = 2200; hp.Q.value = 2;
    env(ctx, kg, t + 0.12, 0.002, 0.25, 0.06);
    k.connect(hp).connect(kg).connect(MUSICA.efx); k.start(t + 0.12);
  },
  viento(ctx, t) { // Escalofrío
    const dur = 2.6, f = ruido(ctx, dur), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = "bandpass"; bp.Q.value = 6;
    bp.frequency.setValueAtTime(400, t); bp.frequency.linearRampToValueAtTime(1100, t + 1.1); bp.frequency.linearRampToValueAtTime(520, t + dur);
    env(ctx, g, t, 0.7, 0.55, 1.9);
    f.connect(bp).connect(g); g.connect(MUSICA.efx); g.connect(eco(ctx)); f.start(t);
  },
  rosario(ctx, t) { // cuentas que se deslizan y un rezo apagado
    for (let i = 0; i < 9; i++) {
      const tt = t + i * 0.055 + Math.random() * 0.02, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = 2400 + Math.random() * 900;
      env(ctx, g, tt, 0.002, 0.12, 0.05);
      o.connect(g).connect(MUSICA.efx); o.start(tt); o.stop(tt + 0.08);
    }
    [220, 277, 330].forEach((fq) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = fq; env(ctx, g, t + 0.45, 0.4, 0.07, 1.6);
      o.connect(g); g.connect(MUSICA.efx); g.connect(eco(ctx)); o.start(t + 0.45); o.stop(t + 2.6);
    });
  },
  ultraje(ctx, t) { // golpe de fe: un latigazo que empuja al ánima
    const f = ruido(ctx, 0.9), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = "bandpass"; bp.Q.value = 1.5; bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(5000, t + 0.35);
    env(ctx, g, t, 0.3, 0.6, 0.4);
    f.connect(bp).connect(g); g.connect(MUSICA.efx); g.connect(eco(ctx)); f.start(t);
    const o = ctx.createOscillator(), og = ctx.createGain();
    o.type = "sawtooth"; o.frequency.setValueAtTime(160, t + 0.32); o.frequency.exponentialRampToValueAtTime(40, t + 0.9);
    env(ctx, og, t + 0.32, 0.005, 0.35, 0.55);
    o.connect(og).connect(MUSICA.efx); o.start(t + 0.32); o.stop(t + 1);
  },
  copal(ctx, t) { // brasa que chisporrotea y humo que sube
    const f = ruido(ctx, 1.8), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    bp.type = "highpass"; bp.frequency.value = 3000;
    env(ctx, g, t, 0.5, 0.18, 1.3);
    f.connect(bp).connect(g); g.connect(MUSICA.efx); g.connect(eco(ctx)); f.start(t);
    for (let i = 0; i < 12; i++) {
      const tt = t + Math.random() * 1.4, k = ruido(ctx, 0.02), kg = ctx.createGain();
      env(ctx, kg, tt, 0.001, 0.2 + Math.random() * 0.2, 0.02);
      k.connect(kg).connect(MUSICA.efx); k.start(tt);
    }
  },
  suave(ctx, t) { // Té de tila, Respirar hondo, Ruda
    [392, 494, 587].forEach((fq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = fq; env(ctx, g, t + i * 0.12, 0.25, 0.08, 1.4);
      o.connect(g); g.connect(MUSICA.efx); g.connect(eco(ctx)); o.start(t + i * 0.12); o.stop(t + 2);
    });
  },
  estatica(ctx, t) { // Interferencia
    const f = ruido(ctx, 0.9), bp = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    bp.type = "bandpass"; bp.frequency.value = 1800; bp.Q.value = 0.7;
    lfo.type = "square"; lfo.frequency.value = 13; lg.gain.value = 0.18; lfo.connect(lg).connect(g.gain);
    env(ctx, g, t, 0.02, 0.3, 0.8);
    f.connect(bp).connect(g).connect(MUSICA.efx); f.start(t); lfo.start(t); lfo.stop(t + 1);
  },
  aviso(ctx, t) { // te toca
    [659, 988].forEach((fq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = fq; env(ctx, g, t + i * 0.13, 0.01, 0.12, 0.5);
      o.connect(g).connect(MUSICA.efx); o.start(t + i * 0.13); o.stop(t + 0.9);
    });
  },
  final(ctx, t, gano) { // remate al terminar
    const notas = gano ? [262, 330, 392, 523] : [220, 208, 196, 147];
    notas.forEach((fq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = fq; env(ctx, g, t + i * 0.22, 0.02, 0.16, i === 3 ? 2.2 : 0.5);
      o.connect(g); g.connect(MUSICA.efx); g.connect(eco(ctx)); o.start(t + i * 0.22); o.stop(t + 3.2);
    });
  },
  brillo(ctx, t) { // defensas y copal
    [1320, 1760, 2217, 2637].forEach((fq, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "triangle"; o.frequency.value = fq; env(ctx, g, t + i * 0.05, 0.01, 0.09, 0.9);
      o.connect(g).connect(MUSICA.efx); o.connect(g); g.connect(eco(ctx)); o.start(t + i * 0.05); o.stop(t + 1.3);
    });
  },
};
// Lo que no trae evento propio se deduce comparando la vista anterior con la nueva.
function sonarCambios(antes, v) {
  const ctx = MUSICA.ctx;
  if (!antes || !ctx || !MUSICA.efx || MUSICA.mudo || ctx.state !== "running") return;
  const t = ctx.currentTime + 0.05;
  try {
    const manos = (x) => x.inv.reduce((n, q) => n + q.nMano, 0) + x.nManoAnima;
    const robadas = manos(v) - manos(antes);
    if (robadas > 0 && !v.ganador) { if (!tocar("abanico", t, 0.7)) SFX.roce(ctx, t, 0.25); }
    let perdio = false, yoAbajo = false;
    v.inv.forEach((q, i) => { if (q.c < antes.inv[i].c) { perdio = true; if (i === MESA.yo && q.vivo && q.c <= 4) yoAbajo = true; } });
    if (perdio) tocar("ficha", t + 0.1, 0.7);
    if (yoAbajo) SFX.latido(ctx, t + 0.3);
    const meToca = (x) => x.pendiente && x.pendiente.quien.includes(MESA.yo) && !x.pendiente.yaRespondio && !trivialParaMi(x.pendiente, x);
    if (meToca(v) && !meToca(antes)) SFX.aviso(ctx, t + 0.2);
    if (v.ganador && !antes.ganador) SFX.final(ctx, t + 0.6, v.ganadores && MESA.yo !== ANIMA ? v.ganadores.includes(MESA.yo) : (v.ganador === "anima") === (MESA.yo === ANIMA));
  } catch { /* nunca detener la partida por un sonido */ }
}
function sonar(e, v) {
  const ctx = MUSICA.ctx;
  if (!ctx || !MUSICA.efx || MUSICA.mudo || ctx.state !== "running") return;
  const t = ctx.currentTime + 0.02;
  try {
    switch (e.k) {
      case "juega": {
        if (!tocar("carta", t)) SFX.roce(ctx, t);
        const c = e.carta, t2 = t + 0.25;
        if (c === "portazo") return SFX.puerta(ctx, t2);
        if (c === "escalofrio") return SFX.viento(ctx, t2);
        if (c === "habilidad" || c === "presencia") return SFX.susurro(ctx, t2);
        if (c === "caceria_total") { SFX.grito(ctx, t2, false); return SFX.grito(ctx, t2 + 0.35, true); }
        if (c === "te" || c === "resp" || c === "ruda") return SFX.suave(ctx, t2);
        if (c === "interferencia") return SFX.estatica(ctx, t2);
        return;
      }
      case "descarta": case "revela": if (!tocar("carta", t, 0.6)) SFX.roce(ctx, t); return;
      case "manifiesta": if (!tocar("carta", t)) SFX.roce(ctx, t); return SFX.susurro(ctx, t + 0.15);
      case "dado": if (!tocar("dado", t, 1)) SFX.dado(ctx, t); if (e.r === "si") SFX.campanita(ctx, t + 0.7); return;
      case "caza": return SFX.grito(ctx, t, true);
      case "muerte": return SFX.campana(ctx, t, 98, 0.5);
      case "espanto": SFX.retumbo(ctx, t); return SFX.grito(ctx, t + 0.5, false);
      case "alba": SFX.campana(ctx, t, 262, 0.3); return SFX.campana(ctx, t + 0.9, 330, 0.25);
      case "espejo": case "tarot": case "velar": return SFX.susurro(ctx, t);
      case "pasa": return SFX.roce(ctx, t);
      case "rol": case "limpia": return SFX.suave(ctx, t);
      case "muneca": case "pentagrama": return SFX.viento(ctx, t);
      case "destapa": SFX.roce(ctx, t); if (e.mintio) SFX.puerta(ctx, t + 0.5); return;
      case "defensa": return e.carta === "ros" ? SFX.rosario(ctx, t) : e.carta === "ult" ? SFX.ultraje(ctx, t) : SFX.brillo(ctx, t);
      case "copal": return SFX.copal(ctx, t);
      case "interferir": return SFX.estatica(ctx, t);
    }
  } catch { /* un efecto que falla no detiene la partida */ }
}



// Vista previa: al pasar sobre un ánima o una habilidad se ve su carta y sus datos.
const NOMBRE_ESPIRITU = { rol_manifestar: "Manifestar", rol_velar: "Velar" };
const EXP_INFO = {
  vaso: { t: "Dado bajo el vaso", cartas: [], txt: "Solo en el modo En equipo, con 3 o 4 investigadores. El dado se tira tapado y solo el ánima lo ve: puede ocultar un No diciendo «Nada». Cualquiera puede destapar: si mintió, pierde su turno; si dijo la verdad, quien destapó pierde cordura (2 con 4 investigadores)." },
  cartaInicial: { t: "Curandero y Devota con su carta (en prueba)", cartas: ["rol_curandero", "rol_devota"], txt: "Con Los testigos de la casona: el Curandero empieza con un Té de tila y la Devota con un Rosario, tomados del mazo. Así su rol nunca se queda sin usar por mala suerte." },
  lectura: { t: "Cartas de lectura (en prueba)", cartas: [], txt: "En vez del dado, 6 cartas numeradas del 1 al 6. Se roba una por lectura y no vuelve hasta que salen las 6 y se rebarajan. Mismas probabilidades que el dado, pero sin rachas largas de mala suerte, y puedes contar las que faltan." },
  objetos: { t: "Objetos malditos", cartas: ["muneca", "tarot", "radio"], txt: "10 cartas extra: Radio, Tablilla espiritista, Mano del mono, Limpia con huevo, Espejo de plata y Tarot para los investigadores; Muñeca de la isla, Espejo de obsidiana y Pentagrama para el ánima." },
  testigos: { t: "Los testigos de la casona", cartas: ["rol_vigia", "rol_tecnico", "rol_guardaespaldas"], txt: "Cada investigador tiene un rol boca arriba que rompe una regla a su favor: Vigía, Improvisador, Técnico, Detective, Curandero, Devota, Sensitivo y Guardaespaldas. El ánima juega con 1 carta más y se retiran 2 Té de tila, 2 Respirar hondo y 2 Rosarios." },
  sesion: { t: "Una tarde en la casona", cartas: [], txt: "Varias partidas seguidas: el ánima rota y se cuentan almas. Acusar bien vale 2, otro ganador 1, el aliado espíritu ½ y el ánima 1 por cada investigador." },
};
function vistaHTML(k) {
  if (k.startsWith("exp:")) {
    const x = EXP_INFO[k.slice(4)];
    return `${x.cartas.length ? `<div class="vp-artes">${x.cartas.map((c) => `<img src="${ARTE(c)}" alt="">`).join("")}</div>` : ""}<div class="vp-txt"><b>${esc(x.t)}</b><p>${esc(x.txt)}</p></div>`;
  }
  if (k in NOMBRE_ESPIRITU) return `<div class="vp-artes"><img src="${ARTE(k)}" alt=""></div><div class="vp-txt"><b>${NOMBRE_ESPIRITU[k]}</b><p>${esc(TEXTO[k])}</p></div>`;
  if (k.startsWith("rol:")) {
    const r = k.slice(4);
    return `<div class="vp-artes"><img src="cartas/rol_${arteRol(r)}.webp" alt=""></div><div class="vp-txt"><b><img class="fam" src="iconos/familia_${FAMILIA_ROL[r]}.webp" alt="">${esc(ROLES[r].nombre)}</b><p>${esc(ROLES[r].texto)}</p></div>`;
  }
  if (k.startsWith("anima:")) {
    const a = ANIMA_POR_ID[k.slice(6)], e = a.espanto;
    return `<div class="vp-artes"><img src="${ARTE("id_" + a.id)}" alt=""><img class="vp-esp" src="${ARTE("es_" + a.id)}" alt=""></div>
      <div class="vp-txt"><b>${esc(a.nombre)}</b><p>${a.ev.map((x) => `<span class="vp-ev m-${V ? estadoEv(V, x) || "nada" : "nada"}">${esc(EVIDENCIAS[x])}</span>`).join("")}</p>
      <p class="vp-esp-t"><b>Espanto: ${esc(e.nombre)}</b></p><p class="nota">${esc(ESPANTO_EFECTO[a.id])}.</p></div>`;
  }
  return `<div class="vp-artes"><img src="${ARTE(k)}" alt=""></div><div class="vp-txt"><b>${esc(cardName(k))}</b><p>${esc(textoDe(k))}</p></div>`;
}
let vistaDe = null;
function ocultarVista() { $("#vista").hidden = true; vistaDe = null; }
function mostrarVista(el) {
  const k = el.dataset.vista;
  if (enStream() && !document.body.classList.contains("espiando") && el.closest(".secreto")) return;
  const caja = $("#vista");
  if (vistaDe !== k) { caja.innerHTML = vistaHTML(k); vistaDe = k; }
  caja.hidden = false;
  caja.classList.toggle("mini", k.startsWith("exp:"));
  // Nunca encima de lo que señalas: a un lado si cabe; si no, arriba o abajo.
  const r = el.getBoundingClientRect(), w = caja.offsetWidth, h = caja.offsetHeight, M = 12;
  const enY = Math.max(8, Math.min(innerHeight - h - 8, r.top + r.height / 2 - h / 2));
  const enX = Math.max(8, Math.min(innerWidth - w - 8, r.left));
  let x, y;
  const arriba = r.top - h - M >= 8, abajo = r.bottom + M + h <= innerHeight - 8;
  // Las casillas de reglas van en fila: su vista previa sale arriba o abajo para no tapar las vecinas.
  if (caja.classList.contains("mini") && (arriba || abajo)) { x = enX; y = arriba ? r.top - h - M : r.bottom + M; }
  else if (r.left - w - M >= 8) { x = r.left - w - M; y = enY; }
  else if (r.right + M + w <= innerWidth - 8) { x = r.right + M; y = enY; }
  else if (r.top - h - M >= 8) { x = enX; y = r.top - h - M; }
  else if (r.bottom + M + h <= innerHeight - 8) { x = enX; y = r.bottom + M; }
  else { x = enX; y = 8; }
  caja.style.left = x + "px";
  caja.style.top = y + "px";
}
document.addEventListener("pointerover", (ev) => {
  if (ev.pointerType === "touch") return;
  const el = ev.target.closest?.("[data-vista]");
  if (el) mostrarVista(el); else if (vistaDe) ocultarVista();
});
document.addEventListener("focusin", (ev) => { const el = ev.target.closest?.("[data-vista]"); if (el) mostrarVista(el); else if (vistaDe) ocultarVista(); });
document.addEventListener("pointerdown", (ev) => { if (vistaDe && ev.pointerType === "touch") ocultarVista(); });

// Configuración inicial
const cfg0 = leer("cfg", { rol: "investigador", nInv: 3 });
$("#rol").value = cfg0.rol;
$("#nInv").value = String(cfg0.nInv);
$("#animaSel").innerHTML = `<option value="azar">Al azar</option>` + ANIMAS.map((a) => `<option value="${a.id}">${esc(a.nombre)}</option>`).join("");
$("#animaSel").value = cfg0.anima || "azar";
pintarAnimaMenu();
$("#modoSel").value = cfg0.modo || "equipo";
$("#vasoSel").checked = !!cfg0.vaso;
$("#sesionSel").checked = !!cfg0.sesion;
$("#objSel").checked = !!cfg0.objetos;
$("#testigosSel").checked = !!cfg0.testigos;
$("#lecturaSel").checked = !!cfg0.lectura;
$("#cartaInicialSel").checked = cfg0.cartaInicial !== false;
$("#repartoSel").value = cfg0.reparto || "robar";
// El vaso solo con 3–4 investigadores; la sesión solo en «Sálvese quien pueda».
function ajustarMenu() {
  const n = Number($("#nInv").value), q = $("#modoSel").value === "cadaQuien";
  $("#vasoSel").disabled = n < 3 || q;
  if (n < 3 || q) $("#vasoSel").checked = false;
  $("#vasoSel").closest("label").title = q ? "En Sálvese quien pueda el dado siempre está a la vista." : n < 3 ? "El vaso solo se usa con 3 o 4 investigadores." : "";
  $("#sesionFila").hidden = !q;
  $("#testigosSel").disabled = n < 2;
  if (n < 2) $("#testigosSel").checked = false;
  $("#testigosSel").closest("label").title = n < 2 ? "Los roles no se usan en el Duelo." : "";
  $("#repartoFila").hidden = !$("#testigosSel").checked;
}
$("#nInv").addEventListener("change", ajustarMenu);
$("#modoSel").addEventListener("change", ajustarMenu);
$("#testigosSel").addEventListener("change", ajustarMenu);
ajustarMenu();
pintarContinuar();
$("#nombre").value = leer("nombre", "");
window.__nda = () => ({ MESA, V });
// Vista previa local de la sala, sin conexión (solo para revisar el diseño): abre la página con #prueba-sala.
if (location.hash === "#prueba-sala") window.__sala = (datos, jugadores) => { SALA = { codigo: "PRUEBA", datos: limpiarSala(datos), jugadores, via: "db" }; mostrar("lobby"); pintarLobby(); };
