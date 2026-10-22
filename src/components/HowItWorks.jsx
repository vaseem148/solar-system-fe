import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../lib/gsap'
import Label from './ui/Label'
import {
  P,
  house,
  windows,
  mumty,
  tank,
  panels,
  structure,
  arrayShadow,
  inverter,
  meter,
  cables,
  pole,
  gridPath,
  groundLines,
  footprintShadow,
  rays,
  anchors,
  focus,
  VIEW_CENTRE,
  skySun,
  clouds,
  CLOUD_PATH,
  birds,
  palm,
} from './how/isoScene'
import './HowItWorks.css'

const STEPS = [
  {
    title: 'Sunlight lands',
    text: 'About 5 kWh of sunlight falls on every square metre of a Tamil Nadu terrace, every single day. Right now it only heats the slab.',
  },
  {
    title: 'Panels catch it',
    text: 'Tier-1 panels on an elevated, galvanised structure. Your terrace stays usable underneath — and the shade keeps the top floor cooler.',
  },
  {
    title: 'The inverter converts it',
    text: 'Panels make DC. The inverter turns it into clean AC for your home, and logs every unit to an app on your phone.',
  },
  {
    title: 'Your home runs on it',
    text: 'Fans, fridge, lights, AC — solar power is used first. The grid only tops up whatever the sun can’t cover.',
  },
  {
    title: 'The meter runs backwards',
    text: 'Surplus flows out through a bi-directional net meter. Every exported unit is credited against your next EB bill.',
  },
]

// Where each step starts on the (abstract) timeline
const AT = [0, 2.2, 4.8, 6.4, 8.0, 10]

// Energy sparks per cable — they ride the same paths as the dashed flows
const SPARKS = { dc: 5, ac: 2, home: 3, grid: 5 }

const homeAnchor = P(5, 8, 1.75)

/** Callouts live outside the camera; they ride along with their anchor point. */
function Callout({ at, to, title, sub, className }) {
  const [ax, ay] = at
  const [lx, ly] = to
  const right = lx >= ax
  const tx = lx + (right ? 18 : -18)
  return (
    <g data-follow="" data-ax={ax} data-ay={ay}>
      <g className={`callout ${className}`}>
        <circle cx={ax} cy={ay} r="3.5" className="callout__dot" />
        <polyline points={`${ax},${ay} ${lx},${ly} ${lx + (right ? 12 : -12)},${ly}`} className="callout__line" />
        <text x={tx} y={ly - 3} textAnchor={right ? 'start' : 'end'} className="callout__title">
          {title}
        </text>
        {sub && (
          <text x={tx} y={ly + 12} textAnchor={right ? 'start' : 'end'} className="callout__sub">
            {sub}
          </text>
        )}
      </g>
    </g>
  )
}

