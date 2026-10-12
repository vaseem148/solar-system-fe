// Shared, attribute-driven interactions — any section can opt in from markup:
//
//   data-scramble            mono text decodes from random glyphs when it scrolls into view
//     data-scramble-chars    optional glyph set (e.g. "0123456789" for numbers)
//     data-scramble-delay    optional delay in seconds
//   data-tilt="7"            3D pointer tilt (max degrees); add data-tilt-glare for a light sheen
//   data-tilt-lift="10"      also lifts the element (px) while hovered
//
// Section labels (.label) scramble automatically.

import { gsap, ScrollTrigger, prefersReducedMotion, hasFinePointer } from './gsap'

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%/+<>=*·'
const STEP = 0.055 // seconds between glyph changes — slower than a frame so the noise stays legible
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
const esc = (c) => ESC[c] || c
const isWordChar = (c) => /[\p{L}\p{N}]/u.test(c)
const overlays = new WeakMap()

// Deterministic per (char, step) so the noise is identical when a timeline plays backwards
const glyphAt = (set, i, step, seed) => {
  let h = (i * 374761393 + step * 668265263 + seed) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return set[((h ^ (h >>> 16)) >>> 0) % set.length]
}

/** Text the element shows, ignoring our own overlay. */
const textOf = (el, overlay) =>
  [...el.childNodes]
    .filter((n) => n !== overlay)
    .map((n) => n.textContent)
    .join('')

/** Hide the real text until its decode starts (layout untouched — only the glyph fill is hidden). */
export function prepareScramble(el) {
  el.classList.add('scramble-pending')
}

/**
 * Decode `el`'s text from noise to its real value.
 *
 * The real text never moves: it stays in the DOM (React keeps owning it, screen readers keep reading it)
 * with a transparent glyph fill, while an aria-hidden overlay sitting at the text's own static position
 * plays the decode on top. So the effect can never shift layout, whatever the font.
 */
export function scramble(el, { duration = 0.9, delay = 0, chars } = {}) {
  const set = chars || el.dataset.scrambleChars || GLYPHS
  const seed = (Math.random() * 1e9) | 0
  const proxy = { t: 0 }
  let overlay = overlays.get(el)
  let plan = null
  let last = ''

  const mount = () => {
    if (!overlay) {
      overlay = document.createElement('span')
      overlay.className = 'scramble__overlay'
      overlay.setAttribute('aria-hidden', 'true')
      overlays.set(el, overlay)
    }
    if (!plan) {
      const text = textOf(el, overlay)
      const cps = [...text]
      const n = Math.max(1, cps.length)
      // A wave sweeps left → right; each character flickers for a moment, then locks in.
      plan = cps.map((c, i) => {
        if (/\s/.test(c)) return { c, space: true }
        const appear = (i / n) * duration * 0.42 + Math.random() * duration * 0.06
        const settle = isWordChar(c)
          ? Math.min(duration * 0.985, appear + duration * (0.2 + Math.random() * 0.3))
          : appear
        return { c, appear, settle }
      })
    }
    if (!overlay.isConnected) {
      const cs = getComputedStyle(el)
      if (cs.display === 'inline') {
        overlay.style.width = ''
        overlay.style.whiteSpace = 'pre'
      } else {
        // clientWidth is rounded down; +1px so a fractional-width line can't wrap early
        const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight)
        overlay.style.width = `${Math.max(0, el.clientWidth - padX + 1)}px`
        overlay.style.whiteSpace = ''
      }
      el.prepend(overlay)
    }
    el.classList.add('scramble-active')
    el.classList.remove('scramble-pending')
  }

  const render = () => {
    if (!overlay?.isConnected) mount()
    const t = proxy.t
    const step = Math.floor(t / STEP)
    let out = ''
    for (let i = 0; i < plan.length; i++) {
      const p = plan[i]
      if (p.space) out += p.c
      else if (t < p.appear) out += `<span class="scramble__ghost">${esc(p.c)}</span>`
      else if (t < p.settle) out += `<span class="scramble__glyph">${esc(glyphAt(set, i, step, seed))}</span>`
      else out += esc(p.c)
    }
    if (out !== last) {
      overlay.innerHTML = out
      last = out
    }
  }

  const unmount = (pending) => {
    overlay?.remove()
    last = ''
    el.classList.remove('scramble-active')
    el.classList.toggle('scramble-pending', pending)
  }

  return gsap.to(proxy, {
    t: duration,
    duration,
    delay,
    ease: 'none',
    onStart: mount,
    onUpdate: render,
    onComplete: () => unmount(false),
    onReverseComplete: () => unmount(true),
  })
}

export function initScramble(root = document) {
  if (prefersReducedMotion()) return () => {}
  const targets = [...new Set(root.querySelectorAll('[data-scramble], .label > span:last-child'))]
  const tweens = []
  const triggers = targets.map((el) => {
    prepareScramble(el)
    const len = textOf(el, overlays.get(el)).trim().length
    return ScrollTrigger.create({
      trigger: el,
      // clamp() so text near the very bottom of the page still decodes; end at max so a jump past it
      // still counts as having entered.
      start: 'clamp(top 92%)',
      end: 'max',
      once: true,
      onEnter: () =>
        tweens.push(
          scramble(el, {
            duration: Math.min(1.15, 0.4 + len * 0.032),
            delay: Number(el.dataset.scrambleDelay) || 0,
          }),
        ),
    })
  })
  return () => {
    triggers.forEach((t) => t.kill())
    tweens.forEach((t) => t.progress(1).kill())
    targets.forEach((el) => el.classList.remove('scramble-pending', 'scramble-active'))
  }
}

export function initTilt(root = document) {
  if (!hasFinePointer() || prefersReducedMotion()) return () => {}
  const cleanups = []

  root.querySelectorAll('[data-tilt]').forEach((el) => {
    const max = Number(el.dataset.tilt) || 7
    const lift = Number(el.dataset.tiltLift) || 0
    gsap.set(el, { transformPerspective: 1000 })
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3' })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3' })

    let glare = null
    if (el.hasAttribute('data-tilt-glare')) {
      glare = document.createElement('span')
      glare.className = 'tilt-glare'
      glare.setAttribute('aria-hidden', 'true')
      el.appendChild(glare)
    }

    const enter = () => lift && gsap.to(el, { y: -lift, duration: 0.7, ease: 'expo.out' })
    const move = (e) => {
      const r = el.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      ry(px * max * 2)
      rx(-py * max * 2)
      if (glare) {
        glare.style.setProperty('--gx', `${(px + 0.5) * 100}%`)
        glare.style.setProperty('--gy', `${(py + 0.5) * 100}%`)
        glare.style.opacity = '1'
      }
    }
    const leave = () => {
      rx(0)
      ry(0)
      if (lift) gsap.to(el, { y: 0, duration: 0.9, ease: 'expo.out' })
      if (glare) glare.style.opacity = '0'
    }

    el.addEventListener('pointerenter', enter)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    cleanups.push(() => {
      el.removeEventListener('pointerenter', enter)
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      glare?.remove()
      gsap.set(el, { clearProps: 'transform' })
    })
  })

  return () => cleanups.forEach((fn) => fn())
}
