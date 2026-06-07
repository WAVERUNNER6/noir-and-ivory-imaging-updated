import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';

const businessEventPackages = [
  {
    name: 'Silver',
    eyebrow: '01',
    price: '$850',
    duration: 'Up to 3 hours',
    description: 'Perfect for intimate gatherings and smaller corporate events.',
    features: [
      '3 hours of coverage',
      '150+ edited digital images',
      'Online gallery delivery',
      '2-week turnaround',
      'Commercial usage license',
    ],
  },
  {
    name: 'Gold',
    eyebrow: '02',
    price: '$1,450',
    duration: 'Up to 6 hours',
    description: 'Our most popular package for galas, conferences, and full-day events.',
    features: [
      '6 hours of coverage',
      '350+ edited digital images',
      'Online gallery delivery',
      '1-week turnaround',
      'Commercial usage license',
      'Highlight reel (30 images)',
      'Print-ready files included',
    ],
    featured: true,
  },
  {
    name: 'Platinum',
    eyebrow: '03',
    price: '$2,200',
    duration: 'Full day',
    description: 'Comprehensive coverage for multi-venue or full-day productions.',
    features: [
      '10 hours of coverage',
      '600+ edited digital images',
      'Online gallery delivery',
      '5-day rush turnaround',
      'Commercial usage license',
      'Highlight reel (60 images)',
      'Print-ready files included',
      'Same-day preview (10 images)',
    ],
  },
];

const personalEventPackages = [
  {
    name: 'Celebrations',
    eyebrow: '01',
    price: 'Starting at $175',
    duration: 'Portraits & Life Milestones',
    description: 'From graduations and birthdays to engagement photos, baby showers, portraits, and everything in between — every milestone deserves to be remembered.',
    features: [
      'Event & portrait coverage',
      'Edited digital images',
      'Online gallery delivery',
      'Print-ready files',
      'Personal usage license',
    ],
    featured: true,
  },
  {
    name: 'Wedding',
    eyebrow: '02',
    price: 'Starting at $1,200',
    duration: 'Full Ceremony Coverage',
    description: 'Timeless, elegant coverage of your most important day from start to finish.',
    features: [
      'Ceremony & reception coverage',
      'Edited digital images',
      'Online gallery delivery',
      'Print-ready files',
      'Personal usage license',
      'Highlight reel included',
    ],
  },
];

const realEstatePackages = [
  {
    name: 'Limited Offer',
    eyebrow: 'REAL ESTATE',
    price: '$350',
    duration: 'Special Introductory Package',
    description: 'A limited-time offer delivering premium property coverage at an exceptional value. Available through October 1, 2026 only.',
    features: [
      'Up to 40 edited images',
      'Interior, exterior & detail shots',
      'Online delivery in 24 hours',
      'MLS-ready files',
      'Commercial usage license',
      'Twilight/dusk exterior (3 images)',
      '1–2 minute property video',
    ],
    featured: true,
    limitedTime: true,
  },
];



