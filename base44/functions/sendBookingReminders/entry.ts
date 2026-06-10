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

function getTomorrowDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const tomorrow = getTomorrowDate();

    // Fetch all bookings shooting tomorrow that are confirmed or selecting_photos
    const bookings = await base44.asServiceRole.entities.Booking.filter({
      shoot_date: tomorrow,
    });

    const remindable = bookings.filter(b =>
      ['confirmed', 'selecting_photos'].includes(b.status)
    );

    if (remindable.length === 0) {
      return Response.json({ success: true, sent: 0, message: 'No shoots tomorrow' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');
    const me = await graphRequest(accessToken, '/me?$select=mail,userPrincipalName');
    const fromAddress = me.mail || me.userPrincipalName;

    const results = await Promise.all(remindable.map(async (booking) => {
      const isRealEstate = booking.shoot_type === 'real_estate';
      const shootTypeLabel = isRealEstate ? 'Real Estate Photography' : 'Event Photography';

      const htmlBody = `
        <div style="font-family: 'Georgia', serif; max-width: 580px; margin: 0 auto; color: #1a1a1a; background: #fff;">
          <div style="background: #0A0A0A; padding: 32px 40px;">
            <p style="color: #F9F7F5; font-size: 11px; letter-spacing: 4px; margin: 0 0 8px 0; text-transform: uppercase; font-family: monospace;">NOIR & IVORY IMAGING</p>
            <h1 style="color: #F9F7F5; font-size: 28px; margin: 0; font-weight: 300;">📅 Your Shoot is Tomorrow</h1>
          </div>
          <div style="padding: 36px 40px; border: 1px solid #e8e8e8; border-top: none;">
            <p style="font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">Dear ${booking.client_name},</p>
            <p style="font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
              This is a friendly reminder that your photography session is scheduled for <strong>tomorrow</strong>. We're looking forward to working with you!
            </p>
            <div style="background: #f8f7f5; padding: 24px; margin-bottom: 32px;">
              <p style="font-family: monospace; font-size: 10px; letter-spacing: 3px; color: #8E8E8E; margin: 0 0 16px 0; text-transform: uppercase;">SESSION DETAILS</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 6px 0; color: #8E8E8E; width: 130px;">Type</td><td style="color: #1a1a1a;">${shootTypeLabel}</td></tr>
                <tr><td style="padding: 6px 0; color: #8E8E8E;">Date</td><td style="color: #1a1a1a;"><strong>${booking.shoot_date}</strong></td></tr>
                <tr><td style="padding: 6px 0; color: #8E8E8E;">Time</td><td style="color: #1a1a1a;">${booking.shoot_time || 'Flexible'}${booking.shoot_end_time ? ` — ${booking.shoot_end_time}` : ''}</td></tr>
                <tr><td style="padding: 6px 0; color: #8E8E8E;">Location</td><td style="color: #1a1a1a;">${booking.location || 'TBD'}</td></tr>
                ${booking.package_request ? `<tr><td style="padding: 6px 0; color: #8E8E8E;">Package</td><td style="color: #1a1a1a;">${booking.package_request}</td></tr>` : ''}
              </table>
            </div>
            <p style="font-size: 14px; color: #8E8E8E; line-height: 1.6; margin: 0 0 8px 0;">
              If you have any last-minute questions or need to make changes, please contact us immediately.
            </p>
            <p style="font-size: 14px; color: #8E8E8E; margin: 0;">studio@noirandivoryimaging.com</p>
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
            subject: `Noir & Ivory Imaging — Your Shoot is Tomorrow`,
            body: { contentType: 'HTML', content: htmlBody },
            from: { emailAddress: { address: fromAddress } },
            toRecipients: [{ emailAddress: { address: booking.client_email } }],
          },
          saveToSentItems: true,
        }),
      });

      // Log it
      await base44.asServiceRole.entities.EmailLog.create({
        booking_id: booking.id,
        client_email: booking.client_email,
        subject: 'Your Shoot is Tomorrow',
        status: 'sent',
        sent_at: new Date().toISOString(),
      });

      return booking.client_email;
    }));

    return Response.json({ success: true, sent: results.length, clients: results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});