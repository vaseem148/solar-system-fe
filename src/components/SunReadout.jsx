import { useEffect, useState } from 'react'
import { LOCATION } from '../config'
import { sunPosition, sunTimes, formatSpan } from '../lib/sun'

const timeFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: LOCATION.timeZone,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})
const hmFmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: LOCATION.timeZone,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export function useNow(interval = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), interval)
    return () => clearInterval(id)
  }, [interval])
  return now
}

/** Where the sun is over the configured location, right now. */
export function getSunStatus(now) {
  const { lat, lon, tzOffsetMin } = LOCATION
  const { altitude } = sunPosition(now, lat, lon)
  const today = sunTimes(now, lat, lon, tzOffsetMin)

  let next
  if (now < today.sunrise) next = { label: 'Sunrise', at: today.sunrise }
  else if (now < today.sunset) next = { label: 'Sunset', at: today.sunset }
  else next = { label: 'Sunrise', at: sunTimes(new Date(now.getTime() + 86400000), lat, lon, tzOffsetMin).sunrise }

  const phase = altitude > 6 ? 'day' : altitude > -0.833 ? 'golden' : 'night'
  return { altitude, today, next, phase }
}

// The live output figure is for an example system of this size
const DEMO_KW = 5

/**
 * Rough clear-sky output (kW) of a `kw` rooftop system with the sun at `altitude` degrees:
 * Meinel air-mass irradiance, +10% diffuse, 80% performance ratio. Illustrative, not a forecast.
 */
export function liveOutput(altitude, kw = DEMO_KW) {
  if (altitude <= 0) return 0
  const s = Math.sin((altitude * Math.PI) / 180)
  const dni = 1.353 * 0.7 ** ((1 / s) ** 0.678)
  return kw * 0.8 * 1.1 * dni * s
}

const STATUS = {
  day: 'Panels generating now',
  golden: 'Golden hour — low output',
  night: 'Night — grid takes over',
}

export default function SunReadout({ className = '' }) {
  const now = useNow()
  const { altitude, next, phase } = getSunStatus(now)
  const kw = liveOutput(altitude)
  const lat = `${Math.abs(LOCATION.lat).toFixed(2)}°${LOCATION.lat >= 0 ? 'N' : 'S'}`
  const lon = `${Math.abs(LOCATION.lon).toFixed(2)}°${LOCATION.lon >= 0 ? 'E' : 'W'}`

  return (
    <dl className={`readout ${className}`} aria-label={`Live sun position over ${LOCATION.label}`}>
      <div>
        <dt>Position</dt>
        <dd>
          {lat} {lon}
        </dd>
      </div>
      <div>
        <dt>IST</dt>
        <dd>{timeFmt.format(now)}</dd>
      </div>
      <div>
        <dt>Sun</dt>
        <dd>
          {altitude >= 0 ? '▲' : '▼'} {altitude.toFixed(1)}°
        </dd>
      </div>
      <div title={`Clear-sky estimate for an example ${DEMO_KW} kW system at this hour`}>
        <dt>{DEMO_KW} kW roof</dt>
        <dd>{kw >= 0.005 ? `≈ ${kw.toFixed(2)} kW` : 'Resting'}</dd>
      </div>
      <div>
        <dt>{next.label}</dt>
        <dd>
          {hmFmt.format(next.at)} · in {formatSpan(next.at - now)}
        </dd>
      </div>
      <div className={`readout__status readout__status--${phase}`}>
        <dt className="sr-only">Status</dt>
        <dd>
          <i aria-hidden="true" />
          {STATUS[phase]}
        </dd>
      </div>
    </dl>
  )
}

/** Compact live line for small screens, where the full readout is hidden. */
export function SunChip({ className = '' }) {
  const now = useNow()
  const { altitude, phase } = getSunStatus(now)
  const kw = liveOutput(altitude)

  return (
    <p className={`sunchip sunchip--${phase} ${className}`} title={`Live sun over ${LOCATION.label}; output is a clear-sky estimate`}>
      <i aria-hidden="true" />
      <span className="sunchip__text">
        {timeFmt.format(now)} IST ·{' '}
        {phase === 'day' ? `≈ ${kw.toFixed(2)} kW on a ${DEMO_KW} kW roof` : STATUS[phase]}
      </span>
    </p>
  )
}
