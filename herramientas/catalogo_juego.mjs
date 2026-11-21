// Genera fabrica/catalogo_juego.json y fabrica/CARTAS_DEL_JUEGO.md a partir del juego de cartas.
// Uso: node herramientas/catalogo_juego.mjs RUTA_AL_REPO_DEL_JUEGO
// Fuente de verdad de reglas: el motor del juego (app/motor/data.js y los textos de app/main.js).
// Fuente de verdad del arte aprobado: catalogo/canon.cartas.json y catalogo/seleccion_roles.json de este repo.
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const R = join(dirname(fileURLToPath(import.meta.url)), "..");
const JUEGO = process.argv[2];
if (!JUEGO) throw new Error("Indica la ruta del repo del juego de cartas.");
const D = await import(pathToFileURL(join(JUEGO, "app/motor/data.js")).href);
const main = readFileSync(join(JUEGO, "app/main.js"), "utf8");
const objeto = (nombre) => { const i = main.indexOf(`const ${nombre} = {`); const j = main.indexOf("\n};", i); return Function(`return ${main.slice(i + `const ${nombre} = `.length, j + 2)}`)(); };
const TEXTO = objeto("TEXTO"), ESPANTO_EFECTO = objeto("ESPANTO_EFECTO");
let commitJuego = "desconocido"; try { commitJuego = execSync(`git -C "${JUEGO}" rev-parse HEAD`).toString().trim(); } catch {}

const canon = JSON.parse(readFileSync(join(R, "catalogo/canon.cartas.json"), "utf8"));
const roles = JSON.parse(readFileSync(join(R, "catalogo/seleccion_roles.json"), "utf8")).roles;
let ilusRoles = {}; try { ilusRoles = JSON.parse(readFileSync(join(R, "catalogo/ilustraciones_roles_aprobadas.json"), "utf8")); } catch {}
const porNombre = Object.fromEntries(canon.base.cartas.map((c) => [c.nombre, c]));
const porId = Object.fromEntries([...canon.base.cartas, ...canon.base.reversos].map((c) => [c.id, c]));
const EV = D.EVIDENCIAS;

const cartas = [];
const add = (o) => cartas.push({ expansion: "base", ...o });
const arte = (c, extra = {}) => c ? { id_arte: c.id, estado_arte: "aprobado", aprobacion: c.aprobacion, ...extra } : { id_arte: null, estado_arte: "falta", ...extra };

// Investigadores
for (let i = 0; i < 7; i++) add({ id: `t${i}`, nombre: D.HERRAMIENTAS[i], tipo: "herramienta", mazo: "investigadores", cantidad: 2, reverso: "back01",
  uso: `Busca ${EV[i]}; detecta con 4 o más. Cuesta 1 de cordura.`, evidencia: EV[i], ...arte(porNombre[D.HERRAMIENTAS[i]]) });
