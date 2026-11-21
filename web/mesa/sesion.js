// Sesión «Una tarde en la casona» (modo Sálvese quien pueda): una partida por jugador,
// el papel de ánima rota y se cuentan almas.
//   - Acusar correctamente: 2 almas.
//   - Ganar de otra forma (sobrevivir al Espanto con más evidencias): 1 alma.
//   - Ser aliado espíritu de quien ganó: ½ alma.
//   - Ganar como ánima: 1 alma por cada investigador en la mesa.
// Desempate: más acusaciones correctas; luego, quien ganó como ánima.

const ACUSACIONES = ["acusacion", "acusacion_inmediata", "acusacion_alba"];

/** Almas de una partida terminada. `jugadorDe(asiento)` da la clave del jugador; `anima` la del ánima. */
export function almasDePartida(v, jugadorDe, anima) {
  const out = {}, acierta = {};
  const suma = (k, n) => (out[k] = (out[k] || 0) + n);
  if (v.ganador === "anima") suma(anima, v.nInv);
  else {
    const acuso = ACUSACIONES.includes(v.via);
    for (const a of v.ganadores || []) { suma(jugadorDe(a), acuso ? 2 : 1); if (acuso) acierta[jugadorDe(a)] = 1; }
    for (const a of v.aliadosGanadores || []) suma(jugadorDe(a), 0.5);
  }
  return { almas: out, aciertos: acierta, animaGano: v.ganador === "anima" };
}

/** Tabla ordenada con el desempate aplicado. */
export function clasificacion(ses) {
  return ses.jugadores.map((nombre, i) => ({ i, nombre, almas: ses.almas[i] || 0, aciertos: ses.aciertos[i] || 0, comoAnima: ses.ganoComoAnima[i] || 0 }))
    .sort((a, b) => b.almas - a.almas || b.aciertos - a.aciertos || b.comoAnima - a.comoAnima);
}

export const fmtAlmas = (n) => (Number.isInteger(n) ? String(n) : `${Math.floor(n)}½`.replace(/^0½$/, "½"));
