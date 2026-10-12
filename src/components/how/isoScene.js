// Isometric geometry for the "How it works" house, generated in code.
// World units: x → right-back, y → left-back, z → up. 1 unit ≈ 1 metre.

const C = Math.cos(Math.PI / 6)
export const U = 26
const OX = 455
const OY = 318

export const P = (x, y, z = 0) => [OX + (x - y) * C * U, OY + (x + y) * 0.5 * U - z * U]

const r1 = (n) => Math.round(n * 10) / 10
const pt = (p) => P(...p).map(r1).join(',')
export const poly = (...ps) => ps.map(pt).join(' ')
export const path = (...ps) => 'M' + ps.map(pt).join('L')
const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k)
const seg = (a, b) => {
  const [x1, y1] = P(...a)
  const [x2, y2] = P(...b)
  return { x1: r1(x1), y1: r1(y1), x2: r1(x2), y2: r1(y2) }
}

/* ── House ─────────────────────────────────────────── */
export const W = 10
export const D = 8
const H = 7
const PARAPET = 0.7
const T = 0.32
export const TOP = H + PARAPET
export const FLOOR = H

export const house = {
  leftWall: poly([0, D, 0], [W, D, 0], [W, D, TOP], [0, D, TOP]),
  rightWall: poly([W, 0, 0], [W, D, 0], [W, D, TOP], [W, 0, TOP]),
  floor: poly([T, T, FLOOR], [W - T, T, FLOOR], [W - T, D - T, FLOOR], [T, D - T, FLOOR]),
  innerBack: poly([T, T, FLOOR], [W - T, T, FLOOR], [W - T, T, TOP], [T, T, TOP]),
  innerLeft: poly([T, T, FLOOR], [T, D - T, FLOOR], [T, D - T, TOP], [T, T, TOP]),
  rim:
    path([0, 0, TOP], [W, 0, TOP], [W, D, TOP], [0, D, TOP]) +
    'Z' +
    path([T, T, TOP], [W - T, T, TOP], [W - T, D - T, TOP], [T, D - T, TOP]) +
    'Z',
  band: path([0, D, 3.5], [W, D, 3.5], [W, 0, 3.5]),
  plinth: path([0, D, 0.45], [W, D, 0.45], [W, 0, 0.45]),
  heat: poly([T, T, FLOOR], [W - T, T, FLOOR], [W - T, D - T, FLOOR], [T, D - T, FLOOR]),
}

// Windows: [from, to, bottom, top] along the wall
const leftOpenings = [
  { a: 1.0, b: 2.5, z0: 0, z1: 2.6, door: true },
  { a: 4.0, b: 6.0, z0: 1.0, z1: 2.5 },
  { a: 7.2, b: 9.0, z0: 1.0, z1: 2.5 },
  { a: 1.0, b: 3.0, z0: 4.4, z1: 5.9 },
  { a: 4.0, b: 6.0, z0: 4.4, z1: 5.9 },
  { a: 7.2, b: 9.0, z0: 4.4, z1: 5.9 },
]
const rightOpenings = [
  { a: 1.2, b: 3.0, z0: 1.0, z1: 2.5 },
  { a: 1.2, b: 3.0, z0: 4.4, z1: 5.9 },
  { a: 5.0, b: 6.8, z0: 4.4, z1: 5.9 },
]