export default function HowItWorks() {
  const root = useRef(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const steps = q('.how__step')
      const segs = q('.how__seg i')
      const digits = q('.meter-digits')[0]
      const kwText = q('.inv-kw')[0]
      const reading = { v: 4217, kw: 0 }
      const isMobile = window.matchMedia('(max-width: 899px)').matches
      const reduce = prefersReducedMotion()

      gsap.set(q('.ray, .leg'), { strokeDasharray: 1, strokeDashoffset: 1 })
      gsap.set(q('.panel'), { y: -80, autoAlpha: 0 })
      gsap.set(q('.flow, .halo, .win-lit, .callout, .roof-heat, .glint, .arr-shadow, .sky, .sweep'), { autoAlpha: 0 })
      gsap.set(q('.credit'), { autoAlpha: 0, y: 12, scale: 0.7, transformOrigin: '50% 50%' })
      gsap.set(q('.sky-sun'), { y: 70, x: 30, autoAlpha: 0 })
      gsap.set(steps.slice(1), { autoAlpha: 0, y: 44 })

      // ── Camera: zoom/pan the whole scene; callouts ride along with their anchors
      const cam = q('.cam')[0]
      const [CX, CY] = VIEW_CENTRE
      const view = { s: 1, fx: CX, fy: CY }
      const followers = q('[data-follow]').map((el) => ({ el, ax: +el.dataset.ax, ay: +el.dataset.ay }))
      const applyCam = () => {
        cam.setAttribute('transform', `translate(${CX} ${CY}) scale(${view.s}) translate(${-view.fx} ${-view.fy})`)
        followers.forEach(({ el, ax, ay }) => {
          const tx = CX + view.s * (ax - view.fx) - ax
          const ty = CY + view.s * (ay - view.fy) - ay
          el.setAttribute('transform', `translate(${tx.toFixed(1)} ${ty.toFixed(1)})`)
        })
      }
      applyCam()

      const tl = gsap.timeline({ defaults: { ease: 'none' } })
      const shot = (s, [fx, fy], at, duration = 1.1) =>
        tl.to(view, { s, fx, fy, duration, ease: 'power2.inOut', onUpdate: applyCam }, at)

      const swap = (i) => {
        tl.to(steps[i - 1], { autoAlpha: 0, y: -44, duration: 0.35, ease: 'power2.in' }, AT[i])
        tl.to(steps[i], { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, AT[i] + 0.3)
      }

      segs.forEach((seg, i) => tl.fromTo(seg, { scaleX: 0 }, { scaleX: 1, duration: AT[i + 1] - AT[i] }, AT[i]))

      // 1 · Sunlight lands — morning: the sun rises, the sky warms, rays strike the slab
      tl.to(q('.sky-sun'), { x: 0, y: 0, autoAlpha: 1, duration: 1.2, ease: 'power2.out' }, 0)
        .to(q('.sky--day'), { autoAlpha: 1, duration: 1.2 }, 0)
        .to(q('.ray'), { strokeDashoffset: 0, duration: 1, stagger: 0.12, ease: 'power2.out' }, 0.25)
        .to(q('.roof-heat'), { autoAlpha: 1, duration: 0.9 }, 0.9)
        .to(q('.callout--roof'), { autoAlpha: 1, duration: 0.3 }, 1.2)
      shot(1.14, focus.roof, 0.1, 1.6)

      // 2 · Panels catch it
      swap(1)
      shot(1.3, focus.array, AT[1])
      tl.to(q('.callout--roof'), { autoAlpha: 0, duration: 0.3 }, AT[1])
        .to(q('.ray'), { opacity: 0.35, duration: 0.6 }, AT[1])
        .to(q('.leg'), { strokeDashoffset: 0, duration: 0.7, stagger: 0.02, ease: 'power2.out' }, AT[1] + 0.1)
        .to(q('.panel'), { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.12, ease: 'power3.out' }, AT[1] + 0.5)
        .to(q('.arr-shadow'), { autoAlpha: 1, duration: 0.6 }, AT[1] + 1.1)
        .to(q('.roof-heat'), { autoAlpha: 0, duration: 0.8 }, AT[1] + 1.2)
        .to(q('.glint'), { autoAlpha: 0.85, duration: 0.25, stagger: 0.06, yoyo: true, repeat: 1 }, AT[1] + 1.7)
        .fromTo(q('.sweep'), { x: 360, autoAlpha: 1 }, { x: 720, duration: 0.8, ease: 'power1.inOut' }, AT[1] + 1.9)
        .set(q('.sweep'), { autoAlpha: 0 }, AT[1] + 2.7)
        .to(q('.callout--panels'), { autoAlpha: 1, duration: 0.3 }, AT[1] + 2)

      // 3 · The inverter converts it
      swap(2)
      shot(1.36, focus.inverter, AT[2])
      tl.to(q('.flow--dc, .halo--dc'), { autoAlpha: 1, duration: 0.4 }, AT[2] + 0.1)
        .fromTo(q('.sweep'), { x: 360, autoAlpha: 1 }, { x: 720, duration: 0.7, ease: 'power1.inOut', immediateRender: false }, AT[2] + 0.15)
        .set(q('.sweep'), { autoAlpha: 0 }, AT[2] + 0.85)
        .to(q('.led'), { fill: '#3ddc84', duration: 0.1 }, AT[2] + 0.5)
        .to(q('.inv-screen'), { fill: '#16351f', duration: 0.2 }, AT[2] + 0.5)
        .to(q('.callout--inverter'), { autoAlpha: 1, duration: 0.3 }, AT[2] + 0.6)
        .to(
          reading,
          { kw: 3.8, duration: 0.9, onUpdate: () => (kwText.textContent = reading.kw.toFixed(1)) },
          AT[2] + 0.6,
        )

      // 4 · Your home runs on it — dusk falls so the lit windows glow
      swap(3)
      shot(1.08, focus.house, AT[3])
      tl.to(q('.flow--ac, .flow--home, .halo--ac, .halo--home'), { autoAlpha: 1, duration: 0.4 }, AT[3] + 0.1)
        .to(q('.sky--dusk'), { autoAlpha: 1, duration: 1 }, AT[3])
        .to(q('.sky--day'), { autoAlpha: 0.25, duration: 1 }, AT[3])
        .to(q('.sky-sun'), { y: 46, x: -14, duration: 1.2, ease: 'power1.inOut' }, AT[3])
        .to(q('.sky-sun__core'), { fill: '#ff5a1f', duration: 1.2 }, AT[3])
        .to(q('.ray'), { opacity: 0.12, duration: 0.8 }, AT[3])
        .to(q('.win-lit'), { autoAlpha: 1, duration: 0.3, stagger: 0.08 }, AT[3] + 0.3)
        .to(q('.callout--home'), { autoAlpha: 1, duration: 0.3 }, AT[3] + 0.6)

      // 5 · The meter runs backwards
      swap(4)
      shot(1.24, focus.export, AT[4])
      tl.to(q('.flow--grid, .halo--grid'), { autoAlpha: 1, duration: 0.4 }, AT[4] + 0.1)
        .to(q('.callout--home'), { autoAlpha: 0.3, duration: 0.3 }, AT[4])
        .to(q('.callout--grid, .callout--meter'), { autoAlpha: 1, duration: 0.3 }, AT[4] + 0.3)
        .to(
          reading,
          {
            v: 3986,
            duration: 1.4,
            onUpdate: () => (digits.textContent = String(Math.round(reading.v)).padStart(5, '0')),
          },
          AT[4] + 0.3,
        )
        .to(q('.credit'), { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(2)' }, AT[4] + 1)
      // …then pull back for the whole picture
      shot(1, VIEW_CENTRE, AT[5] - 0.75, 0.75)
      tl.to(q('.callout--home'), { autoAlpha: 1, duration: 0.3 }, AT[5] - 0.5)

      const pin = gsap.timeline({
        scrollTrigger: {
          trigger: q('.how__pin')[0],
          start: 'top top',
          end: () => `+=${window.innerHeight * (isMobile ? 3.8 : 4.8)}`,
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
      pin.add(tl)

      if (reduce) return

      // ── Life: drifting clouds, a swaying palm, a small flock (only while on screen)
      const ambient = gsap.timeline({ paused: true })
      q('.cloud').forEach((c, i) =>
        ambient.to(c, { x: i % 2 ? -38 : 42, duration: 14 + i * 4, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0),
      )
      const [crx, cry] = palm.crown
      ambient
        .to(q('.palm'), { rotation: 1.1, svgOrigin: '0 0', duration: 3.4, ease: 'sine.inOut', yoyo: true, repeat: -1 }, 0)
        .fromTo(
          q('.palm__crown'),
          { rotation: -2.6 },
          { rotation: 3, svgOrigin: `${crx} ${cry}`, duration: 2.3, ease: 'sine.inOut', yoyo: true, repeat: -1 },
          0,
        )
        .fromTo(q('.flock'), { x: -120 }, { x: 980, duration: 26, ease: 'none', repeat: -1 }, 0)
      q('.bird').forEach((b, i) =>
        ambient.to(b, { scaleY: -0.35, transformOrigin: '50% 50%', duration: 0.22 + i * 0.03, ease: 'sine.inOut', yoyo: true, repeat: -1 }, i * 0.1),
      )

      // ── Sparks riding the energised cables, in the direction power flows
      const flows = Object.keys(SPARKS).map((k) => {
        const path = q(`.flow--${k}`)[0]
        return { path, dots: q(`.spark--${k}`), len: path.getTotalLength() }
      })
      let clock = 0
      const tick = (_, dt) => {
        clock += Math.min(dt, 50) / 1000
        flows.forEach(({ path, dots, len }) => {
          const alpha = Number(gsap.getProperty(path, 'opacity')) || 0
          dots.forEach((dot, i) => {
            if (alpha < 0.02) {
              dot.style.opacity = 0
              return
            }
            const u = ((clock * 95) / len + i / dots.length) % 1
            const pt = path.getPointAtLength(u * len)
            dot.setAttribute('cx', pt.x.toFixed(1))
            dot.setAttribute('cy', pt.y.toFixed(1))
            dot.style.opacity = alpha * Math.min(1, Math.sin(Math.PI * u) * 3)
          })
        })
      }

      let live = false
      const setLive = (on) => {
        if (on === live) return
        live = on
        if (on) {
          ambient.play()
          gsap.ticker.add(tick)
        } else {
          ambient.pause()
          gsap.ticker.remove(tick)
        }
      }
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => setLive(self.isActive),
      })

      return () => gsap.ticker.remove(tick)
    },
    { scope: root },
  )

  return (
    <section ref={root} id="how" className="how" data-tone="dark">
      <div className="how__pin">
        <div className="how__copy">
          <Label index="01">How it works</Label>
          <h2 className="how__title">
            Five things happen between sunrise and a <em>smaller bill.</em>
          </h2>

          <div className="how__steps">
            {STEPS.map((s, i) => (
              <article className="how__step" key={s.title}>
                <p className="how__num">
                  <span>0{i + 1}</span>
                  <small>/ 05</small>
                </p>
                <h3 className="how__step-title">{s.title}</h3>
                <p className="how__step-text">{s.text}</p>
              </article>
            ))}
          </div>

          <div className="how__progress" aria-hidden="true">
            {STEPS.map((s) => (
              <span className="how__seg" key={s.title}>
                <i />
              </span>
            ))}
          </div>
        </div>

        <div className="how__scene">
          <svg
            className="how__svg"
            viewBox="110 30 870 680"
            role="img"
            aria-label="An isometric house: sunlight lands on the terrace, solar panels collect it, the inverter converts it, the home uses it and the surplus flows to the grid through a net meter."
          >
            <defs>
              <radialGradient id="how-fade" cx="50%" cy="60%" r="52%">
                <stop offset="0.35" stopColor="#fff" />
                <stop offset="1" stopColor="#000" />
              </radialGradient>
              <mask id="how-mask">
                <rect x="110" y="30" width="870" height="680" fill="url(#how-fade)" />
              </mask>
              <linearGradient id="how-ray" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffb23f" stopOpacity="0" />
                <stop offset="1" stopColor="#ffd27a" stopOpacity="0.95" />
              </linearGradient>
              <linearGradient id="how-panel" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#2a4270" />
                <stop offset="1" stopColor="#0e1729" />
              </linearGradient>
              <linearGradient id="how-glint" x1="0" y1="0" x2="1" y2="0.6">
                <stop offset="0.25" stopColor="#fff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#fff" stopOpacity="0.7" />
                <stop offset="0.75" stopColor="#fff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="how-sweep" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#fff4d6" stopOpacity="0" />
                <stop offset="0.5" stopColor="#fff4d6" stopOpacity="0.55" />
                <stop offset="1" stopColor="#fff4d6" stopOpacity="0" />
              </linearGradient>
              <radialGradient id="how-heat" cx="50%" cy="50%" r="60%">
                <stop offset="0" stopColor="#ff7a2e" stopOpacity="0.85" />
                <stop offset="1" stopColor="#ff5a1f" stopOpacity="0.15" />
              </radialGradient>
              <linearGradient id="how-tank" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#2b2b2e" />
                <stop offset="0.45" stopColor="#141416" />
                <stop offset="1" stopColor="#060607" />
              </linearGradient>
              <radialGradient id="how-sky-day" cx="50%" cy="0%" r="50%" fx="36%" fy="6%">
                <stop offset="0" stopColor="#ff8a3d" stopOpacity="0.2" />
                <stop offset="0.55" stopColor="#ff8a3d" stopOpacity="0.05" />
                <stop offset="1" stopColor="#ff8a3d" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="how-sky-dusk" cx="50%" cy="0%" r="50%" fx="58%" fy="4%">
                <stop offset="0" stopColor="#8a2d5c" stopOpacity="0.28" />
                <stop offset="0.5" stopColor="#c2410c" stopOpacity="0.08" />
                <stop offset="1" stopColor="#c2410c" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="how-sun-halo">
                <stop offset="0" stopColor="#ffb23f" stopOpacity="0.5" />
                <stop offset="0.35" stopColor="#ff7a2e" stopOpacity="0.18" />
                <stop offset="1" stopColor="#ff5a1f" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="how-trunk" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#6b5440" />
                <stop offset="1" stopColor="#33271c" />
              </linearGradient>
              <clipPath id="how-array-clip">
                {panels.map((p) => (
                  <polygon key={p.key} points={p.shape} />
                ))}
              </clipPath>
              {/* Glows and the soft shadow are gradients, not blur filters: an SVG filter is re-rendered on
                  every frame that anything under it moves, which made this scene stutter */}
              <radialGradient id="how-spark">
                <stop offset="0" stopColor="#fff6dc" />
                <stop offset="0.35" stopColor="#ffd98a" stopOpacity="0.55" />
                <stop offset="1" stopColor="#ffb23f" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="how-ao">
                <stop offset="0" stopColor="#000" stopOpacity="0.6" />
                <stop offset="0.45" stopColor="#000" stopOpacity="0.38" />
                <stop offset="0.72" stopColor="#000" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Sky tint — fixed to the frame, not the camera */}
            <rect className="sky sky--day" x="110" y="30" width="870" height="680" fill="url(#how-sky-day)" />
            <rect className="sky sky--dusk" x="110" y="30" width="870" height="680" fill="url(#how-sky-dusk)" />

            <g className="cam">
              {/* Sky life */}
              <g className="sky-sun">
                <circle cx={skySun.x} cy={skySun.y} r={skySun.r * 4.2} fill="url(#how-sun-halo)" />
                <circle className="sky-sun__core" cx={skySun.x} cy={skySun.y} r={skySun.r} />
              </g>
              {clouds.map((c) => (
                <g key={c.x} transform={`translate(${c.x} ${c.y}) scale(${c.s})`}>
                  <path className="cloud" d={CLOUD_PATH} />
                </g>
              ))}
              <g transform="translate(0 108)">
                <g className="flock">
                  {birds.map((b) => (
                    <g key={b.x} transform={`translate(${b.x} ${b.y}) scale(${b.s})`}>
                      <path className="bird" d="M-6,0 Q-3,-4 0,0 Q3,-4 6,0" />
                    </g>
                  ))}
                </g>
              </g>

              <g className="ground" mask="url(#how-mask)">
                {groundLines.map((l, i) => (
                  <line key={i} {...l} />
                ))}
              </g>
              <polygon className="ao" points={footprintShadow} />

              {/* Terrace interior */}
              <polygon className="h-floor" points={house.floor} />
              <polygon className="roof-heat" points={house.heat} fill="url(#how-heat)" />
              <polygon className="h-inner-back" points={house.innerBack} />
              <polygon className="h-inner-left" points={house.innerLeft} />

              {/* Walls */}
              <polygon className="h-wall-l" points={house.leftWall} />
              <polygon className="h-wall-r" points={house.rightWall} />
              <path className="h-line" d={house.band} />
              <path className="h-line" d={house.plinth} />

              {windows.map((w) => (
                <g key={w.key}>
                  <polygon className={w.door ? 'h-door' : 'h-win'} points={w.shape} />
                  {w.mullion && <line className="h-mullion" {...w.mullion} />}
                  {!w.door && <polygon className="win-lit" points={w.shape} />}
                  {!w.door && <polygon className="h-shade-top" points={w.shadeTop} />}
                  {!w.door && <polygon className="h-shade-edge" points={w.shadeEdge} />}
                </g>
              ))}

              <path className="h-rim" d={house.rim} fillRule="evenodd" />

              {/* Staircase room + water tank */}
              <polygon className="m-left" points={mumty.left} />
              <polygon className="m-right" points={mumty.right} />
              <polygon className="m-top" points={mumty.top} />
              <polygon className="h-door" points={mumty.door} />
              <path className="tank" d={tank.body} />
              {tank.ribs.map((d) => (
                <path key={d} className="tank-rib" d={d} />
              ))}
              <ellipse className="tank-top" {...tank.top} />
              <ellipse className="tank-lid" {...tank.lid} />

              {/* Elevated structure + panels */}
              {arrayShadow.map((s) => (
                <polygon key={s} className="arr-shadow" points={s} />
              ))}
              {structure.map((l, i) => (
                <line key={i} className="leg" pathLength="1" {...l} />
              ))}
              {panels.map((p) => (
                <g key={p.key} className="panel">
                  <polygon className="p-face" points={p.shape} />
                  {p.cells.map((c, i) => (
                    <line key={i} className="p-cell" {...c} />
                  ))}
                  <polygon className="glint" points={p.shape} />
                  <polygon className="p-frame" points={p.shape} />
                </g>
              ))}
              <g clipPath="url(#how-array-clip)">
                <rect className="sweep" x="0" y="120" width="54" height="200" fill="url(#how-sweep)" transform="skewX(-24)" />
              </g>

              {/* Inverter + net meter */}
              <polygon className="inv-side" points={inverter.side} />
              <polygon className="inv-top" points={inverter.top} />
              <polygon className="inv-front" points={inverter.front} />
              <polygon className="inv-screen" points={inverter.screen} />
              {inverter.vents.map((v, i) => (
                <line key={i} className="inv-vent" {...v} />
              ))}
              <circle className="led" cx={inverter.led[0]} cy={inverter.led[1]} r="2.6" />

              <polygon className="mt-side" points={meter.side} />
              <polygon className="mt-top" points={meter.top} />
              <polygon className="mt-front" points={meter.front} />
              <polygon className="mt-screen" points={meter.screen} />
              <text className="meter-digits" transform={meter.textMatrix} fontSize="10">
                04217
              </text>

              {/* Coconut palm beside the house */}
              <g className="palm-base" transform={`translate(${palm.x} ${palm.y})`}>
                <g className="palm">
                  <path className="palm__trunk" d={palm.trunk} fill="url(#how-trunk)" />
                  {palm.rings.map((r, i) => (
                    <line key={i} className="palm__ring" {...r} />
                  ))}
                  <g className="palm__crown">
                    {palm.fronds.map((f) => (
                      <g key={f.key} className={`palm__frond palm__frond--${f.tone}`}>
                        <path d={f.blade} />
                        <path className="palm__rib" d={f.rib} />
                      </g>
                    ))}
                    {palm.nuts.map(([x, y]) => (
                      <circle key={x} className="palm__nut" cx={x} cy={y} r="4.2" />
                    ))}
                  </g>
                </g>
              </g>

              {/* Cables, then the energy flowing through them */}
              <path className="cable" d={cables.dc} />
              <path className="cable" d={cables.ac} />
              <path className="cable" d={cables.home} />
              <path className="cable cable--wire" d={gridPath} />
              <path className="halo halo--dc" d={cables.dc} />
              <path className="halo halo--ac" d={cables.ac} />
              <path className="halo halo--home" d={cables.home} />
              <path className="halo halo--grid" d={gridPath} />
              <path className="flow flow--dc" d={cables.dc} />
              <path className="flow flow--ac" d={cables.ac} />
              <path className="flow flow--home" d={cables.home} />
              <path className="flow flow--grid" d={gridPath} />
              {Object.entries(SPARKS).map(([k, n]) =>
                Array.from({ length: n }, (_, i) => (
                  <circle key={`${k}${i}`} className={`spark spark--${k}`} r="6" cx="-20" cy="-20" />
                )),
              )}

              {/* Utility pole */}
              <line className="pole" {...pole.shaft} />
              <line className="pole-arm" {...pole.arm} />
              {pole.lines.map((d) => (
                <path key={d} className="cable cable--wire" d={d} />
              ))}
              {pole.insulators.map(([cx, cy], i) => (
                <circle key={i} className="insulator" cx={cx} cy={cy} r="2.6" />
              ))}

              {/* Sunlight */}
              {rays.map((r) => (
                <line key={r.key} className="ray" pathLength="1" x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />
              ))}
            </g>

            {/* Callouts (outside the camera so text never scales) */}
            <Callout className="callout--roof" at={anchors.roof} to={[640, 128]} title="≈ 5 kWh / m² / day" sub="Free, every day" />
            <Callout className="callout--panels" at={anchors.panels} to={[720, 150]} title="8 × 550 W panels" sub="4.4 kWp · 12° tilt" />
            <Callout
              className="callout--inverter"
              at={anchors.inverter}
              to={[640, 610]}
              title="Inverter"
              sub={
                <>
                  DC → AC · <tspan className="inv-kw">0.0</tspan> kW now
                </>
              }
            />
            <Callout className="callout--home" at={homeAnchor} to={[300, 585]} title="Used first, at home" sub="Fans · lights · AC" />
            <Callout className="callout--meter" at={anchors.meter} to={[812, 476]} title="Net meter" sub="Counts both ways" />
            <Callout className="callout--grid" at={anchors.grid} to={[812, 150]} title="Surplus → grid" sub="Credited to your bill" />

            <g data-follow="" data-ax={anchors.meter[0]} data-ay={anchors.meter[1]}>
              <g transform={`translate(${anchors.meter[0] + 30} ${anchors.meter[1] - 64})`}>
                <g className="credit">
                  <rect x="0" y="-14" width="156" height="28" rx="14" />
                  <text x="78" y="4" textAnchor="middle">
                    −231 units this month
                  </text>
                </g>
              </g>
            </g>
          </svg>
        </div>
      </div>
    </section>
  )
}
