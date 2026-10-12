import { useEffect, useLayoutEffect, useRef } from 'react'
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/gsap'
import './Odometer.css'

const LAPS = 3 // each drum holds 0–9 three times, so it can spin extra laps on entry

/**
 * Rolling-digit number. Non-digits (commas, dots, ₹) stay static; every digit is a drum.
 *
 *   <Odometer value="78,000" mode="enter" />   rolls up from zero when scrolled into view (once)
 *   <Odometer value={kwString} />             rolls between values whenever `value` changes
 *
 * The real value is in an sr-only span; drums are aria-hidden. Uses tabular figures, so the
 * width of a digit never changes while it rolls.
 */
export default function Odometer({ value, mode = 'change', duration = 1.1, stagger = 0.06, className = '' }) {
  const root = useRef(null)
  const shown = useRef(null)
  const chars = [...String(value)]
  const count = chars.length

  const roll = (animate, extraLaps = false) => {
    const strips = root.current?.querySelectorAll('.odo__strip')
    if (!strips) return
    const reduce = prefersReducedMotion()
    strips.forEach((strip, k) => {
      const digit = Number(strip.dataset.digit)
      // land in the last lap so there is always room to spin forwards
      const index = (LAPS - 1) * 10 + digit
      const target = (-100 * index) / (LAPS * 10)
      if (!animate || reduce) {
        gsap.set(strip, { yPercent: target })
        return
      }
      const fromRight = strips.length - 1 - k
      gsap.to(strip, {
        yPercent: target,
        duration: duration + (extraLaps ? fromRight * 0.12 : 0),
        delay: extraLaps ? k * stagger : fromRight * stagger * 0.5,
        ease: 'expo.out',
        overwrite: true,
      })
    })
  }

  // Value changes (mode="change"): roll from the current position to the new digits
  useLayoutEffect(() => {
    if (mode !== 'change') return
    roll(shown.current !== null)
    shown.current = value
  }, [value, mode]) // eslint-disable-line react-hooks/exhaustive-deps

  // Entry roll (mode="enter"): start at zero, spin up once it scrolls into view
  useEffect(() => {
    if (mode !== 'enter') return
    const strips = root.current.querySelectorAll('.odo__strip')
    if (prefersReducedMotion()) {
      roll(false)
      return
    }
    gsap.set(strips, { yPercent: 0 })
    const st = ScrollTrigger.create({
      trigger: root.current,
      start: 'top 88%',
      once: true,
      onEnter: () => roll(true, true),
    })
    return () => st.kill()
  }, [mode, value]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <span ref={root} className={`odo ${className}`}>
      <span className="sr-only">{value}</span>
      <span className="odo__digits" aria-hidden="true">
        {chars.map((ch, i) => {
          // key from the right, so drums persist when the number gains/loses digits
          const key = count - i
          if (ch < '0' || ch > '9') {
            return (
              <span key={`s${key}`} className="odo__sep">
                {ch}
              </span>
            )
          }
          return (
            <span key={`d${key}`} className="odo__d">
              <span className="odo__ghost">{ch}</span>
              <span className="odo__win">
                <span className="odo__strip" data-digit={ch}>
                  {Array.from({ length: LAPS * 10 }, (_, k) => (
                    <span key={k}>{k % 10}</span>
                  ))}
                </span>
              </span>
            </span>
          )
        })}
      </span>
    </span>
  )
}
