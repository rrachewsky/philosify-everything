// ============================================================
// EMAIL OUTBOX SERVICE - Transactional Outbox Pattern
// ============================================================
// This module handles writing emails to the outbox table and processing them.
// Benefits:
// - Emails are stored in DB before sending (never lost)
// - Automatic retries on failure
// - Idempotent (safe to call multiple times)
// - Decoupled from business logic

import { getSecret } from '../utils/secrets.js';
import { getPaymentReceiptTemplate, getZeroBalanceTemplate, getWelcomeTemplate } from './templates.js';

// ============================================================
// OUTBOX WRITER - Add emails to queue
// ============================================================

/**
 * Queue a payment receipt email
 */
export async function queuePaymentReceipt(supabase, data) {
  const { userId, email, credits, amount, newBalance, sessionId, lang = 'en' } = data;

  const template = getPaymentReceiptTemplate(
    { credits, amount, newBalance, sessionId },
    lang
  );

  return await insertEmailToOutbox(supabase, {
    user_id: userId,
    email_type: 'payment_receipt',
    recipient: email,
    subject: template.subject,
    html_body: template.html,
    payload: { credits, amount, newBalance, sessionId, lang },
  });
}

/**
 * Queue a zero balance alert email
 */
export async function queueZeroBalanceAlert(supabase, data) {
  const { userId, email, lang = 'en' } = data;

  const template = getZeroBalanceTemplate({ email }, lang);

  return await insertEmailToOutbox(supabase, {
    user_id: userId,
    email_type: 'zero_balance',
    recipient: email,
    subject: template.subject,
    html_body: template.html,
    payload: { lang },
  });
}

/**
 * Queue a welcome email (optional)
 */
export async function queueWelcomeEmail(supabase, data) {
  const { userId, email, freeCredits = 2, lang = 'en' } = data;

  const template = getWelcomeTemplate({ freeCredits }, lang);

  return await insertEmailToOutbox(supabase, {
    user_id: userId,
    email_type: 'welcome',
    recipient: email,
    subject: template.subject,
    html_body: template.html,
    payload: { freeCredits, lang },
  });
}

/**
 * Insert email into outbox table
 */
async function insertEmailToOutbox(supabase, emailData) {
  try {
    const { data, error } = await supabase
      .from('email_queue')
      .insert({
        user_id: emailData.user_id,
        email_type: emailData.email_type,
        recipient: emailData.recipient,
        subject: emailData.subject,
        html_body: emailData.html_body,
        payload: emailData.payload || {},
        status: 'pending',
        attempts: 0,
        max_attempts: 3,
      })
      .select()
      .single();

    if (error) {
      console.error('[EmailOutbox] Failed to insert email:', error);
      return { success: false, error };
    }

    console.log('[EmailOutbox] Email queued:', {
      id: data.id,
      type: emailData.email_type,
      recipient: emailData.recipient,
    });

    return { success: true, id: data.id };
  } catch (err) {
    console.error('[EmailOutbox] Exception inserting email:', err);
    return { success: false, error: err.message };
  }
}

// ============================================================
// OUTBOX PROCESSOR - Send queued emails
// ============================================================

/**
 * Process pending emails (send via Resend)
 * Call this periodically (e.g., every minute via cron or on webhook)
 */
