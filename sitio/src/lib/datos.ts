// Carga los datos del repositorio en tiempo de compilación.
// Fuente de verdad: el catálogo del juego (fabrica/catalogo_juego.json), el canon y las aprobaciones.
// Nada se escribe a mano en las páginas si existe en estos archivos.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import leyendasJson from "../data/leyendas.json";

const REPO = join(process.cwd(), "..");
const leer = <T>(rel: string): T => JSON.parse(readFileSync(join(REPO, rel), "utf8")) as T;

export type EstadoArte = "aprobado" | "aprobado_sin_marco" | "candidato" | "requiere_correccion" | "falta";

export interface CartaJuego {
  id: string;
  id_motor?: string;
  id_arte: string | null;
  nombre: string;
  tipo: string;
  mazo: string;
  cantidad: number;
  reverso: string;
  expansion: string;
  uso?: string;
  estado_arte: EstadoArte;
  evidencia?: string;
  evidencias?: string[];
  anima?: string;
  umbral?: number;
  bloqueos?: string[];
  nota?: string;
  ilustracion_aprobada?: string;
}
export interface Reverso { id: string; nombre: string; id_arte: string | null; estado_arte: EstadoArte }
interface Catalogo { generado: string; juego: { commit: string }; totales: { caras_distintas: number; cartas_fisicas: number }; cartas: CartaJuego[]; reversos: Reverso[] }

const catalogo = leer<Catalogo>("fabrica/catalogo_juego.json");
const rolesAprobados = leer<Record<string, { nombre: string; estado_arte: EstadoArte; ilustracion: string; vista: string }>>("catalogo/ilustraciones_roles_aprobadas.json");
const leyendas = leyendasJson.por_id_arte as Record<string, string>;

/** Cartas del juego, con el estado de los roles según sus ilustraciones aprobadas. */
export const cartas: CartaJuego[] = catalogo.cartas.map((c) =>
  rolesAprobados[c.id] ? { ...c, estado_arte: rolesAprobados[c.id].estado_arte, ilustracion_aprobada: rolesAprobados[c.id].ilustracion } : c,
);
export const reversos = catalogo.reversos;
export const totales = {
  ...catalogo.totales,
  cartas_impresas: cartas.filter((c) => c.tipo !== "componente").reduce((n, c) => n + c.cantidad, 0),
};
export const generado = catalogo.generado;

export const EVIDENCIAS = ["Bajo cero", "Huellas de ceniza", "Susurros", "Objetos movidos", "Luces parpadeantes", "Marcas en el espejo", "Olor a azufre"];
const slug = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
/** Ruta del ícono SVG de una evidencia (iconos/cartas/svg). */
export const iconoEvidencia = (nombre: string) => `iconos/cartas/svg/${slug(nombre)}.svg`;

/** Miniatura (290 px) o vista media (@2x, 580 px) de una carta o reverso del canon. */
export const miniatura = (idArte: string | null | undefined, grande = false) =>
  idArte ? `web/miniaturas/${idArte}${grande ? "@2x" : ""}.webp` : null;

/** Imagen para mostrar: carta terminada del canon o, si no existe, la ilustración aprobada. */
export const imagenDe = (c: CartaJuego, grande = false): string | null => {
  if (c.id_arte) return miniatura(c.id_arte, grande);
  const rol = rolesAprobados[c.id];
  if (rol) return grande ? rol.ilustracion : rol.vista;
  if (c.id === "rol_manifestar") return "web/miniaturas/personajes/manifestar_original.webp";
  return null;
};

export const leyendaDe = (c: CartaJuego) => (c.id_arte ? leyendas[c.id_arte] : undefined);

export const ESTADOS: Record<EstadoArte, { texto: string; clase: string }> = {
  aprobado: { texto: "Aprobada", clase: "bg-aprobado/15 text-aprobado ring-aprobado/40" },
  aprobado_sin_marco: { texto: "Arte aprobado · falta la carta", clase: "bg-revision/15 text-revision ring-revision/40" },
  candidato: { texto: "En revisión", clase: "bg-revision/15 text-revision ring-revision/40" },
  requiere_correccion: { texto: "Rehacer", clase: "bg-rehacer/15 text-rehacer ring-rehacer/40" },
  falta: { texto: "Falta", clase: "bg-falta/15 text-falta ring-falta/40" },
};

export const TIPOS: { id: string; nombre: string; que: string }[] = [
  { id: "herramienta", nombre: "Herramientas", que: "Buscan una evidencia con una tirada; cuestan cordura." },
  { id: "apoyo", nombre: "Apoyo", que: "Recuperan cordura o mejoran la siguiente acción." },
  { id: "reaccion", nombre: "Reacciones", que: "Se juegan en el turno del ánima para defenderse." },
  { id: "marcador", nombre: "Marcador", que: "El Alba: cuando solo queda ella en el mazo, termina la noche." },
  { id: "objeto", nombre: "Objetos malditos", que: "Expansión: efectos fuertes, de un solo uso o permanentes." },
  { id: "anima", nombre: "Cartas del ánima", que: "Asustan, quitan cordura, bloquean y cazan." },
  { id: "habilidad", nombre: "Habilidades", que: "Poderes del ánima ligados a una evidencia: pueden delatarla." },
  { id: "identidad", nombre: "Identidades", que: "Qué ánima es. Secreta: la eligen al empezar." },
  { id: "espanto", nombre: "Espantos", que: "El ataque final propio de cada ánima." },
  { id: "evidencia", nombre: "Evidencias", que: "Se entregan cuando una herramienta confirma la señal." },
  { id: "rol", nombre: "Roles", que: "Expansión Los testigos de la casona: una habilidad por investigador." },
  { id: "espiritu", nombre: "Espíritus", que: "Lo que puede hacer un investigador que ya murió." },
  { id: "consulta", nombre: "Consulta", que: "Explican los íconos." },
  { id: "reglas", nombre: "Reglas", que: "Resumen del turno y de la partida." },
  { id: "componente", nombre: "Componentes", que: "Piezas que no se barajan, como la tarjeta de cordura." },
];
