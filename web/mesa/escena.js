// La mesa 3D: comedor de la casona, mesa, fichas de cordura, avatares de papel
// recortado, el ánima velada, mazos con su arte, ofrenda de evidencias, dado,
// cartas que vuelan al jugarse y partículas por tipo de carta.
// Solo dibuja la vista que recibe; no conoce las reglas.

import * as THREE from "three";
import { personajesDe, arteRol, cartaRol } from "./personajes.js";
import { ANIMA_POR_ID, isTool, isHab, ROLES } from "./motor/index.js";

export const COLORES_INV = ["#e8a33d", "#4fb3a9", "#d9668b", "#8f9be8"];
const ANCHO_CARTA = 0.4, ALTO_CARTA = 0.607;
const ruta = (id) => (id.startsWith("arte/") ? `${id}.webp` : `cartas/${id}.webp`);

export function crearEscena(lienzo, { alPulsarAyuda, alPulsarMisCartas, alPulsarRol, alPulsarVelar } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#07060c");
  scene.fog = new THREE.Fog("#07060c", 10, 22);
  const camara = new THREE.PerspectiveCamera(48, 1, 0.1, 60);
  const cargador = new THREE.TextureLoader();
  const texturas = new Map();
  const tex = (id) => {
    if (!texturas.has(id)) {
      const t = cargador.load(ruta(id));
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      texturas.set(id, t);
    }
    return texturas.get(id);
  };

  // ---------- luces
  const ambiente = new THREE.HemisphereLight("#7a68a0", "#1a0f08", 0.45);
  scene.add(ambiente);
  const lampara = new THREE.PointLight("#ffb562", 26, 13, 1.5);
  lampara.position.set(0, 3.2, 0);
  lampara.castShadow = true;
  lampara.shadow.mapSize.set(1024, 1024);
  scene.add(lampara);
  const foco = new THREE.SpotLight("#fff1d6", 0, 10, 0.3, 0.55, 1.2);
  foco.position.set(0, 4.6, 0);
  scene.add(foco, foco.target);
  const luzVentana = new THREE.DirectionalLight("#5b6fd6", 0.6);
  luzVentana.position.set(0, 3, -8);
  scene.add(luzVentana);
  const destello = new THREE.PointLight("#ff3020", 0, 6, 2); // cacerías y Espanto
  destello.position.set(0, 2, 0);
  scene.add(destello);

  // ---------- cuarto
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ color: "#2a1a12", roughness: 0.9, map: texturaTablones() }));
  piso.rotation.x = -Math.PI / 2;
  piso.receiveShadow = true;
  scene.add(piso);
  const muroMat = new THREE.MeshStandardMaterial({ color: "#3a2430", roughness: 1 });
  for (const [x, z, ry] of [[0, -6, 0], [0, 6, Math.PI], [-7, 0, Math.PI / 2], [7, 0, -Math.PI / 2]]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(16, 7), muroMat);
    m.position.set(x, 3.5, z);
    m.rotation.y = ry;
    scene.add(m);
  }
  const cielo = crearCielo();
  const ventana = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshBasicMaterial({ map: cielo.textura }));
  ventana.position.set(0, 3.4, -5.98);
  scene.add(ventana);
  const madera = new THREE.MeshStandardMaterial({ color: "#1b100b" });
  for (const [w, h, z] of [[3.5, 2.5, -6.01], [0.08, 2.2, -5.96], [3.2, 0.08, -5.96]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), madera);
    b.position.set(0, 3.4, z);
    scene.add(b);
  }

  // ---------- mesa
  const cubierta = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 0.12, 64), new THREE.MeshStandardMaterial({ color: "#5a3420", roughness: 0.6, map: texturaMadera() }));
  cubierta.scale.set(1.25, 1, 0.82);
  cubierta.position.y = 1;
  cubierta.receiveShadow = cubierta.castShadow = true;
  scene.add(cubierta);
  const mantel = new THREE.Mesh(new THREE.CircleGeometry(1.25, 48), new THREE.MeshStandardMaterial({ color: "#6b1f2c", roughness: 0.95, map: texturaBordado() }));
  mantel.rotation.x = -Math.PI / 2;
  mantel.position.y = 1.062;
  mantel.receiveShadow = true;
  scene.add(mantel);
  const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.6, 1, 24), new THREE.MeshStandardMaterial({ color: "#3d2416" }));
  pata.position.y = 0.5;
  scene.add(pata);
  const picado = crearPapelPicado();
  scene.add(picado);
  for (const x of [-0.55, 0.55]) { // veladoras de la ofrenda, sin luz propia
    const v = crearVela();
    v.position.set(x, 1.062, -0.62);
    scene.add(v);
  }

  // ---------- objetos de la partida
  const SUP = 1.065; // altura de la superficie
  const mazoInv = crearMazo(tex("back01"), "#c98b3a");
  mazoInv.position.set(-0.95, SUP, 0.3);
  scene.add(mazoInv);

  const alba = cartaPlana(tex("alba"));
  alba.position.set(-0.95, SUP + 0.002, 0.3);
  scene.add(alba);
  const descInv = cartaPlana(tex("back01"));
  descInv.position.set(-1.45, SUP + 0.004, 0.3);
  descInv.visible = false;
  scene.add(descInv);
  const mazoAnima = crearMazo(tex("back02"), "#5b2a6e");
  mazoAnima.position.set(0.95, SUP, -0.95);
  mazoAnima.rotation.y = 0.15;
  scene.add(mazoAnima);
  const identidad = cartaPlana(tex("back03"));
  identidad.position.set(-0.35, SUP + 0.004, -1.35);
  scene.add(identidad);
  const espantoCarta = cartaPlana(tex("back04"));
  espantoCarta.position.set(0.35, SUP + 0.004, -1.35);
  scene.add(espantoCarta);
  const ayuda = crearMazo(tex("R01"), "#e2c48a", 10);
  ayuda.position.set(1.45, SUP, 0.55);
  ayuda.rotation.y = -0.25;
  ayuda.userData.esAyuda = true;
  scene.add(ayuda);
  const ofrenda = new THREE.Group();
  ofrenda.position.set(0, SUP + 0.003, 0);
  scene.add(ofrenda);
  const dado = crearDado();
  dado.position.set(0.55, SUP + 0.1, 0.55);
  // Modo vaso: un vaso de barro tapa el dado; el ánima lo ve translúcido.
  // Vaso de barro boca abajo: cerrado por arriba para que nadie vea el dado.
  const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.21, 0.34, 28, 1, false), new THREE.MeshStandardMaterial({ color: "#9b4a26", roughness: 0.8, side: THREE.FrontSide }));
  const fondoVaso = new THREE.Mesh(new THREE.CircleGeometry(0.15, 28), vaso.material);
  fondoVaso.rotation.x = -Math.PI / 2; fondoVaso.position.y = 0.17;
  vaso.add(fondoVaso);
  vaso.position.set(0.55, SUP + 0.17, 0.55);
  vaso.visible = false;
  scene.add(dado, vaso);
  // Al destapar, una copia del vaso se alza y se desvanece.
  const vasoAlzado = new THREE.Mesh(vaso.geometry, new THREE.MeshStandardMaterial({ color: "#9b4a26", roughness: 0.8, side: THREE.DoubleSide, transparent: true }));
  vasoAlzado.visible = false;
  scene.add(vasoAlzado);
  // Objetos malditos que se quedan en la mesa: el Pentagrama al centro, la Muñeca frente a su víctima.
  const pentagrama = cartaPlana(tex("pentagrama"));
  pentagrama.material = new THREE.MeshStandardMaterial({ map: tex("pentagrama"), roughness: 0.8, emissive: "#ff3020", emissiveIntensity: 0.25, transparent: true });
  pentagrama.position.set(-0.35, SUP + 0.006, -0.25);
  pentagrama.rotation.z = 0.2;
  pentagrama.visible = false;
  const muneca = cartaPlana(tex("muneca"));
  muneca.material = new THREE.MeshStandardMaterial({ map: tex("muneca"), roughness: 0.8, emissive: "#8a3cff", emissiveIntensity: 0.18, transparent: true });
  muneca.visible = false;
  scene.add(pentagrama, muneca);
  // Cadena del Cadejo entre dos investigadores (se queda en la mesa).
  const matCadena = new THREE.MeshStandardMaterial({ color: "#8a8f9e", metalness: 0.8, roughness: 0.35, emissive: "#1a1c24" });
  const cadenaMesa = new THREE.Group();
  for (let i = 0; i < 14; i++) cadenaMesa.add(new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 14), matCadena));
  cadenaMesa.visible = false;
  // Cadenas que atan al ánima mientras pierde su turno por mentir.
  const cadenasAnima = new THREE.Group();
  for (let k = 0; k < 3; k++) {
    const aro = new THREE.Group();
    for (let i = 0; i < 18; i++) {
      const e = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.016, 6, 12), matCadena);
      const ang = (i / 18) * Math.PI * 2;
      e.position.set(Math.cos(ang) * 0.75, 0, Math.sin(ang) * 0.75);
      e.rotation.y = -ang + (i % 2 ? Math.PI / 2 : 0);
      aro.add(e);
    }
    aro.position.y = 1.1 + k * 0.55;
    aro.rotation.x = (k - 1) * 0.18;
    cadenasAnima.add(aro);
  }
  cadenasAnima.visible = false;
  scene.add(cadenaMesa);
  const vuelos = new THREE.Group();
  scene.add(vuelos);
  const particulas = crearParticulas(scene);

  const estado = {
    asientos: [], anima: null, nInv: 0, yo: 0, t: 0, vista: null, mazoInicial: 1,
    ultimoDado: null, dadoAnim: 0, sacudir: {}, agachar: {}, animaOscuridad: 0, temblor: 0,
    camObjetivo: new THREE.Vector3(0, 1.3, -0.4), camBase: new THREE.Vector3(0, 5, 7), azimut: 0, azimutObj: 0, alzada: 0, alzadaObj: 0,
  };

  // El ánima preside la cabecera (ángulo π); los investigadores se reparten parejo,
  // girados para que yo quede lo más al frente posible.
  function posicionAsiento(i, n) {
    const yo = estado.yo >= 0 ? estado.yo : 0;
    const k = (((i - yo + Math.floor((n - 1) / 2)) % n) + n) % n;
    const a = Math.PI + (2 * Math.PI * (k + 1)) / (n + 1);
    return { x: Math.sin(a) * 3.15, z: Math.cos(a) * 2.25, ang: a };
  }
  function puntoAsiento(i, alto = 1.6) {
    if (i < 0) return new THREE.Vector3(0, alto + 0.6, -2.6);
    const s = estado.asientos[i];
    return s ? new THREE.Vector3(s.grupo.position.x * 0.62, alto, s.grupo.position.z * 0.62) : new THREE.Vector3(0, alto, 0);
  }

  function montar(v) {
    for (const s of estado.asientos) scene.remove(s.grupo);
    if (estado.anima) scene.remove(estado.anima.grupo);
    estado.asientos = [];
    estado.nInv = v.nInv;
    estado.yo = v.yo;
    estado.mazoInicial = Math.max(1, v.nMazoInv + 1);
    const caras = personajesDe(v.inv);
    for (let i = 0; i < v.nInv; i++) {
      const p = posicionAsiento(i, v.nInv);
      const grupo = new THREE.Group();
      grupo.position.set(p.x, 0, p.z);
      grupo.lookAt(0, 0, 0);
      const color = COLORES_INV[i % COLORES_INV.length];
      const silla = crearSilla();
      silla.position.set(0, 0, -0.45);
      const avatar = crearRetrato(tex("arte/inv_" + caras[i]), tex("arte/inv_" + caras[i] + "_espiritu"));
      avatar.position.set(0, 1.0, -0.42);
      const fichas = crearFichas(color, tex("arte/ficha"));
      fichas.position.set(-0.32, SUP, 0.5);
      const mano = new THREE.Group();
      mano.position.set(0.25, SUP + 0.01, 0.45);
      const etiqueta = crearEtiqueta(color);
      etiqueta.position.set(0, 2.6, -0.42);
      grupo.add(silla, avatar, fichas, mano, etiqueta);
      if (i === v.yo) { avatar.visible = false; etiqueta.visible = false; silla.visible = false; mano.visible = false; }
      scene.add(grupo);
      estado.asientos.push({ grupo, avatar, fichas, mano, etiqueta, color, base: avatar.position.y, angulo: p.ang });
    }
    estado.anima = crearAnima(tex("arte/presencia"));
    estado.anima.grupo.position.set(0, 0, -2.75);
    estado.anima.grupo.add(cadenasAnima);
    estado.finEfecto = null;
    if (v.yo === -1) estado.anima.grupo.children.forEach((c) => { if (c.type !== "PointLight") c.visible = false; });
    scene.add(estado.anima.grupo);
    if (v.yo >= 0) {
      const p = posicionAsiento(v.yo, v.nInv);
      const dir = new THREE.Vector3(p.x, 0, p.z).normalize();
      estado.camBase.set(dir.x * 7.4, 5.3, dir.z * 6.6);
    } else if (v.yo === -1) estado.camBase.set(0, 4.8, -5.8);
    else estado.camBase.set(0, 6.4, 6.9); // espectador: mira la mesa de frente al ánima
    estado.azimut = estado.azimutObj = 0;
    estado.alzada = estado.alzadaObj = 0;
    camara.position.copy(estado.camBase);
    camara.lookAt(estado.camObjetivo);
  }

  // ---------- actualizar desde la vista
  function actualizar(v, { reiniciar = false } = {}) {
    const nuevo = !estado.vista || estado.vista.nInv !== v.nInv || estado.vista.yo !== v.yo || reiniciar;
    const previa = nuevo ? null : estado.vista;
    if (nuevo) { montar(v); estado.repartoN = 0; }
    // Al inicio de la noche (nadie ha investigado aún), las cartas de rol se reparten volando.
    const alInicio = !v.ultimoDado && !v.confirmadas.length && !v.descartadas.length;
    estado.vista = v;
    v.inv.forEach((q, i) => {
      const s = estado.asientos[i];
      if (!s) return;
      s.fichas.userData.poner(q.vivo ? q.c : 0, q.c <= 4 && q.vivo);
      const ud = s.avatar.userData;
      if (q.rol && !s.rol && (previa || alInicio)) repartirRol(i, estado.repartoN++);
      if (previa) {
        // Robar: las cartas vuelan del mazo a la mano.
        const antes = previa.inv[i];
        const robo = q.vivo && antes?.vivo ? q.nMano - antes.nMano : 0;
        if (robo > 0) for (let k = 0; k < Math.min(robo, 4); k++) setTimeout(() => volar("back01", mazoInv.position.clone().setY(SUP + 0.15), puntoAsiento(i, i === v.yo ? 1.0 : 1.3), 0.9, 0.05), 120 + k * 140);
      }
      if (q.rol && s.rol !== q.rol) {
        // Con Los testigos, cada asiento toma la cara de su rol (busto vivo y espíritu).
        s.rol = q.rol;
        const a = arteRol(q.rol);
        ud.texVivo = tex("arte/rol_" + a + "_vivo");
        ud.texEspiritu = tex("arte/rol_" + a + "_muerto");
        ud.plano.geometry.dispose();
        ud.plano.geometry = new THREE.PlaneGeometry(1.35, 1.35);
        ud.plano.position.y = 0.6;
        ud.vivo = null; // fuerza a elegir la textura abajo
      }
      if (q.rol) {
        // La carta de rol, boca arriba frente al jugador; gris cuando ya se usó.
        if (!s.cartaRol) {
          s.cartaRol = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.455), new THREE.MeshStandardMaterial({ roughness: 0.8 }));
          s.cartaRol.rotation.x = -Math.PI / 2;
          s.cartaRol.position.set(0.02, SUP + 0.004, 0.66);
          s.cartaRol.receiveShadow = true;
          s.grupo.add(s.cartaRol);
        }
        const id = cartaRol(q);
        if (s.cartaRolId !== id) {
          // Al usarse un rol de un solo uso, la carta se voltea a su reverso gris.
          if (s.cartaRolId && id.includes("gris")) s.cartaRol.userData.voltear = 1;
          s.cartaRolId = id; s.cartaRol.material.map = tex(id); s.cartaRol.material.needsUpdate = true;
        }
      }
      // Carta Velar frente a quien está velado por un espíritu.
      const velado = q.vivo && q.veladoPor !== null && q.veladoPor !== undefined;
      if (velado && !s.cartaVelar) {
        s.cartaVelar = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.455), new THREE.MeshStandardMaterial({ map: tex("rol_velar"), roughness: 0.8, emissive: "#6fb7ff", emissiveIntensity: 0.12 }));
        s.cartaVelar.rotation.x = -Math.PI / 2;
        s.cartaVelar.rotation.z = 0.12;
        s.cartaVelar.position.set(0.4, SUP + 0.006, 0.7);
        s.grupo.add(s.cartaVelar);
      }
      if (s.cartaVelar) s.cartaVelar.visible = velado;
      if (ud.vivo !== q.vivo) {
        const muere = ud.vivo === true && !q.vivo;
        ud.vivo = q.vivo;
        ud.mat.map = q.vivo ? ud.texVivo : ud.texEspiritu;
        ud.mat.transparent = true;
        ud.opObj = q.vivo ? 1 : 0.85;
        ud.mat.opacity = muere ? 0 : ud.opObj; // al morir, el espíritu aparece poco a poco
        ud.mat.needsUpdate = true;
      }
      if (s.cartaRol) s.cartaRol.material.color.set(q.vivo || cartaRol(q).endsWith("_muerto") ? "#ffffff" : "#6d6d78");
      s.avatar.userData.ruda.visible = q.ruda;
      // Con roles, la etiqueta lleva el rol como título (la cara es la del rol) y el nombre del jugador abajo.
      if (q.rol) s.etiqueta.userData.dibujar(`${ROLES[q.rol].nombre}${q.vivo ? "" : " · espíritu"}`, `${q.nombre} · ${q.vivo ? `cordura ${q.c}${q.c <= 4 ? " · ¡en peligro!" : ""}` : "sin voz"}`, q.c <= 4 && q.vivo);
      else s.etiqueta.userData.dibujar(`${q.nombre}${q.vivo ? "" : " · espíritu"}`, q.vivo ? `Cordura ${q.c}${q.c <= 4 ? " · ¡en peligro!" : ""}` : "sin voz", q.c <= 4 && q.vivo);
      ponerMano(s.mano, q.vivo ? q.nMano : 0, tex("back01"));
    });
    if (estado.anima) ponerMano(estado.anima.mano, v.nManoAnima, tex("back02"));
    if (previa && v.nManoAnima > previa.nManoAnima) for (let k = 0; k < Math.min(v.nManoAnima - previa.nManoAnima, 4); k++) setTimeout(() => volar("back02", mazoAnima.position.clone().setY(SUP + 0.15), puntoAsiento(-1, 1.2), 0.9, 0.05), 120 + k * 140);
    // Cadena del Cadejo y ánima encadenada por mentir.
    const cad = v.cadenas;
    if (cad && estado.asientos[cad[0]] && estado.asientos[cad[1]] && v.inv[cad[0]]?.vivo && v.inv[cad[1]]?.vivo) {
      const a = puntoAsiento(cad[0], SUP), b = puntoAsiento(cad[1], SUP), n = cadenaMesa.children.length - 1;
      cadenaMesa.children.forEach((e, k) => {
        e.position.lerpVectors(a, b, k / n);
        e.position.y = SUP + 0.05 + Math.sin((k / n) * Math.PI) * 0.12;
        e.lookAt(b.x, e.position.y, b.z);
        if (k % 2) e.rotateZ(Math.PI / 2);
      });
      cadenaMesa.visible = true;
    } else cadenaMesa.visible = false;
    cadenasAnima.visible = (v.animaCastigada ?? 0) > 0 && !v.ganador;
    // Final de la partida: amanecer que disuelve al ánima, o la luz que se apaga.
    if (v.ganador && !estado.finEfecto) {
      estado.finEfecto = { tipo: v.ganador === "anima" ? "apagon" : "amanecer", t: previa ? 0 : 9 };
      if (previa) {
        if (estado.finEfecto.tipo === "amanecer") { particulas.motas(new THREE.Vector3(0, 2.2, -2.6), "#fff1c4", 160, 0.8); destello.color.set("#ffd27a"); destello.position.set(0, 2.5, -2.4); destello.intensity = 18; }
        else { particulas.brasas(new THREE.Vector3(0, 1.8, -2.4), "#ff2a1a", 160); estado.temblor = 0.6; }
      }
    }
    if (!v.ganador && estado.finEfecto) { estado.finEfecto = null; luzVentana.intensity = 0.6; if (estado.anima) { estado.anima.grupo.visible = true; estado.anima.grupo.scale.setScalar(1); } }
    // turno
    const t = v.turno;
    const activo = t.de === "investigador" || t.de === "espiritu" ? t.asiento : -1;
    if (activo >= 0 && estado.asientos[activo]) {
      const g = estado.asientos[activo].grupo.position;
      foco.position.set(g.x, 4.6, g.z);
      foco.target.position.set(g.x, 1, g.z);
      foco.intensity = 40;
    } else foco.intensity = 0;
    estado.animaOscuridad = t.de === "anima" || t.de === "espanto" ? 1 : 0;
    // ánima revelada
    if (v.anima && estado.anima && (v.espantoUsado || v.ganador)) {
      estado.anima.revelar(ANIMA_POR_ID[v.anima].nombre);
      identidad.material.map = tex("id_" + v.anima);
      espantoCarta.material.map = tex("es_" + v.anima);
    } else {
      identidad.material.map = tex("back03");
      espantoCarta.material.map = tex("back04");
    }
    // mazos y Alba
    mazoInv.userData.altura(v.nMazoInv);
    mazoAnima.userData.altura(v.nMazoAnima);
    alba.position.y = SUP + 0.002;
    alba.visible = true;
    const arriba = v.descInv?.[v.descInv.length - 1];
    descInv.visible = !!arriba;
    if (arriba) descInv.material.map = tex(arriba);
    const progreso = 1 - v.nMazoInv / estado.mazoInicial;

    cielo.pintar(v.alba ? 1 : progreso * 0.92);
    luzVentana.color.lerpColors(new THREE.Color("#3b4fb8"), new THREE.Color("#ffb070"), v.alba ? 1 : progreso);
    pintarOfrenda(ofrenda, v, tex);
    pentagrama.visible = (v.pentagrama ?? 0) > 0;
    if (v.muneca !== null && v.muneca !== undefined && estado.asientos[v.muneca]) {
      const g = estado.asientos[v.muneca].grupo;
      muneca.position.set(g.position.x * 0.62, SUP + 0.008, g.position.z * 0.62);
      muneca.rotation.z = -g.rotation.y + 0.15;
      muneca.visible = true;
    } else muneca.visible = false;
    const cartas = v.reglas?.lectura === "cartas";
    if (cartas && !estado.tiroCarta && v.ultimoDado && !v.ultimoDado.oculto && v.ultimoDado.valor) { cartaLectura.material.map = texLectura(v.ultimoDado.valor); cartaLectura.material.needsUpdate = true; }
    const tapado = !!v.reglas?.vaso && !v.ganador && (!v.ultimoDado || v.ultimoDado.oculto);
    vaso.visible = tapado;
    // Bajo el vaso no se ve ni el dado ni la carta de lectura (el ánima recibe el número aparte).
    estado.tapado = tapado;
    // El ánima ve el dado a través del vaso; los demás no.
    vaso.material.transparent = v.yo === -1;
    vaso.material.opacity = v.yo === -1 ? 0.45 : 1;
    vaso.material.needsUpdate = true;
    if (v.ultimoDado && JSON.stringify(v.ultimoDado) !== JSON.stringify(estado.ultimoDado)) {
      const antes = estado.ultimoDado;
      estado.ultimoDado = v.ultimoDado;
      const val = v.ultimoDado.valor;
      // Al destapar el vaso, el número aparece sin volver a tirar.
      if (!estado.tiro && val > 0 && dado.userData.valor !== val) {
        dado.userData.valor = val;
        dado.quaternion.copy(cuaternionDe(val));
        if (antes && antes.oculto && !v.ultimoDado.oculto) numeroDado(val, v.ultimoDado.resultado);
      }
    }
  }

  // ---------- el dado
  const DADO_BASE = new THREE.Vector3(0.55, SUP + 0.1, 0.55);
  // Cartas de lectura (en prueba): una carta numerada ocupa el lugar del dado.
  const texLecturas = {};
  const texLectura = (n) => (texLecturas[n] ??= lienzoTextura(256, 388, (g, w, h) => {
    g.fillStyle = n ? "#f4ead6" : "#2a1830"; g.fillRect(0, 0, w, h);
    g.strokeStyle = n ? "#8a6436" : "#c9a36a"; g.lineWidth = 10; g.strokeRect(12, 12, w - 24, h - 24);
    g.textAlign = "center"; g.textBaseline = "middle";
    if (n) {
      g.fillStyle = "#2a1830"; g.font = "800 190px Georgia, serif"; g.fillText(String(n), w / 2, h * 0.47);
      g.font = "600 30px Georgia, serif"; g.fillText("Lectura", w / 2, h * 0.86);
    } else { g.fillStyle = "#c9a36a"; g.font = "700 40px Georgia, serif"; g.fillText("Lectura", w / 2, h / 2); }
  }));
  const cartaLectura = cartaPlana(texLectura(0));
  cartaLectura.position.set(DADO_BASE.x, SUP + 0.006, DADO_BASE.z);
  cartaLectura.rotation.z = 0.3;
  cartaLectura.visible = false;
  scene.add(cartaLectura);
  const modoCartas = () => estado.vista?.reglas?.lectura === "cartas";
  const _qGiro = new THREE.Quaternion(), _eje = new THREE.Vector3();
  /** Cuaternión con la cara `v` hacia arriba y un giro leve sobre la mesa (siempre plano). */
  function cuaternionDe(v, giro = 0.4) {
    const R = { 1: [0, 0, Math.PI / 2], 6: [0, 0, -Math.PI / 2], 2: [0, 0, 0], 5: [Math.PI, 0, 0], 3: [-Math.PI / 2, 0, 0], 4: [Math.PI / 2, 0, 0] }[v] || [0, 0, 0];
    const cara = new THREE.Quaternion().setFromEuler(new THREE.Euler(R[0], 0, R[2]));
    return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), giro).multiply(cara);
  }
  function tirarDado(valor, de, r, oculto = false) {
    if (modoCartas()) {
      const c = estado.tiroCarta;
      if (c && c.t < 0.2) { if (valor) c.valor = valor; c.r = r ?? c.r; c.oculto = oculto; return; }
      estado.tiroCarta = { t: 0, valor, r, oculto };
      return;
    }
    const t = estado.tiro;
    // Varios eventos del mismo tiro (público y privado) llegan juntos: se actualiza el destino, no se relanza.
    if (t && t.t < 0.2) { if (valor) { t.valor = valor; t.qFin = cuaternionDe(valor, t.giro); } t.r = r ?? t.r; t.oculto = oculto; return; }
    const giro = (Math.random() - 0.5) * 1.2;
    const desde = de === undefined || de === null ? DADO_BASE.clone().add(new THREE.Vector3(-0.6, 0, -0.4)) : puntoAsiento(de, SUP + 0.1).lerp(DADO_BASE, 0.45);
    desde.y = SUP + 0.45;
    estado.tiro = {
      t: 0, dur: 1.35, desde, valor, r, oculto, giro,
      qFin: valor ? cuaternionDe(valor, giro) : dado.quaternion.clone(),
      eje: new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.4, Math.random() - 0.5).normalize(),
      vel: 22 + Math.random() * 8, qSuelta: null,
    };
    dado.position.copy(desde);
  }
  function animarCarta(dt) {
    const c = estado.tiroCarta;
    if (!c) return;
    c.t += dt;
    const k = Math.min(1, c.t / 1.0);
    // Sube, se voltea y vuelve a la mesa mostrando el número.
    cartaLectura.position.y = SUP + 0.006 + Math.sin(k * Math.PI) * 0.45;
    cartaLectura.rotation.x = -Math.PI / 2 + Math.sin(k * Math.PI) * 0.4;
    cartaLectura.rotation.y = k < 0.5 ? k * 2 * (Math.PI / 2) : (1 - k) * 2 * (Math.PI / 2);
    if (k >= 0.5 && !c.volteada) {
      c.volteada = true;
      cartaLectura.material.map = texLectura(c.oculto ? 0 : c.valor || 0);
      cartaLectura.material.needsUpdate = true;
    }
    if (k >= 1) {
      estado.tiroCarta = null;
      cartaLectura.position.y = SUP + 0.006; cartaLectura.rotation.set(-Math.PI / 2, 0, 0.3);
      if (!c.oculto) {
        numeroDado(c.valor, c.r);
        const p = DADO_BASE.clone().setY(SUP + 0.15);
        if (c.r === "si") particulas.chispas(p, "#ffcf5a", 110);
        else if (c.r === "no") particulas.humo(p, "#8a8090", 26);
      }
    }
  }
  function animarDado(dt) {
    animarCarta(dt);
    const t = estado.tiro;
    if (!t) return;
    t.t += dt;
    const k = Math.min(1, t.t / t.dur);
    const kh = 1 - Math.pow(1 - Math.min(1, k / 0.75), 2); // avanza rápido y frena
    dado.position.lerpVectors(t.desde, DADO_BASE, kh);
    // Rebotes que se apagan: tres saltos cada vez más bajos.
    const rebote = k < 0.75 ? Math.abs(Math.cos(k / 0.75 * Math.PI * 2.5)) * 0.42 * Math.pow(1 - k / 0.75, 1.4) : 0;
    dado.position.y = SUP + 0.1 + rebote;
    if (k < 0.62) {
      _qGiro.setFromAxisAngle(_eje.copy(t.eje), dt * t.vel * (1 - k));
      dado.quaternion.premultiply(_qGiro);
    } else {
      // Se asienta: gira suavemente hasta quedar plano con su cara arriba.
      t.qSuelta ??= dado.quaternion.clone();
      const s2 = (k - 0.62) / 0.38, e = 1 - Math.pow(1 - s2, 3);
      dado.quaternion.slerpQuaternions(t.qSuelta, t.qFin, e);
    }
    if (k >= 1) {
      dado.position.copy(DADO_BASE);
      dado.quaternion.copy(t.qFin);
      if (t.valor) dado.userData.valor = t.valor;
      estado.tiro = null;
      if (!t.oculto) {
        numeroDado(t.valor, t.r);
        const p = DADO_BASE.clone().setY(SUP + 0.15);
        if (t.r === "si") particulas.chispas(p, "#ffcf5a", 110);
        else if (t.r === "no") particulas.humo(p, "#8a8090", 26);
        else particulas.motas(p, "#e8e0f0", 14);
      }
    }
  }
  // Número flotante sobre el dado, como los de cordura.
  const numerosDado = [];
  function numeroDado(valor, r) {
    const color = r === "si" ? "#ffd25a" : r === "no" ? "#ff8a7a" : r === "nada" ? "#f4ead6" : "#c9a6ff";
    const texto = valor ? String(valor) : "?";
    const etiqueta = r === "si" ? "¡Sí!" : r === "no" ? "No" : r === "nada" ? "Nada" : "";
    const map = lienzoTextura(256, 256, (g, w, h) => {
      g.textAlign = "center"; g.textBaseline = "middle";
      g.font = "800 150px Georgia, serif"; g.lineWidth = 14; g.strokeStyle = "rgba(10,6,16,.85)";
      g.strokeText(texto, w / 2, h * 0.42); g.fillStyle = color; g.fillText(texto, w / 2, h * 0.42);
      if (etiqueta) { g.font = "700 52px Georgia, serif"; g.lineWidth = 9; g.strokeText(etiqueta, w / 2, h * 0.85); g.fillText(etiqueta, w / 2, h * 0.85); }
    });
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map, transparent: true, depthTest: false, toneMapped: false }));
    sp.renderOrder = 20;
    sp.position.copy(DADO_BASE).setY(SUP + 0.35);
    sp.scale.setScalar(0.1);
    sp.userData.t = 0;
    scene.add(sp);
    numerosDado.push(sp);
  }
  function animarNumerosDado(dt) {
    for (const sp of [...numerosDado]) {
      const u = sp.userData;
      u.t += dt;
      const k = u.t / 2.2;
      sp.scale.setScalar(u.t < 0.25 ? 0.1 + (u.t / 0.25) * 0.55 : 0.65);
      sp.position.y = SUP + 0.35 + Math.min(1, k) * 0.55;
      sp.material.opacity = k < 0.7 ? 1 : Math.max(0, 1 - (k - 0.7) / 0.3);
      if (k >= 1) { scene.remove(sp); sp.material.map.dispose(); sp.material.dispose(); numerosDado.splice(numerosDado.indexOf(sp), 1); }
    }
  }

  // ---------- animaciones de eventos
  function animar(e, v) {
    if (!e) return;
    const centro = new THREE.Vector3(0, SUP + 0.05, 0);
    const deDonde = (a) => puntoAsiento(a, 1.5);
    switch (e.k) {
      case "juega": {
        const carta = e.carta === "habilidad" ? "back02" : e.carta === "improvisar" ? "back01" : e.carta;
        volar(carta, deDonde(e.de), e.a !== undefined ? puntoAsiento(e.a, 1.7) : new THREE.Vector3(0, 1.9, 0));
        const tipo = tipoCarta(e.carta);
        if (tipo === "herramienta") { particulas.chispas(centro, "#5ff0e0", 60); particulas.anillo(centro, "#5ff0e0"); }
        else if (tipo === "apoyo") particulas.motas(deDonde(e.de).setY(SUP + 0.2), e.carta === "ruda" ? "#7bd389" : "#ffd27a", 50);
        else if (tipo === "anima") {
          particulas.humo(deDonde(-1).setY(1.6), "#9b6bd6", 40);
          if (e.carta === "caceria" || e.carta === "caceria_total") particulas.brasas(e.a !== undefined ? deDonde(e.a) : centro, "#ff3b2f", 70);
          if (e.carta === "escalofrio") v.inv.forEach((q, i) => q.vivo && particulas.motas(deDonde(i), "#bfe3ff", 18));
        } else if (tipo === "habilidad") particulas.brasas(deDonde(-1).setY(1.8), "#ff4a3a", 40);
        break;
      }
      case "revela": volar(e.carta, new THREE.Vector3(0, 1.9, -1), new THREE.Vector3(0, 2.0, 0)); particulas.brasas(new THREE.Vector3(0, 1.8, 0), "#ff4a3a", 90); break;
      case "defensa": if (e.carta === "esc") estado.agachar[e.de] = 1;
        volar(e.carta, deDonde(e.de), deDonde(e.de).add(new THREE.Vector3(0, 0.6, 0))); particulas.escudo(deDonde(e.de), e.carta === "ros" ? "#ffe39a" : e.carta === "esc" ? "#7aa8ff" : "#ff9ad1"); break;
      case "copal": volar("copal", deDonde(e.de), new THREE.Vector3(0, 1.9, 0)); particulas.humo(new THREE.Vector3(0, 1.4, 0), "#f2efe6", 70); break;
      case "caza": estado.sacudir[e.a] = 1; destello.position.copy(deDonde(e.a)); destello.intensity = 12; particulas.brasas(deDonde(e.a), "#ff2a1a", 60); break;
      case "muerte": particulas.motas(deDonde(e.a), "#9fc4ff", 80, -0.6); destello.position.copy(deDonde(e.a)); destello.color.set("#6b8cff"); destello.intensity = 8; setTimeout(() => destello.color.set("#ff3020"), 900); break;
      case "dado": {
        // Un dado de valor 0 que no está oculto es solo el registro de un anuncio: no se vuelve a tirar.
        if (!e.v && e.r !== "oculto") break;
        const bajoVaso = !!v.reglas?.vaso;
        const val = e.v || (v.yo === -1 && v.ultimoDado?.valor) || 0;
        tirarDado(val, e.de, e.r === "oculto" ? (v.yo === -1 ? v.ultimoDado?.resultado : null) : e.r, bajoVaso && v.yo !== -1);
        break;
      }
      case "manifiesta": volar(e.carta, deDonde(e.de), new THREE.Vector3(0, 1.9, 0)); particulas.motas(deDonde(e.de), "#9fc4ff", 50); break;
      case "espanto": {
        volar("es_" + e.anima, new THREE.Vector3(0, 2.2, -2.4), new THREE.Vector3(0, 2.3, 0), 2.2, 1.9);
        const [gesto, color] = FIRMA[e.anima] ?? ["infierno", "#ff2a1a"];
        destello.color.set(color); destello.position.set(0, 2.4, -1.6); destello.intensity = 20;
        setTimeout(() => destello.color.set("#ff3020"), 1600);
        estado.temblor = 1;
        gestoEspanto(gesto, color, v);
        break;
      }
      case "alba": particulas.motas(new THREE.Vector3(0, 2.5, -4), "#ffcf87", 80); break;
      // --- Objetos malditos
      case "espejo": {
        const p = e.mira === -1 ? deDonde(-1).setY(1.7) : puntoAsiento(e.mira, 1.2);
        particulas.anillo(p, e.de === -1 ? "#9b6bd6" : "#dfe8ff");
        particulas.motas(p, e.de === -1 ? "#9b6bd6" : "#dfe8ff", 40);
        break;
      }
      case "pasa": volar("back01", deDonde(e.de), puntoAsiento(e.a, 1.5), 1.3, 0.4); particulas.chispas(puntoAsiento(e.a, 1.2), "#5ff0e0", 30); break;
      case "tarot": volar("tarot", new THREE.Vector3(0, 1.6, 0), new THREE.Vector3(0, 2.1, 0), 2, 1.6, true); particulas.motas(new THREE.Vector3(0, 1.9, 0), "#c9a6ff", 60); break;
      case "muneca": particulas.humo(puntoAsiento(e.a, 1.0), "#5a2a7a", 40); estado.sacudir[e.a] = 0.6; break;
      case "pentagrama": particulas.brasas(new THREE.Vector3(-0.35, SUP + 0.05, -0.25), "#ff3020", 90); particulas.anillo(new THREE.Vector3(-0.35, SUP + 0.05, -0.25), "#ff3020"); break;
      case "limpia":
        particulas.motas(new THREE.Vector3(0, SUP + 0.1, 0), "#fff6d8", 90);
        particulas.humo(new THREE.Vector3(-0.35, SUP + 0.1, -0.25), "#f2efe6", 40);
        v.inv.forEach((q, i) => q.vivo && particulas.motas(deDonde(i), "#9be8a8", 16));
        break;
      // --- Roles
      case "rol": animarRol(e, v); break;
      // --- Manos que cambian
      case "descarta": for (let k = 0; k < Math.min(e.n, 4); k++) setTimeout(() => volar(e.de === -1 ? "back02" : "back01", deDonde(e.de), descInv.position.clone().setY(SUP + 0.25), 1, 0.1), k * 130); break;
      case "posesion":
        particulas.humo(puntoAsiento(e.a, 1.3), "#5a2a7a", 50); estado.sacudir[e.a] = 1;
        cambiarMano(e.a, Math.min(e.n || 3, 4));
        break;
      case "travesura":
        particulas.chispas(centro, "#ff9ad1", 60);
        v.inv.forEach((q, i) => q.vivo && setTimeout(() => cambiarMano(i, Math.min(q.nMano, 3)), i * 200));
        break;
      case "anula":
        volar(e.carta, new THREE.Vector3(0, 1.6, -0.8), new THREE.Vector3(0, 2.0, 0), 1.8, 0.5);
        setTimeout(() => { particulas.brasas(new THREE.Vector3(0, 2.0, 0), "#ff8a2a", 120); particulas.humo(new THREE.Vector3(0, 2.1, 0), "#3a3036", 30); }, 600);
        break;
      // --- Espíritus
      case "muestra": rayo(deDonde(-1).setY(1.8), puntoAsiento(e.a, 1.8), "#b88cff"); particulas.motas(puntoAsiento(e.a, 1.8), "#b88cff", 40); break;
      case "susurro": rayo(puntoAsiento(e.de, 1.8), puntoAsiento(e.a, 1.6), "#9fc4ff"); break;
      case "eco": particulas.anillo(dado.position.clone(), "#6fb7ff"); particulas.motas(dado.position.clone(), "#6fb7ff", 50); rayo(puntoAsiento(e.de, 1.8), dado.position.clone(), "#6fb7ff"); break;
      case "respuesta": particulas.motas(puntoAsiento(e.de, 1.8), e.valor === "si" ? "#ffe39a" : e.valor === "no" ? "#ff8a7a" : "#c9c4d8", 40); break;
      case "tablilla": volar("tablilla", centro.clone().setY(1.4), puntoAsiento(e.a, 1.6), 1.5, 0.7); particulas.motas(puntoAsiento(e.a, 1.6), "#9fc4ff", 60); break;
      case "manoMono":
        volar("mano", deDonde(e.de), new THREE.Vector3(0, 1.9, 0), 1.6, 1.0);
        tirarDado(e.v, e.de, e.v <= 3 ? "no" : "si");
        if (e.v <= 3) setTimeout(() => particulas.brasas(deDonde(e.de), "#ff2a1a", 70), 1100);
        break;
      case "revive":
        particulas.motas(puntoAsiento(e.a, 1.2), "#fff1c4", 120, 0.9); particulas.anillo(puntoAsiento(e.a, 1.0), "#ffd27a");
        destello.color.set("#ffd27a"); destello.position.copy(puntoAsiento(e.a, 1.6)); destello.intensity = 10; setTimeout(() => destello.color.set("#ff3020"), 900);
        break;
      case "anuncio": particulas.humo(vaso.position.clone().setY(SUP + 0.45), "#9b6bd6", 20); break;
      // --- Espantos con gesto propio
      case "espantoFx": efectoEspanto(e, v); break;
      // --- Momentos
      case "destapa": {
        vasoAlzado.visible = true;
        vasoAlzado.position.copy(vaso.position);
        vasoAlzado.material.opacity = 1;
        estado.vasoAlza = 1;
        if (e.mintio) setTimeout(() => {
          const pa = deDonde(-1).setY(1.6);
          particulas.anillo(pa, "#c8c8d8"); particulas.chispas(pa, "#c8c8d8", 80);
          setTimeout(() => particulas.anillo(pa, "#c8c8d8"), 250);
          estado.temblor = 0.4;
        }, 600);
        else setTimeout(() => particulas.brasas(puntoAsiento(e.de, 1.2), "#ff3b2f", 40), 600);
        break;
      }
      case "velar": volar("rol_velar", deDonde(e.de), puntoAsiento(e.a, 1.3), 1.5, 0.8); particulas.motas(puntoAsiento(e.a, 1.0), "#9fc4ff", 50); break;
    }
  }

  /** La mano de un investigador se va al descarte y llegan cartas nuevas del mazo. */
  function cambiarMano(i, n) {
    const yo = puntoAsiento(i, 1.3);
    for (let k = 0; k < n; k++) {
      setTimeout(() => volar("back01", yo, descInv.position.clone().setY(SUP + 0.25), 0.9, 0.05), k * 110);
      setTimeout(() => volar("back01", mazoInv.position.clone().setY(SUP + 0.15), yo, 0.9, 0.05), 700 + k * 110);
    }
  }
  /** La carta de rol vuela del centro a su dueño, boca abajo, y se voltea al llegar. */
  function repartirRol(i, orden) {
    const s = estado.asientos[i];
    setTimeout(() => {
      const destino = new THREE.Vector3();
      if (s.cartaRol) s.cartaRol.getWorldPosition(destino); else destino.copy(puntoAsiento(i, SUP + 0.1));
      volar("rol_reverso", new THREE.Vector3(0, 1.4, 0), destino.clone().setY(SUP + 0.35), 1.1, 0.05);
      setTimeout(() => { if (s.cartaRol) { s.cartaRol.userData.voltear = 1; s.cartaRol.userData.brillo = 0.8; } particulas.motas(destino, "#ffd27a", 20); }, 520);
    }, 400 + orden * 260);
  }
  // Cada ánima tiene su gesto al lanzar el Espanto.
  const FIRMA = {
    llorona: ["ondas", "#7fb8ff"], nahual: ["garras", "#ff6a2a"], anima: ["velas", "#ffe39a"], demonio: ["infierno", "#ff2a1a"],
    aparecido: ["niebla", "#cfd8e8"], bruja: ["fuegos", "#7cff6a"], chaneque: ["hojas", "#7bd389"], yohualtepuztli: ["hacha", "#e0e4f0"],
    cihuateteo: ["ondas", "#ffcf87"], tlahuelpuchi: ["fuegos", "#ff3b2f"], matlacihuatl: ["red", "#9fe0ff"], charro: ["monedas", "#ffcf5a"],
    planchada: ["niebla", "#ffffff"], xtabay: ["ondas", "#9be8a8"], malaire: ["viento", "#b8c7a0"], guardian: ["monedas", "#ffcf5a"],
    cucuy: ["sombra", "#5a3a8a"], cadejo: ["garras", "#9fa4b8"], chocarrero: ["tornado", "#ffd27a"], mulata: ["ondas", "#5fd0e0"],
  };
  function gestoEspanto(gesto, color, v) {
    const centro = new THREE.Vector3(0, SUP + 0.3, 0);
    const vivosI = v.inv.map((q, i) => (q.vivo ? i : -9)).filter((i) => i >= 0);
    switch (gesto) {
      case "ondas": for (let k = 0; k < 4; k++) setTimeout(() => particulas.anillo(centro, color), k * 280); particulas.motas(centro, color, 80); break;
      case "garras": vivosI.forEach((i, k) => setTimeout(() => { particulas.brasas(puntoAsiento(i, 1.4), color, 50); estado.sacudir[i] = 0.7; }, k * 220)); break;
      case "velas": vivosI.forEach((i) => particulas.motas(puntoAsiento(i, 1.0), color, 40, 0.9)); break;
      case "niebla": particulas.humo(centro, color, 120); vivosI.forEach((i) => particulas.humo(puntoAsiento(i, 1.0), color, 30)); break;
      case "fuegos": for (let k = 0; k < 6; k++) setTimeout(() => particulas.chispas(new THREE.Vector3((Math.random() - 0.5) * 3, SUP + 0.2, (Math.random() - 0.5) * 2.4), color, 50), k * 160); break;
      case "hojas": particulas.motas(new THREE.Vector3(0, 3.2, 0), color, 140, -0.8); break;
      case "hacha": estado.temblor = 1.6; setTimeout(() => { destello.color.set(color); destello.intensity = 26; }, 500); break;
      case "red": vivosI.forEach((i, k) => setTimeout(() => particulas.anillo(puntoAsiento(i, 1.2), color), k * 180)); break;
      case "monedas": vivosI.forEach((i) => particulas.chispas(puntoAsiento(i, 1.3), color, 60)); break;
      case "viento": vivosI.forEach((i, k) => setTimeout(() => particulas.humo(puntoAsiento(i, 1.3), color, 40), k * 150)); break;
      case "sombra": particulas.humo(centro, "#1a1024", 140); estado.animaOscuridad = 1; break;
      case "tornado": for (let k = 0; k < 6; k++) setTimeout(() => volar("back01", centro, new THREE.Vector3(Math.cos(k) * 1.2, 2.0, Math.sin(k) * 1.2), 1.0, 0.3, true), k * 110); break;
      default: particulas.brasas(new THREE.Vector3(0, 1.6, 0), color, 220);
    }
  }
  function efectoEspanto(e, v) {
    const vivosI = v.inv.map((q, i) => (q.vivo ? i : -9)).filter((i) => i >= 0);
    const ani = puntoAsiento(-1, 1.8);
    switch (e.fx) {
      case "todos": vivosI.forEach((i) => particulas.brasas(puntoAsiento(i, 1.4), "#ff3b2f", 40)); break;
      case "elige": rayo(ani, puntoAsiento(e.a, 1.4), "#ff3b2f"); estado.sacudir[e.a] = 1; break;
      case "manos": vivosI.forEach((i) => cambiarMano(i, 2)); break;
      case "rezo": vivosI.forEach((i) => particulas.motas(puntoAsiento(i, 1.2), "#ffe39a", 30)); break;
      case "canto": vivosI.forEach((i, k) => setTimeout(() => { particulas.anillo(puntoAsiento(i, 1.4), "#9be8a8"); rayo(ani, puntoAsiento(i, 1.4), "#9be8a8"); }, k * 200)); break;
      case "mirada": destello.color.set("#ff2a1a"); destello.position.copy(puntoAsiento(e.a, 1.6)); destello.intensity = 14; estado.sacudir[e.a] = 1; particulas.anillo(puntoAsiento(e.a, 1.4), "#ff2a1a"); break;
      case "cadenas": particulas.chispas(puntoAsiento(e.a, 0.9).lerp(puntoAsiento(e.b, 0.9), 0.5), "#c8c8d8", 80); estado.sacudir[e.a] = estado.sacudir[e.b] = 0.8; break;
      case "arrastre": estado.sacudir[e.a] = 1; particulas.chispas(puntoAsiento(e.a, 1.0), "#c8c8d8", 60); break;
      case "tornado": for (let k = 0; k < 8; k++) setTimeout(() => volar("back01", new THREE.Vector3(0, SUP + 0.3, 0), new THREE.Vector3(Math.cos(k * 0.8) * 1.4, 1.6 + (k % 3) * 0.3, Math.sin(k * 0.8) * 1.4), 1.0, 0.3, true), k * 90); break;
      case "izquierda": {
        const L = e.lista ?? vivosI;
        L.forEach((i, k) => volar("back01", puntoAsiento(i, 1.3), puntoAsiento(L[(k + 1) % L.length], 1.3), 1.0, 0.1));
        break;
      }
      case "vuelo": {
        const L = e.lista ?? [];
        let prev = ani;
        L.forEach((i, k) => { const p = puntoAsiento(i, 1.5), d = prev; setTimeout(() => { rayo(d, p, "#ff3b2f"); particulas.brasas(p, "#ff3b2f", 40); }, k * 450); prev = p; });
        break;
      }
      case "doble": for (let k = 0; k < 2; k++) setTimeout(() => { estado.sacudir[e.a] = 1; destello.position.copy(puntoAsiento(e.a, 1.6)); destello.intensity = 12; particulas.humo(puntoAsiento(e.a, 1.4), "#2a1a3a", 30); }, k * 650); break;
      case "encrucijada": particulas.anillo(new THREE.Vector3(0, SUP + 0.2, 0), "#ffcf87"); setTimeout(() => particulas.anillo(new THREE.Vector3(0, SUP + 0.2, 0), "#ffcf87"), 400); break;
      case "oro": particulas.chispas(puntoAsiento(e.a, 1.3), "#ffcf5a", 80); break;
      case "devuelve": volar("back01", puntoAsiento(e.a, 1.3), descInv.position.clone().setY(SUP + 0.25), 1, 0.1); particulas.chispas(descInv.position.clone().setY(SUP + 0.2), "#ffcf5a", 40); break;
    }
  }

  const COLOR_ROL = { vigia: "#7aa8ff", improvisador: "#ffcf5a", tecnico: "#5ff0e0", detective: "#ffcf5a", curandera: "#9be8a8", padre: "#ffe39a", sensitiva: "#c9a6ff", guardaespaldas: "#ff9a5a" };
  function animarRol(e, v) {
    const s = estado.asientos[e.de];
    const color = COLOR_ROL[e.rol] ?? "#ffffff";
    if (s?.cartaRol) {
      s.cartaRol.userData.brillo = 1;
      s.cartaRol.userData.alzarRol = 0.25;
      setTimeout(() => (s.cartaRol.userData.alzarRol = 0), 1300);
      const p = new THREE.Vector3(); s.cartaRol.getWorldPosition(p);
      particulas.anillo(p, color);
      particulas.motas(p, color, 30);
    }
    const yo = puntoAsiento(e.de, 1.4);
    switch (e.rol) {
      case "vigia": for (let i = 0; i < Math.min(4, e.n ?? 1); i++) setTimeout(() => volar("back01", yo, descInv.position.clone().setY(SUP + 0.3), 1, 0.15), i * 160); break;
      case "guardaespaldas": particulas.escudo(yo, color); estado.sacudir[e.de] = 0.7; destello.position.copy(yo); destello.intensity = 6; break;
      case "padre":
        if (e.a !== undefined) rayo(yo, puntoAsiento(e.a, 1.4), color);
        else { volar("ros", yo, new THREE.Vector3(0, 1.9, 0)); particulas.humo(new THREE.Vector3(0, 1.4, 0), "#fff6d8", 50); }
        break;
      case "curandera": if (e.a !== undefined && e.a !== e.de) rayo(yo, puntoAsiento(e.a, 1.4), color); else particulas.motas(yo, color, 40); break;
      case "tecnico": particulas.chispas(dado.position.clone(), color, 70); break;
      case "detective": case "sensitiva":
        if (e.r === "si") particulas.chispas(new THREE.Vector3(0, 1.9, 0), "#ffcf5a", 70);
        else if (e.r === "no") particulas.humo(new THREE.Vector3(0, 1.9, 0), "#8a8090", 30);
        break;
    }
  }
  /** Un hilo de luz entre dos puntos (Rosario, Té de tila). */
  function rayo(desde, hasta, color) {
    for (let i = 0; i <= 10; i++) setTimeout(() => particulas.motas(desde.clone().lerp(hasta, i / 10), color, 8, 0.1), i * 45);
  }

  function volar(idCarta, desde, hasta, escala = 1.6, espera = 0.9, gira = false) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO_CARTA, ALTO_CARTA), new THREE.MeshBasicMaterial({ map: tex(idCarta), transparent: true, side: THREE.DoubleSide, toneMapped: false }));
    m.position.copy(desde);
    m.userData = { desde: desde.clone(), hasta: hasta.clone(), t: 0, escala, espera, gira };
    vuelos.add(m);
  }
  function animarVuelos(dt) {
    for (const m of [...vuelos.children]) {
      const u = m.userData;
      u.t += dt;
      const ida = Math.min(1, u.t / 0.45);
      const k = 1 - Math.pow(1 - ida, 3);
      m.position.lerpVectors(u.desde, u.hasta, k);
      m.position.y += Math.sin(k * Math.PI) * 0.3;
      m.scale.setScalar(0.6 + (u.escala - 0.6) * k);
      m.lookAt(camara.position);
      if (u.gira) m.rotateY((1 - k) * Math.PI * 4);
      const salida = u.t - 0.45 - u.espera;
      if (salida > 0) {
        m.material.opacity = Math.max(0, 1 - salida / 0.35);
        m.position.y += salida * 0.5;
        if (salida > 0.35) { vuelos.remove(m); m.geometry.dispose(); m.material.dispose(); }
      }
    }
  }

  // ---------- cámara: arrastrar a los lados gira alrededor de la mesa; hacia arriba sube hasta ver la mesa desde lo alto.
  // Abajo hay tope: la cámara solo baja hasta ver el cuarto, nunca atraviesa el piso.
  let arrastre = null;
  const ALZADA_MIN = -1; // cuánto se deja bajar la cámara (un poco, para ver el cuarto)
  lienzo.style.touchAction = "none";
  // Zoom tenue: tres niveles con la rueda o pellizcando con dos dedos.
  const ZOOM = [1, 0.88, 0.77];
  let zoomNivel = 0, zoomActual = 1, ultimaRueda = 0;
  const zoomA = (d) => { zoomNivel = Math.max(0, Math.min(ZOOM.length - 1, zoomNivel + d)); };
  lienzo.addEventListener("wheel", (ev) => {
    ev.preventDefault();
    const ahora = performance.now();
    if (ahora - ultimaRueda < 220 || Math.abs(ev.deltaY) < 4) return;
    ultimaRueda = ahora;
    zoomA(ev.deltaY < 0 ? 1 : -1);
  }, { passive: false });
  const dedos = new Map();
  let pellizco = null;
  lienzo.addEventListener("pointerdown", (ev) => {
    dedos.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (dedos.size === 2) {
      const [a, b] = [...dedos.values()];
      pellizco = { d: Math.hypot(a.x - b.x, a.y - b.y) };
      arrastre = null; // con dos dedos no se gira
      return;
    }
    arrastre = { x: ev.clientX, y: ev.clientY, az: estado.azimutObj, al: estado.alzadaObj, movio: false };
  });
  const soltarDedo = (ev) => { dedos.delete(ev.pointerId); if (dedos.size < 2) pellizco = null; };
  window.addEventListener("pointercancel", soltarDedo);
  window.addEventListener("pointermove", (ev) => {
    if (dedos.has(ev.pointerId)) dedos.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (pellizco && dedos.size === 2) {
      const [a, b] = [...dedos.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d / pellizco.d > 1.18) { zoomA(1); pellizco.d = d; }
      else if (d / pellizco.d < 0.85) { zoomA(-1); pellizco.d = d; }
      return;
    }
    if (!arrastre) return;
    const dx = ev.clientX - arrastre.x, dy = ev.clientY - arrastre.y;
    if (Math.hypot(dx, dy) > 4) arrastre.movio = true;
    if (arrastre.movio) {
      estado.azimutObj = arrastre.az - dx * 0.008;
      estado.alzadaObj = Math.min(1, Math.max(ALZADA_MIN, arrastre.al - dy * 0.004));
      lienzo.style.cursor = "grabbing";
    }
  });
  window.addEventListener("pointerup", (ev) => {
    soltarDedo(ev);
    if (!arrastre) return;
    const fue = arrastre;
    arrastre = null;
    lienzo.style.cursor = "";
    if (!fue.movio && ev.target === lienzo) {
      const r = lienzo.getBoundingClientRect();
      const ray = new THREE.Raycaster();
      ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), camara);
      const cartas = estado.asientos.map((x, i) => [x.cartaRol, i]).filter(([c]) => c);
      const tocada = cartas.find(([c]) => ray.intersectObject(c, false).length);
      const velas = estado.asientos.map((x, i) => [x.cartaVelar, i]).filter(([c]) => c?.visible);
      const velada = velas.find(([c]) => ray.intersectObject(c, false).length);
      if (velada) alPulsarVelar?.(velada[1]);
      else if (tocada) alPulsarRol?.(tocada[1]);
      else if (ray.intersectObject(ayuda, true).length) alPulsarAyuda?.();
      else if (esAnima() && ray.intersectObjects([identidad, espantoCarta], true).length) alPulsarMisCartas?.();
    }
  });
  lienzo.addEventListener("dblclick", () => { estado.azimutObj = 0; estado.alzadaObj = 0; zoomNivel = 0; });
  lienzo.addEventListener("pointermove", (ev) => {
    if (arrastre) return;
    const r = lienzo.getBoundingClientRect();
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1), camara);
    const sobre = ray.intersectObject(ayuda, true).length > 0;
    const sobreMias = esAnima() && ray.intersectObjects([identidad, espantoCarta], true).length > 0;
    // Cartas de rol y de Velar: se alzan al pasar el cursor y se pueden tocar.
    const tocables = estado.asientos.flatMap((x) => [x.cartaRol, x.cartaVelar]).filter((c) => c?.visible);
    const golpe = tocables.length ? ray.intersectObjects(tocables, false)[0]?.object : null;
    for (const c of tocables) c.userData.alzar = c === golpe ? 0.07 : 0;
    lienzo.style.cursor = sobre || sobreMias || golpe ? "pointer" : "grab";
    ayuda.position.y = SUP + (sobre ? 0.06 : 0);
    identidad.userData.alzar = espantoCarta.userData.alzar = sobreMias ? 0.05 : 0;
  });

  const esAnima = () => estado.vista?.yo === -1;

  // ---------- bucle
  const reloj = new THREE.Clock();
  let ancho = 0, alto = 0;
  const mira = new THREE.Vector3(), CENTRO_MESA = new THREE.Vector3(0, SUP, 0), MIRA_CUARTO = new THREE.Vector3(0, 1.7, -0.6);
  const COLOR_ANIMA = new THREE.Color("#4b2a6e"), COLOR_NOCHE = new THREE.Color("#7a68a0");
  function cuadro() {
    const dt = Math.min(0.05, reloj.getDelta());
    estado.t += dt;
    const w = lienzo.clientWidth, h = lienzo.clientHeight;
    if (w !== ancho || h !== alto) {
      ancho = w; alto = h;
      renderer.setSize(w, h, false);
      camara.aspect = w / Math.max(1, h);
      camara.userData.fovBase = w < h ? 64 : 48;
      camara.updateProjectionMatrix();
    }
    for (const c of [identidad, espantoCarta]) c.position.y += (SUP + 0.004 + (c.userData.alzar || 0) - c.position.y) * Math.min(1, dt * 10);
    for (const x of estado.asientos) for (const c of [x.cartaRol, x.cartaVelar]) {
      if (!c) continue;
      const base = c.userData.base ??= c.position.y;
      c.position.y += (base + (c.userData.alzar || 0) + (c.userData.alzarRol || 0) - c.position.y) * Math.min(1, dt * 10);
      if (c.userData.brillo) {
        c.userData.brillo = Math.max(0, c.userData.brillo - dt * 0.6);
        c.material.emissive?.set("#ffd27a"); c.material.emissiveIntensity = c.userData.brillo * 0.9;
      }
      if (c.userData.voltear) {
        c.userData.voltear = Math.max(0, c.userData.voltear - dt * 1.6);
        c.rotation.y = Math.sin(c.userData.voltear * Math.PI) * Math.PI * 0.5;
      }
      const esc = 1 + (c.userData.alzar ? 0.12 : 0);
      c.scale.x += (esc - c.scale.x) * Math.min(1, dt * 10); c.scale.y = c.scale.x;
    }
    zoomActual += (ZOOM[zoomNivel] - zoomActual) * Math.min(1, dt * 6);
    const fov = (camara.userData.fovBase || 48) * zoomActual;
    if (Math.abs(camara.fov - fov) > 0.01) { camara.fov = fov; camara.updateProjectionMatrix(); }
    estado.asientos.forEach((s, i) => {
      const vivo = s.avatar.userData.vivo !== false;
      s.avatar.position.y = s.base + (vivo ? Math.sin(estado.t * 1.6 + s.angulo) * 0.015 : 0.35 + Math.sin(estado.t * 0.9 + s.angulo) * 0.06);
      const ag = estado.agachar[i] || 0;
      if (ag) { s.avatar.position.y -= Math.sin(Math.min(1, (1 - ag) * 2.2) * Math.PI) * 0.55; estado.agachar[i] = Math.max(0, ag - dt * 0.7); }
      const ud = s.avatar.userData;
      if (ud.mat && ud.opObj !== undefined && ud.mat.opacity !== ud.opObj) ud.mat.opacity += Math.sign(ud.opObj - ud.mat.opacity) * Math.min(Math.abs(ud.opObj - ud.mat.opacity), dt * 0.5);
      const sac = estado.sacudir[i] || 0;
      s.avatar.rotation.z = sac ? Math.sin(estado.t * 50) * 0.1 * sac : 0;
      if (sac) estado.sacudir[i] = Math.max(0, sac - dt * 1.2);
      s.fichas.userData.latir(estado.t);
    });
    if (estado.anima) {
      estado.anima.grupo.position.y = 0.15 + Math.sin(estado.t * 0.8) * 0.08;
      estado.anima.velo.material.opacity = 0.55 + Math.sin(estado.t * 1.3) * 0.08 + estado.animaOscuridad * 0.2;
    }
    const objetivoLuz = 26 - estado.animaOscuridad * 15 + (estado.animaOscuridad ? Math.random() * 3 : 0);
    lampara.intensity += (objetivoLuz - lampara.intensity) * Math.min(1, dt * 4);
    ambiente.color.lerp(estado.animaOscuridad ? COLOR_ANIMA : COLOR_NOCHE, dt * 2);
    destello.intensity = Math.max(0, destello.intensity - dt * 18);

    picado.children.forEach((b, i) => (b.rotation.x = Math.sin(estado.t * 1.2 + i * 0.7) * 0.12));
    animarDado(dt);
    animarNumerosDado(dt);
    if (estado.vista) {
      const cartas = estado.vista.reglas?.lectura === "cartas";
      const ve = !estado.tapado || estado.vista.yo === -1;
      dado.visible = !cartas && (ve || !!estado.tiro);
      cartaLectura.visible = cartas && (ve || !!estado.tiroCarta);
    }
    if (estado.vasoAlza > 0) {
      estado.vasoAlza = Math.max(0, estado.vasoAlza - dt * 0.55);
      const k = 1 - estado.vasoAlza;
      vasoAlzado.position.y = vaso.position.y + Math.min(1, k * 2.5) * 0.7;
      vasoAlzado.rotation.z = Math.min(1, k * 2.5) * 0.5;
      vasoAlzado.material.opacity = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
      if (!estado.vasoAlza) vasoAlzado.visible = false;
    }
    // El vaso tiembla mientras deciden si alguien lo destapa.
    vaso.rotation.z = vaso.visible && estado.vista?.pendiente?.tipo === "desafio" ? Math.sin(estado.t * 34) * 0.035 : 0;
    if (cadenasAnima.visible) cadenasAnima.children.forEach((a, k) => (a.rotation.y += dt * (k % 2 ? -0.6 : 0.6)));
    const fin = estado.finEfecto;
    if (fin && estado.anima) {
      fin.t += dt;
      if (fin.tipo === "amanecer") {
        const k = Math.min(1, fin.t / 2.4);
        estado.anima.grupo.scale.setScalar(Math.max(0.001, 1 - k));
        estado.anima.grupo.position.y += k * 0.6;
        if (k >= 1) estado.anima.grupo.visible = false;
        luzVentana.intensity = 0.6 + k * 2.5;
      } else {
        estado.anima.grupo.scale.setScalar(1 + Math.min(1, fin.t / 2) * 0.25);
        estado.animaOscuridad = 1;
        lampara.intensity = Math.max(2, 26 - fin.t * 12);
      }
    }
    if (pentagrama.visible) pentagrama.material.emissiveIntensity = 0.2 + Math.sin(estado.t * 2.2) * 0.12;
    if (muneca.visible) muneca.material.emissiveIntensity = 0.12 + Math.sin(estado.t * 1.7) * 0.08;
    animarVuelos(dt);
    particulas.actualizar(dt);
    // cámara: gira sobre la mesa y tiembla con el Espanto
    estado.azimut += (estado.azimutObj - estado.azimut) * Math.min(1, dt * 6);
    estado.alzada += (estado.alzadaObj - estado.alzada) * Math.min(1, dt * 6);
    const alto3 = new THREE.Vector3(estado.camBase.x * 0.12, 9.2, estado.camBase.z * 0.12);
    // Hacia abajo: se acerca un poco y baja hasta ver la habitación, sin pasar de 2.3 m de altura (nunca cruza el piso ni la mesa).
    const bajo3 = new THREE.Vector3(estado.camBase.x * 0.7, 2.3, estado.camBase.z * 0.7);
    const pos = (estado.alzada >= 0 ? estado.camBase.clone().lerp(alto3, estado.alzada) : estado.camBase.clone().lerp(bajo3, -estado.alzada))
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), estado.azimut);
    pos.x += Math.sin(estado.t * 0.2) * 0.06;
    if (estado.temblor > 0) {
      pos.x += (Math.random() - 0.5) * 0.25 * estado.temblor;
      pos.y += (Math.random() - 0.5) * 0.25 * estado.temblor;
      estado.temblor = Math.max(0, estado.temblor - dt * 0.8);
    }
    camara.position.lerp(pos, Math.min(1, dt * 5));
    camara.lookAt(estado.alzada >= 0 ? mira.copy(estado.camObjetivo).lerp(CENTRO_MESA, estado.alzada) : mira.copy(estado.camObjetivo).lerp(MIRA_CUARTO, -estado.alzada));
    renderer.render(scene, camara);
    requestAnimationFrame(cuadro);
  }
  requestAnimationFrame(cuadro);

  /** Dónde cae en la pantalla el retrato de un asiento (ANIMA = -1; "vaso" = el vaso del dado), para los efectos 2D. */
  function aPantalla(i) {
    const p = (i === "vaso" ? vaso.position.clone().setY(SUP + 0.5) : puntoAsiento(i, i < 0 ? 1.4 : 2.2)).project(camara);
    const r = lienzo.getBoundingClientRect();
    if (p.z > 1) return null;
    return { x: r.left + (p.x + 1) / 2 * r.width, y: r.top + (1 - p.y) / 2 * r.height };
  }

  return { actualizar, animar, aPantalla, girar: (d) => (estado.azimutObj += d), centrar: () => { estado.azimutObj = 0; estado.alzadaObj = 0; }, alzar: (d) => (estado.alzadaObj = Math.min(1, Math.max(ALZADA_MIN, estado.alzadaObj + d))) };
}

