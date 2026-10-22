import wordmark from '../../assets/brand/wordmark.png'
import monogram from '../../assets/brand/monogram.png'
import { BRAND } from '../../config'

// The client's logo is drawn through a CSS mask (see .logo in global.css), so one transparent PNG
// takes whatever colour the surface needs: brand green on light sections, bone on dark ones.

/** "Suryan Energy Systems" wordmark. Decorative when the surrounding link already names the brand. */
export function Logo({ className = '', decorative = false }) {
  return (
    <span
      className={`logo ${className}`}
      style={{ '--logo-src': `url(${wordmark})` }}
      {...(decorative ? { 'aria-hidden': true } : { role: 'img', 'aria-label': BRAND.legalName })}
    />
  )
}

/** The stacked "SE" monogram on its own. */
export function Monogram({ className = '' }) {
  return <span className={`logo logo--mark ${className}`} style={{ '--logo-src': `url(${monogram})` }} aria-hidden="true" />
}
