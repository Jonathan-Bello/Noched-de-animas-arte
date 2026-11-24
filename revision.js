const el = id => document.getElementById(id);
const letras = ["a", "b", "c", "d"];
const claveCarta = carta => carta.pieza || carta.id;
const disponibles = carta => [...letras, "original"].filter(letra => carta[letra]?.archivo);
function huella(carta, opcion) {
  if (opcion === "ninguna") {
    return letras.filter(k => carta[k]).map(k => k + "=" + carta[k].sha256).join(",");
  }
  return carta[opcion]?.sha256;
}

async function iniciar() {
  let indice;
  try {
    const respuesta = await fetch("web/revision/lotes.json", {cache: "no-cache"});
    if (!respuesta.ok) throw Error("Índice no disponible");
    indice = (await respuesta.json()).lotes;
  } catch {
    indice = [
      {lote: "herramientas-02", titulo: "Herramientas · 6 cartas", ruta: "web/revision/herramientas-02/lote.json"},
      {lote: "frentes-01", titulo: "Lote anterior · 66 frentes", ruta: "catalogo/revision-lote-01.json"}
    ];
  }
  const pedido = new URLSearchParams(location.search).get("lote");
  const elegido = indice.find(l => l.lote === pedido) || indice[0];
  if (!elegido) throw Error("El selector aún no tiene lotes.");
  const nav = document.querySelector('nav[aria-label="Lotes de revisión"]');
  nav.replaceChildren(...indice.map(l => {
    const a = document.createElement("a");
    a.href = "?lote=" + encodeURIComponent(l.lote);
    a.textContent = l.titulo;
    if (l === elegido) a.setAttribute("aria-current", "page");
    return a;
  }));
  const response = await fetch(elegido.ruta, {cache: "no-cache"});
  if (!response.ok) throw Error("No se pudo abrir el lote.");
  const {lote, cartas, guionistas, ilustrador, guiones} = await response.json();
  if (!cartas?.length) throw Error("Este lote todavía no tiene ilustraciones.");
  if (guiones) {
    const enlace = document.createElement("a");
    enlace.href = guiones;
    enlace.target = "_blank";
    enlace.rel = "noopener";
    enlace.textContent = "Ver todos los guiones del catálogo";
    nav.after(enlace);
  }
  const clave = "noche-de-animas/revision/" + lote;
  const porId = new Map(cartas.map(c => [claveCarta(c), c]));
  let votos = new Map();
  let posicion = 0;
  let render = 0;

  function resultados() {
    return {version: 1, lote, total: cartas.length, completo: votos.size === cartas.length,
      elecciones: cartas.filter(c => votos.has(claveCarta(c))).map(c => {
        const opcion = votos.get(claveCarta(c));
        return {id: c.id, ...(c.pieza ? {pieza: c.pieza} : {}), opcion, sha256: huella(c, opcion)};
      })};
  }
  function leer(datos) {
    if (datos.version !== 1 || datos.lote !== lote || !Array.isArray(datos.elecciones)) throw Error("El archivo pertenece a otro lote.");
    const nuevos = new Map();
    for (const voto of datos.elecciones) {
      const id = voto.pieza || voto.id;
      const c = porId.get(id);
      const {opcion, sha256} = voto;
      if (!c || c.id !== voto.id || nuevos.has(id) ||
          !(disponibles(c).includes(opcion) || (guionistas && opcion === "ninguna"))) {
        throw Error("Una elección no corresponde a este lote.");
      }
      if (huella(c, opcion) !== sha256) continue;
      nuevos.set(id, opcion);
    }
    return nuevos;
  }
  function guardar() {
    try {localStorage.setItem(clave, JSON.stringify(resultados()));}
    catch {el("aviso").textContent = "Este navegador no puede guardar el avance. Descarga el JSON antes de salir.";}
  }
  function pendiente() {
    for (let i=1; i<=cartas.length; i++) {
      const n = (posicion + i) % cartas.length;
      if (!votos.has(claveCarta(cartas[n]))) { posicion = n; break; }
    }
  }
  function votar(carta, opcion) {
    votos.set(claveCarta(carta), opcion);
    el("aviso").textContent = carta.nombre + " · " + (opcion === "ninguna" ? "ronda descartada." : "elegida " + opcion.toUpperCase() + ".");
    guardar();
    pendiente();
    mostrar();
  }
  function mostrar() {
    const c = cartas[posicion];
    const actual = ++render;
    el("indice").value = String(posicion);
    el("nombre").textContent = c.nombre;
    el("familia").textContent = c.familia;
    el("credito").textContent = ilustrador ? "Ilustraciones de " + ilustrador + ". La autoría indicada en cada opción corresponde a su descripción." : "";
    el("credito").hidden = !ilustrador;
    el("progreso").textContent = votos.size + " de " + cartas.length + " elecciones guardadas";
    el("barra").max = cartas.length;
    el("barra").value = votos.size;
    const opciones = disponibles(c);
    const botones = [];
    const cargas = [];
    const galeria = el("opciones");
    galeria.replaceChildren();
    galeria.classList.toggle("comparativa", Boolean(guionistas));
    for (const o of opciones) {
      const art = document.createElement("article");
      const nombre = o === "original" ? "Original" : o.toUpperCase() + (guionistas?.[o] ? " · " + guionistas[o] : "");
      const rotulo = document.createElement("h3");
      rotulo.textContent = nombre;
      const zoom = document.createElement("a");
      zoom.href = c[o].archivo;
      zoom.target = "_blank";
      zoom.rel = "noopener";
      const img = document.createElement("img");
      img.alt = c.nombre + " · " + nombre;
      img.decoding = "async";
      img.src = c.miniaturas || c[o].archivo;
      if (c.miniaturas) {
        zoom.className = "recorte-miniatura";
        img.style.width = (opciones.length * 100) + "%";
        img.style.left = (-opciones.indexOf(o) * 100) + "%";
      }
      zoom.append(img);
      const boton = document.createElement("button");
      boton.id = "elegir-" + o;
      boton.disabled = true;
      const activa = votos.get(claveCarta(c)) === o;
      boton.setAttribute("aria-pressed", String(activa));
      boton.textContent = o === "original" ? (activa ? "Original seleccionado" : "Conservar original") : (activa ? "Seleccionada " : "Elegir ") + o.toUpperCase();
      boton.onclick = () => votar(c, o);
      art.append(rotulo, zoom, boton);
      if (c[o].descripcion) {
        const ficha = document.createElement("details");
        const titulo = document.createElement("summary");
        titulo.textContent = "Leer descripción";
        const texto = document.createElement("p");
        texto.textContent = c[o].descripcion;
        ficha.append(titulo, texto);
        art.append(ficha);
      }
      galeria.append(art);
      botones.push(boton);
      cargas.push(img.decode());
    }
    const descartar = el("descartar");
    descartar.hidden = !guionistas;
    descartar.disabled = true;
    descartar.setAttribute("aria-pressed", String(votos.get(claveCarta(c)) === "ninguna"));
    descartar.onclick = () => votar(c, "ninguna");
    Promise.all(cargas).then(() => {
      if (actual !== render) return;
      for (const boton of botones) boton.disabled = false;
      descartar.disabled = false;
    }).catch(() => {
      if (actual === render) el("aviso").textContent = "Falta cargar una imagen de esta carta. Recarga la página para revisar todas las opciones.";
    });
    el("anterior").disabled = !posicion;
    el("siguiente").disabled = posicion === cartas.length - 1;
    el("pendiente").disabled = votos.size === cartas.length;
    el("descargar").disabled = !votos.size;
  }
  el("aviso").textContent = pedido && elegido.lote !== pedido ? "Se abrió " + elegido.lote + " porque el lote solicitado no existe." : "";
  try {const prev = localStorage.getItem(clave); if (prev) votos = leer(JSON.parse(prev));}
  catch {el("aviso").textContent = "No se pudo recuperar el avance local. Puedes importar una copia JSON.";}
  cartas.forEach((c,n) => el("indice").add(new Option(c.nombre,String(n))));
  posicion = Math.max(0, cartas.findIndex(c => !votos.has(claveCarta(c))));
  el("indice").onchange = e => {posicion = Number(e.target.value); mostrar();};
  el("anterior").onclick = () => {posicion--; mostrar();};
  el("siguiente").onclick = () => {posicion++; mostrar();};
  el("pendiente").onclick = () => {pendiente(); mostrar();};
  el("descargar").onclick = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(resultados(), null, 2)], {type:"application/json"}));
    const link = document.createElement("a");
    link.href = url;
    link.download = "seleccion-" + lote + ".json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  };
  el("importar").onchange = async e => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const nuevos = leer(JSON.parse(await file.text()));
      for (const [k,v] of nuevos) votos.set(k,v);
      el("aviso").textContent = "Selección recuperada.";
      guardar(); pendiente(); mostrar();
    } catch(error) {el("aviso").textContent = error.message;}
    e.target.value = "";
  };
  el("visor").hidden = false;
  mostrar();
}
iniciar().catch(e => {el("aviso").textContent = e.message;});
