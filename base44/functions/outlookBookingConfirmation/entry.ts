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
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking } = await req.json();

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');

    const shootDate = booking.shoot_date;
    const shootTime = booking.shoot_time || '09:00 AM';

    // Parse date + time into ISO for calendar event
    const parseDateTime = (dateStr, timeStr) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      let hours = 9, minutes = 0;
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        hours = parseInt(match[1]);
        minutes = parseInt(match[2]);
        const period = match[3].toUpperCase();
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
      }
      return new Date(year, month - 1, day, hours, minutes).toISOString().slice(0, 19);
    };

    const startDT = parseDateTime(shootDate, shootTime);
    const endDT = parseDateTime(shootDate, shootTime);
    // Add 2 hours for end time
    const endDate = new Date(startDT);
    endDate.setHours(endDate.getHours() + 2);
    const endDTStr = endDate.toISOString().slice(0, 19);

    const shootTypeLabel = booking.shoot_type === 'real_estate' ? 'Real Estate Photography' : 'Event Photography';

    // 1. Create calendar event
    const calendarEvent = {
      subject: `📷 ${shootTypeLabel} — ${booking.client_name}`,
      body: {
        contentType: 'HTML',
        content: `
          <p><strong>Client:</strong> ${booking.client_name}</p>
          <p><strong>Email:</strong> ${booking.client_email}</p>
          ${booking.client_phone ? `<p><strong>Phone:</strong> ${booking.client_phone}</p>` : ''}
          <p><strong>Location:</strong> ${booking.location || 'TBD'}</p>
          <p><strong>Package:</strong> ${booking.package_request || 'Not specified'}</p>
          ${booking.details ? `<p><strong>Details:</strong> ${booking.details}</p>` : ''}
        `,
      },
      start: { dateTime: startDT, timeZone: 'Eastern Standard Time' },
      end: { dateTime: endDTStr, timeZone: 'Eastern Standard Time' },
      location: { displayName: booking.location || 'TBD' },
    };

    await graphRequest(accessToken, '/me/events', {
      method: 'POST',
      body: JSON.stringify(calendarEvent),
    });

    // 2. Send confirmation email to studio mailbox
    const emailBody = {
      message: {
        subject: `New Booking Request — ${shootTypeLabel} on ${shootDate}`,
        body: {
          contentType: 'HTML',
          content: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; color: #1a1a1a;">
              <h2 style="border-bottom: 2px solid #0a0a0a; padding-bottom: 12px;">New Booking Request</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #555; width: 140px;"><strong>Shoot Type</strong></td><td>${shootTypeLabel}</td></tr>
                <tr><td style="padding: 8px 0; color: #555;"><strong>Date</strong></td><td>${shootDate}</td></tr>
                <tr><td style="padding: 8px 0; color: #555;"><strong>Time</strong></td><td>${booking.shoot_time || 'Flexible'}</td></tr>
                <tr><td style="padding: 8px 0; color: #555;"><strong>Location</strong></td><td>${booking.location || 'TBD'}</td></tr>
                <tr><td style="padding: 8px 0; color: #555;"><strong>Package</strong></td><td>${booking.package_request || 'Not specified'}</td></tr>
                <tr><td style="padding: 8px 0; color: #555;"><strong>Name</strong></td><td>${booking.client_name}</td></tr>
                <tr><td style="padding: 8px 0; color: #555;"><strong>Email</strong></td><td><a href="mailto:${booking.client_email}">${booking.client_email}</a></td></tr>
                ${booking.client_phone ? `<tr><td style="padding: 8px 0; color: #555;"><strong>Phone</strong></td><td>${booking.client_phone}</td></tr>` : ''}
                ${booking.details ? `<tr><td style="padding: 8px 0; color: #555; vertical-align: top;"><strong>Details</strong></td><td>${booking.details}</td></tr>` : ''}
              </table>
              <p style="margin-top: 24px; color: #888; font-size: 13px;">Please respond within 24 hours to confirm the session.</p>
            </div>
          `,
        },
        toRecipients: [
          { emailAddress: { address: 'noirandivoryimaging@outlook.com' } },
        ],
      },
      saveToSentItems: true,
    };

    await graphRequest(accessToken, '/me/sendMail', {
      method: 'POST',
      body: JSON.stringify(emailBody),
    });

    return Response.json({ success: true, message: 'Email sent and calendar event created.' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});