export const windows = [
  ...leftOpenings.map((o, i) => ({
    key: `l${i}`,
    door: !!o.door,
    shape: poly([o.a, D, o.z0], [o.b, D, o.z0], [o.b, D, o.z1], [o.a, D, o.z1]),
    mullion: o.door ? null : seg([(o.a + o.b) / 2, D, o.z0], [(o.a + o.b) / 2, D, o.z1]),
    shadeTop: poly(
      [o.a - 0.25, D, o.z1 + 0.3],
      [o.b + 0.25, D, o.z1 + 0.3],
      [o.b + 0.25, D + 0.5, o.z1 + 0.3],
      [o.a - 0.25, D + 0.5, o.z1 + 0.3],
    ),
    shadeEdge: poly(
      [o.a - 0.25, D + 0.5, o.z1 + 0.3],
      [o.b + 0.25, D + 0.5, o.z1 + 0.3],
      [o.b + 0.25, D + 0.5, o.z1 + 0.16],
      [o.a - 0.25, D + 0.5, o.z1 + 0.16],
    ),
  })),
  ...rightOpenings.map((o, i) => ({
    key: `r${i}`,
    door: false,
    shape: poly([W, o.a, o.z0], [W, o.b, o.z0], [W, o.b, o.z1], [W, o.a, o.z1]),
    mullion: seg([W, (o.a + o.b) / 2, o.z0], [W, (o.a + o.b) / 2, o.z1]),
    shadeTop: poly(
      [W, o.a - 0.25, o.z1 + 0.3],
      [W, o.b + 0.25, o.z1 + 0.3],
      [W + 0.5, o.b + 0.25, o.z1 + 0.3],
      [W + 0.5, o.a - 0.25, o.z1 + 0.3],
    ),
    shadeEdge: poly(
      [W + 0.5, o.a - 0.25, o.z1 + 0.3],
      [W + 0.5, o.b + 0.25, o.z1 + 0.3],
      [W + 0.5, o.b + 0.25, o.z1 + 0.16],
      [W + 0.5, o.a - 0.25, o.z1 + 0.16],
    ),
  })),
]

/* ── Staircase room ("mumty") with the black water tank ── */
const M = { x0: T, x1: T + 3.2, y0: T, y1: T + 2.9, z0: FLOOR, z1: FLOOR + 2.7 }
export const mumty = {
  left: poly([M.x0, M.y1, M.z0], [M.x1, M.y1, M.z0], [M.x1, M.y1, M.z1], [M.x0, M.y1, M.z1]),
  right: poly([M.x1, M.y0, M.z0], [M.x1, M.y1, M.z0], [M.x1, M.y1, M.z1], [M.x1, M.y0, M.z1]),
  top: poly([M.x0, M.y0, M.z1], [M.x1, M.y0, M.z1], [M.x1, M.y1, M.z1], [M.x0, M.y1, M.z1]),
  door: poly([M.x1, M.y0 + 0.9, M.z0], [M.x1, M.y0 + 2.0, M.z0], [M.x1, M.y0 + 2.0, M.z0 + 2.1], [M.x1, M.y0 + 0.9, M.z0 + 2.1]),
}

export const tank = (() => {
  const r = 0.85
  const h = 1.3
  const [bx, by] = P(M.x0 + 1.6, M.y0 + 1.45, M.z1)
  const ty = by - h * U
  const rx = r * Math.SQRT2 * C * U
  const ry = r * Math.SQRT2 * 0.5 * U
  const f = r1
  return {
    body: `M${f(bx - rx)},${f(ty)}L${f(bx - rx)},${f(by)}A${f(rx)},${f(ry)} 0 0 0 ${f(bx + rx)},${f(by)}L${f(bx + rx)},${f(ty)}Z`,
    ribs: [0.3, 0.62].map((k) => {
      const y = by - k * h * U
      return `M${f(bx - rx)},${f(y)}A${f(rx)},${f(ry)} 0 0 0 ${f(bx + rx)},${f(y)}`
    }),
    top: { cx: f(bx), cy: f(ty), rx: f(rx), ry: f(ry) },
    lid: { cx: f(bx), cy: f(ty), rx: f(rx * 0.32), ry: f(ry * 0.32) },
  }
})()

/* ── Panels on an elevated structure ──────────────────── */
const TILT = (12 * Math.PI) / 180
const PW = 1.1
const PL = 2.2
const LC = PL * Math.cos(TILT)
const LZ = PL * Math.sin(TILT)
const ELEV = 1.5
const COLS = [4.2, 5.35, 6.5, 7.65]
const ROWS = [1.0, 3.95]
export const Z_LOW = FLOOR + ELEV
export const Z_HIGH = Z_LOW + LZ
export const ARRAY = { x0: COLS[0], x1: COLS[3] + PW, yFront: ROWS[1] + LC }

export const panels = ROWS.flatMap((yb, row) =>
  COLS.map((x0, col) => {
    const x1 = x0 + PW
    const yf = yb + LC
    const BL = [x0, yb, Z_HIGH]
    const BR = [x1, yb, Z_HIGH]
    const FR = [x1, yf, Z_LOW]
    const FL = [x0, yf, Z_LOW]
    const cells = []
    for (let i = 1; i < 4; i++) cells.push(seg(lerp3(BL, BR, i / 4), lerp3(FL, FR, i / 4)))
    for (let j = 1; j < 6; j++) cells.push(seg(lerp3(BL, FL, j / 6), lerp3(BR, FR, j / 6)))
    return { key: `${row}-${col}`, shape: poly(BL, BR, FR, FL), cells }
  }),
)

