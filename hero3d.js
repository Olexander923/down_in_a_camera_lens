import * as THREE from "three";

const loader = new THREE.TextureLoader();
const SEG_X = 18;
const SEG_Y = 32;
const BODY_H = 1.32;

function loadTex(src) {
  return new Promise((resolve, reject) => {
    loader.load(src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = 8;
      tex.premultiplyAlpha = true;
      tex.needsUpdate = true;
      resolve(tex);
    }, undefined, reject);
  });
}

function chromaMaterial(map) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: map },
      uW: { value: 0.42 },
      uH: { value: BODY_H },
      uThighF: { value: 0 },
      uShinF: { value: 0 },
      uThighB: { value: 0 },
      uShinB: { value: 0 }
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    vertexShader: `
      uniform float uW;
      uniform float uH;
      uniform float uThighF;
      uniform float uShinF;
      uniform float uThighB;
      uniform float uShinB;
      varying vec2 vUv;

      vec2 rotAt(vec2 p, vec2 o, float a) {
        float c = cos(a);
        float s = sin(a);
        vec2 d = p - o;
        return o + vec2(d.x * c - d.y * s, d.x * s + d.y * c);
      }

      vec2 joint(float ux, float uy) {
        return vec2((ux - 0.5) * uW, (uy - 0.5) * uH);
      }

      void main() {
        vUv = uv;
        vec3 p = position;

        float front = 1.0 - smoothstep(0.50, 0.64, uv.x);
        float back = smoothstep(0.46, 0.60, uv.x);
        float belowHip = 1.0 - smoothstep(0.50, 0.58, uv.y);
        float belowKnee = 1.0 - smoothstep(0.27, 0.34, uv.y);

        vec2 hipF = joint(0.40, 0.51);
        vec2 kneeF0 = joint(0.33, 0.29);
        vec2 hipB = joint(0.55, 0.51);
        vec2 kneeB0 = joint(0.62, 0.30);

        float fChain = front * belowHip;
        p.xy = mix(p.xy, rotAt(p.xy, hipF, uThighF), fChain);
        vec2 kneeF = rotAt(kneeF0, hipF, uThighF);
        p.xy = mix(p.xy, rotAt(p.xy, kneeF, uShinF), front * belowKnee);

        float bChain = back * belowHip;
        p.xy = mix(p.xy, rotAt(p.xy, hipB, uThighB), bChain);
        vec2 kneeB = rotAt(kneeB0, hipB, uThighB);
        p.xy = mix(p.xy, rotAt(p.xy, kneeB, uShinB), back * belowKnee);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      varying vec2 vUv;
      void main() {
        vec4 c = texture2D(map, vUv);
        float rb = max(c.r, c.b);
        float chroma = smoothstep(0.10, 0.28, c.g - rb);
        float a = c.a * (1.0 - chroma);
        if (a < 0.12) discard;
        c.g = mix(c.g, rb, chroma);
        gl_FragColor = vec4(c.rgb, a);
      }
    `
  });
}

function fitPlane(sprite, w, h, height) {
  if (!w || !h) return;
  const pw = height * (w / h);
  sprite.geometry.dispose();
  sprite.geometry = new THREE.PlaneGeometry(pw, height, SEG_X, SEG_Y);
  const u = sprite.material.uniforms;
  if (u && u.uW) {
    u.uW.value = pw;
    u.uH.value = height;
  }
}

function setBend(mat, thighF, shinF, thighB, shinB) {
  const u = mat.uniforms;
  if (!u || !u.uThighF) return;
  u.uThighF.value = thighF;
  u.uShinF.value = shinF;
  u.uThighB.value = thighB;
  u.uShinB.value = shinB;
}

export function makeGirl(opts = {}) {
  const root = new THREE.Group();
  const placeholder = new THREE.CanvasTexture(document.createElement("canvas"));
  const sprite = new THREE.Mesh(
    new THREE.PlaneGeometry(0.42, BODY_H, SEG_X, SEG_Y),
    chromaMaterial(placeholder)
  );
  sprite.position.y = 0.66;
  sprite.visible = false;
  root.add(sprite);

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.16, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.34, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  root.add(shadow);
  root.scale.setScalar(1.42);

  root.userData.rig = {
    sprite,
    idleTex: null,
    contactTex: null,
    passTex: null,
    yaw: 0,
    facing: 1,
    walking: false
  };

  Promise.all([
    loadTex("./photos/heroine-idle.png"),
    loadTex("./photos/heroine-walk.jpg"),
    loadTex("./photos/heroine-walk-pass.jpg")
  ]).then(([idleTex, contactTex, passTex]) => {
    const r = root.userData.rig;
    r.idleTex = idleTex;
    r.contactTex = contactTex;
    r.passTex = passTex;
    sprite.material.uniforms.map.value = idleTex;
    fitPlane(sprite, idleTex.image.width, idleTex.image.height, BODY_H);
    sprite.visible = true;
    if (opts.onReady) opts.onReady();
  }).catch(() => {
    if (opts.onReady) opts.onReady();
  });

  return root;
}

export function wearPinkDress() {}

export function poseGirl(root, t, walking, walkT, camera, faceYaw) {
  const r = root.userData.rig;
  if (!r || !r.sprite) return;
  const breath = Math.sin(t * 2.05);
  const mat = r.sprite.material;

  if (walking && r.contactTex) {
    if (!r.walking) {
      r.walking = true;
      const img = r.contactTex.image;
      fitPlane(r.sprite, img.width, img.height, BODY_H);
    }
    const g = t * 7.4;
    const swing = Math.sin(g);
    const pass = 0.5 - 0.5 * Math.cos(g);
    mat.uniforms.map.value = pass > 0.55 && r.passTex ? r.passTex : r.contactTex;
    const paintedBend = pass > 0.55 ? 0.18 : 1;
    setBend(
      mat,
      swing * 0.28,
      (0.25 + pass * 0.85) * paintedBend,
      -swing * 0.22,
      (0.2 + (1 - pass) * 0.7) * paintedBend
    );
    r.sprite.position.y = 0.66 + (1 - Math.cos(g * 2)) * 0.018;
    r.sprite.rotation.z = swing * 0.03;
    r.sprite.scale.set(r.facing, 1, 1);
  } else if (r.idleTex) {
    if (r.walking || mat.uniforms.map.value !== r.idleTex) {
      mat.uniforms.map.value = r.idleTex;
      fitPlane(r.sprite, r.idleTex.image.width, r.idleTex.image.height, BODY_H);
    }
    r.walking = false;
    setBend(mat, 0, 0, 0, 0);
    r.sprite.position.y = 0.66 + breath * 0.01;
    r.sprite.rotation.z = breath * 0.01;
    r.sprite.scale.set(1, 1 + breath * 0.01, 1);
  }

  if (walking && Number.isFinite(faceYaw)) {
    r.facing = Math.sin(faceYaw) >= 0 ? -1 : 1;
  } else {
    r.facing = 1;
  }
  let want = r.yaw;
  if (camera) {
    want = Math.atan2(camera.position.x - root.position.x, camera.position.z - root.position.z);
  }
  let d = want - r.yaw;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  r.yaw += d * (walking ? 0.22 : 0.12);
  root.rotation.y = r.yaw;
}
