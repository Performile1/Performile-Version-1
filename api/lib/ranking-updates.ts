import type { SupabaseClient } from '@supabase/supabase-js';

type NullableString = string | null | undefined;

export function normalizePostalCode(postalCode?: NullableString): string | null {
  if (!postalCode) {
    return null;
  }

  const trimmed = postalCode.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.toUpperCase();
}

interface UpdateRankingOptions {
  courierIds: NullableString[];
  postalCode?: NullableString;
  context?: string;
}

export async function updateRankingScoresForCouriers(
  supabase: SupabaseClient,
  { courierIds, postalCode, context }: UpdateRankingOptions
): Promise<void> {
  const uniqueCourierIds = Array.from(
    new Set(
      courierIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
    )
  );

  if (uniqueCourierIds.length === 0) {
    return;
  }

  const normalizedPostalCode = normalizePostalCode(postalCode);

  for (const courierId of uniqueCourierIds) {
    const { error } = await supabase.rpc('update_courier_ranking_scores', {
      p_postal_code: normalizedPostalCode,
      p_courier_id: courierId,
    });

    if (error) {
      console.error('[Ranking] Failed to update scores', {
        courierId,
        postalCode: normalizedPostalCode,
        context,
        error,
      });
    }
  }
}
