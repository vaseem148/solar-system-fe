import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP, hasFinePointer, prefersReducedMotion } from '../lib/gsap'
import { scramble } from '../lib/interactions'
import { prefillContact } from '../lib/prefill'
import Label from './ui/Label'
import { ArrowUpRight, IconHome, IconHeater, IconStreetLight, IconFarm, IconInverter, IconCare } from './ui/Icons'
import './Services.css'

const SERVICES = [
  {
    title: 'Rooftop',
    kicker: 'Solar power plants',
    text: 'On-grid rooftop plants for homes, shops and factories — built with Waaree panels and MNRE-approved components.',
    tags: ['1 – 100 kW', 'Grid-tie', 'MNRE approved'],
    spec: '1–100 kW',
    property: 'Home',
    Icon: IconHome,
  },
  {
    title: 'Heaters',
    kicker: 'Solar water heaters',
    text: 'Evacuated-tube and flat-plate heaters for homes, hostels and hotels — hot water from the morning sun, no geyser bill.',
    tags: ['100 – 300 LPD', 'ETC & flat plate', '5-year warranty'],
    spec: '100–300 L',
    property: 'Home',
    Icon: IconHeater,
  },
  {
    title: 'Lights',
    kicker: 'Solar street lights',
    text: 'All-in-one LED street lights for roads, layouts, campuses and factories — plus solar home-lighting kits for shops and huts.',
    tags: ['7 – 50 W LED', 'IP65', 'Lithium battery'],
    spec: '7–50 W',
    property: 'Business',
    Icon: IconStreetLight,
  },
  {
    title: 'Pumps',
    kicker: 'Solar water pumps',
    text: 'Daytime irrigation that runs on sunlight — no diesel bills, no waiting for three-phase supply.',
    tags: ['Agricultural', 'Automatic', 'Zero fuel cost'],
    spec: 'Farms',
    property: 'Farm',
    Icon: IconFarm,
  },
  {
    title: 'Inverters',
    kicker: 'On-grid & off-grid',
    text: 'Grid-tie inverters for rooftop plants, and pure-sine-wave off-grid inverters with batteries to ride through power cuts.',
    tags: ['On-grid', 'Off-grid', 'Pure sine wave'],
    spec: 'Backup',
    property: 'Home',
    Icon: IconInverter,
  },
  {
    title: 'Care',
    kicker: 'Maintenance & AMC',
    text: 'Preventive maintenance, cleaning and repairs for solar plants and water heaters — by our own skilled team.',
    tags: ['Preventive', 'Repairs', 'AMC'],
    spec: '365 days',
    property: 'Other',
    Icon: IconCare,
  },
]

/** Title split into rolling letters (each rolls up and a copy rolls in on hover). */
function RollTitle({ text }) {
  return (
    <span className="svc__title" aria-label={text}>
      {[...text].map((c, i) => (
        <span key={i} className="svc__ch" style={{ '--i': i }} data-c={c} aria-hidden="true">
          <span>{c}</span>
        </span>
      ))}
    </span>
  )
}