function tipoCarta(c) {
  if (isTool(c) || c === "kit" || c === "improvisar") return "herramienta";
  if (["te", "resp", "ruda"].includes(c)) return "apoyo";
  if (["ros", "esc", "ult", "copal"].includes(c)) return "defensa";
  if (isHab(c) || c === "habilidad") return "habilidad";
  return "anima";
}

// ------------------------------------------------------------------ piezas

function lienzoTextura(w, h, dibujar) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  dibujar(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function texturaMadera() {
  const t = lienzoTextura(512, 512, (g, w, h) => {
    g.fillStyle = "#6b3d24"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      g.strokeStyle = `rgba(${30 + Math.random() * 30},${15 + Math.random() * 15},8,${0.15 + Math.random() * 0.25})`;
      g.lineWidth = 1 + Math.random() * 3;
      g.beginPath();
      const y = Math.random() * h;
      g.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x / 60 + i) * 6);
      g.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function texturaTablones() {
  const t = lienzoTextura(512, 512, (g, w, h) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = `hsl(${20 + Math.random() * 6},${35 + Math.random() * 10}%,${12 + Math.random() * 5}%)`;
      g.fillRect(0, (i * h) / 8, w, h / 8 - 3);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(6, 6);
  return t;
}
function texturaBordado() {
  return lienzoTextura(512, 512, (g, w, h) => {
    g.fillStyle = "#5e1824"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#e6a83c"; g.lineWidth = 6;
    g.beginPath(); g.arc(w / 2, h / 2, w * 0.46, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      g.fillStyle = i % 2 ? "#f2c14e" : "#e8743b";
      g.beginPath(); g.arc(w / 2 + Math.cos(a) * w * 0.4, h / 2 + Math.sin(a) * h * 0.4, 9, 0, Math.PI * 2); g.fill();
    }
    g.lineWidth = 2;
    g.beginPath(); g.arc(w / 2, h / 2, w * 0.33, 0, Math.PI * 2); g.stroke();
  });
}
function crearCielo() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 176;
  const g = c.getContext("2d");
  const textura = new THREE.CanvasTexture(c);
  textura.colorSpace = THREE.SRGBColorSpace;
  const estrellas = Array.from({ length: 60 }, () => [Math.random() * 256, Math.random() * 120, Math.random()]);
  function pintar(p) {
    const gr = g.createLinearGradient(0, 0, 0, 176);
    gr.addColorStop(0, mezclar("#0b0f2e", "#5b7bd6", p));
    gr.addColorStop(1, mezclar("#241a4a", "#ffb067", p));
    g.fillStyle = gr; g.fillRect(0, 0, 256, 176);
    for (const [x, y, b] of estrellas) {
      g.fillStyle = `rgba(255,255,240,${Math.max(0, 1 - p * 1.4) * (0.4 + b * 0.6)})`;
      g.fillRect(x, y, 1.5, 1.5);
    }
    g.fillStyle = `rgba(255,248,220,${1 - p})`;
    g.beginPath(); g.arc(190, 40, 14, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#0a0710";
    g.beginPath(); g.moveTo(0, 176); g.lineTo(0, 140); g.lineTo(40, 128); g.lineTo(80, 142); g.lineTo(130, 120); g.lineTo(190, 138); g.lineTo(256, 126); g.lineTo(256, 176); g.fill();
    textura.needsUpdate = true;
  }
  pintar(0);
  return { textura, pintar };
}
function mezclar(a, b, t) {
  return "#" + new THREE.Color(a).lerp(new THREE.Color(b), Math.max(0, Math.min(1, t))).getHexString();
}
function crearPapelPicado() {
  const g = new THREE.Group();
  const colores = ["#e8743b", "#d9668b", "#f2c14e", "#4fb3a9", "#8f6be8", "#ff4f6b"];
  for (let fila = 0; fila < 2; fila++) {
    for (let i = 0; i < 9; i++) {
      const color = colores[(i + fila * 2) % colores.length];
      const t = lienzoTextura(128, 160, (c, w, h) => {
        c.fillStyle = color; c.fillRect(0, 0, w, h);
        c.globalCompositeOperation = "destination-out";
        c.beginPath(); c.arc(w / 2, h * 0.45, 26, 0, Math.PI * 2); c.fill();
        for (let k = 0; k < 6; k++) { c.beginPath(); c.arc(16 + k * 19, h - 14, 6, 0, Math.PI * 2); c.fill(); }
        for (let k = 0; k < 8; k++) c.fillRect(10 + k * 15, 12, 6, 10);
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.52), new THREE.MeshStandardMaterial({ map: t, transparent: true, side: THREE.DoubleSide, alphaTest: 0.1, roughness: 1 }));
      m.geometry.translate(0, -0.26, 0);
      m.position.set(-3.2 + i * 0.8, 5.0 - fila * 0.1, -2.6 + fila * 1.1);
      g.add(m);
    }
  }
  return g;
}

function cartaPlana(map) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO_CARTA, ALTO_CARTA), new THREE.MeshStandardMaterial({ map, roughness: 0.75 }));
  m.rotation.x = -Math.PI / 2;
  m.receiveShadow = true;
  return m;
}
function crearMazo(map, canto, n = 0) {
  const g = new THREE.Group();
  const lado = new THREE.MeshStandardMaterial({ color: "#efe2c6", roughness: 0.9 });
  const borde = new THREE.MeshStandardMaterial({ color: canto, roughness: 0.8 });
  const tapa = new THREE.MeshStandardMaterial({ map, roughness: 0.7 });
  const caja = new THREE.Mesh(new THREE.BoxGeometry(ANCHO_CARTA, 1, ALTO_CARTA), [lado, lado, tapa, borde, borde, borde]);
  caja.castShadow = true;
  g.add(caja);
  g.userData.altura = (k) => {
    const h = Math.max(0.001, k * 0.0045);
    caja.scale.y = h;
    caja.position.y = h / 2;
    caja.visible = k > 0;
  };
  g.userData.altura(n);
  return g;
}
// Cartas boca abajo frente a cada jugador: se ve cuántas tiene.
function ponerMano(grupo, n, map) {
  if (grupo.userData.n === n) return;
  grupo.userData.n = n;
  while (grupo.children.length) grupo.remove(grupo.children[0]);
  for (let i = 0; i < n; i++) {
    const c = cartaPlana(map);
    c.scale.setScalar(0.55);
    c.position.set((i - (n - 1) / 2) * 0.09, i * 0.002, 0);
    c.rotation.z = (i - (n - 1) / 2) * 0.12;
    grupo.add(c);
  }
}

