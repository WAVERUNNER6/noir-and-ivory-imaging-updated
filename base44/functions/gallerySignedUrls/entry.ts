import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { access_token } = await req.json();

    if (!access_token) {
      return Response.json({ error: 'Missing access token' }, { status: 400 });
    }

    // Find gallery by access token (public — no auth required)
    const galleries = await base44.asServiceRole.entities.Gallery.filter({ access_token });
    if (!galleries || galleries.length === 0) {
      return Response.json({ error: 'Gallery not found' }, { status: 404 });
    }

    const gallery = galleries[0];
    const photos = gallery.photos || [];

    // Generate signed URLs for each photo
    const signedUrls = await Promise.all(
      photos.map(async (fileUri) => {
        try {
          const result = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
            file_uri: fileUri,
            expires_in: 3600, // 1 hour
          });
          return result.signed_url;
        } catch {
          return null;
        }
      })
    );

    return Response.json({
      gallery: {
        client_name: gallery.client_name,
        shoot_date: gallery.shoot_date,
        shoot_type: gallery.shoot_type,
        photo_count: photos.length,
      },
      signed_urls: signedUrls.filter(Boolean),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});