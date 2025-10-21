/**
 * CREATE STRIPE PRODUCTS AUTOMATICALLY
 * This script creates all subscription products and prices in Stripe
 * Run once to set up your Stripe account
 */

const Stripe = require('stripe');
const { Pool } = require('pg');

// Initialize Stripe (use your secret key)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Initialize database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Define all products based on your subscription plans
const products = [
  // MERCHANT PLANS
  {
    name: 'Merchant Starter',
    slug: 'merchant-starter',
    description: 'Perfect for small businesses starting their delivery journey',
    monthly_price: 29,
    yearly_price: 290,
    features: [
      'Up to 100 orders/month',
      'Basic analytics dashboard',
      'Email notifications',
      '1 courier integration',
      'Standard support',
    ],
  },
  {
    name: 'Merchant Growth',
    slug: 'merchant-growth',
    description: 'Ideal for growing businesses with multiple couriers',
    monthly_price: 79,
    yearly_price: 790,
    features: [
      'Up to 500 orders/month',
      'Advanced analytics & reports',
      'Email + SMS notifications',
      '5 courier integrations',
      'API access',
      'Priority support',
    ],
  },
  {
    name: 'Merchant Enterprise',
    slug: 'merchant-enterprise',
    description: 'For large businesses requiring unlimited scale',
    monthly_price: 199,
    yearly_price: 1990,
    features: [
      'Unlimited orders',
      'Custom analytics & white-label reports',
      'All notification channels',
      'Unlimited courier integrations',
      'Full API access',
      'Dedicated account manager',
      'Custom SLA',
    ],
  },

  // COURIER PLANS
  {
    name: 'Courier Individual',
    slug: 'courier-individual',
    description: 'For independent couriers and small delivery services',
    monthly_price: 19,
    yearly_price: 190,
    features: [
      'Up to 50 deliveries/month',
      'Basic performance dashboard',
      'Customer review management',
      'Email notifications',
      'Standard support',
    ],
  },
  {
    name: 'Courier Professional',
    slug: 'courier-professional',
    description: 'For professional couriers managing multiple routes',
    monthly_price: 49,
    yearly_price: 490,
    features: [
      'Up to 200 deliveries/month',
      'Advanced performance analytics',
      'Review management & responses',
      'Email + SMS notifications',
      'Route optimization',
      'Priority support',
    ],
  },
  {
    name: 'Courier Fleet',
    slug: 'courier-fleet',
    description: 'For courier companies with multiple drivers',
    monthly_price: 99,
    yearly_price: 990,
    features: [
      'Up to 1,000 deliveries/month',
      'Fleet management dashboard',
      'Driver performance tracking',
      'All notification channels',
      'API access',
      'Multi-user accounts',
      'Priority support',
    ],
  },
  {
    name: 'Courier Enterprise',
    slug: 'courier-enterprise',
    description: 'For large courier networks requiring unlimited scale',
    monthly_price: 249,
    yearly_price: 2490,
    features: [
      'Unlimited deliveries',
      'Custom analytics & reporting',
      'Advanced fleet management',
      'All notification channels',
      'Full API access',
      'White-label options',
      'Dedicated account manager',
      'Custom SLA',
    ],
  },
];

/**
 * Create a product and its prices in Stripe
 */
async function createStripeProduct(productData) {
  try {
    console.log(`\n📦 Creating product: ${productData.name}...`);

    // Create the product
    const product = await stripe.products.create({
      name: productData.name,
      description: productData.description,
      metadata: {
        slug: productData.slug,
        features: JSON.stringify(productData.features),
      },
    });

    console.log(`✅ Product created: ${product.id}`);

    // Create monthly price
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: productData.monthly_price * 100, // Convert to cents
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        slug: productData.slug,
        billing_period: 'monthly',
      },
    });

    console.log(`✅ Monthly price created: ${monthlyPrice.id} ($${productData.monthly_price}/month)`);

    // Create yearly price
    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: productData.yearly_price * 100, // Convert to cents
      currency: 'usd',
      recurring: {
        interval: 'year',
      },
      metadata: {
        slug: productData.slug,
        billing_period: 'yearly',
      },
    });

    console.log(`✅ Yearly price created: ${yearlyPrice.id} ($${productData.yearly_price}/year)`);

    return {
      slug: productData.slug,
      stripe_product_id: product.id,
      stripe_price_id_monthly: monthlyPrice.id,
      stripe_price_id_yearly: yearlyPrice.id,
    };
  } catch (error) {
    console.error(`❌ Error creating product ${productData.name}:`, error.message);
    throw error;
  }
}

/**
 * Update database with Stripe IDs
 */
async function updateDatabase(stripeData) {
  try {
    console.log(`\n💾 Updating database for ${stripeData.slug}...`);

    const result = await pool.query(
      `UPDATE subscription_plans 
       SET 
         stripe_product_id = $1,
         stripe_price_id_monthly = $2,
         stripe_price_id_yearly = $3,
         updated_at = NOW()
       WHERE plan_slug = $4
       RETURNING plan_name`,
      [
        stripeData.stripe_product_id,
        stripeData.stripe_price_id_monthly,
        stripeData.stripe_price_id_yearly,
        stripeData.slug,
      ]
    );

    if (result.rows.length > 0) {
      console.log(`✅ Database updated for: ${result.rows[0].plan_name}`);
    } else {
      console.log(`⚠️  No matching plan found in database for slug: ${stripeData.slug}`);
    }
  } catch (error) {
    console.error(`❌ Database error:`, error.message);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Starting Stripe product creation...\n');
  console.log(`📊 Total products to create: ${products.length}\n`);

  const results = [];

  try {
    // Create each product
    for (const productData of products) {
      const stripeData = await createStripeProduct(productData);
      await updateDatabase(stripeData);
      results.push(stripeData);

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Display summary
    console.log('\n' + '='.repeat(80));
    console.log('🎉 ALL PRODUCTS CREATED SUCCESSFULLY!');
    console.log('='.repeat(80) + '\n');

    console.log('📋 SUMMARY:\n');
    results.forEach(result => {
      console.log(`${result.slug}:`);
      console.log(`  Product ID: ${result.stripe_product_id}`);
      console.log(`  Monthly Price ID: ${result.stripe_price_id_monthly}`);
      console.log(`  Yearly Price ID: ${result.stripe_price_id_yearly}\n`);
    });

    console.log('✅ Database has been updated with all Stripe IDs');
    console.log('\n🔗 View your products: https://dashboard.stripe.com/test/products\n');

  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  // Check for required environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('❌ ERROR: STRIPE_SECRET_KEY environment variable is required');
    console.log('\nUsage:');
    console.log('  STRIPE_SECRET_KEY=sk_test_xxx DATABASE_URL=postgres://... node scripts/create-stripe-products.js\n');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  main();
}

module.exports = { createStripeProduct, updateDatabase };
