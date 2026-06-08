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
    const { data } = await req.json();

    const booking = data;
    if (!booking?.client_email || !booking?.client_name) {
      return Response.json({ skipped: true, reason: 'Missing booking details' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');

    const isRealEstate = booking.shoot_type === 'real_estate';
    const shootTypeLabel = isRealEstate ? 'Real Estate Photography' : 'Event Photography';

    const htmlBody = `
      <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <div style="background: #0A0A0A; padding: 32px 40px; margin-bottom: 32px;">
          <p style="color: #F9F7F5; font-size: 11px; letter-spacing: 4px; margin: 0 0 8px 0; text-transform: uppercase; font-family: monospace;">NOIR & IVORY IMAGING</p>
          <h1 style="color: #F9F7F5; font-size: 24px; margin: 0; font-weight: 300;">⏳ NEW BOOKING REQUEST</h1>
        </div>

        <div style="padding: 0 40px; margin-bottom: 32px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr style="border-bottom: 1px solid #e8e8e8;">
              <td style="padding: 12px 0; color: #8E8E8E; font-weight: 600; width: 130px;">CLIENT NAME</td>
              <td style="padding: 12px 0; color: #1a1a1a;">${booking.client_name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e8e8e8;">
              <td style="padding: 12px 0; color: #8E8E8E; font-weight: 600;">EMAIL</td>
              <td style="padding: 12px 0; color: #1a1a1a;">${booking.client_email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e8e8e8;">
              <td style="padding: 12px 0; color: #8E8E8E; font-weight: 600;">PHONE</td>
              <td style="padding: 12px 0; color: #1a1a1a;">${booking.client_phone || '—'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e8e8e8;">
              <td style="padding: 12px 0; color: #8E8E8E; font-weight: 600;">TYPE</td>
              <td style="padding: 12px 0; color: #1a1a1a;">${shootTypeLabel}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e8e8e8;">
              <td style="padding: 12px 0; color: #8E8E8E; font-weight: 600;">DATE</td>
              <td style="padding: 12px 0; color: #1a1a1a;">${booking.shoot_date || 'Flexible'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e8e8e8;">
              <td style="padding: 12px 0; color: #8E8E8E; font-weight: 600;">TIME</td>
              <td style="padding: 12px 0; color: #1a1a1a;">${booking.shoot_time || 'Flexible'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e8e8e8;">
              <td style="padding: 12px 0; color: #8E8E8E; font-weight: 600;">LOCATION</td>
              <td style="padding: 12px 0; color: #1a1a1a;">${booking.location || 'TBD'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e8e8e8;">
              <td style="padding: 12px 0; color: #8E8E8E; font-weight: 600;">PACKAGE</td>
              <td style="padding: 12px 0; color: #1a1a1a;">${booking.package_request || 'Not specified'}</td>
            </tr>
            ${booking.details ? `
            <tr>
              <td style="padding: 12px 0; color: #8E8E8E; font-weight: 600;">DETAILS</td>
              <td style="padding: 12px 0; color: #1a1a1a;">${booking.details}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="padding: 24px 40px; background: #f8f7f5; text-align: center;">
          <p style="font-size: 13px; color: #1a1a1a; margin: 0;">Log in to the admin dashboard to confirm or decline this request.</p>
        </div>
      </div>
    `;

    await graphRequest(accessToken, '/me/sendMail', {
      method: 'POST',
      body: JSON.stringify({
        message: {
          subject: `⏳ New ${shootTypeLabel} Booking — ${booking.client_name}`,
          body: { contentType: 'HTML', content: htmlBody },
          toRecipients: [{ emailAddress: { address: 'noirandivoryimaging@outlook.com' } }],
        },
        saveToSentItems: true,
      }),
    });

    return Response.json({ success: true, notified: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});