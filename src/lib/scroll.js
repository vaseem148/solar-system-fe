import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'

let lenis = null
let tick = null

export function initScroll() {
  if (lenis) return lenis
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true, autoRaf: false })
  lenis.on('scroll', ScrollTrigger.update)
  tick = (time) => lenis.raf(time * 1000)
  gsap.ticker.add(tick)
  // Keep GSAP's lag smoothing: if the main thread stalls (e.g. compiling the sun shader on a slow
  // phone), timelines like the preloader pause instead of jumping straight to their end.
  gsap.ticker.lagSmoothing(500, 33)
  return lenis
}

export function destroyScroll() {
  if (!lenis) return
  gsap.ticker.remove(tick)
  lenis.destroy()
  lenis = null
}

export const getLenis = () => lenis

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Smooth-scroll to a selector, element or pixel offset. */
export function scrollToTarget(target, options = {}) {
  const el = typeof target === 'string' ? document.querySelector(target) : target
  if (el == null) return
  if (lenis) {
    lenis.scrollTo(el, { duration: 1.6, easing: easeInOutCubic, force: true, ...options })
  } else if (typeof el === 'number') {
    window.scrollTo({ top: el, behavior: 'smooth' })
  } else {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}
