// Tiny bridge so any section (calculator, services) can pre-fill the
// contact form without prop-drilling. The contact form may live on another page,
// so the latest values are also kept until it mounts and takes them.
const EVENT = 'solar:prefill'
let pending = null

export function prefillContact(detail) {
  pending = detail
  window.dispatchEvent(new CustomEvent(EVENT, { detail }))
}

/** Values sent before the contact form was on screen (cleared once taken). */
export function takePrefill() {
  const detail = pending
  pending = null
  return detail
}

export function onPrefill(handler) {
  const listener = (e) => {
    pending = null
    handler(e.detail)
  }
  window.addEventListener(EVENT, listener)
  return () => window.removeEventListener(EVENT, listener)
}
