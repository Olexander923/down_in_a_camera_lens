import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { makeGirl, poseGirl, wearPinkDress } from "./hero3d.js?v=paint18";

const black = 0x12100e;
const metal = 0x3a342e;
const steel = 0x6d655c;
const brass = 0xb08a4a;
const gold = 0xe7b15a;

const stations = {
  zoom: {
    girl: new THREE.Vector3(-3.55, -0.42, 0.55),
    look: new THREE.Vector3(-3.35, 0.42, 0.15),
    cam: new THREE.Vector3(-3.15, 1.12, 5.05)
  },
  aperture: {
    girl: new THREE.Vector3(-1.15, -0.42, 0.55),
    look: new THREE.Vector3(-1.05, 0.42, 0.15),
    cam: new THREE.Vector3(-0.95, 1.12, 5.05)
  },
  focus: {
    girl: new THREE.Vector3(0.45, -0.42, 0.55),
    look: new THREE.Vector3(0.45, 0.42, 0.15),
    cam: new THREE.Vector3(0.45, 1.12, 5.05)
  },
  shutter: {
    girl: new THREE.Vector3(2.15, -0.42, 0.55),
    look: new THREE.Vector3(2.15, 0.42, 0.15),
    cam: new THREE.Vector3(2.05, 1.12, 5.05)
  },
  iso: {
    girl: new THREE.Vector3(3.55, -0.42, 0.55),
    look: new THREE.Vector3(3.45, 0.42, 0.15),
    cam: new THREE.Vector3(3.25, 1.12, 5.05)
  }
};

const notes = {
  zoom: [
    { part: "front", p: [0, 0.72, 0.55], title: "Передняя линза", t: "Передняя линза. Первый кусок стекла, куда входит свет." },
    { part: "zoomMove", p: [0, 0.68, 0.52], title: "Группа зума", t: "Группа зума. Линзы разъезжаются — угол обзора становится уже." },
    { part: "bayonet", p: [0, 0.18, 0.72], title: "Байонет", t: "Оправа объектива и байонетное кольцо. Здесь объектив крепится к корпусу." }
  ],
  aperture: [
    { part: "iris", p: [0, 0.7, 0.52], title: "Лепесток", t: "Лепесток ирисовой диафрагмы. Девять штук сходятся и сужают просвет." },
    { part: "fRing", p: [0, 0.22, 0.78], title: "Число f/", t: "Число диафрагмы. f/2 — открыта, f/8 — прикрыта." },
    { part: "iris", p: [0.1, 0.06, 0.42], title: "Просвет", t: "Просвет между лепестками. Чем он уже, тем меньше света идёт к фокусной группе." }
  ],
  focus: [
    { part: "focusMove", p: [0, 0.7, 0.28], title: "Подвижная линза", t: "Подвижная линза. Мотор сдвигает её вдоль оси, пока кадр не станет резким." },
    { part: "helicoid", p: [0, 0.16, 0.68], title: "Геликоид", t: "Геликоид — винтовая резьба, по которой едет группа." },
    { part: "motor", p: [0, 0.18, 0.28], title: "Мотор AF", t: "Мотор автофокуса. Крутит геликоид, а не «угадывает» сюжет." }
  ],
  shutter: [
    { part: "curtainTop", p: [0.08, 0.42, 0.2], title: "Первая шторка", t: "Первая шторка. Уходит вниз и открывает матрицу." },
    { part: "slit", p: [0.12, 0, 0.42], title: "Щель", t: "Щель. На 1/1000 две шторки бегут друг за другом." },
    { part: "curtainBot", p: [0.08, -0.38, 0.2], title: "Вторая шторка", t: "Вторая шторка. Закрывает кадр и заканчивает выдержку." }
  ],
  iso: [
    { part: "micro", p: [0, 0.22, 0.18], title: "Микролинза", t: "Микролинза над пикселем. Собирает свет в ячейку." },
    { part: "bayer", p: [0.12, 0.08, 0.55], title: "Пиксель Bayer", t: "Пиксель матрицы. Ловит фотоны, сам свет не добавляет." },
    { part: "amp", p: [0, 0.16, 0.22], title: "Усилитель ISO", t: "Усилитель ISO. Делает сигнал громче — и зерно тоже." }
  ]
};

