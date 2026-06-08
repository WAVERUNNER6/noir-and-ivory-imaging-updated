import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, Send, X, Check, Loader2, Film } from 'lucide-react';
import { toast } from 'sonner';

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

const BATCH_SIZE = 5; // upload N files concurrently

async function uploadBatch(files) {
  return Promise.all(
    files.map(file => base44.integrations.Core.UploadPrivateFile({ file }).then(r => ({ uri: r.file_uri, type: file.type })))
  );
}

export default function GalleryUploader({ booking }) {
  const [gallery, setGallery] = useState(null);
  const [signedPhotoUrls, setSignedPhotoUrls] = useState([]);
  const [signedVideoUrls, setSignedVideoUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
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
      if ((g.photos || []).length > 0 || (g.videos || []).length > 0) {
        const res = await base44.functions.invoke('gallerySignedUrls', { access_token: g.access_token });
        setSignedPhotoUrls(res.data?.signed_urls || []);
        setSignedVideoUrls(res.data?.signed_video_urls || []);
      }
    }
    setLoading(false);
  };

  const handleFiles = async (files) => {
    const fileArray = Array.from(files);
    if (!fileArray.length) return;
    setUploading(true);
    setUploadProgress({ done: 0, total: fileArray.length });

    let currentGallery = gallery;
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
        videos: [],
      });
      setGallery(currentGallery);
    }

    const newPhotoUris = [];
    const newVideoUris = [];

    // Upload in batches of BATCH_SIZE
    for (let i = 0; i < fileArray.length; i += BATCH_SIZE) {
      const batch = fileArray.slice(i, i + BATCH_SIZE);
      const results = await uploadBatch(batch);
      results.forEach(({ uri, type }) => {
        if (type.startsWith('video/')) {
          newVideoUris.push(uri);
        } else {
          newPhotoUris.push(uri);
        }
      });
      setUploadProgress({ done: Math.min(i + BATCH_SIZE, fileArray.length), total: fileArray.length });
    }

    const updatedPhotos = [...(currentGallery.photos || []), ...newPhotoUris];
    const updatedVideos = [...(currentGallery.videos || []), ...newVideoUris];
    const updated = await base44.entities.Gallery.update(currentGallery.id, {
      photos: updatedPhotos,
      videos: updatedVideos,
    });
    setGallery(updated);

    // Refresh previews
    const res = await base44.functions.invoke('gallerySignedUrls', { access_token: currentGallery.access_token });
    setSignedPhotoUrls(res.data?.signed_urls || []);
    setSignedVideoUrls(res.data?.signed_video_urls || []);

    const photoMsg = newPhotoUris.length ? `${newPhotoUris.length} photo${newPhotoUris.length > 1 ? 's' : ''}` : '';
    const videoMsg = newVideoUris.length ? `${newVideoUris.length} video${newVideoUris.length > 1 ? 's' : ''}` : '';
    toast.success(`Uploaded: ${[photoMsg, videoMsg].filter(Boolean).join(' & ')}`);
    setUploading(false);
  };

  const handleRemovePhoto = async (index) => {
    const updatedPhotos = (gallery.photos || []).filter((_, i) => i !== index);
    const updated = await base44.entities.Gallery.update(gallery.id, { photos: updatedPhotos });
    setGallery(updated);
    setSignedPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = async (index) => {
    const updatedVideos = (gallery.videos || []).filter((_, i) => i !== index);
    const updated = await base44.entities.Gallery.update(gallery.id, { videos: updatedVideos });
    setGallery(updated);
    setSignedVideoUrls(prev => prev.filter((_, i) => i !== index));
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
  const videoCount = gallery?.videos?.length || 0;
  const totalCount = photoCount + videoCount;

  return (
    <div className="mt-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-widest text-halide/60">CLIENT GALLERY</p>
        {totalCount > 0 && (
          <span className="font-mono text-[10px] text-halide/50">
            {photoCount > 0 ? `${photoCount} PHOTO${photoCount !== 1 ? 'S' : ''}` : ''}
            {photoCount > 0 && videoCount > 0 ? ' · ' : ''}
            {videoCount > 0 ? `${videoCount} VIDEO${videoCount !== 1 ? 'S' : ''}` : ''}
          </span>
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
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-halide" />
              <span className="font-mono text-[11px] text-halide tracking-wider">
                UPLOADING {uploadProgress.done} / {uploadProgress.total}...
              </span>
            </div>
            <div className="w-48 h-[2px] bg-halide/10 mt-1">
              <div
                className="h-full bg-halide/60 transition-all duration-300"
                style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <Upload size={14} className="text-halide/40" />
              <span className="font-mono text-[11px] text-halide/50 tracking-wider">DROP FILES OR CLICK TO UPLOAD</span>
            </div>
            <span className="font-mono text-[9px] text-halide/30 tracking-widest">PHOTOS & VIDEOS · UP TO 600+ FILES</span>
          </div>
        )}
      </div>

      {/* Photo Thumbnails */}
      {signedPhotoUrls.length > 0 && (
        <div>
          <p className="font-mono text-[9px] text-halide/40 tracking-widest mb-2">PHOTOS</p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 max-h-64 overflow-y-auto">
            {signedPhotoUrls.map((url, i) => (
              <div key={i} className="relative group aspect-square">
                <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemovePhoto(i)}
                  className="absolute top-0.5 right-0.5 bg-noir/80 text-ivory p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={9} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Video Thumbnails */}
      {signedVideoUrls.length > 0 && (
        <div>
          <p className="font-mono text-[9px] text-halide/40 tracking-widest mb-2">VIDEOS</p>
          <div className="flex flex-wrap gap-2">
            {signedVideoUrls.map((url, i) => (
              <div key={i} className="relative group w-32">
                <video src={url} className="w-full aspect-video object-cover bg-noir" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Film size={16} className="text-ivory/60" />
                </div>
                <button
                  onClick={() => handleRemoveVideo(i)}
                  className="absolute top-0.5 right-0.5 bg-noir/80 text-ivory p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={9} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Send Button */}
      {totalCount > 0 && (
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