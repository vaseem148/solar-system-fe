import installation from '../assets/work/installation.webp'
import maintenance from '../assets/work/maintenance.webp'
import Label from './ui/Label'
import { Check } from './ui/Icons'
import './ServiceDetails.css'

// The two services from the client's old site, in their words
const SERVICES = [
  {
    title: 'Installation',
    kicker: 'Solar panels & water heaters',
    img: installation,
    text: 'Working with a belief to keep our customers satisfied, every installation is carried out with high-quality resources under the guidance of our experienced people — and appreciated by clients for its performance.',
    specs: ['Grid-tie plants', '1 kW to 100 kW', 'Material procured at the customer’s end'],
    features: ['Superior-quality components', 'Timely, on schedule', 'Carried out by a team of experts'],
  },
  {
    title: 'Maintenance',
    kicker: 'Solar power plants',
    img: maintenance,
    text: 'Our commitment to customer satisfaction has brought us repeat business. Maintenance is carried out by our experienced team, and we keep upgrading our processes to give reliable service.',
    specs: ['Photovoltaic plants', 'Industrial applications', 'Preventive care & repairs'],
    features: ['High-quality service', 'Skilled, experienced professionals', 'Repeat business from our clients'],
  },
]

export default function ServiceDetails() {
  return (
    <section className="sdetail section" data-tone="light">
      <div className="container">
        <header className="sdetail__head">
          <Label index="03">Installation & care</Label>
          <h2 className="title" data-reveal="lines">
            Fitted right.
            <br /> <em>Looked after.</em>
          </h2>
        </header>
        <div className="sdetail__grid">
          {SERVICES.map((s) => (
            <article key={s.title} className="scard" data-reveal="up">
              <div className="scard__media">
                <img src={s.img} alt={`${s.title} by our team`} loading="lazy" decoding="async" />
              </div>
              <div className="scard__body">
                <p className="mono scard__kicker">{s.kicker}</p>
                <h3 className="scard__title">{s.title}</h3>
                <p className="scard__text">{s.text}</p>
                <ul className="scard__features">
                  {s.features.map((f) => (
                    <li key={f}>
                      <Check /> {f}
                    </li>
                  ))}
                </ul>
                <p className="scard__specs">
                  {s.specs.map((t) => (
                    <span key={t} className="mono">
                      {t}
                    </span>
                  ))}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