function crearSilla() {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: "#3b2216", roughness: 0.8 });
  const asiento = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.6), mat);
  asiento.position.y = 0.62;
  const respaldo = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.95, 0.07), mat);
  respaldo.position.set(0, 1.1, -0.3);
  g.add(asiento, respaldo);
  for (const [x, z] of [[-0.3, -0.25], [0.3, -0.25], [-0.3, 0.25], [0.3, 0.25]]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.62, 0.06), mat);
    p.position.set(x, 0.31, z);
    g.add(p);
  }
  return g;
}

// Fichas de cordura del color del jugador, como en la mesa real: una pila por cada 5.
function crearFichas(color, texFicha) {
  const g = new THREE.Group();
  const geo = new THREE.CylinderGeometry(0.075, 0.075, 0.022, 24);
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).lerp(new THREE.Color("#ffffff"), 0.35), map: texFicha || null, roughness: 0.6, metalness: 0, emissive: "#ff2a1a", emissiveIntensity: 0 });
  const canto = new THREE.MeshStandardMaterial({ color: "#f6ead7", roughness: 0.6 });
  const lado = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
  const fichas = [];
  for (let i = 0; i < 10; i++) {
    const f = new THREE.Mesh(geo, texFicha ? [lado, mat, mat] : [mat, canto, canto]);
    const pila = Math.floor(i / 5), alto = i % 5;
    f.position.set(pila * 0.17, 0.011 + alto * 0.023, 0);
    f.castShadow = true;
    g.add(f);
    fichas.push(f);
  }
  let peligro = false;
  g.userData.poner = (n, enPeligro) => {
    fichas.forEach((f, i) => (f.visible = i < n));
    peligro = enPeligro;
  };
  g.userData.latir = (t) => (mat.emissiveIntensity = peligro ? 0.35 + Math.sin(t * 5) * 0.25 : 0);
  return g;
}

