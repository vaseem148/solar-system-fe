import { CALC } from '../config.js'

export function subsidyFor(kw) {
  const { perKwFirstTwo, perKwThird, cap } = CALC.subsidy
  const amount = perKwFirstTwo * Math.min(kw, 2) + perKwThird * Math.max(0, Math.min(kw, 3) - 2)
  return Math.min(cap, Math.round(amount))
}

const roundTo = (n, step) => Math.round(n / step) * step

/**
 * Rough rooftop-solar estimate from an electricity bill.
 * @param {{ bill: number, months?: 1 | 2, type?: 'home' | 'business' }} input
 */
export function estimate({ bill, months = 1, type = 'home' }) {
  const plan = CALC[type]
  const monthlyBill = bill / months
  const units = monthlyBill / plan.tariff
  const monthlyPerKw = CALC.unitsPerKwDay * 30

  const panels = Math.max(plan.minPanels, Math.ceil(((units / monthlyPerKw) * 1000) / CALC.panelWatt))
  const kw = (panels * CALC.panelWatt) / 1000

  const cost = roundTo(kw * plan.costPerKw(kw), 500)
  const subsidy = plan.subsidy ? subsidyFor(kw) : 0
  const net = Math.max(0, cost - subsidy)

  const generated = kw * monthlyPerKw
  const monthlySaving = Math.min(Math.min(generated, units) * plan.tariff, monthlyBill * CALC.billCoverage)
  const annualSaving = monthlySaving * 12

  // 25-year cumulative savings, with tariff rises and panel ageing
  const series = [0]
  let total = 0
  let payback = null
  for (let year = 1; year <= 25; year++) {
    const saving = annualSaving * (1 + CALC.tariffEscalation) ** (year - 1) * (1 - CALC.degradation) ** (year - 1)
    if (payback === null && total + saving >= net) payback = year - 1 + (net - total) / saving
    total += saving
    series.push(total)
  }

  const lifetimeUnits = kw * CALC.unitsPerKwDay * 365 * 25
  const co2Tonnes = (lifetimeUnits * CALC.co2PerUnit) / 1000
  const trees = Math.round((kw * CALC.unitsPerKwDay * 365 * CALC.co2PerUnit) / CALC.treeCo2PerYear)

  return {
    units,
    panels,
    kw,
    area: Math.round(kw * CALC.sqftPerKw),
    cost,
    subsidy,
    net,
    monthlySaving,
    payback: payback ?? 25,
    total,
    profit: total - net,
    series,
    co2Tonnes,
    trees,
  }
}
