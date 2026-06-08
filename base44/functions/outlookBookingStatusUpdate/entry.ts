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

const STATUS_LABELS = {
  pending:   { label: 'Pending Review',  color: '#8E8E8E', emoji: '⏳' },
  confirmed: { label: 'Confirmed',       color: '#2E7D32', emoji: '✅' },
  completed: { label: 'Completed',       color: '#1565C0', emoji: '📷' },
  cancelled: { label: 'Cancelled',       color: '#C62828', emoji: '❌' },
};

function parseDateTime(dateStr, timeStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  let hours = 9, minutes = 0;
  const match = (timeStr || '').match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match) {
    hours = parseInt(match[1]);
    minutes = parseInt(match[2]);
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
  }
  return new Date(year, month - 1, day, hours, minutes).toISOString().slice(0, 19);
}

async function syncCalendarEvent(accessToken, booking, action) {
  const shootTypeLabel = booking.shoot_type === 'real_estate' ? 'Real Estate Photography' : 'Event Photography';
  const calendarSubject = `📷 ${shootTypeLabel} — ${booking.client_name}`;
  const dateStr = booking.shoot_date;

  // Fetch all events on that date and match by client name in subject (avoids emoji encoding issues in filter)
  const startOfDay = `${dateStr}T00:00:00`;
  const endOfDay = `${dateStr}T23:59:59`;
  const allEventsRes = await graphRequest(accessToken,
    `/me/calendarView?startDateTime=${startOfDay}&endDateTime=${endOfDay}&$select=id,subject,start`
  ).catch(() => null);

  const clientName = booking.client_name;
  const matchingEvents = (allEventsRes?.value || []).filter(e =>
    e.subject && e.subject.includes(clientName) && e.subject.includes(shootTypeLabel)
  );

  if (action === 'delete' || booking.status === 'cancelled' || booking.status === 'completed') {
    // Delete ALL matching calendar events for this booking
    await Promise.all(
      matchingEvents.map(e => graphRequest(accessToken, `/me/events/${e.id}`, { method: 'DELETE' }).catch(() => null))
    );
    return;
  }

  // For other status updates, remove any pending (⏳) events and keep/update the main one
  const pendingEvents = matchingEvents.filter(e => e.subject.includes('PENDING'));
  await Promise.all(
    pendingEvents.map(e => graphRequest(accessToken, `/me/events/${e.id}`, { method: 'DELETE' }).catch(() => null))
  );

  const existingEvent = matchingEvents.find(e => !e.subject.includes('PENDING'));

  const startDT = parseDateTime(dateStr, booking.shoot_time || '09:00 AM');
  const endDate = new Date(startDT);
  endDate.setHours(endDate.getHours() + 2);
  const endDT = endDate.toISOString().slice(0, 19);

  const statusInfo = STATUS_LABELS[booking.status] || { label: booking.status };

  const eventBody = {
    subject: calendarSubject,
    body: {
      contentType: 'HTML',
      content: `
        <p><strong>Status:</strong> ${statusInfo.label}</p>
        <p><strong>Client:</strong> ${booking.client_name}</p>
        <p><strong>Email:</strong> ${booking.client_email}</p>
        ${booking.client_phone ? `<p><strong>Phone:</strong> ${booking.client_phone}</p>` : ''}
        <p><strong>Location:</strong> ${booking.location || 'TBD'}</p>
        <p><strong>Package:</strong> ${booking.package_request || 'Not specified'}</p>
        ${booking.details ? `<p><strong>Details:</strong> ${booking.details}</p>` : ''}
      `,
    },
    start: { dateTime: startDT, timeZone: 'Pacific Standard Time' },
    end: { dateTime: endDT, timeZone: 'Pacific Standard Time' },
    location: { displayName: booking.location || 'TBD' },
    categories: booking.status === 'confirmed' ? ['Green category'] : [],
  };

  if (existingEvent) {
    await graphRequest(accessToken, `/me/events/${existingEvent.id}`, {
      method: 'PATCH',
      body: JSON.stringify(eventBody),
    });
  } else if (booking.status !== 'cancelled') {
    await graphRequest(accessToken, '/me/events', {
      method: 'POST',
      body: JSON.stringify(eventBody),
    });
  }
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();

    const { event, data, old_data } = payload;

    // Skip update if nothing relevant changed
    if (event.type === 'update' && old_data?.status === data?.status) {
      return Response.json({ skipped: true, reason: 'Status unchanged' });
    }

    const booking = data;
    if (!booking?.client_email) {
      return Response.json({ skipped: true, reason: 'No client email' });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('outlook');

    const statusInfo = STATUS_LABELS[booking.status] || { label: booking.status, color: '#8E8E8E', emoji: '📋' };
    const shootTypeLabel = booking.shoot_type === 'real_estate' ? 'Real Estate Photography' : 'Event Photography';
    const isNew = event.type === 'create';

    // Only send client email when: new booking (pending) OR status confirmed/completed/cancelled
    const shouldEmailClient = isNew || ['confirmed', 'completed', 'cancelled'].includes(booking.status);

    const subjectPrefix = isNew ? 'Booking Request Received' : `Booking ${statusInfo.label}`;

    let clientMessage = '';
    if (isNew) {
      clientMessage = `Thank you for submitting your booking request. We've received your details and will be in touch within 24 hours to confirm your session.`;
    } else if (booking.status === 'confirmed') {
      clientMessage = `Great news — your session has been <strong>confirmed</strong>! We're looking forward to working with you. Please reach out if you have any questions before your shoot.`;
    } else if (booking.status === 'completed') {
      clientMessage = `Thank you — your session is now marked as <strong>completed</strong>. Your images will be delivered via private online gallery. We appreciate your trust in Noir & Ivory Imaging.`;
    } else if (booking.status === 'cancelled') {
      clientMessage = `Your booking has been <strong>cancelled</strong>. If this was unexpected or you'd like to reschedule, please don't hesitate to contact us.`;
    }

    // Run calendar sync + email in parallel
    const tasks = [syncCalendarEvent(accessToken, booking, event.type)];

    if (shouldEmailClient && clientMessage) {
      const htmlBody = `
        <div style="font-family: 'Georgia', serif; max-width: 580px; margin: 0 auto; color: #1a1a1a; background: #fff;">
          <div style="background: #0A0A0A; padding: 32px 40px;">
            <p style="color: #F9F7F5; font-size: 11px; letter-spacing: 4px; margin: 0 0 8px 0; text-transform: uppercase; font-family: monospace;">NOIR & IVORY IMAGING</p>
            <h1 style="color: #F9F7F5; font-size: 28px; margin: 0; font-weight: 300;">${statusInfo.emoji} ${subjectPrefix}</h1>
          </div>
          <div style="padding: 36px 40px; border: 1px solid #e8e8e8; border-top: none;">
            <p style="font-size: 16px; line-height: 1.7; margin: 0 0 28px 0;">Dear ${booking.client_name},</p>
            <p style="font-size: 15px; line-height: 1.7; margin: 0 0 32px 0;">${clientMessage}</p>
            <div style="background: #f8f7f5; padding: 24px; margin-bottom: 32px;">
              <p style="font-family: monospace; font-size: 10px; letter-spacing: 3px; color: #8E8E8E; margin: 0 0 16px 0; text-transform: uppercase;">SESSION DETAILS</p>
              <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr><td style="padding: 6px 0; color: #8E8E8E; width: 130px;">Type</td><td style="color: #1a1a1a;">${shootTypeLabel}</td></tr>
                <tr><td style="padding: 6px 0; color: #8E8E8E;">Date</td><td style="color: #1a1a1a;">${booking.shoot_date || 'TBD'}</td></tr>
                <tr><td style="padding: 6px 0; color: #8E8E8E;">Time</td><td style="color: #1a1a1a;">${booking.shoot_time || 'Flexible'}</td></tr>
                <tr><td style="padding: 6px 0; color: #8E8E8E;">Location</td><td style="color: #1a1a1a;">${booking.location || 'TBD'}</td></tr>
                ${booking.package_request ? `<tr><td style="padding: 6px 0; color: #8E8E8E;">Package</td><td style="color: #1a1a1a;">${booking.package_request}</td></tr>` : ''}
                <tr><td style="padding: 6px 0; color: #8E8E8E;">Status</td><td style="color: ${statusInfo.color}; font-weight: 600;">${statusInfo.label}</td></tr>
              </table>
            </div>
            <p style="font-size: 14px; color: #8E8E8E; line-height: 1.6; margin: 0 0 8px 0;">Questions? Reply to this email or contact us directly.</p>
            <p style="font-size: 14px; color: #8E8E8E; margin: 0;">noirandivoryimaging@outlook.com</p>
          </div>
          <div style="padding: 20px 40px; background: #f8f7f5;">
            <p style="font-family: monospace; font-size: 10px; letter-spacing: 2px; color: #8E8E8E; margin: 0; text-transform: uppercase;">© Noir & Ivory Imaging — All rights reserved</p>
          </div>
        </div>
      `;

      tasks.push(graphRequest(accessToken, '/me/sendMail', {
        method: 'POST',
        body: JSON.stringify({
          message: {
            subject: `Noir & Ivory Imaging — ${subjectPrefix}`,
            body: { contentType: 'HTML', content: htmlBody },
            toRecipients: [{ emailAddress: { address: booking.client_email } }],
            ccRecipients: [{ emailAddress: { address: 'noirandivoryimaging@outlook.com' } }],
          },
          saveToSentItems: true,
        }),
      }));
    }

    await Promise.all(tasks);

    return Response.json({ success: true, notified: shouldEmailClient ? booking.client_email : null, status: booking.status, calendarSynced: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});