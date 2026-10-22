import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { getLenis } from '../lib/scroll'
import { scramble } from '../lib/interactions'
import { BRAND, CONTACT } from '../config'
import { SunMark, WhatsApp } from './ui/Icons'
import Button from './ui/Button'
import { PAGES } from '../routes'
import './Nav.css'

// Pages in the link list (the free estimate has its own button)
export const NAV_LINKS = PAGES.filter((p) => p.nav !== false).map((p) => ({ href: p.path, label: p.label }))
const isCurrent = (href, pathname) => href === pathname || (href !== '/' && pathname.startsWith(`${href}/`))

export default function Nav({ ready }) {
  const bar = useRef(null)
  const menu = useRef(null)
  const intro = useRef(null)
  const menuTl = useRef(null)
  const [open, setOpen] = useState(false)
  const openRef = useRef(false)
  const setActiveRef = useRef(null)
  const { pathname } = useLocation()
  openRef.current = open

  useGSAP(() => {
    intro.current = gsap.from(bar.current.querySelectorAll(':scope > :not(.nav__progress)'), {
      yPercent: -160,
      opacity: 0,
      duration: 1.4,
      stagger: 0.08,
      ease: 'expo.out',
      paused: true,
      delay: 0.35,
    })

    ScrollTrigger.create({
      start: 120,
      end: 'max',
      onUpdate: (self) => {
        const el = bar.current
        if (!el) return
        el.classList.toggle('is-hidden', self.direction === 1 && !openRef.current)
      },
      onToggle: (self) => bar.current?.classList.toggle('is-solid', self.isActive),
    })

    // Current page: a small sun glides under its link
    const links = gsap.utils.toArray('.nav__link', bar.current)
    const dot = bar.current.querySelector('.nav__dot')
    gsap.set(dot, { autoAlpha: 0, scale: 0.4 })
    let active = -1
    const setActive = (i) => {
      if (i === active) return
      active = i
      links.forEach((l, k) => l.classList.toggle('is-active', k === i))
      if (i < 0) {
        gsap.to(dot, { autoAlpha: 0, scale: 0.4, duration: 0.4, ease: 'power2.out', overwrite: 'auto' })
        return
      }
      const l = links[i]
      gsap.to(dot, { x: l.offsetLeft + l.offsetWidth / 2, autoAlpha: 1, scale: 1, duration: 0.8, ease: 'expo.out', overwrite: 'auto' })
    }
    setActiveRef.current = setActive

    // Hairline reading progress along the bottom of the solid bar
    gsap.fromTo(
      bar.current.querySelector('.nav__progress i'),
      { scaleX: 0 },
      { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3, refreshPriority: -1 } },
    )

    const q = gsap.utils.selector(menu)
    menuTl.current = gsap
      .timeline({ paused: true, defaults: { ease: 'expo.out' } })
      .set(menu.current, { visibility: 'visible' })
      .fromTo(
        menu.current,
        { clipPath: 'circle(0% at calc(100% - 44px) 39px)' },
        { clipPath: 'circle(150% at calc(100% - 44px) 39px)', duration: 1.1, ease: 'expo.inOut' },
      )
      .fromTo(q('.menu__glow'), { scale: 0.2, opacity: 0 }, { scale: 1, opacity: 1, duration: 1.6, ease: 'power3.out' }, 0.2)
      .from(q('.menu__link > span'), { yPercent: 115, rotate: 5, transformOrigin: '0% 100%', duration: 1.05, stagger: 0.06 }, 0.45)
      .from(q('.menu__foot > *'), { opacity: 0, y: 18, duration: 0.8, stagger: 0.06 }, 0.7)
  })

  useEffect(() => {
    if (ready) intro.current?.play()
  }, [ready])

  useEffect(() => {
    setActiveRef.current?.(NAV_LINKS.findIndex((l) => isCurrent(l.href, pathname)))
  }, [pathname])

  useEffect(() => {
    const lenis = getLenis()
    if (open) {
      menuTl.current?.timeScale(1).play()
      menu.current
        ?.querySelectorAll('.menu__link small')
        .forEach((el, i) => scramble(el, { duration: 0.55, delay: 0.5 + i * 0.06, chars: '0123456789' }))
      lenis?.stop()
    } else {
      menuTl.current?.timeScale(1.6).reverse()
      if (ready) lenis?.start()
    }
    document.documentElement.classList.toggle('menu-open', open)
  }, [open, ready])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => setOpen(false)

  return (
    <>
      <header ref={bar} className="nav">
        <a href="/" className="nav__logo" aria-label={`${BRAND.name} — back to top`} onClick={close}>
          <SunMark />
          <span>{BRAND.name}</span>
        </a>

        <nav className="nav__links" aria-label="Primary">
          {NAV_LINKS.map((l) => (
            <a key={l.href} href={l.href} className="nav__link" aria-current={isCurrent(l.href, pathname) ? 'page' : undefined}>
              <span data-text={l.label}>{l.label}</span>
            </a>
          ))}
          <span className="nav__dot" aria-hidden="true" />
        </nav>

        <div className="nav__right">
          <Button href="/estimate" size="sm" className="nav__cta">
            Free estimate
          </Button>
          <button
            type="button"
            className={`nav__burger ${open ? 'is-open' : ''}`}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
            <i />
            <i />
          </button>
        </div>
        <span className="nav__progress" aria-hidden="true">
          <i />
        </span>
      </header>

      <div ref={menu} id="site-menu" className="menu on-dark" aria-hidden={!open} inert={!open}>
        <div className="menu__glow" aria-hidden="true" />
        <nav aria-label="Menu">
          <ul className="menu__list">
            {[...NAV_LINKS, { href: '/estimate', label: 'Free estimate' }].map((l, i) => (
              <li key={l.href}>
                <a href={l.href} className="menu__link" onClick={close}>
                  <span>
                    <small className="mono">0{i + 1}</small>
                    {l.label}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="menu__foot">
          <a href={CONTACT.phoneHref} className="mono">
            {CONTACT.phoneDisplay}
          </a>
          <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" className="mono">
            <WhatsApp width="14" height="14" /> WhatsApp
          </a>
          <a href={`mailto:${CONTACT.email}`} className="mono">
            {CONTACT.email}
          </a>
        </div>
      </div>
    </>
  )
}
