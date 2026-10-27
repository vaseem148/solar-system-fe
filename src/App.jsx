import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { gsap, ScrollTrigger, SplitText, useGSAP, prefersReducedMotion, hasFinePointer } from './lib/gsap'
import { initScroll, destroyScroll, getLenis, scrollToTarget } from './lib/scroll'
import { initScramble, initTilt } from './lib/interactions'
import { setNavigator } from './lib/navigate'
import { pageFor } from './routes'
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
import CtaBand from './components/CtaBand'
import Products from './components/Products'
import ProductsTeaser from './components/ProductsTeaser'
import ServiceDetails from './components/ServiceDetails'
import { BlogList, BlogPost } from './components/Blog'
import Footer from './components/Footer'
import WhatsAppFab from './components/WhatsAppFab'
import { Monogram } from './components/ui/Logo'

const jumpToTop = () => {
  getLenis()?.scrollTo(0, { immediate: true, force: true })
  window.scrollTo(0, 0)
}

export default function App() {
  // ?nointro skips the preloader (handy while developing / screenshotting)
  const [skipIntro] = useState(() => prefersReducedMotion() || new URLSearchParams(location.search).has('nointro'))
  const [ready, setReady] = useState(skipIntro)
  const { pathname, hash } = useLocation()
  const navigate = useNavigate()
  const curtain = useRef(null)
  const moving = useRef(false)

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

  // Changing page: an orange curtain sweeps up, the page swaps behind it, then it lifts away
  const go = useCallback(
    (to) => {
      const url = new URL(to, window.location.href)
      if (url.pathname === window.location.pathname) {
        scrollToTarget(url.hash ? document.querySelector(url.hash) ?? 0 : 0)
        return
      }
      if (moving.current) return
      const el = curtain.current
      if (!el || prefersReducedMotion()) {
        jumpToTop()
        navigate(url.pathname + url.hash)
        return
      }
      moving.current = true
      el.querySelector('.curtain__label').textContent = pageFor(url.pathname).label
      getLenis()?.stop()
      gsap
        .timeline()
        .set(el, { visibility: 'visible', yPercent: 100 })
        .set(el.querySelectorAll('.curtain__mark, .curtain__label'), { y: 40, opacity: 0 })
        .to(el, { yPercent: 0, duration: 0.65, ease: 'expo.inOut' })
        .to(el.querySelectorAll('.curtain__mark, .curtain__label'), { y: 0, opacity: 1, duration: 0.5, ease: 'expo.out', stagger: 0.06 }, 0.35)
        .add(() => {
          // jump to the top before the new page mounts, so its scroll triggers start from a clean slate
          jumpToTop()
          navigate(url.pathname + url.hash)
        }, '>-0.05')
    },
    [navigate],
  )

  useEffect(() => setNavigator(go), [go])

  // Same-site links (anywhere on the page) go through the curtain; #anchors glide with Lenis
  useEffect(() => {
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = e.target.closest?.('a[href]')
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return
      const href = link.getAttribute('href')
      if (href.startsWith('#')) {
        e.preventDefault()
        scrollToTarget((href.length > 1 && document.querySelector(href)) || 0)
        return
      }
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin || !/^https?:$/.test(url.protocol)) return
      e.preventDefault()
      go(url.pathname + url.hash)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [go])

  // A new page is on screen: title, scroll position, fresh trigger positions, then lift the curtain
  const firstRender = useRef(true)
  useLayoutEffect(() => {
    document.title = pageFor(pathname).title
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    jumpToTop()
    // a #section in the link: glide down to it once the page is showing
    const toHash = () => hash && scrollToTarget(document.querySelector(hash) ?? 0)
    const el = curtain.current
    const covered = moving.current && el
    requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      getLenis()?.resize()
      if (!covered) setTimeout(toHash, 120)
    })
    if (!covered) return
    gsap
      .timeline({
        onComplete: () => {
          moving.current = false
          gsap.set(el, { visibility: 'hidden' })
          toHash()
        },
      })
      .to(el.querySelectorAll('.curtain__mark, .curtain__label'), { y: -30, opacity: 0, duration: 0.35, ease: 'power2.in' }, 0.15)
      .to(el, { yPercent: -100, duration: 0.8, ease: 'expo.inOut' }, 0.2)
      .add(() => getLenis()?.start(), 0.45)
  }, [pathname, hash])

  // Page-wide scroll effects, rebuilt for each page (the previous page's are reverted first)
  useGSAP(
    () => {
      const html = document.documentElement
      const reduce = prefersReducedMotion()
      const stops = []

      // Fixed chrome (nav, WhatsApp button) takes the tone of the section in view
      html.dataset.theme = document.querySelector('main [data-tone]')?.dataset.tone ?? 'dark'
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
    },
    { dependencies: [pathname], revertOnUpdate: true },
  )

  return (
    <>
      {!skipIntro && <Preloader onReveal={() => setReady(true)} />}
      <Cursor />
      <Nav ready={ready} />
      <main>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Hero ready={ready} />
                <Marquee />
                <Manifesto />
                <Earth />
                <ProductsTeaser />
                <CtaBand />
              </>
            }
          />
          <Route
            path="/about"
            element={
              <>
                <About />
                <FinePrint />
                <CtaBand />
              </>
            }
          />
          <Route
            path="/products"
            element={
              <>
                <Products />
                <CtaBand />
              </>
            }
          />
          <Route
            path="/services"
            element={
              <>
                <Services />
                <Sizes />
                <ServiceDetails />
                <CtaBand />
              </>
            }
          />
          <Route
            path="/how-it-works"
            element={
              <>
                <HowItWorks />
                <Process />
                <CtaBand />
              </>
            }
          />
          <Route
            path="/blog"
            element={
              <>
                <BlogList />
                <CtaBand />
              </>
            }
          />
          <Route
            path="/blog/:slug"
            element={
              <>
                <BlogPost />
                <CtaBand />
              </>
            }
          />
          <Route path="/estimate" element={<Calculator />} />
          {/* the FAQ lives on the Contact page, under the form */}
          <Route
            path="/contact"
            element={
              <>
                <Contact />
                <Faq />
              </>
            }
          />
          <Route path="/faq" element={<Navigate to={{ pathname: '/contact', hash: '#faq' }} replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <WhatsAppFab />
      <div ref={curtain} className="curtain" aria-hidden="true">
        <Monogram className="curtain__mark" />
        <p className="curtain__label" />
      </div>
      <div className="grain" aria-hidden="true" />
    </>
  )
}
