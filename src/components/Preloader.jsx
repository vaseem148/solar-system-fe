import { useRef, useState } from 'react'
import { gsap, useGSAP } from '../lib/gsap'
import { LOCATION } from '../config'
import { Logo } from './ui/Logo'
import './Preloader.css'

const SEEN_KEY = 'solar:intro-seen'
const DRUM = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0]

function seenBefore() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * A mechanical odometer: the ones drum turns continuously, each higher drum
 * rolls over only while the drum below passes from 9 to 0.
 */
function drumPositions(v) {
  const ones = v % 10
  const tens = (Math.floor(v / 10) % 10) + Math.max(0, (v % 10) - 9)
  const hundreds = (Math.floor(v / 100) % 10) + Math.max(0, (v % 100) - 99)
  return [hundreds, tens, ones]
}

/** Counter + growing sun with a turning corona, which floods the screen and lifts away. */
export default function Preloader({ onReveal }) {
  const root = useRef(null)
  const [done, setDone] = useState(false)

  useGSAP(
    () => {
      const q = gsap.utils.selector(root)
      const strips = q('.pre__strip')
      const quick = seenBefore()
      const D = quick ? 0.8 : 2
      const count = { v: 0 }
      const setDrums = () =>
        drumPositions(count.v).forEach((p, i) => {
          strips[i].style.transform = `translateY(${(-p * 100) / DRUM.length}%)`
        })
      setDrums()

      gsap
        .timeline({ onComplete: () => setDone(true) })
        .from(q('.pre__reveal > span'), { yPercent: 110, duration: 1, stagger: 0.06 }, 0.05)
        .to(count, { v: 100, duration: D, ease: 'power3.inOut', onUpdate: setDrums }, 0.15)
        .fromTo(q('.pre__bar i'), { scaleX: 0 }, { scaleX: 1, duration: D, ease: 'power3.inOut' }, 0.15)
        .fromTo(q('.pre__sun'), { scale: 0.001 }, { scale: 1, duration: D, ease: 'power3.inOut' }, 0.15)
        .fromTo(q('.pre__corona'), { opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1, duration: D * 0.8, ease: 'power2.out' }, 0.35)
        .to(q('.pre__dawn'), { opacity: 1, duration: 0.9, ease: 'power2.in' }, D - 0.15)
        .to(q('.pre__reveal > span, .pre__odo'), { yPercent: -110, duration: 0.6, ease: 'expo.in', stagger: 0.03 }, D + 0.15)
        .to(q('.pre__corona'), { opacity: 0, scale: 1.6, duration: 0.5, ease: 'power2.in' }, D + 0.2)
        .to(q('.pre__sun'), { scale: 26, duration: 1, ease: 'expo.in' }, D + 0.25)
        .add(() => {
          try {
            sessionStorage.setItem(SEEN_KEY, '1')
          } catch {
            /* private mode */
          }
          onReveal?.()
        }, D + 1.05)
        .to(root.current, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.15, ease: 'expo.inOut' }, D + 1)
    },
    { scope: root },
  )

  if (done) return null

  return (
    <div ref={root} className="pre on-dark" aria-hidden="true">
      <div className="pre__dawn" />
      <div className="pre__top mono">
        <span className="pre__reveal">
          <span>
            <span className="logo-plate pre__plate">
              <Logo className="pre__logo" tagline />
            </span>
          </span>
        </span>
        <span className="pre__reveal">
          <span>Rooftop solar · {LOCATION.label}</span>
        </span>
      </div>

      <div className="pre__corona" />
      <div className="pre__sun" />

      <div className="pre__bottom">
        <p className="pre__note mono">
          <span className="pre__reveal">
            <span>Sunlight takes 8 min 20 s to reach your roof.</span>
          </span>
          <span className="pre__reveal">
            <span>This takes about two.</span>
          </span>
        </p>
        <p className="pre__count">
          <span className="pre__mask">
            <span className="pre__odo">
              {[0, 1, 2].map((k) => (
                <span className="pre__drum" key={k}>
                  <span className="pre__ghost">0</span>
                  <span className="pre__strip">
                    {DRUM.map((d, i) => (
                      <span key={i}>{d}</span>
                    ))}
                  </span>
                </span>
              ))}
            </span>
          </span>
          <span className="pre__pct">%</span>
        </p>
      </div>
      <div className="pre__bar">
        <i />
      </div>
    </div>
  )
}
