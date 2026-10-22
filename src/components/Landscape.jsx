import { useEffect, useRef, useState } from 'react'
import { LandscapeRenderer } from '../lib/LandscapeRenderer'

/**
 * Mounts the WebGL landscape. `state` is a plain object the parent animates with GSAP
 * ({ rise, day, mist, cam, night }); the renderer reads it every frame.
 * `layout` must be a stable (module-level) function; `palette` is 'sunrise' or 'sunset'.
 *
 * The shader is big, so it isn't compiled at page load: it starts once the section is a few screens
 * away — or, with `warm`, once the page has settled — and compiles in the background. The CSS
 * gradient behind the canvas stands in until the first frame fades in.
 */
export default function Landscape({ palette = 'sunrise', layout, state, warm = false, className = '' }) {
  const host = useRef(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const el = host.current
    let canvas
    let renderer
    let io
    let ro
    let idle

    const start = () => {
      if (renderer || canvas) return
      near.disconnect()
      clearTimeout(idle)
      // A fresh canvas per mount: a released WebGL context can't be reused.
      canvas = document.createElement('canvas')
      el.appendChild(canvas)
      const fail = (err) => {
        console.warn('Landscape shader unavailable, using CSS fallback:', err)
        canvas.remove()
        setFailed(true)
      }
      try {
        renderer = new LandscapeRenderer(canvas, { palette, layout, state, onError: fail })
      } catch (err) {
        fail(err)
        return
      }
      io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? renderer.play() : renderer.pause()), {
        rootMargin: '120px 0px',
      })
      io.observe(canvas)
      ro = new ResizeObserver(() => renderer.resize())
      ro.observe(canvas)
    }

    const near = new IntersectionObserver(([entry]) => entry.isIntersecting && start(), { rootMargin: '300% 0px' })
    near.observe(el)
    if (warm) idle = setTimeout(start, 1000)

    return () => {
      near.disconnect()
      clearTimeout(idle)
      io?.disconnect()
      ro?.disconnect()
      renderer?.destroy()
      canvas?.remove()
    }
  }, [palette, layout, state, warm])

  return <div ref={host} className={`land ${failed ? 'land--fallback' : ''} ${className}`} aria-hidden="true" />
}
