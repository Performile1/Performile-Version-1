import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../lib/db';
import { applySecurityMiddleware } from '../middleware/security';

const pool = getPool();

type Nullable<T> = T | null | undefined;

interface MerchantRankingSettings {
  ranking_mode: 'dynamic' | 'static' | null;
  feature_flag: boolean | null;
  weighting_overrides: Record<string, unknown> | null;
}

interface FeatureFlagState {
  global_enabled: boolean;
  merchant_mode: 'dynamic' | 'static' | 'unknown';
  flag_source: 'environment' | 'database';
}

interface RankingCourier {
  courier_id: string;
  courier_name: string;
  company_name: string | null;
  logo_url: string | null;
  rank_position: number | null;
  final_score: number | null;
  trust_score: number | null;
  total_reviews: number | null;
  recent_reviews: number | null;
  on_time_rate: number | null;
  avg_delivery_days: number | null;
  selection_rate: number | null;
  total_displays: number | null;
  total_selections: number | null;
  position_performance: number | null;
  activity_level: number | null;
  recent_performance: number | null;
  eta_minutes: number | null;
  last_calculated: string | null;
  fallback_score_used?: boolean;
}

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 20;

function parseBoolean(value: Nullable<string>, defaultValue: boolean): boolean {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'enabled', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'disabled', 'off'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function normalizePostalCode(postalCode: string): { cleaned: string; area: string } {
  const cleaned = postalCode.replace(/\s+/g, '').toUpperCase();
  const area = cleaned.substring(0, 3) || 'ALL';
  return { cleaned, area };
}

async function fetchMerchantRankingSettings(merchantId: string): Promise<MerchantRankingSettings | null> {
  const query = `
    SELECT ranking_mode, feature_flag, weighting_overrides
    FROM merchant_ranking_settings
    WHERE merchant_id = $1
    LIMIT 1
  `;

  try {
    const result = await pool.query(query, [merchantId]);
    if (result.rows.length === 0) {
      return null;
    }

    return {
      ranking_mode: result.rows[0].ranking_mode ?? null,
      feature_flag: result.rows[0].feature_flag ?? null,
      weighting_overrides: result.rows[0].weighting_overrides ?? null,
    };
  } catch (error: any) {
    // Table may not exist yet – fail silently but log for observability.
    console.warn('[Rankings] Unable to fetch merchant ranking settings:', error?.message ?? error);
    return null;
  }
}

function buildFeatureFlagState(globalEnabled: boolean, merchantSettings: MerchantRankingSettings | null): FeatureFlagState {
  if (!merchantSettings) {
    return {
      global_enabled: globalEnabled,
      merchant_mode: 'unknown',
      flag_source: 'environment',
    };
  }

  return {
    global_enabled: globalEnabled,
    merchant_mode: merchantSettings.ranking_mode ?? 'unknown',
    flag_source: 'database',
  };
}

function mapRankingRow(row: any): RankingCourier {
  const parseNumber = (value: any): number | null => (value === null || value === undefined ? null : Number(value));

  return {
    courier_id: row.courier_id,
    courier_name: row.courier_name,
    company_name: row.company_name ?? null,
    logo_url: row.logo_url ?? null,
    rank_position: row.rank_position !== null ? Number(row.rank_position) : null,
    final_score: parseNumber(row.final_ranking_score),
    trust_score: parseNumber(row.trust_score),
    total_reviews: row.total_reviews !== undefined ? parseNumber(row.total_reviews) : null,
    recent_reviews: row.recent_reviews !== undefined ? parseNumber(row.recent_reviews) : null,
    on_time_rate: parseNumber(row.on_time_rate),
    avg_delivery_days: parseNumber(row.avg_delivery_days),
    selection_rate: parseNumber(row.selection_rate),
    total_displays: parseNumber(row.total_displays),
    total_selections: parseNumber(row.total_selections),
    position_performance: parseNumber(row.position_performance),
    activity_level: parseNumber(row.activity_level),
    recent_performance: parseNumber(row.recent_performance),
    eta_minutes: row.eta_minutes !== undefined ? parseNumber(row.eta_minutes) : null,
    last_calculated: row.last_calculated ? new Date(row.last_calculated).toISOString() : null,
    fallback_score_used: !!row.fallback_score_used,
  };
}

async function fetchDynamicRankings(
  postalArea: string,
  limit: number,
  merchantId: Nullable<string>
): Promise<RankingCourier[]> {
  const params: any[] = [postalArea, limit];
  const merchantFilter = merchantId
    ? `AND EXISTS (
        SELECT 1
        FROM merchant_courier_selections mcs
        WHERE mcs.courier_id = crs.courier_id
          AND mcs.merchant_id = $${params.length + 1}
          AND mcs.is_active = TRUE
      )`
    : '';

  if (merchantId) {
    params.push(merchantId);
  }

  const query = `
    WITH ranked AS (
      SELECT
        crs.courier_id,
        crs.postal_area,
        crs.rank_position,
        crs.final_ranking_score,
        crs.trust_score,
        crs.on_time_rate,
        crs.avg_delivery_days,
        crs.selection_rate,
        crs.total_displays,
        crs.total_selections,
        crs.position_performance,
        crs.activity_level,
        crs.recent_performance,
        crs.last_calculated,
        c.courier_name,
        c.company_name,
        c.logo_url,
        ts.total_reviews,
        ts.recent_reviews,
        COALESCE(crs.eta_minutes, ts.eta_minutes) AS eta_minutes,
        CASE WHEN crs.postal_area = $1 THEN 0 ELSE 1 END AS area_priority
      FROM courier_ranking_scores crs
      JOIN couriers c ON c.courier_id = crs.courier_id
      LEFT JOIN trustscorecache ts ON ts.courier_id = crs.courier_id
      WHERE crs.postal_area IN ($1, 'ALL')
        AND c.is_active = TRUE
        ${merchantFilter}
    )
    SELECT *
    FROM ranked
    ORDER BY area_priority ASC,
             rank_position ASC NULLS LAST,
             final_ranking_score DESC NULLS LAST
    LIMIT $2
  `;

  const result = await pool.query(query, params);
  return result.rows.map(mapRankingRow);
}

async function fetchFallbackRankings(
  postalArea: string,
  limit: number
): Promise<RankingCourier[]> {
  const query = `
    WITH courier_stats AS (
      SELECT
        c.courier_id,
        c.courier_name,
        c.company_name,
        c.logo_url,
        COALESCE(AVG(r.rating), 0) AS trust_score,
        COUNT(DISTINCT r.review_id) AS total_reviews,
        COUNT(DISTINCT CASE WHEN r.created_at > NOW() - INTERVAL '3 months' THEN r.review_id END) AS recent_reviews,
        COALESCE(
          AVG(EXTRACT(EPOCH FROM (o.delivered_at - o.created_at)) / 86400),
          0
        ) AS avg_delivery_days,
        COALESCE(
          (COUNT(CASE WHEN o.status = 'delivered' AND o.delivered_at <= o.estimated_delivery THEN 1 END)::float /
           NULLIF(COUNT(CASE WHEN o.status = 'delivered' THEN 1 END), 0)) * 100,
          0
        ) AS on_time_percentage
      FROM couriers c
      LEFT JOIN orders o ON c.courier_id = o.courier_id
      LEFT JOIN reviews r ON o.order_id = r.order_id
      WHERE
        c.is_active = TRUE
        AND (
          $1 = 'ALL'
          OR (o.postal_code IS NOT NULL AND o.postal_code LIKE $1 || '%')
        )
        AND o.created_at > NOW() - INTERVAL '6 months'
      GROUP BY c.courier_id, c.courier_name, c.company_name, c.logo_url
    )
    SELECT
      courier_id,
      courier_name,
      company_name,
      logo_url,
      trust_score,
      total_reviews,
      recent_reviews,
      AVG(avg_delivery_days) AS avg_delivery_days,
      AVG(on_time_percentage) AS on_time_percentage,
      (
        (trust_score / 5.0) * 0.5 +
        (on_time_percentage / 100.0) * 0.3 +
        (CASE WHEN recent_reviews > 0 THEN 0.2 ELSE 0 END)
      ) AS fallback_score
    FROM courier_stats
    WHERE total_reviews >= 5
      AND recent_reviews >= 1
    ORDER BY fallback_score DESC, trust_score DESC, total_reviews DESC
    LIMIT $2
  `;

  const result = await pool.query(query, [postalArea, limit]);
  return result.rows.map((row: any, index: number) => ({
    courier_id: row.courier_id,
    courier_name: row.courier_name,
    company_name: row.company_name ?? null,
    logo_url: row.logo_url ?? null,
    rank_position: index + 1,
    final_score: Number(row.fallback_score ?? 0),
    trust_score: Number(row.trust_score ?? 0),
    total_reviews: Number(row.total_reviews ?? 0),
    recent_reviews: Number(row.recent_reviews ?? 0),
    on_time_rate: Number(row.on_time_percentage ?? 0),
    avg_delivery_days: Number(row.avg_delivery_days ?? 0),
    selection_rate: null,
    total_displays: null,
    total_selections: null,
    position_performance: null,
    activity_level: null,
    recent_performance: null,
    eta_minutes: null,
    last_calculated: null,
    fallback_score_used: true,
  }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const security = applySecurityMiddleware(req, res, {
    requireAuth: false,
    rateLimit: 'default',
  });

  if (!security.success) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { postal_code, limit, merchant_id, role, include_history } = req.query;

  if (!postal_code || typeof postal_code !== 'string') {
    return res.status(400).json({
      error: 'Postal code is required',
      message: 'Please provide a valid postal_code parameter',
    });
  }

  const limitInt = Math.min(
    Math.max(Number.parseInt(Array.isArray(limit) ? limit[0] : (limit as string) ?? `${DEFAULT_LIMIT}`, 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  const { cleaned: normalizedPostalCode, area: postalArea } = normalizePostalCode(postal_code);
  const merchantId = typeof merchant_id === 'string' ? merchant_id : null;

  const globalFlag = parseBoolean(process.env.FEATURE_FLAG_DYNAMIC_RANKING, true);
  const merchantSettings = merchantId ? await fetchMerchantRankingSettings(merchantId) : null;
  const merchantAllowsDynamic = merchantSettings?.ranking_mode !== 'static' && merchantSettings?.feature_flag !== false;

  const featureFlag = buildFeatureFlagState(globalFlag, merchantSettings);

  const shouldUseDynamic = globalFlag && (merchantSettings ? merchantAllowsDynamic : true);

  try {
    let couriers: RankingCourier[] = [];
    let usedFallback = false;
    let fallbackReason: string | null = null;

    if (shouldUseDynamic) {
      couriers = await fetchDynamicRankings(postalArea, limitInt, merchantId);
    }

    if (!shouldUseDynamic || couriers.length === 0) {
      usedFallback = true;
      fallbackReason = shouldUseDynamic
        ? 'No dynamic ranking data available for the requested postal area.'
        : 'Dynamic ranking disabled by feature flag.';

      couriers = await fetchFallbackRankings(postalArea, limitInt);

      if (couriers.length === 0 && postalArea !== 'ALL') {
        // Try nationwide fallback once more.
        couriers = await fetchFallbackRankings('ALL', limitInt);
      }
    }

    return res.status(200).json({
      success: true,
      postal_code: normalizedPostalCode,
      postal_area: postalArea,
      role: role ?? null,
      feature_flag: {
        ...featureFlag,
        global_enabled: shouldUseDynamic,
      },
      couriers,
      total_found: couriers.length,
      is_local_data: !usedFallback,
      include_history: include_history === 'true',
      fallback_reason: fallbackReason,
    });
  } catch (error: any) {
    console.error('[Rankings] Failed to fetch courier rankings:', error);
    return res.status(500).json({
      error: 'Failed to fetch courier rankings',
      message: error?.message ?? 'Unexpected error',
    });
  }
}