const TIPO_INV = { kit: "herramienta", te: "apoyo", resp: "apoyo", ruda: "apoyo", ros: "reaccion", esc: "reaccion", ult: "reaccion", copal: "reaccion" };
for (const k of ["kit", "te", "resp", "ros", "esc", "ult", "ruda", "copal"]) add({ id: k, nombre: D.INV_CARDS[k].nombre, tipo: TIPO_INV[k], mazo: "investigadores", cantidad: D.INV_CARDS[k].cant, reverso: "back01", uso: TEXTO[k], ...arte(porNombre[D.INV_CARDS[k].nombre]) });
add({ id: "alba", nombre: "Alba", tipo: "marcador", mazo: "investigadores", cantidad: 1, reverso: "back01", uso: "Va boca arriba debajo del mazo de investigadores: cuando solo queda ella, termina la noche.", ...arte(porId.p02) });
for (const [k, v] of Object.entries(D.OBJETOS_INV)) add({ id: k, nombre: v.nombre, tipo: "objeto", mazo: "investigadores", cantidad: v.cant, reverso: "back01", expansion: "objetos", uso: TEXTO[k], ...arte(porNombre[v.nombre]) });
// Ánima
for (const [k, v] of Object.entries(D.GHOST_CARDS)) add({ id: k, nombre: v.nombre, tipo: "anima", mazo: "anima", cantidad: v.cant, reverso: "back02", uso: TEXTO[k], ...arte(porNombre[v.nombre]) });
Object.entries(D.HABILIDADES).forEach(([k, v], i) => add({ id: k, nombre: v.nombre, tipo: "habilidad", mazo: "anima", cantidad: 1, reverso: "back02", evidencia: EV[v.ev], uso: `Deja una pista de ${EV[v.ev]}. ${TEXTO[k]}`, ...arte(porId[`h0${i + 1}`]) }));
for (const [k, v] of Object.entries(D.OBJETOS_ANIMA)) add({ id: k, nombre: v.nombre, tipo: "objeto", mazo: "anima", cantidad: v.cant, reverso: "back02", expansion: "objetos", uso: TEXTO[k], ...arte(porNombre[v.nombre], k === "pentagrama" ? { estado_arte: "falta", nota: "Arte provisional; PENDIENTES.md" } : {}) });
// Ánimas: identidad y Espanto (el orden del canon id01–id21 / s01–s21 coincide con el del motor)
D.ANIMAS.forEach((a, i) => {
  const n = String(i + 1).padStart(2, "0");
  add({ id: `id_${a.id}`, nombre: a.nombre, tipo: "identidad", mazo: "identidades", cantidad: 1, reverso: "back03", evidencias: a.ev.map((e) => EV[e]),
    uso: `Ánima secreta. Deja ${a.ev.map((e) => EV[e]).join(", ")}.`, ...arte(porId[`id${n}`]) });
  const es = D.espantoDe(a, 4);
  add({ id: `es_${a.id}`, nombre: a.espanto.nombre, tipo: "espanto", mazo: "espantos", cantidad: 1, reverso: "back04", anima: a.nombre, umbral: a.espanto.umbral,
    bloqueos: Object.keys(a.espanto.bloqueos ?? {}), uso: ESPANTO_EFECTO[a.id], ...arte(porId[`s${n}`]) });
});
EV.forEach((e, i) => add({ id: `ev${i}`, nombre: e, tipo: "evidencia", mazo: "evidencias", cantidad: 1, reverso: "back05", uso: `La busca: ${D.HERRAMIENTAS[i]}. El ánima la entrega cuando se confirma.`, ...arte(porId[`e0${i + 1}`]) }));
// Testigos de la casona: roles y espíritus
const ARCHIVO_ROL = { curandera: "curandero", sensitiva: "sensitivo", padre: "devota" };
for (const [k, v] of Object.entries(D.ROLES)) {
  const cand = roles.find((r) => r.role_id === k);
  add({ id: `rol_${ARCHIVO_ROL[k] ?? k}`, id_motor: k, nombre: v.nombre, tipo: "rol", mazo: "roles", cantidad: 1, reverso: "rol_reverso", expansion: "testigos", uso: v.texto,
    id_arte: null, candidato: cand?.candidato_entregado ?? null,
    ...(ilusRoles[`rol_${ARCHIVO_ROL[k] ?? k}`] ? { estado_arte: "aprobado_sin_marco", ilustracion_aprobada: ilusRoles[`rol_${ARCHIVO_ROL[k] ?? k}`].ilustracion, nota: "Ilustración aprobada; falta componer la carta con marco." }
      : { estado_arte: cand?.estado === "requiere_rehacer_parecido" ? "requiere_correccion" : "candidato" }) });
}
for (const k of ["rol_velar", "rol_manifestar"]) add({ id: k, nombre: k === "rol_velar" ? "Velar" : "Manifestar", tipo: "espiritu", mazo: "espiritus", cantidad: 4, reverso: "espiritu_reverso", expansion: "testigos", uso: TEXTO[k],
  id_arte: null, estado_arte: k === "rol_manifestar" ? "aprobado_sin_marco" : "candidato", nota: k === "rol_manifestar" ? "Arte original aprobado (extras_aprobados.manifestar_original); falta registrar la carta terminada." : "Valorar Velar actual o la alternativa v10 (PENDIENTES.md)." });
// Consulta y reglas (dos caras)
for (let i = 1; i <= 5; i++) add({ id: `Q${i}`, nombre: porId[`Q${i}`].nombre, tipo: "consulta", mazo: "consulta", cantidad: 1, reverso: `Q${i}B`, uso: "Carta de consulta de íconos (dos caras).", ...arte(porId[`Q${i}`]) });
for (let i = 1; i <= 5; i++) add({ id: `R0${i}`, nombre: porId[`p0${i + 2}`].nombre, tipo: "reglas", mazo: "consulta", cantidad: 1, reverso: `R0${i}B`, id_reverso_arte: `R0${i}`, uso: "Carta de reglas: ilustración al frente y resumen al reverso.", ...arte(porId[`p0${i + 2}`]) });
// Componentes sin arte todavía
add({ id: "cordura", nombre: "Tarjeta de cordura", tipo: "componente", mazo: "componentes", cantidad: 4, reverso: "Q1B", uso: "Escala de 10 a 0 con un clip, una por investigador.", id_arte: null, estado_arte: "falta" });

