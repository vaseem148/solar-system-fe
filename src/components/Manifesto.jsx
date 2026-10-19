import { useRef } from 'react'
import { gsap, SplitText, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { MotionPathPlugin } from 'gsap/MotionPathPlugin'
import Label from './ui/Label'
import Odometer from './ui/Odometer'
import './Manifesto.css'

gsap.registerPlugin(MotionPathPlugin)

const STATS = [
  { value: '78,000', prefix: '₹', unit: '', label: 'Central subsidy on a 3 kW home system', note: '¹' },
  { value: '4', unit: 'units', label: 'Made by every 1 kW of panels, every day, under our sun' },
  { text: '3–5', unit: 'yrs', label: 'Typical payback. After that, the power is free.' },
  { value: '25', unit: 'yrs', label: 'Panel performance warranty — longer than most home loans' },
]

// The sun's daily path drawn behind the paragraph: 06:00 on the left, noon at the top, 18:00 on the right
const ARC = { cx: 800, cy: 720, rx: 700, ry: 640 }
const ARC_D = `M${ARC.cx - ARC.rx} ${ARC.cy} A${ARC.rx} ${ARC.ry} 0 0 1 ${ARC.cx + ARC.rx} ${ARC.cy}`
// Every two hours gets a tick, but only sunrise, noon and sunset are labelled — the others would land on
// the paragraph. Noon's label sits above the arc; sunrise and sunset sit just inside its feet, clear of the
// stats' rules below.
const HOURS = [6, 8, 10, 12, 14, 16, 18].map((h) => {
  const t = Math.PI * (1 - (h - 6) / 12)
  const x = ARC.cx + ARC.rx * Math.cos(t)
  const y = ARC.cy - ARC.ry * Math.sin(t)
  const nx = Math.cos(t)
  const ny = -Math.sin(t)
  const label = {
    6: { x: x + 24, y: y - 18, anchor: 'start' },
    12: { x, y: y - 50, anchor: 'middle' },
    18: { x: x - 24, y: y - 18, anchor: 'end' },
  }[h]
  return { h, x1: x + nx * 10, y1: y + ny * 10, x2: x + nx * 28, y2: y + ny * 28, label }
})

// What each word settles to once lit
const settleColour = (word) =>
  word.closest('.pill') ? '#0d0c0a' : word.closest('.serif') ? '#ff5a1f' : '#14120f'

export default function Manifesto() {
  const root = useRef(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const text = q('.manifesto__text')[0]
      if (prefersReducedMotion()) return

      const range = { trigger: text, start: 'top 80%', end: 'bottom 45%' }

      // Words light up in reading order: a warm flash, then they settle
      SplitText.create(text, {
        type: 'words',
        wordsClass: 'mf-word',
        autoSplit: true,
        onSplit: (self) => {
          const tl = gsap.timeline({ scrollTrigger: { ...range, scrub: true } })
          self.words.forEach((w, i) => {
            const at = i * 0.12
            tl.fromTo(w, { opacity: 0.12 }, { opacity: 1, duration: 0.35, ease: 'none' }, at).fromTo(
              w,
              { color: '#ffb23f' },
              { color: settleColour(w), duration: 0.7, ease: 'none' },
              at + 0.2,
            )
          })
          return tl
        },
      })

      // The sun-path arc draws itself and a small sun travels along it as you read
      const arc = q('.sunpath__arc')[0]
      gsap
        .timeline({ scrollTrigger: { ...range, scrub: 0.6 } })
        .fromTo(q('.sunpath__reveal'), { strokeDashoffset: 1 }, { strokeDashoffset: 0, ease: 'none', duration: 1 }, 0)
        .fromTo(q('.sunpath__tick'), { opacity: 0 }, { opacity: 1, duration: 0.1, stagger: 0.15, ease: 'none' }, 0.02)
        .fromTo(q('.sunpath__sun'), { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0)
        .to(
          q('.sunpath__sun'),
          { motionPath: { path: arc, align: arc, alignOrigin: [0.5, 0.5] }, ease: 'none', duration: 1 },
          0,
        )

      // Inline pills drift a little against the text, then pop in when reached
      q('.pill').forEach((pill, i) => {
        gsap.to(pill, { y: i % 2 ? 12 : -16, ease: 'none', scrollTrigger: { ...range, end: 'bottom 30%', scrub: true } })
        gsap.from(pill, {
          scale: 0,
          rotate: -24,
          duration: 1.2,
          ease: 'back.out(1.7)',
          scrollTrigger: { trigger: pill, start: 'top 82%', toggleActions: 'play none none reverse' },
        })
      })

      // Stats: the rule draws, then the numbers roll in on their own (Odometer)
      q('.stat').forEach((stat) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: stat, start: 'top 88%', once: true } })
        tl.from(stat.querySelector('.stat__rule'), { scaleX: 0, duration: 1.6, ease: 'expo.inOut' })
          .from(stat.querySelectorAll('.stat__value, .stat__label'), { y: 26, opacity: 0, duration: 1.1, stagger: 0.08 }, 0.15)
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="story" className="manifesto section" data-tone="light">
      <div className="container">
        <Label index="01" className="manifesto__label">
          Why solar, why now
        </Label>

        <div className="manifesto__body">
          <svg className="sunpath" viewBox="0 0 1600 760" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <defs>
              <mask id="sunpath-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1600" height="760">
                <path className="sunpath__reveal" d={ARC_D} pathLength="1" />
              </mask>
              <radialGradient id="sunpath-glow">
                <stop offset="0" stopColor="#ffb23f" stopOpacity="0.75" />
                <stop offset="0.45" stopColor="#ff7a2e" stopOpacity="0.22" />
                <stop offset="1" stopColor="#ff5a1f" stopOpacity="0" />
              </radialGradient>
            </defs>
            <path className="sunpath__arc" d={ARC_D} mask="url(#sunpath-mask)" />
            {HOURS.map((t) => (
              <g key={t.h} className="sunpath__tick">
                <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} />
                {t.label && (
                  <text x={t.label.x} y={t.label.y} textAnchor={t.label.anchor}>
                    {String(t.h).padStart(2, '0')}:00
                  </text>
                )}
              </g>
            ))}
            <g className="sunpath__sun">
              <circle r="46" fill="url(#sunpath-glow)" />
              <circle r="11" className="sunpath__core" />
            </g>
          </svg>

          <p className="manifesto__text">
            Sunlight travels <span className="pill pill--sun" aria-hidden="true" /> 150 million kilometres to reach
            your terrace. Then it heats the tiles, dries the clothes and <em className="serif">quietly disappears.</em>{' '}
            We’d rather put it to work — panels <span className="pill pill--panel" aria-hidden="true" /> built for
            Indian summers, a structure that shrugs off cyclones, and an EB bill{' '}
            <span className="pill pill--bill" aria-hidden="true">
              <b>₹0</b>
            </span>{' '}
            so small you’ll check it twice.
          </p>
        </div>

        <ul className="stats">
          {STATS.map((s) => (
            <li className="stat" key={s.label}>
              <span className="stat__rule" aria-hidden="true" />
              <p className="stat__value">
                {s.prefix && <span className="stat__prefix">{s.prefix}</span>}
                {s.text ? <span>{s.text}</span> : <Odometer value={s.value} mode="enter" duration={1.8} />}
                {s.unit && <small>{s.unit}</small>}
              </p>
              <p className="stat__label">
                {s.label}
                {s.note && <sup>{s.note}</sup>}
              </p>
            </li>
          ))}
        </ul>

        <p className="manifesto__foot mono">
          ¹ Under PM Surya Ghar: Muft Bijli Yojana — ₹30,000/kW for the first 2 kW, ₹18,000 for the 3rd. Residential
          only.
        </p>
      </div>
    </section>
  )
}
