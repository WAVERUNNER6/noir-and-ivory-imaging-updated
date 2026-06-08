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

function generateToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { booking_id, app_url, purpose } = await req.json();
    // purpose: "invoice" | "photo_selection" | "final_gallery"

    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    if (!bookings.length) return Response.json({ error: 'Booking not found' }, { status: 404 });
    const booking = bookings[0];

    // Ensure booking has a portal token
    let portalToken = booking.portal_token;
    if (!portalToken) {
      portalToken = generateToken();
      await base44.asServiceRole.entities.Booking.update(booking_id, { portal_token: portalToken });
    }

    const portalUrl = `${app_url}/portal?token=${portalToken}`;
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');

    const purposeLabels = {
      invoice: { subject: 'Please Sign Your Invoice', heading: '📄 Invoice Ready for Signature', body: `Please review and sign your invoice for your upcoming session. Click the button below to access your secure client portal.` },
      photo_selection: { subject: 'Choose Your Photos for Editing', heading: '📷 Your Photos Are Ready — Make Your Selection', body: `Your session photos are ready! Please visit your client portal to select the photos you'd like edited. You have a limited number of selections based on your package.` },
      final_gallery: { subject: 'Your Final Gallery is Ready', heading: '🎉 Your Edited Gallery is Ready', body: `Your edited photos are ready for viewing and download. Visit your private client portal to access your final gallery.` },
    };

    const label = purposeLabels[purpose] || purposeLabels.invoice;

    const htmlBody = `
      <div style="font-family: 'Georgia', serif; max-width: 580px; margin: 0 auto; color: #1a1a1a; background: #fff;">
        <div style="background: #0A0A0A; padding: 32px 40px;">
          <p style="color: #F9F7F5; font-size: 11px; letter-spacing: 4px; margin: 0 0 8px 0; text-transform: uppercase; font-family: monospace;">NOIR & IVORY IMAGING</p>
          <h1 style="color: #F9F7F5; font-size: 26px; margin: 0; font-weight: 300;">${label.heading}</h1>
        </div>
        <div style="padding: 36px 40px; border: 1px solid #e8e8e8; border-top: none;">
          <p style="font-size: 16px; line-height: 1.7; margin: 0 0 16px 0;">Dear ${booking.client_name},</p>
          <p style="font-size: 15px; line-height: 1.7; margin: 0 0 32px 0;">${label.body}</p>
          <div style="text-align: center; margin: 36px 0;">
            <a href="${portalUrl}" style="display: inline-block; background: #0A0A0A; color: #F9F7F5; padding: 16px 40px; font-family: monospace; font-size: 12px; letter-spacing: 3px; text-decoration: none; text-transform: uppercase;">
              ACCESS YOUR PORTAL →
            </a>
          </div>
          <p style="font-size: 13px; color: #8E8E8E; line-height: 1.6; margin: 0;">This is a private link for your session only. Questions? Reply to this email.</p>
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
          subject: `Noir & Ivory Imaging — ${label.subject}`,
          body: { contentType: 'HTML', content: htmlBody },
          toRecipients: [{ emailAddress: { address: booking.client_email } }],
        },
        saveToSentItems: true,
      }),
    });

    await base44.asServiceRole.entities.EmailLog.create({
      booking_id: booking_id,
      client_email: booking.client_email,
      subject: label.subject,
      status: 'sent',
      sent_at: new Date().toISOString(),
    });

    return Response.json({ success: true, portal_url: portalUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});