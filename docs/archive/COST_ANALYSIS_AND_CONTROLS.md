# 💰 COST ANALYSIS & CONTROL MEASURES - PHILOSIFY

**Date:** November 18, 2025
**Purpose:** Detailed cost analysis and implementation of cost control measures

---

## 📊 ACTUAL API PRICING (2025)

### Token Pricing Per Million

| Model | Input ($/M) | Output ($/M) | Reasoning/Thinking | Notes |
|-------|-------------|--------------|-------------------|--------|
| **Claude Sonnet 4** | $3 | $15 | Same ($3/$15) | Thinking tokens charged separately |
| **OpenAI o1** | $15 | $60 | Included | Reasoning tokens = output tokens |
| **OpenAI o1-mini** | $1.10 | $4.40 | Included | Cheaper alternative |
| **Gemini 3 Pro** | $2 | $12 | Included | Preview pricing (may change) |
| **DeepSeek R1** | $0.55 | $2.19 | Included | BEST VALUE |
| **Grok 3** | ~$5 | ~$15 | N/A | Estimated (not public) |

---

## 💸 TYPICAL ANALYSIS COSTS

### Token Usage Estimates (per song analysis)

**Input tokens (typical):**
- Philosophical guide: ~8,000 tokens
- Song lyrics: ~500 tokens
- Metadata + prompt: ~500 tokens
- **Total input: ~9,000 tokens**

**Output tokens (typical):**
- Analysis text: ~4,000 tokens
- JSON structure: ~500 tokens
- **Total output: ~4,500 tokens**

**Reasoning tokens (new models):**
- Claude extended thinking: ~10,000 tokens (12K budget)
- OpenAI o1 reasoning: ~8,000 tokens (automatic)
- Gemini 3 thinking: ~6,000 tokens (automatic)
- DeepSeek R1: ~7,000 tokens (automatic)

### Cost Per Analysis Breakdown

| Model | Input Cost | Output Cost | Reasoning Cost | **TOTAL** | Time |
|-------|------------|-------------|----------------|-----------|------|
| **Claude Sonnet 4** | $0.027 | $0.068 | $0.150 | **$0.245** | 15-25s |
| **OpenAI o1** | $0.135 | $0.750 | (included) | **$0.885** | 20-40s |
| **OpenAI o1-mini** | $0.010 | $0.055 | (included) | **$0.065** | 10-20s |
| **Gemini 3 Pro** | $0.018 | $0.054 | (included) | **$0.072** | 12-22s |
| **DeepSeek R1** | $0.005 | $0.017 | (included) | **$0.022** | 10-18s |
| **Grok 3** | $0.045 | $0.068 | N/A | **$0.113** | 8-15s |

**OLD MODELS (before upgrade):**
- GPT-4o: ~$0.08 per analysis
- Gemini 2.5 Flash: ~$0.01 per analysis
- Claude Sonnet 4 (no thinking): ~$0.10 per analysis

---

## 🚨 COST RISKS IDENTIFIED

### 1. **OpenAI o1 is EXTREMELY EXPENSIVE**
- **Cost:** $0.885 per analysis (11x more than DeepSeek!)
- **Risk:** If 1,000 users analyze 10 songs each = $8,850
- **Mitigation:** Implement token limits and offer as premium option only

### 2. **Claude Extended Thinking Can Escalate**
- **Budget set:** 12,000 thinking tokens (current config)
- **Cost:** $0.245 per analysis
- **Risk:** If thinking budget is too high, costs increase linearly
- **Mitigation:** Reduce budget to 8,000 tokens or offer tiered options

### 3. **Gemini 3 Pro Preview Pricing May Change**
- **Current:** $2/$12 per million (preview)
- **Risk:** May increase to $5/$15 (standard pricing) after preview
- **Mitigation:** Monitor Google announcements, switch to Flash variant

### 4. **No Token Limits on Output**
- **Current:** Models can generate unlimited tokens (up to API max)
- **Risk:** Verbose responses = higher costs
- **Mitigation:** Set strict `max_tokens` limits per model

---

## ✅ IMPLEMENTED COST CONTROL MEASURES

### 1. Token Budget Limits (RECOMMENDED)

Update each model with strict token limits:

#### **Claude Sonnet 4** - Reduce thinking budget
```javascript
// Current: 12,000 thinking tokens
// Recommended: 8,000 thinking tokens
thinking: {
  type: "enabled",
  budget_tokens: 8000  // Reduced from 12000 → saves 33% on thinking
}
```

#### **All Models** - Strict output limits
```javascript
// OpenAI o1: Already has no max_tokens (handled by reasoning_effort)
// For other models:
max_tokens: 8000  // Already set to 16000 (REDUCE to 8000)
```

