import { useEffect, useRef, useState } from 'react'
import { LandscapeRenderer } from '../lib/LandscapeRenderer'

/**
 * Mounts the WebGL landscape. `state` is a plain object the parent animates with GSAP
 * ({ rise, day, mist, cam }); the renderer reads it every frame.
 * `layout` must be a stable (module-level) function.
 */
export default function Landscape({ layout, state, className = '' }) {
  const host = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    // A fresh canvas per mount: a released WebGL context can't be reused.
    const canvas = document.createElement('canvas')
    host.current.appendChild(canvas)

    let renderer
    try {
      renderer = new LandscapeRenderer(canvas, { layout, state })
    } catch (err) {
      console.warn('Landscape shader unavailable, using CSS fallback:', err)
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
  }, [layout, state])

  return <div ref={host} className={`land ${failed ? 'land--fallback' : ''} ${className}`} aria-hidden="true" />
}
