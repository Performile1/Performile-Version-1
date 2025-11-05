<?php
/**
 * Plugin Name: Performile Delivery Ratings
 * Plugin URI: https://performile.com
 * Description: Show top-rated couriers in checkout based on customer location. Increase trust and conversions with verified delivery ratings.
 * Version: 1.1.0
 * Author: Performile
 * Author URI: https://performile.com
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: performile-delivery
 * Requires at least: 5.8
 * Requires PHP: 7.4
 * WC requires at least: 5.0
 * WC tested up to: 8.0
 */

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('PERFORMILE_VERSION', '1.1.0');
define('PERFORMILE_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('PERFORMILE_PLUGIN_URL', plugin_dir_url(__FILE__));
define('PERFORMILE_API_URL', 'https://frontend-two-swart-31.vercel.app/api');

// Check if WooCommerce is active
if (!in_array('woocommerce/woocommerce.php', apply_filters('active_plugins', get_option('active_plugins')))) {
    add_action('admin_notices', 'performile_woocommerce_missing_notice');
    return;
}

function performile_woocommerce_missing_notice() {
    ?>
    <div class="error">
        <p><?php _e('Performile Delivery Ratings requires WooCommerce to be installed and active.', 'performile-delivery'); ?></p>
    </div>
    <?php
}

// Include required files
require_once PERFORMILE_PLUGIN_DIR . 'includes/class-performile-api.php';
require_once PERFORMILE_PLUGIN_DIR . 'includes/class-performile-settings.php';
require_once PERFORMILE_PLUGIN_DIR . 'includes/class-performile-checkout.php';

// Initialize plugin
function performile_init() {
    // Initialize settings
    new Performile_Settings();
    
    // Initialize checkout integration
    if (get_option('performile_enabled', '1') === '1') {
        new Performile_Checkout();
    }
}
add_action('plugins_loaded', 'performile_init');

// Activation hook
register_activation_hook(__FILE__, 'performile_activate');
function performile_activate() {
    // Set default options
    add_option('performile_enabled', '1');
    add_option('performile_api_key', '');
    add_option('performile_num_couriers', '3');
    add_option('performile_position', 'before_payment');
    add_option('performile_title', 'Top Rated Couriers in Your Area');
    add_option('performile_show_logos', '1');
    add_option('performile_margin_type', 'percentage');
    add_option('performile_margin_value', '0');
}

// Deactivation hook
register_deactivation_hook(__FILE__, 'performile_deactivate');
function performile_deactivate() {
    // Clean up if needed
}

// Add settings link on plugins page
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'performile_settings_link');
function performile_settings_link($links) {
    $settings_link = '<a href="admin.php?page=performile-settings">' . __('Settings', 'performile-delivery') . '</a>';
    array_unshift($links, $settings_link);
    return $links;
}
