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

function getDateOffset(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

async function sendReminder(accessToken, fromAddress, booking, hoursAhead, base44) {
  const isRealEstate = booking.shoot_type === 'real_estate';
  const shootTypeLabel = isRealEstate ? 'Real Estate Photography' : 'Event Photography';
  const timeLabel = hoursAhead === 24 ? 'tomorrow' : 'in 2 days';
  const subjectLabel = hoursAhead === 24 ? 'Your Shoot is Tomorrow' : 'Your Shoot is in 2 Days';

  const htmlBody = `
    <div style="font-family: 'Georgia', serif; max-width: 580px; margin: 0 auto; color: #1a1a1a; background: #fff;">
      <div style="background: #0A0A0A; padding: 32px 40px;">
        <p style="color: #F9F7F5; font-size: 11px; letter-spacing: 4px; margin: 0 0 8px 0; text-transform: uppercase; font-family: monospace;">NOIR & IVORY IMAGING</p>
        <h1 style="color: #F9F7F5; font-size: 28px; margin: 0; font-weight: 300;">📅 ${subjectLabel}</h1>
      </div>
      <div style="padding: 36px 40px; border: 1px solid #e8e8e8; border-top: none;">
        <p style="font-size: 16px; line-height: 1.7; margin: 0 0 20px 0;">Dear ${booking.client_name},</p>
        <p style="font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
          This is a friendly reminder that your photography session is scheduled for <strong>${timeLabel}</strong>. We're looking forward to working with you!
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
        subject: `Noir & Ivory Imaging — ${subjectLabel}`,
        body: { contentType: 'HTML', content: htmlBody },
        from: { emailAddress: { address: fromAddress } },
        toRecipients: [{ emailAddress: { address: booking.client_email } }],
      },
      saveToSentItems: true,
    }),
  });

  await base44.asServiceRole.entities.EmailLog.create({
    booking_id: booking.id,
    client_email: booking.client_email,
    subject: subjectLabel,
    status: 'sent',
    sent_at: new Date().toISOString(),
  });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const date24h = getDateOffset(1); // tomorrow
    const date48h = getDateOffset(2); // day after tomorrow

    const ACTIVE_STATUSES = ['confirmed', 'selecting_photos'];

    // Fetch bookings for both target dates in parallel
    const [bookings24h, bookings48h] = await Promise.all([
      base44.asServiceRole.entities.Booking.filter({ shoot_date: date24h }),
      base44.asServiceRole.entities.Booking.filter({ shoot_date: date48h }),
    ]);

    const reminders24h = bookings24h.filter(b => ACTIVE_STATUSES.includes(b.status));
    const reminders48h = bookings48h.filter(b => ACTIVE_STATUSES.includes(b.status));

    if (reminders24h.length === 0 && reminders48h.length === 0) {
      return Response.json({ success: true, sent: 0, message: 'No upcoming shoots to remind' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');
    const me = await graphRequest(accessToken, '/me?$select=mail,userPrincipalName');
    const fromAddress = me.mail || me.userPrincipalName;

    const tasks = [
      ...reminders24h.map(b => sendReminder(accessToken, fromAddress, b, 24, base44)),
      ...reminders48h.map(b => sendReminder(accessToken, fromAddress, b, 48, base44)),
    ];

    await Promise.all(tasks);

    return Response.json({
      success: true,
      sent: tasks.length,
      reminders_24h: reminders24h.map(b => b.client_email),
      reminders_48h: reminders48h.map(b => b.client_email),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});