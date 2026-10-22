import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { PRODUCTS } from '../data/products'
import Label from './ui/Label'
import { ArrowUpRight } from './ui/Icons'
import './ProductsTeaser.css'

/** Home: the five product families, each a door into its part of the Products page. */
export default function ProductsTeaser() {
  const root = useRef(null)

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const q = gsap.utils.selector(root)
      gsap
        .timeline({ scrollTrigger: { trigger: q('.pteaser__grid')[0], start: 'top 85%', once: true } })
        .from(q('.ptile'), { y: 70, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08 })
        .from(q('.ptile__media'), { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', stagger: 0.08 }, 0)
    },
    { scope: root },
  )

  return (
    <section ref={root} className="pteaser section" data-tone="light">
      <div className="container">
        <header className="pteaser__head">
          <Label index="02">What we make</Label>
          <h2 className="title" data-reveal="lines">
            Five ways to
            <br /> use the <em>sun.</em>
          </h2>
        </header>
        <ul className="pteaser__grid">
          {PRODUCTS.map((c, i) => (
            <li key={c.id}>
              <a href={`/products#${c.id}`} className="ptile" data-tilt="5">
                <div className="ptile__media">
                  <img src={c.items[0].img} alt="" loading="lazy" decoding="async" />
                </div>
                <span className="ptile__num mono">{String(i + 1).padStart(2, '0')}</span>
                <span className="ptile__name">{c.name}</span>
                <span className="ptile__count mono">
                  {c.items.length} {c.items.length === 1 ? 'product' : 'products'}
                  <ArrowUpRight />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
