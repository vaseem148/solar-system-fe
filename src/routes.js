// The site's pages, in nav order (following the client's old site). `label` is the nav text,
// `title` the browser tab title; `nav: false` keeps a page out of the link list (it has its own button).
export const PAGES = [
  {
    path: '/',
    label: 'Home',
    title: 'Suryan Energy Systems — Solar Power Plants, Water Heaters & Street Lights in Chennai',
  },
  { path: '/about', label: 'About', title: 'About us — Suryan Energy Systems, Chennai since 2010' },
  { path: '/products', label: 'Products', title: 'Solar power plants, street lights, water heaters & inverters — Suryan Energy Systems' },
  { path: '/services', label: 'Services', title: 'Solar installation & maintenance — Suryan Energy Systems' },
  { path: '/how-it-works', label: 'How it works', title: 'How rooftop solar works — Suryan Energy Systems' },
  { path: '/blog', label: 'Blog', title: 'Blog — Suryan Energy Systems' },
  { path: '/faq', label: 'FAQ', title: 'Solar questions, answered — Suryan Energy Systems' },
  { path: '/contact', label: 'Contact', title: 'Contact us — Suryan Energy Systems' },
  { path: '/estimate', label: 'Free estimate', title: 'Get a free solar estimate — Suryan Energy Systems', nav: false },
]

/** The page a path belongs to (/blog/some-post → Blog); unknown paths fall back to Home. */
export const pageFor = (pathname) =>
  PAGES.find((p) => p.path === pathname) ??
  PAGES.find((p) => p.path !== '/' && pathname.startsWith(`${p.path}/`)) ??
  PAGES[0]
