// A hand-written WebGL sun: boiling surface, limb darkening, drifting
// corona streaks, slow volumetric light shafts through a drifting haze,
// sun-lit dust motes, faint lens ghosts and filmic tone mapping.
// One full-screen triangle, one fragment shader, no libraries.

import { createProgram } from './glProgram'

const VERT = /* glsl */ `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`

const FRAG = /* glsl */ `
precision highp float;

uniform vec2 uRes;
uniform vec2 uSun;
uniform float uR;
uniform float uAA;
uniform float uTime;
uniform float uHeat;
uniform float uGlow;
uniform float uPx;
uniform vec2 uMouse;
uniform vec4 uFx;
uniform vec3 uC0;
uniform vec3 uC1;
uniform vec3 uC2;
uniform vec3 uC3;
uniform vec3 uTop;
uniform vec3 uBot;
uniform float uHaze;

float hash(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

vec2 rot(vec2 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * v.x - s * v.y, s * v.x + c * v.y);
}

// Light shafts: angular noise sampled on the unit circle (no seam), two layers
// turning slowly in opposite directions so the rays shear through each other.
float shafts(vec2 dir, float t) {
  vec2 a = rot(dir, t * 0.016);
  vec2 b = rot(dir, 1.7 - t * 0.0105);
  float n = noise(a * 5.0 + 3.7) * 0.62 + noise(a * 13.0 + 9.1) * 0.38;
  float m = noise(b * 8.5 + 21.3);
  return smoothstep(0.42, 0.9, n) + 0.55 * smoothstep(0.52, 0.94, m);
}

// Sparse dust: at most one mote per grid cell. q is in CSS pixels; the id is
// wrapped so the upward drift can loop without a visible jump.
float motes(vec2 q, float cell, float density, float rMin, float rMax, float seed, float t) {
  vec2 g = q / cell;
  vec2 id = mod(floor(g), 64.0);
  float h = hash(id + seed);
  if (h > density) return 0.0;
  float h2 = hash(id + seed + 17.31);
  float h3 = hash(id + seed + 41.97);
  vec2 c = vec2(h2, h3) * 0.5 - 0.25;
  c.x += sin(t * (0.3 + h2 * 0.6) + h3 * 6.2831) * 0.1;
  float r = mix(rMin, rMax, h3 * h3);
  float dd = length(fract(g) - 0.5 - c) * cell;
  float core = 1.0 - smoothstep(r * 0.2, r + 0.7, dd);
  float soft = 1.0 - smoothstep(0.0, r * 4.5 + 2.0, dd);
  float tw = 0.5 + 0.5 * sin(t * (0.6 + h2 * 2.1) + h * 91.0);
  return (core + soft * soft * 0.22) * (0.25 + 0.75 * tw * tw);
}

// One soft lens ghost: a faint disc with a slightly brighter rim.
float ghost(vec2 frag, vec2 c, float r) {
  float d = length(frag - c) / r;
  float disc = 1.0 - smoothstep(0.78, 1.0, d);
  return disc * (0.35 + 0.65 * smoothstep(0.35, 0.95, d));
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 uv = frag / uRes;
  vec2 q = frag / uPx;
  vec2 p = (frag - uSun) / uR;
  float d = length(p);
  vec2 dir = p / max(d, 1e-4);
  float t = uTime;
  float heat = uHeat * (1.0 + uGlow * 0.25);

  // Sky
  vec3 col = mix(uBot, uTop, smoothstep(0.0, 0.9, uv.y));

  // Light falloff outside the disc
  float o = max(d - 1.0, 0.0);
  float glow = exp(-o * (3.4 - uGlow * 0.7));

  if (d > 1.0 - uAA) {
    float halo = exp(-o * (1.05 - uGlow * 0.25));
    float rim = exp(-o * 15.0);

    // Corona streaks, sampled on the unit circle so there is no seam
    float s1 = fbm(dir * 2.6 + vec2(o * 0.55 - t * 0.045, o * 0.3) + uMouse * 0.22);
    float s2 = fbm(dir * 7.0 + vec2(o * 1.3 - t * 0.08, -o * 0.4) + 11.0);
    float streak = pow(clamp(s1 * 0.7 + s2 * 0.5, 0.0, 1.4), 2.4);

    // Volumetric shafts: the outer halo is carved into slowly turning rays,
    // and the rays only light up where the drifting haze catches them
    float sh = 0.5;
    float vol = 0.6;
    if (uFx.x > 0.0) {
      float hz = noise(q * 0.0032 + vec2(t * 0.011, -t * 0.019)) * 0.6
               + noise(q * 0.0085 + vec2(-t * 0.017, t * 0.007)) * 0.4;
      vol = 0.35 + 0.9 * hz;
      sh = shafts(dir, t);
    }
    float carve = mix(1.0, 0.62 + 0.62 * sh * vol, uFx.x * smoothstep(0.05, 0.6, o));

    vec3 corona = uC3 * halo * 0.5 * carve
                + uC2 * glow * (0.42 + streak * 1.9)
                + uC1 * rim * 0.95;
    col += corona * heat;

    if (uFx.x > 0.0) {
      float fall = exp(-o * 1.05) * smoothstep(0.0, 0.35, o);
      vec3 shaftCol = mix(uC2, uC1, exp(-o * 1.6));
      col += shaftCol * sh * sh * fall * vol * 0.075 * uFx.x * heat;
    }

    // Dust motes drifting up through the light, brightest near the sun
    if (uFx.y > 0.0) {
      float m = motes(q + vec2(sin(t * 0.13) * 14.0, -mod(t * 7.0, 3456.0)), 54.0, 0.2, 0.55, 1.3, 1.7, t) * 0.8
              + motes(q + vec2(sin(t * 0.1 + 2.0) * 20.0, -mod(t * 12.5, 6144.0)), 96.0, 0.2, 0.9, 2.1, 9.2, t)
              + motes(q + vec2(sin(t * 0.07 + 4.0) * 28.0, -mod(t * 21.0, 13440.0)), 210.0, 0.14, 3.2, 7.0, 23.1, t) * 0.3;
      // Lit by the sun: strong falloff, and brighter inside the shafts
      float lit = exp(-o * 1.7) * (0.3 + 1.1 * vol * sh) + glow * 0.9;
      col += mix(uC1, uC0, 0.55) * m * lit * 1.1 * uFx.y * heat;
    }
  }

  // Disc
  if (d < 1.0 + uAA) {
    float z = sqrt(max(0.0, 1.0 - d * d));
    vec2 sp = p / (0.42 + z);
    vec2 flow = vec2(t * 0.022, -t * 0.016);
    float n1 = fbm(sp * 2.8 + flow);
    float n2 = fbm(sp * 6.5 - flow * 1.6 + n1 * 2.2);
    float n3 = noise(sp * 24.0 + n2 * 4.0 + t * 0.06);
    float g = n2 * 0.78 + n3 * 0.32;
    float limb = pow(z, 0.5);

    vec3 surf = mix(uC3, uC2, smoothstep(0.0, 0.5, limb));
    surf = mix(surf, uC1, smoothstep(0.3, 0.92, limb + (g - 0.55) * 0.42));
    surf = mix(surf, uC0, smoothstep(0.8, 1.16, limb + (g - 0.55) * 0.34));
    surf *= 0.76 + 0.48 * g;

    float inside = 1.0 - smoothstep(1.0 - uAA, 1.0 + uAA, d);
    col = mix(col, surf * (0.88 + 0.3 * uHeat + 0.18 * uGlow), inside);
  }

  // Bloom spilling over the edge
  col += uC1 * pow(glow, 5.0) * 0.22 * heat;

  // Lens ghosts on the axis from the sun through the (pointer-nudged) lens centre
  if (uFx.z > 0.0) {
    vec2 lc = uRes * 0.5 + vec2(uMouse.x, -uMouse.y) * uRes * vec2(0.09, 0.07);
    vec2 axis = lc - uSun;
    float gs = min(uRes.x, uRes.y);
    vec3 gh = vec3(1.0, 0.62, 0.3) * ghost(frag, uSun + axis * 1.38, gs * 0.05) * 0.8
            + vec3(1.0, 0.8, 0.52) * ghost(frag, uSun + axis * 1.7, gs * 0.018) * 1.4
            + vec3(0.95, 0.45, 0.22) * ghost(frag, uSun + axis * 2.2, gs * 0.085) * 0.45;
    col += gh * 0.03 * uFx.z * heat;
  }

  // Warm haze near the bottom of the frame
  col += uC3 * uHaze * pow(1.0 - uv.y, 3.0) * 0.32;

  // Filmic tone map + dither to kill banding
  col = 1.0 - exp(-col * (1.35 + uGlow * 0.3));
  col += (hash(frag + fract(t * 7.13) * 91.0) - 0.5) * (1.6 / 255.0);
  gl_FragColor = vec4(col, 1.0);
}
`

