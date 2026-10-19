import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { CALC } from '../config'
import Landscape from './Landscape'
import './Earth.css'

// What one kW of panels does in a year, from the same assumptions as the calculator
const KG_CO2 = CALC.unitsPerKwDay * 365 * CALC.co2PerUnit
const TONNES = (KG_CO2 / 1000).toFixed(1)
const TREES = Math.round(KG_CO2 / CALC.treeCo2PerYear)

// Scene units: y 0 (bottom) … 1 (top), x 0 … width / height. The sun clears the far peaks on the right.
const earthLayout = (w, h) => {
  const aspect = w / h
  return aspect < 0.9
    ? { horizon: 0.34, scale: 0.62, sun: [aspect * 0.78, 0.6, 0.04, 0.28], house: [aspect * 0.6, 0.11] }
    : { horizon: 0.4, scale: 0.92, sun: [aspect * 0.78, 0.8, 0.05, 0.32], house: [aspect * 0.66, 0.1] }
}

// The corner clock walks the morning from 05:40 to 07:50 as you scroll
const clock = (p) => {
  const m = Math.round(340 + p * 130)
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

const BIRDS = [
  { x: 0, y: 0, s: 22 },
  { x: -3.2, y: 2.2, s: 17 },
  { x: -5.4, y: -1.6, s: 19 },
  { x: -7.8, y: 3.8, s: 14 },
  { x: -9.6, y: 0.9, s: 16 },
]

export default function Earth() {
  const root = useRef(null)
  const scene = useRef({ rise: 0, day: 0, mist: 1, cam: 0 }).current
  const clockRef = useRef(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      if (prefersReducedMotion()) {
        Object.assign(scene, { rise: 1, day: 1, mist: 0.5, cam: 0.5 })
        return
      }

      // Birds and the shader only animate while the section is on screen
      ScrollTrigger.create({ trigger: root.current, start: 'top bottom', end: 'bottom top', toggleClass: 'is-live' })

      // The section is a long scroll with a sticky stage: scrolling plays the sunrise
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.8,
            onUpdate: (self) => {
              if (clockRef.current) clockRef.current.textContent = clock(self.progress)
            },
          },
        })
        .to(scene, { rise: 1, duration: 0.62, ease: 'power1.inOut' }, 0)
        .to(scene, { day: 1, duration: 0.68, ease: 'power1.inOut' }, 0.12)
        .to(scene, { mist: 0.4, duration: 0.8 }, 0.15)
        .to(scene, { cam: 1, duration: 1 }, 0)
        .from(q('.earth__line--1 > span'), { yPercent: 115, rotate: 3, duration: 0.12, ease: 'power3.out' }, 0.02)
        .from(q('.earth__line--2 > span'), { yPercent: 115, rotate: 3, duration: 0.12, ease: 'power3.out' }, 0.4)
        .from(q('.earth__birds'), { opacity: 0, duration: 0.1 }, 0.42)
        .from(q('.earth__sub, .earth__stat, .earth__link'), { y: 34, opacity: 0, duration: 0.12, stagger: 0.035, ease: 'power3.out' }, 0.6)
    },
    { scope: root },
  )

  return (
    <section ref={root} id="earth" className="earth" data-tone="light" aria-labelledby="earth-title">
      <div className="earth__stage">
        <Landscape className="earth__scene" layout={earthLayout} state={scene} />

        <div className="earth__birds" aria-hidden="true">
          {BIRDS.map((b, i) => (
            <span key={i} className="bird" style={{ '--x': `${b.x}vw`, '--y': `${b.y}vh`, '--s': `${b.s}px`, '--i': i }}>
              <svg viewBox="0 0 24 10">
                <path d="M1 6 Q6.5 0 12 6 Q17.5 0 23 6" />
              </svg>
            </span>
          ))}
        </div>

        <div className="earth__copy container">
          <h2 id="earth-title" className="earth__title">
            <span className="earth__line earth__line--1">
              <span>
                Use <em className="earth__solar">solar</em> energy.
              </span>
            </span>
            <span className="earth__line earth__line--2">
              <span>
                Save green <em className="earth__green">earth.</em>
              </span>
            </span>
          </h2>
          <p className="earth__sub">Clean power from your own roof — no smoke, no noise, and no fuel bill from the sun.</p>
          <dl className="earth__stats">
            <div className="earth__stat">
              <dt>CO₂ kept out of the air, per kW, every year</dt>
              <dd>{TONNES} t</dd>
            </div>
            <div className="earth__stat">
              <dt>Trees’ worth of clean air, per kW</dt>
              <dd>{TREES}</dd>
            </div>
          </dl>
          <a href="#calculator" className="earth__link mono">
            <span className="ulink">See what your roof could save</span> →
          </a>
        </div>

        <p className="earth__clock mono" aria-hidden="true">
          <i /> <span ref={clockRef}>05:40</span> IST · Sunrise over the hills
        </p>
      </div>
    </section>
  )
}
