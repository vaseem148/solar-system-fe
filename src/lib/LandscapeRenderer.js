// A hand-written WebGL landscape: misty mountain ranges in layers, pine forests,
// meadows under drifting cloud shadows, valley mist and a farmhouse with a solar
// roof — lit by a sun that rises as you scroll. One full-screen triangle, one
// fragment shader, no libraries (same shape as SunRenderer).

const VERT = /* glsl */ `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = /* glsl */ `
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform float uRise;   // 0 sun below the peaks … 1 sun well up
uniform float uMist;   // valley mist, 0 … 1
uniform float uCam;    // slow camera rise, 0 … 1
uniform vec2 uMouse;
uniform vec4 uSun;     // x, y (scene units, fully risen), radius, how far below it starts
uniform vec4 uFrame;   // horizon, vertical scale, house x, house size
uniform vec4 uFx;      // god rays, cloud shadows, sky clouds, detail
uniform vec3 uSkyTop;
uniform vec3 uSkyMid;
uniform vec3 uSkyLow;
uniform vec3 uSunCol;
uniform vec3 uFar;
uniform vec3 uNear;
uniform vec3 uMistCol;
uniform vec3 uLit;
uniform vec3 uShade;
uniform vec3 uForest;

// Scene units: y runs 0 (bottom) … 1 (top), x runs 0 … aspect.
float ASPECT; // width / height
float H;      // horizon line
float S;      // vertical scale of the terrain
float AA;     // one pixel, in scene units
vec2 SUN;     // where the sun is right now
float LIGHT;  // sunlight has reached everything above this height
vec3 MIST;    // mist, warmed near the sun

// Front-to-back compositing: acc/a hold what is already in front
#define BLEND(C, K) { float k_ = (1.0 - a) * (K); acc += k_ * (C); a += k_; }

// sin()-free hash (after Dave Hoskins): sin-based hashes lose precision on large inputs on some GPUs,
// which tears visible steps into the ridgelines
float h11(float n) {
  n = fract(n * 0.1031);
  n *= n + 33.33;
  n *= n + n;
  return fract(n);
}

float n11(float x) {
  float i = floor(x);
  float f = fract(x);
  return mix(h11(i), h11(i + 1.0), f * f * (3.0 - 2.0 * f));
}

float h21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float n21(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), u.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm1(float x) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    v += a * n11(x);
    x = x * 2.03 + 17.1;
    a *= 0.5;
  }
  return v;
}

// Sharp, craggy ridgelines for the far ranges
float ridged1(float x) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    float n = 1.0 - abs(n11(x) * 2.0 - 1.0);
    v += a * n * n;
    x = x * 2.07 + 31.7;
    a *= 0.48;
  }
  return v;
}