// Colours are in "light" units — the tone map squeezes them into range.
// rays / motes / ghosts scale the atmospheric extras per variant.
const PALETTES = {
  rise: {
    c0: [2.3, 1.9, 1.2],
    c1: [1.75, 0.92, 0.27],
    c2: [1.32, 0.4, 0.085],
    c3: [0.62, 0.11, 0.035],
    top: [0.0385, 0.035, 0.03],
    bot: [0.09, 0.032, 0.017],
    haze: 0.6,
    rays: 1,
    motes: 1,
    ghosts: 1,
  },
  set: {
    c0: [2.3, 1.6, 0.85],
    c1: [1.7, 0.62, 0.17],
    c2: [1.28, 0.27, 0.07],
    c3: [0.58, 0.07, 0.05],
    top: [0.0385, 0.035, 0.03],
    bot: [0.13, 0.035, 0.03],
    haze: 1,
    rays: 1.3,
    motes: 0.75,
    ghosts: 0,
  },
}

const UNIFORMS = [
  'uRes',
  'uSun',
  'uR',
  'uAA',
  'uTime',
  'uHeat',
  'uGlow',
  'uPx',
  'uMouse',
  'uFx',
  'uC0',
  'uC1',
  'uC2',
  'uC3',
  'uTop',
  'uBot',
  'uHaze',
]

