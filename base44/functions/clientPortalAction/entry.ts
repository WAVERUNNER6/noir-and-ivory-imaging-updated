import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

async function graphRequest(accessToken, path, options = {}) {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Graph API error: ${res.status} ${await res.text()}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const PHOTO_LIMITS = {
  'Business Events \u2014 Silver':           50,
  'Business Events \u2014 Gold':             100,
  'Business Events \u2014 Platinum':         150,
  'Personal Events \u2014 Celebrations':     15,
  'Personal Events \u2014 Wedding':          50,
  'Real Estate \u2014 Limited Time Special': 25,
};

function getPhotoLimit(packageRequest) {
  return PHOTO_LIMITS[packageRequest] || 25;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { portal_token, action, data } = await req.json();
    // action: "upload_signed_invoice" | "submit_photo_selection"

    if (!portal_token) return Response.json({ error: 'Missing token' }, { status: 400 });

    const bookings = await base44.asServiceRole.entities.Booking.filter({ portal_token });
    if (!bookings.length) return Response.json({ error: 'Not found' }, { status: 404 });
    const booking = bookings[0];

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');

    if (action === 'upload_signed_invoice') {
      const { file_uri } = data;
      await base44.asServiceRole.entities.Booking.update(booking.id, {
        signed_invoice_url: file_uri,
        status: 'confirmed',
      });

      // Notify studio
      await graphRequest(accessToken, '/me/sendMail', {
        method: 'POST',
        body: JSON.stringify({
          message: {
            subject: `✅ Signed Invoice Received — ${booking.client_name}`,
            body: {
              contentType: 'HTML',
              content: `
                <div style="font-family: Georgia, serif; max-width: 560px; color: #1a1a1a;">
                  <div style="background: #0A0A0A; padding: 28px 36px;">
                    <p style="color: #F9F7F5; font-size: 11px; letter-spacing: 4px; margin: 0 0 6px; font-family: monospace; text-transform: uppercase;">NOIR & IVORY IMAGING</p>
                    <h1 style="color: #F9F7F5; font-size: 22px; margin: 0; font-weight: 300;">✅ Signed Invoice Received</h1>
                  </div>
                  <div style="padding: 28px 36px; border: 1px solid #e8e8e8; border-top: none;">
                    <p><strong>${booking.client_name}</strong> has uploaded their signed invoice.</p>
                    <p>Booking is now <strong>Confirmed</strong>. Log in to the admin dashboard to review.</p>
                    <table style="width:100%;font-size:13px;border-collapse:collapse;margin-top:16px;">
                      <tr><td style="color:#8E8E8E;padding:6px 0;width:120px;">Date</td><td>${booking.shoot_date}</td></tr>
                      <tr><td style="color:#8E8E8E;padding:6px 0;">Package</td><td>${booking.package_request || 'N/A'}</td></tr>
                      <tr><td style="color:#8E8E8E;padding:6px 0;">Email</td><td>${booking.client_email}</td></tr>
                    </table>
                  </div>
                </div>
              `,
            },
            toRecipients: [{ emailAddress: { address: 'studio@noirandivoryimaging.com' } }],
          },
          saveToSentItems: true,
        }),
      });

      return Response.json({ success: true, new_status: 'confirmed' });
    }

    if (action === 'submit_photo_selection') {
      const { gallery_id, selected_indices } = data;
      const limit = getPhotoLimit(booking.package_request);

      if (selected_indices.length > limit) {
        return Response.json({ error: `Selection exceeds limit of ${limit} photos` }, { status: 400 });
      }

      await base44.asServiceRole.entities.Gallery.update(gallery_id, {
        selected_photos: selected_indices,
        selection_submitted_at: new Date().toISOString(),
      });
      await base44.asServiceRole.entities.Booking.update(booking.id, { status: 'editing' });

      const selectedCount = selected_indices.length;

      // Notify studio
      await graphRequest(accessToken, '/me/sendMail', {
        method: 'POST',
        body: JSON.stringify({
          message: {
            subject: `📷 Photo Selection Received — ${booking.client_name} (${selectedCount} photos)`,
            body: {
              contentType: 'HTML',
              content: `
                <div style="font-family: Georgia, serif; max-width: 560px; color: #1a1a1a;">
                  <div style="background: #0A0A0A; padding: 28px 36px;">
                    <p style="color: #F9F7F5; font-size: 11px; letter-spacing: 4px; margin: 0 0 6px; font-family: monospace; text-transform: uppercase;">NOIR & IVORY IMAGING</p>
                    <h1 style="color: #F9F7F5; font-size: 22px; margin: 0; font-weight: 300;">📷 Photo Selection Submitted</h1>
                  </div>
                  <div style="padding: 28px 36px; border: 1px solid #e8e8e8; border-top: none;">
                    <p><strong>${booking.client_name}</strong> has selected <strong>${selectedCount} photo${selectedCount !== 1 ? 's' : ''}</strong> for editing.</p>
                    <p>Package limit: ${limit} photos. Log in to the admin dashboard to begin editing.</p>
                    <table style="width:100%;font-size:13px;border-collapse:collapse;margin-top:16px;">
                      <tr><td style="color:#8E8E8E;padding:6px 0;width:120px;">Date</td><td>${booking.shoot_date}</td></tr>
                      <tr><td style="color:#8E8E8E;padding:6px 0;">Package</td><td>${booking.package_request || 'N/A'}</td></tr>
                      <tr><td style="color:#8E8E8E;padding:6px 0;">Selected</td><td>${selectedCount} / ${limit}</td></tr>
                    </table>
                  </div>
                </div>
              `,
            },
            toRecipients: [{ emailAddress: { address: 'studio@noirandivoryimaging.com' } }],
          },
          saveToSentItems: true,
        }),
      });

      return Response.json({ success: true, new_status: 'editing' });
    }

    if (action === 'reset_photo_selection') {
      // Admin-initiated: reopen selection so client can pick again (keeps previous selections as pre-checked)
      const galleries = await base44.asServiceRole.entities.Gallery.filter({ booking_id: booking.id });
      if (!galleries.length) return Response.json({ error: 'Gallery not found' }, { status: 404 });
      await base44.asServiceRole.entities.Gallery.update(galleries[0].id, {
        selection_submitted_at: null,
      });
      await base44.asServiceRole.entities.Booking.update(booking.id, { status: 'selecting_photos' });
      return Response.json({ success: true });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});