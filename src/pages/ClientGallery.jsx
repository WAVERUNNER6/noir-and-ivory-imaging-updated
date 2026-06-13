import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Loader2, X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ClientGallery() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  const [galleryInfo, setGalleryInfo] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid gallery link.');
      setLoading(false);
      return;
    }
    base44.functions.invoke('gallerySignedUrls', { access_token: token }).then(res => {
      if (res.data?.expired) {
        setError('expired');
      } else if (res.data?.error) {
        setError('Gallery not found or link has expired.');
      } else {
        setGalleryInfo(res.data.gallery);
        setPhotos(res.data.signed_urls || []);
        if (res.data.gallery?.failed_count > 0) {
          console.warn(`${res.data.gallery.failed_count} photo(s) failed to load signed URLs`);
        }
      }
      setLoading(false);
    });
  }, [token]);

  const prev = () => setLightboxIndex(i => (i > 0 ? i - 1 : photos.length - 1));
  const next = () => setLightboxIndex(i => (i < photos.length - 1 ? i + 1 : 0));

  useEffect(() => {
    const handleKey = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') setLightboxIndex(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex, photos.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-noir flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-halide" />
      </div>
    );
  }

  if (error) {
    const isExpired = error === 'expired';
    return (
      <div className="min-h-screen bg-noir flex items-center justify-center px-6">
        <div className="text-center">
          <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-4">GALLERY</p>
          <h2 className="font-display text-ivory text-4xl mb-4">
            {isExpired ? 'Gallery Expired' : 'Link Not Found'}
          </h2>
          <p className="font-body text-halide/60">
            {isExpired
              ? 'This gallery link has expired. Please contact your photographer to request a new link.'
              : 'Gallery not found or link has expired.'}
          </p>
          {isExpired && (
            <a href="mailto:studio@noirandivoryimaging.com"
              className="inline-block mt-6 font-mono text-[11px] tracking-widest text-halide border-b border-halide/30 hover:text-ivory hover:border-ivory transition-colors">
              studio@noirandivoryimaging.com
            </a>
          )}
        </div>
      </div>
    );
  }

  const shootTypeLabel = galleryInfo?.shoot_type === 'real_estate' ? 'Real Estate Photography' : 'Event Photography';

  return (
    <div className="min-h-screen bg-noir">
      {/* Header */}
      <div className="pt-16 pb-12 px-6 md:px-12 max-w-[1600px] mx-auto">
        <p className="font-mono text-[11px] text-halide tracking-[0.3em] mb-4">NOIR & IVORY IMAGING</p>
        <h1 className="font-display text-ivory text-5xl md:text-7xl leading-[0.9] mb-4">
          {galleryInfo?.client_name}'s Gallery
        </h1>
        <p className="font-mono text-sm text-halide/60 tracking-wider">
          {shootTypeLabel} — {galleryInfo?.shoot_date ? format(new Date(galleryInfo.shoot_date + 'T00:00:00'), 'MMMM d, yyyy') : ''}
          <span className="ml-4 text-halide/40">{photos.length} images</span>
          {galleryInfo?.failed_count > 0 && (
            <span className="ml-4 text-yellow-400/80">({galleryInfo.failed_count} failed to load — please refresh or contact your photographer)</span>
          )}
        </p>
        {galleryInfo?.expires_at && (() => {
          const daysLeft = differenceInDays(parseISO(galleryInfo.expires_at), new Date());
          const isUrgent = daysLeft <= 2;
          return (
            <p className={`font-mono text-[11px] mt-2 tracking-widest ${isUrgent ? 'text-red-400' : 'text-halide/50'}`}>
              {daysLeft <= 0
                ? 'GALLERY EXPIRES TODAY'
                : daysLeft === 1
                  ? 'GALLERY EXPIRES TOMORROW'
                  : `GALLERY EXPIRES IN ${daysLeft} DAYS — ${format(parseISO(galleryInfo.expires_at), 'MMMM d, yyyy')}`
              }
            </p>
          );
        })()}
      </div>

      {/* Gallery Grid */}
      <div className="px-6 md:px-12 max-w-[1600px] mx-auto pb-24">
        {photos.length === 0 ? (
          <p className="font-mono text-[11px] text-halide/40 tracking-widest text-center py-20">NO PHOTOS YET</p>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 space-y-3">
            {photos.map((url, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="break-inside-avoid cursor-pointer overflow-hidden group"
                onClick={() => setLightboxIndex(i)}
              >
                <img
                  src={url}
                  alt={`Photo ${i + 1}`}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-noir/95 z-50 flex items-center justify-center"
            onClick={() => setLightboxIndex(null)}
          >
            <button onClick={(e) => { e.stopPropagation(); prev(); }}
              className="absolute left-4 md:left-8 text-halide hover:text-ivory transition-colors p-2 z-10">
              <ChevronLeft size={32} />
            </button>

            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={photos[lightboxIndex]}
              alt={`Photo ${lightboxIndex + 1}`}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            <button onClick={(e) => { e.stopPropagation(); next(); }}
              className="absolute right-4 md:right-8 text-halide hover:text-ivory transition-colors p-2 z-10">
              <ChevronRight size={32} />
            </button>

            <button onClick={() => setLightboxIndex(null)}
              className="absolute top-6 right-6 text-halide hover:text-ivory transition-colors">
              <X size={24} />
            </button>

            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-mono text-[11px] text-halide/50 tracking-widest">
              {lightboxIndex + 1} / {photos.length}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}