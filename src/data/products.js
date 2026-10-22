// The client's product range, as listed on suryanenergy.in (prices and minimum orders left out —
// they were from 2021 and need confirming before they go back on the site).
import powerPlant from '../assets/products/power-plant.webp'
import rooftopSystem from '../assets/products/rooftop-system.webp'
import homeLighting from '../assets/products/home-lighting.webp'
import ledStreetLight from '../assets/products/led-street-light.webp'
import streetLight from '../assets/products/street-light.webp'
import cflStreetLight from '../assets/products/cfl-street-light.webp'
import ledHomeLighting from '../assets/products/led-home-lighting.webp'
import etcHeater100 from '../assets/products/etc-heater-100.webp'
import flatPlateHeater from '../assets/products/flat-plate-heater.webp'
import etcHeater from '../assets/products/etc-heater.webp'
import waterPump from '../assets/products/water-pump.webp'
import onGridInverter from '../assets/products/on-grid-inverter.webp'
import offGridInverter from '../assets/products/off-grid-inverter.webp'

export const PRODUCTS = [
  {
    id: 'solar-power-plant',
    name: 'Solar Power Plant',
    text: 'With a vast industrial experience, we offer superior-quality solar power plants, made from high-grade material sourced from trusted vendors in the industry.',
    items: [
      {
        name: 'Solar Power Plant',
        img: powerPlant,
        specs: [
          ['Capacity', '50 kW'],
          ['Brand', 'Waaree Solar'],
          ['Type of plant', 'Grid-tie'],
          ['Panel warranty', '2 – 5 years*'],
          ['Component warranty', '5 years*'],
          ['MNRE approved', 'Yes'],
          ['AMC', 'Yes · extended warranty provided'],
        ],
      },
      {
        name: 'Solar Rooftop System',
        img: rooftopSystem,
        specs: [
          ['Capacity', '1 kW'],
          ['Other components', 'Inverter-PCU'],
          ['Brand', 'Waaree Solar'],
          ['Type of plant', 'Grid-tie inverter'],
        ],
      },
    ],
  },
  {
    id: 'solar-street-light',
    name: 'Solar Street Light',
    text: 'Solar street lights high in illumination, acclaimed by a large number of satisfied clients — plus solar home-lighting systems for homes, huts and shops.',
    items: [
      {
        name: 'Solar LED Street Light',
        img: ledStreetLight,
        specs: [
          ['Type', 'Integrated · LED, white'],
          ['Load', '7 W up to 50 W'],
          ['Battery', 'Lithium · overcharge protection'],
          ['Rating', 'IP65 · ISI certified'],
          ['Panels', '3'],
          ['Model', 'LED 36 W / 24 W (industrial)'],
          ['Brand · warranty', 'Suryan Energy · 2 years'],
        ],
      },
      {
        name: 'Solar Street Light',
        img: streetLight,
        specs: [
          ['Lighting', 'LED, pure white · wide beam'],
          ['Capacity', '12 – 40 W · 12 V'],
          ['Luminous flux', '900 lm'],
          ['Lifetime', '50,000 hours'],
          ['Driver efficiency', '95%'],
          ['Rating', 'IP40 · CE'],
        ],
      },
      {
        name: 'CFL Solar Street Light',
        img: cflStreetLight,
        specs: [
          ['Lighting', 'Fluorescent'],
          ['Features', 'High illumination · easy to install · elegant look'],
        ],
      },
      {
        name: 'Solar Home Lighting System',
        img: homeLighting,
        specs: [
          ['For', 'Homes, huts and shops'],
          ['Lighting', 'LED · 3 W and 5 W loads'],
          ['Brand · warranty', 'Suryan · 2 years'],
          ['Origin', 'Made in India'],
        ],
      },
      {
        name: 'Solar LED Home Lighting System',
        img: ledHomeLighting,
        specs: [['Kit', 'Panel, battery unit and LED lamps']],
      },
    ],
  },
  {
    id: 'solar-water-heater',
    name: 'Solar Water Heater',
    text: 'A wide range of highly efficient solar water heaters — evacuated-tube (ETC) and flat-plate (FPC) — with excellent specifications for homes and businesses.',
    items: [
      {
        name: 'Domestic ETC Solar Water Heater',
        img: etcHeater,
        specs: [
          ['Capacity', '100 – 300 litres'],
          ['Tubes', '10 (100 L) to 30 (300 L) · 58 × 1800 mm'],
          ['Inner tank', 'GI, epoxy coated'],
          ['Outer tank', 'GI, powder coated'],
          ['Warranty', '5 years'],
          ['Origin', 'Made in India'],
        ],
      },
      {
        name: 'Domestic Flat Plate Solar Water Heater',
        img: flatPlateHeater,
        specs: [
          ['Capacity', '100 LPD'],
          ['Collector', 'Flat plate (FPC)'],
          ['Tank', 'Stainless steel'],
        ],
      },
      {
        name: 'ETC Solar Water Heater 100 LPD',
        img: etcHeater100,
        specs: [
          ['Capacity', 'Up to 100 LPD'],
          ['Stand', 'M.S. frame'],
          ['Warranty', '5 years'],
        ],
      },
    ],
  },
  {
    id: 'other-solar-products',
    name: 'Other Solar Products',
    text: 'Solar on-grid inverters and solar water pumps, with effective and timely delivery.',
    items: [
      {
        name: 'Solar Water Pump',
        img: waterPump,
        specs: [
          ['Use', 'Agricultural'],
          ['Operation', 'Automatic'],
          ['Warranty', '12 months'],
        ],
      },
      {
        name: 'Solar On-Grid Inverter',
        img: onGridInverter,
        specs: [
          ['Phase · use', 'Single · home and commercial'],
          ['Output', '230 V · 6.5 A · PF 0.8'],
          ['Efficiency', '95%'],
          ['Input', 'MC4, 2 pairs · start-up 200 V'],
          ['Display', 'LCD'],
          ['Brand', 'Power One'],
        ],
      },
    ],
  },
  {
    id: 'digital-inverter',
    name: 'Digital Inverter',
    text: 'Solar off-grid inverters, appreciated for their finish, quality and long service life.',
    items: [
      {
        name: 'Solar Off-Grid Inverter',
        img: offGridInverter,
        specs: [
          ['Brands', 'Microtek · Glowpower · Power One'],
          ['Output', 'Pure sine wave · low harmonic distortion'],
          ['Phase', 'Single · PF 0.8'],
          ['Input', 'MC4, 2 pairs · start-up 200 V'],
          ['Display', 'LCD'],
        ],
      },
    ],
  },
]
