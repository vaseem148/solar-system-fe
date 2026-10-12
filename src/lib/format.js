const IN = 'en-IN'

/** ₹1,80,000 — Indian digit grouping. */
export const inr = (n) => '₹' + Math.round(n).toLocaleString(IN)

/** ₹14.6 lakh / ₹1.25 Cr for large amounts. */
export function inrWords(n) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(n >= 1e8 ? 0 : 2)} Cr`
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(n >= 1e6 ? 1 : 2)} lakh`
  return inr(n)
}

export const num = (n, digits = 0) =>
  Number(n).toLocaleString(IN, { minimumFractionDigits: digits, maximumFractionDigits: digits })

/** 3.3 → "3.3", 5 → "5" */
export const trim = (n, digits = 1) => String(+Number(n).toFixed(digits))

/** ₹9.5 — keeps up to one decimal for small rupee amounts like tariffs. */
export const rupees = (n) => '₹' + Number(n).toLocaleString(IN, { maximumFractionDigits: 1 })