function std(color, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.42,
    metalness: 0.55,
    ...extra
  });
}

function glassMat(color = 0xcfe4ff, opacity = 0.4) {
  return new THREE.MeshPhysicalMaterial({
    color,
    metalness: 0.04,
    roughness: 0.06,
    transparent: true,
    opacity,
    side: THREE.DoubleSide,
    clearcoat: 0.7,
    clearcoatRoughness: 0.12,
    emissive: color,
    emissiveIntensity: 0.035
  });
}

function makeStudioEnv(renderer) {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#d5deec");
  g.addColorStop(0.42, "#8a7a68");
  g.addColorStop(1, "#16100c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);
  const key = ctx.createRadialGradient(360, 64, 8, 360, 64, 150);
  key.addColorStop(0, "rgba(255,228,176,0.95)");
  key.addColorStop(1, "rgba(255,228,176,0)");
  ctx.fillStyle = key;
  ctx.fillRect(0, 0, 512, 256);
  const rim = ctx.createRadialGradient(90, 110, 6, 90, 110, 110);
  rim.addColorStop(0, "rgba(186,214,255,0.55)");
  rim.addColorStop(1, "rgba(186,214,255,0)");
  ctx.fillStyle = rim;
  ctx.fillRect(0, 0, 512, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromEquirectangular(tex).texture;
  tex.dispose();
  pmrem.dispose();
  return env;
}

function wrapLines(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function makeCaption(text, compact) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const font = compact
    ? "600 26px Manrope, 'Segoe UI', sans-serif"
    : "500 24px Manrope, 'Segoe UI', sans-serif";
  ctx.font = font;
  const maxW = compact ? 260 : 400;
  const lines = wrapLines(ctx, text, maxW);
  const lineH = compact ? 32 : 32;
  const padX = compact ? 14 : 16;
  const padY = compact ? 10 : 12;
  const textW = Math.max(...lines.map((l) => ctx.measureText(l).width));
  const w = Math.ceil(textW + padX * 2);
  const h = Math.ceil(lines.length * lineH + padY * 2);
  canvas.width = w * 2;
  canvas.height = h * 2;
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  ctx.font = font;
  ctx.textBaseline = "middle";
  const r = 10;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(w, 0, w, h, r);
  ctx.arcTo(w, h, 0, h, r);
  ctx.arcTo(0, h, 0, 0, r);
  ctx.arcTo(0, 0, w, 0, r);
  ctx.closePath();
  ctx.fillStyle = compact ? "rgba(36, 28, 20, 0.92)" : "rgba(16, 12, 10, 0.94)";
  ctx.fill();
  ctx.strokeStyle = compact ? "rgba(243, 215, 161, 0.85)" : "rgba(231, 177, 90, 0.9)";
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = compact ? "#f3d7a1" : "#f6f1e8";
  lines.forEach((line, i) => {
    ctx.fillText(line, padX, padY + lineH * i + lineH * 0.5);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false,
      depthWrite: false
    })
  );
  sprite.scale.set(compact ? w / 300 : w / 250, compact ? h / 300 : h / 250, 1);
  sprite.center.set(0, compact ? 0.35 : 0);
  sprite.renderOrder = compact ? 18 : 22;
  sprite.userData.captionTex = tex;
  sprite.raycast = () => {};
  return sprite;
}

function hotspot(parent, pos, note, title) {
  const group = new THREE.Group();
  group.position.copy(pos);

  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xf3d7a1 })
  );
  glow.userData.pulse = true;
  const halo = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshBasicMaterial({
      color: 0xf3d7a1,
      transparent: true,
      opacity: 0.28,
      depthWrite: false
    })
  );
  halo.userData.pulse = true;
  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.2, 12, 12),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  const light = new THREE.PointLight(0xf3d7a1, 0.4, 1.05);
  const caption = makeCaption(note, false);
  caption.position.set(0.16, 0.18, 0.1);
  caption.visible = false;
  caption.userData.fullCaption = true;

  const payload = { note, title, hot: true, caption };
  glow.userData = { ...glow.userData, ...payload };
  halo.userData = { ...halo.userData, ...payload };
  hit.userData = payload;
  group.userData = payload;
  group.add(glow, halo, hit, light, caption);
  parent.add(group);
  return group;
}

