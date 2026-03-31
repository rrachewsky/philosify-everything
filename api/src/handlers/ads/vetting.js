// ============================================================
// ADS PLATFORM - AI VETTING
// ============================================================
// Auto-approve advertisers with score >= 80
// Queue for owner review if < 80

import { getSecret } from '../../utils/secrets.js';

/**
 * Vet an advertiser using AI
 * Returns { score: 0-100, reason: string }
 */
export async function vetAdvertiser(env, advertiser) {
  const { email, company_name, website } = advertiser;

  try {
    const openaiKey = await getSecret(env.OPENAI_API_KEY);

    const prompt = `You are a trust and safety reviewer for an advertising platform called Philosify (a music philosophy analysis app).

Evaluate this advertiser application and provide a trust score from 0-100:

Email: ${email}
Company Name: ${company_name}
Website: ${website || 'Not provided'}

Scoring criteria:
- Professional email domain (not free email like gmail/yahoo for business): +20
- Company name looks legitimate (not spammy, not explicit): +25
- Website provided and looks professional: +25
- No red flags (adult content, scams, illegal): +30

Deductions:
- Free email for business: -15
- Suspicious/spammy company name: -30
- No website: -10
- Adult/explicit content indicators: -50
- Scam/fraud indicators: -100

Respond in JSON format only:
{
  "score": <number 0-100>,
  "reason": "<brief explanation>"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error('[Ads Vetting] OpenAI error:', await response.text());
      // Default to manual review on AI failure
      return { score: 50, reason: 'AI vetting unavailable - queued for manual review' };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    // Parse JSON response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        score: Math.min(100, Math.max(0, parseInt(result.score, 10) || 50)),
        reason: result.reason || 'Vetting completed',
      };
    }

    return { score: 50, reason: 'Could not parse vetting result - queued for manual review' };
  } catch (err) {
    console.error('[Ads Vetting] Error:', err);
    return { score: 50, reason: 'Vetting error - queued for manual review' };
  }
}

/**
 * Manual vetting by owner
 */
export async function manualVet(supabase, advertiserId, approved, reason, ownerEmail) {
  const status = approved ? 'approved' : 'rejected';
  
  await supabase.from('ads.advertisers').update(
    {
      status,
      vetting_reason: reason,
      vetted_at: new Date().toISOString(),
      vetted_by: ownerEmail,
    },
    `id=eq.${advertiserId}`
  );

  return { success: true, status };
}
