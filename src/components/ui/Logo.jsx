import wordmark from '../../assets/brand/logo-wordmark.png'
import full from '../../assets/brand/logo-full.png'
import monogram from '../../assets/brand/logo-monogram.png'
import { BRAND } from '../../config'

// The client's logo in its own colours (green wordmark, red tagline), cut off its black background.

/** "Suryan Energy Systems"; `tagline` adds the red "use solar energy save green earth" line. */
export function Logo({ className = '', tagline = false, decorative = false }) {
  return (
    <img
      className={`logo ${tagline ? 'logo--full' : ''} ${className}`}
      src={tagline ? full : wordmark}
      alt={decorative ? '' : BRAND.legalName}
      draggable="false"
    />
  )
}

/** The stacked "SE" monogram on its own. */
export function Monogram({ className = '' }) {
  return <img className={`logo logo--mark ${className}`} src={monogram} alt="" draggable="false" />
}
