import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion, hasFinePointer } from '../lib/gsap'
import { BRAND, CONTACT, LOCATION, SOCIAL } from '../config'
import { sunTimes, formatSpan } from '../lib/sun'
import { whatsappLink } from '../lib/leads'
import SunCanvas from './SunCanvas'
import { useNow } from './SunReadout'
import { NAV_LINKS } from './Nav'
import { SunMark } from './ui/Icons'
import './Footer.css'

// Low, centred sun that sinks behind the wordmark as you reach the bottom
const setLayout = (w, h) => ({ x: w * 0.5, y: h * 0.56, r: Math.min(w * 0.19, h * 0.34) })

const hm = new Intl.DateTimeFormat('en-GB', {
  timeZone: LOCATION.timeZone,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const SERVICES = ['Homes', 'Business', 'Farms', 'Backup', 'Care']

export default function Footer() {
  const root = useRef(null)
  const sun = useRef({ rise: 1, lift: 0.25, scale: 1, heat: 1 }).current
  const now = useNow(60000)
  const today = sunTimes(now, LOCATION.lat, LOCATION.lon, LOCATION.tzOffsetMin)

  useGSAP(
    (context, contextSafe) => {
      const q = gsap.utils.selector(root)
      if (prefersReducedMotion()) return
      gsap.fromTo(
        sun,
        { lift: 0.3 },
        {
          lift: -0.36,
          ease: 'none',
          scrollTrigger: { trigger: q('.foot__horizon')[0], start: 'top bottom', end: 'bottom bottom', scrub: true },
        },
      )
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
          <p className="foot__tagline">Rooftop solar for Tamil Nadu homes, farms and factories.</p>
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
          <a href={CONTACT.phoneHref} className="ulink">
            {CONTACT.phoneDisplay}
          </a>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="ulink">
            WhatsApp
          </a>
          <a href={`mailto:${CONTACT.email}`} className="ulink">
            {CONTACT.email}
          </a>
          <span>{CONTACT.region}</span>
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
        <SunCanvas className="foot__sun" variant="set" layout={setLayout} state={sun} />
        <p className="foot__today mono">
          Today over {LOCATION.label}: sunrise {hm.format(today.sunrise)} · sunset {hm.format(today.sunset)} ·{' '}
          <b>{formatSpan(today.sunset - today.sunrise)} of free power</b>
        </p>
        <p className="foot__word" aria-hidden="true">
          {BRAND.name.split('').map((ch, i) => (
            <span key={i}>{ch}</span>
          ))}
        </p>
      </div>

      <div className="container foot__legal mono">
        <span>
          © {now.getFullYear()} {BRAND.legalName}. All rights reserved.
        </span>
        <span>Made under the Tamil Nadu sun.</span>
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
