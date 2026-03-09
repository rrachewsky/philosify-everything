// ============================================================
// EMAIL TEMPLATES - Multi-language HTML email templates
// ============================================================

// Payment receipt email template
export function getPaymentReceiptTemplate(data, lang = 'en') {
  const translations = {
    en: {
      subject: 'Payment Received - Credits Added',
      title: 'Thank You for Your Purchase!',
      purchased: 'Credits Purchased',
      amount: 'Amount Paid',
      newBalance: 'New Balance',
      credits: 'credits',
      transactionId: 'Transaction ID',
      returnButton: 'Return to Philosify',
      footer: 'Questions? Contact us at support@philosify.org',
    },
    pt: {
      subject: 'Pagamento Recebido - Créditos Adicionados',
      title: 'Obrigado pela sua compra!',
      purchased: 'Créditos Comprados',
      amount: 'Valor Pago',
      newBalance: 'Novo Saldo',
      credits: 'créditos',
      transactionId: 'ID da Transação',
      returnButton: 'Voltar ao Philosify',
      footer: 'Dúvidas? Entre em contato: support@philosify.org',
    },
    es: {
      subject: 'Pago Recibido - Créditos Añadidos',
      title: '¡Gracias por tu compra!',
      purchased: 'Créditos Comprados',
      amount: 'Monto Pagado',
      newBalance: 'Nuevo Saldo',
      credits: 'créditos',
      transactionId: 'ID de Transacción',
      returnButton: 'Volver a Philosify',
      footer: '¿Preguntas? Contáctanos: support@philosify.org',
    },
    fr: {
      subject: 'Paiement Reçu - Crédits Ajoutés',
      title: 'Merci pour votre achat!',
      purchased: 'Crédits Achetés',
      amount: 'Montant Payé',
      newBalance: 'Nouveau Solde',
      credits: 'crédits',
      transactionId: 'ID de Transaction',
      returnButton: 'Retour à Philosify',
      footer: 'Questions? Contactez-nous: support@philosify.org',
    },
    de: {
      subject: 'Zahlung Erhalten - Guthaben Hinzugefügt',
      title: 'Vielen Dank für Ihren Kauf!',
      purchased: 'Gekaufte Guthaben',
      amount: 'Bezahlter Betrag',
      newBalance: 'Neues Guthaben',
      credits: 'Guthaben',
      transactionId: 'Transaktions-ID',
      returnButton: 'Zurück zu Philosify',
      footer: 'Fragen? Kontaktieren Sie uns: support@philosify.org',
    },
  };

  const t = translations[lang] || translations.en;

  return {
    subject: t.subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #e2007a 0%, #9b0058 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .info-box { background: #f9f9f9; border-left: 4px solid #e2007a; padding: 20px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; margin: 12px 0; font-size: 16px; }
    .info-label { color: #666; }
    .info-value { font-weight: 600; color: #000; }
    .credits-badge { display: inline-block; background: #e2007a; color: white; padding: 8px 16px; border-radius: 20px; font-size: 18px; font-weight: 700; margin: 20px 0; }
    .button { display: inline-block; background: #e2007a; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #c00067; }
    .footer { text-align: center; color: #999; font-size: 14px; padding: 20px 30px; border-top: 1px solid #eee; }
    .transaction-id { font-family: monospace; font-size: 12px; color: #666; margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✓ ${t.title}</h1>
    </div>
    <div class="content">
      <div class="info-box">
        <div class="info-row">
          <span class="info-label">${t.purchased}:</span>
          <span class="info-value">${data.credits} ${t.credits}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${t.amount}:</span>
          <span class="info-value">$${data.amount.toFixed(2)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">${t.newBalance}:</span>
          <span class="info-value">${data.newBalance} ${t.credits}</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="https://philosify.org" class="button">${t.returnButton}</a>
      </div>

      <div class="transaction-id">
        <strong>${t.transactionId}:</strong><br>${data.sessionId}
      </div>
    </div>
    <div class="footer">
      ${t.footer}
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

// Zero balance alert email template
export function getZeroBalanceTemplate(data, lang = 'en') {
  const translations = {
    en: {
      subject: 'Time to Refuel Your Philosify Credits!',
      title: 'You\'re Out of Credits',
      message: 'You\'ve used all your credits analyzing songs with Philosify.',
      currentBalance: 'Current Balance',
      credits: 'credits',
      readyForMore: 'Ready for more philosophical insights?',
      purchaseButton: 'Purchase Credits',
      pricing: 'Pricing',
      tier10: '10 credits',
      tier20: '20 credits',
      tier50: '50 credits',
      perCredit: 'per credit',
      footer: 'Continue exploring music through the lens of Objectivist philosophy.',
      unsubscribe: 'Unsubscribe from balance alerts',
    },
    pt: {
      subject: 'Hora de Recarregar seus Créditos Philosify!',
      title: 'Você Ficou Sem Créditos',
      message: 'Você usou todos os seus créditos analisando músicas com Philosify.',
      currentBalance: 'Saldo Atual',
      credits: 'créditos',
      readyForMore: 'Pronto para mais insights filosóficos?',
      purchaseButton: 'Comprar Créditos',
      pricing: 'Preços',
      tier10: '10 créditos',
      tier20: '20 créditos',
      tier50: '50 créditos',
      perCredit: 'por crédito',
      footer: 'Continue explorando música através da lente da filosofia Objetivista.',
      unsubscribe: 'Cancelar alertas de saldo',
    },
    es: {
      subject: '¡Hora de Recargar tus Créditos Philosify!',
      title: 'Te Quedaste Sin Créditos',
      message: 'Has usado todos tus créditos analizando canciones con Philosify.',
      currentBalance: 'Saldo Actual',
      credits: 'créditos',
      readyForMore: '¿Listo para más perspectivas filosóficas?',
      purchaseButton: 'Comprar Créditos',
      pricing: 'Precios',
      tier10: '10 créditos',
      tier20: '20 créditos',
      tier50: '50 créditos',
      perCredit: 'por crédito',
      footer: 'Continúa explorando música a través de la filosofía Objetivista.',
      unsubscribe: 'Cancelar alertas de saldo',
    },
  };

  const t = translations[lang] || translations.en;

  return {
    subject: t.subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #666 0%, #333 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .content { padding: 40px 30px; text-align: center; }
    .balance-display { font-size: 48px; font-weight: 700; color: #e2007a; margin: 20px 0; }
    .message { font-size: 16px; color: #666; margin: 20px 0; line-height: 1.6; }
    .button { display: inline-block; background: #e2007a; color: white; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 18px; margin: 30px 0; }
    .button:hover { background: #c00067; }
    .pricing-table { margin: 30px 0; }
    .pricing-row { display: flex; justify-content: space-between; align-items: center; padding: 16px; margin: 10px 0; background: #f9f9f9; border-radius: 6px; }
    .pricing-tier { font-weight: 600; color: #000; }
    .pricing-price { font-size: 18px; font-weight: 700; color: #e2007a; }
    .pricing-detail { font-size: 12px; color: #999; }
    .footer { text-align: center; color: #999; font-size: 14px; padding: 20px 30px; border-top: 1px solid #eee; }
    .unsubscribe { font-size: 12px; color: #999; margin-top: 20px; }
    .unsubscribe a { color: #999; text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ ${t.title}</h1>
    </div>
    <div class="content">
      <p class="message">${t.message}</p>

      <div>
        <div style="color: #666; font-size: 14px;">${t.currentBalance}</div>
        <div class="balance-display">0 ${t.credits}</div>
      </div>

      <p class="message"><strong>${t.readyForMore}</strong></p>

      <a href="https://philosify.org" class="button">${t.purchaseButton}</a>

      <div class="pricing-table">
        <h3>${t.pricing}:</h3>
        <div class="pricing-row">
          <span class="pricing-tier">${t.tier10}</span>
          <div>
            <div class="pricing-price">$6.00</div>
            <div class="pricing-detail">$0.60 ${t.perCredit}</div>
          </div>
        </div>
        <div class="pricing-row">
          <span class="pricing-tier">${t.tier20}</span>
          <div>
            <div class="pricing-price">$12.00</div>
            <div class="pricing-detail">$0.60 ${t.perCredit}</div>
          </div>
        </div>
        <div class="pricing-row">
          <span class="pricing-tier">${t.tier50}</span>
          <div>
            <div class="pricing-price">$30.00</div>
            <div class="pricing-detail">$0.60 ${t.perCredit}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="footer">
      <p>${t.footer}</p>
      <p class="unsubscribe">
        <a href="https://philosify.org/unsubscribe?email=${encodeURIComponent(data.email)}">${t.unsubscribe}</a>
      </p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}

// Welcome email template (optional, enhanced version)
export function getWelcomeTemplate(data, lang = 'en') {
  const translations = {
    en: {
      subject: 'Welcome to Philosify - Start Analyzing Music!',
      title: 'Welcome to Philosify!',
      message: 'We\'re excited to have you join us in exploring music through the lens of Objectivist philosophy.',
      freeCredits: 'You\'ve received',
      credits: 'free credits',
      toGetStarted: 'to get started!',
      howItWorks: 'How It Works',
      step1: 'Search for any song on Spotify',
      step2: 'Choose your preferred AI model',
      step3: 'Get a rigorous philosophical analysis',
      startButton: 'Start Analyzing',
      footer: 'Each analysis costs 1 credit. Purchase more anytime.',
    },
    pt: {
      subject: 'Bem-vindo ao Philosify - Comece a Analisar Música!',
      title: 'Bem-vindo ao Philosify!',
      message: 'Estamos empolgados em tê-lo conosco explorando música através da lente da filosofia Objetivista.',
      freeCredits: 'Você recebeu',
      credits: 'créditos grátis',
      toGetStarted: 'para começar!',
      howItWorks: 'Como Funciona',
      step1: 'Busque qualquer música no Spotify',
      step2: 'Escolha seu modelo de IA preferido',
      step3: 'Receba uma análise filosófica rigorosa',
      startButton: 'Começar a Analisar',
      footer: 'Cada análise custa 1 crédito. Compre mais a qualquer momento.',
    },
  };

  const t = translations[lang] || translations.en;

  return {
    subject: t.subject,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #e2007a 0%, #9b0058 100%); color: white; padding: 50px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 32px; font-weight: 700; }
    .content { padding: 40px 30px; text-align: center; }
    .message { font-size: 16px; color: #666; margin: 20px 0; line-height: 1.6; }
    .credits-badge { display: inline-block; background: #e8f5e9; color: #2e7d32; padding: 12px 24px; border-radius: 20px; font-size: 20px; font-weight: 700; margin: 20px 0; }
    .steps { text-align: left; margin: 30px auto; max-width: 400px; }
    .step { display: flex; align-items: start; margin: 20px 0; }
    .step-number { background: #e2007a; color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; margin-right: 16px; }
    .step-text { font-size: 16px; color: #333; padding-top: 4px; }
    .button { display: inline-block; background: #e2007a; color: white; text-decoration: none; padding: 16px 40px; border-radius: 6px; font-weight: 600; font-size: 18px; margin: 30px 0; }
    .button:hover { background: #c00067; }
    .footer { text-align: center; color: #999; font-size: 14px; padding: 20px 30px; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎵 ${t.title}</h1>
    </div>
    <div class="content">
      <p class="message">${t.message}</p>

      <div class="credits-badge">
        ${t.freeCredits} <strong>${data.freeCredits}</strong> ${t.credits} ${t.toGetStarted}
      </div>

      <h3 style="margin-top: 40px;">${t.howItWorks}</h3>
      <div class="steps">
        <div class="step">
          <div class="step-number">1</div>
          <div class="step-text">${t.step1}</div>
        </div>
        <div class="step">
          <div class="step-number">2</div>
          <div class="step-text">${t.step2}</div>
        </div>
        <div class="step">
          <div class="step-number">3</div>
          <div class="step-text">${t.step3}</div>
        </div>
      </div>

      <a href="https://philosify.org" class="button">${t.startButton}</a>
    </div>
    <div class="footer">
      ${t.footer}
    </div>
  </div>
</body>
</html>
    `.trim(),
  };
}