function crearAvatar(color) {
  const t = lienzoTextura(256, 384, (g, w, h) => {
    const capa = (dx, dy, fill) => {
      g.fillStyle = fill;
      g.beginPath();
      g.moveTo(w * 0.18 + dx, h + dy); g.quadraticCurveTo(w * 0.2 + dx, h * 0.52 + dy, w * 0.5 + dx, h * 0.48 + dy);
      g.quadraticCurveTo(w * 0.8 + dx, h * 0.52 + dy, w * 0.82 + dx, h + dy); g.fill();
      g.beginPath(); g.arc(w * 0.5 + dx, h * 0.3 + dy, w * 0.17, 0, Math.PI * 2); g.fill();
      g.fillRect(w * 0.28 + dx, h * 0.17 + dy, w * 0.44, h * 0.025);
      g.fillRect(w * 0.36 + dx, h * 0.08 + dy, w * 0.28, h * 0.1);
    };
    capa(6, 6, "rgba(0,0,0,0.35)");
    capa(0, 0, color);
    g.globalCompositeOperation = "destination-out";
    g.beginPath(); g.arc(w * 0.44, h * 0.3, 6, 0, Math.PI * 2); g.arc(w * 0.56, h * 0.3, 6, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(w * 0.5, h * (0.66 + k * 0.09), 5, 0, Math.PI * 2); g.fill(); }
    g.globalCompositeOperation = "source-over";
    g.strokeStyle = "rgba(255,240,210,0.6)"; g.lineWidth = 3; g.setLineDash([6, 6]);
    g.beginPath(); g.moveTo(w * 0.24, h * 0.98); g.quadraticCurveTo(w * 0.24, h * 0.56, w * 0.5, h * 0.53); g.stroke();
  });
  const mat = new THREE.MeshStandardMaterial({ map: t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, roughness: 0.9, emissive: "#9fc4ff", emissiveIntensity: 0 });
  const plano = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 1.42), mat);
  plano.position.y = 0.71;
  plano.castShadow = true;
  const g = new THREE.Group();
  g.add(plano);
  g.rotation.y = Math.PI;
  const ruda = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 8, 32), new THREE.MeshStandardMaterial({ color: "#7bd389", emissive: "#3fa65a", emissiveIntensity: 0.8 }));
  ruda.rotation.x = Math.PI / 2;
  ruda.position.y = 0.05;
  ruda.visible = false;
  g.add(ruda);
  g.userData = { mat, ruda };
  return g;
}

