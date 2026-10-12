/** Section label — "(02) ─── How it works". Index and text decode in sequence (src/lib/interactions.js). */
export default function Label({ index, children, className = '' }) {
  return (
    <p className={`label ${className}`}>
      <span className="label__idx" data-scramble data-scramble-chars="0123456789">
        ({index})
      </span>
      <span className="label__line" aria-hidden="true" />
      <span data-scramble data-scramble-delay="0.22">
        {children}
      </span>
    </p>
  )
}
