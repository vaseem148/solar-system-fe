import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../lib/gsap'
import Label from './ui/Label'
import Button from './ui/Button'
import { IconSurvey, IconDesign, IconPaper, IconInstall, IconMeter } from './ui/Icons'
import './Process.css'

const STEPS = [
  {
    time: 'Day 1',
    title: 'Free site visit',
    text: 'An engineer checks your roof, shade, wiring and last few EB bills. No charge, no pressure.',
    Icon: IconSurvey,
  },
  {
    time: 'Day 2 – 3',
    title: 'Proposal & quote',
    text: 'After the survey you get a clear proposal — panel layout, components and one all-inclusive price.',
    Icon: IconDesign,
  },
  {
    time: 'Week 1 – 3',
    title: 'Paperwork, done',
    text: 'National portal registration, DISCOM approval and the subsidy claim. We file it — you just sign.',
    Icon: IconPaper,
  },
  {
    time: '1 – 3 days',
    title: 'Installation',
    text: 'Galvanised structure, panels, inverter, earthing and lightning arrester — fitted and tested by our own crew.',
    Icon: IconInstall,
  },
  {
    time: 'Week 3 – 6',
    title: 'Net meter & switch-on',
    text: 'The net meter goes in, monitoring goes live on your phone, and the subsidy lands in your bank account.',
    Icon: IconMeter,
  },
]

const ICON_SHAPES = '.pcard__icon path, .pcard__icon rect, .pcard__icon circle'

export default function Process() {
  const root = useRef(null)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const reduce = prefersReducedMotion()
      q(ICON_SHAPES).forEach((s) => s.setAttribute('pathLength', '1'))
      if (reduce) {
        q('.pcard-wrap').forEach((w) => w.classList.add('is-lit'))
        return
      }

      const drawIcon = (card, trigger) =>
        gsap.fromTo(
          card.querySelectorAll(ICON_SHAPES),
          { strokeDasharray: 1, strokeDashoffset: 1 },
          { strokeDashoffset: 0, duration: 1.1, stagger: 0.08, ease: 'power2.inOut', scrollTrigger: trigger },
        )

      const mm = gsap.matchMedia()

      mm.add('(min-width: 900px)', () => {
        const track = q('.proc__track')[0]
        const wraps = q('.pcard-wrap')
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth)
        const st = { trigger: q('.proc__pin')[0], start: 'top top', end: () => `+=${distance()}`, invalidateOnRefresh: true }

        // Cover-flow: cards turn slightly away from the centre of the screen
        const coverflow = () => {
          const mid = window.innerWidth / 2
          wraps.forEach((w) => {
            const r = w.getBoundingClientRect()
            const d = gsap.utils.clamp(-1, 1, (r.left + r.width / 2 - mid) / window.innerWidth)
            gsap.set(w, { rotationY: d * -9, scale: 1 - Math.abs(d) * 0.05, transformPerspective: 1300 })
          })
        }

        const move = gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            ...st,
            pin: true,
            scrub: 0.6,
            anticipatePin: 1,
            onToggle: (self) => (self.isActive ? gsap.ticker.add(coverflow) : gsap.ticker.remove(coverflow)),
            onRefresh: coverflow,
          },
        })
        gsap.fromTo(q('.proc__bar i'), { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { ...st, scrub: true } })

        wraps.forEach((w) => {
          // the node lights and the number fills once the card reaches the middle
          ScrollTrigger.create({
            trigger: w,
            containerAnimation: move,
            start: 'center 62%',
            onEnter: () => w.classList.add('is-lit'),
            onLeaveBack: () => w.classList.remove('is-lit'),
          })
          drawIcon(w, { trigger: w, containerAnimation: move, start: 'left 85%', toggleActions: 'play none none reverse' })
        })

        coverflow()
        return () => gsap.ticker.remove(coverflow)
      })

      mm.add('(max-width: 899px)', () => {
        q('.pcard-wrap').forEach((w) => {
          gsap.from(w, { y: 50, opacity: 0, duration: 1.1, scrollTrigger: { trigger: w, start: 'top 90%', once: true } })
          drawIcon(w, { trigger: w, start: 'top 80%', once: true })
          ScrollTrigger.create({ trigger: w, start: 'top 60%', once: true, onEnter: () => w.classList.add('is-lit') })
        })
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="process" className="proc" data-tone="light">
      <div className="proc__pin">
        <div className="proc__track">
          <div className="proc__intro">
            <Label index="06">How we work</Label>
            <h2 className="title" data-reveal="lines">
              From first call
              <br /> to <em>first unit.</em>
            </h2>
            <p className="lede">Five steps. One team. Zero running around government offices.</p>
            <p className="proc__hint mono" aria-hidden="true">
              Keep scrolling <span>→</span>
            </p>
          </div>

          {STEPS.map(({ time, title, text, Icon }, i) => (
            <div className="pcard-wrap" key={title}>
              <article className={`pcard ${i === 2 ? 'pcard--sun' : ''}`} data-tilt="6" data-tilt-glare="" data-tilt-lift="10">
                <div className="pcard__top">
                  <span className="pcard__num">0{i + 1}</span>
                  <span className="pcard__time mono">{time}</span>
                </div>
                <Icon className="pcard__icon" />
                <div>
                  <h3 className="pcard__title">{title}</h3>
                  <p className="pcard__text">{text}</p>
                </div>
              </article>
              <span className="pcard__node" aria-hidden="true" />
            </div>
          ))}

          <div className="proc__end">
            <p className="proc__end-title">
              Most homes are generating within <em>six weeks</em> of saying yes.
            </p>
            <Button href="#contact">Start with a free visit</Button>
          </div>
        </div>
        <div className="proc__bar" aria-hidden="true">
          <i />
        </div>
      </div>
    </section>
  )
}
