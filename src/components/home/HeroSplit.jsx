import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function HeroSplit({ eventImage, realEstateImage }) {
  const [hovered, setHovered] = useState(null);

  return (
    <section className="relative h-screen overflow-hidden">
      <div className="flex h-full">
        {/* Events Side */}
        <motion.div
          className="relative overflow-hidden cursor-pointer"
          animate={{
            flex: hovered === 'event' ? 1.5 : hovered === 'realestate' ? 0.7 : 1,
          }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          onMouseEnter={() => setHovered('event')}
          onMouseLeave={() => setHovered(null)}
        >
          <Link to="/events" className="block h-full">
            <div className="absolute inset-0">
              <img
                src={eventImage}
                alt="Event photography - elegant gala with dramatic lighting"
                className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out"
                style={{ transform: hovered === 'event' ? 'scale(1.05)' : 'scale(1)' }}
              />
              <div className="absolute inset-0 bg-noir/40" />
            </div>
            <div className="relative h-full flex flex-col justify-end p-8 md:p-16">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-3">01 — SERVICES</p>
                <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-ivory leading-[0.9]">
                  Event<br />Photography
                </h2>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-12 h-[1px] bg-ivory/40" />
                  <span className="font-mono text-[11px] text-ivory/60 tracking-widest">EXPLORE</span>
                </div>
              </motion.div>
            </div>
          </Link>
        </motion.div>

        {/* Center Divider */}
        <div className="w-[1px] bg-halide/30 z-10" />

        {/* Real Estate Side */}
        <motion.div
          className="relative overflow-hidden cursor-pointer"
          animate={{
            flex: hovered === 'realestate' ? 1.5 : hovered === 'event' ? 0.7 : 1,
          }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          onMouseEnter={() => setHovered('realestate')}
          onMouseLeave={() => setHovered(null)}
        >
          <Link to="/real-estate" className="block h-full">
            <div className="absolute inset-0">
              <img
                src={realEstateImage}
                alt="Real estate photography - modernist architecture with dramatic shadows"
                className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out"
                style={{ transform: hovered === 'realestate' ? 'scale(1.05)' : 'scale(1)' }}
              />
              <div className="absolute inset-0 bg-noir/40" />
            </div>
            <div className="relative h-full flex flex-col justify-end p-8 md:p-16">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.8 }}
              >
                <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-3">02 — SERVICES</p>
                <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-ivory leading-[0.9]">
                  Real Estate<br />Photography
                </h2>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-12 h-[1px] bg-ivory/40" />
                  <span className="font-mono text-[11px] text-ivory/60 tracking-widest">EXPLORE</span>
                </div>
              </motion.div>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Center Brand Mark */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-center"
        >
          <h1 className="font-display text-ivory text-2xl md:text-4xl tracking-wider">
            NOIR <span className="text-halide">&</span> IVORY
          </h1>
          <p className="font-mono text-[10px] text-halide tracking-[0.4em] mt-2">IMAGING</p>
        </motion.div>
      </div>
    </section>
  );
}