float fbm2(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 4; i++) {
    v += a * n21(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

// Ground lines, far to near
float g0(float x) { return H + S * (0.18 + 0.22 * ridged1(x * 1.05 + 11.0)); }
float g1(float x) { return H + S * (0.12 + 0.16 * ridged1(x * 1.55 + 37.0)); }
float g2(float x) { return H + S * (0.06 + 0.12 * fbm1(x * 2.1 + 71.0)); }
float g3(float x) { return H + S * (0.0 + 0.09 * fbm1(x * 2.7 + 113.0)); }
float g4(float x) { return H + S * (-0.08 + 0.1 * fbm1(x * 1.25 + 151.0)); }
float g5(float x) { return H + S * (-0.19 + 0.07 * fbm1(x * 1.8 + 191.0)); }
float g6(float x) {
  float hill = exp(-pow((x - ASPECT * 0.4) / 0.36, 2.0));
  return H + S * (-0.32 + 0.08 * fbm1(x * 0.75 + 233.0) + 0.11 * hill);
}

// How squarely a slope faces the sun, and whether the light has climbed down to it yet
float facing(float x, float G, float slope) {
  vec2 n = normalize(vec2(-slope, 1.0));
  vec2 l = normalize(SUN - vec2(x, G));
  return clamp(dot(n, l), 0.0, 1.0);
}

float reach(float y) {
  return smoothstep(LIGHT - 0.05 * S, LIGHT + 0.03 * S, y);
}

// Drifting cloud shadows over the meadows (screen space, so they slide across everything)
float cloudShade(vec2 p) {
  if (uFx.y <= 0.0) return 1.0;
  float n = fbm2(vec2(p.x * 1.5 - uTime * 0.018, p.y * 3.4 + uTime * 0.004));
  return 1.0 - uFx.y * 0.42 * smoothstep(0.46, 0.72, n);
}

// Pines (and the odd autumn broadleaf) standing on a ground line.
// q = (x, height above the ground). Returns coverage; id > 1 marks an autumn tree.
float trees(vec2 q, float cell, float hMin, float hMax, float density, float autumnShare, float seed, out float id, out float side) {
  float cov = 0.0;
  id = 0.0;
  side = 0.0;
  float i0 = floor(q.x / cell);
  for (int k = -1; k <= 1; k++) {
    float i = i0 + float(k);
    if (h11(i * 1.731 + seed) > density) continue;
    float c = (i + 0.5 + (h11(i * 2.917 + seed) - 0.5) * 0.8) * cell;
    float h = mix(hMin, hMax, h11(i * 4.13 + seed));
    if (q.y < -h * 0.2 || q.y > h) continue;
    float lean = sin(uTime * 1.2 + i * 1.7) * 0.035 * max(q.y, 0.0);
    float dx = q.x - c - lean;
    float autumn = step(1.0 - autumnShare, h11(i * 7.31 + seed));
    float d;
    if (autumn > 0.5) {
      vec2 e = vec2(dx / (h * 0.34), (q.y - h * 0.58) / (h * 0.42));
      d = (1.0 - length(e) + (n21(e * 2.6 + i) - 0.5) * 0.45) * h * 0.3;
    } else {
      float t = clamp(q.y / h, 0.0, 1.0);
      float tier = fract(t * 4.0 + 0.25);
      d = h * 0.3 * (1.0 - t) * (0.68 + 0.32 * (1.0 - tier)) - abs(dx);
    }
    float c1 = smoothstep(-AA, AA, d);
    if (c1 > cov) {
      cov = c1;
      id = autumn + 0.1 + h11(i * 9.7 + seed) * 0.8;
      side = clamp(dx / (h * 0.3), -1.0, 1.0);
    }
  }
  return cov;
}

vec3 treeCol(float id, float side, float light) {
  vec3 c = uForest * (0.8 + 0.4 * fract(id));
  if (id > 1.0) c = mix(vec3(0.72, 0.45, 0.17), vec3(0.82, 0.64, 0.25), fract(id));
  float lit = clamp(0.5 + 0.5 * side * (SUN.x > ASPECT * 0.5 ? 1.0 : -1.0), 0.0, 1.0);
  return c * (0.78 + 0.5 * lit * light) + uSunCol * 0.06 * lit * light;
}

// A mountain face as a 2D field of rock and gullies, lit by embossing it toward the sun
vec3 mountainCol(float z, float x, float y, float G, float slope) {
  float below = max(G - y, 0.0) / S;
  vec3 c = mix(uFar, uNear, z);
  float sunSide = SUN.x > ASPECT * 0.5 ? 1.0 : -1.0;
  vec2 q = vec2(x * 5.0 + below * 3.0, below * 13.0 + z * 9.0);
  float f0 = fbm2(q);
  float f1 = fbm2(q + vec2(0.09 * sunSide, 0.05));
  float relief = clamp((f0 - f1) * 7.0 + 0.5, 0.0, 1.0);
  // crests facing the sun catch the most light; it fades down the face
  float crest = facing(x, G, slope) * exp(-below / 0.05);
  float lit = clamp(relief * 0.75 + crest * 0.6, 0.0, 1.0) * reach(G - below * S * 0.6);
  c *= 0.82 + 0.3 * relief;
  c = mix(c, c * 1.12 + uSunCol * 0.22, lit * 0.8);
  float fog = smoothstep(0.0, mix(0.15, 0.08, z), below);
  return mix(c, MIST, fog * mix(0.92, 0.6, z) * (0.35 + 0.65 * uMist));
}

vec3 meadowCol(float z, vec2 p, float x, float y, float G, float slope) {
  float below = max(G - y, 0.0) / S;
  float sunSide = SUN.x > ASPECT * 0.5 ? 1.0 : -1.0;
  vec2 q = vec2(x * 2.4, below * 7.0 + z * 5.0);
  float f0 = fbm2(q);
  float f1 = fbm2(q + vec2(0.07 * sunSide, 0.04));
  float roll = clamp((f0 - f1) * 5.5 + 0.55, 0.0, 1.0);
  float crest = facing(x, G, slope * 1.4) * exp(-below / 0.035);
  float light = clamp(roll * 0.8 + crest * 0.45 + 0.1, 0.0, 1.0) * reach(y) * cloudShade(p);
  vec3 c = mix(uShade, uLit, light);
  c *= 0.97 + 0.08 * n21(vec2(x * 140.0, y * 260.0));
  return c;
}

vec3 canopyCol(vec2 p, float x, float y, float light, float autumn) {
  float t = fbm2(vec2(x * 48.0, y * 36.0)) * 0.75 + n21(vec2(x * 130.0, y * 95.0)) * 0.25;
  vec3 c = uForest * (0.68 + 0.62 * t);
  // a few autumn crowns scattered through the forest
  float au = smoothstep(0.64, 0.74, fbm2(vec2(x * 18.0 + 7.0, y * 15.0))) * autumn;
  c = mix(c, mix(vec3(0.62, 0.4, 0.16), vec3(0.76, 0.58, 0.24), t), au * 0.5);
  return mix(c * 0.85, c * 1.3, light * cloudShade(p));
}

// Farmhouse with a solar roof. q is in house units (1 = house width), origin on the ground below its centre.
// Returns colour in rgb and coverage in a.
vec4 house(vec2 q) {
  float aa = AA / uFrame.w;
  // walls (sunk a little so a sloping meadow never shows a gap)
  vec2 wb = abs(q - vec2(0.0, 0.14)) - vec2(0.5, 0.26);
  float walls = -max(wb.x, wb.y);
  // hip roof seen side-on: a trapezoid
  float ry = (q.y - 0.38) / 0.34;
  float rw = mix(0.64, 0.4, clamp(ry, 0.0, 1.0));
  float roof = min(min(q.y - 0.38, 0.72 - q.y), rw - abs(q.x));
  float cw = smoothstep(-aa, aa, walls);
  float cr = smoothstep(-aa, aa, roof);
  float cov = max(cw, cr);
  if (cov <= 0.0) return vec4(0.0);

  vec3 wall = vec3(0.93, 0.88, 0.8) * (0.86 + 0.14 * smoothstep(-0.5, 0.5, q.x));
  // windows and a door
  vec2 w1 = abs(q - vec2(-0.27, 0.22)) - vec2(0.08, 0.07);
  vec2 w2 = abs(q - vec2(0.27, 0.22)) - vec2(0.08, 0.07);
  vec2 dr = abs(q - vec2(0.02, 0.1)) - vec2(0.07, 0.12);
  float win = smoothstep(aa, -aa, min(max(w1.x, w1.y), max(w2.x, w2.y)));
  float door = smoothstep(aa, -aa, max(dr.x, dr.y));
  wall = mix(wall, vec3(0.2, 0.26, 0.3), win);
  wall = mix(wall, vec3(0.42, 0.27, 0.17), door);

  // roof: tiles around a grid of solar panels that catches a travelling glint
  vec3 rc = vec3(0.36, 0.25, 0.22);
  float py = (q.y - 0.43) / 0.25;
  float pw = rw - 0.08;
  float panel = step(0.0, py) * step(py, 1.0) * step(abs(q.x), pw);
  if (panel > 0.0) {
    vec2 g = vec2(q.x / 0.112, py * 2.0);
    vec2 f = abs(fract(g) - 0.5);
    float line = smoothstep(0.44, 0.49, max(f.x, f.y));
    vec3 pc = mix(vec3(0.09, 0.16, 0.3), vec3(0.24, 0.38, 0.58), py);
    float sweep = exp(-pow((q.x * 0.8 + py * 0.5 - mod(uTime * 0.32, 3.2) + 1.2) * 5.0, 2.0));
    pc += uSunCol * sweep * 0.9 * reach(0.0) + vec3(0.06) * (1.0 - py);
    rc = mix(pc, vec3(0.75, 0.8, 0.85), line * 0.7);
  }
  vec3 col = cr > cw ? rc : wall;
  return vec4(col, cov);
}

// Two layers of slowly turning angular noise, like SunRenderer's shafts
float rays(vec2 d, float t) {
  float an = atan(d.y, d.x);
  vec2 a = vec2(cos(an), sin(an));
  float n = n21(a * 4.0 + vec2(t * 0.02, 3.7)) * 0.6 + n21(a * 11.0 + vec2(-t * 0.015, 9.1)) * 0.4;
  return smoothstep(0.45, 0.85, n);
}

void main() {
  vec2 p = gl_FragCoord.xy / uRes.y;
  ASPECT = uRes.x / uRes.y;
  H = uFrame.x;
  S = uFrame.y;
  AA = 1.3 / uRes.y;
  SUN = vec2(uSun.x, uSun.y - (1.0 - uRise) * uSun.w);
  LIGHT = mix(H + 0.85 * S, H - 0.65 * S, smoothstep(0.05, 0.95, uRise));
  float sunD = length(p - SUN);
  MIST = mix(uMistCol, uSunCol, exp(-sunD * 2.4) * 0.5);

  vec3 acc = vec3(0.0);
  float a = 0.0;
  float id;
  float side;
  vec2 par = uMouse * vec2(0.022, 0.012);
  float e = 0.004;

  // Each layer is skipped outright above the highest point it can reach (fbm1 < 0.97, ridged1 < 0.94),
  // so the sky and the far ranges stay cheap.

  // ── Foreground meadow, the lone tree, the farmhouse and a few big pines at the edges ──
  {
    float z = 1.0;
    float x = p.x + par.x * z;
    float y = p.y + (uCam * 0.14 - par.y) * z;
    if (y < H + 0.13 * S) {
      float G = g6(x);
      float hx = uFrame.z;
      float w = uFrame.w;
      float lx = ASPECT * 0.4;
      float gl = abs(x - lx) < 0.3 * S ? g6(lx) : 0.0;
      float gh = w > 0.0 && abs(x - hx) < 2.8 * w ? g6(hx) : 0.0;

      if (abs(x - lx) < 0.12 * S && y > gl - 0.02 * S && y < gl + 0.19 * S) {
        float ls = 0.16 * S;
        vec2 lq = vec2(x - lx, y - gl) / ls;
        float sway = sin(uTime * 0.9) * 0.025 * lq.y;
        vec2 ce = vec2((lq.x - sway) / 0.3, (lq.y - 0.62) / 0.36);
        float crown = 1.0 - length(ce) + (fbm2(ce * 2.2 + 4.0) - 0.5) * 0.5;
        float trunk = step(abs(lq.x + 0.01 * lq.y), 0.028 - lq.y * 0.02) * step(-0.05, lq.y) * step(lq.y, 0.42);
        float leaf = fbm2(lq * 9.0 + 2.0);
        float lit = clamp(0.4 + 0.55 * (lq.x - sway) * (SUN.x > ASPECT * 0.5 ? 1.0 : -1.0) + 0.35 * ce.y, 0.0, 1.0) * (0.35 + 0.65 * reach(y));
        vec3 lc = mix(vec3(0.6, 0.45, 0.12), vec3(0.98, 0.84, 0.32), lit) * (0.82 + 0.36 * leaf);
        if (crown > 0.0) BLEND(lc, smoothstep(0.0, 0.05, crown));
        if (trunk > 0.0) BLEND(vec3(0.24, 0.17, 0.11), trunk);
      }
      if (w > 0.0 && abs(x - hx) < 1.6 * w && y < gh + 1.2 * w) {
        vec4 hs = house(vec2(x - hx, y - gh) / w);
        if (hs.a > 0.0) BLEND(hs.rgb, hs.a);
        // autumn tree beside it
        float tx = hx + w * 0.95;
        if (abs(x - tx) < 0.45 * w) {
          vec2 tq = vec2(x - tx, y - g6(tx)) / w;
          float sway = sin(uTime * 1.1) * 0.02 * tq.y;
          vec2 ce = vec2((tq.x - sway) / 0.32, (tq.y - 0.62) / 0.4);
          float crown = 1.0 - length(ce) + (fbm2(ce * 2.4 + 9.0) - 0.5) * 0.45;
          float trunk = step(abs(tq.x), 0.035) * step(0.0, tq.y) * step(tq.y, 0.4);
          vec3 tc = mix(vec3(0.66, 0.34, 0.12), vec3(0.9, 0.62, 0.22), fbm2(tq * 8.0 + 3.0) * 0.6 + clamp(ce.y, 0.0, 1.0) * 0.4) * (0.78 + 0.32 * reach(y));
          if (crown > 0.0) BLEND(tc, smoothstep(-0.02, 0.02, crown));
          if (trunk > 0.0) BLEND(vec3(0.27, 0.18, 0.12), trunk);
        }
      }
      float edge = smoothstep(0.07, 0.0, x) + smoothstep(ASPECT - 0.16, ASPECT + 0.02, x);
      if (edge > 0.01 && a < 0.996) {
        float tc = trees(vec2(x, y - G), 0.05 * S, 0.13 * S, 0.24 * S, 0.95 * edge, 0.0, 41.0, id, side);
        if (tc > 0.0) BLEND(treeCol(id, side, 0.5 * reach(y)), tc);
      }
      float cov = smoothstep(-AA, AA, G - y);
      if (cov > 0.0 && a < 0.996) {
        float slope = (g6(x + e) - g6(x - e)) / (2.0 * e);
        vec3 c = meadowCol(z, p, x, y, G, slope);
        // the lone tree and the house throw soft shadows away from the sun
        if (abs(x - lx) < 0.3 * S) {
          vec2 sq = (vec2(x, y) - vec2(lx - 0.09 * S, gl - 0.008)) / (0.16 * S);
          c *= 1.0 - 0.3 * exp(-dot(sq * vec2(1.6, 6.0), sq * vec2(1.6, 6.0))) * reach(y);
        }
        if (w > 0.0 && abs(x - hx) < 2.8 * w) {
          vec2 sq = (vec2(x, y) - vec2(hx - w * 0.55, gh)) / w;
          c *= 1.0 - 0.35 * exp(-dot(sq * vec2(1.1, 5.0), sq * vec2(1.1, 5.0))) * reach(y);
        }
        BLEND(c, cov);
      }
    }
  }

  // ── Near forest ──
  if (a < 0.996) {
    float z = 0.84;
    float x = p.x + par.x * z;
    float y = p.y + (uCam * 0.14 - par.y) * z;
    if (y < H - 0.06 * S) {
      float fm = smoothstep(0.3, 0.62, n11(x * 1.5 + 2.0));
      float G = g5(x) - (1.0 - fm) * 0.3 * S;
      float light = reach(y) * 0.6;
      float tc = trees(vec2(x, y - G), 0.017 * S, 0.035 * S, 0.06 * S, 0.92 * smoothstep(0.25, 0.6, fm), 0.05, 7.0, id, side);
      if (tc > 0.0) BLEND(treeCol(id, side, light), tc);
      float cov = smoothstep(-AA, AA, G - y);
      if (cov > 0.0) BLEND(canopyCol(p, x, y, light, 1.0), cov);
    }
  }

  // ── Low valley mist, drifting ──
  if (a < 0.996 && uFx.z > 0.0 && abs(p.y - (H - 0.12 * S)) < 0.2 * S) {
    float band = exp(-pow((p.y - (H - 0.12 * S)) / (0.09 * S), 2.0));
    float n = fbm2(vec2(p.x * 1.6 + uTime * 0.012, p.y * 7.0 - uTime * 0.004));
    BLEND(MIST, band * (0.25 + 0.75 * smoothstep(0.3, 0.75, n)) * 0.8 * uMist);
  }

  // ── Meadow hills with forest on some of the crests ──
  if (a < 0.996) {
    float z = 0.66;
    float x = p.x + par.x * z;
    float y = p.y + (uCam * 0.14 - par.y) * z;
    if (y < H + 0.05 * S) {
      float G = g4(x);
      float fm = smoothstep(0.42, 0.7, n11(x * 1.3 + 5.0));
      if (fm > 0.0) {
        float tc = trees(vec2(x, y - G), 0.011 * S, 0.016 * S, 0.028 * S, 0.95 * fm, 0.04, 13.0, id, side);
        if (tc > 0.0) BLEND(mix(treeCol(id, side, reach(y) * 0.6), MIST, 0.16), tc);
      }
      float cov = smoothstep(-AA, AA, G - y);
      if (cov > 0.0 && a < 0.996) {
        float slope = (g4(x + e) - g4(x - e)) / (2.0 * e);
        vec3 c = meadowCol(z, p, x, y, G, slope);
        float depth = 0.055 * S * fm * (0.75 + 0.35 * fbm1(x * 60.0 + 3.0));
        if (G - y < depth) c = canopyCol(p, x, y, reach(y) * 0.5, 0.6);
        c = mix(c, MIST, 0.12 + 0.18 * smoothstep(0.0, 0.12 * S, G - y) * uMist);
        BLEND(c, cov);
      }
    }
  }

  // ── Forested hills, already hazy ──
  if (a < 0.996) {
    float z = 0.5;
    float x = p.x + par.x * z;
    float y = p.y + (uCam * 0.14 - par.y) * z;
    if (y < H + 0.11 * S) {
      float G = g3(x);
      float tc = trees(vec2(x, y - G), 0.007 * S, 0.009 * S, 0.016 * S, 0.9, 0.0, 23.0, id, side);
      float cov = max(smoothstep(-AA, AA, G - y), tc);
      if (cov > 0.0) {
        float slope = (g3(x + e) - g3(x - e)) / (2.0 * e);
        vec3 c = mix(canopyCol(p, x, y, facing(x, G, slope) * reach(G) * 0.6, 0.0), mountainCol(z, x, y, G, slope), 0.45);
        BLEND(c, cov);
      }
    }
  }

  // ── Mid mist ──
  if (a < 0.996 && uFx.z > 0.0 && abs(p.y - (H + 0.06 * S)) < 0.22 * S) {
    float band = exp(-pow((p.y - (H + 0.06 * S)) / (0.1 * S), 2.0));
    float n = fbm2(vec2(p.x * 1.1 - uTime * 0.008, p.y * 5.0 + 4.0));
    BLEND(MIST, band * (0.3 + 0.7 * smoothstep(0.35, 0.8, n)) * 0.7 * uMist);
  }

  // ── Mountain ranges ──
  if (a < 0.996) {
    float z = 0.36;
    float x = p.x + par.x * z;
    float y = p.y + (uCam * 0.14 - par.y) * z;
    if (y < H + 0.18 * S) {
      float G = g2(x);
      float cov = smoothstep(-AA, AA, G - y);
      if (cov > 0.0) BLEND(mountainCol(z, x, y, G, (g2(x + e) - g2(x - e)) / (2.0 * e)), cov);
    }
  }
  if (a < 0.996) {
    float z = 0.18;
    float x = p.x + par.x * z;
    float y = p.y + (uCam * 0.14 - par.y) * z;
    if (y < H + 0.28 * S) {
      float G = g1(x);
      float cov = smoothstep(-AA, AA, G - y);
      if (cov > 0.0) BLEND(mountainCol(z, x, y, G, (g1(x + e) - g1(x - e)) / (2.0 * e)), cov);
    }
  }
  if (a < 0.996 && uFx.z > 0.0 && abs(p.y - (H + 0.2 * S)) < 0.2 * S) {
    float band = exp(-pow((p.y - (H + 0.2 * S)) / (0.09 * S), 2.0));
    float n = fbm2(vec2(p.x * 0.9 + uTime * 0.005 + 9.0, p.y * 4.0));
    BLEND(MIST, band * (0.35 + 0.65 * smoothstep(0.3, 0.8, n)) * 0.55 * uMist);
  }
  float aLand = a;
  if (a < 0.996) {
    float z = 0.0;
    float x = p.x + par.x * 0.06;
    float y = p.y + uCam * 0.03;
    if (y < H + 0.39 * S) {
      float G = g0(x);
      float cov = smoothstep(-AA, AA, G - y);
      if (cov > 0.0) BLEND(mountainCol(z, x, y, G, (g0(x + e) - g0(x - e)) / (2.0 * e)), cov);
    }
  }

  // ── Sky: gradient, soft clouds, the sun ──
  float t = clamp((p.y - H) / max(1.0 - H, 0.1), 0.0, 1.0);
  vec3 sky = mix(uSkyLow, uSkyMid, smoothstep(0.0, 0.45, t));
  sky = mix(sky, uSkyTop, smoothstep(0.35, 1.0, t));
  if (uFx.z > 0.0 && p.y > H + 0.25 * S) {
    float cl = fbm2(vec2(p.x * 0.8 - uTime * 0.006, p.y * 3.4 + 1.3));
    float cm = smoothstep(0.55, 0.82, cl) * smoothstep(H + 0.25 * S, H + 0.55 * S, p.y);
    sky = mix(sky, mix(vec3(1.0), uSunCol, 0.25 + 0.4 * exp(-sunD * 1.5)), cm * 0.55);
  }
  float r = uSun.z;
  float o = max(sunD - r, 0.0);
  sky += uSunCol * (exp(-o * 2.0) * 0.32 + exp(-o * 9.0) * 0.55);
  sky = mix(sky, mix(vec3(1.0, 0.98, 0.92), uSunCol, 0.15), smoothstep(r + AA, r - AA, sunD));
  vec3 col = acc + (1.0 - a) * sky;

  // Light scattered through the haze, strongest over the far ranges and in the sky
  float scatter = exp(-o * 1.7) * (1.0 - aLand * 0.75);
  float sh = uFx.x > 0.0 ? rays(p - SUN, uTime) : 0.5;
  vec3 light = uSunCol * scatter * (0.22 + 0.3 * sh * uFx.x) * smoothstep(0.0, 0.25, uRise);
  col = 1.0 - (1.0 - col) * exp(-light);

  // Gentle vignette, then dither away banding
  vec2 uv = gl_FragCoord.xy / uRes - 0.5;
  col *= 1.0 - 0.18 * dot(uv, uv);
  col += (h21(gl_FragCoord.xy + fract(uTime * 7.13) * 91.0) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)

// Dawn eases into a clear morning as `state.day` goes 0 → 1
const DAWN = {
  uSkyTop: '#8a9fcd',
  uSkyMid: '#d9c2d3',
  uSkyLow: '#f8c493',
  uSunCol: '#ff9d52',
  uFar: '#bba9c8',
  uNear: '#566b98',
  uMistCol: '#f1dcd6',
  uLit: '#dac65a',
  uShade: '#5c7869',
  uForest: '#22403e',
}
const DAY = {
  uSkyTop: '#74acdc',
  uSkyMid: '#b6d8ee',
  uSkyLow: '#eaf3f1',
  uSunCol: '#fff0c4',
  uFar: '#b9d0e3',
  uNear: '#3b6983',
  uMistCol: '#e4f0f4',
  uLit: '#bdd84c',
  uShade: '#4a7a47',
  uForest: '#1e3d30',
}
const PAL = Object.fromEntries(Object.keys(DAWN).map((k) => [k, [hex(DAWN[k]), hex(DAY[k])]]))

const UNIFORMS = ['uRes', 'uTime', 'uRise', 'uMist', 'uCam', 'uMouse', 'uSun', 'uFrame', 'uFx', ...Object.keys(DAWN)]

export class LandscapeRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ layout: (w: number, h: number) => { horizon: number, scale: number, sun: [number, number, number, number],
   *            house: [number, number] }, state: { rise: number, day: number, mist: number, cam: number } }} options
   *   layout() works in scene units: y 0 (bottom) … 1 (top), x 0 … width / height.
   */
  constructor(canvas, { layout, state }) {
    const gl = canvas.getContext('webgl', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    })
    if (!gl) throw new Error('WebGL unavailable')

    this.canvas = canvas
    this.gl = gl
    this.layout = layout
    this.state = state
    this.quality = window.devicePixelRatio > 1 ? 0.5 : 0.75
    // 2 = rays + cloud shadows + mist, 1 = mist only, 0 = bare landscape (slow devices)
    this.fxLevel = 2
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0 }
    this.running = false
    this.t0 = performance.now()
    this.slowFrames = 0
    this.last = 0

    const program = this.#program(VERT, FRAG)
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    this.u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)]))

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      this.onPointer = (e) => {
        this.mouse.tx = (e.clientX / window.innerWidth) * 2 - 1
        this.mouse.ty = (e.clientY / window.innerHeight) * 2 - 1
      }
      window.addEventListener('pointermove', this.onPointer, { passive: true })
    }

    this.resize()
  }

  #program(vs, fs) {
    const gl = this.gl
    const compile = (type, src) => {
      const s = gl.createShader(type)
      gl.shaderSource(s, src)
      gl.compileShader(s)
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader')
      return s
    }
    const p = gl.createProgram()
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs))
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs))
    gl.linkProgram(p)
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? 'link')
    return p
  }

  resize() {
    const w = this.canvas.clientWidth || 1
    const h = this.canvas.clientHeight || 1
    const scale = Math.min(window.devicePixelRatio || 1, 2) * this.quality
    this.w = w
    this.h = h
    this.canvas.width = Math.max(1, Math.round(w * scale))
    this.canvas.height = Math.max(1, Math.round(h * scale))
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    if (!this.running) this.draw(performance.now())
  }

  draw(now) {
    const { gl, u, state, mouse } = this
    mouse.x += (mouse.tx - mouse.x) * 0.04
    mouse.y += (mouse.ty - mouse.y) * 0.04

    const L = this.layout(this.w, this.h)
    const day = Math.min(1, Math.max(0, state.day))
    for (const k in PAL) {
      const [a, b] = PAL[k]
      gl.uniform3f(u[k], a[0] + (b[0] - a[0]) * day, a[1] + (b[1] - a[1]) * day, a[2] + (b[2] - a[2]) * day)
    }
    const fx = this.fxLevel
    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height)
    gl.uniform1f(u.uTime, (now - this.t0) / 1000)
    gl.uniform1f(u.uRise, state.rise)
    gl.uniform1f(u.uMist, state.mist)
    gl.uniform1f(u.uCam, state.cam)
    gl.uniform2f(u.uMouse, mouse.x, -mouse.y)
    gl.uniform4f(u.uSun, ...L.sun)
    gl.uniform4f(u.uFrame, L.horizon, L.scale, ...L.house)
    gl.uniform4f(u.uFx, fx > 1 ? 1 : 0, fx > 1 ? 1 : 0, fx > 0 ? 1 : 0, 0)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  loop = (now) => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.loop)

    // Adaptive quality: drop resolution first, then the atmospheric extras
    if (this.last) {
      const dt = now - this.last
      this.slowFrames = dt > 34 ? this.slowFrames + 1 : Math.max(0, this.slowFrames - 1)
      if (this.slowFrames > 40) {
        this.slowFrames = 0
        if (this.quality > 0.4) {
          this.quality = Math.max(0.4, this.quality - 0.15)
          this.resize()
        } else if (this.fxLevel > 0) {
          this.fxLevel -= 1
        }
      }
    }
    this.last = now
    this.draw(now)
  }

  play() {
    if (this.running) return
    this.running = true
    this.last = 0
    this.raf = requestAnimationFrame(this.loop)
  }

  pause() {
    this.running = false
    cancelAnimationFrame(this.raf)
  }

  destroy() {
    this.pause()
    if (this.onPointer) window.removeEventListener('pointermove', this.onPointer)
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}
