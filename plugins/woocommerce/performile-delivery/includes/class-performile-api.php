<?php
/**
 * Performile API Client
 * Handles communication with Performile API
 */

if (!defined('ABSPATH')) {
    exit;
}

class Performile_API {
    
    private $api_url;
    private $api_key;
    
    public function __construct() {
        $this->api_url = PERFORMILE_API_URL;
        $this->api_key = get_option('performile_api_key', '');
    }
    
    /**
     * Get courier ratings by postal code
     */
    public function get_courier_ratings($postal_code, $limit = 3) {
        if (empty($postal_code)) {
            return array();
        }
        
        $url = $this->api_url . '/couriers/ratings-by-postal';
        $url = add_query_arg(array(
            'postal_code' => sanitize_text_field($postal_code),
            'limit' => absint($limit)
        ), $url);
        
        $response = wp_remote_get($url, array(
            'timeout' => 10,
            'headers' => array(
                'Content-Type' => 'application/json',
            )
        ));
        
        if (is_wp_error($response)) {
            error_log('Performile API Error: ' . $response->get_error_message());
            return array();
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        if (!isset($data['success']) || !$data['success']) {
            return array();
        }
        
        return isset($data['couriers']) ? $data['couriers'] : array();
    }
    
    /**
     * Send order data to Performile
     */
    public function send_order($order_data) {
        $url = $this->api_url . '/orders/create';
        
        $response = wp_remote_post($url, array(
            'timeout' => 15,
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-API-Key' => $this->api_key
            ),
            'body' => json_encode($order_data)
        ));
        
        if (is_wp_error($response)) {
            error_log('Performile Order API Error: ' . $response->get_error_message());
            return false;
        }
        
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        
        return isset($data['success']) ? $data['success'] : false;
    }
    
    /**
     * Validate API key
     */
    public function validate_api_key($api_key) {
        $url = $this->api_url . '/auth/validate';
        
        $response = wp_remote_post($url, array(
            'timeout' => 10,
            'headers' => array(
                'Content-Type' => 'application/json',
                'X-API-Key' => $api_key
            )
        ));
        
        if (is_wp_error($response)) {
            return false;
        }
        
        $code = wp_remote_retrieve_response_code($response);
        return $code === 200;
    }
}