const REVERSOS = [
  ["back01", "Investigadores", "back01"], ["back02", "Ánima", "back02"], ["back03", "Identidades", "back03"], ["back04", "Espantos", "back04"], ["back05", "Evidencias", "back05"],
  ["rol_reverso", "Roles", null], ["rol_reverso_gris", "Rol usado (alternativo)", null], ["espiritu_reverso", "Espíritus", null],
  ...[1, 2, 3, 4, 5].map((i) => [`Q${i}B`, `Consulta ${i} (reverso)`, `Q${i}B`]), ...[1, 2, 3, 4, 5].map((i) => [`R0${i}B`, `Reglas ${i} (reverso)`, `R0${i}`]),
].map(([id, nombre, ida]) => ({ id, nombre, id_arte: ida, estado_arte: ida ? "aprobado" : "candidato" }));

const total = cartas.reduce((n, c) => n + c.cantidad, 0);
const out = { schema_version: 1, generado: new Date().toISOString().slice(0, 10), juego: { repositorio: "Jonathan-Bello/NOCHE-DE-ANIMAS", commit: commitJuego },
  nota: "Catálogo de lo que existe en el juego. El arte aprobado se decide en catalogo/canon.cartas.json; este archivo solo lo relaciona con el juego.",
  totales: { caras_distintas: cartas.length, cartas_fisicas: total }, cartas, reversos: REVERSOS };
writeFileSync(join(R, "fabrica/catalogo_juego.json"), JSON.stringify(out, null, 2) + "\n");

// Tabla legible
const E = { aprobado: "✅ Aprobado", aprobado_sin_marco: "🟡 Arte aprobado, falta carta", candidato: "🟡 Candidato", requiere_correccion: "🔴 Rehacer", falta: "⬜ Falta" };
const MAZOS = [["investigadores", "Mazo de investigadores"], ["anima", "Mazo del ánima"], ["identidades", "Identidades de las ánimas"], ["espantos", "Espantos"], ["evidencias", "Cartas de evidencia"], ["roles", "Roles (Los testigos de la casona)"], ["espiritus", "Cartas de espíritu"], ["consulta", "Consulta y reglas"], ["componentes", "Componentes"]];
let md = `# Cartas del juego\n\nGenerado con \`herramientas/catalogo_juego.mjs\` desde el juego (commit \`${commitJuego.slice(0, 7)}\`). No editar a mano.\n\n**${cartas.length} caras distintas · ${total} cartas físicas.**\n\n`;
const cuenta = {}; for (const c of cartas) cuenta[c.estado_arte] = (cuenta[c.estado_arte] ?? 0) + 1;
md += "| Estado del arte | Caras |\n|---|---|\n" + Object.entries(cuenta).map(([k, v]) => `| ${E[k]} | ${v} |`).join("\n") + "\n\n";
for (const [m, t] of MAZOS) {
  const L = cartas.filter((c) => c.mazo === m); if (!L.length) continue;
  md += `## ${t}\n\n| Id juego | Id arte | Carta | Copias | Reverso | Qué hace | Arte |\n|---|---|---|---|---|---|---|\n`;
  for (const c of L) md += `| \`${c.id}\` | ${c.id_arte ? "`" + c.id_arte + "`" : "—"} | ${c.nombre}${c.expansion !== "base" ? ` *(${c.expansion})*` : ""} | ${c.cantidad} | \`${c.reverso}\` | ${(c.uso ?? "").replace(/\|/g, "/")} | ${E[c.estado_arte]} |\n`;
  md += "\n";
}
md += "## Reversos\n\n| Id | Para | Id arte | Arte |\n|---|---|---|---|\n" + REVERSOS.map((r) => `| \`${r.id}\` | ${r.nombre} | ${r.id_arte ? "`" + r.id_arte + "`" : "—"} | ${E[r.estado_arte]} |`).join("\n") + "\n";
writeFileSync(join(R, "fabrica/CARTAS_DEL_JUEGO.md"), md);
console.log(`${cartas.length} caras, ${total} cartas físicas`, cuenta);
