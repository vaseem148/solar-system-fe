import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion, hasFinePointer } from '../lib/gsap'
import { BRAND, CONTACT, LOCATION, SOCIAL, CREDENTIALS } from '../config'
import { sunTimes, formatSpan } from '../lib/sun'
import { whatsappLink } from '../lib/leads'
import Landscape from './Landscape'
import { useNow } from './SunReadout'
import { NAV_LINKS } from './Nav'
import { SunMark } from './ui/Icons'
import './Footer.css'

// A big, low sun that sets behind the mountains (and the wordmark) as you reach the bottom.
// Scene units: y 0 (bottom) … 1 (top), x 0 … width / height.
const setLayout = (w, h) => {
  const aspect = w / h
  const narrow = aspect < 1.2
  return {
    horizon: narrow ? 0.4 : 0.42,
    scale: narrow ? 0.62 : 0.8,
    sun: [aspect * 0.5, 0.84, Math.min(aspect * 0.11, 0.17), 0.55],
    house: [0, 0],
    props: false,
  }
}

const BIRDS = [
  { x: 0, y: 0, s: 18 },
  { x: -2.6, y: 1.8, s: 14 },
  { x: -4.6, y: -1.2, s: 16 },
]

const hm = new Intl.DateTimeFormat('en-GB', {
  timeZone: LOCATION.timeZone,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const SERVICES = ['Rooftop solar', 'Water heaters', 'Street lights', 'Solar pumps', 'Inverters', 'Maintenance']

export default function Footer() {
  const root = useRef(null)
  const scene = useRef({ rise: 1, day: 0, mist: 0.85, cam: 0, night: 0 }).current
  const now = useNow(60000)
  const today = sunTimes(now, LOCATION.lat, LOCATION.lon, LOCATION.tzOffsetMin)

  useGSAP(
    (context, contextSafe) => {
      const q = gsap.utils.selector(root)
      if (prefersReducedMotion()) {
        Object.assign(scene, { rise: 0.45, day: 0.85, night: 0.6 })
        return
      }
      // Sunset as you reach the bottom: the sun sinks behind the peaks, the light climbs off the valleys,
      // the sky cools to dusk and the first stars come out
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: q('.foot__horizon')[0], start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
        })
        .to(scene, { rise: 0.45, duration: 1 }, 0)
        .to(scene, { day: 1, duration: 0.9 }, 0.1)
        .to(scene, { night: 1, duration: 0.5 }, 0.5)
      // The wordmark rises letter by letter, like a wave
      gsap.from(q('.foot__word span'), {
        yPercent: 70,
        opacity: 0,
        duration: 1.7,
        ease: 'expo.out',
        stagger: { each: 0.08, from: 'start' },
        scrollTrigger: { trigger: q('.foot__horizon')[0], start: 'top 70%', once: true },
      })

      // Columns arrive in a gentle cascade
      gsap.from(q('.foot__brand > *, .foot__col > *'), {
        y: 18,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.025,
        scrollTrigger: { trigger: root.current, start: 'top 80%', once: true },
      })

      // Letters lift towards the cursor (desktop)
      if (!hasFinePointer()) return
      const horizon = q('.foot__horizon')[0]
      const letters = q('.foot__word span').map((el) => ({
        el,
        y: gsap.quickTo(el, 'yPercent', { duration: 0.7, ease: 'power3' }),
        s: gsap.quickTo(el, 'scale', { duration: 0.7, ease: 'power3' }),
      }))
      letters.forEach(({ el }) => gsap.set(el, { transformOrigin: '50% 100%' }))
      const move = contextSafe((e) => {
        letters.forEach(({ el, y, s }) => {
          const r = el.getBoundingClientRect()
          const d = (e.clientX - (r.left + r.width / 2)) / Math.max(1, r.width)
          const near = Math.exp(-d * d * 1.4)
          y(-9 * near)
          s(1 + 0.05 * near)
        })
      })
      const leave = contextSafe(() => letters.forEach(({ y, s }) => (y(0), s(1))))
      horizon.addEventListener('pointermove', move)
      horizon.addEventListener('pointerleave', leave)
      return () => {
        horizon.removeEventListener('pointermove', move)
        horizon.removeEventListener('pointerleave', leave)
      }
    },
    { scope: root },
  )

  return (
    <footer ref={root} className="foot on-dark" data-tone="dark">
      <div className="container foot__top">
        <div className="foot__brand">
          <a href="#top" className="foot__logo">
            <SunMark />
            {BRAND.name}
          </a>
          <p className="foot__tagline">
            {BRAND.tagline} Solar plants, water heaters, street lights and pumps — Chennai, since {BRAND.since}.
          </p>
          <p className="foot__tamil" lang="ta">
            சூரியனிடமிருந்து உங்கள் வீட்டுக்கு.
          </p>
        </div>

        <nav className="foot__col" aria-label="Footer">
          <p className="mono">Explore</p>
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="ulink">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="foot__col">
          <p className="mono">Services</p>
          {SERVICES.map((s) => (
            <a key={s} href="#services" className="ulink">
              {s}
            </a>
          ))}
        </div>

        <div className="foot__col">
          <p className="mono">Talk to us</p>
          {CONTACT.phones.map((p) => (
            <a key={p.href} href={p.href} className="ulink">
              {p.display}
            </a>
          ))}
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="ulink">
            WhatsApp
          </a>
          {CONTACT.emails.map((e) => (
            <a key={e} href={`mailto:${e}`} className="ulink">
              {e}
            </a>
          ))}
          <a href={CONTACT.mapHref} target="_blank" rel="noopener noreferrer" className="foot__addr">
            {CONTACT.address}
          </a>
          <span>{CONTACT.hours.label}</span>
        </div>

        <div className="foot__col">
          <p className="mono">Follow</p>
          {SOCIAL.map((s) => (
            <a key={s.label} href={s.href} className="ulink" target="_blank" rel="noopener noreferrer">
              {s.label} ↗
            </a>
          ))}
        </div>
      </div>

      <div className="foot__horizon">
        <Landscape className="foot__sun" palette="sunset" layout={setLayout} state={scene} />
        <div className="foot__birds" aria-hidden="true">
          {BIRDS.map((b, i) => (
            <span key={i} className="bird" style={{ '--x': `${b.x}vw`, '--y': `${b.y}vh`, '--s': `${b.s}px`, '--i': i }}>
              <svg viewBox="0 0 24 10">
                <path d="M1 6 Q6.5 0 12 6 Q17.5 0 23 6" />
              </svg>
            </span>
          ))}
        </div>
        <p className="foot__today mono">
          Today over {LOCATION.label}: sunrise {hm.format(today.sunrise)} · sunset {hm.format(today.sunset)} ·{' '}
          <b>{formatSpan(today.sunset - today.sunrise)} of free power</b>
        </p>
        <p className="foot__word" aria-hidden="true" style={{ '--chars': BRAND.name.length }}>
          {BRAND.name.split('').map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </p>
      </div>

      <div className="container foot__legal mono">
        <span>
          © {now.getFullYear()} {BRAND.legalName}. All rights reserved.
        </span>
        <span>
          MSME UAN {CREDENTIALS.msme} · GSTIN {CREDENTIALS.gst}
        </span>
        <a href="#top" className="foot__top-link">
          <span className="ulink">Back to top</span>
          <span className="foot__arrow" aria-hidden="true">
            ↑
          </span>
        </a>
      </div>
    </footer>
  )
}