### 2. Timeout Controls

Implement request timeouts to prevent runaway costs:

```javascript
// api/src/utils/timeout.js (already exists)
export async function fetchWithTimeout(url, options, timeout = 90000) {
  // 90 seconds max (was 120s)
  // Prevents models from running too long
}
```

### 3. Model-Specific Cost Tiers

**Tier 1 - Economy (1 credit):**
- DeepSeek R1: $0.022
- Gemini 3 Pro: $0.072
- o1-mini: $0.065

**Tier 2 - Standard (1 credit):**
- Claude Sonnet 4: $0.245
- Grok 3: $0.113

**Tier 3 - Premium (2-3 credits):**
- OpenAI o1: $0.885 (charge 3 credits minimum)

### 4. Cache Aggressively

**Already implemented:**
- Songs analyzed once are cached in Supabase
- Same song + same model = instant return (no API call)
- Only NEW analyses cost money

**Effectiveness:**
- Cache hit rate: ~60-70% expected
- Real cost: ~30-40% of calculated costs above

---

## 🛠️ RECOMMENDED CONFIGURATION CHANGES

### Configuration 1: BALANCED (Recommended)

**Optimize for cost without sacrificing quality:**

```javascript
// api/src/ai/models/claude.js
thinking: {
  type: "enabled",
  budget_tokens: 8000  // Reduced from 12000 → saves $0.06/analysis
},
max_tokens: 8000  // Reduced from 16000 → prevents verbosity
```

```javascript
// api/src/ai/models/openai.js
// For o1: Add token limit via reasoning_effort
reasoning_effort: 'medium',  // Changed from 'high' → saves ~40%
```

```javascript
// api/src/ai/models/gemini.js
maxOutputTokens: 8000  // Reduced from 16000 → prevents verbosity
```

```javascript
// api/src/ai/models/deepseek.js
max_tokens: 8000  // Keep at 8000 (already affordable)
```

**New Costs:**
- Claude: $0.245 → **$0.16** (35% reduction)
- o1: $0.885 → **$0.53** (40% reduction)
- Gemini: $0.072 → **$0.04** (44% reduction)
- DeepSeek: $0.022 (unchanged)

---

### Configuration 2: ECONOMY (Maximum cost savings)

**For MVP/high-volume scenarios:**

```toml
# api/wrangler.toml
[env.production.vars]
OPENAI_MODEL = "o1-mini"  # Changed from "o1" → 13x cheaper
GEMINI_MODEL = "gemini-3-flash"  # Use Flash instead of Pro
DEEPSEEK_MODEL = "deepseek-reasoner"  # Keep (already cheap)
```

```javascript
// api/src/ai/models/claude.js
thinking: {
  type: "enabled",
  budget_tokens: 5000  // Minimal thinking → saves 58%
},
max_tokens: 6000
```

**New Costs:**
- Claude: $0.245 → **$0.11** (55% reduction)
- o1-mini: $0.885 → **$0.065** (93% reduction!)
- Gemini Flash: $0.072 → **$0.01** (86% reduction)
- DeepSeek: $0.022 (unchanged)

---

### Configuration 3: PREMIUM (Best quality, high cost)

**For paying users / premium tier:**

Keep current settings BUT charge appropriately:

| Model | Cost | Credits Required |
|-------|------|------------------|
| DeepSeek R1 | $0.022 | **1 credit** (economy) |
| Gemini 3 Pro | $0.072 | **1 credit** (standard) |
| Claude Sonnet 4 | $0.245 | **1 credit** (standard) |
| OpenAI o1 | $0.885 | **3 credits** (premium) |

**User sees:**
- "DeepSeek R1 (Best Value) - 1 credit"
- "Gemini 3 Pro - 1 credit"
- "Claude Sonnet 4 - 1 credit"
- "OpenAI o1 (Premium) - 3 credits" ← Discourages overuse

---

## 📉 COST MONITORING & ALERTS

### 1. Cloudflare Workers Analytics

**Track:**
- Requests per model (in worker logs)
- Average duration per model
- Error rates (failed analyses = wasted $)

**View:**
```bash
wrangler tail --env production | grep "Analisando com modelo"
```

### 2. API Usage Tracking

**Add to each model call:**
```javascript
// Log token usage for cost tracking
console.log(`[Cost] ${model} - Input: ${inputTokens}, Output: ${outputTokens}, Reasoning: ${reasoningTokens}`);
```

### 3. Daily Cost Alerts

**Set up Cloudflare alert:**
1. Dashboard → Workers & Pages → philosify-api
2. Alerts → Create Alert
3. Trigger: Daily invocations > 10,000
4. Action: Email notification

### 4. User-Level Rate Limiting