function PackageCard({ pkg, index, activeTab }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.12, duration: 0.7 }}
      className={`relative flex flex-col border p-8 transition-all duration-300
        ${pkg.featured
          ? 'border-ivory bg-ivory/5'
          : 'border-halide/20 hover:border-halide/40'}`}
    >
      {pkg.featured && (
        <div className="absolute -top-px left-8 right-8 h-px bg-ivory" />
      )}
      {pkg.featured && !pkg.limitedTime && (
        <p className="font-mono text-[10px] tracking-[0.25em] text-ivory bg-ivory/10 border border-ivory/30 px-3 py-1 self-start mb-6">MOST POPULAR</p>
      )}
      {pkg.limitedTime && (
        <p className="font-mono text-[10px] tracking-[0.25em] text-noir bg-ivory px-3 py-1 self-start mb-6">LIMITED TIME OFFER — EXPIRES OCT 1, 2026</p>
      )}
      <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-3">{pkg.eyebrow}</p>
      <h3 className="font-display text-ivory text-4xl mb-1">{pkg.name}</h3>
      <p className="font-mono text-[11px] text-halide tracking-wider mb-6">{pkg.duration}</p>
      <div className="mb-6 pb-6 border-b border-halide/15">
        <span className="font-display text-ivory text-5xl">{pkg.price}</span>
        <span className="font-mono text-[11px] text-halide ml-2 tracking-wider">/ SESSION</span>
      </div>
      <p className="font-body text-halide/70 text-sm mb-8 leading-relaxed">{pkg.description}</p>
      <ul className="space-y-3 mb-10 flex-1">
        {pkg.features.map(f => (
          <li key={f} className="flex items-start gap-3">
            <Check size={13} className="text-ivory mt-0.5 shrink-0" />
            <span className="font-body text-sm text-halide/80">{f}</span>
          </li>
        ))}
      </ul>
      <Link
        to={`/booking?package=${encodeURIComponent(pkg.name)}&tab=${activeTab}`}
        className={`flex items-center justify-center gap-3 py-3.5 font-mono text-xs tracking-[0.15em] transition-colors group
          ${pkg.featured
            ? 'bg-ivory text-noir hover:bg-halide hover:text-ivory'
            : 'border border-halide/30 text-halide hover:border-ivory hover:text-ivory'}`}
      >
        BOOK THIS PACKAGE <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
      </Link>
    </motion.div>
  );
}

export default function Pricing() {
  const [activeTab, setActiveTab] = useState('personal');

  return (
    <div className="bg-noir min-h-screen">
      {/* Header */}
      <div className="pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-[11px] text-halide tracking-[0.3em] mb-4">
            PRICING
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-ivory text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-8"
          >
            Investment<br />Guide
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-body text-lg text-halide max-w-xl leading-relaxed"
          >
            Transparent pricing with no hidden fees. Every package includes fully edited, print-ready images delivered via private online gallery.
          </motion.p>
        </div>
      </div>

      {/* Tab Toggle */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 mb-16">
        <div className="flex gap-0 border border-halide/20 w-fit">
          {[['personal', 'Personal Events'], ['business', 'Business Events'], ['realestate', 'Real Estate Photography']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-8 py-3.5 font-mono text-xs tracking-[0.15em] transition-colors
                ${activeTab === key ? 'bg-ivory text-noir' : 'text-halide hover:text-ivory'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Packages */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 pb-24">
        <div className={`grid gap-6 ${activeTab === 'realestate' ? 'grid-cols-1 max-w-xl' : 'grid-cols-1 md:grid-cols-3'}`}>
          {(activeTab === 'business' ? businessEventPackages : activeTab === 'personal' ? personalEventPackages : realEstatePackages).map((pkg, i) => (
            <PackageCard key={pkg.name} pkg={pkg} index={i} activeTab={activeTab} />
          ))}
        </div>
      </div>

      {/* Custom Quote */}
      <div className="bg-ivory py-24">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 text-center">
          <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-8">CUSTOM PROJECTS</p>
          <h2 className="font-display text-noir text-4xl md:text-6xl mb-6 leading-[0.95]">
            Need something<br />bespoke?
          </h2>
          <p className="font-body text-lg text-noir/50 max-w-lg mx-auto mb-10 leading-relaxed">
            Multi-day shoots, brand campaigns, and large-scale productions are quoted individually. Let's talk.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="inline-flex items-center justify-center gap-3 bg-noir text-ivory px-10 py-4 font-mono text-xs tracking-[0.2em] hover:bg-halide transition-colors group">
              GET A CUSTOM QUOTE <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/booking" className="inline-flex items-center justify-center gap-3 border border-noir text-noir px-10 py-4 font-mono text-xs tracking-[0.2em] hover:bg-noir hover:text-ivory transition-colors group">
              BOOK A SESSION <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}