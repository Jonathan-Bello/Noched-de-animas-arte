const repo = "Jonathan-Bello/Noched-de-animas-arte";
const media = "https://media.githubusercontent.com/media/" + repo + "/main/";
const names = {back01:"Puerta dorada",back02:"Vela morada",back03:"Calavera dorada",back04:"Calavera roja",back05:"Lupa"};
const byId = id => document.getElementById(id);
const normalize = string => string.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase().trim();
const element = (tag, value) => {const node = document.createElement(tag); if(value) node.textContent=value; return node;};
const data = async path => {const result = await fetch(path); if(!result.ok) throw Error(path); return result.json();};
const picture = (source, alt, lazy=true) => {const img=element("img"); img.src=source; img.alt=alt; if(lazy) img.loading="lazy"; img.decoding="async"; return img;};
let catalog = [];
let filter = "";
const dialog=byId("detalle");

const types = {herramienta:"Herramientas", apoyo:"Apoyo", reaccion:"Reacciones", anima:"Ánima", habilidad:"Habilidades", objeto:"Objetos malditos", identidad:"Identidades", espanto:"Espantos", evidencia:"Evidencias", rol:"Roles", espiritu:"Espíritus", consulta:"Consulta", reglas:"Reglas", componente:"Componentes", marcador:"Marcadores"};
const pending = "PENDIENTE: texto de Jonathan";
const preview = (id, medium=false) => "./web/miniaturas/"+id+(medium?"@2x":"")+".webp";
function openCard(card) {
  byId("detalle-cat").textContent=card.category;
  byId("detalle-titulo").textContent=card.name;
  byId("detalle-estado").textContent=card.use;
  const views = [[card.image,card.category==="Reversos"?"Reverso":card.imageLabel||"Cara principal"],[card.backImage,"Reverso"]].filter(([src])=>src);
  byId("detalle-img").replaceChildren(...views.map(([src,label])=>{
    const figure=element("figure");
    figure.append(picture(src,card.name+" · "+label,false),element("figcaption",label));
    return figure;
  }));
  const fields = [["ID del juego",card.gameId],["ID de arte",card.artId],["Copias",card.count],["Reverso",card.backId],["Estado",card.statusText],["Fecha de aprobación",card.date]];
  byId("detalle-datos").replaceChildren(...fields.flatMap(([label,value])=>[element("dt",label),element("dd",String(value??pending))]));
  const original=byId("detalle-original");
  original.replaceChildren();
  if(card.original) {
    const link=element("a","Ver original");
    link.href=media+card.original;
    original.append(element("p","Descarga pesada del archivo maestro."),link);
  }
  dialog.showModal();
}
function render() {
  const query=normalize(byId("busqueda").value);
  const status=byId("edicion").value;
  const matches=catalog.filter(c=>(!filter||c.category===filter)&&(status==="all"||c.status===status)&&normalize([c.name,c.gameId,c.artId,c.category].join(" ")).includes(query));
  byId("resultados").textContent=matches.length?matches.length+" piezas": "No hay piezas con estos filtros.";
  byId("cartas").replaceChildren(...matches.map(card=>{
    const button=element("button");
    button.type="button";
    button.className="card";
    if(card.thumb) button.append(picture(card.thumb,card.name));
    button.append(element("span",card.name),element("small",card.category+" · "+card.statusText));
    button.addEventListener("click",()=>openCard(card));
    return button;
  }));
}
async function publicPrint(files) {
  const releases=await data("https://api.github.com/repos/"+repo+"/releases?per_page=20");
  const pdfs=new Map();
  for(const release of releases) {
    for(const asset of release.assets) {
      if(asset.state!=="uploaded"||!asset.name.toLowerCase().endsWith(".pdf")||pdfs.has(asset.name)) continue;
      const url=new URL(asset.browser_download_url);
      if(url.origin==="https://github.com"&&url.pathname.startsWith("/"+repo+"/releases/download/")) pdfs.set(asset.name,url.href);
    }
  }
  const known=new Set(files.map(f=>f.file));
  const current=files.map(f=>({...f,url:f.url||pdfs.get(f.file)}));
  for(const [name,url] of pdfs) if(!known.has(name)) current.push({name,url,description:"PDF publicado en el repositorio de arte."});
  return current;
}
function renderPrint(files) {
  byId("descargas").replaceChildren(...files.map(file=>{
    const item=element("article");
    item.append(element("h3",file.name),element("p",file.description));
    if(file.url) {
      const link=element("a","Descargar PDF");
      link.href=file.url;
      link.className="button";
      item.append(link);
    } else item.append(element("p","Descarga pública pendiente de publicación."));
    return item;
  }));
}
async function loadCatalog() {
  const [canon,game,approvals]=await Promise.all([data("./catalogo/canon.cartas.json"),data("./fabrica/catalogo_juego.json"),data("./catalogo/aprobaciones.json")]);
  const art=new Map(canon.base.cartas.map(c=>[c.id,c]));
  const backs=new Map(canon.base.reversos.map(c=>[c.id,c]));
  const backMap=new Map(game.reversos.map(c=>[c.id,c.id_arte]));
  const dates=new Map(approvals.registros.map(c=>[c.id,c.fecha]));
  const statusNames={aprobado:"Aprobado",aprobado_sin_marco:"Arte aprobado sin marco",candidato:"En revisión",requiere_correccion:"Rehacer",falta:"Falta arte"};
  const cards=game.cartas.map(c=>{
    const source=art.get(c.id_arte);
    const portrait=c.id==="rol_manifestar"?"manifestar_original":null;
    const portraitImage=portrait?"./web/miniaturas/personajes/"+portrait+".webp":null;
    const back=backs.get(backMap.get(c.reverso)||c.reverso);
    const extraBack=["rol_reverso","espiritu_reverso"].includes(c.reverso) ? "./web/miniaturas/personajes/"+c.reverso+".webp" : null;
    return {name:c.nombre,category:types[c.tipo]||c.tipo,gameId:c.id,artId:c.id_arte||"Sin asignar",use:c.uso||pending,count:c.cantidad,backId:c.reverso||"No aplica",
      status:(source||c.ilustracion_aprobada)?"approved":"review",statusText:statusNames[c.estado_arte],date:source?dates.get(source.aprobacion):"Sin aprobación de carta terminada",
      original:source?.formatos.png?.objeto,thumb:c.vista||(source?preview(source.id):portraitImage),image:c.ilustracion_aprobada||(source?preview(source.id,true):portraitImage),imageLabel:c.ilustracion_aprobada?"Ilustración aprobada sin marco":portrait?(c.id==="rol_manifestar"?"Ilustración aprobada sin marco":"Referencia de identidad ilustrada"):"Cara principal",backImage:back?preview(back.id,true):extraBack};
  });
  const reverses=game.reversos.filter(c=>backs.has(c.id_arte)).map(c=>{
    const source=backs.get(c.id_arte);
    return {name:names[c.id]||c.nombre,category:"Reversos",gameId:c.id,artId:source.id,use:c.nombre,count:cards.filter(k=>k.backId===c.id).reduce((n,k)=>n+k.count,0),backId:"Es un reverso",status:"approved",statusText:"Aprobado",date:dates.get(source.aprobacion),
      original:source.formatos.png?.objeto,thumb:preview(source.id),image:preview(source.id,true)};
  });
  // A proof identifies a layout; it does not approve the associated illustration.
  const proofs=[["pentagrama","pentagrama"],["Q2","peligros"],["rol_vigia",null]].flatMap(([id,file])=>{
    const card=cards.find(c=>c.gameId===id);
    return card?[{...card,name:card.name+" · prueba",status:"proof",statusText:"Prueba de imprenta",date:"Sin aprobación de esta prueba",original:null,thumb:file?"./archivo/arte/"+file+".webp":null,image:file?"./archivo/arte/"+file+".webp":null}]:[];
  });
  catalog=[...cards,...reverses,...proofs];
  const filters=["",...new Set(catalog.map(c=>c.category))];
  byId("categorias").replaceChildren(...filters.map(category=>{
    const button=element("button",category||"Todas");
    button.type="button";
    button.setAttribute("aria-pressed",String(!category));
    button.addEventListener("click",()=>{
      filter=category;
      for(const child of byId("categorias").children) child.setAttribute("aria-pressed",String(button===child));
      render();
    });
    return button;
  }));
  if(new URLSearchParams(location.search).get("edicion")==="aprobadas") byId("edicion").value="approved";
  render();
}
if(dialog) {
  byId("busqueda").addEventListener("input",render);
  byId("edicion").addEventListener("change",render);
  loadCatalog().catch(()=>{byId("resultados").textContent="No se pudo cargar el catálogo. Recarga la página para volver a intentarlo.";});
}
if(byId("descargas")) data("./archivo-publico.json").then(({descargas})=>{
  renderPrint(descargas);
  publicPrint(descargas).then(renderPrint).catch(()=>{});
});