export class SunRenderer {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{ variant?: 'rise' | 'set', layout: (w: number, h: number) => {x: number, y: number, r: number},
   *           state: { rise: number, lift: number, scale: number, heat: number, glow?: number } }} options
   *   `glow` (optional, 0–1) brightens and widens the light — the hero drives it on scroll.
   */
  constructor(canvas, { variant = 'rise', layout, state, onError }) {
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
    this.quality = window.devicePixelRatio > 1 ? 0.62 : 0.85
    // 2 = shafts + motes + ghosts, 1 = shafts only, 0 = bare sun (slow devices)
    this.fxLevel = 2
    this.mouse = { x: 0, y: 0, tx: 0, ty: 0 }
    this.running = false
    this.t0 = performance.now()
    this.slowFrames = 0
    this.last = 0

    // Compiled in the background where the browser allows; #setup() runs once it has linked
    this.prog = createProgram(gl, VERT, FRAG)
    this.pal = PALETTES[variant] ?? PALETTES.rise
    this.onError = onError
    this.ready = false

    // Lens ghosts only make sense when a pointer moves them
    this.finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches

    this.onPointer = (e) => {
      this.mouse.tx = (e.clientX / window.innerWidth) * 2 - 1
      this.mouse.ty = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', this.onPointer, { passive: true })

    this.resize()
  }

  /** True once the program is linked and set up; a failed compile is reported through onError. */
  #poll() {
    if (this.ready) return true
    if (this.failed) return false
    try {
      if (!this.prog.ready()) return false
    } catch (err) {
      this.failed = true
      this.pause()
      this.onError?.(err)
      return false
    }
    this.#setup()
    return true
  }

  #setup() {
    const { gl, pal } = this
    const program = this.prog.program
    gl.useProgram(program)

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(program, 'aPos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    this.u = Object.fromEntries(UNIFORMS.map((n) => [n, gl.getUniformLocation(program, n)]))
    gl.uniform3fv(this.u.uC0, pal.c0)
    gl.uniform3fv(this.u.uC1, pal.c1)
    gl.uniform3fv(this.u.uC2, pal.c2)
    gl.uniform3fv(this.u.uC3, pal.c3)
    gl.uniform3fv(this.u.uTop, pal.top)
    gl.uniform3fv(this.u.uBot, pal.bot)
    gl.uniform1f(this.u.uHaze, pal.haze)
    this.ready = true
    this.canvas.style.opacity = '1'
  }

  resize() {
    const w = this.canvas.clientWidth || 1
    const h = this.canvas.clientHeight || 1
    const scale = Math.min(window.devicePixelRatio || 1, 2) * this.quality
    this.w = w
    this.h = h
    this.canvas.width = Math.max(1, Math.round(w * scale))
    this.canvas.height = Math.max(1, Math.round(h * scale))
    this.px = this.canvas.width / w
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    if (!this.running) this.draw(performance.now())
  }

  draw(now) {
    if (!this.#poll()) return
    const { gl, u, state, mouse, pal } = this
    mouse.x += (mouse.tx - mouse.x) * 0.045
    mouse.y += (mouse.ty - mouse.y) * 0.045

    const base = this.layout(this.w, this.h)
    const r = base.r * state.scale
    const x = base.x + mouse.x * 16
    const y = base.y + (1 - state.rise) * base.r * 1.4 - state.lift * this.h + mouse.y * 10
    const fx = this.fxLevel

    gl.uniform2f(u.uRes, this.canvas.width, this.canvas.height)
    gl.uniform2f(u.uSun, x * this.px, (this.h - y) * this.px)
    gl.uniform1f(u.uR, r * this.px)
    gl.uniform1f(u.uAA, 1.6 / Math.max(1, r * this.px))
    gl.uniform1f(u.uTime, (now - this.t0) / 1000)
    gl.uniform1f(u.uHeat, state.heat)
    gl.uniform1f(u.uGlow, state.glow ?? 0)
    gl.uniform1f(u.uPx, this.px)
    gl.uniform2f(u.uMouse, mouse.x, mouse.y)
    gl.uniform4f(
      u.uFx,
      fx > 0 ? pal.rays : 0,
      fx > 1 ? pal.motes : 0,
      fx > 1 && this.finePointer ? pal.ghosts : 0,
      0,
    )
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  loop = (now) => {
    if (!this.running) return
    this.raf = requestAnimationFrame(this.loop)

    // Adaptive quality: drop resolution first, then the atmospheric extras,
    // if the device is struggling
    if (this.last && this.ready) {
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
    window.removeEventListener('pointermove', this.onPointer)
    this.gl.getExtension('WEBGL_lose_context')?.loseContext()
  }
}
