import { whatsappLink } from '../lib/leads'
import Button from './ui/Button'
import { WhatsApp } from './ui/Icons'
import './CtaBand.css'

/** Closing call to action at the foot of every page except Contact. */
export default function CtaBand() {
  return (
    <section className="cta-band section" data-tone="dark">
      <div className="cta-band__sun" aria-hidden="true" />
      <div className="container cta-band__inner">
        <h2 className="title" data-reveal="lines">
          Ready when
          <br /> the <em>sun</em> is.
        </h2>
        <div className="cta-band__side">
          <p className="lede" data-reveal="up">
            Book a free site visit, or just say hello on WhatsApp — we’ll take it from there.
          </p>
          <div className="cta-band__actions" data-reveal="up">
            <Button href="/contact">Book a free site visit</Button>
            <Button href={whatsappLink()} variant="ghost" icon={<WhatsApp />} target="_blank" rel="noopener noreferrer">
              WhatsApp us
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
