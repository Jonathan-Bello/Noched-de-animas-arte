// Copia a public/ lo que el sitio sirve tal cual desde el repositorio.
// Solo archivos fuera de Git LFS: el sitio nunca descarga originales (no gasta el límite de LFS).
import { cpSync, rmSync, mkdirSync, existsSync, readFileSync, statSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const SITIO = join(dirname(fileURLToPath(import.meta.url)), "..");
const REPO = join(SITIO, "..");
const PUBLIC = join(SITIO, "public");

// Páginas que todavía no se migran a Astro: se sirven igual que antes.
export const HEREDADAS = [
  "sistema-de-diseno.html", "aprobados.html", "galeria.html",
  "iconos/galeria.html", "iconos/cartas/sistema-vigente.html", "iconos/cartas/sistema-original.html",
];
const COPIAR = [
  "revision.js", "revision.css", "catalogo/revision-lote-01.json",
  "web", "iconos", "archivo.css", "archivo.js", "archivo-publico.json",
  "catalogo/canon.cartas.json", "catalogo/aprobaciones.json", "catalogo/ilustraciones_roles_aprobadas.json",
  "fabrica/catalogo_juego.json", "archivo/arte", ...HEREDADAS,
];

const esPunteroLFS = (f) => {
  const st = statSync(f);
  if (st.size > 300) return false;
  return readFileSync(f, "utf8").startsWith("version https://git-lfs.github.com/spec/");
};

rmSync(PUBLIC, { recursive: true, force: true });
mkdirSync(PUBLIC, { recursive: true });
let saltados = 0;
for (const rel of COPIAR) {
  const origen = join(REPO, rel);
  if (!existsSync(origen)) { console.warn(`· no existe: ${rel}`); continue; }
  cpSync(origen, join(PUBLIC, rel), {
    recursive: true,
    filter: (f) => { if (statSync(f).isFile() && esPunteroLFS(f)) { saltados++; return false; } return true; },
  });
}
// .nojekyll: GitHub Pages no debe procesar el sitio.
cpSync(join(SITIO, "scripts", "nojekyll"), join(PUBLIC, ".nojekyll"));
const contar = (d) => readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? contar(join(d, e.name)) : 1), 0);
console.log(`public/ listo: ${contar(PUBLIC)} archivos (${saltados} punteros LFS omitidos).`);
