// Sitio público del archivo de arte. Se publica en GitHub Pages.
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://jonathan-bello.github.io",
  base: "/Noched-de-animas-arte",
  // Genera juego.html en vez de juego/index.html: así siguen funcionando los enlaces
  // de las páginas heredadas (sistema de diseño, íconos, aprobados, historial).
  build: { format: "file" },
  trailingSlash: "ignore",
  vite: { plugins: [tailwindcss()] },
});
