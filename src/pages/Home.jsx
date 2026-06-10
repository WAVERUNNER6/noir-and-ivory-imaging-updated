import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Testimonials from '@/components/home/Testimonials';

const EVENT_IMG = 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/904a894d1_generated_086aec4a.png';
const RE_IMG = 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/94bbfd276_generated_c5be5621.png';

const portfolioImages = [
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/3d6c4992b_generated_474c3530.png',
    category: 'EVENT', title: 'The Toast',
  },
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/31dc8256d_generated_86fef3e9.png',
    category: 'REAL ESTATE', title: 'Geometric Precision',
  },
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/5349423ba_generated_fe09d024.png',
    category: 'EVENT', title: 'The Dance',
  },
];

function HeroSplit() {
  const [hovered, setHovered] = useState(null);
  return (
    <section className="relative h-screen overflow-hidden">
      <div className="flex h-full">
        <motion.div
          className="relative overflow-hidden cursor-pointer"
          animate={{ flex: hovered === 'event' ? 1.5 : hovered === 're' ? 0.7 : 1 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          onMouseEnter={() => setHovered('event')} onMouseLeave={() => setHovered(null)}
        >
          <Link to="/events" className="block h-full">
            <div className="absolute inset-0">
              <img src={EVENT_IMG} alt="Event photography" className="w-full h-full object-cover" style={{ transform: hovered === 'event' ? 'scale(1.05)' : 'scale(1)', transition: 'transform 1.5s ease' }} />
              <div className="absolute inset-0 bg-noir/40" />
            </div>
            <div className="relative h-full flex flex-col justify-end p-8 md:p-16">
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}>
                <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-3">01 — SERVICES</p>
                <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-ivory leading-[0.9]">Event<br />Photography</h2>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-12 h-[1px] bg-ivory/40" />
                  <span className="font-mono text-[11px] text-ivory/60 tracking-widest">EXPLORE</span>
                </div>
              </motion.div>
            </div>
          </Link>
        </motion.div>

        <div className="w-[1px] bg-halide/30 z-10" />

        <motion.div
          className="relative overflow-hidden cursor-pointer"
          animate={{ flex: hovered === 're' ? 1.5 : hovered === 'event' ? 0.7 : 1 }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          onMouseEnter={() => setHovered('re')} onMouseLeave={() => setHovered(null)}
        >
          <Link to="/real-estate" className="block h-full">
            <div className="absolute inset-0">
              <img src={RE_IMG} alt="Real estate photography" className="w-full h-full object-cover" style={{ transform: hovered === 're' ? 'scale(1.05)' : 'scale(1)', transition: 'transform 1.5s ease' }} />
              <div className="absolute inset-0 bg-noir/40" />
            </div>
            <div className="relative h-full flex flex-col justify-end p-8 md:p-16">
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.8 }}>
                <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-3">02 — SERVICES</p>
                <h2 className="font-display text-4xl md:text-6xl lg:text-7xl text-ivory leading-[0.9]">Real Estate<br />Photography</h2>
                <div className="mt-6 flex items-center gap-3">
                  <div className="w-12 h-[1px] bg-ivory/40" />
                  <span className="font-mono text-[11px] text-ivory/60 tracking-widest">EXPLORE</span>
                </div>
              </motion.div>
            </div>
          </Link>
        </motion.div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none text-center">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1, duration: 1 }}>
          <h1 className="font-display text-ivory text-2xl md:text-4xl tracking-wider">NOIR <span className="text-halide">&</span> IVORY</h1>
          <p className="font-mono text-[10px] text-halide tracking-[0.4em] mt-2">IMAGING</p>
        </motion.div>
      </div>
    </section>
  );
}

function AboutTeaser() {
  return (
    <section className="bg-ivory py-24 md:py-40">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div>
            <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-6">THE PHILOSOPHY</p>
            <h2 className="font-display text-noir text-4xl md:text-6xl leading-[1] mb-8">
              We don't take<br />photographs.<br /><span className="text-halide">We capture legacies.</span>
            </h2>
            <p className="font-body text-lg text-noir/60 leading-relaxed max-w-lg mb-10">
              At Noir & Ivory, every frame is a deliberate composition of light, shadow, and emotion.
              Whether it's the electricity of a gala or the silent geometry of architecture, we transform
              moments into timeless visual narratives.
            </p>
            <Link to="/about" className="inline-flex items-center gap-3 font-mono text-xs tracking-widest text-noir border-b border-noir pb-1 hover:text-halide hover:border-halide transition-colors group">
              OUR STORY <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[
              ['Light', 'THE MEDIUM WE MASTER'],
              ['Shadow', 'WHERE DEPTH IS BORN'],
              ['Contrast', 'THE LANGUAGE WE SPEAK'],
              ['Beauty', 'WHAT WE REVEAL'],
            ].map(([word, label]) => (
              <div key={label} className="text-center py-8 border border-noir/10">
                <p className="font-display text-4xl text-noir italic">{word}</p>
                <p className="font-mono text-[10px] text-halide tracking-widest mt-2">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PortfolioPreview() {
  return (
    <section className="bg-noir py-24 md:py-40">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16">
          <div>
            <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-4">SELECTED WORK</p>
            <h2 className="font-display text-ivory text-4xl md:text-6xl leading-[1]">Recent Captures</h2>
          </div>
          <div className="flex gap-6 mt-6 md:mt-0">
            <Link to="/events" className="font-mono text-xs tracking-widest text-halide hover:text-ivory transition-colors flex items-center gap-2 group">
              EVENTS <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/real-estate" className="font-mono text-xs tracking-widest text-halide hover:text-ivory transition-colors flex items-center gap-2 group">
              REAL ESTATE <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {portfolioImages.map((img, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.7 }}
              className={`relative overflow-hidden group ${i === 1 ? 'md:mt-16' : ''}`}>
              <div className="aspect-[4/5] overflow-hidden">
                <img src={img.src} alt={img.title} className="w-full h-full object-cover transition-all duration-700 brightness-75 group-hover:brightness-100 group-hover:scale-105" />
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

function CTASection() {
  return (
    <section className="bg-ivory py-24 md:py-40">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 text-center">
        <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-8">START YOUR PROJECT</p>
        <h2 className="font-display text-noir text-5xl md:text-7xl lg:text-8xl leading-[0.9] max-w-4xl mx-auto mb-12">
          Ready to initiate<br /><span className="text-halide">your capture?</span>
        </h2>
        <Link to="/booking" className="inline-flex items-center gap-4 bg-noir text-ivory px-12 py-5 font-mono text-xs tracking-[0.2em] hover:bg-halide transition-colors group">
          BOOK A SESSION <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div>
      <HeroSplit />
      <AboutTeaser />
      <PortfolioPreview />
      <Testimonials />
      <CTASection />
    </div>
  );
}