const LEG_X = [COLS[0] + 0.05, (COLS[0] + COLS[3] + PW) / 2, COLS[3] + PW - 0.05]
export const structure = [
  ...ROWS.flatMap((yb) => {
    const yf = yb + LC
    return LEG_X.flatMap((x) => [
      seg([x, yf, FLOOR], [x, yf, Z_LOW]),
      seg([x, yb, FLOOR], [x, yb, Z_HIGH]),
      seg([x, yb, Z_HIGH], [x, yf, Z_LOW]),
    ])
  }),
  ...ROWS.map((yb) => seg([LEG_X[0], yb + LC, Z_LOW - 0.08], [LEG_X[2], yb + LC, Z_LOW - 0.08])),
]

export const arrayShadow = ROWS.map((yb) =>
  poly([COLS[0], yb + 0.7, FLOOR], [COLS[3] + PW, yb + 0.7, FLOOR], [COLS[3] + PW, yb + LC + 0.5, FLOOR], [COLS[0], yb + LC + 0.5, FLOOR]),
)

export const glint = panels.map((p) => p.shape)

/* ── Inverter + net meter on the right wall ──────────── */
const INV = { y0: 5.3, y1: 6.6, z0: 1.5, z1: 3.0, d: 0.35 }
const IX = W + INV.d
export const inverter = {
  front: poly([IX, INV.y0, INV.z0], [IX, INV.y1, INV.z0], [IX, INV.y1, INV.z1], [IX, INV.y0, INV.z1]),
  side: poly([W, INV.y1, INV.z0], [IX, INV.y1, INV.z0], [IX, INV.y1, INV.z1], [W, INV.y1, INV.z1]),
  top: poly([W, INV.y0, INV.z1], [IX, INV.y0, INV.z1], [IX, INV.y1, INV.z1], [W, INV.y1, INV.z1]),
  screen: poly([IX, INV.y1 - 0.25, INV.z1 - 0.35], [IX, INV.y0 + 0.55, INV.z1 - 0.35], [IX, INV.y0 + 0.55, INV.z1 - 0.72], [IX, INV.y1 - 0.25, INV.z1 - 0.72]),
  vents: [0.55, 0.75, 0.95].map((k) => seg([IX, INV.y1 - 0.25, INV.z0 + k * 0.5], [IX, INV.y0 + 0.3, INV.z0 + k * 0.5])),
  led: P(IX, INV.y0 + 0.28, INV.z1 - 0.32),
}

const MT = { y0: 3.1, y1: 4.7, z0: 1.6, z1: 2.9, d: 0.25 }
const MX = W + MT.d
export const meter = {
  front: poly([MX, MT.y0, MT.z0], [MX, MT.y1, MT.z0], [MX, MT.y1, MT.z1], [MX, MT.y0, MT.z1]),
  side: poly([W, MT.y1, MT.z0], [MX, MT.y1, MT.z0], [MX, MT.y1, MT.z1], [W, MT.y1, MT.z1]),
  top: poly([W, MT.y0, MT.z1], [MX, MT.y0, MT.z1], [MX, MT.y1, MT.z1], [W, MT.y1, MT.z1]),
  screen: poly([MX, MT.y1 - 0.14, MT.z1 - 0.2], [MX, MT.y0 + 0.14, MT.z1 - 0.2], [MX, MT.y0 + 0.14, MT.z1 - 0.72], [MX, MT.y1 - 0.14, MT.z1 - 0.72]),
  // Text drawn on the wall plane: x runs towards -y, y runs down
  textMatrix: (() => {
    const s = U * 0.037
    const [ex, ey] = P(MX, MT.y1 - 0.22, MT.z1 - 0.62)
    return `matrix(${r1(C * s * 100) / 100} ${r1(-0.5 * s * 100) / 100} 0 ${r1(s * 100) / 100} ${r1(ex)} ${r1(ey)})`
  })(),
}

