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

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { gallery_id, app_url } = await req.json();

    const galleries = await base44.asServiceRole.entities.Gallery.filter({ id: gallery_id });
    if (!galleries || galleries.length === 0) {
      return Response.json({ error: 'Gallery not found' }, { status: 404 });
    }
    const gallery = galleries[0];

    const galleryUrl = `${app_url}/gallery?token=${gallery.access_token}`;
    const shootTypeLabel = gallery.shoot_type === 'real_estate' ? 'Real Estate Photography' : 'Event Photography';

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');

    const htmlBody = `
      <div style="font-family: 'Georgia', serif; max-width: 580px; margin: 0 auto; color: #1a1a1a; background: #fff;">
        <div style="background: #0A0A0A; padding: 32px 40px;">
          <p style="color: #F9F7F5; font-size: 11px; letter-spacing: 4px; margin: 0 0 8px 0; text-transform: uppercase; font-family: monospace;">NOIR & IVORY IMAGING</p>
          <h1 style="color: #F9F7F5; font-size: 28px; margin: 0; font-weight: 300;">📷 Your Gallery is Ready</h1>
        </div>
        <div style="padding: 36px 40px; border: 1px solid #e8e8e8; border-top: none;">
          <p style="font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">Dear ${gallery.client_name},</p>
          <p style="font-size: 15px; line-height: 1.7; margin: 0 0 32px 0;">
            Your photos from your <strong>${shootTypeLabel}</strong> session on <strong>${gallery.shoot_date}</strong> are ready for viewing.
            Your private gallery contains <strong>${(gallery.photos || []).length} images</strong>, available exclusively for you.
          </p>
          <div style="text-align: center; margin: 36px 0;">
            <a href="${galleryUrl}" style="display: inline-block; background: #0A0A0A; color: #F9F7F5; padding: 16px 40px; font-family: monospace; font-size: 12px; letter-spacing: 3px; text-decoration: none; text-transform: uppercase;">
              VIEW YOUR GALLERY →
            </a>
          </div>
          <p style="font-size: 13px; color: #8E8E8E; line-height: 1.6; margin: 0 0 8px 0;">
            This is a private link — please do not share it. If you have any questions about your images, reply to this email.
          </p>
        </div>
        <div style="padding: 20px 40px; background: #f8f7f5;">
          <p style="font-family: monospace; font-size: 10px; letter-spacing: 2px; color: #8E8E8E; margin: 0; text-transform: uppercase;">© Noir & Ivory Imaging — All rights reserved</p>
        </div>
      </div>
    `;

    await graphRequest(accessToken, '/me/sendMail', {
      method: 'POST',
      body: JSON.stringify({
        message: {
          subject: 'Noir & Ivory Imaging — Your Photo Gallery is Ready',
          body: { contentType: 'HTML', content: htmlBody },
          toRecipients: [{ emailAddress: { address: gallery.client_email } }],
        },
        saveToSentItems: true,
      }),
    });

    // Mark as sent
    await base44.asServiceRole.entities.Gallery.update(gallery.id, { sent_at: new Date().toISOString() });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});