function addHotspots(id, parts, liveHots) {
  liveHots.forEach((h) => {
    if (h.parent) h.parent.remove(h);
  });
  liveHots.length = 0;
  (notes[id] || []).forEach((n) => {
    const parent = (n.part && parts[n.part]) || parts.root;
    liveHots.push(hotspot(parent, new THREE.Vector3(...n.p), n.t, n.title));
  });
}

function lensElement(radius, bulge, color = 0xd8e8ff, opacity = 0.4) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 48, 28), glassMat(color, opacity));
  mesh.scale.set(bulge, 1, 1);
  mesh.castShadow = true;
  return mesh;
}

function ring(inner, outer, thick, color = metal) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thick, bevelEnabled: false, steps: 1, curveSegments: 48 });
  geo.center();
  return new THREE.Mesh(geo, std(color, { metalness: 0.7, roughness: 0.32 }));
}

function lensCell(radius, bulge, tint, flip = false, opacity = 0.4) {
  const g = new THREE.Group();
  const glass = lensElement(radius, bulge, tint, opacity);
  if (flip) glass.scale.x *= -1;
  const rim = ring(radius * 0.94, radius + 0.018, 0.028, 0x9a8a78);
  rim.rotation.y = Math.PI / 2;
  g.add(glass, rim);
  return g;
}

function helixTube(radius, length, turns, tubeR, color) {
  const pts = [];
  const n = 220;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * turns * Math.PI * 2;
    pts.push(new THREE.Vector3((t - 0.5) * length, Math.cos(a) * radius, Math.sin(a) * radius));
  }
  const mesh = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, tubeR, 7, false),
    std(color, { metalness: 0.92, roughness: 0.16 })
  );
  mesh.userData.spin = 0.55;
  return mesh;
}

function nameplate(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(22, 16, 12, 0.0)";
  ctx.fillRect(0, 0, 512, 128);
  ctx.font = "600 42px Manrope, 'Segoe UI', sans-serif";
  ctx.fillStyle = "#e7b15a";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: true })
  );
  sprite.scale.set(1.15, 0.28, 1);
  sprite.userData.captionTex = tex;
  sprite.raycast = () => {};
  return sprite;
}

function makeCurtain(height, depth, blades, color) {
  const g = new THREE.Group();
  const bh = height / blades;
  for (let i = 0; i < blades; i++) {
    const shade = i % 2 ? 0x14110e : color;
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.032, bh * 1.06, depth),
      std(shade, { metalness: 0.72, roughness: 0.24 })
    );
    blade.position.y = height / 2 - i * bh - bh / 2;
    const rib = new THREE.Mesh(
      new THREE.BoxGeometry(0.014, bh * 0.92, 0.045),
      std(steel, { metalness: 0.82, roughness: 0.2 })
    );
    rib.position.set(0.02, blade.position.y, 0);
    g.add(blade, rib);
  }
  return g;
}

