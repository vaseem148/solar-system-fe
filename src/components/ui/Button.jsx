import { useRef } from 'react'
import { prefersReducedMotion } from '../../lib/gsap'
import { ArrowUpRight } from './Icons'
import { useMagnetic } from '../../hooks/useMagnetic'

/**
 * Pill button with a rolling label, curved hover fill, an arrow that swaps on hover,
 * a small sunburst on press and a magnetic pull. Renders an <a> when `href` is given.
 *
 * iconMotion: 'ne' (arrow exits top-right), 's' (arrow drops down) or 'pop' (non-arrow icons).
 */
export default function Button({
  children,
  href,
  variant = 'sun',
  size,
  block = false,
  icon,
  iconMotion,
  magnetic = true,
  className = '',
  onPointerDown,
  ...rest
}) {
  const ref = useRef(null)
  useMagnetic(ref, magnetic ? 0.28 : 0)

  const Tag = href ? 'a' : 'button'
  const text = typeof children === 'string' ? children : undefined
  const glyph = icon === undefined ? <ArrowUpRight /> : icon
  const motion = iconMotion ?? (icon === undefined ? 'ne' : 'pop')
  const classes = [
    'btn',
    `btn--${variant}`,
    size && `btn--${size}`,
    block && 'btn--block',
    !glyph && 'btn--plain',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const burst = (e) => {
    onPointerDown?.(e)
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    const r = el.getBoundingClientRect()
    const holder = document.createElement('span')
    holder.className = 'btn__burst'
    holder.setAttribute('aria-hidden', 'true')
    holder.style.left = `${e.clientX - r.left}px`
    holder.style.top = `${e.clientY - r.top}px`
    for (let i = 0; i < 8; i++) {
      const ray = document.createElement('i')
      ray.style.setProperty('--a', `${i * 45 + 22.5}deg`)
      holder.appendChild(ray)
    }
    el.appendChild(holder)
    setTimeout(() => holder.remove(), 650)
  }

  return (
    <Tag ref={ref} href={href} className={classes} onPointerDown={burst} {...rest}>
      <span className="btn__label">
        <span data-text={text}>{children}</span>
      </span>
      {glyph && (
        <span className={`btn__icon btn__icon--${motion}`}>
          {motion === 'pop' ? (
            glyph
          ) : (
            <>
              <span className="btn__glyph">{glyph}</span>
              <span className="btn__glyph btn__glyph--in" aria-hidden="true">
                {glyph}
              </span>
            </>
          )}
        </span>
      )}
    </Tag>
  )
}
