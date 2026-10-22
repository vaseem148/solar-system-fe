import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import Label from './ui/Label'
import { Check } from './ui/Icons'
import './FinePrint.css'

const ROWS = [
  { k: 'Panels', v: 'Tier-1 mono-PERC / TOPCon modules with a 25-year linear performance warranty.' },
  { k: 'Inverter', v: 'On-grid or hybrid, from established makers. 5–10 year warranty and live monitoring on your phone.' },
  { k: 'Structure', v: 'Hot-dip galvanised steel, designed for 150 km/h coastal winds. No rust streaks on your walls.' },
  { k: 'Paperwork', v: 'National portal, DISCOM approval, net meter and subsidy claim — filed by us, end to end.' },
  { k: 'Service', v: 'Free check-ups in year one. A real engineer at your door within 48 hours, whenever you need one.' },
  { k: 'Price', v: 'One fixed quote, GST included. No “extra structure” or “extra cable” surprises after installation.' },
]

export default function FinePrint() {
  const root = useRef(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const rows = q('.spec__row')

      // Gauge beside the sticky heading: the orange fill tracks your way down the list
      gsap.fromTo(
        q('.promise__fill'),
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: q('.spec')[0], start: 'top 60%', end: 'bottom 60%', scrub: 0.6 },
        },
      )

      // `is-in` hands the hover transforms back to CSS once a row has landed
      if (prefersReducedMotion()) {
        rows.forEach((row) => row.classList.add('is-in'))
        return
      }

      rows.forEach((row) => {
        const ok = row.querySelector('.spec__ok')
        const tick = ok.querySelector('path')
        tick.setAttribute('pathLength', '1')

        gsap
          .timeline({
            scrollTrigger: { trigger: row, start: 'top 90%', once: true },
            onComplete: () => row.classList.add('is-in'),
          })
          .from(row.querySelector('.spec__rule'), { scaleX: 0, duration: 1.4, ease: 'expo.inOut' })
          .from(
            row.querySelectorAll('.spec__idx, .spec__k, .spec__v'),
            { y: 30, opacity: 0, duration: 1, stagger: 0.07, clearProps: 'transform' },
            0.25,
          )
          // The circle pops in, then its tick is drawn
          .fromTo(
            ok,
            { scale: 0.4, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(2.4)', clearProps: 'transform' },
            0.5,
          )
          .fromTo(
            tick,
            { strokeDasharray: '1 2', strokeDashoffset: 1.02 },
            { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' },
            0.68,
          )
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="promise" className="promise section" data-tone="light">
      <div className="container promise__grid">
        <header className="promise__head">
          <Label index="02">Our promise</Label>
          <h2 className="title" data-reveal="lines">
            The fine print,
            <br /> <em>in large print.</em>
          </h2>
          <p className="lede" data-reveal="up">
            What goes on your roof, and what we owe you after. Written down, so nobody has to remember it.
          </p>
          <span className="promise__progress" aria-hidden="true">
            <span className="promise__fill" />
          </span>
        </header>

        <ol className="spec">
          {ROWS.map((r, i) => (
            <li className="spec__row" key={r.k}>
              <span className="spec__rule" aria-hidden="true" />
              <span className="spec__idx mono">0{i + 1}</span>
              <span className="spec__k">{r.k}</span>
              <span className="spec__v">{r.v}</span>
              <span className="spec__ok" aria-hidden="true">
                <Check />
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