/** Retrato de papel del investigador: arte del personaje y su versión espíritu. */
function crearRetrato(texVivo, texEspiritu) {
  const mat = new THREE.MeshStandardMaterial({ map: texVivo, transparent: true, alphaTest: 0.08, side: THREE.DoubleSide, roughness: 0.95 });
  const plano = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.65), mat);
  plano.position.y = 0.72;
  plano.castShadow = true;
  const g = new THREE.Group();
  g.add(plano);
  g.rotation.y = Math.PI;
  const ruda = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.025, 8, 32), new THREE.MeshStandardMaterial({ color: "#7bd389", emissive: "#3fa65a", emissiveIntensity: 0.8 }));
  ruda.rotation.x = Math.PI / 2;
  ruda.position.y = 0.05;
  ruda.visible = false;
  g.add(ruda);
  g.userData = { mat, ruda, texVivo, texEspiritu, vivo: true, plano };
  return g;
}

function crearVela() {
  const vela = new THREE.Group();
  const cera = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.32, 20), new THREE.MeshStandardMaterial({ color: "#f3e6cf", roughness: 0.5, emissive: "#3a1d05", emissiveIntensity: 0.4 }));
  cera.position.y = 0.16;
  const llama = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.1, 12), new THREE.MeshBasicMaterial({ color: "#ffd27a" }));
  llama.position.y = 0.37;
  vela.add(cera, llama);
  return vela;
}

