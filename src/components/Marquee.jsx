import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { getLenis } from '../lib/scroll'
import { Burst } from './ui/Icons'
import './Marquee.css'

const FRONT = [
  'Rooftop solar',
  'Solar water heaters',
  'Street lights',
  'Solar pumps',
  'PM Surya Ghar subsidy',
  'Since 2010',
  'Free site survey',
]

const BACK = ['சூரியன்', 'Zero EB bill', 'Chennai since 2010', 'Hot water from the sun', 'சூரிய சக்தி', 'MSME registered', 'Any roof']

/** Two crossed tapes that run with your scroll — faster when you scroll faster, opposite ways. */
export default function Marquee() {
  const root = useRef(null)
  const front = useRef(null)
  const back = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const bands = [
        { el: front.current, sign: 1, x: 0, half: 0 },
        { el: back.current, sign: -1, x: 0, half: 0 },
      ]
      const measure = () => bands.forEach((b) => (b.half = b.el.scrollWidth / 2))
      measure()
      bands[1].x = -bands[1].half * 0.37
      window.addEventListener('resize', measure)

      let dir = -1
      let boost = 0
      let skew = 0
      const tick = (_, delta) => {
        const v = getLenis()?.velocity ?? 0
        if (v > 0.2) dir = -1
        else if (v < -0.2) dir = 1
        boost += (Math.min(Math.abs(v), 60) * 0.45 - boost) * 0.08
        skew += (gsap.utils.clamp(-8, 8, v * -0.35) - skew) * 0.1
        const step = (1.2 + boost) * (delta / 16.67)
        bands.forEach((b) => {
          b.x += dir * b.sign * step * (b.sign < 0 ? 0.8 : 1)
          if (b.x <= -b.half) b.x += b.half
          if (b.x > 0) b.x -= b.half
          b.el.style.transform = `translate3d(${b.x}px,0,0) skewX(${skew * b.sign}deg)`
        })
      }
      gsap.ticker.add(tick)

      return () => {
        gsap.ticker.remove(tick)
        window.removeEventListener('resize', measure)
      }
    },
    { scope: root },
  )

  const run = (items, copy) =>
    items.map((item, i) => (
      <span className="marquee__item" key={`${copy}-${i}`} aria-hidden={copy > 0 || undefined}>
        <span lang={/[஀-௿]/.test(item) ? 'ta' : undefined}>{item}</span>
        <Burst />
      </span>
    ))

  return (
    <section ref={root} className="marquee" aria-label="What we do">
      <div className="marquee__band marquee__band--back" aria-hidden="true">
        <div ref={back} className="marquee__track">
          {run(BACK, 1)}
          {run(BACK, 2)}
        </div>
      </div>
      <div className="marquee__band">
        <div ref={front} className="marquee__track">
          {run(FRONT, 0)}
          {run(FRONT, 1)}
        </div>
      </div>
    </section>
  )
}
