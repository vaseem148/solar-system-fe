import { useRef } from 'react'
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { prefillContact } from '../lib/prefill'
import { PRODUCTS } from '../data/products'
import Label from './ui/Label'
import Button from './ui/Button'
import './Products.css'

// What the contact form should assume when someone asks about a category
const PROPERTY = {
  'solar-power-plant': 'Business',
  'solar-street-light': 'Business',
  'solar-water-heater': 'Home',
  'other-solar-products': 'Farm',
  'digital-inverter': 'Home',
}

export default function Products() {
  const root = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const q = gsap.utils.selector(root)
      // Cards rise in small groups as they arrive; their photos wipe open
      gsap.set(q('.pitem'), { y: 56, opacity: 0 })
      gsap.set(q('.pitem__media'), { clipPath: 'inset(100% 0% 0% 0%)' })
      ScrollTrigger.batch(q('.pitem'), {
        start: 'top 90%',
        once: true,
        onEnter: (cards) => {
          gsap.to(cards, { y: 0, opacity: 1, duration: 1.1, ease: 'expo.out', stagger: 0.08 })
          gsap.to(
            cards.map((c) => c.querySelector('.pitem__media')),
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.2, ease: 'expo.inOut', stagger: 0.08 },
          )
        },
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="products" className="prod section" data-tone="light">
      <div className="container">
        <header className="prod__head">
          <Label index="01">Our products</Label>
          <h2 className="title" data-reveal="lines">
            All in all, the
            <br /> <em>solar</em> solution.
          </h2>
          <p className="lede" data-reveal="up">
            Power plants, street lights, water heaters, pumps and inverters — supplied, installed and serviced by our
            own team in Chennai.
          </p>
          <nav className="prod__chips" aria-label="Product categories" data-reveal="up">
            {PRODUCTS.map((c, i) => (
              <a key={c.id} href={`#${c.id}`} className="prod__chip">
                <span className="mono">{String(i + 1).padStart(2, '0')}</span> {c.name}
              </a>
            ))}
          </nav>
        </header>

        {PRODUCTS.map((c, i) => (
          <article key={c.id} id={c.id} className="prod__cat">
            <div className="prod__cat-head">
              <p className="prod__num">{String(i + 1).padStart(2, '0')}</p>
              <h3 className="prod__name">{c.name}</h3>
              <p className="prod__text">{c.text}</p>
              <p className="mono prod__count">
                {c.items.length} {c.items.length === 1 ? 'product' : 'products'}
              </p>
              <Button href="/contact" size="sm" onClick={() => prefillContact({ property: PROPERTY[c.id] })}>
                Ask for a quote
              </Button>
            </div>
            <ul className="prod__grid">
              {c.items.map((item) => (
                <li key={item.name} className="pitem" data-tilt="4">
                  <div className="pitem__media">
                    <img src={item.img} alt={item.name} loading="lazy" decoding="async" />
                  </div>
                  <h4 className="pitem__name">{item.name}</h4>
                  <dl className="pitem__specs">
                    {item.specs.map(([k, v]) => (
                      <div key={k}>
                        <dt className="mono">{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </article>
        ))}

        <p className="prod__note mono">
          * Warranty terms vary by model and manufacturer — ask us for current models, specifications and prices.
        </p>
      </div>
    </section>
  )
}