function crearEtiqueta(color) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 128;
  const g = c.getContext("2d");
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false }));
  spr.scale.set(1.5, 0.375, 1);
  let ultimo = "";
  spr.userData.dibujar = (titulo, sub, peligro = false) => {
    const k = titulo + sub + peligro;
    if (k === ultimo) return;
    ultimo = k;
    g.clearRect(0, 0, 512, 128);
    g.fillStyle = "rgba(14,10,18,0.8)";
    g.beginPath(); g.roundRect(8, 8, 496, 112, 18); g.fill();
    g.fillStyle = color; g.fillRect(8, 8, 12, 112);
    g.fillStyle = "#f6ead7"; g.font = "600 40px Georgia, serif"; g.fillText(titulo, 38, 56, 456);
    g.fillStyle = peligro ? "#ff8a7a" : "#c9b79c"; g.font = "28px Georgia, serif"; g.fillText(sub, 38, 98, 456);
    t.needsUpdate = true;
  };
  return spr;
}

function crearAnima(texPresencia) {
  const grupo = new THREE.Group();
  const velo = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.3, 32, 1, true), new THREE.MeshStandardMaterial({ color: "#e9e4ff", transparent: true, opacity: 0.6, side: THREE.DoubleSide, emissive: "#6b5bd6", emissiveIntensity: 0.35, roughness: 1 }));
  velo.position.y = 1.55;
  const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.28, 24, 16), velo.material);
  cabeza.position.y = 2.75;
  const ojos = new THREE.Group();
  for (const x of [-0.09, 0.09]) {
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: "#ff5a3c" }));
    o.position.set(x, 2.78, 0.25);
    ojos.add(o);
  }
  const luz = new THREE.PointLight("#8f7bff", 2.5, 4, 2);
  luz.position.set(0, 2.2, 0.6);
  const mano = new THREE.Group();
  mano.position.set(0, 1.07, 0.95);
  const etiqueta = crearEtiqueta("#8f7bff");
  etiqueta.position.set(0, 3.45, 0);
  etiqueta.userData.dibujar("El ánima", "identidad oculta");
  // La presencia: figura de humo y papel; el velo queda como halo tenue.
  const presencia = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 2.55), new THREE.MeshStandardMaterial({ map: texPresencia, transparent: true, alphaTest: 0.05, side: THREE.DoubleSide, roughness: 1, emissive: "#3a2a6a", emissiveIntensity: 0.25 }));
  presencia.position.y = 1.75;
  velo.visible = cabeza.visible = ojos.visible = false;
  grupo.add(velo, cabeza, ojos, presencia, luz, mano, etiqueta);
  let revelada = false;
  return {
    grupo, velo, mano,
    revelar(nombre) {
      if (revelada) return;
      revelada = true;
      velo.material.color.set("#ff9a8a");
      presencia.material.emissive.set("#b0202a"); presencia.material.emissiveIntensity = 0.35;
      velo.material.emissive.set("#b0202a");
      luz.color.set("#ff3b2f");
      etiqueta.userData.dibujar(nombre, "¡revelada!");
    },
  };
}

