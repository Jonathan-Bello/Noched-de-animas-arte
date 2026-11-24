const el = id => document.getElementById(id);
async function iniciar() {
  const anterior = new URLSearchParams(location.search).get("lote") === "frentes-01";
  const response = await fetch(anterior ? "catalogo/revision-lote-01.json" : "web/revision/herramientas-02/lote.json");
  if (!response.ok) throw new Error("No se pudo abrir el lote.");
  const {lote, cartas} = await response.json();
  const clave = "noche-de-animas/revision/" + lote;
  const porId = new Map(cartas.map(c => [c.id, c]));
  let votos = new Map();
  let posicion = 0;
  function resultados() {
    return {version: 1, lote, total: cartas.length, completo: votos.size === cartas.length,
      elecciones: cartas.filter(c => votos.has(c.id)).map(c => {
        const opcion = votos.get(c.id);
        return {id: c.id, opcion, sha256: c[opcion].sha256};
      })};
  }
  function leer(datos) {
    if (datos.version !== 1 || datos.lote !== lote || !Array.isArray(datos.elecciones)) throw Error("El archivo pertenece a otro lote.");
    const nuevos = new Map();
    for (const {id, opcion, sha256} of datos.elecciones) {
      if (["a","b"].includes(opcion) && sha256 && porId.get(id)?.[opcion]?.anterior === sha256) continue;
      if (!["a","b","original"].includes(opcion) || !porId.has(id) || porId.get(id)[opcion].sha256 !== sha256 || nuevos.has(id))
        throw Error("Una elección no corresponde a estas ilustraciones.");
      nuevos.set(id, opcion);
    }
    return nuevos;
  }
  function guardar() {
    try {localStorage.setItem(clave, JSON.stringify(resultados()));}
    catch {el("aviso").textContent = "Este navegador no permite guardar el avance. Descarga el JSON antes de salir.";}
  }
  function mostrar() {
    const c = cartas[posicion];
    el("indice").value = String(posicion);
    el("nombre").textContent = c.nombre;
    el("familia").textContent = c.familia;
    el("progreso").textContent = votos.size + " de " + cartas.length + " elecciones guardadas";
    el("barra").max = cartas.length; el("barra").value = votos.size;
    const imagenes = [];
    for (const o of ["a","b","original"]) {
      el("elegir-"+o).disabled = true;
      el("zoom-"+o).href = c[o].archivo;
      el("img-"+o).src = c[o].archivo;
      imagenes.push(el("img-"+o).decode());
      el("img-"+o).alt = c.nombre + " · propuesta " + o.toUpperCase();
      const activa = votos.get(c.id) === o;
      el("elegir-"+o).setAttribute("aria-pressed", String(activa));
      el("elegir-"+o).textContent = o === "original" ? (activa ? "Original seleccionado" : "Conservar original") : (activa ? "Seleccionada " : "Elegir ") + o.toUpperCase();
    }
    Promise.all(imagenes).then(() => {
      if (cartas[posicion].id === c.id) {
        for (const o of ["a","b","original"]) el("elegir-"+o).disabled = false;
      }
    }).catch(() => {
      if (cartas[posicion].id === c.id) el("aviso").textContent = "No se cargaron las tres imágenes. Recarga la página para volver a intentarlo.";
    });
    el("anterior").disabled = !posicion;
    el("siguiente").disabled = posicion === cartas.length-1;
    el("pendiente").disabled = votos.size === cartas.length;
    el("descargar").disabled = !votos.size;
  }
  function pendiente() {
    for (let i=1; i<=cartas.length; i++) {
      const n=(posicion+i)%cartas.length;
      if (!votos.has(cartas[n].id)) { posicion=n; break; }
    }
  }
  el("aviso").textContent = "";
  try { const prev=localStorage.getItem(clave); if(prev) votos=leer(JSON.parse(prev)); }
  catch {el("aviso").textContent="No se pudo recuperar el avance local. Puedes importar una copia JSON.";}
  cartas.forEach((c,n)=>el("indice").add(new Option(c.nombre,String(n))));
  posicion=Math.max(0,cartas.findIndex(c=>!votos.has(c.id)));
  el("indice").onchange=e=>{posicion=Number(e.target.value);mostrar();};
  el("anterior").onclick=()=>{posicion--;mostrar();};
  el("siguiente").onclick=()=>{posicion++;mostrar();};
  el("pendiente").onclick=()=>{pendiente();mostrar();};
  for (const o of ["a","b","original"]) el("elegir-"+o).onclick=()=>{
    const nombre=cartas[posicion].nombre;
    votos.set(cartas[posicion].id,o);
    el("aviso").textContent=nombre+" · elegida "+o.toUpperCase()+". "+(votos.size===cartas.length?"Selección completa. Descarga el JSON.":"");
    guardar();pendiente();mostrar();
  };
  el("descargar").onclick=()=>{
    const url=URL.createObjectURL(new Blob([JSON.stringify(resultados(),null,2)],{type:"application/json"}));
    const link=document.createElement("a");link.href=url;link.download="seleccion-"+lote+".json";link.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
  };
  el("importar").onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    try {const nuevos=leer(JSON.parse(await file.text()));for(const [k,v] of nuevos)votos.set(k,v);el("aviso").textContent="Selección recuperada.";guardar();pendiente();mostrar();}
    catch(error){el("aviso").textContent=error.message;}e.target.value="";
  };
  el("visor").hidden=false;mostrar();
}
iniciar().catch(e=>{el("aviso").textContent=e.message;});
