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
    const photoUris = gallery.photos || [];
    const videoUris = gallery.videos || [];

    // Generate signed URLs for photos in parallel batches
    const signedPhotoResults = await Promise.all(
      photoUris.map(uri =>
        base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 3600 })
          .then(r => r.signed_url)
          .catch(() => null)
      )
    );

    // Generate signed URLs for videos in parallel batches
    const signedVideoResults = await Promise.all(
      videoUris.map(uri =>
        base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 3600 })
          .then(r => r.signed_url)
          .catch(() => null)
      )
    );

    return Response.json({
      gallery_id: gallery.id,
      client_name: gallery.client_name,
      shoot_date: gallery.shoot_date,
      shoot_type: gallery.shoot_type,
      signed_urls: signedPhotoResults.filter(Boolean),
      signed_video_urls: signedVideoResults.filter(Boolean),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});