function crearDado() {
  const P = { 1: [[0.5, 0.5]], 2: [[0.28, 0.28], [0.72, 0.72]], 3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]], 4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]], 5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]], 6: [[0.28, 0.22], [0.72, 0.22], [0.28, 0.5], [0.72, 0.5], [0.28, 0.78], [0.72, 0.78]] };
  const caras = [1, 6, 2, 5, 3, 4].map((n) => lienzoTextura(128, 128, (g, w, h) => {
    g.fillStyle = "#f4ead8"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#3a1220";
    for (const [x, y] of P[n]) { g.beginPath(); g.arc(x * w, y * h, 11, 0, Math.PI * 2); g.fill(); }
  }));
  const d = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), caras.map((map) => new THREE.MeshStandardMaterial({ map, roughness: 0.4 })));
  d.castShadow = true;
  d.userData.valor = 1;
  return d;
}
function orientarDado(d, v) {
  const R = { 1: [0, 0, Math.PI / 2], 6: [0, 0, -Math.PI / 2], 2: [0, 0, 0], 5: [Math.PI, 0, 0], 3: [-Math.PI / 2, 0, 0], 4: [Math.PI / 2, 0, 0] }[v] || [0, 0, 0];
  const cara = new THREE.Quaternion().setFromEuler(new THREE.Euler(R[0], 0, R[2]));
  d.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.4).multiply(cara);
}

