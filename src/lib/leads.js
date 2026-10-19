import { BRAND, CONTACT, LEADS_API_URL, LOCATION } from '../config.js'

export const whatsappLink = (text) =>
  `https://wa.me/${CONTACT.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`

/** Indian mobile: 10 digits starting 6–9, optional +91 / 0 prefix. */
export function normalisePhone(raw) {
  const digits = String(raw).replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, '')
  return /^[6-9]\d{9}$/.test(digits) ? digits : null
}

export function validateLead(data) {
  const errors = {}
  if (!data.name || data.name.trim().length < 2) errors.name = 'Please add your name'
  if (!normalisePhone(data.phone)) errors.phone = 'Enter a 10-digit mobile number'
  if (!data.area || data.area.trim().length < 2) errors.area = 'Which area or city?'
  return errors
}

export function leadMessage(data) {
  return [
    `Hi ${BRAND.legalName}! I'd like a free solar site visit.`,
    '',
    `Name: ${data.name.trim()}`,
    `Mobile: ${normalisePhone(data.phone)}`,
    `Area: ${data.area.trim()}`,
    `Property: ${data.property}`,
    data.bill ? `Monthly EB bill: ₹${Number(data.bill).toLocaleString('en-IN')}` : null,
    data.message?.trim() ? `Note: ${data.message.trim()}` : null,
  ]
    .filter((line) => line !== null)
    .join('\n')
}

/**
 * Opens WhatsApp with the enquiry (synchronously, so pop-up blockers allow it)
 * and, if a backend URL is configured, also records the lead there.
 */
export function submitLead(data) {
  window.open(whatsappLink(leadMessage(data)), '_blank', 'noopener')

  if (LEADS_API_URL) {
    fetch(`${LEADS_API_URL}/api/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, phone: normalisePhone(data.phone), source: 'website' }),
    }).catch(() => {
      /* WhatsApp already has the enquiry — nothing is lost */
    })
  }
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const dayHour = new Intl.DateTimeFormat('en-GB', {
  timeZone: LOCATION.timeZone,
  weekday: 'short',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
})

export function isOpenNow(now = new Date()) {
  const parts = dayHour.formatToParts(now)
  const part = (type) => parts.find((p) => p.type === type)?.value
  const day = DAYS.indexOf(part('weekday'))
  const hour = Number(part('hour')) + Number(part('minute')) / 60
  const { days, open, close } = CONTACT.hours
  return days.includes(day) && hour >= open && hour < close
}
