import { NextResponse } from 'next/server';
const { readAll, writeAll } = require('@/lib/jsondb');
const { requireAdmin } = require('@/lib/auth');
const logger = require('@/lib/logger');

const COLLECTION = 'content';

function getAll() {
  const rows = readAll(COLLECTION);
  return rows.reduce((acc, row) => { acc[row.key] = row.value; return acc; }, {});
}

const DEFAULTS = {
  hero: {
    line1:    'Find Your UAE',
    line2:    'Driving School.',
    line3:    'Compare & Save.',
    subtitle: 'Compare every RTA-approved driving school across all 7 emirates — prices, ratings, and packages in one place.',
    ctaText:  'Get My Free Comparison',
  },
  footer: {
    tagline:   'Your trusted guide to UAE driving schools.',
    copyright: `© ${new Date().getFullYear()} SimpleUAE. All rights reserved.`,
  },
  stats: {
    schools:  { number: '12+',  label: 'Approved Schools' },
    licences: { number: '5',    label: 'License Types' },
    emirates: { number: '7',    label: 'Emirates Covered' },
    savings:  { number: 'Free', label: 'Comparison Service' },
  },
  testimonials: [
    { name: 'Sarah M.', role: 'Car License · Dubai',     quote: 'SimpleUAE saved me hours of research. I found a school 30% cheaper than what I was quoted elsewhere!' },
    { name: 'Ahmed K.', role: 'Heavy Truck · Abu Dhabi', quote: 'As a professional driver, finding the right truck license school was crucial. SimpleUAE made it effortless.' },
    { name: 'Priya L.', role: 'Car License · Sharjah',   quote: 'The comparison tool is brilliant. I could see exactly what each school offered and chose the best value.' },
  ],
  packages: [
    { name: 'Standard Car License',   category: 'Car License',    price: 'AED 4,200', duration: '30–45 days', includes: 'Theory classes, Parking test, Road test, RTA registration' },
    { name: 'Motorcycle Course',       category: 'Motorcycle',     price: 'AED 2,800', duration: '20–30 days', includes: 'Theory, Balance & control, Road riding, RTA test' },
    { name: 'Heavy Truck Program',     category: 'Heavy Truck',    price: 'AED 6,500', duration: '45–60 days', includes: 'Theory, Practical driving, Vehicle pre-check, RTA HGV test' },
    { name: 'Forklift Certification',  category: 'Forklift',       price: 'AED 1,500', duration: '5–7 days',   includes: 'Safety briefing, Practical operation, CICB certification' },
  ],
};

export async function GET(request) {
  try {
    const stored = getAll();
    const data = {};
    for (const [section, def] of Object.entries(DEFAULTS)) {
      data[section] = stored[section] !== undefined ? stored[section] : def;
    }
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
