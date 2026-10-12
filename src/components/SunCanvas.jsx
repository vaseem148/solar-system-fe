import { useEffect, useRef, useState } from 'react'
import { SunRenderer } from '../lib/SunRenderer'

/**
 * Mounts the WebGL sun. `state` is a plain object the parent animates
 * with GSAP ({ rise, lift, scale, heat }); the renderer reads it every frame.
 * `layout` must be a stable (module-level) function.
 */
export default function SunCanvas({ variant = 'rise', layout, state, className = '' }) {
  const host = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    // A fresh canvas per mount: a released WebGL context can't be reused.
    const canvas = document.createElement('canvas')
    host.current.appendChild(canvas)

    let renderer
    try {
      renderer = new SunRenderer(canvas, { variant, layout, state })
    } catch (err) {
      console.warn('Sun shader unavailable, using CSS fallback:', err)
      canvas.remove()
      setFailed(true)
      return
    }

    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? renderer.play() : renderer.pause()),
      { rootMargin: '120px 0px' },
    )
    io.observe(canvas)
    const ro = new ResizeObserver(() => renderer.resize())
    ro.observe(canvas)

    return () => {
      io.disconnect()
      ro.disconnect()
      renderer.destroy()
      canvas.remove()
    }
  }, [variant, layout, state])

  return (
    <div
      ref={host}
      className={`sun sun--${variant} ${failed ? 'sun--fallback' : ''} ${className}`}
      aria-hidden="true"
    />
  )
}
