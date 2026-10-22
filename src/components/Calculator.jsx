import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '../lib/gsap'
import { CALC } from '../config'
import { estimate } from '../lib/solar'
import { inr, inrWords, trim, num, rupees } from '../lib/format'
import { prefillContact } from '../lib/prefill'
import { goTo } from '../lib/navigate'
import Label from './ui/Label'
import Button from './ui/Button'
import Odometer from './ui/Odometer'
import { Check } from './ui/Icons'
import './Calculator.css'

const STEPS = 1000
const INCLUDED = [
  'Free site survey & shadow analysis',
  'Subsidy & net-meter paperwork',
  'Installation, earthing & lightning arrester',
  'App monitoring + first-year service',
]
const nice = (v) => {
  const step = v < 2000 ? 50 : v < 20000 ? 100 : v < 100000 ? 500 : 1000
  return Math.round(v / step) * step
}
// Logarithmic slider: fine control for small bills, still reaches big ones
const toBill = (pos, min, max) => nice(min * Math.pow(max / min, pos / STEPS))
const toPos = (bill, min, max) =>
  Math.round(gsap.utils.clamp(0, 1, Math.log(bill / min) / Math.log(max / min)) * STEPS)

// Chart geometry
const CW = 640
const CH = 250
const PAD = { l: 6, r: 6, t: 26, b: 30 }
const YEARS = 25
const xAt = (year) => PAD.l + (year / YEARS) * (CW - PAD.l - PAD.r)

// Mini roof: up to 40 panels drawn top-down
const ROOF = { cols: 8, rows: 5, w: 26, h: 40, gap: 5, pad: 18 }
const ROOF_W = ROOF.pad * 2 + ROOF.cols * ROOF.w + (ROOF.cols - 1) * ROOF.gap
const ROOF_H = ROOF.pad * 2 + ROOF.rows * ROOF.h + (ROOF.rows - 1) * ROOF.gap
const SLOTS = Array.from({ length: ROOF.cols * ROOF.rows }, (_, i) => ({
  x: ROOF.pad + (i % ROOF.cols) * (ROOF.w + ROOF.gap),
  y: ROOF.pad + Math.floor(i / ROOF.cols) * (ROOF.h + ROOF.gap),
}))
const PANEL_ON = 'rgba(255, 90, 31, 0.86)'
const PANEL_OFF = 'rgba(255, 90, 31, 0)'

/** Segmented control whose thumb slides with a little squash-and-stretch. */
function Seg({ label, options, active, onChange, small }) {
  const root = useRef(null)
  const first = useRef(true)

  useLayoutEffect(() => {
    const thumb = root.current.querySelector('.seg__thumb')
    if (first.current || prefersReducedMotion()) {
      gsap.set(thumb, { xPercent: active * 100 })
      first.current = false
      return
    }
    gsap
      .timeline()
      .to(thumb, { xPercent: active * 100, duration: 0.6, ease: 'expo.out' }, 0)
      .to(thumb, { scaleX: 1.22, scaleY: 0.86, duration: 0.16, ease: 'power2.out', transformOrigin: active ? '0% 50%' : '100% 50%' }, 0)
      .to(thumb, { scaleX: 1, scaleY: 1, duration: 0.5, ease: 'elastic.out(1, 0.55)' }, 0.16)
  }, [active])

  return (
    <div ref={root} className={`seg ${small ? 'seg--sm' : ''}`} role="group" aria-label={label}>
      <span className="seg__thumb" aria-hidden="true" />
      {options.map((o, i) => (
        <button key={o} type="button" aria-pressed={active === i} onClick={() => onChange(i)}>
          {o}
        </button>
      ))}
    </div>
  )
}

