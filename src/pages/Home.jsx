import React from 'react';
import HeroSplit from '../components/home/HeroSplit';
import AboutTeaser from '../components/home/AboutTeaser';
import PortfolioPreview from '../components/home/PortfolioPreview';
import CTASection from '../components/home/CTASection';

const portfolioImages = [
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/3d6c4992b_generated_474c3530.png',
    alt: 'Intimate wedding reception champagne toast in black and white',
    category: 'EVENT',
    title: 'The Toast',
  },
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/31dc8256d_generated_86fef3e9.png',
    alt: 'Modernist building exterior with dramatic shadows',
    category: 'REAL ESTATE',
    title: 'Geometric Precision',
  },
  {
    src: 'https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/5349423ba_generated_fe09d024.png',
    alt: 'Couple dancing at a gala with dramatic chandelier lighting',
    category: 'EVENT',
    title: 'The Dance',
  },
];

export default function Home() {
  return (
    <div>
      <HeroSplit
        eventImage="https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/904a894d1_generated_086aec4a.png"
        realEstateImage="https://media.base44.com/images/public/69f7b966aa5f0878d3cfb1ac/94bbfd276_generated_c5be5621.png"
      />
      <AboutTeaser />
      <PortfolioPreview images={portfolioImages} />
      <CTASection />
    </div>
  );
}