export async function processPendingEmails(env, supabase, limit = 10) {
  try {
    // Fetch pending emails
    const { data: pendingEmails, error: fetchError } = await supabase
      .from('email_queue')
      .select('*')
      .eq('status', 'pending')
      .lt('attempts', 3) // Don't retry if max attempts reached
      .order('created_at', { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error('[EmailProcessor] Failed to fetch pending emails:', fetchError);
      return { success: false, error: fetchError };
    }

    if (!pendingEmails || pendingEmails.length === 0) {
      return { success: true, processed: 0 };
    }

    console.log(`[EmailProcessor] Processing ${pendingEmails.length} emails`);

    let successCount = 0;
    let failCount = 0;

    // Process each email
    for (const email of pendingEmails) {
      const result = await sendEmailViaResend(env, email);

      if (result.success) {
        // Mark as sent
        await markEmailAsSent(supabase, email.id, result.emailId);
        successCount++;
      } else {
        // Mark as failed and increment attempts
        await markEmailAsFailed(supabase, email.id, result.error);
        failCount++;
      }
    }

    console.log(`[EmailProcessor] Completed: ${successCount} sent, ${failCount} failed`);

    return {
      success: true,
      processed: pendingEmails.length,
      sent: successCount,
      failed: failCount,
    };
  } catch (err) {
    console.error('[EmailProcessor] Exception processing emails:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Send email via Resend API
 */
async function sendEmailViaResend(env, email) {
  try {
    const RESEND_API_KEY = await getSecret(env.RESEND_API_KEY);

    if (!RESEND_API_KEY) {
      return { success: false, error: 'Resend API key not configured' };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Philosify <noreply@philosify.org>',
        to: [email.recipient],
        subject: email.subject,
        html: email.html_body,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('[Resend] API error:', result);
      return { success: false, error: result.message || 'Resend API error' };
    }

    console.log('[Resend] Email sent:', {
      emailId: result.id,
      outboxId: email.id,
      type: email.email_type,
    });

    return { success: true, emailId: result.id };
  } catch (err) {
    console.error('[Resend] Exception sending email:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Mark email as successfully sent
 */
async function markEmailAsSent(supabase, emailId, resendEmailId) {
  const { error } = await supabase
    .from('email_queue')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      resend_email_id: resendEmailId,
    })
    .eq('id', emailId);

  if (error) {
    console.error('[EmailOutbox] Failed to mark email as sent:', error);
  }
}

/**
 * Mark email as failed and increment attempts
 */
async function markEmailAsFailed(supabase, emailId, errorMessage) {
  const { error } = await supabase
    .from('email_queue')
    .update({
      status: 'failed',
      failed_at: new Date().toISOString(),
      last_error: errorMessage,
      attempts: supabase.sql`attempts + 1`,
    })
    .eq('id', emailId);

  if (error) {
    console.error('[EmailOutbox] Failed to mark email as failed:', error);
  }
}

// ============================================================
// MONITORING & UTILITIES
// ============================================================

/**
 * Get email statistics (for monitoring)
 */
export async function getEmailStats(supabase, days = 7) {
  try {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('email_queue')
      .select('email_type, status, attempts')
      .gte('created_at', since);

    if (error) {
      return { success: false, error };
    }

    // Calculate stats
    const stats = {
      total: data.length,
      pending: data.filter(e => e.status === 'pending').length,
      sent: data.filter(e => e.status === 'sent').length,
      failed: data.filter(e => e.status === 'failed').length,
      byType: {},
    };

    // Group by type
    data.forEach(email => {
      if (!stats.byType[email.email_type]) {
        stats.byType[email.email_type] = { total: 0, sent: 0, failed: 0 };
      }
      stats.byType[email.email_type].total++;
      if (email.status === 'sent') stats.byType[email.email_type].sent++;
      if (email.status === 'failed') stats.byType[email.email_type].failed++;
    });

    return { success: true, stats };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Retry failed emails (reset to pending if attempts < max_attempts)
 */
export async function retryFailedEmails(supabase) {
  try {
    // Only retry emails that failed > 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('email_queue')
      .update({
        status: 'pending',
        last_error: null,
      })
      .eq('status', 'failed')
      .lt('attempts', 3)
      .lt('failed_at', oneHourAgo)
      .select();

    if (error) {
      console.error('[EmailOutbox] Failed to retry emails:', error);
      return { success: false, error };
    }

    console.log(`[EmailOutbox] Retrying ${data.length} failed emails`);
    return { success: true, retried: data.length };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
