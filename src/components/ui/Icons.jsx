// Small hand-drawn icon set. All icons use currentColor.

const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
}

export const ArrowUpRight = (p) => (
  <svg viewBox="0 0 16 16" {...base} strokeWidth={1.8} {...p}>
    <path d="M4 12 12 4M5.5 4H12v6.5" />
  </svg>
)

export const ArrowDown = (p) => (
  <svg viewBox="0 0 16 16" {...base} strokeWidth={1.6} {...p}>
    <path d="M8 2.5v11M3.5 9 8 13.5 12.5 9" />
  </svg>
)

export const Plus = (p) => (
  <svg viewBox="0 0 16 16" {...base} strokeWidth={1.6} {...p}>
    <path d="M8 2v12M2 8h12" />
  </svg>
)

export const Check = (p) => (
  <svg viewBox="0 0 16 16" {...base} strokeWidth={2} {...p}>
    <path d="m3 8.5 3.2 3L13 4.5" />
  </svg>
)

/** Brand mark: a sun rising over a solar panel. */
export const SunMark = ({ title, ...p }) => (
  <svg viewBox="0 0 32 32" aria-hidden={title ? undefined : true} role={title ? 'img' : undefined} {...p}>
    {title && <title>{title}</title>}
    <path d="M7 16.5a9 9 0 0 1 18 0z" fill="var(--sun)" />
    <path d="M5.5 19.5h21l-2.6 6.5H2.9z" fill="currentColor" />
    <path d="M12.5 19.5 9.9 26M19.5 19.5 16.9 26" stroke="var(--bg)" strokeWidth="1.3" />
  </svg>
)

/** Small star-burst used as a separator in the marquee. */
export const Burst = (p) => (
  <svg viewBox="0 0 40 40" aria-hidden="true" {...p}>
    <circle cx="20" cy="20" r="7" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <path d="M20 2v7M20 31v7M2 20h7M31 20h7M7.3 7.3l5 5M27.7 27.7l5 5M7.3 32.7l5-5M27.7 12.3l5-5" />
    </g>
  </svg>
)

export const WhatsApp = (p) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...p}>
    <path
      fill="currentColor"
      d="M12 2.2A9.8 9.8 0 0 0 3.6 17l-1.4 4.8 4.9-1.3A9.8 9.8 0 1 0 12 2.2Zm0 17.9a8.1 8.1 0 0 1-4.2-1.1l-.3-.2-2.9.8.8-2.8-.2-.3A8.1 8.1 0 1 1 12 20.1Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.6 6.6 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.1 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"
    />
  </svg>
)

export const Phone = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <path d="M5 3.5h3.2l1.6 4.2-2.1 1.3a11 11 0 0 0 5.3 5.3l1.3-2.1 4.2 1.6V17a2 2 0 0 1-2 2A15.5 15.5 0 0 1 3 5.5a2 2 0 0 1 2-2Z" />
  </svg>
)

export const Mail = (p) => (
  <svg viewBox="0 0 24 24" {...base} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
  </svg>
)

/* ── Service icons (48 × 48) ─────────────────────────────── */

export const IconHome = (p) => (
  <svg viewBox="0 0 48 48" {...base} strokeWidth={1.4} {...p}>
    <circle cx="36" cy="10" r="4.5" />
    <path d="M36 2.5v1.5M36 16v1.5M28.5 10H30M42 10h1.5M30.7 4.7l1 1M40.3 14.3l1 1M30.7 15.3l1-1M40.3 5.7l1-1" />
    <path d="M6 44V24L20 13l14 11v20H6Z" />
    <path d="M22 14.6 29.8 20.7 31.4 18.7 23.6 12.5Z" />
    <path d="M16 44V33h8v11" />
  </svg>
)

export const IconFactory = (p) => (
  <svg viewBox="0 0 48 48" {...base} strokeWidth={1.4} {...p}>
    <path d="M4 44V22l10 6v-6l10 6v-6l10 6V8h8v36H4Z" />
    <path d="M10 36h4M18 36h4M26 36h4M36 14h4" />
    <path d="M6 18.5 14 14l8 4.5M22 18.5 30 14" />
  </svg>
)

export const IconFarm = (p) => (
  <svg viewBox="0 0 48 48" {...base} strokeWidth={1.4} {...p}>
    <path d="M6 22h20l-4 9H2z" />
    <path d="M13 22l-2 9M19 22l-2 9M14 31v13M8 44h12" />
    <path d="M26 39h10a4 4 0 0 0 4-4v-9" />
    <path d="M40 18c-2.6 3.2-3.8 5.3-3.8 7a3.8 3.8 0 0 0 7.6 0c0-1.7-1.2-3.8-3.8-7Z" />
    <path d="M30 44c0-6 3-8 7-9" />
  </svg>
)

export const IconBattery = (p) => (
  <svg viewBox="0 0 48 48" {...base} strokeWidth={1.4} {...p}>
    <rect x="10" y="8" width="28" height="36" rx="3" />
    <path d="M19 4h10v4" />
    <path d="m26 15-6 11h8l-6 11" />
  </svg>
)

export const IconCare = (p) => (
  <svg viewBox="0 0 48 48" {...base} strokeWidth={1.4} {...p}>
    <path d="M24 4 8 10v12c0 10 7 17.5 16 22 9-4.5 16-12 16-22V10L24 4Z" />
    <path d="m17 24 5 5 9-10" />
  </svg>
)

/* ── Process icons ─────────────────────────────────────────── */

export const IconSurvey = (p) => (
  <svg viewBox="0 0 48 48" {...base} strokeWidth={1.4} {...p}>
    <path d="M4 40V22L18 11l14 11v4" />
    <circle cx="32" cy="34" r="7" />
    <path d="m37 39 6 6M4 40h18" />
  </svg>
)

export const IconDesign = (p) => (
  <svg viewBox="0 0 48 48" {...base} strokeWidth={1.4} {...p}>
    <path d="M6 42V8l34 34H6Z" />
    <path d="M13 35V25l10 10H13Z" />
    <path d="M6 16h4M6 24h4M14 42v-4M22 42v-4M30 42v-4" />
  </svg>
)

export const IconPaper = (p) => (
  <svg viewBox="0 0 48 48" {...base} strokeWidth={1.4} {...p}>
    <path d="M10 4h20l8 8v32H10z" />
    <path d="M30 4v8h8M16 18h16M16 24h16M16 30h8" />
    <circle cx="31" cy="35" r="5" />
  </svg>
)

export const IconInstall = (p) => (
  <svg viewBox="0 0 48 48" {...base} strokeWidth={1.4} {...p}>
    <path d="M8 22h30l-6 12H2z" />
    <path d="M18 22l-6 12M28 22l-6 12M5 28h30" />
    <path d="M14 34v10M30 34v10M10 44h24" />
    <path d="M36 4l6 6-8 8-3-3M31 15l-4 4" />
  </svg>
)

export const IconMeter = (p) => (
  <svg viewBox="0 0 48 48" {...base} strokeWidth={1.4} {...p}>
    <rect x="8" y="6" width="32" height="36" rx="4" />
    <path d="M14 26a10 10 0 0 1 20 0" />
    <path d="m24 26 5-6" />
    <path d="M16 34h16" />
  </svg>
)
