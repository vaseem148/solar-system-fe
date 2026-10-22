import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion, hasFinePointer } from '../lib/gsap'
import { CALC, BRAND } from '../config'
import { inr, num, trim } from '../lib/format'
import { buildPlan } from './sizes/plan'
import Label from './ui/Label'
import './Sizes.css'

const SIZES = [
  { fit: 'For 1–2 BHK homes', type: 'home', rows: 2, cols: 3, roofW: 9, roofD: 7.5, mumty: true },
  { fit: 'For independent houses with AC', type: 'home', rows: 2, cols: 5, roofW: 11, roofD: 8, mumty: true },
  { fit: 'For villas, clinics & shops', type: 'business', rows: 3, cols: 6, roofW: 13, roofD: 10.5, mumty: true },
  { fit: 'For factories, schools & mills', type: 'business', rows: 6, cols: 16, roofW: 24, roofD: 19 },
].map((s, i) => {
  const panelsCount = s.rows * s.cols
  const kw = (panelsCount * CALC.panelWatt) / 1000
  const units = kw * CALC.unitsPerKwDay * 30
  return {
    ...s,
    dwg: `DWG-0${i + 1}`,
    panelsCount,
    kw,
    units,
    area: kw * CALC.sqftPerKw,
    saving: units * CALC[s.type].tariff,
    plan: buildPlan(s),
  }
})

// Panel fills: off, the pulse of the entrance test-pass, and switched on
const OFF = 'rgba(255, 178, 63, 0)'
const PULSE = 'rgba(255, 190, 92, 0.72)'
const ON = 'rgba(255, 90, 31, 0.86)'

const SCAN_EASE = 'power1.inOut'
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%/+<>=*·'

