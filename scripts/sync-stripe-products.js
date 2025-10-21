/**
 * SYNC STRIPE PRODUCTS FROM DATABASE
 * This script syncs your subscription_plans table with Stripe
 * - Creates new products if they don't exist
 * - Updates existing products if changed
 * - Creates new prices if pricing changed
 * - Keeps everything in sync
 */

const Stripe = require('stripe');
const { Pool } = require('pg');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Get all subscription plans from database
 */
async function getPlansFromDatabase() {
  const result = await pool.query(`
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
    ORDER BY user_type, tier
  `);
  return result.rows;
}

/**
 * Create or update product in Stripe
 */
async function syncProduct(plan) {
  console.log(`\n📦 Syncing: ${plan.plan_name}...`);

  try {
    let product;
    let productChanged = false;

    // Check if product exists in Stripe
    if (plan.stripe_product_id) {
      try {
        product = await stripe.products.retrieve(plan.stripe_product_id);
        console.log(`   Found existing product: ${product.id}`);

        // Check if product needs updating
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
              tier: plan.tier,
              features: JSON.stringify(plan.features),
            },
          });
          console.log(`   ✅ Product updated`);
          productChanged = true;
        } else {
          console.log(`   ✓ Product unchanged`);
        }
      } catch (error) {
        if (error.code === 'resource_missing') {
          console.log(`   ⚠️  Product not found in Stripe, creating new...`);
          product = null;
        } else {
          throw error;
        }
      }
    }

    // Create product if it doesn't exist
    if (!product) {
      product = await stripe.products.create({
        name: plan.plan_name,
        description: plan.plan_description,
        active: plan.is_active,
        metadata: {
          slug: plan.plan_slug,
          user_type: plan.user_type,
          tier: plan.tier,
          features: JSON.stringify(plan.features),
        },
      });
      console.log(`   ✅ Product created: ${product.id}`);
      productChanged = true;
    }

    // Sync prices
    const prices = await syncPrices(product.id, plan);

    // Update database with Stripe IDs
    if (productChanged || prices.monthlyChanged || prices.yearlyChanged) {
      await pool.query(
        `UPDATE subscription_plans 
         SET 
           stripe_product_id = $1,
           stripe_price_id_monthly = $2,
           stripe_price_id_yearly = $3,
           updated_at = NOW()
         WHERE subscription_plan_id = $4`,
        [
          product.id,
          prices.monthlyPriceId,
          prices.yearlyPriceId,
          plan.subscription_plan_id,
        ]
      );
      console.log(`   ✅ Database updated`);
    }

    return {
      success: true,
      productId: product.id,
      monthlyPriceId: prices.monthlyPriceId,
      yearlyPriceId: prices.yearlyPriceId,
    };
  } catch (error) {
    console.error(`   ❌ Error syncing ${plan.plan_name}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Sync prices for a product
 */
async function syncPrices(productId, plan) {
  let monthlyPriceId = plan.stripe_price_id_monthly;
  let yearlyPriceId = plan.stripe_price_id_yearly;
  let monthlyChanged = false;
  let yearlyChanged = false;

  // Check monthly price
  if (monthlyPriceId) {
    try {
      const existingPrice = await stripe.prices.retrieve(monthlyPriceId);
      
      // Check if price amount changed
      const currentAmount = existingPrice.unit_amount / 100;
      if (currentAmount !== plan.monthly_price) {
        console.log(`   💰 Monthly price changed: $${currentAmount} → $${plan.monthly_price}`);
        
        // Archive old price
        await stripe.prices.update(monthlyPriceId, { active: false });
        console.log(`   📦 Old monthly price archived`);
        
        // Create new price
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
        monthlyChanged = true;
        console.log(`   ✅ New monthly price created: ${newPrice.id}`);
      } else {
        console.log(`   ✓ Monthly price unchanged ($${plan.monthly_price})`);
      }
    } catch (error) {
      if (error.code === 'resource_missing') {
        monthlyPriceId = null;
      } else {
        throw error;
      }
    }
  }

  // Create monthly price if it doesn't exist
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
    monthlyChanged = true;
    console.log(`   ✅ Monthly price created: ${newPrice.id} ($${plan.monthly_price}/month)`);
  }

  // Check yearly price
  if (yearlyPriceId) {
    try {
      const existingPrice = await stripe.prices.retrieve(yearlyPriceId);
      
      const currentAmount = existingPrice.unit_amount / 100;
      if (currentAmount !== plan.annual_price) {
        console.log(`   💰 Yearly price changed: $${currentAmount} → $${plan.annual_price}`);
        
        await stripe.prices.update(yearlyPriceId, { active: false });
        console.log(`   📦 Old yearly price archived`);
        
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
        yearlyChanged = true;
        console.log(`   ✅ New yearly price created: ${newPrice.id}`);
      } else {
        console.log(`   ✓ Yearly price unchanged ($${plan.annual_price})`);
      }
    } catch (error) {
      if (error.code === 'resource_missing') {
        yearlyPriceId = null;
      } else {
        throw error;
      }
    }
  }

  // Create yearly price if it doesn't exist
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
    yearlyChanged = true;
    console.log(`   ✅ Yearly price created: ${newPrice.id} ($${plan.annual_price}/year)`);
  }

  return {
    monthlyPriceId,
    yearlyPriceId,
    monthlyChanged,
    yearlyChanged,
  };
}

/**
 * Main sync function
 */
async function main() {
  console.log('🔄 Starting Stripe sync from database...\n');

  try {
    // Get all plans from database
    const plans = await getPlansFromDatabase();
    console.log(`📊 Found ${plans.length} plans in database\n`);

    const results = {
      success: [],
      failed: [],
      created: 0,
      updated: 0,
      unchanged: 0,
    };

    // Sync each plan
    for (const plan of plans) {
      const result = await syncProduct(plan);
      
      if (result.success) {
        results.success.push(plan.plan_name);
        if (!plan.stripe_product_id) {
          results.created++;
        } else {
          results.updated++;
        }
      } else {
        results.failed.push({ name: plan.plan_name, error: result.error });
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Display summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ SYNC COMPLETE!');
    console.log('='.repeat(80) + '\n');

    console.log('📊 SUMMARY:');
    console.log(`   Created: ${results.created} products`);
    console.log(`   Updated: ${results.updated} products`);
    console.log(`   Total: ${results.success.length} successful`);
    
    if (results.failed.length > 0) {
      console.log(`   ❌ Failed: ${results.failed.length}`);
      results.failed.forEach(f => {
        console.log(`      - ${f.name}: ${f.error}`);
      });
    }

    console.log('\n🔗 View in Stripe: https://dashboard.stripe.com/test/products\n');

  } catch (error) {
    console.error('\n❌ SYNC FAILED:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  if (!process.env.STRIPE_SECRET_KEY || !process.env.DATABASE_URL) {
    console.error('❌ ERROR: Required environment variables missing');
    console.log('\nUsage:');
    console.log('  STRIPE_SECRET_KEY=sk_test_xxx DATABASE_URL=postgres://... node scripts/sync-stripe-products.js\n');
    process.exit(1);
  }

  main();
}

module.exports = { syncProduct, syncPrices };
