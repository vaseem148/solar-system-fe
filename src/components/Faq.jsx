import { useRef, useState } from 'react'
import { gsap, SplitText, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { CONTACT } from '../config'
import Label from './ui/Label'
import Button from './ui/Button'
import { Plus, WhatsApp } from './ui/Icons'
import './Faq.css'

const FAQS = [
  {
    q: 'How much subsidy will I actually get?',
    a: 'Under PM Surya Ghar: Muft Bijli Yojana, homes get ₹30,000 per kW for the first 2 kW and ₹18,000 for the third — up to ₹78,000 for a 3 kW or larger system. It is paid straight into your bank account once the net meter is installed, and we handle the application.',
  },
  {
    q: 'Do panels work in the monsoon or on cloudy days?',
    a: 'Yes, at lower output. Panels run on daylight, not heat — on an overcast day expect roughly a third to half of normal generation. Our yearly estimates already account for the monsoon months, and the grid quietly fills any gap.',
  },
  {
    q: 'What happens during a power cut?',
    a: 'A standard on-grid system switches off when the grid fails. It is a safety rule that protects EB linemen working on the lines. If you need power during cuts, choose a hybrid system with a battery — it switches over automatically.',
  },
  {
    q: 'How much roof space do I need?',
    a: 'About 100 sq ft of shadow-free area per kW, so a typical 3 kW home system needs around 300 sq ft. On an elevated structure your terrace stays usable underneath — for drying clothes, a garden or parking.',
  },
  {
    q: 'How long does the whole process take?',
    a: 'Installation itself takes 1–3 days. Including approvals, the net meter and commissioning, most homes are generating within 3–6 weeks of saying yes.',
  },
  {
    q: 'What maintenance is needed?',
    a: 'Mostly cleaning — dust is the biggest enemy here. Rinse the panels with plain water every two weeks, early morning or evening. Our AMC plans add scheduled cleaning, health checks and generation monitoring.',
  },
  {
    q: 'Can I pay in EMIs?',
    a: 'Yes. We help you apply for low-interest solar loans through banks, and businesses can choose flexible payment plans. In many cases the monthly EMI is smaller than the bill it replaces.',
  },
  {
    q: 'Will installation damage my terrace or cause leaks?',
    a: 'No. We use chemical anchors with waterproof sealing — or ballasted structures where you would rather not drill — and we water-test before we leave.',
  },
]

export default function Faq() {
  const [open, setOpen] = useState(0)
  const root = useRef(null)
  const splits = useRef([]) // one SplitText per answer, made the first time it opens
  const shown = useRef(open) // the item that was open last time we looked

  // The questions cascade in as the list scrolls into view
  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const list = root.current.querySelector('.faq__list')
      gsap.from(list.querySelectorAll('.faq__item'), {
        y: 34,
        opacity: 0,
        duration: 1.1,
        stagger: 0.07,
        ease: 'expo.out',
        scrollTrigger: { trigger: list, start: 'top 85%', once: true },
      })
    },
    { scope: root },
  )

  // Opening an answer: its lines rise out of their masks while the panel expands
  useGSAP(
    () => {
      if (shown.current === open) return // first render (or a StrictMode re-run): nothing was opened
      shown.current = open
      if (open < 0 || prefersReducedMotion()) return

      const p = root.current.querySelectorAll('.faq__a p')[open]
      if (!p) return
      let split = splits.current[open]
      if (!split || !split.isSplit) {
        split = splits.current[open] = SplitText.create(p, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'faq__line',
          aria: 'none', // the text itself stays readable; a <p> can't carry an aria-label
          autoSplit: true,
        })
      }
      gsap.fromTo(
        split.lines,
        { yPercent: 105, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.05, delay: 0.12, ease: 'expo.out', overwrite: true },
      )
      return () => {
        splits.current = []
      }
    },
    { dependencies: [open], scope: root },
  )

  return (
    <section ref={root} id="faq" className="faq section" data-tone="light">
      <div className="container faq__grid">
        <header className="faq__head">
          <Label index="08">FAQ</Label>
          <h2 className="title" data-reveal="lines">
            Questions,
            <br /> <em>answered.</em>
          </h2>
          <p className="lede" data-reveal="up">
            Still unsure about something? Ask us on WhatsApp — a real engineer replies, usually within the hour.
          </p>
          <div data-reveal="up">
            <Button
              href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent('Hi! I have a question about rooftop solar.')}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="ghost"
              icon={<WhatsApp />}
            >
              Ask on WhatsApp
            </Button>
          </div>
        </header>

        <ul className="faq__list">
          {FAQS.map((f, i) => {
            const isOpen = open === i
            return (
              <li key={f.q} className={`faq__item ${isOpen ? 'is-open' : ''}`}>
                <h3>
                  <button
                    type="button"
                    className="faq__q"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    id={`faq-q-${i}`}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                  >
                    <span className="faq__idx mono">{String(i + 1).padStart(2, '0')}</span>
                    <span className="faq__text">{f.q}</span>
                    <span className="faq__icon" aria-hidden="true">
                      <Plus />
                    </span>
                  </button>
                </h3>
                <div className="faq__a" id={`faq-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
                  <div>
                    <p>{f.a}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
