<?php
/**
 * Performile Checkout Integration
 * Displays courier ratings in WooCommerce checkout
 */

if (!defined('ABSPATH')) {
    exit;
}

class Performile_Checkout {
    
    private $api;
    
    public function __construct() {
        $this->api = new Performile_API();
        
        // Add courier selector to checkout
        $position = get_option('performile_position', 'before_payment');
        
        switch ($position) {
            case 'before_payment':
                add_action('woocommerce_review_order_before_payment', array($this, 'display_courier_selector'));
                break;
            case 'after_shipping':
                add_action('woocommerce_after_shipping_rate', array($this, 'display_courier_selector'));
                break;
            case 'before_order_notes':
                add_action('woocommerce_before_order_notes', array($this, 'display_courier_selector'));
                break;
            default:
                add_action('woocommerce_review_order_before_payment', array($this, 'display_courier_selector'));
        }
        
        // Enqueue scripts and styles
        add_action('wp_enqueue_scripts', array($this, 'enqueue_scripts'));
        
        // Save selected courier to order
        add_action('woocommerce_checkout_create_order', array($this, 'save_courier_to_order'), 10, 2);
        
        // Display courier in order details
        add_action('woocommerce_admin_order_data_after_shipping_address', array($this, 'display_courier_in_admin'));
        add_action('woocommerce_order_details_after_order_table', array($this, 'display_courier_in_order'));
    }
    
    /**
     * Enqueue scripts and styles
     */
    public function enqueue_scripts() {
        if (!is_checkout()) {
            return;
        }
        
        wp_enqueue_style(
            'performile-checkout',
            PERFORMILE_PLUGIN_URL . 'assets/css/checkout.css',
            array(),
            PERFORMILE_VERSION
        );
        
        wp_enqueue_script(
            'performile-checkout',
            PERFORMILE_PLUGIN_URL . 'assets/js/checkout.js',
            array('jquery'),
            PERFORMILE_VERSION,
            true
        );
        
        wp_localize_script('performile-checkout', 'performileData', array(
            'apiUrl' => PERFORMILE_API_URL,
            'numCouriers' => get_option('performile_num_couriers', '3')
        ));
    }
    
    /**
     * Display courier selector in checkout
     */
    public function display_courier_selector() {
        // Get customer postal code
        $postal_code = WC()->customer->get_shipping_postcode();
        
        if (empty($postal_code)) {
            $postal_code = WC()->customer->get_billing_postcode();
        }
        
        if (empty($postal_code)) {
            return;
        }
        
        // Get courier ratings
        $num_couriers = get_option('performile_num_couriers', '3');
        $couriers = $this->api->get_courier_ratings($postal_code, $num_couriers);
        
        if (empty($couriers)) {
            return;
        }
        
        $title = get_option('performile_title', 'Top Rated Couriers in Your Area');
        
        include PERFORMILE_PLUGIN_DIR . 'templates/courier-selector.php';
    }
    
    /**
     * Save selected courier to order
     */
    public function save_courier_to_order($order, $data) {
        if (isset($_POST['performile_courier_id'])) {
            $courier_id = sanitize_text_field($_POST['performile_courier_id']);
            $order->update_meta_data('_performile_courier_id', $courier_id);
            
            if (isset($_POST['performile_courier_name'])) {
                $courier_name = sanitize_text_field($_POST['performile_courier_name']);
                $order->update_meta_data('_performile_courier_name', $courier_name);
            }
        }
    }
    
    /**
     * Display courier in admin order details
     */
    public function display_courier_in_admin($order) {
        $courier_name = $order->get_meta('_performile_courier_name');
        
        if ($courier_name) {
            echo '<p><strong>' . __('Selected Courier:', 'performile-delivery') . '</strong> ' . esc_html($courier_name) . '</p>';
        }
    }
    
    /**
     * Display courier in customer order details
     */
    public function display_courier_in_order($order) {
        $courier_name = $order->get_meta('_performile_courier_name');
        
        if ($courier_name) {
            echo '<p><strong>' . __('Delivery Courier:', 'performile-delivery') . '</strong> ' . esc_html($courier_name) . '</p>';
        }
    }
}
