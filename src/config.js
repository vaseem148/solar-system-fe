// ─────────────────────────────────────────────────────────────
//  Everything business-specific lives in this file.
//  Change the values below and the whole site follows:
//  brand name, phone, WhatsApp, location and calculator maths.
// ─────────────────────────────────────────────────────────────

export const BRAND = {
  name: 'Solar',
  legalName: 'Solar Energy',
}

export const CONTACT = {
  phoneDisplay: '+91 98765 43210',
  phoneHref: 'tel:+919876543210',
  // Country code + number, digits only (used for wa.me links)
  whatsapp: '919876543210',
  email: 'hello@solar.in',
  region: 'Serving all of Tamil Nadu',
  // Opening hours in IST: days are 0 = Sunday … 6 = Saturday
  hours: { label: 'Mon – Sat · 9 am – 7 pm', days: [1, 2, 3, 4, 5, 6], open: 9, close: 19 },
}

// Optional: when the backend (sw_be) is ready, put its base URL here and
// enquiries are POSTed to `${LEADS_API_URL}/api/leads` before WhatsApp opens.
export const LEADS_API_URL = ''

export const SOCIAL = [
  { label: 'Instagram', href: '#' },
  { label: 'YouTube', href: '#' },
  { label: 'Facebook', href: '#' },
  { label: 'LinkedIn', href: '#' },
]

// Used for the live sun readout in the hero and footer.
export const LOCATION = {
  label: 'Tamil Nadu',
  lat: 11.1271,
  lon: 78.6569,
  timeZone: 'Asia/Kolkata',
  tzOffsetMin: 330,
}

// Savings calculator assumptions. Rough, honest averages — tune them
// to your real pricing before going live.
export const CALC = {
  unitsPerKwDay: 4, // kWh generated per kW per day in Tamil Nadu
  panelWatt: 550,
  sqftPerKw: 100, // shadow-free roof area needed per kW
  degradation: 0.005, // panel output loss per year
  tariffEscalation: 0.03, // yearly rise in electricity tariff
  co2PerUnit: 0.82, // kg CO₂ per kWh on the Indian grid
  billCoverage: 0.9, // fixed charges remain — solar removes at most 90 % of a bill
  treeCo2PerYear: 21, // kg CO₂ one tree absorbs per year
  home: {
    tariff: 7, // average ₹ per unit
    min: 500,
    max: 15000,
    start: 3500,
    minPanels: 2,
    costPerKw: (kw) => (kw <= 3 ? 62000 : kw <= 10 ? 56000 : 50000),
    subsidy: true,
  },
  business: {
    tariff: 9.5,
    min: 5000,
    max: 500000,
    start: 45000,
    minPanels: 6,
    costPerKw: (kw) => (kw <= 10 ? 52000 : kw <= 50 ? 45000 : 40000),
    subsidy: false,
  },
  // PM Surya Ghar: Muft Bijli Yojana (residential)
  subsidy: { perKwFirstTwo: 30000, perKwThird: 18000, cap: 78000 },
}
