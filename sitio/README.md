# Sitio público (Astro + Tailwind)

El sitio del archivo de arte. Se compila con Astro 5 y Tailwind CSS 4 y se publica en GitHub Pages con GitHub Actions (`.github/workflows/sitio.yml`).

## Comandos

```bash
cd sitio
npm install
npm run dev      # copia los archivos públicos y abre el servidor en http://localhost:4321/Noched-de-animas-arte/
npm run build    # genera sitio/dist
```

## Cómo está armado

| Carpeta | Qué hay |
|---|---|
| `src/pages/` | Una página por sección: `index`, `juego`, `personajes`, `cartas`, `produccion`, `colaborar`, `descargas` |
| `src/layouts/Base.astro` | Cabecera, navegación (escritorio y celular) y pie, iguales en todo el sitio |
| `src/components/` | `Carta` (miniatura con su proporción 58 × 88), `Estado` (etiqueta de estado del arte), `Evidencia` (ícono y nombre), `Encabezado` |
| `src/lib/datos.ts` | Lee los datos del repositorio al compilar: `fabrica/catalogo_juego.json`, `catalogo/ilustraciones_roles_aprobadas.json` |
| `src/lib/url.ts` | Rutas con la base de GitHub Pages y la navegación |
| `src/data/` | Textos editables: novedades de la portada, qué necesita cada pieza en Producción, datos del sitio (contacto, crédito, titular) y leyendas de las ánimas |
| `src/styles/global.css` | Tema de Tailwind: colores del sitio, paleta del mazo, colores de estado y las tipografías de las cartas |
| `src/assets/fuentes/` | DejaVu Serif Condensed Bold (títulos) y Liberation Serif (leyendas), con sus licencias |
| `scripts/preparar.mjs` | Copia a `public/` lo que se sirve tal cual: miniaturas (`web/`), íconos, datos y las páginas heredadas |

## Reglas

- **Los datos no se escriben a mano en las páginas.** Qué hace cada carta, copias, reversos y estados salen del catálogo del juego. Si algo está mal, se corrige en el catálogo (`herramientas/catalogo_juego.mjs`).
- **El sitio nunca carga archivos de Git LFS.** Solo usa `web/` (miniaturas fuera de LFS), los SVG de íconos y los JSON. `preparar.mjs` descarta cualquier puntero LFS.
- **`fabrica/` no se publica** salvo `catalogo_juego.json`, que es un dato. Las fichas y los prompts son internos.
- **Para editar textos que decide Jonathan** (contacto, crédito, titular), cambia `src/data/sitio.json`. Mientras un valor sea `null`, el sitio muestra «Por definir».
- **Para abrir una pieza a colaboradores**, pon `"abierta": true` en `src/data/produccion.json`: aparece el botón «Tomar esta pieza», que abre el Issue con el id ya escrito.

## Páginas heredadas

Estas páginas aún son el HTML anterior y se copian tal cual: `sistema-de-diseno.html`, `aprobados.html`, `galeria.html` (Historial), `iconos/galeria.html` y `iconos/cartas/*.html`. Se migran a Astro en la siguiente etapa. Como el sitio genera `juego.html` y no `juego/index.html` (`build.format: "file"`), sus enlaces siguen funcionando.

## Publicar

1. En GitHub: **Settings → Pages → Source: GitHub Actions**.
2. En **Settings → Secrets and variables → Actions → Variables**, crea `SITIO_ASTRO` con el valor `true`.
3. Cada cambio en `main` compila y publica. Los Pull Requests solo compilan, para comprobar que no se rompe nada.

Cuando el sitio de Astro esté publicado, las páginas HTML de la raíz que ya migraron (`index`, `juego`, `personajes`, `cartas`, `produccion`, `colaborar`, `descargas`) se pueden borrar.
