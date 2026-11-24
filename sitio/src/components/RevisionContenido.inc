<h1>Comparar ilustraciones</h1>
<nav class="controles" aria-label="Lotes de revisión"></nav>
<p>Abre una ilustración para verla en grande. Elige la propuesta que conservarías o descarta la ronda. El avance se guarda en este navegador.</p>
<p id="aviso" role="status">Cargando el lote…</p>
<section id="visor" hidden>
  <div class="controles">
    <label>Carta <select id="indice"></select></label>
    <button id="anterior">Anterior</button><button id="siguiente">Siguiente</button>
    <button id="pendiente">Ir a una pendiente</button>
  </div>
  <p id="progreso"></p><progress id="barra" aria-label="Avance de la selección"></progress>
  <p id="familia"></p><h2 id="nombre"></h2>
  <p id="credito"></p>
  <div class="par" id="opciones"></div>
  <div class="controles">
    <button id="descartar" hidden>Descartar todas las propuestas</button>
    <button id="descargar">Descargar selección JSON</button>
    <label>Recuperar selección JSON <input type="file" id="importar" accept=".json,application/json"></label>
  </div>
</section>
