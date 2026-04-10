// ============================================================
// ADS PLATFORM - EMAIL NOTIFICATIONS
// ============================================================
// All transactional emails for the ads platform.
// Uses Resend API (same as main Philosify).
// ============================================================

import { getSecret } from '../../utils/secrets.js';

const FROM_EMAIL = 'Philosify Ads <ads@philosify.org>';
const ADS_URL = 'https://ads.philosify.org';
const ADMIN_EMAIL = 'admin@philosify.org';

/** SECURITY: HTML-escape all user-provided values interpolated into email templates */
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/** SECURITY: Strip newlines from email subject to prevent header injection */
function safeSubject(str) {
  return String(str || '').replace(/[\r\n]/g, ' ').substring(0, 200);
}

async function sendEmail(env, to, subject, html) {
  try {
    const resendKey = await getSecret(env.RESEND_API_KEY);
    if (!resendKey) {
      console.warn('[AdsEmail] RESEND_API_KEY not configured, skipping email');
      return false;
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      console.error(`[AdsEmail] Send failed (${res.status}):`, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[AdsEmail] Error:', err.message);
    return false;
  }
}

function wrapHtml(content) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0f;color:#e0e0e0;">
<div style="max-width:600px;margin:0 auto;padding:40px 20px;">
<div style="text-align:center;margin-bottom:30px;">
<h1 style="color:#c9a861;font-size:24px;margin:0;">Philosify Ads</h1>
</div>
<div style="background:#12121a;border:1px solid #1e1e2e;border-radius:12px;padding:30px;">
${content}
</div>
<div style="text-align:center;margin-top:30px;color:#666;font-size:12px;">
<p>Philosify Ads Platform &mdash; <a href="${ADS_URL}" style="color:#c9a861;">ads.philosify.org</a></p>
</div>
</div>
</body>
</html>`;
}

// ============================================================
// ADVERTISER LIFECYCLE
// ============================================================

/** Advertiser account approved */
export async function sendApprovalEmail(env, email, companyName) {
  return sendEmail(env, email, 'Your Philosify Ads account is approved',
    wrapHtml(`
      <h2 style="color:#c9a861;margin-top:0;">Welcome to Philosify Ads, ${esc(companyName)}!</h2>
      <p>Your advertiser account has been approved. You can now create campaigns and reach our engaged audience of philosophy enthusiasts.</p>
      <div style="text-align:center;margin:25px 0;">
        <a href="${ADS_URL}/app" style="display:inline-block;padding:12px 30px;background:#c9a861;color:#0a0a0f;text-decoration:none;border-radius:8px;font-weight:600;">Go to Dashboard</a>
      </div>
      <p style="color:#888;">Need help? Reply to this email and we'll assist you.</p>
    `)
  );
}

/** Advertiser account rejected */
export async function sendRejectionEmail(env, email, companyName, reason) {
  return sendEmail(env, email, 'Philosify Ads application update',
    wrapHtml(`
      <h2 style="color:#c9a861;margin-top:0;">Application Update</h2>
      <p>Hi ${esc(companyName)},</p>
      <p>After reviewing your application, we're unable to approve your advertiser account at this time.</p>
      ${reason ? `<p style="background:#1a1a2e;padding:15px;border-radius:8px;border-left:3px solid #c9a861;">${esc(reason)}</p>` : ''}
      <p>If you believe this is an error or would like to provide additional information, please reply to this email.</p>
    `)
  );
}

// ============================================================
// ORDER LIFECYCLE
// ============================================================

/** Payment confirmed — order is being processed */
export async function sendPaymentConfirmationEmail(env, email, orderName, amountCents) {
  const amount = (amountCents / 100).toFixed(2);
  return sendEmail(env, email, safeSubject(`Payment confirmed: ${orderName}`),
    wrapHtml(`
      <h2 style="color:#c9a861;margin-top:0;">Payment Confirmed</h2>
      <p>Your payment of <strong>$${amount}</strong> for <strong>${esc(orderName)}</strong> has been processed.</p>
      <p>Your campaign is now being prepared for delivery.</p>
      <div style="text-align:center;margin:25px 0;">
        <a href="${ADS_URL}/app/campaigns" style="display:inline-block;padding:12px 30px;background:#c9a861;color:#0a0a0f;text-decoration:none;border-radius:8px;font-weight:600;">View Campaign</a>
      </div>
    `)
  );
}

/** Campaign is now live */
export async function sendCampaignLiveEmail(env, email, orderName) {
  return sendEmail(env, email, safeSubject(`Campaign live: ${orderName}`),
    wrapHtml(`
      <h2 style="color:#c9a861;margin-top:0;">Your Campaign is Live!</h2>
      <p><strong>${esc(orderName)}</strong> is now being served to Philosify users.</p>
      <p>You can track impressions, clicks, and delivery progress from your dashboard.</p>
      <div style="text-align:center;margin:25px 0;">
        <a href="${ADS_URL}/app/campaigns" style="display:inline-block;padding:12px 30px;background:#c9a861;color:#0a0a0f;text-decoration:none;border-radius:8px;font-weight:600;">View Analytics</a>
      </div>
    `)
  );
}

/** Campaign delivery complete */
export async function sendCampaignCompleteEmail(env, email, orderName, impressions, clicks) {
  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
  return sendEmail(env, email, safeSubject(`Campaign complete: ${orderName}`),
    wrapHtml(`
      <h2 style="color:#c9a861;margin-top:0;">Campaign Complete</h2>
      <p><strong>${esc(orderName)}</strong> has delivered all ordered impressions.</p>
      <div style="background:#1a1a2e;padding:20px;border-radius:8px;margin:20px 0;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#888;">Impressions</td><td style="padding:8px 0;text-align:right;font-weight:600;">${impressions.toLocaleString()}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">Clicks</td><td style="padding:8px 0;text-align:right;font-weight:600;">${clicks}</td></tr>
          <tr><td style="padding:8px 0;color:#888;">CTR</td><td style="padding:8px 0;text-align:right;font-weight:600;">${ctr}%</td></tr>
        </table>
      </div>
      <p>Ready to launch another campaign?</p>
      <div style="text-align:center;margin:25px 0;">
        <a href="${ADS_URL}/app/new" style="display:inline-block;padding:12px 30px;background:#c9a861;color:#0a0a0f;text-decoration:none;border-radius:8px;font-weight:600;">Create New Campaign</a>
      </div>
    `)
  );
}

// ============================================================
// CREATIVE WORKFLOW
// ============================================================

/** Creative draft ready for advertiser review */
export async function sendCreativeReadyEmail(env, email, orderName) {
  return sendEmail(env, email, safeSubject(`Creative ready for review: ${orderName}`),
    wrapHtml(`
      <h2 style="color:#c9a861;margin-top:0;">Creative Draft Ready</h2>
      <p>Our team has prepared a creative draft for <strong>${esc(orderName)}</strong>.</p>
      <p>Please review it and approve or request changes.</p>
      <div style="text-align:center;margin:25px 0;">
        <a href="${ADS_URL}/app/campaigns" style="display:inline-block;padding:12px 30px;background:#c9a861;color:#0a0a0f;text-decoration:none;border-radius:8px;font-weight:600;">Review Creative</a>
      </div>
    `)
  );
}

// ============================================================
// BILLING
// ============================================================

/** Deposit/funding confirmation */
export async function sendDepositConfirmationEmail(env, email, amountCents) {
  const amount = (amountCents / 100).toFixed(2);
  return sendEmail(env, email, `Funds added: $${amount}`,
    wrapHtml(`
      <h2 style="color:#c9a861;margin-top:0;">Funds Added</h2>
      <p><strong>$${amount}</strong> has been added to your Philosify Ads account balance.</p>
      <div style="text-align:center;margin:25px 0;">
        <a href="${ADS_URL}/app/billing" style="display:inline-block;padding:12px 30px;background:#c9a861;color:#0a0a0f;text-decoration:none;border-radius:8px;font-weight:600;">View Balance</a>
      </div>
    `)
  );
}

/** Low balance warning (triggered when balance drops below threshold) */
export async function sendLowBalanceEmail(env, email, balanceCents) {
  const balance = (balanceCents / 100).toFixed(2);
  return sendEmail(env, email, 'Low balance warning',
    wrapHtml(`
      <h2 style="color:#c9a861;margin-top:0;">Low Balance</h2>
      <p>Your Philosify Ads account balance is <strong>$${balance}</strong>.</p>
      <p>Add funds to keep your campaigns running without interruption.</p>
      <div style="text-align:center;margin:25px 0;">
        <a href="${ADS_URL}/app/billing" style="display:inline-block;padding:12px 30px;background:#c9a861;color:#0a0a0f;text-decoration:none;border-radius:8px;font-weight:600;">Add Funds</a>
      </div>
    `)
  );
}

// ============================================================
// ADMIN NOTIFICATIONS
// ============================================================

/** New advertiser pending review */
export async function sendNewAdvertiserAdminEmail(env, companyName, email) {
  return sendEmail(env, ADMIN_EMAIL, safeSubject(`New advertiser pending: ${companyName}`),
    wrapHtml(`
      <h2 style="color:#c9a861;margin-top:0;">New Advertiser Application</h2>
      <p><strong>${esc(companyName)}</strong> (${esc(email)}) has applied for an advertiser account.</p>
      <p>The AI vetting score was below the auto-approval threshold. Manual review required.</p>
      <div style="text-align:center;margin:25px 0;">
        <a href="${ADS_URL}/admin" style="display:inline-block;padding:12px 30px;background:#c9a861;color:#0a0a0f;text-decoration:none;border-radius:8px;font-weight:600;">Review Application</a>
      </div>
    `)
  );
}

/** New creative request for admin to produce */
export async function sendCreativeRequestAdminEmail(env, companyName, orderName) {
  return sendEmail(env, ADMIN_EMAIL, safeSubject(`Creative request: ${orderName}`),
    wrapHtml(`
      <h2 style="color:#c9a861;margin-top:0;">New Creative Request</h2>
      <p><strong>${esc(companyName)}</strong> needs a creative produced for <strong>${esc(orderName)}</strong>.</p>
      <div style="text-align:center;margin:25px 0;">
        <a href="${ADS_URL}/admin" style="display:inline-block;padding:12px 30px;background:#c9a861;color:#0a0a0f;text-decoration:none;border-radius:8px;font-weight:600;">View Request</a>
      </div>
    `)
  );
}
