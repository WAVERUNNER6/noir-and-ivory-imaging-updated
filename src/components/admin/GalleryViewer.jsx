import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GalleryViewer({ booking }) {
  const [gallery, setGallery] = useState(null);
  const [photoUrls, setPhotoUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const load = async () => {
      const galleries = await base44.entities.Gallery.filter({ booking_id: booking.id });
      if (!galleries.length) { setLoading(false); return; }
      const g = galleries[0];
      setGallery(g);

      // For completed status, show edited photos; otherwise show raw
      const isCompleted = booking.status === 'completed';
      const photos = (isCompleted || g.phase === 'edited')
        ? (g.edited_photos || [])
        : (g.photos || []);

      if (photos.length > 0) {
        const urls = await Promise.all(
          photos.map(uri =>
            base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 3600 })
              .then(r => r.signed_url).catch(() => null)
          )
        );
        setPhotoUrls(urls.filter(Boolean));
      }
      setLoading(false);
    };
    load();
  }, [booking.id, booking.status]);

  const prev = () => setLightbox(i => (i > 0 ? i - 1 : photoUrls.length - 1));
  const next = () => setLightbox(i => (i < photoUrls.length - 1 ? i + 1 : 0));

  if (loading) return (
    <div className="flex items-center gap-2 py-3">
      <Loader2 size={12} className="animate-spin text-halide" />
      <span className="font-mono text-[10px] text-halide/50 tracking-widest">LOADING GALLERY...</span>
    </div>
  );

  if (!gallery || photoUrls.length === 0) return (
    <p className="font-mono text-[10px] text-halide/30 tracking-widest py-2">NO PHOTOS UPLOADED YET</p>
  );

  const selectedSet = new Set(gallery.selected_photos || []);
  const isSelectionView = booking.status === 'editing' || booking.status === 'selecting_photos';
  const showingEdited = gallery.phase === 'edited';

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <p className="font-mono text-[9px] tracking-widest text-halide/50">
          {showingEdited ? 'EDITED PHOTOS' : 'RAW PHOTOS'} — {photoUrls.length} UPLOADED
          {isSelectionView && selectedSet.size > 0 && ` · ${selectedSet.size} SELECTED BY CLIENT`}
        </p>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
        {photoUrls.map((url, i) => {
          const isSelected = isSelectionView && selectedSet.has(i);
          return (
            <div
              key={i}
              className="relative aspect-square cursor-pointer group"
              onClick={() => setLightbox(i)}
            >
              <img
                src={url}
                alt={`Photo ${i + 1}`}
                className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'}`}
              />
              {isSelected && (
                <div className="absolute inset-0 border-2 border-ivory pointer-events-none" />
              )}
              {isSelected && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-ivory flex items-center justify-center">
                  <Check size={9} className="text-noir" />
                </div>
              )}
              <span className="absolute bottom-0.5 left-1 font-mono text-[8px] text-ivory/40">{i + 1}</span>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-noir/95 z-50 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <button onClick={e => { e.stopPropagation(); prev(); }} className="absolute left-4 text-halide hover:text-ivory p-2">
              <ChevronLeft size={28} />
            </button>
            <motion.img
              key={lightbox}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              src={photoUrls[lightbox]} alt=""
              className="max-h-[88vh] max-w-[88vw] object-contain"
              onClick={e => e.stopPropagation()}
            />
            <button onClick={e => { e.stopPropagation(); next(); }} className="absolute right-4 text-halide hover:text-ivory p-2">
              <ChevronRight size={28} />
            </button>
            <button onClick={() => setLightbox(null)} className="absolute top-5 right-5 text-halide hover:text-ivory">
              <X size={22} />
            </button>
            <div className="absolute bottom-5 text-center">
              <p className="font-mono text-[11px] text-halide/50">{lightbox + 1} / {photoUrls.length}</p>
              {isSelectionView && selectedSet.has(lightbox) && (
                <p className="font-mono text-[10px] text-ivory/60 mt-1">✓ CLIENT SELECTED</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}