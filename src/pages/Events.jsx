import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const eventImages = [
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/904a894d1_generated_086aec4a.png',
    alt: 'Elegant gala event with silhouettes dancing',
    title: 'The Grand Gala',
    location: 'Beverly Hills, CA',
    year: '2025',
    aspect: 'aspect-[3/4]',
  },
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/3d6c4992b_generated_474c3530.png',
    alt: 'Intimate champagne toast at wedding reception',
    title: 'Midnight Toast',
    location: 'Malibu, CA',
    year: '2025',
    aspect: 'aspect-[4/3]',
  },
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/774104f82_generated_2d61880c.png',
    alt: 'Speaker on stage at corporate conference',
    title: 'The Keynote',
    location: 'San Francisco, CA',
    year: '2024',
    aspect: 'aspect-[4/3]',
  },
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/5349423ba_generated_fe09d024.png',
    alt: 'Couple dancing at an elegant event',
    title: 'First Dance',
    location: 'Santa Monica, CA',
    year: '2025',
    aspect: 'aspect-[3/2]',
  },
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/7e41f4192_generated_b59da3f7.png',
    alt: 'Live musicians performing at upscale event',
    title: 'The Ensemble',
    location: 'Los Angeles, CA',
    year: '2024',
    aspect: 'aspect-[16/9]',
  },
];

export default function Events() {
  return (
    <div className="bg-noir min-h-screen">
      {/* Header */}
      <div className="pt-32 md:pt-40 pb-16 md:pb-24">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-mono text-[11px] text-halide tracking-[0.3em] mb-4"
          >
            01 — CHRONOS
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="font-display text-ivory text-5xl md:text-7xl lg:text-8xl leading-[0.9]"
          >
            Event<br />Photography
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="font-body text-lg text-halide mt-8 max-w-xl leading-relaxed"
          >
            We capture the raw energy, the in-between moments, and the electric atmosphere 
            that define unforgettable events. Each frame tells a story that words cannot.
          </motion.p>
        </div>
      </div>

      {/* Staggered Burst Layout */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 pb-24 md:pb-40">
        <div className="space-y-4">
          {/* Row 1: Full width */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative overflow-hidden group"
          >
            <div className="aspect-[16/9] md:aspect-[21/9] overflow-hidden">
              <img
                src={eventImages[4].src}
                alt={eventImages[4].alt}
                className="w-full h-full object-cover transition-all duration-1000 brightness-75 group-hover:brightness-100"
              />
            </div>
            <div className="absolute bottom-0 left-0 p-6 md:p-10">
              <p className="font-mono text-[10px] text-halide tracking-widest">{eventImages[4].location} — {eventImages[4].year}</p>
              <p className="font-display text-ivory text-2xl md:text-4xl mt-1">{eventImages[4].title}</p>
            </div>
          </motion.div>

          {/* Row 2: Two columns staggered */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eventImages.slice(0, 2).map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.7 }}
                className={`relative overflow-hidden group ${i === 1 ? 'md:mt-16' : ''}`}
              >
                <div className={`${img.aspect} overflow-hidden`}>
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover transition-all duration-1000 brightness-75 group-hover:brightness-100"
                  />
                </div>
                <div className="absolute bottom-0 left-0 p-6">
                  <p className="font-mono text-[10px] text-halide tracking-widest">{img.location} — {img.year}</p>
                  <p className="font-display text-ivory text-xl md:text-2xl mt-1">{img.title}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Row 3: Two columns staggered opposite */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {eventImages.slice(2, 4).map((img, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.7 }}
                className={`relative overflow-hidden group ${i === 0 ? 'md:mt-12' : ''}`}
              >
                <div className={`${img.aspect} overflow-hidden`}>
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover transition-all duration-1000 brightness-75 group-hover:brightness-100"
                  />
                </div>
                <div className="absolute bottom-0 left-0 p-6">
                  <p className="font-mono text-[10px] text-halide tracking-widest">{img.location} — {img.year}</p>
                  <p className="font-display text-ivory text-xl md:text-2xl mt-1">{img.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-ivory py-24">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 text-center">
          <h2 className="font-display text-noir text-4xl md:text-6xl mb-8">
            Have an event coming up?
          </h2>
          <Link
            to="/booking"
            className="inline-flex items-center gap-4 bg-noir text-ivory px-12 py-5 font-mono text-xs tracking-[0.2em] hover:bg-halide transition-colors group"
          >
            BOOK EVENT PHOTOGRAPHY
            <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}