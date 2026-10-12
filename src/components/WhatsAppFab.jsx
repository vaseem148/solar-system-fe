import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { whatsappLink } from '../lib/leads'
import { WhatsApp } from './ui/Icons'
import './WhatsAppFab.css'

/** Floating WhatsApp button; its ring doubles as a page-progress indicator. */
export default function WhatsAppFab() {
  const root = useRef(null)

  useGSAP(
    () => {
      const el = root.current
      gsap.set(el, { scale: 0, autoAlpha: 0 })
      ScrollTrigger.create({
        start: 500,
        end: 'max',
        onToggle: (self) =>
          gsap.to(el, {
            scale: self.isActive ? 1 : 0,
            autoAlpha: self.isActive ? 1 : 0,
            duration: self.isActive ? 0.8 : 0.4,
            ease: self.isActive ? 'back.out(1.8)' : 'power3.in',
          }),
      })
      gsap.fromTo(
        el.querySelector('.fab__ring circle'),
        { strokeDashoffset: 1 },
        { strokeDashoffset: 0, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } },
      )
    },
    { scope: root },
  )

  return (
    <a
      ref={root}
      className="fab"
      href={whatsappLink('Hi! I’d like to know more about rooftop solar.')}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      <svg className="fab__ring" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="30" pathLength="1" />
      </svg>
      <WhatsApp className="fab__icon" />
      <span className="fab__label mono" aria-hidden="true">
        Chat with us
      </span>
    </a>
  )
}
