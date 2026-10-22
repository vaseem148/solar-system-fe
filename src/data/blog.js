// Articles from the client's old site (suryanenergy.in/blogs), published in 2021.
import solarFarm from '../assets/blog/solar-farm.webp'
import rooftop from '../assets/blog/rooftop.webp'
import glassFacade from '../assets/blog/glass-facade.webp'

export const POSTS = [
  {
    slug: 'future-of-solar-energy-in-india',
    title: 'Future of solar energy in India',
    date: 'Jul 24, 2021',
    tag: 'News',
    img: solarFarm,
    excerpt:
      "Solar power in India is a fast-developing industry. The country's installed solar capacity was 40.09 GW as of 31 March 2021.",
    body: [
      { p: "Solar power in India is a fast-developing industry as part of the country's renewable energy. India's installed solar capacity was 40.09 GW as of 31 March 2021." },
      { p: 'The Indian government had an initial target of 20 GW capacity for 2022, which was achieved four years ahead of schedule. In 2015 the target was raised to 100 GW of solar capacity (including 40 GW from rooftop solar) by 2022, targeting an investment of US$100 billion. India has established nearly 42 solar parks to make land available to the promoters of solar plants. The Ministry of New and Renewable Energy stated that a further 36.03 GW of solar projects were under various stages of implementation and 23.87 GW were in the tendering process.' },
      { quote: 'Every home in India should be turned into solar homes.', by: 'A. P. J. Abdul Kalam' },
      { p: 'The Solar Energy Corporation of India (SECI) is planning a 2,000 MWh standalone energy storage system, to be executed by the private sector. The projects will be set up on a build-own-operate (BOO) basis with a 25-year agreement.' },
      { h: 'Why rooftop solar matters', img: rooftop },
      { p: 'Solar power is something every household should consider. It captures energy from the sun and puts it to many uses — it can light, heat and cool homes for less than the electricity board charges. Solar panels soak up the sun’s rays to create renewable energy for homes and businesses, and even on a cloudy day, enough light comes through the clouds for the panels to keep working.' },
      { p: 'Rooftop solar accounted for 2.1 GW, of which 70% was industrial or commercial. Alongside its large grid-connected programme, India is developing off-grid solar for local energy needs: by the end of 2015 just under one million solar lanterns had been sold, reducing the need for kerosene. That year, 118,700 solar home-lighting systems and 46,655 solar street lights were installed under a national programme, and just over 1.4 million solar cookers were distributed.' },
    ],
  },
  {
    slug: 'top-new-technologies-in-solar-power',
    title: 'Top new technologies in solar power',
    date: 'Aug 2, 2021',
    tag: 'News',
    img: glassFacade,
    excerpt:
      'In the last forty years the use of solar energy around the world has grown dramatically. Here are four technologies changing what solar can be.',
    body: [
      { p: 'In the last forty years there has been a dynamic increase in the use of solar energy around the world. In 2020 alone, an additional 10.6 GW of solar power was harnessed, bringing the total to 64.2 GW.' },
      { h: '1 · Floating solar farms' },
      { p: 'Silicon panels are becoming cheaper and more efficient day by day. According to experts, photovoltaic panels placed on reservoirs and other water bodies offer even greater efficiency, along with a host of other benefits.' },
      { h: '2 · Building-integrated photovoltaics (BIPV)' },
      { p: 'Building-integrated photovoltaics blend into a building’s architecture as roofs, canopies, curtain walls, facades and skylights. Made from transparent photovoltaic cells, PV glass is toughened and lets daylight into a building while producing energy unseen. Unlike traditional panels, BIPV can be aesthetically appealing rather than a compromise to the design — and because the modules replace conventional building materials, part of their cost is offset by the materials and labour they save. That makes BIPV one of the fastest-growing segments of the photovoltaic industry.' },
      { h: '3 · Photovoltaic noise barriers (PVNB)' },
      { p: 'There are roughly 3,000 miles of noise barriers lining American highways, diverting sound away from neighbourhoods and limiting the spread of fumes. They also offer useful space for solar energy production — by one estimate, around 400 GW of power every year.' },
      { h: '4 · Solar skins' },
      { p: 'Solar skin is a flexible, transparent material that is very thin yet very efficient at producing an electrical current in sunlight. Think of it as a thick piece of cling film that could be applied to almost any surface — the outside of homes, cars, utility poles, almost anything.' },
    ],
  },
]

export const postFor = (slug) => POSTS.find((p) => p.slug === slug)