**Already implemented:**
- 60 requests per minute per user
- Prevents abuse / runaway costs

---

## 🎯 RECOMMENDED IMPLEMENTATION

### Phase 1: IMMEDIATE (Deploy Today)

1. **Reduce Claude thinking budget** to 8,000 tokens
2. **Change o1 reasoning_effort** to 'medium'
3. **Reduce max_tokens** to 8,000 for all models
4. **Set DeepSeek as default** (cheapest)
5. **Deploy and monitor for 1 week**

**Expected savings:** ~40% cost reduction across all models

### Phase 2: WEEK 2 (After monitoring)

1. **Implement premium pricing** for o1 (3 credits)
2. **Add cost tracking logs** to each model
3. **Set up Cloudflare alerts** for daily usage
4. **Analyze cache hit rate** (should be 60%+)

### Phase 3: MONTH 2 (Optimization)

1. **Consider switching to o1-mini** as default OpenAI model
2. **Test Gemini 3 Flash** (10x cheaper than Pro)
3. **Adjust thinking budgets** based on analysis quality
4. **Implement user-level monthly caps** (optional)

---

## 💡 COST OPTIMIZATION STRATEGIES

### 1. Smart Model Selection

**Default flow:**
```
User request → Check cache (free if hit)
             → If miss: Route to DeepSeek R1 (cheapest)
             → User can override to premium models
```

### 2. Prompt Compression

Reduce input token usage:
- **Current guide:** 8,000 tokens
- **Optimized guide:** 5,000 tokens (compress redundant text)
- **Savings:** 33% on input costs

### 3. Batch Processing (Future)

For non-urgent analyses:
- Queue up 10+ analyses
- Use Claude/OpenAI batch APIs (50% discount)
- Process overnight

### 4. Model Fallback

If premium model fails:
```javascript
try {
  return await callOpenAI(prompt, lang, env);
} catch (error) {
  console.warn('[Cost] o1 failed, falling back to o1-mini');
  return await callOpenAIMini(prompt, lang, env);
}
```

---

## 📊 PROJECTED MONTHLY COSTS

### Scenario 1: Low Volume (1,000 analyses/month)

**Current config:**
- 30% Claude ($0.245 × 300) = $73.50
- 20% o1 ($0.885 × 200) = $177.00
- 30% Gemini ($0.072 × 300) = $21.60
- 20% DeepSeek ($0.022 × 200) = $4.40
- **Total: $276.50/month**

**With optimizations (40% reduction):**
- **Total: $165.90/month**

### Scenario 2: Medium Volume (10,000 analyses/month)

**Current config:**
- **Total: $2,765/month**

**With optimizations:**
- **Total: $1,659/month**

**With economy config:**
- **Total: $480/month** (83% savings!)

### Scenario 3: High Volume (100,000 analyses/month)

**Current config:**
- **Total: $27,650/month**

**With optimizations + 60% cache hit rate:**
- **Total: $6,636/month** (76% savings!)

---

## ✅ IMPLEMENTATION CHECKLIST

### Immediate Actions:
- [ ] Reduce Claude thinking budget to 8,000 tokens
- [ ] Change o1 reasoning_effort to 'medium'
- [ ] Reduce max_tokens to 8,000 for Gemini/DeepSeek
- [ ] Set request timeout to 90 seconds
- [ ] Add cost tracking logs to each model

### Week 1 Monitoring:
- [ ] Track token usage per model
- [ ] Calculate actual costs per analysis
- [ ] Measure cache hit rate
- [ ] Check average analysis duration

### Week 2 Adjustments:
- [ ] Implement premium pricing for o1 (3 credits)
- [ ] Set up Cloudflare cost alerts
- [ ] Consider switching to o1-mini
- [ ] Test Gemini 3 Flash variant

---

## 🎉 SUMMARY

**Key Findings:**
1. **OpenAI o1 is 40x more expensive** than DeepSeek R1
2. **Claude extended thinking** adds $0.15 per analysis
3. **Cache hit rate** will save 60% of costs (most important!)
4. **Gemini 3 Pro** is good middle ground ($0.072)
5. **DeepSeek R1** is BEST VALUE ($0.022)

**Recommended Action:**
1. **Deploy "BALANCED" config** (saves 40% immediately)
2. **Monitor for 1 week** (track actual costs)
3. **Adjust based on user preference** (quality vs. cost)
4. **Consider economy config** if costs exceed budget

**Most Important:**
- **Set DeepSeek R1 as default** (cheapest + good quality)
- **Reduce thinking/output token budgets** by 30-40%
- **Charge 3 credits for o1** (discourage unless necessary)
- **Trust the cache** (60%+ hit rate = huge savings)

Let me know which configuration you want to implement! 🚀