/** Normalised time (0–1) at which an eased sweep has covered `p` of its travel. */
function timeAt(ease, p) {
  let lo = 0
  let hi = 1
  for (let k = 0; k < 18; k++) {
    const mid = (lo + hi) / 2
    if (ease(mid) < p) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/**
 * Sweeps the scan-line across a drawing inside `tl`, and hands every panel to
 * `light(rect, time)` at the exact moment the line crosses its centre.
 */
function sweep(tl, { scan, rects, plan, duration, light }) {
  const { from, to } = plan.scan
  const ease = gsap.parseEase(SCAN_EASE)
  tl.fromTo(scan, { x: from }, { x: to, duration, ease: SCAN_EASE, immediateRender: false }, 0)
    .fromTo(scan, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: 'none', immediateRender: false }, 0)
    .to(scan, { opacity: 0, duration: 0.28, ease: 'none' }, duration - 0.24)
  plan.panels.forEach((p, k) => light(rects[k], timeAt(ease, (p.cx - from) / (to - from)) * duration))
  return tl
}

/** Decodes an SVG <text> from noise (the shared [data-scramble] helper injects HTML, which SVG can't render). */
function decode(text, duration) {
  const node = text.firstChild
  const final = text.dataset.text ?? node?.nodeValue ?? ''
  text.dataset.text = final
  const st = { p: 0 }
  return gsap.to(st, {
    p: 1,
    duration,
    ease: 'power1.out',
    onUpdate() {
      if (!node) return
      const shown = Math.floor(st.p * final.length)
      let out = ''
      for (let i = 0; i < final.length; i++) {
        const ch = final[i]
        out += i < shown || ch === ' ' || ch === '·' ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      }
      node.nodeValue = out
    },
    onComplete() {
      if (node) node.nodeValue = final
    },
  })
}

/** "52.8" as odometer drums. The real value sits in the flow (crisp at rest); the drums only show while rolling. */
function KwRoll({ value }) {
  const chars = [...value]
  let last = -1
  chars.forEach((c, i) => {
    if (c >= '0' && c <= '9') last = i
  })
  return (
    <span className="kw" aria-hidden="true">
      {chars.map((ch, i) => {
        if (ch < '0' || ch > '9') {
          return (
            <span key={i} className="kw__sep">
              {ch}
            </span>
          )
        }
        // every drum turns at least once; the last one spins an extra lap
        const steps = (i === last ? 20 : 10) + Number(ch)
        return (
          <span key={i} className="kw__d">
            <span className="kw__ghost">{ch}</span>
            <span className="kw__win">
              <span className="kw__strip" data-steps={steps}>
                {Array.from({ length: steps + 1 }, (_, k) => (
                  <span key={k}>{k % 10}</span>
                ))}
              </span>
            </span>
          </span>
        )
      })}
    </span>
  )
}

function Drawing({ size }) {
  const { plan, dwg, kw } = size
  const { scan } = plan
  const wash = `scan-wash-${dwg}`
  return (
    <svg className="plan" viewBox="0 0 400 300" role="img" aria-label={`Roof plan for a ${trim(kw)} kWp system`}>
      <defs>
        <linearGradient id={wash} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#ff5a1f" stopOpacity="0" />
          <stop offset="0.7" stopColor="#ff7a2e" stopOpacity="0.09" />
          <stop offset="1" stopColor="#ffb23f" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {[
        [12, 12],
        [388, 12],
        [12, 288],
        [388, 288],
      ].map(([x, y]) => (
        <path key={`${x}${y}`} className="plan__reg" d={`M${x - 5},${y}h10M${x},${y - 5}v10`} />
      ))}

      <rect className="plan__wall draw" pathLength="1" {...plan.outer} />
      <rect className="plan__wall plan__wall--in draw" pathLength="1" {...plan.inner} />

      {plan.room && (
        <g className="plan__room">
          <rect className="draw" pathLength="1" {...plan.room.rect} />
          {plan.room.treads.map((t, i) => (
            <line key={i} className="draw" pathLength="1" {...t} />
          ))}
          <path className="draw" pathLength="1" d={plan.room.arrow} />
          <circle className="plan__tank draw" pathLength="1" {...plan.room.tank} />
          <text x={plan.room.label.x} y={plan.room.label.y} textAnchor="middle" data-decode="">
            STAIR · TANK
          </text>
        </g>
      )}

      <g className="plan__array">
        {plan.panels.map((p) => (
          <g key={p.key}>
            <rect className="pn draw" pathLength="1" x={p.x} y={p.y} width={p.width} height={p.height} />
            <line className="pn-mid" {...p.mid} />
          </g>
        ))}
      </g>

      {/* Blueprint scan-line: a carriage that switches the array on as it passes */}
      <g className="plan__scan">
        <rect className="plan__scan-wash" x="-56" y={scan.top} width="56" height={scan.bottom - scan.top} fill={`url(#${wash})`} />
        <line className="plan__scan-line" x1="0" y1={scan.top - 6} x2="0" y2={scan.bottom + 6} />
        <path className="plan__scan-cap" d={`M-3.5,${scan.top - 11}h7l-3.5,5z`} />
        <path className="plan__scan-cap" d={`M-3.5,${scan.bottom + 11}h7l-3.5,-5z`} />
      </g>

      {['top', 'left'].map((side) => {
        const d = plan.dims[side]
        return (
          <g className="plan__dim" key={side}>
            <line {...d.line} />
            {d.ext.map((e, i) => (
              <line key={i} className="plan__ext" {...e} />
            ))}
            {d.ticks.map((t, i) => (
              <line key={`t${i}`} className="plan__tick" {...t} />
            ))}
            <text
              x={d.label.x}
              y={d.label.y}
              textAnchor="middle"
              transform={side === 'left' ? `rotate(-90 ${d.label.x} ${d.label.y})` : undefined}
              data-decode=""
            >
              {d.label.text}
            </text>
          </g>
        )
      })}

      <g className="plan__north" transform="translate(372 30)">
        <circle r="11" />
        <path className="plan__needle" d="M0,-8 L4,5 L0,2.5 L-4,5Z" />
        <text y="-15" textAnchor="middle">
          N
        </text>
      </g>

      <g className="plan__block" transform="translate(262 258)">
        <rect width="128" height="32" rx="2" />
        <line x1="0" y1="16" x2="128" y2="16" />
        <text x="7" y="11.5" data-decode="">
          {`${dwg} · ${trim(kw)} kWp`}
        </text>
        <text x="7" y="27.5" data-decode="">
          {`ROOF PLAN · ${BRAND.name.toUpperCase()}`}
        </text>
      </g>
    </svg>
  )
}

export default function Sizes() {
  const root = useRef(null)

  useGSAP(
    (context, contextSafe) => {
      const section = root.current
      // Reduced motion: drawings are static and the CSS hover rule switches them on
      if (prefersReducedMotion()) return

      const fine = hasFinePointer()
      const cells = gsap.utils.toArray('.size-cell', section)
      const left0 = cells[0]?.getBoundingClientRect().left ?? 0
      const cleanups = []

      // The ambient grid shimmer only runs while the section is on screen
      ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => section.toggleAttribute('data-live', self.isActive),
      })

      cells.forEach((cell, i) => {
        const card = cell.querySelector('.size')
        const { plan } = SIZES[i]
        const scan = card.querySelector('.plan__scan')
        const rects = gsap.utils.toArray('.pn', card)
        const col = Math.round((cell.getBoundingClientRect().left - left0) / Math.max(1, cell.offsetWidth))

        // ── Switch on: the scan-line crosses the roof and each panel lights as it passes
        const on = gsap.timeline({ paused: true })
        sweep(on, {
          scan,
          rects,
          plan,
          duration: 1.15,
          light: (r, t) => on.fromTo(r, { fill: OFF }, { fill: ON, duration: 0.24, ease: 'power1.out', immediateRender: false }, t),
        })

        // ── Entrance test-pass: same carriage, the panels only pulse and fade (hover to keep them on)
        const pulse = gsap.timeline({ paused: true })
        sweep(pulse, {
          scan,
          rects,
          plan,
          duration: 1.45,
          light: (r, t) =>
            pulse
              .fromTo(r, { fill: OFF }, { fill: PULSE, duration: 0.1, ease: 'none', immediateRender: false }, t)
              .to(r, { fill: OFF, duration: 1.1, ease: 'power2.out' }, t + 0.1),
        })

        let hovered = false
        const switchOn = contextSafe(() => {
          if (pulse.isActive()) pulse.progress(1).pause()
          scan.removeAttribute('data-dir')
          on.timeScale(1).play()
        })
        const switchOff = contextSafe(() => {
          scan.setAttribute('data-dir', 'back')
          on.timeScale(1.8).reverse()
        })

        // ── Entrance: the sheet lifts in, the plotter draws it, the drums roll, the labels decode
        const tl = gsap.timeline({
          delay: col * 0.14,
          scrollTrigger: { trigger: cell, start: 'top 84%', once: true },
        })
        tl.from(cell, { y: 70, opacity: 0, duration: 1.3 })
          .fromTo(
            card.querySelectorAll('.draw'),
            { strokeDasharray: 1, strokeDashoffset: 1 },
            { strokeDashoffset: 0, duration: 1.6, stagger: 0.004, ease: 'power2.inOut' },
            0.2,
          )
          .from(card.querySelectorAll('.plan__dim, .plan__north, .plan__block, .plan__room text'), { opacity: 0, duration: 0.8, stagger: 0.08 }, 1)
          .from(card.querySelector('.plan__needle'), { rotation: -70, transformOrigin: '50% 61.5%', duration: 1.6, ease: 'elastic.out(1, 0.45)' }, 1.05)

        card.querySelectorAll('[data-decode]').forEach((t, k) => {
          tl.add(decode(t, Math.min(0.9, 0.3 + t.textContent.length * 0.03)), 1 + k * 0.07)
        })

        // kWp drums: show the strips while rolling, then hand back to the crisp in-flow digits
        const ghosts = card.querySelectorAll('.kw__ghost')
        const wins = card.querySelectorAll('.kw__win')
        gsap.set(ghosts, { visibility: 'hidden' })
        gsap.set(wins, { visibility: 'visible' })
        let rollEnd = 0
        card.querySelectorAll('.kw__strip').forEach((strip, k) => {
          const steps = Number(strip.dataset.steps)
          const duration = 1.7 + k * 0.22
          tl.fromTo(strip, { yPercent: 0 }, { yPercent: (-100 * steps) / (steps + 1), duration, ease: 'expo.out' }, 0.25)
          rollEnd = Math.max(rollEnd, 0.25 + duration)
        })
        tl.set(ghosts, { visibility: 'visible' }, rollEnd).set(wins, { visibility: 'hidden' }, rollEnd)
        // Clear the drawing dash so the CSS line styles (e.g. the dashed tank) apply again
        tl.set(card.querySelectorAll('.draw'), { clearProps: 'strokeDasharray,strokeDashoffset' }, 2.6)

        if (fine) {
          const enter = () => {
            hovered = true
            if (tl.progress() > 0) switchOn()
          }
          const leave = () => {
            hovered = false
            switchOff()
          }
          card.addEventListener('pointerenter', enter)
          card.addEventListener('pointerleave', leave)
          cleanups.push(() => {
            card.removeEventListener('pointerenter', enter)
            card.removeEventListener('pointerleave', leave)
          })
          tl.call(() => !hovered && on.progress() === 0 && pulse.play(0), null, 1.45)
        } else {
          // Touch has no hover: a drawing switches itself on while it holds the middle of the screen
          let want = false
          ScrollTrigger.create({
            trigger: card,
            start: 'top 62%',
            end: 'bottom 38%',
            onToggle: (self) => {
              want = self.isActive
              if (tl.time() >= 1.4) want ? switchOn() : switchOff()
            },
          })
          tl.call(() => want && switchOn(), null, 1.4)
        }
      })

      return () => {
        cleanups.forEach((fn) => fn())
        section.removeAttribute('data-live')
        section.querySelectorAll('[data-decode]').forEach((t) => {
          if (t.dataset.text != null && t.firstChild) t.firstChild.nodeValue = t.dataset.text
        })
      }
    },
    { scope: root },
  )

  return (
    <section ref={root} id="sizes" className="sizes section" data-tone="dark">
      <div className="container">
        <header className="sizes__head">
          <Label index="02">Typical systems</Label>
          <h2 className="title" data-reveal="lines">
            Sized for
            <br /> <em>your</em> roof.
          </h2>
          <p className="lede" data-reveal="up">
            Typical layouts for Tamil Nadu terraces. Hover a drawing to switch it on — then let us draw yours.
          </p>
        </header>

        <div className="sizes__grid">
          {SIZES.map((s, i) => (
            <div className="size-cell" key={s.dwg}>
              <article
                className="size"
                data-cursor="Switch on"
                data-tilt="5"
                data-tilt-glare=""
                data-tilt-lift="8"
                style={{ '--i': i }}
              >
                <span className="size__fx" aria-hidden="true" />
                <Drawing size={s} />
                <div className="size__info">
                  <p className="size__kw">
                    <span className="sr-only">{trim(s.kw)}</span>
                    <KwRoll value={trim(s.kw)} />
                    <small>kWp</small>
                  </p>
                  <p className="size__fit">{s.fit}</p>
                  <ul className="size__specs mono">
                    <li>
                      <span>Panels</span>
                      {s.panelsCount} × {CALC.panelWatt} W
                    </li>
                    <li>
                      <span>Roof area</span>~{num(s.area)} sq ft
                    </li>
                    <li>
                      <span>Generation</span>~{num(s.units)} units / mo
                    </li>
                    <li>
                      <span>Saves</span>≈ {inr(s.saving)} / mo
                    </li>
                  </ul>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
