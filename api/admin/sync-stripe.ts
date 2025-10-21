/**
 * ADMIN API: Sync Subscription Plans to Stripe
 * POST /api/admin/sync-stripe
 * Syncs database changes to Stripe
 */

import { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { Pool } from 'pg';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Add admin authentication check
    // const user = await verifyAdmin(req);

    // Get plans that need syncing
    const plansResult = await pool.query(`
      SELECT 
        subscription_plan_id,
        plan_name,
        plan_slug,
        plan_description,
        user_type,
        tier,
        monthly_price,
        annual_price,
        features,
        stripe_product_id,
        stripe_price_id_monthly,
        stripe_price_id_yearly,
        is_active
      FROM subscription_plans
      WHERE needs_stripe_sync = true
      ORDER BY updated_at ASC
    `);

    const plans = plansResult.rows;

    if (plans.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All plans are already synced',
        synced: 0,
      });
    }

    const results = {
      synced: 0,
      failed: 0,
      errors: [] as any[],
    };

    // Sync each plan
    for (const plan of plans) {
      try {
        const syncResult = await syncPlanToStripe(plan);
        
        if (syncResult.success) {
          // Mark as synced in database
          await pool.query(
            `SELECT mark_plan_synced($1, $2, $3, $4, true, NULL)`,
            [
              plan.subscription_plan_id,
              syncResult.productId,
              syncResult.monthlyPriceId,
              syncResult.yearlyPriceId,
            ]
          );
          results.synced++;
        } else {
          // Mark sync as failed
          await pool.query(
            `SELECT mark_plan_synced($1, NULL, NULL, NULL, false, $2)`,
            [plan.subscription_plan_id, syncResult.error]
          );
          results.failed++;
          results.errors.push({
            plan: plan.plan_name,
            error: syncResult.error,
          });
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          plan: plan.plan_name,
          error: error.message,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Synced ${results.synced} plans, ${results.failed} failed`,
      synced: results.synced,
      failed: results.failed,
      errors: results.errors,
    });

  } catch (error: any) {
    console.error('Stripe sync error:', error);
    return res.status(500).json({
      error: 'Failed to sync with Stripe',
      details: error.message,
    });
  }
}

/**
 * Sync a single plan to Stripe
 */
async function syncPlanToStripe(plan: any) {
  try {
    let product;

    // Check if product exists
    if (plan.stripe_product_id) {
      try {
        product = await stripe.products.retrieve(plan.stripe_product_id);
        
        // Update if needed
        const needsUpdate = 
          product.name !== plan.plan_name ||
          product.description !== plan.plan_description ||
          product.active !== plan.is_active;

        if (needsUpdate) {
          product = await stripe.products.update(plan.stripe_product_id, {
            name: plan.plan_name,
            description: plan.plan_description,
            active: plan.is_active,
            metadata: {
              slug: plan.plan_slug,
              user_type: plan.user_type,
              tier: plan.tier.toString(),
              features: JSON.stringify(plan.features),
            },
          });
        }
      } catch (error: any) {
        if (error.code === 'resource_missing') {
          product = null;
        } else {
          throw error;
        }
      }
    }

    // Create product if doesn't exist
    if (!product) {
      product = await stripe.products.create({
        name: plan.plan_name,
        description: plan.plan_description,
        active: plan.is_active,
        metadata: {
          slug: plan.plan_slug,
          user_type: plan.user_type,
          tier: plan.tier.toString(),
          features: JSON.stringify(plan.features),
        },
      });
    }

    // Sync prices
    const prices = await syncPrices(product.id, plan);

    return {
      success: true,
      productId: product.id,
      monthlyPriceId: prices.monthlyPriceId,
      yearlyPriceId: prices.yearlyPriceId,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Sync prices for a product
 */
async function syncPrices(productId: string, plan: any) {
  let monthlyPriceId = plan.stripe_price_id_monthly;
  let yearlyPriceId = plan.stripe_price_id_yearly;

  // Check monthly price
  if (monthlyPriceId) {
    try {
      const existingPrice = await stripe.prices.retrieve(monthlyPriceId);
      const currentAmount = existingPrice.unit_amount! / 100;
      
      // If price changed, create new price
      if (currentAmount !== plan.monthly_price) {
        await stripe.prices.update(monthlyPriceId, { active: false });
        
        const newPrice = await stripe.prices.create({
          product: productId,
          unit_amount: Math.round(plan.monthly_price * 100),
          currency: 'usd',
          recurring: { interval: 'month' },
          metadata: {
            slug: plan.plan_slug,
            billing_period: 'monthly',
          },
        });
        monthlyPriceId = newPrice.id;
      }
    } catch (error: any) {
      if (error.code === 'resource_missing') {
        monthlyPriceId = null;
      }
    }
  }

  // Create monthly price if doesn't exist
  if (!monthlyPriceId) {
    const newPrice = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(plan.monthly_price * 100),
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: {
        slug: plan.plan_slug,
        billing_period: 'monthly',
      },
    });
    monthlyPriceId = newPrice.id;
  }

  // Check yearly price
  if (yearlyPriceId) {
    try {
      const existingPrice = await stripe.prices.retrieve(yearlyPriceId);
      const currentAmount = existingPrice.unit_amount! / 100;
      
      if (currentAmount !== plan.annual_price) {
        await stripe.prices.update(yearlyPriceId, { active: false });
        
        const newPrice = await stripe.prices.create({
          product: productId,
          unit_amount: Math.round(plan.annual_price * 100),
          currency: 'usd',
          recurring: { interval: 'year' },
          metadata: {
            slug: plan.plan_slug,
            billing_period: 'yearly',
          },
        });
        yearlyPriceId = newPrice.id;
      }
    } catch (error: any) {
      if (error.code === 'resource_missing') {
        yearlyPriceId = null;
      }
    }
  }

  // Create yearly price if doesn't exist
  if (!yearlyPriceId) {
    const newPrice = await stripe.prices.create({
      product: productId,
      unit_amount: Math.round(plan.annual_price * 100),
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: {
        slug: plan.plan_slug,
        billing_period: 'yearly',
      },
    });
    yearlyPriceId = newPrice.id;
  }

  return { monthlyPriceId, yearlyPriceId };
}
