// Generates a top-down "roof plan" drawing (in a 400 × 300 viewBox)
// for a terrace with a solar array, in engineering-drawing style.

const PANEL_W = 1.13 // m
const PANEL_D = 2.24 // m, projected length at a low tilt
const GAP = 0.03
const WALL = 0.23

const AREA = { x: 58, y: 44, w: 292, h: 196 }
const r1 = (n) => Math.round(n * 10) / 10

export function buildPlan({ roofW, roofD, rows, cols, mumty = false, rowGap = 0.6 }) {
  const s = Math.min(AREA.w / roofW, AREA.h / roofD)
  const ox = AREA.x + (AREA.w - roofW * s) / 2
  const oy = AREA.y + (AREA.h - roofD * s) / 2
  const X = (m) => r1(ox + m * s)
  const Y = (m) => r1(oy + m * s)
  const L = (m) => r1(m * s)

  const outer = { x: X(0), y: Y(0), width: L(roofW), height: L(roofD) }
  const inner = { x: X(WALL), y: Y(WALL), width: L(roofW - 2 * WALL), height: L(roofD - 2 * WALL) }

  let room = null
  if (mumty) {
    const m = { x: WALL, y: WALL, w: 3.0, d: 2.7 }
    const treads = Array.from({ length: 7 }, (_, i) => {
      const x = m.x + 0.5 + i * 0.32
      return { x1: X(x), y1: Y(m.y + 0.25), x2: X(x), y2: Y(m.y + 1.25) }
    })
    room = {
      rect: { x: X(m.x), y: Y(m.y), width: L(m.w), height: L(m.d) },
      treads,
      arrow: `M${X(m.x + 0.4)},${Y(m.y + 1.6)}H${X(m.x + 2.6)}m-${L(0.25)},-${L(0.18)}l${L(0.25)},${L(0.18)}l-${L(0.25)},${L(0.18)}`,
      tank: { cx: X(m.x + 1.5), cy: Y(m.y + 2.05), r: L(0.5) },
      label: { x: X(m.x + 1.5), y: Y(m.y + 2.62) },
    }
  }

  const arrW = cols * (PANEL_W + GAP) - GAP
  const arrD = rows * PANEL_D + (rows - 1) * rowGap
  const x0 = mumty ? WALL + 3.0 + 0.6 : WALL + 0.5
  const x1 = roofW - WALL - 0.5
  const ax = x0 + Math.max(0, (x1 - x0 - arrW) / 2)
  const ay = WALL + 0.5 + Math.max(0, (roofD - 2 * WALL - 1 - arrD) / 2)

  const panels = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const px = ax + c * (PANEL_W + GAP)
      const py = ay + r * (PANEL_D + rowGap)
      panels.push({
        key: `${r}-${c}`,
        x: X(px),
        y: Y(py),
        width: L(PANEL_W),
        height: L(PANEL_D),
        // centre x — when the scan-line crosses it, this panel switches on
        cx: X(px + PANEL_W / 2),
        mid: { x1: X(px), y1: Y(py + PANEL_D / 2), x2: X(px + PANEL_W), y2: Y(py + PANEL_D / 2) },
      })
    }
  }

  const top = outer.y - 18
  const left = outer.x - 18
  const dims = {
    top: {
      line: { x1: outer.x, y1: top, x2: outer.x + outer.width, y2: top },
      ext: [
        { x1: outer.x, y1: outer.y - 4, x2: outer.x, y2: top - 5 },
        { x1: outer.x + outer.width, y1: outer.y - 4, x2: outer.x + outer.width, y2: top - 5 },
      ],
      ticks: [outer.x, outer.x + outer.width].map((x) => ({ x1: x - 4, y1: top + 4, x2: x + 4, y2: top - 4 })),
      label: { x: r1(outer.x + outer.width / 2), y: top - 6, text: `${roofW.toFixed(1)} m` },
    },
    left: {
      line: { x1: left, y1: outer.y, x2: left, y2: outer.y + outer.height },
      ext: [
        { x1: outer.x - 4, y1: outer.y, x2: left - 5, y2: outer.y },
        { x1: outer.x - 4, y1: outer.y + outer.height, x2: left - 5, y2: outer.y + outer.height },
      ],
      ticks: [outer.y, outer.y + outer.height].map((y) => ({ x1: left - 4, y1: y + 4, x2: left + 4, y2: y - 4 })),
      label: { x: left - 7, y: r1(outer.y + outer.height / 2), text: `${roofD.toFixed(1)} m` },
    },
  }

  // Travel of the blueprint scan-line: just outside the parapet on both sides,
  // standing a little proud of the roof top and bottom.
  const scan = {
    from: r1(outer.x - 14),
    to: r1(outer.x + outer.width + 14),
    top: r1(outer.y - 7),
    bottom: r1(outer.y + outer.height + 7),
  }

  return { outer, inner, room, panels, dims, scan }
}
