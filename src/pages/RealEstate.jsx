import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const realEstateImages = [
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/94bbfd276_generated_c5be5621.png',
    alt: 'Modernist luxury home interior with dramatic light',
    title: 'The Glass House',
    location: 'Pacific Palisades, CA',
  },
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/31dc8256d_generated_86fef3e9.png',
    alt: 'Modern building exterior at dusk',
    title: 'Urban Geometry',
    location: 'Downtown LA, CA',
  },
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/d75c40782_generated_0fd83e1a.png',
    alt: 'Minimalist luxury living room with natural light',
    title: 'Light & Space',
    location: 'Venice, CA',
  },
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/8c0e36fe1_generated_c2a3d96f.png',
    alt: 'Modern kitchen interior with marble countertops',
    title: 'The Kitchen Studio',
    location: 'Beverly Hills, CA',
  },
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/fc90b43bb_generated_9f0ea1f3.png',
    alt: 'Aerial view of luxury property with pool',
    title: 'Estate Aerial',
    location: 'Bel Air, CA',
  },
];

export default function RealEstate() {
  return (
    <div className="bg-ivory min-h-screen">
      {/* Header */}
      <div className="pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-[11px] text-noir tracking-[0.3em] mb-4"
          >
            02 — SPACE
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-noir text-5xl md:text-7xl lg:text-8xl leading-[0.9]"
          >
            Real Estate<br />Photography
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-body text-lg text-noir/50 mt-8 max-w-xl leading-relaxed"
          >
            We reveal the architectural soul of every property. Through meticulous composition
            and dramatic light, we transform spaces into aspirational visual experiences.
          </motion.p>
        </div>
      </div>

      {/* Symmetrical Grid */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 pb-24 md:pb-40">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {realEstateImages.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.7 }}
              className={`relative overflow-hidden group ${
                i === 0 ? 'md:col-span-2 lg:col-span-2' : ''
              }`}
            >
              <div className={`${i === 0 ? 'aspect-[16/9]' : 'aspect-[4/5]'} overflow-hidden`}>
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-all duration-1000 brightness-90 group-hover:brightness-100 group-hover:scale-105"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-noir/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <p className="font-mono text-[10px] text-halide tracking-widest">{img.location}</p>
                <p className="font-display text-ivory text-xl mt-1">{img.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-noir py-24">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 text-center">
          <h2 className="font-display text-ivory text-4xl md:text-6xl mb-8">
            Listing a property?
          </h2>
          <Link
            to="/booking"
            className="inline-flex items-center gap-4 bg-ivory text-noir px-12 py-5 font-mono text-xs tracking-[0.2em] hover:bg-halide hover:text-ivory transition-colors group"
          >
            BOOK PROPERTY SHOOT
            <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}