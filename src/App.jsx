import { useEffect, useState } from 'react'
import { gsap, ScrollTrigger, SplitText, useGSAP, prefersReducedMotion, hasFinePointer } from './lib/gsap'
import { initScroll, destroyScroll, getLenis, scrollToTarget } from './lib/scroll'
import { initScramble, initTilt } from './lib/interactions'
import Preloader from './components/Preloader'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Manifesto from './components/Manifesto'
import HowItWorks from './components/HowItWorks'
import Services from './components/Services'
import About from './components/About'
import Earth from './components/Earth'
import Calculator from './components/Calculator'
import Process from './components/Process'
import Sizes from './components/Sizes'
import FinePrint from './components/FinePrint'
import Faq from './components/Faq'
import Contact from './components/Contact'
import Footer from './components/Footer'
import WhatsAppFab from './components/WhatsAppFab'

export default function App() {
  // ?nointro skips the preloader (handy while developing / screenshotting)
  const [skipIntro] = useState(() => prefersReducedMotion() || new URLSearchParams(location.search).has('nointro'))
  const [ready, setReady] = useState(skipIntro)

  // Smooth scrolling (held still while the intro plays)
  useEffect(() => {
    const lenis = initScroll()
    window.scrollTo(0, 0)
    if (!skipIntro) lenis.stop()
    return () => destroyScroll()
  }, [skipIntro])

  useEffect(() => {
    if (ready) getLenis()?.start()
  }, [ready])

  // In-page links glide with Lenis
  useEffect(() => {
    const onClick = (e) => {
      const link = e.target.closest?.('a[href^="#"]')
      if (!link) return
      const id = link.getAttribute('href')
      const target = id.length > 1 ? document.querySelector(id) : null
      if (!target) return
      e.preventDefault()
      scrollToTarget(target)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  useGSAP(() => {
    const html = document.documentElement
    const reduce = prefersReducedMotion()
    const stops = []

    // The whole page eases between dark and light as sections pass the middle
    html.dataset.theme = 'dark'
    gsap.utils.toArray('[data-tone]').forEach((section) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) html.dataset.theme = section.dataset.tone
        },
      })
    })

    if (!reduce) {
      // Headlines rise line by line out of a mask
      gsap.utils.toArray('[data-reveal="lines"]').forEach((el) => {
        SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          linesClass: 'split-line',
          autoSplit: true,
          onSplit: (self) => {
            const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 86%', once: true } })
            tl.from(self.lines, { yPercent: 110, rotate: 2, transformOrigin: '0% 100%', duration: 1.4, stagger: 0.1 })
            // the italic accent arrives a beat later and settles into place
            const accents = el.querySelectorAll('em')
            if (accents.length) {
              tl.from(accents, { rotate: -7, scale: 0.86, transformOrigin: '0% 90%', duration: 1.7, ease: 'expo.out' }, 0.3)
            }
            return tl
          },
        })
      })

      // Big headings lean with scroll speed (desktop)
      if (hasFinePointer()) {
        const setters = gsap.utils.toArray('.title').map((t) => gsap.quickSetter(t, 'skewY', 'deg'))
        let skew = 0
        const lean = () => {
          const target = gsap.utils.clamp(-2.5, 2.5, (getLenis()?.velocity ?? 0) * -0.12)
          skew += (target - skew) * 0.12
          if (Math.abs(skew) < 0.004 && Math.abs(target) < 0.004) {
            if (skew !== 0) {
              skew = 0
              setters.forEach((set) => set(0))
            }
            return
          }
          setters.forEach((set) => set(skew))
        }
        gsap.ticker.add(lean)
        stops.push(() => gsap.ticker.remove(lean))
      }

      gsap.utils.toArray('[data-reveal="up"]').forEach((el) =>
        gsap.from(el, {
          y: 44,
          opacity: 0,
          duration: 1.3,
          scrollTrigger: { trigger: el, start: 'top 90%', once: true },
        }),
      )

      gsap.utils.toArray('.label__line').forEach((el) =>
        gsap.from(el, {
          scaleX: 0,
          duration: 1.4,
          ease: 'expo.inOut',
          scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        }),
      )
    }

    // Attribute-driven extras: [data-scramble] text decode, [data-tilt] 3D hover
    const stopScramble = initScramble()
    const stopTilt = initTilt()

    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => {
      window.removeEventListener('load', refresh)
      stopScramble()
      stopTilt()
      stops.forEach((fn) => fn())
    }
  })

  return (
    <>
      {!skipIntro && <Preloader onReveal={() => setReady(true)} />}
      <Cursor />
      <Nav ready={ready} />
      <main>
        <Hero ready={ready} />
        <Marquee />
        <Manifesto />
        <HowItWorks />
        <Services />
        <Earth />
        <About />
        <Calculator />
        <Process />
        <Sizes />
        <FinePrint />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <WhatsAppFab />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
