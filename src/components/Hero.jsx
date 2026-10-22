import { useEffect, useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion, hasFinePointer } from '../lib/gsap'
import { scramble } from '../lib/interactions'
import { BRAND, LOCATION } from '../config'
import SunCanvas from './SunCanvas'
import SunReadout, { SunChip } from './SunReadout'
import Button from './ui/Button'
import { ArrowDown } from './ui/Icons'
import './Hero.css'

// Where the copy ends (px from the hero's top). The renderer calls the layout every frame, so it reads this
// measurement (refreshed on resize) rather than touching the DOM.
const stage = { copyBottom: 0 }

// Wide screens: the sun rests low on the right. Portrait: the copy stacks at the top and the sun rises
// as a wide arc in the space beneath it.
const heroLayout = (w, h) => {
  if (w >= h * 0.9) return { x: w * 0.72, y: h * 1.11, r: h * 0.5 }
  const r = w * 0.62
  const top = Math.min(Math.max(stage.copyBottom + w * 0.08, h * 0.5), h * 0.86)
  return { x: w * 0.6, y: top + r, r }
}

/** Splits a word group into animatable characters (spaces stay real text). */
const Chars = ({ text }) =>
  [...text].map((c, i) =>
    c === ' ' ? (
      ' '
    ) : (
      <span className="ch" key={i}>
        {c}
      </span>
    ),
  )

// Variable-font swell around the cursor (Archivo: width 62% → 84%, weight 800 → 900)
const REST = { w: 62, wt: 800 }
const PEAK = { w: 84, wt: 900 }

