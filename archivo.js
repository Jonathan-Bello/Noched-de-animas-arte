const repo = "Jonathan-Bello/Noched-de-animas-arte";
const media = "https://media.githubusercontent.com/media/" + repo + "/main/";
const categories = {i:"Investigador",a:"Ánima",e:"Evidencias",h:"Habilidades",id:"Identidades",s:"Espantos",o:"Objetos malditos",p:"Cartas especiales",Q:"Consulta",back:"Reversos", R:"Reversos",rol:"Roles"};
const statusLabel = {approved:"Aprobada", proof:"Prueba de imprenta", review:"En revisión"};
const names = {back01:"Puerta dorada",back02:"Vela morada",back03:"Calavera dorada",back04:"Calavera roja",back05:"Lupa"};
const byId = id => document.getElementById(id);
const normalize = string => string.normalize("NFD").replace(/\p{Diacritic}/gu,"").toLowerCase().trim();
const element = (tag, value) => {const node = document.createElement(tag); if(value) node.textContent=value; return node;};
const data = async path => {const result = await fetch(path); if(!result.ok) throw Error(path); return result.json();};
const group = id => categories[/^(back|id|[iaehsopQR])/.exec(id)?.[1]] || "Reversos";
const picture = (source, alt, lazy=true) => {const img=element("img"); img.src=source; img.alt=alt; if(lazy) img.loading="lazy"; img.decoding="async"; return img;};
let catalog = [];
let filter = "";
const dialog=byId("detalle");
function openCard(card) {
  byId("detalle-cat").textContent=card.category;
  byId("detalle-titulo").textContent=card.name;
  byId("detalle-estado").textContent=statusLabel[card.status] + " · " + card.id;
  const views = [[card.image,card.category==="Reversos"?"Reverso":"Cara principal"]];
  if(card.back) views.push([card.back,"Reverso"]);
  byId("detalle-img").replaceChildren(...views.map(([src,label])=>{
    const figure=element("figure");
    figure.append(picture(src,card.name+" · "+label,false),element("figcaption",label));
    return figure;
  }));
  dialog.showModal();
}
function render() {
  const query=normalize(byId("busqueda").value);
  const status=byId("edicion").value;
  const matches=catalog.filter(c=>(!filter||c.category===filter)&&(status==="all"||c.status===status)&&normalize(c.name+" "+c.id+" "+c.category).includes(query));
  byId("resultados").textContent=matches.length?matches.length+" piezas": "No hay piezas con estos filtros.";
  byId("cartas").replaceChildren(...matches.map(card=>{
    const button=element("button");
    button.type="button";
    button.className="card";
    button.append(picture(card.thumb||card.image,""),element("span",card.name),element("small",card.category+" · "+statusLabel[card.status]));
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
const asset = (asset, format) => asset.formatos[format] ? media+asset.formatos[format].objeto : undefined;
Promise.allSettled([data("./catalogo/canon.cartas.json"),data("./catalogo/seleccion_roles.json"),data("./archivo-publico.json")]).then(([canon,roles,settings])=>{
  if(settings.status==="fulfilled") {
    const files=settings.value.descargas;
    renderPrint(files);
    publicPrint(files).then(renderPrint).catch(()=>{});
  }
  if(canon.status!=="fulfilled"){byId("resultados").textContent="No se pudo cargar el catálogo. Intenta recargar la página.";return;}
  const {base}=canon.value;
  const backs=new Map(base.reversos.map(back=>[back.id,asset(back,"webp")]));
  const approved=[...base.cartas,...base.reversos].map(c=>({id:c.id,name:names[c.id]||c.nombre||c.id,category:group(c.id),image:asset(c,"webp"),thumb:asset(c,"thumbnail"),back:backs.get(c.reverso_id),status:"approved"}));
  const proposed=roles.status==="fulfilled"?roles.value.roles.filter(r=>r.candidato_entregado).map(r=>({id:r.id+"-candidato",name:r.titulo,category:"Roles",image:media+r.candidato_entregado,status:"review"})):[];
  catalog=[...approved,...(settings.value?.pruebas||[]).map(p=>p.id==="pentagrama-imprenta"?{...p,back:backs.get("back02")}:p),...proposed];
  byId("portada").src=approved.find(c=>c.id==="id01")?.image||approved[0].image;
  const available=new Set(catalog.map(c=>c.category));
  const filters=["",...new Set(Object.values(categories))].filter(c=>!c||available.has(c));
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
  render();
});
byId("busqueda").addEventListener("input",render);
byId("edicion").addEventListener("change",render);