export default function Calculator() {
  const [type, setType] = useState('home')
  const [months, setMonths] = useState(1)
  const [pos, setPos] = useState(() => toPos(CALC.home.start, CALC.home.min, CALC.home.max))
  const [dragging, setDragging] = useState(false)

  const plan = CALC[type]
  const min = plan.min * months
  const max = plan.max * months
  const bill = toBill(pos, min, max)
  const result = useMemo(() => estimate({ bill, months, type }), [bill, months, type])

  const root = useRef(null)
  const out = useRef({})
  const chart = useRef({})
  const shown = useRef(null)
  const shownPanels = useRef(null)
  const chartReady = useRef(false)

  const setType_ = (next) => {
    if (next === type) return
    setType(next)
    setPos(toPos(CALC[next].start * months, CALC[next].min * months, CALC[next].max * months))
  }

  const setMonths_ = (next) => {
    if (next === months) return
    const nextBill = (bill / months) * next
    setMonths(next)
    setPos(toPos(nextBill, plan.min * next, plan.max * next))
  }

  // Tween every number (and the chart) from what's on screen to the new estimate
  useEffect(() => {
    const target = {
      panels: result.panels,
      area: result.area,
      cost: result.cost,
      subsidy: result.subsidy,
      net: result.net,
      monthly: result.monthlySaving,
      payback: result.payback,
      co2: result.co2Tonnes,
      total: result.total,
      series: result.series,
    }

    const render = (v) => {
      const o = out.current
      o.panels.textContent = Math.round(v.panels)
      o.area.textContent = num(v.area)
      o.cost.textContent = inr(v.cost)
      o.subsidy.textContent = v.subsidy > 1 ? `− ${inr(v.subsidy)}` : '—'
      o.net.textContent = inr(v.net)
      o.monthly.textContent = inr(v.monthly)
      o.payback.textContent = `${v.payback.toFixed(1)} yrs`
      o.co2.textContent = `${num(v.co2)} t`
      o.total.textContent = inrWords(v.total)

      // Chart
      const c = chart.current
      const top = Math.max(v.series[YEARS], v.net) * 1.1 || 1
      const yAt = (val) => CH - PAD.b - (val / top) * (CH - PAD.t - PAD.b)
      const pts = v.series.map((val, i) => `${xAt(i).toFixed(1)},${yAt(val).toFixed(1)}`)
      c.line.setAttribute('d', `M${pts.join('L')}`)
      c.area.setAttribute('d', `M${xAt(0)},${yAt(0)}L${pts.join('L')}L${xAt(YEARS)},${yAt(0)}Z`)
      const ny = yAt(v.net).toFixed(1)
      c.net.setAttribute('y1', ny)
      c.net.setAttribute('y2', ny)
      c.netLabel.setAttribute('y', (Number(ny) - 8).toFixed(1))
      const px = xAt(Math.min(v.payback, YEARS))
      c.mark.setAttribute('transform', `translate(${px.toFixed(1)} ${ny})`)
      c.markLabel.textContent = `Paid off · year ${v.payback.toFixed(1)}`
      c.markLabel.setAttribute('text-anchor', px > CW * 0.7 ? 'end' : 'start')
      c.markLabel.setAttribute('x', px > CW * 0.7 ? -12 : 12)
    }

    if (!shown.current) {
      shown.current = { ...target, series: [...target.series] }
      render(shown.current)
      return
    }

    const from = { ...shown.current, series: [...shown.current.series] }
    const p = { t: 0 }
    const tween = gsap.to(p, {
      t: 1,
      duration: 0.9,
      ease: 'power3.out',
      onUpdate: () => {
        const v = {}
        for (const k of Object.keys(target)) {
          v[k] =
            k === 'series'
              ? target.series.map((s, i) => from.series[i] + (s - from.series[i]) * p.t)
              : from[k] + (target[k] - from[k]) * p.t
        }
        shown.current = v
        render(v)
      },
    })
    gsap.fromTo(out.current.total, { scale: 1.06 }, { scale: 1, duration: 0.7, ease: 'expo.out', transformOrigin: '100% 100%' })
    return () => tween.kill()
  }, [result])

  // Mini roof: panels pop on as the system grows, and switch off as it shrinks
  useLayoutEffect(() => {
    const rects = gsap.utils.toArray('.roofviz__pn', root.current)
    const n = Math.min(result.panels, SLOTS.length)
    const prev = shownPanels.current
    shownPanels.current = n
    if (prev === null || prefersReducedMotion()) {
      rects.forEach((r, i) => gsap.set(r, { fill: i < n ? PANEL_ON : PANEL_OFF, scale: 1 }))
      return
    }
    if (n > prev) {
      gsap.fromTo(
        rects.slice(prev, n),
        { scale: 0.4, fill: '#fff4d6', transformOrigin: '50% 50%' },
        { scale: 1, fill: PANEL_ON, duration: 0.55, stagger: 0.012, ease: 'back.out(2.2)', overwrite: true },
      )
    } else if (n < prev) {
      gsap.to(rects.slice(n, prev).reverse(), { fill: PANEL_OFF, scale: 1, duration: 0.35, stagger: 0.01, ease: 'power2.out', overwrite: true })
    }
  }, [result.panels])

  // Chart: draws itself on first view; a small sun then rides the curve while it's on screen
  useGSAP(
    () => {
      const c = chart.current
      const dot = c.dot
      const reduce = prefersReducedMotion()
      gsap.set(dot, { autoAlpha: 0 })
      if (reduce) {
        chartReady.current = true
        return
      }

      gsap.set(c.area, { opacity: 0, scaleY: 0, transformOrigin: '50% 100%' })
      const len = () => c.line.getTotalLength()
      ScrollTrigger.create({
        trigger: c.svg,
        start: 'top 82%',
        once: true,
        onEnter: () => {
          const L = len()
          gsap
            .timeline({ onComplete: () => (chartReady.current = true) })
            .fromTo(c.line, { strokeDasharray: L, strokeDashoffset: L }, { strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut' })
            .to(c.area, { opacity: 1, scaleY: 1, duration: 1.2, ease: 'expo.out' }, 0.35)
            .from(c.svg.querySelectorAll('.calc__tick'), { opacity: 0, duration: 0.6, stagger: 0.06 }, 0.1)
            .from(c.mark, { opacity: 0, duration: 0.5 }, 1.1)
            .set(c.line, { clearProps: 'strokeDasharray,strokeDashoffset' })
            .to(dot, { autoAlpha: 1, duration: 0.4 })
        },
      })

      const ride = (time) => {
        if (!chartReady.current) return
        const t = (time % 3.6) / 3.6
        const pt = c.line.getPointAtLength(t * len())
        dot.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`)
      }
      ScrollTrigger.create({
        trigger: c.svg,
        start: 'top bottom',
        end: 'bottom top',
        onToggle: (self) => (self.isActive ? gsap.ticker.add(ride) : gsap.ticker.remove(ride)),
      })
      return () => gsap.ticker.remove(ride)
    },
    { scope: root },
  )

  const getQuote = () => {
    prefillContact({ bill: Math.round(bill / months), property: type === 'home' ? 'Home' : 'Business' })
    goTo('/contact')
  }

  const ref = (key) => (el) => {
    out.current[key] = el
  }
  const cref = (key) => (el) => {
    chart.current[key] = el
  }
  const extra = Math.max(0, result.panels - SLOTS.length)

  return (
    <section ref={root} id="calculator" className="calc section" data-tone="dark">
      <div className="container">
        <header className="calc__head">
          <Label index="01">Free estimate</Label>
          <h2 className="title" data-reveal="lines">
            What’s your roof
            <br /> really <em>worth?</em>
          </h2>
          <p className="lede" data-reveal="up">
            Slide to your electricity bill. We’ll do the maths — subsidy, payback and 25 years of savings included.
          </p>
        </header>

        <div className="calc__grid">
          {/* Inputs */}
          <div className="calc__inputs" data-reveal="up">
            <Seg
              label="Property type"
              options={['Home', 'Business']}
              active={type === 'home' ? 0 : 1}
              onChange={(i) => setType_(i === 0 ? 'home' : 'business')}
            />

            <div className="calc__bill">
              <label htmlFor="bill" className="mono">
                Your {months === 2 ? 'bi-monthly' : 'monthly'} EB bill
              </label>
              <output htmlFor="bill" className="calc__bill-value">
                <span>₹</span>
                {bill.toLocaleString('en-IN')}
              </output>
              <div className={`calc__slider ${dragging ? 'is-dragging' : ''}`} style={{ '--p': pos / STEPS }}>
                <span className="calc__bubble mono" aria-hidden="true">
                  {inr(bill)}
                </span>
                <input
                  id="bill"
                  type="range"
                  min="0"
                  max={STEPS}
                  value={pos}
                  onChange={(e) => setPos(Number(e.target.value))}
                  onPointerDown={() => setDragging(true)}
                  onPointerUp={() => setDragging(false)}
                  onPointerCancel={() => setDragging(false)}
                  onBlur={() => setDragging(false)}
                  aria-valuetext={`₹${bill.toLocaleString('en-IN')}`}
                  style={{ '--p': pos / STEPS }}
                  data-cursor="Drag"
                />
              </div>
              <div className="calc__range mono">
                <span>{inr(min)}</span>
                <span>{inr(max)}</span>
              </div>
            </div>

            <div className="calc__months">
              <span className="mono">Billing cycle</span>
              <Seg
                small
                label="Billing cycle"
                options={['Monthly', 'Every 2 months']}
                active={months - 1}
                onChange={(i) => setMonths_(i + 1)}
              />
            </div>

            <ul className="calc__included">
              <li className="mono">Included in every quote</li>
              {INCLUDED.map((item) => (
                <li key={item}>
                  <Check /> {item}
                </li>
              ))}
            </ul>

            <p className="calc__units mono">
              ≈ {num(result.units)} units / month · {rupees(plan.tariff)}/unit avg.
            </p>
          </div>

          {/* Results */}
          <div className="calc__result" data-reveal="up">
            <div className="calc__hero">
              <div className="calc__hero-main">
                <p className="mono">Recommended system</p>
                <p className="calc__kw">
                  <Odometer value={trim(result.kw, 1)} duration={0.9} />
                  <small>kW</small>
                </p>
                <p className="calc__sub mono">
                  <span ref={ref('panels')}>0</span> panels × {CALC.panelWatt} W · ~<span ref={ref('area')}>0</span> sq
                  ft of shadow-free roof
                </p>
              </div>

              <figure className="roofviz" aria-hidden="true">
                <svg viewBox={`0 0 ${ROOF_W} ${ROOF_H + 26}`}>
                  <defs>
                    <pattern id="roofviz-grid" width="12" height="12" patternUnits="userSpaceOnUse">
                      <path d="M12 0H0V12" fill="none" stroke="rgb(242 237 228 / 0.06)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect className="roofviz__wall" x="0.5" y="0.5" width={ROOF_W - 1} height={ROOF_H - 1} rx="3" />
                  <rect x="7" y="7" width={ROOF_W - 14} height={ROOF_H - 14} fill="url(#roofviz-grid)" className="roofviz__inner" />
                  {SLOTS.map((s, i) => (
                    <rect key={i} className="roofviz__pn" x={s.x} y={s.y} width={ROOF.w} height={ROOF.h} rx="1.5" />
                  ))}
                  <text className="roofviz__label" x="0" y={ROOF_H + 20}>
                    ROOF · TOP VIEW
                  </text>
                  {extra > 0 && (
                    <text className="roofviz__more" x={ROOF_W} y={ROOF_H + 20} textAnchor="end">
                      +{extra} more
                    </text>
                  )}
                </svg>
              </figure>
            </div>

            <dl className="calc__stats">
              <div>
                <dt>System cost</dt>
                <dd ref={ref('cost')}>—</dd>
              </div>
              <div>
                <dt>{type === 'home' ? 'Govt. subsidy' : 'Subsidy (homes only)'}</dt>
                <dd ref={ref('subsidy')} className="accent">
                  —
                </dd>
              </div>
              <div>
                <dt>You pay</dt>
                <dd ref={ref('net')}>—</dd>
              </div>
              <div>
                <dt>Monthly saving</dt>
                <dd ref={ref('monthly')}>—</dd>
              </div>
              <div>
                <dt>Pays for itself in</dt>
                <dd ref={ref('payback')}>—</dd>
              </div>
              <div>
                <dt>CO₂ avoided · 25 yrs</dt>
                <dd ref={ref('co2')}>—</dd>
              </div>
            </dl>

            <figure className="calc__chart">
              <svg ref={cref('svg')} viewBox={`0 0 ${CW} ${CH}`} role="img" aria-label="Cumulative savings over 25 years versus what you pay">
                <defs>
                  <linearGradient id="calc-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ff7a2e" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#ff5a1f" stopOpacity="0" />
                  </linearGradient>
                  <radialGradient id="calc-dot">
                    <stop offset="0" stopColor="#ffd27a" stopOpacity="0.9" />
                    <stop offset="1" stopColor="#ff5a1f" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {[0, 5, 10, 15, 20, 25].map((y) => (
                  <g key={y} className="calc__tick">
                    <line x1={xAt(y)} x2={xAt(y)} y1={PAD.t - 10} y2={CH - PAD.b} />
                    <text x={xAt(y)} y={CH - 8} textAnchor={y === 0 ? 'start' : y === 25 ? 'end' : 'middle'}>
                      {y === 0 ? 'Today' : `Yr ${y}`}
                    </text>
                  </g>
                ))}
                <path ref={cref('area')} className="calc__area" fill="url(#calc-area)" />
                <path ref={cref('line')} className="calc__line" />
                <line ref={cref('net')} className="calc__net" x1={PAD.l} x2={CW - PAD.r} />
                <text ref={cref('netLabel')} className="calc__net-label" x={CW - PAD.r} textAnchor="end">
                  What you pay
                </text>
                <g ref={cref('mark')} className="calc__mark">
                  <circle r="9" className="calc__mark-pulse" />
                  <circle r="9" className="calc__mark-halo" />
                  <circle r="4.5" />
                  <text ref={cref('markLabel')} y="-14" x="12" />
                </g>
                <g ref={cref('dot')} className="calc__dot">
                  <circle r="14" fill="url(#calc-dot)" />
                  <circle r="4" className="calc__dot-core" />
                </g>
              </svg>
              <figcaption className="calc__total">
                <span className="mono">Saved over 25 years</span>
                <strong ref={ref('total')}>—</strong>
              </figcaption>
            </figure>

            <Button onClick={getQuote} block>
              Get my exact quote
            </Button>
          </div>
        </div>

        <p className="calc__note mono">
          Estimates only. Assumes ~{CALC.unitsPerKwDay} units per kW per day, {rupees(CALC.home.tariff)}/unit for homes
          and {rupees(CALC.business.tariff)}/unit for businesses, {CALC.tariffEscalation * 100}% yearly tariff rise and
          current PM Surya Ghar subsidy rules. Your free site survey gives the exact numbers.
        </p>
      </div>
    </section>
  )
}