export default function Services() {
  const root = useRef(null)
  const showRef = useRef(() => {})

  useGSAP(
    (context, contextSafe) => {
      const q = gsap.utils.selector(root)
      const reduce = prefersReducedMotion()
      const rows = q('.svc__row')

      // Entrance: the rule draws across, then the row's parts rise
      if (!reduce) {
        rows.forEach((row) => {
          gsap
            .timeline({ scrollTrigger: { trigger: row, start: 'top 92%', once: true } })
            .from(row.querySelector('.svc__rule'), { scaleX: 0, duration: 1.3, ease: 'expo.inOut' })
            .from(row.querySelectorAll(':scope > :not(.svc__rule)'), { y: 40, opacity: 0, duration: 1.1, stagger: 0.06 }, 0.2)
        })
      }

      // Touch screens: the row in the middle of the viewport takes the hover look
      if (!hasFinePointer()) {
        rows.forEach((row) =>
          ScrollTrigger.create({ trigger: row, start: 'top 58%', end: 'bottom 42%', toggleClass: { targets: row, className: 'is-active' } }),
        )
        return
      }

      // Icon strokes are drawn every time a card appears
      const cards = q('.svc__card')
      cards.forEach((card) =>
        card.querySelectorAll('.svc__icon path, .svc__icon rect, .svc__icon circle').forEach((s) => s.setAttribute('pathLength', '1')),
      )
      gsap.set(cards, { clipPath: 'inset(100% 0% 0% 0%)' })

      const preview = q('.svc__preview')[0]
      const list = q('.svc__list')[0]
      const xTo = gsap.quickTo(preview, 'x', { duration: 0.7, ease: 'power3' })
      const yTo = gsap.quickTo(preview, 'y', { duration: 0.7, ease: 'power3' })
      const rotTo = gsap.quickTo(preview, 'rotation', { duration: 0.8, ease: 'power3' })
      gsap.set(preview, { scale: 0.4, autoAlpha: 0, xPercent: -50, yPercent: -50 })

      let current = -1
      let z = 1
      showRef.current = contextSafe((i) => {
        if (i === current) return
        current = i
        const card = cards[i]
        gsap.set(card, { zIndex: ++z })
        gsap.fromTo(card, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'expo.out', overwrite: true })
        gsap.fromTo(
          card.querySelectorAll('.svc__icon path, .svc__icon rect, .svc__icon circle'),
          { strokeDasharray: 1, strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 0.8, stagger: 0.05, ease: 'power2.inOut', delay: 0.1, overwrite: true },
        )
      })

      // The card leans into the direction you move, then straightens up
      let lastX = 0
      let lastT = 0
      let settle
      const move = contextSafe((e) => {
        const r = root.current.getBoundingClientRect()
        xTo(e.clientX - r.left)
        yTo(e.clientY - r.top)
        const now = performance.now()
        if (lastT) {
          const vx = (e.clientX - lastX) / Math.max(8, now - lastT)
          rotTo(gsap.utils.clamp(-8, 8, vx * 6))
        }
        lastX = e.clientX
        lastT = now
        clearTimeout(settle)
        settle = setTimeout(() => rotTo(0), 90)
      })
      const enter = contextSafe(() => gsap.to(preview, { scale: 1, autoAlpha: 1, duration: 0.6, ease: 'expo.out' }))
      const leave = contextSafe(() => {
        gsap.to(preview, { scale: 0.4, autoAlpha: 0, duration: 0.45, ease: 'power3.in' })
        current = -1
      })

      root.current.addEventListener('pointermove', move)
      list.addEventListener('pointerenter', enter)
      list.addEventListener('pointerleave', leave)
      return () => {
        clearTimeout(settle)
        root.current?.removeEventListener('pointermove', move)
        list.removeEventListener('pointerenter', enter)
        list.removeEventListener('pointerleave', leave)
      }
    },
    { scope: root },
  )

  const busy = useRef(new WeakSet())
  const onEnterRow = (i, e) => {
    showRef.current(i)
    const idx = e.currentTarget.querySelector('.svc__idx')
    if (!idx || busy.current.has(idx) || prefersReducedMotion()) return
    busy.current.add(idx)
    scramble(idx, { duration: 0.5, chars: '0123456789' })
    setTimeout(() => busy.current.delete(idx), 600)
  }

  return (
    <section ref={root} id="services" className="svc section" data-tone="light">
      <div className="container">
        <header className="svc__head">
          <Label index="03">What we do</Label>
          <h2 className="title" data-reveal="lines">
            Built for every
            <br /> kind of <em>roof.</em>
          </h2>
          <p className="lede" data-reveal="up">
            Power plants, water heaters, street lights, pumps and inverters — one Chennai team supplies, installs and
            services all of it.
          </p>
        </header>

        <ul className="svc__list">
          {SERVICES.map((s, i) => (
            <li key={s.title}>
              <a
                href="#contact"
                className="svc__row"
                onPointerEnter={(e) => onEnterRow(i, e)}
                onFocus={(e) => onEnterRow(i, e)}
                onClick={() => prefillContact({ property: s.property })}
              >
                <span className="svc__rule" aria-hidden="true" />
                <span className="svc__idx mono">0{i + 1}</span>
                <RollTitle text={s.title} />
                <span className="svc__body">
                  <span className="svc__kicker mono">{s.kicker}</span>
                  <span className="svc__text">{s.text}</span>
                </span>
                <span className="svc__tags">
                  {s.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </span>
                <span className="svc__arrow" aria-hidden="true">
                  <ArrowUpRight />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="svc__preview" aria-hidden="true">
        {SERVICES.map(({ title, spec, kicker, Icon }) => (
          <div className="svc__card" key={title}>
            <Icon className="svc__icon" />
            <div>
              <p className="svc__spec">{spec}</p>
              <p className="mono">{kicker}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
