# Email System (Archived)

**Status:** Code archived for future use
**Date Archived:** 2025-11-29
**Reason:** Over-engineered for current needs, Supabase is better platform for this

---

## What Was This?

This was a **Transactional Outbox Pattern** implementation for sending emails:
- Queue emails in `email_queue` table
- Background process sends via Resend API
- Automatic retries on failure
- Idempotent processing

**Files:**
- `emails/outbox.js` - Queue management & sending
- `emails/templates.js` - Email templates (payment receipts, welcome, etc.)

---

## Why Archived?

1. **Never Used:** 0 emails ever sent (table empty since creation)
2. **Over-Engineered:** Need background job/cron to process queue
3. **Better Alternative:** Supabase has built-in features for this

---

## Future Migration Path: Use Supabase

### **Option A: Database Triggers + Edge Functions**

```sql
-- Create trigger to auto-send emails
CREATE OR REPLACE FUNCTION send_email_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Call Supabase Edge Function
  PERFORM net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/send-email',
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.service_role_key')),
    body := jsonb_build_object(
      'email_type', NEW.email_type,
      'recipient', NEW.recipient,
      'subject', NEW.subject,
      'html_body', NEW.html_body
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_email_queued
  AFTER INSERT ON email_queue
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION send_email_on_insert();
```

**Edge Function (`send-email`):**
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  const { email_type, recipient, subject, html_body } = await req.json()

  // Send via Resend
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: 'Philosify <noreply@philosify.org>',
      to: recipient,
      subject: subject,
      html: html_body
    })
  })

  return new Response(JSON.stringify(await res.json()), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

---

### **Option B: Scheduled Edge Function (Cron)**

```typescript
// Deploy: supabase functions deploy process-email-queue
// Schedule: In Supabase Dashboard → Edge Functions → Cron Jobs
// Run every 1 minute

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get pending emails
  const { data: emails } = await supabase
    .from('email_queue')
    .select('*')
    .eq('status', 'pending')
    .lt('attempts', 3)
    .limit(10)

  // Send each email
  for (const email of emails || []) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Philosify <noreply@philosify.org>',
          to: email.recipient,
          subject: email.subject,
          html: email.html_body
        })
      })

      // Mark as sent
      await supabase
        .from('email_queue')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', email.id)
    } catch (err) {
      // Mark as failed
      await supabase
        .from('email_queue')
        .update({
          status: 'failed',
          attempts: email.attempts + 1,
          last_error: err.message
        })
        .eq('id', email.id)
    }
  }

  return new Response(JSON.stringify({ processed: emails?.length || 0 }))
})
```

---

### **Option C: pg_cron (PostgreSQL Native)**

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule email processing every minute
SELECT cron.schedule(
  'process-email-queue',
  '* * * * *', -- Every minute
  $$
  SELECT process_pending_emails();
  $$
);

-- Create processing function
CREATE OR REPLACE FUNCTION process_pending_emails()
RETURNS void AS $$
DECLARE
  email_record RECORD;
BEGIN
  FOR email_record IN
    SELECT * FROM email_queue
    WHERE status = 'pending'
    AND attempts < 3
    LIMIT 10
  LOOP
    -- Call Resend API via http extension
    -- Mark as sent/failed
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## Simplest Path: Just Use Stripe

**For payment receipts:**
1. Go to Stripe Dashboard → Settings → Emails
2. Enable "Successful payments" email
3. Done! Stripe sends professional receipts automatically

**For other emails (welcome, etc.):**
- Use Option A (trigger + edge function) when needed
- Or just send directly from Cloudflare Worker (no queue)

---

## Email Table Schema

The `email_queue` table is **still in the database** and ready to use:

```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Email details
  email_type VARCHAR(100) NOT NULL,
  recipient VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  html_body TEXT NOT NULL,
  payload JSONB,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  provider_message_id VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ
);
```

**To resume using it:** Just uncomment the archived code or implement Option A/B/C above.

---

## Email API Key

You'll need to add email service credentials to:
- Cloudflare Secrets Store (for Worker)
- Supabase Edge Function Secrets (for Supabase approach)

**Email Service Options:**
- **Resend API** - Get key from: https://resend.com/api-keys
- **Amazon SES** - AWS Simple Email Service (likely option for this project)

---

## Email Templates

The archived templates include:
- **Payment Receipt** - Sent after successful Stripe purchase
- **Welcome Email** - Sent on signup
- **Zero Balance Alert** - Sent when user runs out of credits

Templates support English & Portuguese.

See: `emails/templates.js`

---

## Decision: Which Option?

**For 2025:**
- **Stripe emails** - Let Stripe handle payment receipts (zero code)
- **No welcome email** - Keep it simple

**When you need custom emails:**
- **Use Supabase Edge Functions** (Option A or B)
- Database already has `email_queue` table
- Just deploy edge function and enable trigger/cron

---

**Questions?** Check Supabase docs:
- https://supabase.com/docs/guides/functions
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/database/extensions/pg_cron
