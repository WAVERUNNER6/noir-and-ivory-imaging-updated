import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { access_token } = await req.json();

    if (!access_token) {
      return Response.json({ error: 'Missing access_token' }, { status: 400 });
    }

    const galleries = await base44.asServiceRole.entities.Gallery.filter({ access_token });
    if (!galleries || galleries.length === 0) {
      return Response.json({ error: 'Gallery not found' }, { status: 404 });
    }

    const gallery = galleries[0];

    // Check expiry
    if (gallery.expires_at && new Date(gallery.expires_at) < new Date()) {
      return Response.json({ error: 'Gallery link has expired', expired: true }, { status: 410 });
    }

    const photoUris = gallery.photos || [];
    const videoUris = gallery.videos || [];

    // Generate signed URLs for photos in parallel batches
    // Generate signed URLs sequentially to avoid timeouts on large galleries
    const signedPhotoResults = [];
    for (const uri of photoUris) {
      const result = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 43200 })
        .then(r => r.signed_url)
        .catch(() => null);
      signedPhotoResults.push(result);
    }

    const signedVideoResults = [];
    for (const uri of videoUris) {
      const result = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 43200 })
        .then(r => r.signed_url)
        .catch(() => null);
      signedVideoResults.push(result);
    }

    const validPhotos = signedPhotoResults.filter(Boolean);
    const failedCount = signedPhotoResults.length - validPhotos.length;

    return Response.json({
      gallery: {
        id: gallery.id,
        client_name: gallery.client_name,
        shoot_date: gallery.shoot_date,
        shoot_type: gallery.shoot_type,
        expires_at: gallery.expires_at || null,
        total_photos: photoUris.length,
        failed_count: failedCount,
      },
      signed_urls: validPhotos,
      signed_video_urls: signedVideoResults.filter(Boolean),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});