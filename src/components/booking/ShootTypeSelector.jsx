import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Building2 } from 'lucide-react';

export default function ShootTypeSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { type: 'event', label: 'Event Photography', icon: Camera, desc: 'Galas, weddings, corporate events, concerts' },
        { type: 'real_estate', label: 'Property Photography', icon: Building2, desc: 'Residential, commercial, architectural' },
      ].map((option) => (
        <motion.button
          key={option.type}
          onClick={() => onSelect(option.type)}
          whileTap={{ scale: 0.98 }}
          className={`text-left p-8 border transition-all duration-500 ${
            selected === option.type
              ? 'border-ivory bg-ivory/5'
              : 'border-halide/20 hover:border-halide/50'
          }`}
        >
          <option.icon size={24} className={selected === option.type ? 'text-ivory' : 'text-halide'} />
          <h3 className={`font-display text-2xl mt-4 ${selected === option.type ? 'text-ivory' : 'text-halide'}`}>
            {option.label}
          </h3>
          <p className="font-body text-sm text-halide/60 mt-2">{option.desc}</p>
        </motion.button>
      ))}
    </div>
  );
}