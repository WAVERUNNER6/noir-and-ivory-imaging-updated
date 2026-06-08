import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { portal_token } = await req.json();

    if (!portal_token) return Response.json({ error: 'Missing token' }, { status: 400 });

    const bookings = await base44.asServiceRole.entities.Booking.filter({ portal_token });
    if (!bookings.length) return Response.json({ error: 'Not found' }, { status: 404 });

    const booking = bookings[0];

    // Get gallery if exists
    const galleries = await base44.asServiceRole.entities.Gallery.filter({ booking_id: booking.id });
    const gallery = galleries[0] || null;

    // Generate signed URLs for raw photos (for selection)
    let rawPhotoUrls = [];
    let editedPhotoUrls = [];
    let signedInvoiceUrl = null;

    if (gallery) {
      if ((gallery.photos || []).length > 0) {
        rawPhotoUrls = await Promise.all(
          (gallery.photos || []).map(uri =>
            base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 7200 })
              .then(r => r.signed_url).catch(() => null)
          )
        );
        rawPhotoUrls = rawPhotoUrls.filter(Boolean);
      }
      if ((gallery.edited_photos || []).length > 0) {
        editedPhotoUrls = await Promise.all(
          (gallery.edited_photos || []).map(uri =>
            base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: uri, expires_in: 7200 })
              .then(r => r.signed_url).catch(() => null)
          )
        );
        editedPhotoUrls = editedPhotoUrls.filter(Boolean);
      }
    }

    // Generate signed URL for signed invoice if exists
    if (booking.signed_invoice_url && booking.signed_invoice_url.startsWith('private://')) {
      signedInvoiceUrl = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({
        file_uri: booking.signed_invoice_url, expires_in: 3600
      }).then(r => r.signed_url).catch(() => null);
    } else if (booking.signed_invoice_url) {
      signedInvoiceUrl = booking.signed_invoice_url;
    }

    return Response.json({
      booking: {
        id: booking.id,
        client_name: booking.client_name,
        client_email: booking.client_email,
        shoot_date: booking.shoot_date,
        shoot_type: booking.shoot_type,
        package_request: booking.package_request,
        status: booking.status,
        invoice_url: booking.invoice_url || null,
        signed_invoice_url: signedInvoiceUrl,
      },
      gallery: gallery ? {
        id: gallery.id,
        phase: gallery.phase || 'raw',
        selected_photos: gallery.selected_photos || [],
        selection_submitted_at: gallery.selection_submitted_at,
        raw_photo_count: (gallery.photos || []).length,
        edited_photo_count: (gallery.edited_photos || []).length,
      } : null,
      raw_photo_urls: rawPhotoUrls,
      edited_photo_urls: editedPhotoUrls,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});