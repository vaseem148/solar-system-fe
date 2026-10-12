// Tiny bridge so any section (calculator, services) can pre-fill the
// contact form without prop-drilling.
const EVENT = 'solar:prefill'

export function prefillContact(detail) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail }))
}

export function onPrefill(handler) {
  const listener = (e) => handler(e.detail)
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}