function buildCamera(scene) {
  const body = new THREE.Group();
  const axisY = 0.18;

  const shell = std(black, { roughness: 0.72, metalness: 0.25 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.9, 0.12), shell);
  back.position.set(1.7, axisY, -1.28);
  const rear = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.9, 1.7), shell);
  rear.position.set(4.42, axisY, -0.48);
  body.add(back, rear);

  const deck = new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 0.08, 1.5),
    std(0x2a221c, { roughness: 0.86, metalness: 0.12 })
  );
  deck.position.set(-0.25, -0.72, 0.48);
  deck.receiveShadow = true;
  body.add(deck);

  const cutStart = Math.PI * 1.02;
  const cutLen = Math.PI * 0.96;
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(3.6, 0.06, 0.22),
    std(0x2a241e, { roughness: 0.5, metalness: 0.4 })
  );
  rail.position.set(-3.4, -0.62, 0);
  body.add(rail);

  const filter = ring(0.9, 0.98, 0.035, 0x8a7a68);
  filter.rotation.y = Math.PI / 2;
  filter.position.set(-5.12, axisY, 0);
  const filterGlass = lensElement(0.78, 0.04, 0xe8f4ff, 0.22);
  filterGlass.position.set(-5.12, axisY, 0);
  body.add(filter, filterGlass);

  const front = new THREE.Group();
  front.position.set(-4.52, axisY, 0);
  front.add(lensCell(0.82, 0.32, 0xd9eefe, false, 0.38));
  const flint = lensCell(0.72, 0.2, 0xb7c4e8, true, 0.42);
  flint.position.x = 0.38;
  front.add(flint);
  body.add(front);

  const zoomMove = new THREE.Group();
  zoomMove.position.set(-3.42, axisY, 0);
  zoomMove.userData.zoomGroup = true;
  zoomMove.userData.baseX = -3.42;
  zoomMove.add(lensCell(0.64, 0.24, 0xcfe8d8, false, 0.4));
  const z2 = lensCell(0.58, 0.18, 0xc5d8f2, true, 0.4);
  z2.position.x = 0.36;
  zoomMove.add(z2);
  body.add(zoomMove);

  const zoomComp = new THREE.Group();
  zoomComp.position.set(-2.62, axisY, 0);
  zoomComp.userData.zoomComp = true;
  zoomComp.userData.baseX = -2.62;
  zoomComp.add(lensCell(0.54, 0.2, 0xd8e8ff, false, 0.38));
  const z4 = lensCell(0.5, 0.16, 0xb7cce8, true, 0.4);
  z4.position.x = 0.3;
  zoomComp.add(z4);
  body.add(zoomComp);

  const bayonet = new THREE.Group();
  bayonet.position.set(-1.72, axisY, 0);
  const bayRing = ring(0.6, 0.94, 0.12, brass);
  bayRing.rotation.y = Math.PI / 2;
  bayonet.add(bayRing);
  for (let i = 0; i < 3; i++) {
    const lug = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.22), std(brass, { metalness: 0.85, roughness: 0.22 }));
    const a = (i / 3) * Math.PI * 2;
    lug.position.set(0.04, Math.cos(a) * 0.72, Math.sin(a) * 0.72);
    bayonet.add(lug);
  }
  body.add(bayonet);

  const iris = new THREE.Group();
  iris.position.set(-1.15, axisY, 0);
  const irisMech = new THREE.Group();
  irisMech.rotation.y = Math.PI / 2;
  const irisRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.66, 0.055, 12, 48),
    std(brass, { metalness: 0.88, roughness: 0.2 })
  );
  irisMech.add(irisRing);
  const pivots = [];
  const bladeA = std(0x1a1612, { metalness: 0.8, roughness: 0.18 });
  const bladeB = std(0x3a342c, { metalness: 0.72, roughness: 0.22 });
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.position.set(Math.cos(a) * 0.58, Math.sin(a) * 0.58, (i - 4) * 0.005);
    pivot.userData.base = a;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.125, 0.012), i % 2 ? bladeA : bladeB);
    blade.position.set(0.16, 0.045, 0);
    pivot.add(blade);
    irisMech.add(pivot);
    pivots.push(pivot);
  }
  irisMech.userData.iris = true;
  irisMech.userData.pivots = pivots;
  iris.add(irisMech);
  body.add(iris);

  const fRing = new THREE.Group();
  fRing.position.set(-1.42, axisY, 0);
  const fRingMesh = ring(0.7, 0.82, 0.08, 0x3a342e);
  fRingMesh.rotation.y = Math.PI / 2;
  fRing.add(fRingMesh);
  for (let i = 0; i < 8; i++) {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.045, 0.012), std(gold, { metalness: 0.7 }));
    const a = (i / 8) * Math.PI * 2;
    tick.position.set(0.02, Math.cos(a) * 0.76, Math.sin(a) * 0.76);
    fRing.add(tick);
  }
  body.add(fRing);

  const helicoid = new THREE.Group();
  helicoid.position.set(0.42, axisY, 0);
  const helixSleeve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.62, 1.15, 36, 1, true, cutStart, cutLen),
    std(0x4a4034, { side: THREE.DoubleSide, metalness: 0.55, roughness: 0.35 })
  );
  helixSleeve.rotation.z = Math.PI / 2;
  const thread1 = helixTube(0.64, 1.12, 4.2, 0.022, gold);
  const thread2 = helixTube(0.64, 1.12, 4.2, 0.018, 0xc4a35a);
  thread2.rotation.x = Math.PI;
  helicoid.add(helixSleeve, thread1, thread2);
  body.add(helicoid);

  const focusMove = new THREE.Group();
  focusMove.position.set(0.38, axisY, 0);
  focusMove.userData.focusGroup = true;
  focusMove.userData.baseX = 0.38;
  focusMove.add(lensCell(0.5, 0.22, 0xe8ddc8, false, 0.42));
  const f2 = lensCell(0.46, 0.16, 0xc0d4ee, true, 0.4);
  f2.position.x = 0.34;
  focusMove.add(f2);
  body.add(focusMove);

  const motor = new THREE.Group();
  motor.position.set(0.48, -0.46, 0.42);
  const motorBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 0.36, 18),
    std(0x2f6b4f, { metalness: 0.45, roughness: 0.35 })
  );
  motorBody.rotation.z = Math.PI / 2;
  const gear = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.05, 14),
    std(0x1a1814, { metalness: 0.6, roughness: 0.3 })
  );
  gear.rotation.z = Math.PI / 2;
  gear.position.x = 0.2;
  motor.add(motorBody, gear);
  body.add(motor);

  const gate = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 1.62, 1.62),
    std(metal, { metalness: 0.6, roughness: 0.35 })
  );
  gate.position.set(2.12, axisY, -0.08);
  body.add(gate);
  const windowCut = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 1.28, 1.42),
    std(0x080604, { metalness: 0.1, roughness: 0.8 })
  );
  windowCut.position.set(2.14, axisY, 0.04);
  body.add(windowCut);

  const curtainTop = makeCurtain(0.78, 1.32, 6, 0x2c261f);
  curtainTop.position.set(2.24, 0.56, 0.08);
  curtainTop.userData.curtain = "top";
  const curtainBot = makeCurtain(0.78, 1.32, 6, 0x1a1613);
  curtainBot.position.set(2.28, -0.22, 0.08);
  curtainBot.userData.curtain = "bot";
  body.add(curtainTop, curtainBot);

  const slitHold = new THREE.Group();
  slitHold.position.set(2.32, axisY, 0.08);
  const slit = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.08, 1.34),
    new THREE.MeshBasicMaterial({ color: 0xfff1c2, transparent: true, opacity: 0.9 })
  );
  slitHold.add(slit);
  scene.userData.slit = slit;
  body.add(slitHold);
  const slitGlow = new THREE.PointLight(0xffe7a3, 1.1, 2.2);
  slitGlow.position.set(2.32, axisY, 0.35);
  body.add(slitGlow);

  const sensor = new THREE.Group();
  sensor.position.set(3.58, axisY, 0);
  const silicon = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 1.18, 1.52),
    std(0x1a2430, { metalness: 0.35, roughness: 0.4 })
  );
  sensor.add(silicon);
  const irPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 1.16, 1.48),
    glassMat(0xd8eeff, 0.28)
  );
  irPlate.position.x = -0.08;
  sensor.add(irPlate);

  const pixels = new THREE.Group();
  const pixGeo = new THREE.BoxGeometry(0.02, 0.068, 0.068);
  const bayerMats = [
    std(0xe24b3c, { metalness: 0.12, roughness: 0.32, emissive: 0x5a120c, emissiveIntensity: 0.22 }),
    std(0x2faf5a, { metalness: 0.12, roughness: 0.32, emissive: 0x0a2a12, emissiveIntensity: 0.18 }),
    std(0x3b6ad6, { metalness: 0.12, roughness: 0.32, emissive: 0x0c1638, emissiveIntensity: 0.24 }),
    std(0x27a050, { metalness: 0.12, roughness: 0.32, emissive: 0x082010, emissiveIntensity: 0.18 })
  ];
  for (let row = -6; row <= 6; row++) {
    for (let col = -8; col <= 8; col++) {
      const evenR = ((row + 8) & 1) === 0;
      const evenC = ((col + 8) & 1) === 0;
      const idx = evenR ? (evenC ? 1 : 0) : evenC ? 2 : 3;
      const cell = new THREE.Mesh(pixGeo, bayerMats[idx]);
      cell.position.set(0.04, row * 0.078, col * 0.078);
      pixels.add(cell);
    }
  }
  pixels.userData.pixels = true;
  sensor.add(pixels);
  scene.userData.pixels = pixels;
  body.add(sensor);

  const micro = new THREE.Group();
  micro.position.set(3.72, 0.52, 0.48);
  const microMat = glassMat(0xe8f4ff, 0.5);
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 2; c++) {
      const evenR = r === 0;
      const evenC = c === 0;
      const idx = evenR ? (evenC ? 1 : 0) : evenC ? 2 : 3;
      const cell = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.16, 0.16), bayerMats[idx]);
      cell.position.set(0, (r - 0.5) * 0.18, (c - 0.5) * 0.18);
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), microMat);
      lens.scale.set(0.45, 1, 1);
      lens.position.set(-0.07, (r - 0.5) * 0.18, (c - 0.5) * 0.18);
      micro.add(cell, lens);
    }
  }
  body.add(micro);

  const amp = new THREE.Group();
  amp.position.set(3.38, -0.42, 0.62);
  const chip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.38), std(gold, { metalness: 0.78, roughness: 0.22 }));
  amp.add(chip);
  for (let i = 0; i < 6; i++) {
    const pin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.02), std(steel));
    pin.position.set(-0.08, -0.04, -0.14 + i * 0.055);
    amp.add(pin);
  }
  body.add(amp);

  const rayColors = [0xe24b4b, 0xf0c56a, 0xe24b4b];
  for (let i = -1; i <= 1; i++) {
    const ray = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.008, 8.6, 8),
      new THREE.MeshBasicMaterial({ color: rayColors[i + 1], transparent: true, opacity: 0.42 })
    );
    ray.rotation.z = Math.PI / 2;
    ray.position.set(-0.35, axisY + i * 0.28, 0.03 * i);
    body.add(ray);
  }

  const gutLight = new THREE.PointLight(0xffe6c4, 1.15, 5.5);
  gutLight.position.set(-3.3, 0.55, 0.85);
  const midLight = new THREE.PointLight(0xf2d48a, 0.95, 4.5);
  midLight.position.set(0.4, 0.5, 0.9);
  const rearLight = new THREE.PointLight(0xcfe4ff, 0.9, 4.2);
  rearLight.position.set(3.4, 0.45, 0.95);
  body.add(gutLight, midLight, rearLight);

  scene.add(body);
  return {
    body,
    zoomMove,
    zoomComp,
    focusMove,
    iris,
    parts: {
      root: body,
      front,
      zoomMove,
      zoomComp,
      bayonet,
      iris,
      fRing,
      helicoid,
      focusMove,
      motor,
      curtainTop,
      curtainBot,
      slit: slitHold,
      sensor,
      bayer: sensor,
      micro,
      amp
    }
  };
}

