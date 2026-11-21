import { ANIMAS, EVIDENCIAS, HERRAMIENTAS } from "./motor/data.js";

import { ESPANTO_EFECTO } from "./espantos.js";

const clave = "nda.libreta.v1";
const nuevo = () => ({ pruebas: {}, animas: {} });
const aviso = document.querySelector("#aviso");
let marcas = nuevo();
try {
  const datos = JSON.parse(localStorage.getItem(clave));
  if (datos?.pruebas && datos?.animas) marcas = datos;
} catch {
  aviso.textContent = "No se pudo recuperar la libreta anterior.";
}
function guardar() {
  try { localStorage.setItem(clave, JSON.stringify(marcas)); }
  catch { aviso.textContent = "El navegador no permite guardar. Las marcas durarán mientras la página siga abierta."; }
}
function elemento(tipo, texto, clase) {
  const nodo = document.createElement(tipo);
  if (texto) nodo.textContent = texto;
  if (clase) nodo.className = clase;
  return nodo;
}
const estados = ["En espera", "Confirmada", "Negada", "Sospecha"];
const simbolos = ["○", "✓", "✗", "?"];
function estado(nombre) {
  const valor = marcas.pruebas[nombre];
  if (valor === "Descartada") return "Negada";
  return estados.includes(valor) ? valor : "En espera";
}

const fichas = [];
function actualizar() {
  let restantes = 0;
  for (const { anima, ficha, indicador, manual } of fichas) {
    const incompatible = EVIDENCIAS.some((nombre, i) => {
      const marca = estado(nombre);
      return (marca === "Confirmada" && !anima.ev.includes(i)) ||
        (marca === "Negada" && anima.ev.includes(i));
    });
    manual.checked = Boolean(marcas.animas[anima.id]);
    const tachada = incompatible || manual.checked;
    if (!tachada) restantes++;
    indicador.textContent = incompatible ? "Descartada por las pruebas" : manual.checked ? "Descarte manual" : "Posible";
    ficha.classList.toggle("tachada", tachada);
  }
  document.querySelector("#resumen").textContent = `Posibles: ${restantes} de ${ANIMAS.length}`;
}

const botones = EVIDENCIAS.map((nombre, i) => {
  const boton = elemento("button", "", "prueba");
  boton.type = "button";
  const titulo = elemento("span", nombre);
  titulo.append(elemento("small", HERRAMIENTAS[i]));
  const indicador = elemento("span", "", "estado");
  boton.append(titulo, indicador);
  const pintar = () => {
    const actual = estado(nombre);
    boton.dataset.estado = actual;
    indicador.textContent = simbolos[estados.indexOf(actual)] + " " + actual;
    boton.setAttribute("aria-label", nombre + ": " + actual + ". Cambiar estado");
  };
  boton.onclick = () => {
    marcas.pruebas[nombre] = estados[(estados.indexOf(estado(nombre)) + 1) % estados.length];
    pintar();
    actualizar();
    guardar();
  };
  pintar();
  document.querySelector("#pruebas").append(boton);
  return pintar;
});

function carta(archivo, titulo) {
  const figura = elemento("figure");
  const imagen = elemento("img");
  imagen.loading = "lazy";
  imagen.alt = "Carta de " + titulo;
  imagen.src = "cartas/" + archivo + ".webp";
  figura.append(imagen, elemento("figcaption", titulo));
  return figura;
}
for (const anima of ANIMAS) {
  const ficha = elemento("details");
  const cabecera = elemento("summary");
  const indicador = elemento("span", "", "estado-anima");
  cabecera.append(elemento("strong", anima.nombre, "nombre"), indicador);
  const cartas = elemento("div", "", "cartas-ficha");
  cartas.append(carta("id_" + anima.id, anima.nombre), carta("es_" + anima.id, anima.espanto.nombre));
  const manual = elemento("input");
  manual.type = "checkbox";
  const etiqueta = elemento("label", "", "manual");
  etiqueta.append(manual, "Descartar manualmente");
  manual.onchange = () => { marcas.animas[anima.id] = manual.checked; actualizar(); guardar(); };
  ficha.append(cabecera, cartas, elemento("p", "Evidencias: " + anima.ev.map(i => EVIDENCIAS[i]).join(" · ")),
    elemento("h3", anima.espanto.nombre), elemento("p", ESPANTO_EFECTO[anima.id] + "."), etiqueta);
  fichas.push({ anima, ficha, indicador, manual });
  document.querySelector("#animas").append(ficha);
}
let tiradas = 0;
const resultado = document.querySelector("#tirada");
document.querySelector("#tirar").onclick = () => {
  const cara = 1 + Math.floor(Math.random() * 6);
  resultado.textContent = `Tirada ${++tiradas} · ${cara} de 6`;
};
document.querySelector("#reiniciar").onclick = () => {
  if (!confirm("¿Borrar las marcas y empezar otra partida?")) return;
  marcas = nuevo();
  tiradas = 0;
  resultado.textContent = "Sin tirada";
  for (const pintar of botones) pintar();
  for (const { ficha } of fichas) ficha.open = false;
  actualizar();
  guardar();
};
actualizar();
