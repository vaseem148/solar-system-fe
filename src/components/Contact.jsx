import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { CONTACT } from '../config'
import { onPrefill, takePrefill } from '../lib/prefill'
import { submitLead, validateLead, whatsappLink, isOpenNow } from '../lib/leads'
import { useNow } from './SunReadout'
import Label from './ui/Label'
import Button from './ui/Button'
import { Phone, Mail, MapPin, WhatsApp, Check } from './ui/Icons'
import './Contact.css'

const PROPERTIES = ['Home', 'Business', 'Farm', 'Other']
const EMPTY = { name: '', phone: '', area: '', property: 'Home', bill: '', message: '' }

// What happens after the form — kept in step with the Process section's timeline
const NEXT = [
  { when: 'Now', title: 'You send this', text: 'Your details open in WhatsApp, ready to send. It takes about a minute.' },
  {
    when: 'Within 1 working day',
    title: 'An engineer calls',
    text: 'Not a call centre — someone who can answer real questions about your roof and your bill.',
  },
  {
    when: 'At a time that suits you',
    title: 'Free site visit',
    text: 'Roof, shade and wiring checked in person. A fixed, all-inclusive quote follows in 2–3 days.',
  },
]

function Field({ id, label, error, prefix, children }) {
  return (
    <div className={`field ${error ? 'has-error' : ''} ${prefix ? 'field--prefix' : ''}`}>
      {prefix && <span className="field__prefix">{prefix}</span>}
      {children}
      <label htmlFor={id}>{label}</label>
      {error && (
        <span className="field__error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export default function Contact() {
  const [data, setData] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const formRef = useRef(null)
  const root = useRef(null)
  const cardRef = useRef(null)
  const pillPlaced = useRef(false)
  const now = useNow(60000)
  const open = isOpenNow(now)

  useGSAP(
    () => {
      const steps = gsap.utils.toArray('.nextstep', root.current)
      if (prefersReducedMotion()) {
        steps.forEach((step) => step.classList.add('is-lit'))
        return
      }

      // Next steps: each node lights, its words rise, then the line runs on to the next one
      const list = root.current.querySelector('.nextsteps')
      const next = gsap.timeline({ scrollTrigger: { trigger: list, start: 'top 82%', once: true } })
      steps.forEach((step, i) => {
        const at = i * 0.62
        next
          .call(() => step.classList.add('is-lit'), null, at)
          .from(step.querySelectorAll('.nextstep__body > *'), { y: 18, opacity: 0, duration: 0.9, stagger: 0.07, ease: 'expo.out' }, at)
        const fill = step.querySelector('.nextstep__fill')
        if (fill) next.fromTo(fill, { '--p': 0 }, { '--p': 1, duration: 0.55, ease: 'power2.inOut' }, at + 0.12)
      })

      // "on." switches on like a light when the section arrives: a flicker, then a warm glow
      const word = root.current.querySelector('.contact__title em')
      if (!word) return
      gsap
        .timeline({ delay: 0.9, scrollTrigger: { trigger: root.current, start: 'top 65%', once: true } })
        .to(word, {
          keyframes: { opacity: [1, 0.15, 0.9, 0.25, 1, 0.55, 1], easeEach: 'steps(1)' },
          duration: 0.65,
        })
        .to(
          word,
          {
            color: '#ffb23f',
            textShadow: '0 0 24px rgba(255, 178, 63, 0.45), 0 0 60px rgba(255, 90, 31, 0.25)',
            duration: 0.9,
            ease: 'power2.out',
          },
          '>-0.1',
        )
    },
    { scope: root },
  )

  // The active property chip is marked by one pill that slides between chips
  useLayoutEffect(() => {
    if (sent) {
      pillPlaced.current = false
      return
    }
    const fieldset = formRef.current?.querySelector('.chips__row')
    const pill = fieldset?.querySelector('.chips__pill')
    const chip = fieldset?.querySelector('.chip input:checked')?.parentElement
    if (!pill || !chip) return
    const box = { x: chip.offsetLeft, y: chip.offsetTop, width: chip.offsetWidth, height: chip.offsetHeight }
    if (!pillPlaced.current || prefersReducedMotion()) {
      gsap.set(pill, box)
      pillPlaced.current = true
      return
    }
    gsap
      .timeline()
      .to(pill, { ...box, duration: 0.55, ease: 'expo.out' }, 0)
      .fromTo(pill, { scaleY: 0.82 }, { scaleY: 1, duration: 0.5, ease: 'elastic.out(1, 0.5)' }, 0.05)
  }, [data.property, sent])

  // Success state: the check draws itself, rays burst around it, the words rise
  useLayoutEffect(() => {
    if (!sent || prefersReducedMotion()) return
    const card = cardRef.current
    const path = card.querySelector('.contact__check path')
    path?.setAttribute('pathLength', '1')
    const tl = gsap.timeline()
    tl.fromTo(path, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, 0.35)
      .fromTo(
        card.querySelectorAll('.contact__rays i'),
        { opacity: 1, '--d': '30px' },
        { opacity: 0, '--d': '62px', duration: 0.9, ease: 'expo.out', stagger: 0.015 },
        0.3,
      )
      .from(
        card.querySelectorAll('.contact__done > :not(.contact__check-wrap)'),
        { y: 26, opacity: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out' },
        0.25,
      )
    return () => tl.kill()
  }, [sent])

  useEffect(() => {
    const apply = (detail) => {
      setSent(false)
      setData((d) => ({
        ...d,
        ...(detail.property ? { property: detail.property } : {}),
        ...(detail.bill ? { bill: String(detail.bill) } : {}),
      }))
    }
    // values sent from another page before this form mounted
    const early = takePrefill()
    if (early) apply(early)
    return onPrefill(apply)
  }, [])

  const set = (key) => (e) => {
    setData((d) => ({ ...d, [key]: e.target.value }))
    if (errors[key]) setErrors((err) => ({ ...err, [key]: undefined }))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    const found = validateLead(data)
    setErrors(found)
    if (Object.keys(found).length) {
      gsap.fromTo(formRef.current, { x: -10 }, { x: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' })
      formRef.current.querySelector(`#f-${Object.keys(found)[0]}`)?.focus()
      return
    }
    submitLead(data) // opens WhatsApp synchronously, so pop-up blockers allow it
    const card = cardRef.current
    const btn = formRef.current?.querySelector('button[type="submit"]')
    if (!card || !btn || prefersReducedMotion()) {
      setSent(true)
      return
    }
    // a sunburst from the button, then the success state
    const c = card.getBoundingClientRect()
    const b = btn.getBoundingClientRect()
    const burst = document.createElement('span')
    burst.className = 'contact__burst'
    burst.setAttribute('aria-hidden', 'true')
    burst.style.left = `${b.left - c.left + b.width / 2}px`
    burst.style.top = `${b.top - c.top + b.height / 2}px`
    for (let i = 0; i < 10; i++) {
      const ray = document.createElement('i')
      ray.style.setProperty('--a', `${i * 36}deg`)
      burst.appendChild(ray)
    }
    card.appendChild(burst)
    gsap.fromTo(
      burst.children,
      { '--d': '10px', scaleX: 0.2, opacity: 1 },
      { '--d': '78px', scaleX: 1, opacity: 0, duration: 0.6, ease: 'expo.out', stagger: 0.01 },
    )
    setTimeout(() => {
      burst.remove()
      setSent(true)
    }, 420)
  }

  return (
    <section ref={root} id="contact" className="contact section" data-tone="dark">
      <div className="container contact__grid">
        <div className="contact__intro">
          <Label index="01">Free site visit</Label>
          <h2 className="contact__title title" data-reveal="lines">
            Let’s switch
            <br /> your roof <em>on.</em>
          </h2>
          <p className="lede" data-reveal="up">
            Tell us a little about your place. An engineer — not a call centre — calls you back within one working
            day.
          </p>

          <ul className="contact__direct" data-reveal="up">
            {CONTACT.phones.map((p) => (
              <li key={p.href}>
                <a href={p.href}>
                  <span className="contact__ico contact__ico--phone"><Phone /></span> <span className="ulink">{p.display}</span>
                </a>
              </li>
            ))}
            <li>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                <span className="contact__ico contact__ico--wa"><WhatsApp /></span> <span className="ulink">WhatsApp us</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.email}`}>
                <span className="contact__ico contact__ico--mail"><Mail /></span> <span className="ulink">{CONTACT.email}</span>
              </a>
            </li>
          </ul>

          <a className="contact__address" href={CONTACT.mapHref} target="_blank" rel="noopener noreferrer" data-reveal="up">
            <span className="contact__ico contact__ico--pin"><MapPin /></span>
            <span>
              <span className="ulink">{CONTACT.address}</span>
              <small className="mono">Near {CONTACT.landmark}</small>
              <small className="mono contact__map">Open in Google Maps ↗</small>
            </span>
          </a>

          <p className={`contact__status mono ${open ? 'is-open' : ''}`} data-reveal="up">
            <i aria-hidden="true" />
            {open ? 'Open now · call or WhatsApp us' : 'Closed right now · we’ll call you first thing'}
            <span>{CONTACT.hours.label}</span>
          </p>
        </div>

        <div ref={cardRef} className="contact__card" data-reveal="up">
          {sent ? (
            <div className="contact__done" role="status">
              <span className="contact__check-wrap">
                <span className="contact__rays" aria-hidden="true">
                  {Array.from({ length: 8 }, (_, i) => (
                    <i key={i} style={{ '--a': `${i * 45}deg` }} />
                  ))}
                </span>
                <span className="contact__check">
                  <Check />
                </span>
              </span>
              <h3>Thanks, {data.name.trim().split(' ')[0]}.</h3>
              <p>
                WhatsApp should have opened with your details ready to send. If it didn’t, call us on{' '}
                <a href={CONTACT.phoneHref} className="ulink">
                  {CONTACT.phoneDisplay}
                </a>
                .
              </p>
              <button
                type="button"
                className="mono contact__again"
                onClick={() => {
                  setData(EMPTY)
                  setSent(false)
                }}
              >
                Send another enquiry →
              </button>
            </div>
          ) : (
            <form ref={formRef} className="form" onSubmit={onSubmit} noValidate>
              <div className="form__row">
                <Field id="f-name" label="Your name" error={errors.name}>
                  <input
                    id="f-name"
                    name="name"
                    autoComplete="name"
                    placeholder=" "
                    value={data.name}
                    onChange={set('name')}
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? 'f-name-error' : undefined}
                  />
                </Field>
                <Field id="f-phone" label="Mobile number" error={errors.phone}>
                  <input
                    id="f-phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder=" "
                    value={data.phone}
                    onChange={set('phone')}
                    aria-invalid={!!errors.phone}
                    aria-describedby={errors.phone ? 'f-phone-error' : undefined}
                  />
                </Field>
              </div>

              <div className="form__row">
                <Field id="f-area" label="Area / city" error={errors.area}>
                  <input
                    id="f-area"
                    name="area"
                    autoComplete="address-level2"
                    placeholder=" "
                    value={data.area}
                    onChange={set('area')}
                    aria-invalid={!!errors.area}
                    aria-describedby={errors.area ? 'f-area-error' : undefined}
                  />
                </Field>
                <Field id="f-bill" label="Monthly EB bill (optional)" prefix="₹">
                  <input
                    id="f-bill"
                    name="bill"
                    inputMode="numeric"
                    placeholder=" "
                    value={data.bill}
                    onChange={(e) => setData((d) => ({ ...d, bill: e.target.value.replace(/\D/g, '').slice(0, 7) }))}
                  />
                </Field>
              </div>

              <fieldset className="chips">
                <legend className="mono">Property type</legend>
                <div className="chips__row">
                  <span className="chips__pill" aria-hidden="true" />
                  {PROPERTIES.map((p) => (
                    <label key={p} className="chip">
                      <input type="radio" name="property" value={p} checked={data.property === p} onChange={set('property')} />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <Field id="f-message" label="Anything else? (optional)">
                <textarea id="f-message" name="message" rows="2" placeholder=" " value={data.message} onChange={set('message')} />
              </Field>

              <Button type="submit" block icon={<WhatsApp />}>
                Send on WhatsApp
              </Button>
              <p className="form__fine mono">No spam, no sales calls at dinner time. Promise.</p>
            </form>
          )}
        </div>
      </div>

      <div className="container">
        <div className="nextsteps">
          <p className="nextsteps__label mono">What happens next</p>
          <ol className="nextsteps__list">
            {NEXT.map((s, i) => (
              <li className="nextstep" key={s.title}>
                <span className="nextstep__node" aria-hidden="true" />
                {i < NEXT.length - 1 && (
                  <span className="nextstep__line" aria-hidden="true">
                    <i className="nextstep__fill" />
                  </span>
                )}
                <div className="nextstep__body">
                  <p className="nextstep__when mono">
                    {String(i + 1).padStart(2, '0')} — {s.when}
                  </p>
                  <h3 className="nextstep__title">{s.title}</h3>
                  <p className="nextstep__text">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