export function mountNodeScene(container, nodeId, onNote) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0908);
  scene.fog = new THREE.Fog(0x0b0908, 14, 26);

  const camera = new THREE.PerspectiveCamera(50, 1, 0.08, 40);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.touchAction = "none";
  renderer.domElement.style.cursor = "grab";
  container.appendChild(renderer.domElement);

  scene.environment = makeStudioEnv(renderer);
  scene.environmentIntensity = 0.7;

  scene.add(new THREE.AmbientLight(0x8a7868, 0.58));
  const key = new THREE.DirectionalLight(0xffe7a3, 1.45);
  key.position.set(2.5, 5.5, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  scene.add(new THREE.HemisphereLight(0xf2d48a, 0x120e0c, 0.5));
  const fill = new THREE.PointLight(0xffc07a, 1.35, 12);
  fill.position.set(-4.8, 1.4, 2.2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xcfe4ff, 0.55);
  rim.position.set(-1.5, 1.2, 6.5);
  scene.add(rim);

  const built = buildCamera(scene);
  const girl = makeGirl();
  scene.add(girl);

  const liveHots = [];
  function hideCaptions() {
    liveHots.forEach((h) => {
      if (h.userData.caption) h.userData.caption.visible = false;
    });
  }
  function showCaption(hotObj) {
    if (!hotObj || !hotObj.userData || !hotObj.userData.note) return;
    hideCaptions();
    if (hotObj.userData.caption) hotObj.userData.caption.visible = true;
    if (onNote) onNote(hotObj.userData.note);
  }
  function showNotes(id) {
    addHotspots(id, built.parts, liveHots);
  }

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance = 2.4;
  controls.maxDistance = 16;
  controls.minPolarAngle = 0.08;
  controls.maxPolarAngle = Math.PI * 0.94;

  let current = nodeId;
  let walk = null;
  function snap(id) {
    const st = stations[id] || stations.zoom;
    girl.position.copy(st.girl);
    camera.position.copy(st.cam);
    controls.target.copy(st.look);
    showNotes(id);
    current = id;
  }
  snap(nodeId);

  function goTo(id, onArrive) {
    const st = stations[id] || stations.zoom;
    if (current === id || girl.position.distanceTo(st.girl) < 0.4) {
      walk = null;
      snap(id);
      poseGirl(girl, 0, false, 0, camera);
      if (typeof onArrive === "function") {
        setTimeout(() => onArrive(id), 80);
      }
      return;
    }
    walk = {
      fromG: girl.position.clone(),
      toG: st.girl.clone(),
      fromC: camera.position.clone(),
      toC: st.cam.clone(),
      fromT: controls.target.clone(),
      toT: st.look.clone(),
      t: 0,
      t0: performance.now(),
      id,
      onArrive
    };
    showNotes(id);
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function hotMeshes() {
    const list = [];
    liveHots.forEach((g) => {
      g.traverse((o) => {
        if (o.isMesh && o.userData && o.userData.hot) list.push(o);
      });
    });
    return list;
  }
  function hitHot(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(hotMeshes(), true);
    return hits.length ? hits[0].object : null;
  }
  function onPointerMove(event) {
    const hot = hitHot(event);
    if (hot) {
      renderer.domElement.style.cursor = "pointer";
      showCaption(hot);
    } else {
      renderer.domElement.style.cursor = "grab";
      hideCaptions();
    }
  }
  function onPointerDown() {
    renderer.domElement.style.cursor = "grabbing";
  }
  function onClick(event) {
    const hot = hitHot(event);
    if (hot) showCaption(hot);
  }
  function onPointerLeave() {
    renderer.domElement.style.cursor = "grab";
    hideCaptions();
  }
  renderer.domElement.addEventListener("pointermove", onPointerMove);
  renderer.domElement.addEventListener("pointerdown", onPointerDown);
  renderer.domElement.addEventListener("click", onClick);
  renderer.domElement.addEventListener("pointerleave", onPointerLeave);

  function resize() {
    const w = Math.max(container.clientWidth || window.innerWidth, 1);
    const h = Math.max(container.clientHeight || window.innerHeight, 1);
    camera.aspect = w / h;
    camera.fov = camera.aspect < 0.9 ? 62 : 50;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  resize();
  requestAnimationFrame(resize);
  window.addEventListener("resize", resize);
  const ro = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(container);

  const clock = new THREE.Clock();
  let raf = 0;
  function tick() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (walk) {
      walk.t = (performance.now() - walk.t0) / 3400;
      const near = girl.position.distanceTo(walk.toG) < 0.14;
      if (walk.t >= 0.92 || near) {
        girl.position.copy(walk.toG);
        camera.position.copy(walk.toC);
        controls.target.copy(walk.toT);
        current = walk.id;
        const cb = walk.onArrive;
        walk = null;
        poseGirl(girl, t, false, 0, camera);
        if (typeof cb === "function") setTimeout(() => cb(current), 220);
      } else {
        const k = 1 - Math.pow(1 - walk.t, 3);
        const camT = Math.max(0, (walk.t - 0.16) / 0.84);
        const camK = camT >= 1 ? 1 : 1 - Math.pow(1 - camT, 3);
        girl.position.lerpVectors(walk.fromG, walk.toG, k);
        camera.position.lerpVectors(walk.fromC, walk.toC, camK);
        controls.target.lerpVectors(walk.fromT, walk.toT, camK);
        const step = Math.abs(Math.sin(walk.t * Math.PI * 8));
        girl.position.y = THREE.MathUtils.lerp(walk.fromG.y, walk.toG.y, k) + step * 0.045;
        const dx = walk.toG.x - walk.fromG.x;
        const dz = walk.toG.z - walk.fromG.z;
        const faceYaw = Math.abs(dx) + Math.abs(dz) > 0.001 ? Math.atan2(dx, dz) : girl.userData.rig.yaw;
        poseGirl(girl, t, true, walk.t, camera, faceYaw);
      }
    } else {
      girl.position.y = (stations[current] || stations.zoom).girl.y;
      poseGirl(girl, t, false, 0, camera);
    }

    scene.traverse((obj) => {
      if (obj.userData.zoomGroup) obj.position.x = (obj.userData.baseX || 0) + Math.sin(t * 0.7) * 0.2;
      if (obj.userData.zoomComp) obj.position.x = (obj.userData.baseX || 0) - Math.sin(t * 0.7) * 0.16;
      if (obj.userData.focusGroup) obj.position.x = (obj.userData.baseX || 0) + Math.sin(t * 1.1) * 0.16;
      if (obj.userData.spin) obj.rotation.x = t * obj.userData.spin;
      if (obj.userData.iris && obj.userData.pivots) {
        const twist = 0.2 + (0.5 + Math.sin(t * 0.9) * 0.5) * 0.85;
        obj.userData.pivots.forEach((pivot) => {
          pivot.rotation.z = pivot.userData.base + twist;
        });
      }
      if (obj.userData.curtain === "top") obj.position.y = 0.56 + Math.max(0, Math.sin(t * 1.15)) * 0.42;
      if (obj.userData.curtain === "bot") obj.position.y = -0.22 - Math.max(0, Math.sin(t * 1.15)) * 0.42;
      if (obj.userData.pulse) {
        const s = 1 + Math.sin(t * 3.4) * 0.14;
        obj.scale.setScalar(s);
      }
    });
    if (scene.userData.slit) {
      const open = Math.max(0, Math.sin(t * 1.15));
      scene.userData.slit.material.opacity = 0.2 + open * 0.8;
      scene.userData.slit.scale.y = 0.7 + open * 1.8;
    }
    if (scene.userData.pixels) {
      scene.userData.pixels.children.forEach((cell, i) => {
        if (i % 11 === 0) cell.position.x = 0.04 + (Math.sin(t * 9 + i) > 0.82 ? 0.02 : 0);
      });
    }

    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  tick();

  return {
    goTo,
    wearPink() {
      wearPinkDress(girl);
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      if (ro) ro.disconnect();
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("click", onClick);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      controls.dispose();
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          const list = Array.isArray(obj.material) ? obj.material : [obj.material];
          list.forEach((m) => {
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    }
  };
}

export function mountFinaleGirl(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.08, 20);
  camera.position.set(0.05, 0.82, 2.35);
  camera.lookAt(0, 0.72, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.shadowMap.enabled = true;
  renderer.domElement.style.position = "absolute";
  renderer.domElement.style.inset = "0";
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";
  container.appendChild(renderer.domElement);

  scene.add(new THREE.AmbientLight(0xffe8f0, 0.85));
  scene.add(new THREE.HemisphereLight(0xffe0ea, 0x2a1820, 0.7));
  const key = new THREE.DirectionalLight(0xfff5f8, 1.55);
  key.position.set(1.1, 2.8, 2.6);
  key.castShadow = true;
  scene.add(key);
  const fill = new THREE.PointLight(0xff9ec0, 1.35, 8);
  fill.position.set(-1.4, 1.1, 2.1);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffd0e8, 0.55);
  rim.position.set(-1.2, 1.4, -1.8);
  scene.add(rim);
  const env = makeStudioEnv(renderer);
  scene.environment = env;
  scene.environmentIntensity = 0.55;

  const twoD = container.querySelector(".hero-canvas");
  const girl = makeGirl({
    pink: true,
    onReady() {
      if (twoD) twoD.style.opacity = "0";
    }
  });
  girl.position.set(0, 0, 0);
  scene.add(girl);

  function resize() {
    const w = Math.max(container.clientWidth || 280, 1);
    const h = Math.max(container.clientHeight || 420, 1);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  resize();
  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();
  let raf = 0;
  function tick() {
    const t = clock.elapsedTime;
    poseGirl(girl, t, false, 0, camera);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  tick();
  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    renderer.dispose();
    renderer.domElement.remove();
  };
}