export default function Hero({ ready }) {
  const root = useRef(null)
  const sun = useRef({ rise: 0, lift: 0, scale: 1, heat: 0.55, glow: 0 }).current
  const intro = useRef(null)

  // Keep the portrait sun just below the copy, whatever the fonts and screen do to its height
  useEffect(() => {
    const ctas = root.current.querySelector('.hero__ctas')
    const measure = () => {
      // Layout offsets (transforms ignored) summed up to the hero; GSAP's transforms make ancestors offsetParents
      let y = ctas.offsetHeight
      for (let n = ctas; n && n !== root.current; n = n.offsetParent) y += n.offsetTop
      stage.copyBottom = y
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(root.current)
    ro.observe(root.current.querySelector('.hero__title'))
    ro.observe(root.current.querySelector('.hero__foot'))
    return () => ro.disconnect()
  }, [])

  useGSAP(
    (context, contextSafe) => {
      const q = gsap.utils.selector(root)

      if (prefersReducedMotion()) {
        Object.assign(sun, { rise: 1, heat: 1 })
        return
      }

      const lines = q('.hero__line')
      intro.current = gsap
        .timeline({ paused: true })
        .to(sun, { rise: 1, duration: 3.4, ease: 'expo.out' }, 0)
        .to(sun, { heat: 1, duration: 3, ease: 'power2.out' }, 0.2)
        .from(q('.hero__title .ch'), { yPercent: 125, rotate: 8, transformOrigin: '0% 100%', duration: 1.5, stagger: 0.022 }, 0.1)
        .from(q('.hero__title em'), { rotate: -7, scale: 0.86, transformOrigin: '0% 100%', duration: 2, ease: 'expo.out' }, 0.35)
        .from(q('.hero__meta > *'), { y: 18, opacity: 0, duration: 1.2, stagger: 0.1 }, 0.6)
        .add(() => {
          q('.hero__eyebrow-text, .readout dd, .sunchip__text').forEach((el, i) =>
            scramble(el, { duration: 0.8 + Math.min(0.5, el.textContent.length * 0.02), delay: i * 0.06 }),
          )
        }, 0.62)
        .from(q('.hero__lede, .hero__ctas > *, .hero__chip'), { y: 28, opacity: 0, duration: 1.3, stagger: 0.08 }, 0.75)

      // Scroll-out: the sun climbs and blooms while the headline comes apart
      const scrub = { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true }
      gsap.to(sun, { lift: 0.3, scale: 1.12, glow: 1, ease: 'none', scrollTrigger: scrub })
      gsap.to(q('.hero__title'), { yPercent: -24, ease: 'none', scrollTrigger: { ...scrub } })
      gsap.to(lines[0], { xPercent: -16, opacity: 0.35, ease: 'none', scrollTrigger: { ...scrub } })
      gsap.to(lines[2], { xPercent: 14, opacity: 0.35, ease: 'none', scrollTrigger: { ...scrub } })
      gsap.to(q('.hero__meta, .hero__foot, .hero__chip'), {
        y: -60,
        opacity: 0,
        ease: 'none',
        scrollTrigger: { ...scrub, end: '55% top' },
      })

      // Cursor swell on the headline (desktop)
      if (!hasFinePointer()) return
      const title = q('.hero__title')[0]
      const chars = q('.hero__title .ch').map((el) => ({
        el,
        serif: !!el.closest('em'),
        v: 0,
      }))
      const pointer = { x: -1e4, y: -1e4, active: false }
      let running = false

      const tick = () => {
        const radius = parseFloat(getComputedStyle(title).fontSize) * 1.15
        const rects = chars.map(({ el }) => el.getBoundingClientRect())
        let moving = false
        chars.forEach((c, i) => {
          const r = rects[i]
          const dx = (r.left + r.width / 2 - pointer.x) / radius
          const dy = (r.top + r.height / 2 - pointer.y) / (radius * 0.8)
          const target = pointer.active ? Math.exp(-(dx * dx + dy * dy)) : 0
          const next = c.v + (target - c.v) * 0.16
          if (Math.abs(next - c.v) > 0.0015 || Math.abs(target - next) > 0.0015) moving = true
          c.v = Math.abs(next) < 0.002 ? 0 : next
        })
        chars.forEach((c) => {
          if (c.serif) {
            gsap.set(c.el, { scale: 1 + c.v * 0.1, y: -c.v * 4 })
          } else if (c.v === 0) {
            c.el.style.fontStretch = ''
            c.el.style.fontWeight = ''
          } else {
            c.el.style.fontStretch = `${(REST.w + (PEAK.w - REST.w) * c.v).toFixed(1)}%`
            c.el.style.fontWeight = Math.round(REST.wt + (PEAK.wt - REST.wt) * c.v)
          }
        })
        if (!moving && !pointer.active) {
          gsap.ticker.remove(tick)
          running = false
        }
      }

      const wake = () => {
        if (running) return
        running = true
        gsap.ticker.add(tick)
      }
      const move = contextSafe((e) => {
        pointer.x = e.clientX
        pointer.y = e.clientY
        pointer.active = true
        wake()
      })
      const leave = contextSafe(() => {
        pointer.active = false
        wake()
      })

      root.current.addEventListener('pointermove', move)
      root.current.addEventListener('pointerleave', leave)
      return () => {
        gsap.ticker.remove(tick)
        root.current?.removeEventListener('pointermove', move)
        root.current?.removeEventListener('pointerleave', leave)
      }
    },
    { scope: root },
  )

  useEffect(() => {
    if (ready) intro.current?.play()
  }, [ready])

  return (
    <section ref={root} id="top" className="hero on-dark" data-tone="dark">
      <SunCanvas className="hero__sun" variant="rise" layout={heroLayout} state={sun} />
      <div className="hero__shade" aria-hidden="true" />

      <div className="hero__inner container">
        <div className="hero__meta">
          <p className="hero__eyebrow mono">
            <span className="hero__pulse" aria-hidden="true" />
            <span className="hero__eyebrow-text">
              {BRAND.legalName} — {LOCATION.label}
            </span>
          </p>
          <SunReadout className="hero__readout" />
        </div>

        <h1 className="hero__title">
          <span className="sr-only">The sun is already on your roof.</span>
          <span className="hero__line" aria-hidden="true">
            <span className="hero__row">
              <Chars text="The sun is" />
            </span>
          </span>
          <span className="hero__line hero__line--indent" aria-hidden="true">
            <span className="hero__row">
              <em>
                <Chars text="already" />
              </em>{' '}
              <Chars text="on" />
            </span>
          </span>
          <span className="hero__line" aria-hidden="true">
            <span className="hero__row">
              <Chars text="your roof" />
              <b className="ch">.</b>
            </span>
          </span>
        </h1>

        <div className="hero__foot">
          <p className="hero__lede">
            Solar power plants, water heaters, street lights and pumps for homes, farms and factories. Designed,
            installed and looked after by one Chennai team since {BRAND.since} — one phone number.
          </p>
          <div className="hero__ctas">
            <Button href="/contact">Book a free site visit</Button>
            <Button href="/estimate" variant="ghost" icon={<ArrowDown />} iconMotion="s">
              See what you’d save
            </Button>
          </div>
        </div>

        <SunChip className="hero__chip" />
      </div>
    </section>
  )
}
