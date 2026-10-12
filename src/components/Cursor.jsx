import { useEffect, useRef } from 'react'
import { gsap, hasFinePointer } from '../lib/gsap'
import './Cursor.css'

const TARGETS = '[data-cursor], a, button, label, [role="button"], input[type="range"]'
// Elements the ring wraps itself around (instead of growing into a disc)
const HUG = '.btn, .nav__burger'

/**
 * Dot + lagging ring. The ring hugs buttons (sticky, with a little magnetic play),
 * grows over links, shows a label over [data-cursor], and ripples on every click.
 */
export default function Cursor() {
  const root = useRef(null)

  useEffect(() => {
    if (!hasFinePointer()) return
    const el = root.current
    const dot = el.querySelector('.cursor__dot')
    const ring = el.querySelector('.cursor__ring')
    const label = el.querySelector('.cursor__label')
    document.documentElement.classList.add('has-cursor')

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 })
    const dx = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' })
    const dy = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' })
    const rx = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' })
    const ry = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' })

    let visible = false
    let hug = null
    const pointer = { x: 0, y: 0 }

    const placeRing = () => {
      if (hug && hug.isConnected) {
        const r = hug.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        // sticky to the button's centre, with a little pull towards the pointer
        rx(cx + (pointer.x - cx) * 0.12)
        ry(cy + (pointer.y - cy) * 0.12)
      } else {
        rx(pointer.x)
        ry(pointer.y)
      }
    }

    const setHug = (target) => {
      if (target === hug) return
      hug = target
      el.classList.toggle('is-hug', !!target)
      if (target) {
        const r = target.getBoundingClientRect()
        const radius = getComputedStyle(target).borderRadius
        gsap.to(ring, {
          width: r.width + 10,
          height: r.height + 10,
          borderRadius: radius === '50%' ? '50%' : `${r.height / 2 + 5}px`,
          duration: 0.45,
          ease: 'expo.out',
          overwrite: 'auto',
        })
      } else {
        // size back down, then hand sizing back to CSS (links / labels)
        gsap.to(ring, {
          width: 38,
          height: 38,
          borderRadius: '50%',
          duration: 0.4,
          ease: 'expo.out',
          overwrite: 'auto',
          onComplete: () => gsap.set(ring, { clearProps: 'width,height,borderRadius' }),
        })
      }
    }

    const move = (e) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
      if (!visible) {
        gsap.set([dot, ring], { x: e.clientX, y: e.clientY })
        gsap.to(el, { autoAlpha: 1, duration: 0.3 })
        visible = true
      }
      dx(e.clientX)
      dy(e.clientY)
      placeRing()
    }

    const over = (e) => {
      const target = e.target.closest?.(TARGETS)
      const hugTarget = e.target.closest?.(HUG)
      const text = target?.closest('[data-cursor]')?.dataset.cursor
      setHug(hugTarget && !text ? hugTarget : null)
      el.classList.toggle('is-link', !!target && !text && !hugTarget)
      el.classList.toggle('has-label', !!text)
      if (text) label.textContent = text
    }

    const ripple = (e) => {
      el.classList.add('is-down')
      const r = document.createElement('span')
      r.className = 'cursor__ripple'
      el.appendChild(r)
      gsap.set(r, { x: e.clientX, y: e.clientY, xPercent: -50, yPercent: -50 })
      gsap.fromTo(r, { scale: 0.3, opacity: 0.7 }, { scale: 2.4, opacity: 0, duration: 0.7, ease: 'expo.out', onComplete: () => r.remove() })
    }
    const up = () => el.classList.remove('is-down')
    const leave = () => {
      gsap.to(el, { autoAlpha: 0, duration: 0.3 })
      visible = false
    }
    // Buttons move (magnetic pull, scroll) — keep the hug glued to them
    const follow = () => hug && placeRing()

    window.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerover', over)
    window.addEventListener('pointerdown', ripple)
    window.addEventListener('pointerup', up)
    document.documentElement.addEventListener('pointerleave', leave)
    gsap.ticker.add(follow)

    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerover', over)
      window.removeEventListener('pointerdown', ripple)
      window.removeEventListener('pointerup', up)
      document.documentElement.removeEventListener('pointerleave', leave)
      gsap.ticker.remove(follow)
    }
  }, [])

  return (
    <div ref={root} className="cursor" aria-hidden="true">
      <div className="cursor__ring">
        <span className="cursor__label" />
      </div>
      <div className="cursor__dot" />
    </div>
  )
}
