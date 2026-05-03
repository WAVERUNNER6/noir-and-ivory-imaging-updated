import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function PortfolioPreview({ images }) {
  return (
    <section className="bg-noir py-24 md:py-40">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
          <div>
            <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-4">SELECTED WORK</p>
            <h2 className="font-display text-ivory text-4xl md:text-6xl leading-[1]">
              Recent Captures
            </h2>
          </div>
          <div className="flex gap-6 mt-6 md:mt-0">
            <Link
              to="/events"
              className="font-mono text-xs tracking-widest text-halide hover:text-ivory transition-colors flex items-center gap-2 group"
            >
              EVENTS <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/real-estate"
              className="font-mono text-xs tracking-widest text-halide hover:text-ivory transition-colors flex items-center gap-2 group"
            >
              REAL ESTATE <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Staggered Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {images.slice(0, 3).map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.7 }}
              className={`relative overflow-hidden group ${i === 1 ? 'md:mt-16' : ''}`}
            >
              <div className="aspect-[4/5] overflow-hidden">
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-all duration-700 brightness-75 group-hover:brightness-100 group-hover:scale-105"
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-noir/80 to-transparent">
                <p className="font-mono text-[10px] text-halide tracking-widest">{img.category}</p>
                <p className="font-display text-ivory text-xl mt-1">{img.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}