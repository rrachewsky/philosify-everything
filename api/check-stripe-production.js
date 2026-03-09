// Temporary endpoint to check Stripe mode in PRODUCTION
// Add this to your worker temporarily, then remove it

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // Only allow this check endpoint
    if (url.pathname === '/check-stripe-mode') {
      try {
        // Get the actual secret from Cloudflare Secrets Store
        const stripeKey = await env.STRIPE_SECRET_KEY.get();
        
        if (!stripeKey) {
          return new Response(JSON.stringify({
            status: 'ERROR',
            message: 'STRIPE_SECRET_KEY not found in Secrets Store'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        
        // Check first 10 characters (don't expose full key)
        const keyPrefix = stripeKey.substring(0, 10);
        const isLive = stripeKey.startsWith('sk_live_');
        const isTest = stripeKey.startsWith('sk_test_');
        
        return new Response(JSON.stringify({
          status: 'OK',
          mode: isLive ? 'LIVE' : (isTest ? 'TEST' : 'UNKNOWN'),
          keyPrefix: keyPrefix + '...',
          message: isLive 
            ? '✅ Stripe is in LIVE mode - real payments enabled'
            : '⚠️ Stripe is in TEST mode - only test payments'
        }, null, 2), {
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (error) {
        return new Response(JSON.stringify({
          status: 'ERROR',
          message: error.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response('Not Found', { status: 404 });
  }
};

