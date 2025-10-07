=== Performile Delivery Ratings ===
Contributors: performile
Tags: delivery, courier, ratings, reviews, checkout, woocommerce
Requires at least: 5.8
Tested up to: 6.4
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Show top-rated couriers in checkout based on verified customer reviews. Increase trust and conversions.

== Description ==

**Performile Delivery Ratings** displays verified courier ratings directly in your WooCommerce checkout, helping customers choose the best delivery option based on real customer experiences.

= Key Features =

* **Verified Ratings**: Show courier ratings based on verified customer reviews
* **Location-Based**: Display top couriers for customer's postal code
* **Trust Signals**: Increase checkout conversion with social proof
* **Customizable**: Choose position, number of couriers, and styling
* **Mobile Responsive**: Works perfectly on all devices
* **Easy Setup**: Install, configure API key, and you're done!

= How It Works =

1. Customer enters their postal code in checkout
2. Plugin fetches top-rated couriers for that area from Performile
3. Ratings are displayed with trust score, reviews, and delivery stats
4. Customer can see courier performance before completing purchase
5. Selected courier is saved with the order

= What Customers See =

* Courier name and logo
* Star rating (1-5 stars)
* Number of verified reviews
* Average delivery time
* On-time delivery percentage
* Trust badges (Excellent, Very Good, Good)

= Benefits =

* **Increase Conversions**: Build trust with verified ratings
* **Reduce Support**: Customers know what to expect
* **Better Experience**: Help customers make informed decisions
* **Competitive Advantage**: Stand out from competitors

= Requirements =

* WooCommerce 5.0 or higher
* Performile account (free to start)
* API key from Performile dashboard

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/performile-delivery/`
2. Activate the plugin through the 'Plugins' menu in WordPress
3. Go to WooCommerce > Performile Delivery
4. Enter your Performile API key
5. Configure display settings
6. Save changes

= Getting Your API Key =

1. Sign up at [Performile](https://frontend-two-swart-31.vercel.app)
2. Go to Settings > API Keys
3. Copy your API key
4. Paste it in the plugin settings

== Frequently Asked Questions ==

= Do I need a Performile account? =

Yes, you need a Performile account to use this plugin. Sign up for free at [Performile](https://frontend-two-swart-31.vercel.app).

= How are ratings calculated? =

Ratings are based on verified customer reviews from actual deliveries. Only customers who received a delivery can leave a review.

= Can I customize the appearance? =

Yes! You can customize the title, number of couriers displayed, and position in checkout. Advanced styling can be done with CSS.

= Does it work with my theme? =

Yes, the plugin is designed to work with any WooCommerce-compatible theme.

= Is it mobile responsive? =

Yes, the courier selector is fully responsive and works great on mobile devices.

= How often are ratings updated? =

Ratings are fetched in real-time when customers enter their postal code.

= What if no couriers are found for a postal code? =

The plugin will show top national couriers as a fallback.

= Does it slow down my checkout? =

No, the plugin uses efficient caching and loads asynchronously to maintain fast checkout performance.

== Screenshots ==

1. Courier ratings displayed in checkout
2. Admin settings page
3. Mobile view of courier selector
4. Courier details with ratings and stats

== Changelog ==

= 1.0.0 =
* Initial release
* Display top-rated couriers in checkout
* Location-based courier ratings
* Customizable display settings
* Mobile responsive design
* WooCommerce integration

== Upgrade Notice ==

= 1.0.0 =
Initial release of Performile Delivery Ratings.

== Support ==

For support, please visit:
* [Documentation](https://performile.com/docs)
* [Support Forum](https://performile.com/support)
* [Contact Us](https://performile.com/contact)

== Privacy Policy ==

This plugin connects to Performile's API to fetch courier ratings. The following data is sent:
* Customer postal code (for location-based ratings)
* Selected courier ID (saved with order)

No personal customer information is shared with Performile.

For more information, see [Performile Privacy Policy](https://performile.com/privacy).
