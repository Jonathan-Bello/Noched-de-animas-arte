// Los cinco investigadores del arte aprobado. No tienen reglas propias: solo cara y vestuario.
export const PERSONAJES = [
  { id: "ines", nombre: "Inés" },
  { id: "rafael", nombre: "Rafael" },
  { id: "tomas", nombre: "Tomás" },
  { id: "amalia", nombre: "Amalia" },
  { id: "mateo", nombre: "Padre Mateo" },
];
const norm = (x) => String(x || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s*\(bot\)\s*/, "").trim();

/** Qué personaje viste cada asiento: si el nombre coincide con uno, ese; si no, el primero libre. */
export function personajesDe(inv) {
  const usados = new Set();
  const out = inv.map((q) => {
    const n = norm(q.nombre);
    const p = PERSONAJES.find((x) => !usados.has(x.id) && (n === norm(x.nombre) || n === x.id || (x.id === "mateo" && n === "mateo")));
    if (p) usados.add(p.id);
    return p ? p.id : null;
  });
  return out.map((id) => {
    if (id) return id;
    const p = PERSONAJES.find((x) => !usados.has(x.id));
    usados.add(p.id);
    return p.id;
  });
}

/** Nombres para los bots: 4 de los 5 personajes, en orden al azar. */
export function nombresBots(n, conHumano) {
  const lista = PERSONAJES.map((p) => p.nombre).sort(() => Math.random() - 0.5);
  return conHumano ? ["Tú", ...lista.slice(0, n - 1)] : lista.slice(0, n);
}

/** Arte de cada rol (Los testigos de la casona). El id interno de la regla y el nombre del archivo pueden diferir. */
const ARTE_ROL = { curandera: "curandero", padre: "devota", sensitiva: "sensitivo" };
export const arteRol = (rol) => ARTE_ROL[rol] ?? rol;
export const FAMILIA_ROL = { vigia: "mano", improvisador: "mano", tecnico: "ojo", detective: "ojo", sensitiva: "ojo", curandera: "corazon", padre: "escudo", guardaespaldas: "escudo" };
/** Los roles de un solo uso se voltean (reverso gris) al usarse. */
export const ROL_UN_USO = new Set(["detective", "sensitiva", "guardaespaldas"]); // el Técnico ya no se gasta (17-nov)
// Roles con versión de espíritu de su carta (arte v09). Al morir, su carta muestra al personaje como espíritu.
const CARTA_ESPIRITU = new Set(["tecnico", "devota"]);
export const cartaRol = (q) =>
  !q.vivo && CARTA_ESPIRITU.has(arteRol(q.rol)) ? `rol_${arteRol(q.rol)}_muerto`
  : q.rolUsado && ROL_UN_USO.has(q.rol) ? "rol_reverso_gris" : "rol_" + arteRol(q.rol);
