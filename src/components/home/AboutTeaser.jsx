import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function AboutTeaser() {
  return (
    <section className="bg-ivory py-24 md:py-40">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="font-mono text-[11px] text-halide tracking-[0.3em] mb-6"
            >
              THE PHILOSOPHY
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="font-display text-noir text-4xl md:text-6xl leading-[1] mb-8"
            >
              We don't take<br />photographs.<br />
              <span className="text-halide">We capture legacies.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="font-body text-lg text-noir/60 leading-relaxed max-w-lg mb-10"
            >
              At Noir & Ivory, every frame is a deliberate composition of light, shadow, and 
              emotion. Whether it's the electricity of a gala or the silent geometry of 
              architecture, we transform moments into timeless visual narratives.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <Link
                to="/about"
                className="inline-flex items-center gap-3 font-mono text-xs tracking-widest text-noir border-b border-noir pb-1 hover:text-halide hover:border-halide transition-colors group"
              >
                OUR STORY
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          <div className="relative">
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center py-8 border border-noir/10">
                  <p className="font-display text-5xl text-noir">500+</p>
                  <p className="font-mono text-[10px] text-halide tracking-widest mt-2">EVENTS CAPTURED</p>
                </div>
                <div className="text-center py-8 border border-noir/10">
                  <p className="font-display text-5xl text-noir">200+</p>
                  <p className="font-mono text-[10px] text-halide tracking-widest mt-2">PROPERTIES SHOT</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center py-8 border border-noir/10">
                  <p className="font-display text-5xl text-noir">8</p>
                  <p className="font-mono text-[10px] text-halide tracking-widest mt-2">YEARS EXPERIENCE</p>
                </div>
                <div className="text-center py-8 border border-noir/10">
                  <p className="font-display text-5xl text-noir">100%</p>
                  <p className="font-mono text-[10px] text-halide tracking-widest mt-2">CLIENT SATISFACTION</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}