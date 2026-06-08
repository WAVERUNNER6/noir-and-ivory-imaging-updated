import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Send, ImageIcon, X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function GalleryUploader({ booking }) {
  const [gallery, setGallery] = useState(null);
  const [signedUrls, setSignedUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef();

  useEffect(() => {
    loadGallery();
  }, [booking.id]);

  const loadGallery = async () => {
    setLoading(true);
    const galleries = await base44.entities.Gallery.filter({ booking_id: booking.id });
    if (galleries.length > 0) {
      const g = galleries[0];
      setGallery(g);
      // Load signed URLs for preview
      if ((g.photos || []).length > 0) {
        const res = await base44.functions.invoke('gallerySignedUrls', { access_token: g.access_token });
        setSignedUrls(res.data?.signed_urls || []);
      }
    }
    setLoading(false);
  };

  const handleFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);

    let currentGallery = gallery;

    // Create gallery record if it doesn't exist
    if (!currentGallery) {
      const token = generateToken();
      currentGallery = await base44.entities.Gallery.create({
        booking_id: booking.id,
        client_name: booking.client_name,
        client_email: booking.client_email,
        shoot_date: booking.shoot_date,
        shoot_type: booking.shoot_type,
        access_token: token,
        photos: [],
      });
      setGallery(currentGallery);
    }

    const newUris = [];
    for (const file of Array.from(files)) {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      newUris.push(file_uri);
    }

    const updatedPhotos = [...(currentGallery.photos || []), ...newUris];
    const updated = await base44.entities.Gallery.update(currentGallery.id, { photos: updatedPhotos });
    setGallery(updated);

    // Refresh signed URL previews
    const res = await base44.functions.invoke('gallerySignedUrls', { access_token: currentGallery.access_token });
    setSignedUrls(res.data?.signed_urls || []);

    toast.success(`${newUris.length} photo${newUris.length > 1 ? 's' : ''} uploaded`);
    setUploading(false);
  };

  const handleRemove = async (index) => {
    const updatedPhotos = (gallery.photos || []).filter((_, i) => i !== index);
    const updated = await base44.entities.Gallery.update(gallery.id, { photos: updatedPhotos });
    setGallery(updated);
    setSignedUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    setSending(true);
    const appUrl = window.location.origin;
    const res = await base44.functions.invoke('sendGalleryEmail', { gallery_id: gallery.id, app_url: appUrl });
    if (res.data?.success) {
      toast.success(`Gallery sent to ${booking.client_email}`);
      setGallery(prev => ({ ...prev, sent_at: new Date().toISOString() }));
    } else {
      toast.error('Failed to send gallery email');
    }
    setSending(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  if (loading) {
    return <div className="flex justify-center py-6"><Loader2 size={16} className="animate-spin text-halide" /></div>;
  }

  const photoCount = gallery?.photos?.length || 0;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-widest text-halide/60">CLIENT GALLERY</p>
        {photoCount > 0 && (
          <span className="font-mono text-[10px] text-halide/50">{photoCount} PHOTO{photoCount !== 1 ? 'S' : ''}</span>
        )}
      </div>

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className="border border-dashed border-halide/20 hover:border-halide/40 transition-colors p-6 text-center cursor-pointer"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 size={14} className="animate-spin text-halide" />
            <span className="font-mono text-[11px] text-halide tracking-wider">UPLOADING...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Upload size={14} className="text-halide/40" />
            <span className="font-mono text-[11px] text-halide/50 tracking-wider">DROP PHOTOS OR CLICK TO UPLOAD</span>
          </div>
        )}
      </div>

      {/* Photo Thumbnails */}
      {signedUrls.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {signedUrls.map((url, i) => (
            <div key={i} className="relative group aspect-square">
              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => handleRemove(i)}
                className="absolute top-1 right-1 bg-noir/80 text-ivory p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Send Button */}
      {photoCount > 0 && (
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-2 bg-ivory text-noir px-5 py-2.5 font-mono text-[11px] tracking-widest hover:bg-halide hover:text-ivory transition-colors disabled:opacity-40"
          >
            {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            {sending ? 'SENDING...' : 'SEND GALLERY'}
          </button>
          {gallery?.sent_at && (
            <span className="flex items-center gap-1.5 font-mono text-[10px] text-green-400/70 tracking-wider">
              <Check size={11} /> SENT {new Date(gallery.sent_at).toLocaleDateString()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}