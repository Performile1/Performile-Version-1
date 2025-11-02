import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Get postal code details
 * GET /api/postal-codes/11122?country=SE
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { postalCode } = req.query;
    const { country = 'SE' } = req.query;

    // Validate input
    if (!postalCode || typeof postalCode !== 'string') {
      return res.status(400).json({ error: 'Postal code is required' });
    }

    // Sanitize inputs
    const cleanPostalCode = postalCode.replace(/[^0-9]/g, '');
    const cleanCountry = typeof country === 'string' ? country.toUpperCase() : 'SE';

    // Get postal code details
    const { data: postalData, error: postalError } = await supabase
      .from('postal_codes')
      .select('*')
      .eq('postal_code', cleanPostalCode)
      .eq('country', cleanCountry)
      .single();

    if (postalError || !postalData) {
      return res.status(404).json({
        error: 'Postal code not found',
        postalCode: cleanPostalCode,
        country: cleanCountry
      });
    }

    // Get available couriers for this postal code
    const { data: couriers, error: couriersError } = await supabase
      .from('couriers')
      .select('courier_id, courier_name, service_types, logo_url, contact_email')
      .contains('coverage_countries', [cleanCountry])
      .eq('is_active', true)
      .limit(10);

    if (couriersError) {
      console.error('Couriers fetch error:', couriersError);
    }

    // Get nearest parcel shops (if coordinates available)
    let nearestParcelShops: any[] = [];
    if (postalData.latitude && postalData.longitude) {
      const { data: parcelShops, error: parcelShopsError } = await supabase
        .rpc('find_nearby_parcel_points', {
          user_lat: postalData.latitude,
          user_lon: postalData.longitude,
          max_distance_km: 5,
          max_results: 5
        });

      if (!parcelShopsError && parcelShops) {
        nearestParcelShops = parcelShops;
      }
    }

    // Return full details
    return res.status(200).json({
      postalCode: postalData.postal_code,
      city: postalData.city,
      region: postalData.region,
      country: postalData.country,
      latitude: postalData.latitude,
      longitude: postalData.longitude,
      deliveryAvailable: (couriers?.length || 0) > 0,
      couriers: couriers?.map(c => ({
        courierId: c.courier_id,
        courierName: c.courier_name,
        serviceTypes: c.service_types,
        logoUrl: c.logo_url
      })) || [],
      nearestParcelShops: nearestParcelShops.map((shop: any) => ({
        name: shop.name,
        distance: shop.distance_km,
        address: shop.address,
        city: shop.city,
        postalCode: shop.postal_code,
        latitude: shop.latitude,
        longitude: shop.longitude,
        facilityType: shop.facility_type
      }))
    });

  } catch (error) {
    console.error('Postal code details error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
