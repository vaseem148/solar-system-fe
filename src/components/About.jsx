import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { BRAND, CREDENTIALS } from '../config'
import Label from './ui/Label'
import Odometer from './ui/Odometer'
import flatplate from '../assets/work/flatplate-heater.webp'
import etc from '../assets/work/etc-heater.webp'
import install from '../assets/work/heater-install.webp'
import kanchipuram from '../assets/work/kanchipuram-plant.webp'
import perungalathur from '../assets/work/perungolathur-lights.webp'
import annanagar from '../assets/work/annanagar-heater.webp'
import avadi from '../assets/work/avadi-heaters.webp'
import './About.css'

const FACTS = [
  ['Established', `${BRAND.since} · Chennai`],
  ['Proprietor', BRAND.proprietor],
  ['Head office', 'Thirumullaivoyal, Chennai'],
  ['What we do', 'Supply, installation & maintenance'],
  ['MSME UAN', CREDENTIALS.msme],
  ['GSTIN', CREDENTIALS.gst],
]

// Real Suryan installations. `at` only where the client named the site.
const WORK = [
  { src: flatplate, title: 'Flat-plate water heater', note: 'With a Suryan tank', size: 'xl' },
  { src: perungalathur, title: 'LED solar street lights', at: 'Perungalathur' },
  { src: etc, title: 'Evacuated-tube water heater', note: 'Suryan ETC system', size: 'tall' },
  { src: annanagar, title: 'Flat-plate water heater', at: 'Anna Nagar' },
  { src: kanchipuram, title: '1 kW rooftop power plant', at: 'Kanchipuram', note: 'Waaree panels' },
  { src: avadi, title: 'Flat-plate water heaters', at: 'Avadi' },
  { src: install, title: 'ETC water heater', note: 'Installation in progress', size: 'wide' },
]

export default function About() {
  const root = useRef(null)
  const years = new Date().getFullYear() - BRAND.since

  useGSAP(
    () => {
      if (prefersReducedMotion()) return
      const q = gsap.utils.selector(root)

      // Spec sheet: each row's rule draws, then its words rise
      gsap.from(q('.about__facts > div'), {
        '--rule': 0,
        y: 22,
        opacity: 0,
        duration: 1.1,
        stagger: 0.08,
        ease: 'expo.out',
        scrollTrigger: { trigger: q('.about__facts')[0], start: 'top 85%', once: true },
      })

      // Photos: each tile wipes open from below while its picture settles, then drifts with the scroll
      q('.work__tile').forEach((tile, i) => {
        const media = tile.querySelector('.work__media')
        const img = tile.querySelector('img')
        gsap
          .timeline({ scrollTrigger: { trigger: tile, start: 'top 90%', once: true } })
          .fromTo(
            media,
            { clipPath: 'inset(100% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'expo.inOut', delay: (i % 4) * 0.08 },
          )
          .from(img, { scale: 1.35, duration: 1.8, ease: 'expo.out' }, '<0.25')
          .from(tile.querySelectorAll('figcaption > *'), { y: 16, opacity: 0, duration: 0.9, stagger: 0.06, ease: 'expo.out' }, '<0.5')
        gsap.fromTo(
          img,
          { yPercent: -6 },
          { yPercent: 6, ease: 'none', scrollTrigger: { trigger: tile, start: 'top bottom', end: 'bottom top', scrub: true } },
        )
      })
    },
    { scope: root },
  )

  return (
    <section ref={root} id="about" className="about section" data-tone="dark">
      <div className="container">
        <header className="about__head">
          <Label index="04">Who we are</Label>
          <h2 className="title" data-reveal="lines">
            Chennai’s own
            <br /> solar people, <em>since {BRAND.since}.</em>
          </h2>
        </header>

        <div className="about__grid">
          <div className="about__story">
            <p className="about__lede" data-reveal="up">
              {BRAND.legalName} started in Chennai in {BRAND.since}. Today we supply, install and maintain solar power
              plants, water heaters, street lights, pumps and inverters — for homes, offices, farms and industry.
            </p>
            <p className="lede" data-reveal="up">
              The business is led by proprietor {BRAND.proprietor}, who makes sure every job is carried out by a
              competent team, the right way — the way it has been done since day one.
            </p>
            <div className="about__years" data-reveal="up">
              <p className="about__years-num">
                <Odometer value={String(years)} mode="enter" duration={1.8} />
                <small>yrs</small>
              </p>
              <p className="mono">on Chennai roofs — and counting</p>
            </div>
          </div>

          <dl className="about__facts">
            {FACTS.map(([k, v]) => (
              <div key={k}>
                <dt className="mono">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="work">
          <div className="work__head">
            <p className="mono work__label">Completed sites</p>
            <p className="mono work__hint">Real Suryan installations</p>
          </div>
          <ul className="work__grid">
            {WORK.map((w) => (
              <li key={`${w.title}-${w.at || w.note}`} className={`work__tile work__tile--${w.size || 'std'}`}>
                <figure>
                  <div className="work__media">
                    <div className="work__zoom">
                      <img
                        src={w.src}
                        alt={`${w.title}${w.at ? ` at ${w.at}` : ''} — installed by ${BRAND.legalName}`}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>
                  <figcaption>
                    {w.at && (
                      <span className="work__at mono">
                        <i aria-hidden="true" /> {w.at}
                      </span>
                    )}
                    <span className="work__title">{w.title}</span>
                    {w.note && <span className="work__note mono">{w.note}</span>}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
