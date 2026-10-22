// Lets any component change page through App's transition (the curtain) without prop-drilling.
// Links don't need this — App intercepts clicks on same-site <a href> — only code-driven navigation does.
let handler = null

export const setNavigator = (fn) => {
  handler = fn
}

export const goTo = (to) => (handler ? handler(to) : window.location.assign(to))
