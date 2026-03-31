// ============================================================
// ADS PLATFORM - AUDIENCE TARGETING
// ============================================================
// Targeting options, reach estimation, and user matching
// ============================================================

import { getServiceSupabase } from '../../utils/supabase.js';
import { jsonResponse } from '../../utils/index.js';
import { getAdvertiserFromRequest } from './utils.js';

/**
 * GET /api/ads/targeting/options
 * Get all available targeting options grouped by category
 */
export async function handleGetTargetingOptions(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);

    const { data: options, error } = await supabase
      .from('ads.targeting_options')
      .select('category,option_key,option_label,estimated_users', {
        filter: 'is_active=eq.true',
        order: 'category.asc,option_label.asc',
      });

    if (error) {
      console.error('[Ads] Get targeting options error:', error);
      return jsonResponse({ error: 'Failed to load targeting options' }, 500, corsHeaders);
    }

    // Group by category
    const grouped = {};
    for (const opt of options || []) {
      if (!grouped[opt.category]) {
        grouped[opt.category] = {
          label: getCategoryLabel(opt.category),
          description: getCategoryDescription(opt.category),
          options: [],
        };
      }
      grouped[opt.category].options.push({
        key: opt.option_key,
        label: opt.option_label,
        estimatedUsers: opt.estimated_users,
      });
    }

    return jsonResponse({
      categories: grouped,
      // Provide structure info for UI
      structure: {
        genres: { type: 'multi_select', category: 'genre' },
        philosophies: { type: 'multi_select', category: 'philosophy' },
        languages: { type: 'multi_select', category: 'language' },
        engagement: { type: 'multi_select', category: 'engagement' },
        content_types: { type: 'multi_select', category: 'content' },
        countries: { type: 'multi_select', category: 'country' },
        regions: { type: 'multi_select', category: 'region' },
        us_states: { type: 'multi_select', category: 'us_state', parent: 'US' },
        br_states: { type: 'multi_select', category: 'br_state', parent: 'BR' },
      },
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Get targeting options error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/targeting/estimate
 * Estimate reach for targeting criteria
 * 
 * Body:
 * - targeting: object with targeting criteria
 */
export async function handleEstimateReach(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const body = await request.json();
    const { targeting } = body;

    if (!targeting) {
      return jsonResponse({ error: 'targeting is required' }, 400, corsHeaders);
    }

    // Get total non-premium users
    const { data: totalData } = await supabase
      .from('ads.user_profiles')
      .select('user_id', {
        filter: 'is_premium=eq.false',
        head: true,
        count: 'exact',
      });

    const totalUsers = totalData?.length || 0;

    // For complex targeting, we need to query matching users
    // This is a simplified version - in production, use the DB function
    let matchingUsers = totalUsers;
    let reachBreakdown = {};

    // Estimate based on targeting criteria
    if (targeting.genres && targeting.genres.length > 0) {
      const { data } = await supabase
        .from('ads.user_profiles')
        .select('user_id', {
          filter: `is_premium=eq.false&top_genres=ov.{${targeting.genres.join(',')}}`,
          head: true,
          count: 'exact',
        });
      const genreMatch = data?.length || 0;
      reachBreakdown.genres = genreMatch;
      matchingUsers = Math.min(matchingUsers, genreMatch);
    }

    if (targeting.countries && targeting.countries.length > 0) {
      const { data } = await supabase
        .from('ads.user_profiles')
        .select('user_id', {
          filter: `is_premium=eq.false&country_code=in.(${targeting.countries.join(',')})`,
          head: true,
          count: 'exact',
        });
      const countryMatch = data?.length || 0;
      reachBreakdown.countries = countryMatch;
      matchingUsers = Math.min(matchingUsers, countryMatch);
    }

    if (targeting.languages && targeting.languages.length > 0) {
      const { data } = await supabase
        .from('ads.user_profiles')
        .select('user_id', {
          filter: `is_premium=eq.false&language=in.(${targeting.languages.join(',')})`,
          head: true,
          count: 'exact',
        });
      const langMatch = data?.length || 0;
      reachBreakdown.languages = langMatch;
      matchingUsers = Math.min(matchingUsers, langMatch);
    }

    if (targeting.engagement && targeting.engagement.length > 0) {
      const { data } = await supabase
        .from('ads.user_profiles')
        .select('user_id', {
          filter: `is_premium=eq.false&engagement_level=in.(${targeting.engagement.join(',')})`,
          head: true,
          count: 'exact',
        });
      const engMatch = data?.length || 0;
      reachBreakdown.engagement = engMatch;
      matchingUsers = Math.min(matchingUsers, engMatch);
    }

    // Calculate reach percentage
    const reachPercentage = totalUsers > 0 
      ? Math.round((matchingUsers / totalUsers) * 100 * 10) / 10 
      : 0;

    // Estimate daily impressions based on engagement
    const estimatedDailyImpressions = Math.round(matchingUsers * 0.15); // ~15% DAU

    // Audience size category
    let audienceSize;
    if (matchingUsers < 1000) audienceSize = 'very_narrow';
    else if (matchingUsers < 5000) audienceSize = 'narrow';
    else if (matchingUsers < 20000) audienceSize = 'medium';
    else if (matchingUsers < 50000) audienceSize = 'broad';
    else audienceSize = 'very_broad';

    return jsonResponse({
      reach: {
        totalUsers,
        matchingUsers,
        reachPercentage,
        audienceSize,
        audienceSizeLabel: getAudienceSizeLabel(audienceSize),
        estimatedDailyImpressions,
        breakdown: reachBreakdown,
      },
      recommendations: getTargetingRecommendations(targeting, matchingUsers, totalUsers),
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Estimate reach error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * GET /api/ads/targeting/suggestions
 * Get targeting suggestions based on advertiser's industry/goals
 */
export async function handleGetSuggestions(request, env, corsHeaders) {
  try {
    const url = new URL(request.url);
    const industry = url.searchParams.get('industry');
    const goal = url.searchParams.get('goal');

    const suggestions = generateTargetingSuggestions(industry, goal);

    return jsonResponse({ suggestions }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Get suggestions error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * POST /api/ads/targeting/validate
 * Validate targeting criteria before creating order
 */
export async function handleValidateTargeting(request, env, corsHeaders) {
  try {
    const body = await request.json();
    const { targeting } = body;

    const errors = [];
    const warnings = [];

    // Validate each targeting category
    if (targeting.genres && !Array.isArray(targeting.genres)) {
      errors.push('genres must be an array');
    }

    if (targeting.countries && !Array.isArray(targeting.countries)) {
      errors.push('countries must be an array');
    }

    if (targeting.languages && !Array.isArray(targeting.languages)) {
      errors.push('languages must be an array');
    }

    // Check for overly narrow targeting
    const criteriaCount = Object.keys(targeting).filter(k => 
      Array.isArray(targeting[k]) && targeting[k].length > 0
    ).length;

    if (criteriaCount > 4) {
      warnings.push('Using many targeting criteria may result in very narrow reach');
    }

    // Check for conflicting targeting
    if (targeting.us_states?.length > 0 && !targeting.countries?.includes('US')) {
      warnings.push('US states targeting works best when combined with US country targeting');
    }

    if (targeting.br_states?.length > 0 && !targeting.countries?.includes('BR')) {
      warnings.push('Brazil states targeting works best when combined with BR country targeting');
    }

    return jsonResponse({
      valid: errors.length === 0,
      errors,
      warnings,
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Validate targeting error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getCategoryLabel(category) {
  const labels = {
    genre: 'Music Interests',
    philosophy: 'Philosophical Alignment',
    language: 'Language',
    engagement: 'Engagement Level',
    content: 'Content Preferences',
    country: 'Countries',
    region: 'Regions',
    us_state: 'US States',
    br_state: 'Brazil States',
  };
  return labels[category] || category;
}

function getCategoryDescription(category) {
  const descriptions = {
    genre: 'Target users based on the music genres they analyze most',
    philosophy: 'Reach users who resonate with specific philosophical schools',
    language: 'Target users by their preferred language',
    engagement: 'Reach users based on how actively they use Philosify',
    content: 'Target users based on the features they use most',
    country: 'Target users in specific countries',
    region: 'Target users in geographic regions',
    us_state: 'Target users in specific US states',
    br_state: 'Target users in specific Brazilian states',
  };
  return descriptions[category] || '';
}

function getAudienceSizeLabel(size) {
  const labels = {
    very_narrow: 'Very Narrow - May limit delivery',
    narrow: 'Narrow - Good for niche campaigns',
    medium: 'Medium - Balanced reach',
    broad: 'Broad - Good for awareness',
    very_broad: 'Very Broad - Maximum reach',
  };
  return labels[size] || size;
}

function getTargetingRecommendations(targeting, matching, total) {
  const recommendations = [];
  const reachPct = total > 0 ? (matching / total) * 100 : 0;

  if (reachPct < 5) {
    recommendations.push({
      type: 'warning',
      message: 'Your targeting is very narrow. Consider broadening your criteria for better delivery.',
    });
  }

  if (reachPct > 80 && Object.keys(targeting).length === 0) {
    recommendations.push({
      type: 'suggestion',
      message: 'Consider adding targeting criteria to reach a more relevant audience.',
    });
  }

  if (targeting.genres?.length > 5) {
    recommendations.push({
      type: 'info',
      message: 'Selecting many genres creates broad targeting. Consider focusing on 2-3 core genres.',
    });
  }

  if (targeting.countries?.length === 1 && ['US', 'BR'].includes(targeting.countries[0])) {
    recommendations.push({
      type: 'suggestion',
      message: `Consider adding state-level targeting for ${targeting.countries[0]} for better precision.`,
    });
  }

  return recommendations;
}

function generateTargetingSuggestions(industry, goal) {
  const suggestions = {
    music: {
      reach: {
        label: 'Music Lovers - Broad Reach',
        targeting: {
          content_types: ['music'],
          engagement: ['regular', 'power_user'],
        },
      },
      engagement: {
        label: 'Music Enthusiasts - High Engagement',
        targeting: {
          content_types: ['music'],
          engagement: ['power_user'],
          genres: ['rock', 'pop', 'indie'],
        },
      },
    },
    books: {
      reach: {
        label: 'Book Readers - Broad',
        targeting: {
          content_types: ['books'],
        },
      },
      engagement: {
        label: 'Philosophy Enthusiasts',
        targeting: {
          content_types: ['books', 'colloquium'],
          philosophies: ['objectivism', 'stoicism'],
        },
      },
    },
    tech: {
      reach: {
        label: 'Tech-Savvy Users',
        targeting: {
          engagement: ['power_user'],
          languages: ['en'],
        },
      },
    },
    default: {
      reach: {
        label: 'Broad Audience',
        targeting: {},
      },
      engagement: {
        label: 'Active Users',
        targeting: {
          engagement: ['regular', 'power_user'],
        },
      },
    },
  };

  const industrySuggestions = suggestions[industry] || suggestions.default;
  return industrySuggestions[goal] || industrySuggestions.reach || suggestions.default.reach;
}

/**
 * Update user profile with geolocation data
 * Called when user makes a request (extracts from CF headers)
 */
export async function updateUserGeolocation(env, userId, request) {
  try {
    // Extract geo data from Cloudflare headers
    const country = request.cf?.country || request.headers.get('CF-IPCountry');
    const region = request.cf?.region || request.headers.get('CF-Region');
    const city = request.cf?.city;
    const timezone = request.cf?.timezone;

    if (!country) return;

    const supabase = await getServiceSupabase(env);

    // Determine geo_region
    const geoRegion = getGeoRegion(country);

    await supabase.from('ads.user_profiles').upsert({
      user_id: userId,
      country_code: country,
      country_name: getCountryName(country),
      region_code: region,
      city: city,
      timezone: timezone,
      geo_region: geoRegion,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
      ignoreDuplicates: false,
    });
  } catch (err) {
    console.error('[Ads] Update user geolocation error:', err);
  }
}

function getGeoRegion(countryCode) {
  const regions = {
    north_america: ['US', 'CA', 'MX'],
    south_america: ['BR', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'UY', 'PY', 'BO'],
    europe: ['GB', 'DE', 'FR', 'IT', 'ES', 'PT', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PL', 'IE', 'GR', 'CZ', 'RO', 'HU', 'UA', 'RU'],
    asia_pacific: ['JP', 'KR', 'CN', 'IN', 'AU', 'NZ', 'SG', 'MY', 'TH', 'PH', 'ID', 'VN', 'TW', 'HK'],
    middle_east: ['AE', 'SA', 'IL', 'TR', 'EG', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'IR', 'IQ'],
    africa: ['ZA', 'NG', 'KE', 'MA', 'GH', 'TZ', 'ET', 'DZ', 'TN'],
  };

  for (const [region, countries] of Object.entries(regions)) {
    if (countries.includes(countryCode)) {
      return region;
    }
  }
  return 'other';
}

function getCountryName(code) {
  const names = {
    US: 'United States', BR: 'Brazil', GB: 'United Kingdom', CA: 'Canada',
    AU: 'Australia', DE: 'Germany', FR: 'France', ES: 'Spain', MX: 'Mexico',
    PT: 'Portugal', JP: 'Japan', KR: 'South Korea', IT: 'Italy', NL: 'Netherlands',
    AR: 'Argentina', CO: 'Colombia', CL: 'Chile', PE: 'Peru', IN: 'India',
    PH: 'Philippines', ID: 'Indonesia', TH: 'Thailand', VN: 'Vietnam',
    MY: 'Malaysia', SG: 'Singapore', ZA: 'South Africa', NG: 'Nigeria',
    EG: 'Egypt', AE: 'United Arab Emirates', SA: 'Saudi Arabia', TR: 'Turkey',
    PL: 'Poland', SE: 'Sweden', NO: 'Norway', DK: 'Denmark', FI: 'Finland',
    BE: 'Belgium', AT: 'Austria', CH: 'Switzerland', IE: 'Ireland', NZ: 'New Zealand',
  };
  return names[code] || code;
}
