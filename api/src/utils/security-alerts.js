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

    const subject = 'New Analysis Request';

    const text = [
      'New Analysis Request',
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

// Localized strings for the customer payment receipt (18 languages).
const RECEIPT_I18N = {
  en: { title: 'Payment confirmed', body: 'Your credits have been added to your account.', date: 'Date', credits: 'Credits added', balance: 'New balance', unit: 'credits', cta: 'Start analyzing', receipt: 'View Stripe receipt', questions: 'Questions?', locale: 'en-US' },
  pt: { title: 'Pagamento confirmado', body: 'Seus créditos foram adicionados à sua conta.', date: 'Data', credits: 'Créditos adicionados', balance: 'Novo saldo', unit: 'créditos', cta: 'Começar a analisar', receipt: 'Ver recibo da Stripe', questions: 'Dúvidas?', locale: 'pt-BR' },
  es: { title: 'Pago confirmado', body: 'Tus créditos se han añadido a tu cuenta.', date: 'Fecha', credits: 'Créditos añadidos', balance: 'Nuevo saldo', unit: 'créditos', cta: 'Empezar a analizar', receipt: 'Ver recibo de Stripe', questions: '¿Preguntas?', locale: 'es-ES' },
  de: { title: 'Zahlung bestätigt', body: 'Deine Credits wurden deinem Konto gutgeschrieben.', date: 'Datum', credits: 'Gutgeschriebene Credits', balance: 'Neues Guthaben', unit: 'Credits', cta: 'Analyse starten', receipt: 'Stripe-Beleg ansehen', questions: 'Fragen?', locale: 'de-DE' },
  fr: { title: 'Paiement confirmé', body: 'Vos crédits ont été ajoutés à votre compte.', date: 'Date', credits: 'Crédits ajoutés', balance: 'Nouveau solde', unit: 'crédits', cta: "Commencer l'analyse", receipt: 'Voir le reçu Stripe', questions: 'Questions ?', locale: 'fr-FR' },
  it: { title: 'Pagamento confermato', body: 'I tuoi crediti sono stati aggiunti al tuo account.', date: 'Data', credits: 'Crediti aggiunti', balance: 'Nuovo saldo', unit: 'crediti', cta: 'Inizia ad analizzare', receipt: 'Vedi ricevuta Stripe', questions: 'Domande?', locale: 'it-IT' },
  ja: { title: 'お支払い完了', body: 'クレジットがアカウントに追加されました。', date: '日付', credits: '追加クレジット', balance: '新しい残高', unit: 'クレジット', cta: '分析を始める', receipt: 'Stripeの領収書を見る', questions: 'ご質問は？', locale: 'ja-JP' },
  ko: { title: '결제 완료', body: '크레딧이 계정에 추가되었습니다.', date: '날짜', credits: '추가된 크레딧', balance: '새 잔액', unit: '크레딧', cta: '분석 시작하기', receipt: 'Stripe 영수증 보기', questions: '문의 사항?', locale: 'ko-KR' },
  zh: { title: '支付成功', body: '积分已添加到您的账户。', date: '日期', credits: '已添加积分', balance: '新余额', unit: '积分', cta: '开始分析', receipt: '查看 Stripe 收据', questions: '有疑问？', locale: 'zh-CN' },
  ru: { title: 'Оплата подтверждена', body: 'Кредиты добавлены на ваш счёт.', date: 'Дата', credits: 'Добавлено кредитов', balance: 'Новый баланс', unit: 'кредитов', cta: 'Начать анализ', receipt: 'Посмотреть чек Stripe', questions: 'Вопросы?', locale: 'ru-RU' },
  ar: { title: 'تم تأكيد الدفع', body: 'تمت إضافة الأرصدة إلى حسابك.', date: 'التاريخ', credits: 'الأرصدة المضافة', balance: 'الرصيد الجديد', unit: 'رصيد', cta: 'ابدأ التحليل', receipt: 'عرض إيصال Stripe', questions: 'أسئلة؟', locale: 'ar' },
  he: { title: 'התשלום אושר', body: 'הקרדיטים נוספו לחשבונך.', date: 'תאריך', credits: 'קרדיטים שנוספו', balance: 'יתרה חדשה', unit: 'קרדיטים', cta: 'התחל לנתח', receipt: 'צפייה בקבלת Stripe', questions: 'שאלות?', locale: 'he-IL' },
  hi: { title: 'भुगतान की पुष्टि हुई', body: 'आपके क्रेडिट आपके खाते में जोड़ दिए गए हैं।', date: 'तारीख', credits: 'जोड़े गए क्रेडिट', balance: 'नया बैलेंस', unit: 'क्रेडिट', cta: 'विश्लेषण शुरू करें', receipt: 'Stripe रसीद देखें', questions: 'प्रश्न?', locale: 'hi-IN' },
  fa: { title: 'پرداخت تأیید شد', body: 'اعتبارها به حساب شما اضافه شد.', date: 'تاریخ', credits: 'اعتبار اضافه‌شده', balance: 'موجودی جدید', unit: 'اعتبار', cta: 'شروع تحلیل', receipt: 'مشاهده رسید Stripe', questions: 'سؤالی دارید؟', locale: 'fa-IR' },
  hu: { title: 'Fizetés megerősítve', body: 'A kreditek jóváírásra kerültek a fiókodban.', date: 'Dátum', credits: 'Jóváírt kreditek', balance: 'Új egyenleg', unit: 'kredit', cta: 'Elemzés indítása', receipt: 'Stripe-nyugta megtekintése', questions: 'Kérdés?', locale: 'hu-HU' },
  nl: { title: 'Betaling bevestigd', body: 'Je credits zijn aan je account toegevoegd.', date: 'Datum', credits: 'Toegevoegde credits', balance: 'Nieuw saldo', unit: 'credits', cta: 'Begin met analyseren', receipt: 'Stripe-bon bekijken', questions: 'Vragen?', locale: 'nl-NL' },
  pl: { title: 'Płatność potwierdzona', body: 'Twoje kredyty zostały dodane do konta.', date: 'Data', credits: 'Dodane kredyty', balance: 'Nowe saldo', unit: 'kredytów', cta: 'Zacznij analizować', receipt: 'Zobacz paragon Stripe', questions: 'Pytania?', locale: 'pl-PL' },
  tr: { title: 'Ödeme onaylandı', body: 'Krediler hesabına eklendi.', date: 'Tarih', credits: 'Eklenen krediler', balance: 'Yeni bakiye', unit: 'kredi', cta: 'Analize başla', receipt: 'Stripe makbuzunu gör', questions: 'Sorular?', locale: 'tr-TR' },
};

// Best-effort lookup of the payer's preferred language (profiles.preferred_language).
async function getReceiptLanguage(env, userId) {
  try {
    if (!userId) return 'en';
    const url = await getSecret(env.SUPABASE_URL);
    const key = await getSecret(env.SUPABASE_SERVICE_KEY);
    const res = await fetch(
      `${url}/rest/v1/profiles?user_id=eq.${encodeURIComponent(userId)}&select=preferred_language&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) return 'en';
    const rows = await res.json();
    const lang = rows && rows[0] && rows[0].preferred_language;
    return lang && RECEIPT_I18N[lang] ? lang : 'en';
  } catch {
    return 'en';
  }
}

export async function sendPaymentReceiptEmail(env, { userEmail, credits, newBalance, sessionId, receiptUrl, userId, language }) {
  try {
    const resendApiKey = await getSecret(env.RESEND_API_KEY);
    if (!resendApiKey) {
      console.error('[PaymentReceipt] No Resend API key');
      return false;
    }

    const lang = language && RECEIPT_I18N[language] ? language : await getReceiptLanguage(env, userId);
    const t = RECEIPT_I18N[lang] || RECEIPT_I18N.en;
    const rtl = lang === 'ar' || lang === 'he' || lang === 'fa';
    const startA = rtl ? 'right' : 'left';
    const endA = rtl ? 'left' : 'right';

    let date;
    try {
      date = new Date().toLocaleDateString(t.locale, { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    const subject = `Philosify — ${t.title}`;

    const text = [
      `Philosify — ${t.title}`,
      '',
      `${t.date}: ${date}`,
      `${t.credits}: +${credits}`,
      `${t.balance}: ${newBalance} ${t.unit}`,
      '',
      t.body,
      '',
      receiptUrl ? `${t.receipt}: ${receiptUrl}` : '',
      'https://philosify.org',
    ].filter(Boolean).join('\n');

    const cellBorder = 'border-bottom:1px solid rgba(255,255,255,0.08);';
    const html = `<!DOCTYPE html>
<html dir="${rtl ? 'rtl' : 'ltr'}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
  <!--[if gte mso 9]><xml><o:OfficeDocumentSettings><o:AllowPNG/><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#070708;color:#ffffff;font-family:-apple-system,'Segoe UI',Roboto,Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#070708" style="background-color:#070708;">
    <tr><td align="center" bgcolor="#070708" style="background-color:#070708;padding:48px 24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#070708" style="max-width:440px;background-color:#070708;">
        <tr><td align="center" bgcolor="#070708" style="background-color:#070708;padding:0 0 28px;">
          <img src="https://philosify.org/brand/philosify-logo-lockup-transparent.png" alt="Philosify" width="200" style="width:200px;max-width:64%;height:auto;display:block;border:0;" />
        </td></tr>
        <tr><td align="center" bgcolor="#070708" style="background-color:#070708;padding:0 0 12px;">
          <h1 style="margin:0;color:#ffffff;font-family:Michroma,'Segoe UI',Arial,sans-serif;font-size:16px;font-weight:normal;letter-spacing:0.5px;">${t.title}</h1>
        </td></tr>
        <tr><td align="center" bgcolor="#070708" style="background-color:#070708;padding:0 0 24px;">
          <p style="margin:0;color:rgba(255,255,255,0.62);font-size:15px;line-height:1.6;">${t.body}</p>
        </td></tr>
        <tr><td bgcolor="#070708" style="background-color:#070708;padding:0 0 26px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#070708" style="background-color:#070708;">
            <tr>
              <td align="${startA}" bgcolor="#070708" style="background-color:#070708;padding:7px 0;color:rgba(255,255,255,0.5);font-size:13px;${cellBorder}">${t.date}</td>
              <td align="${endA}" bgcolor="#070708" style="background-color:#070708;padding:7px 0;color:#ffffff;font-size:13px;font-weight:bold;${cellBorder}">${date}</td>
            </tr>
            <tr>
              <td align="${startA}" bgcolor="#070708" style="background-color:#070708;padding:7px 0;color:rgba(255,255,255,0.5);font-size:13px;${cellBorder}">${t.credits}</td>
              <td align="${endA}" bgcolor="#070708" style="background-color:#070708;padding:7px 0;color:#00f0ff;font-size:15px;font-weight:bold;${cellBorder}">+${credits}</td>
            </tr>
            <tr>
              <td align="${startA}" bgcolor="#070708" style="background-color:#070708;padding:7px 0;color:rgba(255,255,255,0.5);font-size:13px;">${t.balance}</td>
              <td align="${endA}" bgcolor="#070708" style="background-color:#070708;padding:7px 0;color:#ffffff;font-size:15px;font-weight:bold;">${newBalance} ${t.unit}</td>
            </tr>
          </table>
        </td></tr>
        <tr><td align="center" bgcolor="#070708" style="background-color:#070708;padding:0 0 ${receiptUrl ? '16px' : '0'};">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="https://philosify.org" style="height:46px;v-text-anchor:middle;width:230px;" arcsize="12%" strokecolor="#00f0ff" fillcolor="#070708"><w:anchorlock/><center style="color:#00f0ff;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:bold;letter-spacing:0.5px;">${t.cta}</center></v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="https://philosify.org" style="display:inline-block;border:1px solid #00f0ff;border-radius:6px;color:#00f0ff;font-family:'Segoe UI',Arial,sans-serif;font-size:14px;font-weight:600;letter-spacing:0.5px;padding:12px 38px;text-decoration:none;mso-hide:all;">${t.cta}</a>
          <!--<![endif]-->
        </td></tr>
        ${receiptUrl ? `<tr><td align="center" bgcolor="#070708" style="background-color:#070708;padding:0;">
          <a href="${receiptUrl}" style="color:rgba(255,255,255,0.5);font-size:12px;text-decoration:underline;">${t.receipt}</a>
        </td></tr>` : ''}
        <tr><td align="center" bgcolor="#070708" style="background-color:#070708;padding:20px 0 0;">
          <p style="margin:0;color:rgba(255,255,255,0.3);font-size:12px;line-height:1.6;">${t.questions} <a href="mailto:bob@philosify.org" style="color:rgba(255,255,255,0.45);text-decoration:none;">bob@philosify.org</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

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
      console.log(`[PaymentReceipt] Receipt sent to: ${userEmail} (${credits} credits, ${lang})`);
      return true;
    } else {
      const error = await res.text();
      console.error(`[PaymentReceipt] Failed: ${error}`);
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

    const subject = `New Philosify Subscriber: ${userEmail}`;
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
        <h2 style="color: #00c8c8; margin-bottom: 20px;">New Subscriber!</h2>
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
      console.log(`[NewSubscriber] Notification sent for: ${userEmail}`);
      return true;
    } else {
      const error = await res.text();
      console.error(`[NewSubscriber] Failed: ${error}`);
      return false;
    }
  } catch (err) {
    console.error('[NewSubscriber] Exception:', err.message);
    return false;
  }
}