/* ── Cables & energy paths ─────────────────────────── */
export const cables = {
  // Down the array leg, across the terrace, over the parapet near the
  // corner (clear of the windows), down the wall and into the inverter.
  dc: path(
    [ARRAY.x1 - 0.05, ARRAY.yFront, Z_LOW],
    [ARRAY.x1 - 0.05, ARRAY.yFront, FLOOR + 0.05],
    [ARRAY.x1 - 0.05, 7.25, FLOOR + 0.05],
    [W - T - 0.05, 7.25, FLOOR + 0.05],
    [W - T - 0.05, 7.25, TOP],
    [W + 0.06, 7.25, TOP],
    [W + 0.06, 7.25, INV.z1 + 0.35],
    [W + 0.06, 6.2, INV.z1 + 0.35],
    [W + 0.06, 6.2, INV.z1],
  ),
  ac: path([W + 0.06, INV.y0, 2.2], [W + 0.06, MT.y1, 2.2]),
  home: path([W + 0.06, MT.y0 + 0.5, MT.z0], [W + 0.06, MT.y0 + 0.5, 0.9], [W + 0.06, 1.0, 0.9]),
}

/* ── Utility pole & service wire ──────────────────── */
const POLE = { x: W + 4.6, y: 1.2, h: 10.6 }
const ENTRY = [W + 0.06, 3.9, 6.4]
const CROSS = [POLE.x, POLE.y, POLE.h - 0.5]
export const pole = {
  shaft: seg([POLE.x, POLE.y, 0], [POLE.x, POLE.y, POLE.h]),
  arm: seg([POLE.x, POLE.y - 1.3, POLE.h - 0.5], [POLE.x, POLE.y + 1.3, POLE.h - 0.5]),
  insulators: [-1.1, 0, 1.1].map((k) => P(POLE.x, POLE.y + k, POLE.h - 0.35)),
  lines: [-1.1, 0, 1.1].map((k) => {
    const [x1, y1] = P(POLE.x, POLE.y + k, POLE.h - 0.35)
    const [x2, y2] = P(POLE.x, POLE.y + k - 16, POLE.h + 0.4)
    const mx = (x1 + x2) / 2
    const my = (y1 + y2) / 2 + 26
    return `M${r1(x1)},${r1(y1)}Q${r1(mx)},${r1(my)} ${r1(x2)},${r1(y2)}`
  }),
  base: P(POLE.x, POLE.y, 0),
}

export const gridPath = (() => {
  const conduit = path([W + 0.06, 3.9, MT.z1], ENTRY)
  const [x1, y1] = P(...ENTRY)
  const [x2, y2] = P(...CROSS)
  const mx = (x1 + x2) / 2
  const my = Math.max(y1, y2) + 34
  return `${conduit}Q${r1(mx)},${r1(my)} ${r1(x2)},${r1(y2)}`
})()

/* ── Ground grid ──────────────────────────────────── */
export const groundLines = [
  ...Array.from({ length: 19 }, (_, i) => seg([i - 2, -2, 0], [i - 2, 13, 0])),
  ...Array.from({ length: 16 }, (_, i) => seg([-2, i - 2, 0], [16, i - 2, 0])),
]
export const footprintShadow = poly([-0.6, -0.6, 0], [W + 1.2, -0.6, 0], [W + 1.2, D + 1.2, 0], [-0.6, D + 1.2, 0])

/* ── Sun rays (screen space), parallel, landing on the roof ── */
const RAY_TARGETS = [
  [3.6, 3.6], [5.0, 1.6], [6.2, 4.6], [7.4, 2.4], [8.6, 5.6], [4.8, 6.4], [9.0, 1.4],
]
export const rays = RAY_TARGETS.map(([x, y], i) => {
  const [tx, ty] = P(x, y, FLOOR)
  const len = 520 + (i % 3) * 60
  const dx = -0.78
  const dy = -0.63
  return { key: i, x1: r1(tx + dx * len), y1: r1(ty + dy * len), x2: r1(tx), y2: r1(ty) }
})

/* ── Callout anchors ──────────────────────────────── */
export const anchors = {
  roof: P(6.2, 4.0, FLOOR),
  panels: P(ARRAY.x1, ROWS[0], Z_HIGH),
  inverter: P(IX, INV.y0, (INV.z0 + INV.z1) / 2),
  home: P(2.0, D, 5.15),
  meter: P(MX, MT.y0, (MT.z0 + MT.z1) / 2),
  grid: P(POLE.x, POLE.y - 1.3, POLE.h - 0.5),
}