// Ofrenda: confirmadas boca arriba y brillando; pistas translúcidas; descartadas oscuras y tachadas.
function pintarOfrenda(ofrenda, v, tex) {
  const clave = JSON.stringify([v.confirmadas, v.pistas, v.descartadas]);
  if (ofrenda.userData.clave === clave) return;
  ofrenda.userData.clave = clave;
  while (ofrenda.children.length) ofrenda.remove(ofrenda.children[0]);
  const filas = [
    v.confirmadas.map((e) => [e, "si"]),
    v.pistas.filter((p) => !v.confirmadas.includes(p.ev) && !v.descartadas.includes(p.ev)).map((p) => [p.ev, "pista"]).filter((x, i, a) => a.findIndex((y) => y[0] === x[0]) === i),
    v.descartadas.map((e) => [e, "no"]),
  ];
  filas.forEach((fila, f) => fila.forEach(([ev, est], k) => {
    const m = cartaPlana(tex("ev" + ev));
    m.material = new THREE.MeshStandardMaterial({
      map: tex("ev" + ev), roughness: 0.8, transparent: est === "pista", opacity: est === "pista" ? 0.55 : 1,
      color: est === "no" ? "#4a3a40" : "#ffffff", emissive: est === "si" ? "#6a4510" : "#000000", emissiveIntensity: est === "si" ? 0.45 : 0,
    });
    const escala = f === 0 ? 0.85 : 0.6;
    m.scale.setScalar(escala);
    m.position.set((k - (fila.length - 1) / 2) * (ANCHO_CARTA * escala + 0.05), 0.001 * (f + 1), [-0.15, 0.32, 0.62][f]);
    m.rotation.z = (k - (fila.length - 1) / 2) * 0.04;
    ofrenda.add(m);
    if (est === "no") {
      const x = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.42), new THREE.MeshBasicMaterial({ color: "#e0483d" }));
      x.rotation.set(-Math.PI / 2, 0, 0.6);
      x.position.copy(m.position).setY(0.004);
      ofrenda.add(x);
    }
  }));
}

// ------------------------------------------------------------------ partículas

function crearParticulas(scene) {
  const punto = lienzoTextura(64, 64, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(0.35, "rgba(255,255,255,0.6)"); r.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = r; g.fillRect(0, 0, w, h);
  });
  const activos = [];
  function emitir(origen, { color, n, vel, gravedad = 0, vida = 1.2, tam = 0.08, abanico = 1, arriba = 0, aditivo = true }) {
    const pos = new Float32Array(n * 3), v = [];
    for (let i = 0; i < n; i++) {
      pos.set([origen.x, origen.y, origen.z], i * 3);
      const d = new THREE.Vector3(Math.random() - 0.5, Math.random() * abanico + arriba, Math.random() - 0.5).normalize().multiplyScalar(vel * (0.4 + Math.random() * 0.8));
      v.push(d);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color, size: tam, map: punto, transparent: true, depthWrite: false, blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending });
    const p = new THREE.Points(geo, mat);
    scene.add(p);
    activos.push({ p, v, t: 0, vida, gravedad });
  }
  return {
    chispas: (o, color, n = 60) => emitir(o, { color, n, vel: 1.4, gravedad: -2.2, vida: 1.1, tam: 0.06, abanico: 1.2 }),
    brasas: (o, color, n = 60) => emitir(o, { color, n, vel: 0.9, gravedad: 0.6, vida: 1.6, tam: 0.07, abanico: 1, arriba: 0.4 }),
    motas: (o, color, n = 40, g = 0.5) => emitir(o, { color, n, vel: 0.35, gravedad: g, vida: 1.8, tam: 0.06, abanico: 1, arriba: 0.8 }),
    humo: (o, color, n = 40) => emitir(o, { color, n, vel: 0.4, gravedad: 0.35, vida: 2.0, tam: 0.35, abanico: 0.8, arriba: 0.4, aditivo: false }),
    escudo: (o, color) => emitir(o, { color, n: 90, vel: 1.1, gravedad: 0, vida: 0.9, tam: 0.07, abanico: 0.2 }),
    anillo: (o, color) => {
      const m = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.13, 48), new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
      m.rotation.x = -Math.PI / 2;
      m.position.copy(o);
      scene.add(m);
      activos.push({ anillo: m, t: 0, vida: 1 });
    },
    actualizar(dt) {
      for (let i = activos.length - 1; i >= 0; i--) {
        const a = activos[i];
        a.t += dt;
        const k = a.t / a.vida;
        if (a.anillo) {
          a.anillo.scale.setScalar(1 + k * 12);
          a.anillo.material.opacity = 1 - k;
        } else {
          const arr = a.p.geometry.attributes.position.array;
          a.v.forEach((v, j) => {
            v.y += a.gravedad * dt;
            arr[j * 3] += v.x * dt; arr[j * 3 + 1] += v.y * dt; arr[j * 3 + 2] += v.z * dt;
          });
          a.p.geometry.attributes.position.needsUpdate = true;
          a.p.material.opacity = Math.max(0, 1 - k);
        }
        if (k >= 1) {
          const o = a.anillo ?? a.p;
          scene.remove(o); o.geometry.dispose(); o.material.dispose();
          activos.splice(i, 1);
        }
      }
    },
  };
}
