// ─────────────────────────────────────────────────────────────
//  Everything business-specific lives in this file.
//  Change the values below and the whole site follows:
//  brand name, phone, WhatsApp, location and calculator maths.
// ─────────────────────────────────────────────────────────────

export const BRAND = {
  name: 'Suryan',
  legalName: 'Suryan Energy Systems',
  tagline: 'Use solar energy, save green earth.',
  since: 2010,
  proprietor: 'Mr. V. Gopi',
}

const PHONES = ['+91 99405 68700', '+91 98840 50218']
const ADDRESS = '11, Elango Street, J.B. Nagar, Thirumullaivoyal, Chennai 600 062'

export const CONTACT = {
  phones: PHONES.map((display) => ({ display, href: `tel:${display.replace(/\s/g, '')}` })),
  phoneDisplay: PHONES[0],
  phoneHref: `tel:${PHONES[0].replace(/\s/g, '')}`,
  // Country code + number, digits only (used for wa.me links). Confirm this number is on WhatsApp.
  whatsapp: '919940568700',
  email: 'sales@suryanenergy.in',
  emails: ['sales@suryanenergy.in', 'suryanenergy@yahoo.com'],
  address: ADDRESS,
  landmark: 'Murugappa Polytechnic',
  mapHref: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`Suryan Energy Systems, ${ADDRESS}`)}`,
  region: 'Chennai & across Tamil Nadu',
  payments: 'Cash · Cheque',
  // Opening hours in IST: days are 0 = Sunday … 6 = Saturday; open/close in hours (8.5 = 8:30)
  hours: { label: 'Mon – Sat · 8:30 am – 7:30 pm', days: [1, 2, 3, 4, 5, 6], open: 8.5, close: 19.5 },
}

// Registrations shown in the About section and the footer
export const CREDENTIALS = {
  msme: 'TN02A035099',
  gst: '33ATVPG6807H1ZF',
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
  label: 'Chennai',
  lat: 13.1307,
  lon: 80.1312,
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
