// ============================================================
// SECURITY ALERTS & NOTIFICATIONS (email)
// ============================================================

import { getSecret } from './secrets.js';

const DEFAULT_ALERT_EMAIL = 'bob@philosify.org';
const ADMIN_EMAIL = 'bob@philosify.org';

function redact(s, max = 300) {
  const str = String(s || '');
  if (str.length <= max) return str;
  return str.slice(0, max) + '…';
}

async function shouldSendAlert(env, throttleKey, ttlSeconds = 300) {
  // Use KV for coarse throttling (avoid spam). If KV not configured, send once per request (not ideal).
  if (!env.PHILOSIFY_KV) return true;

  try {
    const existing = await env.PHILOSIFY_KV.get(throttleKey);
    if (existing) return false;

    // Cloudflare KV requires expirationTtl >= 60 seconds.
    const safeTtl = Math.max(60, Number(ttlSeconds) || 300);
    await env.PHILOSIFY_KV.put(throttleKey, '1', { expirationTtl: safeTtl });
    return true;
  } catch (e) {
    // Fail-open: throttling should never block critical notifications.
    console.warn('[Alerts] Throttle KV error (sending anyway):', e?.message || e);
    return true;
  }
}

export async function sendSecurityAlertEmail(env, details) {
  try {
    const resendApiKey = await getSecret(env.RESEND_API_KEY);
    if (!resendApiKey) return false;

    const to = (env.SECURITY_ALERT_EMAIL && String(env.SECURITY_ALERT_EMAIL).trim()) || DEFAULT_ALERT_EMAIL;

    const ip = details?.ip || 'unknown';
    const pathname = details?.pathname || '';
    const ua = details?.ua || '';
    const ray = details?.ray || '';
    const method = details?.method || '';
    const url = details?.url || '';

    // At most one security alert email per UTC day, regardless of IP/path.
    const day = new Date().toISOString().slice(0, 10);
    const throttleKey = `sec_alert:daily:${day}`;
    const okToSend = await shouldSendAlert(env, throttleKey, 86400);
    if (!okToSend) return false;

    const subject = `Philosify Security Alert: blocked probe (${ip})`;

    const text = [
      'Philosify Security Alert (Worker IDS)',
      '',
      `Time (UTC): ${new Date().toISOString()}`,
      `IP: ${ip}`,
      `CF-Ray: ${ray}`,
      `Method: ${method}`,
      `Path: ${pathname}`,
      `URL: ${url}`,
      `User-Agent: ${redact(ua, 500)}`,
      '',
      'Action: request was blocked with 404.',
    ].join('\n');

    const emailPayload = {
      from: 'Philosify Security <bob@philosify.org>',
      to: [to],
      subject,
      text,
      // keep HTML empty; deliverability is better with plain text for alerts
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    // best effort only
    return res.ok;
  } catch {
    return false;
  }
}

// ============================================================
// NEW ANALYSIS NOTIFICATION (admin)
// ============================================================

export async function sendNewAnalysisRequestEmail(env, details) {
  try {
    const resendApiKey = await getSecret(env.RESEND_API_KEY);
    if (!resendApiKey) {
      console.error('[NewAnalysisEmail] No Resend API key');
      return false;
    }

    const userEmail = details?.userEmail || 'unknown';
    const userId = details?.userId || 'unknown';
    const song = details?.song || 'unknown';
    const artist = details?.artist || 'unknown';
    const model = details?.model || 'unknown';
    const language = details?.language || 'unknown';
    const ip = details?.ip || 'unknown';
    const analysisId = details?.analysisId || null;

    // Avoid double-sends from retries/double-clicks (KV minimum TTL is 60s).
    const throttleKey = `analysis_email:${userEmail}:${song}:${artist}:${model}:${language}`;
    const okToSend = await shouldSendAlert(env, throttleKey, 60);
    if (!okToSend) {
      console.log('[NewAnalysisEmail] Throttled duplicate notification');
      return false;
    }

    const subject = '🎵 New Analysis Request';

    const text = [
      '🎵 New Analysis Request',
      `User: ${userEmail}`,
      userId !== 'unknown' ? `User ID: ${userId}` : null,
      ip !== 'unknown' ? `IP: ${ip}` : null,
      '',
      `Song: ${song}`,
      `Artist: ${artist}`,
      `Model: ${model}`,
      `Language: ${language}`,
      analysisId ? `Analysis ID: ${analysisId}` : null,
      '',
      `Time (UTC): ${new Date().toISOString()}`,
    ].filter(Boolean).join('\n');

    const emailPayload = {
      from: 'Philosify Notifications <bob@philosify.org>',
      to: [ADMIN_EMAIL],
      subject,
      text,
    };

    console.log('[NewAnalysisEmail] Sending admin notification', {
      userEmail,
      userId,
      song,
      artist,
      model,
      language,
      analysisId,
    });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => '');
      console.error('[NewAnalysisEmail] Resend error:', res.status, err);
    } else {
      const okText = await res.text().catch(() => '');
      console.log('[NewAnalysisEmail] Resend ok:', okText);
    }

    return res.ok;
  } catch (e) {
    console.error('[NewAnalysisEmail] Exception:', e?.message || e);
    return false;
  }
}

// ============================================================
// NEW SUBSCRIBER NOTIFICATION
// ============================================================

// ============================================================
// PAYMENT RECEIPT EMAIL (sent to payer)
// ============================================================

