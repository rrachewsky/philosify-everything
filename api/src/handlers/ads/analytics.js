// ============================================================
// ADS PLATFORM - ANALYTICS & REPORTING
// ============================================================

import { getServiceSupabase } from '../../utils/supabase.js';
import { jsonResponse } from '../../utils/index.js';
import { getAdvertiserFromRequest } from './utils.js';

/**
 * GET /api/ads/analytics/overview?period=7d
 * Time-series analytics for an advertiser's campaigns
 */
export async function handleAnalyticsOverview(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '7d';

    // Calculate date range
    const days = period === '30d' ? 30 : period === '14d' ? 14 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get all orders for this advertiser
    const { data: orders } = await supabase
      .from('ads.ad_orders')
      .select('id,name,placement,duration,impressions_ordered,impressions_delivered,status,cpm_cents,total_cents,created_at', {
        filter: `advertiser_id=eq.${advertiser.id}`,
        order: 'created_at.desc',
      });

    if (!orders || orders.length === 0) {
      return jsonResponse({
        overview: { total_impressions: 0, total_clicks: 0, total_spent_cents: 0, ctr: 0 },
        daily: [],
        orders: [],
      }, 200, corsHeaders);
    }

    const orderIds = orders.map(o => o.id);

    // Get impressions in date range
    const { data: impressions } = await supabase
      .from('ads.ad_impressions')
      .select('id,order_id,clicked,cost_cents,created_at', {
        filter: `order_id=in.(${orderIds.join(',')})&created_at=gte.${startDateStr}`,
        order: 'created_at.asc',
      });

    const allImpressions = impressions || [];

    // Build daily breakdown
    const dailyMap = {};
    for (let d = 0; d < days; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      dailyMap[dateStr] = { date: dateStr, impressions: 0, clicks: 0, spent_cents: 0 };
    }

    let totalImpressions = 0;
    let totalClicks = 0;
    let totalSpentCents = 0;

    for (const imp of allImpressions) {
      const date = imp.created_at.split('T')[0];
      totalImpressions++;
      totalSpentCents += imp.cost_cents || 0;
      if (imp.clicked) totalClicks++;

      if (dailyMap[date]) {
        dailyMap[date].impressions++;
        dailyMap[date].spent_cents += imp.cost_cents || 0;
        if (imp.clicked) dailyMap[date].clicks++;
      }
    }

    const daily = Object.values(dailyMap)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({
        ...d,
        ctr: d.impressions > 0 ? Math.round((d.clicks / d.impressions) * 10000) / 100 : 0,
      }));

    // Per-order breakdown
    const orderStats = orders.map(order => {
      const orderImpressions = allImpressions.filter(i => i.order_id === order.id);
      const orderClicks = orderImpressions.filter(i => i.clicked).length;
      const orderSpent = orderImpressions.reduce((sum, i) => sum + (i.cost_cents || 0), 0);

      return {
        id: order.id,
        name: order.name,
        placement: order.placement,
        duration: order.duration,
        status: order.status,
        impressions_ordered: order.impressions_ordered,
        impressions_delivered: order.impressions_delivered,
        clicks: orderClicks,
        spent_cents: orderSpent,
        ctr: orderImpressions.length > 0
          ? Math.round((orderClicks / orderImpressions.length) * 10000) / 100
          : 0,
        delivery_pct: order.impressions_ordered > 0
          ? Math.round((order.impressions_delivered / order.impressions_ordered) * 100)
          : 0,
      };
    });

    return jsonResponse({
      overview: {
        total_impressions: totalImpressions,
        total_clicks: totalClicks,
        total_spent_cents: totalSpentCents,
        ctr: totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 10000) / 100 : 0,
        period,
        start_date: startDateStr,
      },
      daily,
      orders: orderStats,
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Analytics overview error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}

/**
 * GET /api/ads/analytics/export?period=30d&format=csv
 * Export analytics data
 */
export async function handleAnalyticsExport(request, env, corsHeaders) {
  try {
    const supabase = await getServiceSupabase(env);
    const advertiser = await getAdvertiserFromRequest(env, request, supabase);

    if (!advertiser) {
      return jsonResponse({ error: 'Not authenticated' }, 401, corsHeaders);
    }

    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30d';
    const format = url.searchParams.get('format') || 'csv';

    const days = period === '90d' ? 90 : period === '30d' ? 30 : period === '14d' ? 14 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Get orders
    const { data: orders } = await supabase
      .from('ads.ad_orders')
      .select('id,name,placement', { filter: `advertiser_id=eq.${advertiser.id}` });

    if (!orders || orders.length === 0) {
      if (format === 'csv') {
        return new Response('Date,Order,Placement,Impressions,Clicks,CTR,Spent\n', {
          headers: { ...corsHeaders, 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=philosify-ads-report.csv' },
        });
      }
      return jsonResponse({ rows: [] }, 200, corsHeaders);
    }

    const orderIds = orders.map(o => o.id);
    const orderMap = Object.fromEntries(orders.map(o => [o.id, o]));

    // Get all impressions
    const { data: impressions } = await supabase
      .from('ads.ad_impressions')
      .select('order_id,clicked,cost_cents,created_at', {
        filter: `order_id=in.(${orderIds.join(',')})&created_at=gte.${startDateStr}`,
        order: 'created_at.asc',
      });

    // Aggregate by date + order
    const rows = {};
    for (const imp of (impressions || [])) {
      const date = imp.created_at.split('T')[0];
      const key = `${date}|${imp.order_id}`;
      if (!rows[key]) {
        rows[key] = {
          date,
          order_id: imp.order_id,
          order_name: orderMap[imp.order_id]?.name || '',
          placement: orderMap[imp.order_id]?.placement || '',
          impressions: 0,
          clicks: 0,
          spent_cents: 0,
        };
      }
      rows[key].impressions++;
      if (imp.clicked) rows[key].clicks++;
      rows[key].spent_cents += imp.cost_cents || 0;
    }

    const sortedRows = Object.values(rows).sort((a, b) => a.date.localeCompare(b.date));

    if (format === 'csv') {
      let csv = 'Date,Order,Placement,Impressions,Clicks,CTR(%),Spent($)\n';
      for (const r of sortedRows) {
        const ctr = r.impressions > 0 ? (r.clicks / r.impressions * 100).toFixed(2) : '0.00';
        const spent = (r.spent_cents / 100).toFixed(2);
        csv += `${r.date},"${r.order_name}",${r.placement},${r.impressions},${r.clicks},${ctr},${spent}\n`;
      }
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=philosify-ads-${period}.csv`,
        },
      });
    }

    return jsonResponse({
      rows: sortedRows.map(r => ({
        ...r,
        ctr: r.impressions > 0 ? Math.round((r.clicks / r.impressions) * 10000) / 100 : 0,
      })),
    }, 200, corsHeaders);
  } catch (err) {
    console.error('[Ads] Analytics export error:', err);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
}
