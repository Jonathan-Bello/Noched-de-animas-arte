/** Ruta dentro del sitio, respetando la base de GitHub Pages (/Noched-de-animas-arte/). */
export const url = (ruta = "") => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  return `${base}/${ruta.replace(/^\.?\//, "")}`;
};

export const NAVEGACION = [
  { ruta: "index.html", texto: "Inicio" },
  { ruta: "juego.html", texto: "El juego" },
  { ruta: "personajes.html", texto: "Personajes" },
  { ruta: "cartas.html", texto: "Cartas" },
  { ruta: "sistema-de-diseno.html", texto: "Sistema de diseño" },
  { ruta: "iconos/galeria.html", texto: "Íconos" },
  { ruta: "produccion.html", texto: "Producción" },
  { ruta: "colaborar.html", texto: "Cómo colaborar" },
  { ruta: "descargas.html", texto: "Descargas" },
  { ruta: "galeria.html", texto: "Historial" },
] as const;

export const REPOSITORIO = "https://github.com/Jonathan-Bello/Noched-de-animas-arte";