export async function sendPaymentReceiptEmail(env, { userEmail, credits, newBalance, sessionId, receiptUrl }) {
  try {
    const resendApiKey = await getSecret(env.RESEND_API_KEY);
    if (!resendApiKey) {
      console.error('[PaymentReceipt] No Resend API key');
      return false;
    }

    const timestamp = new Date().toISOString();
    const date = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const subject = `🎵 Philosify Receipt - ${credits} Credits Added`;

    const text = [
      'Philosify - Payment Receipt',
      '',
      `Date: ${date}`,
      `Credits Purchased: ${credits}`,
      `New Balance: ${newBalance} credits`,
      '',
      'Thank you for your purchase!',
      '',
      'Your credits are ready to use. Visit philosify.org to analyze your favorite songs.',
      '',
      receiptUrl ? `Stripe Receipt: ${receiptUrl}` : '',
      '',
      '---',
      'Philosify - Discover the philosophy in music',
      'https://philosify.org',
    ].filter(Boolean).join('\n');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #070708; font-family: -apple-system, 'Segoe UI', Roboto, Inter, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #070708; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #0d0d0f; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0d0d0f; padding: 32px 40px 20px; text-align: center; border-bottom: 1px solid rgba(255,255,255,0.06);">
              <img src="https://philosify.org/brand/philosify-logo-lockup.png" alt="Philosify" width="190" style="width: 190px; max-width: 72%; height: auto;" />
            </td>
          </tr>

          <!-- Accent line (cyan) -->
          <tr>
            <td style="height: 2px; background-color: #00f0ff; line-height: 2px; font-size: 0;">&nbsp;</td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 36px 40px 32px; background-color: #0d0d0f;">
              <h2 style="margin: 0 0 20px 0; color: #00f0ff; font-family: Michroma, 'Segoe UI', Arial, sans-serif; font-size: 19px; font-weight: normal; letter-spacing: 1px;">Payment Confirmed ✓</h2>
              
              <p style="margin: 0 0 25px 0; color: rgba(255,255,255,0.72); font-size: 15px; line-height: 1.7;">
                Thank you for your purchase! Your credits have been added to your account.
              </p>
              
              <!-- Receipt Box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #121216; border: 1px solid rgba(255,255,255,0.06); border-radius: 8px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 25px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
                          <span style="color: rgba(255,255,255,0.55); font-size: 14px;">Date</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: right;">
                          <span style="color: #ffffff; font-size: 14px; font-weight: bold;">${date}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08);">
                          <span style="color: rgba(255,255,255,0.55); font-size: 14px;">Credits Purchased</span>
                        </td>
                        <td style="padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.08); text-align: right;">
                          <span style="color: #00f0ff; font-size: 18px; font-weight: bold;">+${credits}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="color: rgba(255,255,255,0.55); font-size: 14px;">New Balance</span>
                        </td>
                        <td style="padding: 8px 0; text-align: right;">
                          <span style="color: #ffffff; font-size: 18px; font-weight: bold;">${newBalance} credits</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 10px 0 25px 0;">
                    <a href="https://philosify.org" style="display: inline-block; background-color: #00f0ff; color: #070708; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-size: 15px; font-weight: bold; letter-spacing: 0.5px;">
                      Start Analyzing →
                    </a>
                  </td>
                </tr>
              </table>
              
              ${receiptUrl ? `
              <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 13px; text-align: center;">
                <a href="${receiptUrl}" style="color: #00f0ff; text-decoration: none;">View Stripe Receipt →</a>
              </p>
              ` : ''}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #0b0b0d; padding: 25px 40px; border-top: 1px solid rgba(255,255,255,0.06);">
              <p style="margin: 0; color: rgba(255,255,255,0.4); font-size: 12px; text-align: center; line-height: 1.6;">
                Questions? Reply to this email or contact us at bob@philosify.org
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailPayload = {
      from: 'Philosify <bob@philosify.org>',
      to: [userEmail],
      subject,
      text,
      html,
      reply_to: 'bob@philosify.org',
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (res.ok) {
      console.log(`[PaymentReceipt] ✅ Receipt sent to: ${userEmail} (${credits} credits)`);
      return true;
    } else {
      const error = await res.text();
      console.error(`[PaymentReceipt] ❌ Failed: ${error}`);
      return false;
    }
  } catch (err) {
    console.error('[PaymentReceipt] Exception:', err.message);
    return false;
  }
}

export async function sendNewSubscriberEmail(env, userEmail) {
  try {
    const resendApiKey = await getSecret(env.RESEND_API_KEY);
    if (!resendApiKey) {
      console.error('[NewSubscriber] No Resend API key');
      return false;
    }

    const subject = `🎉 New Philosify Subscriber: ${userEmail}`;
    const timestamp = new Date().toISOString();

    const text = [
      'New Philosify Subscriber!',
      '',
      `Email: ${userEmail}`,
      `Time (UTC): ${timestamp}`,
      '',
      'This user just signed up and received 2 free credits.',
    ].join('\n');

    const html = `
      <div style="font-family: Georgia, serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #00c8c8; margin-bottom: 20px;">🎉 New Subscriber!</h2>
        <p style="font-size: 16px; margin-bottom: 10px;"><strong>Email:</strong> ${userEmail}</p>
        <p style="font-size: 14px; color: #666; margin-bottom: 10px;"><strong>Time (UTC):</strong> ${timestamp}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 14px; color: #888;">This user just signed up and received 2 free credits.</p>
      </div>
    `;

    const emailPayload = {
      from: 'Philosify <bob@philosify.org>',
      to: [ADMIN_EMAIL],
      subject,
      text,
      html,
    };

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    if (res.ok) {
      console.log(`[NewSubscriber] ✅ Notification sent for: ${userEmail}`);
      return true;
    } else {
      const error = await res.text();
      console.error(`[NewSubscriber] ❌ Failed: ${error}`);
      return false;
    }
  } catch (err) {
    console.error('[NewSubscriber] Exception:', err.message);
    return false;
  }
}