/* ── Camera, sky and life ─────────────────────────── */

// Centre of the scene viewBox ("110 30 870 680") — the camera's pivot
export const VIEW_CENTRE = [545, 370]

// Where the camera looks during each step (screen space of the untransformed scene)
export const focus = {
  roof: anchors.roof,
  array: P((ARRAY.x0 + ARRAY.x1) / 2, 3.5, Z_LOW + 0.2),
  inverter: [r1((anchors.inverter[0] + anchors.roof[0]) / 2), r1(anchors.inverter[1] * 0.75 + anchors.roof[1] * 0.25)],
  house: P(W / 2, D / 2, 3.8),
  export: [r1((anchors.meter[0] + anchors.grid[0]) / 2), r1((anchors.meter[1] + anchors.grid[1]) / 2)],
}

// The sun sits back along the ray direction from the roof
export const skySun = { x: r1(anchors.roof[0] - 0.78 * 300), y: r1(anchors.roof[1] - 0.63 * 300), r: 22 }

export const CLOUD_PATH =
  'M12 34a10 10 0 0 1-2-19.8A15 15 0 0 1 36 6.5a19 19 0 0 1 33 4.4A13 13 0 0 1 91 22a9 9 0 0 1-3 12z'
export const clouds = [
  { x: 300, y: 118, s: 1 },
  { x: 548, y: 58, s: 0.72 },
  { x: 872, y: 236, s: 1 },
]

export const birds = [
  { x: 0, y: 0, s: 1 },
  { x: 20, y: -10, s: 0.8 },
  { x: 38, y: 6, s: 0.9 },
]

// Coconut palm beside the left wall — organic, drawn around its own base point
export const palm = (() => {
  const [bx, by] = P(-1.6, 9.6, 0)
  const c0 = [0, 0]
  const c1 = [-12, -92]
  const c2 = [-10, -172]
  const c3 = [8, -236]
  const bez = (t) =>
    [0, 1].map((k) => (1 - t) ** 3 * c0[k] + 3 * (1 - t) ** 2 * t * c1[k] + 3 * (1 - t) * t * t * c2[k] + t ** 3 * c3[k])

  const left = []
  const right = []
  for (let i = 0; i <= 12; i++) {
    const t = i / 12
    const [x, y] = bez(t)
    const w = 6 - 3 * t
    left.push([x - w, y])
    right.push([x + w, y])
  }
  const trunk = 'M' + [...left, ...right.reverse()].map(([x, y]) => `${r1(x)},${r1(y)}`).join('L') + 'Z'
  const rings = Array.from({ length: 9 }, (_, i) => {
    const t = (i + 1) / 10
    const [x, y] = bez(t)
    const w = 6 - 3 * t
    return { x1: r1(x - w), y1: r1(y + 1.5), x2: r1(x + w), y2: r1(y - 1.5) }
  })

  const [cx, cy] = c3
  const leaf = (deg, len, droop, w) => {
    const a = (deg * Math.PI) / 180
    const dx = Math.cos(a)
    const dy = Math.sin(a)
    const tip = [cx + dx * len, cy + dy * len + droop]
    const mid = [cx + dx * len * 0.5, cy + dy * len * 0.5 - Math.abs(dx) * 10]
    const s1 = [mid[0] - dy * w, mid[1] + dx * w]
    const s2 = [mid[0] + dy * w, mid[1] - dx * w]
    const f = (p) => `${r1(p[0])},${r1(p[1])}`
    return {
      blade: `M${cx},${cy}Q${f(s1)} ${f(tip)}Q${f(s2)} ${cx},${cy}Z`,
      rib: `M${cx},${cy}Q${f(mid)} ${f(tip)}`,
    }
  }
  const fronds = [
    [160, 66, 46, 9],
    [-168, 86, 34, 11],
    [-140, 80, 18, 10],
    [-112, 62, -6, 9],
    [-78, 64, -4, 9],
    [-46, 82, 16, 10],
    [-14, 90, 34, 11],
    [20, 70, 44, 9],
  ].map(([deg, len, droop, w], i) => ({ key: i, tone: i % 3, ...leaf(deg, len, droop, w) }))

  return { x: r1(bx), y: r1(by), trunk, rings, crown: c3, fronds, nuts: [[3, -228], [12, -225], [19, -231]] }
})()
