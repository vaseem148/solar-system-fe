// Solar position maths (after the well-known SunCalc approach).
// Accurate to about a minute for sunrise / sunset, which is all a
// live "where is the sun right now" readout needs.

const RAD = Math.PI / 180
const DAY_MS = 86400000
const J1970 = 2440587.5
const J2000 = 2451545
const J0 = 0.0009
const OBLIQUITY = 23.4397 * RAD

const toDays = (ms) => ms / DAY_MS + J1970 - J2000
const fromJulian = (j) => new Date((j - J1970) * DAY_MS)

const meanAnomaly = (d) => RAD * (357.5291 + 0.98560028 * d)

function eclipticLongitude(M) {
  const C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M))
  return M + C + RAD * 102.9372 + Math.PI
}

const declination = (L) => Math.asin(Math.sin(OBLIQUITY) * Math.sin(L))
const rightAscension = (L) => Math.atan2(Math.sin(L) * Math.cos(OBLIQUITY), Math.cos(L))

/** Altitude & azimuth (degrees) of the sun at `date` for a lat/lon. */
export function sunPosition(date, lat, lon) {
  const d = toDays(date.getTime())
  const L = eclipticLongitude(meanAnomaly(d))
  const dec = declination(L)
  const H = RAD * (280.16 + 360.9856235 * d) + RAD * lon - rightAscension(L)
  const phi = RAD * lat
  const altitude = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H))
  const azimuth = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi))
  return { altitude: altitude / RAD, azimuth: (azimuth / RAD + 180) % 360 }
}

/**
 * Sunrise, solar noon and sunset for the *local calendar day* of `date`
 * in a timezone given as a fixed UTC offset in minutes (IST = 330).
 */
export function sunTimes(date, lat, lon, tzOffsetMin = 330) {
  const local = new Date(date.getTime() + tzOffsetMin * 60000)
  const localNoon = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), 12) - tzOffsetMin * 60000

  const lw = -RAD * lon
  const phi = RAD * lat
  const d = toDays(localNoon)
  const n = Math.round(d - J0 - lw / (2 * Math.PI))
  const ds = J0 + lw / (2 * Math.PI) + n
  const M = meanAnomaly(ds)
  const L = eclipticLongitude(M)
  const dec = declination(L)
  const transit = (a) => J2000 + a + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L)

  const jNoon = transit(ds)
  const h0 = -0.833 * RAD
  const cosW = (Math.sin(h0) - Math.sin(phi) * Math.sin(dec)) / (Math.cos(phi) * Math.cos(dec))
  const w = Math.acos(Math.min(1, Math.max(-1, cosW)))
  const jSet = transit(J0 + (w + lw) / (2 * Math.PI) + n)
  const jRise = jNoon - (jSet - jNoon)

  return { sunrise: fromJulian(jRise), noon: fromJulian(jNoon), sunset: fromJulian(jSet) }
}

/** "3h 41m" style duration. */
export function formatSpan(ms) {
  const mins = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}
