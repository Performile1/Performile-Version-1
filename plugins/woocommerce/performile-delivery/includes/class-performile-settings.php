<?php
/**
 * Performile Settings Page
 * Admin settings for the plugin
 */

if (!defined('ABSPATH')) {
    exit;
}

class Performile_Settings {
    
    public function __construct() {
        add_action('admin_menu', array($this, 'add_settings_page'));
        add_action('admin_init', array($this, 'register_settings'));
    }
    
    /**
     * Add settings page to WordPress admin
     */
    public function add_settings_page() {
        add_submenu_page(
            'woocommerce',
            __('Performile Settings', 'performile-delivery'),
            __('Performile Delivery', 'performile-delivery'),
            'manage_woocommerce',
            'performile-settings',
            array($this, 'render_settings_page')
        );
    }
    
    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting('performile_settings', 'performile_enabled');
        register_setting('performile_settings', 'performile_api_key');
        register_setting('performile_settings', 'performile_num_couriers');
        register_setting('performile_settings', 'performile_position');
        register_setting('performile_settings', 'performile_title');
    }
    
    /**
     * Render settings page
     */
    public function render_settings_page() {
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>
            
            <div class="notice notice-info">
                <p>
                    <strong><?php _e('Welcome to Performile!', 'performile-delivery'); ?></strong><br>
                    <?php _e('Show verified courier ratings in your checkout to increase customer trust and conversions.', 'performile-delivery'); ?>
                </p>
            </div>
            
            <form method="post" action="options.php">
                <?php settings_fields('performile_settings'); ?>
                
                <table class="form-table">
                    <tr>
                        <th scope="row">
                            <label for="performile_enabled"><?php _e('Enable Performile', 'performile-delivery'); ?></label>
                        </th>
                        <td>
                            <label>
                                <input type="checkbox" 
                                       id="performile_enabled" 
                                       name="performile_enabled" 
                                       value="1" 
                                       <?php checked(get_option('performile_enabled', '1'), '1'); ?>>
                                <?php _e('Show courier ratings in checkout', 'performile-delivery'); ?>
                            </label>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="performile_api_key"><?php _e('API Key', 'performile-delivery'); ?></label>
                        </th>
                        <td>
                            <input type="text" 
                                   id="performile_api_key" 
                                   name="performile_api_key" 
                                   value="<?php echo esc_attr(get_option('performile_api_key', '')); ?>" 
                                   class="regular-text">
                            <p class="description">
                                <?php _e('Get your API key from', 'performile-delivery'); ?> 
                                <a href="https://frontend-two-swart-31.vercel.app" target="_blank">Performile Dashboard</a>
                            </p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="performile_title"><?php _e('Section Title', 'performile-delivery'); ?></label>
                        </th>
                        <td>
                            <input type="text" 
                                   id="performile_title" 
                                   name="performile_title" 
                                   value="<?php echo esc_attr(get_option('performile_title', 'Top Rated Couriers in Your Area')); ?>" 
                                   class="regular-text">
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="performile_num_couriers"><?php _e('Number of Couriers', 'performile-delivery'); ?></label>
                        </th>
                        <td>
                            <select id="performile_num_couriers" name="performile_num_couriers">
                                <?php for ($i = 1; $i <= 5; $i++): ?>
                                    <option value="<?php echo $i; ?>" <?php selected(get_option('performile_num_couriers', '3'), $i); ?>>
                                        <?php echo $i; ?>
                                    </option>
                                <?php endfor; ?>
                            </select>
                            <p class="description"><?php _e('How many top-rated couriers to display', 'performile-delivery'); ?></p>
                        </td>
                    </tr>
                    
                    <tr>
                        <th scope="row">
                            <label for="performile_position"><?php _e('Display Position', 'performile-delivery'); ?></label>
                        </th>
                        <td>
                            <select id="performile_position" name="performile_position">
                                <option value="before_payment" <?php selected(get_option('performile_position', 'before_payment'), 'before_payment'); ?>>
                                    <?php _e('Before Payment Methods', 'performile-delivery'); ?>
                                </option>
                                <option value="after_shipping" <?php selected(get_option('performile_position'), 'after_shipping'); ?>>
                                    <?php _e('After Shipping Methods', 'performile-delivery'); ?>
                                </option>
                                <option value="before_order_notes" <?php selected(get_option('performile_position'), 'before_order_notes'); ?>>
                                    <?php _e('Before Order Notes', 'performile-delivery'); ?>
                                </option>
                            </select>
                        </td>
                    </tr>
                </table>
                
                <?php submit_button(); ?>
            </form>
            
            <hr>
            
            <h2><?php _e('How It Works', 'performile-delivery'); ?></h2>
            <ol>
                <li><?php _e('Performile shows top-rated couriers based on customer postal code', 'performile-delivery'); ?></li>
                <li><?php _e('Ratings are based on verified customer reviews', 'performile-delivery'); ?></li>
                <li><?php _e('Customers can see courier performance before checkout', 'performile-delivery'); ?></li>
                <li><?php _e('Increases trust and conversion rates', 'performile-delivery'); ?></li>
            </ol>
            
            <h3><?php _e('Need Help?', 'performile-delivery'); ?></h3>
            <p>
                <a href="https://performile.com/docs" target="_blank" class="button"><?php _e('Documentation', 'performile-delivery'); ?></a>
                <a href="https://performile.com/support" target="_blank" class="button"><?php _e('Support', 'performile-delivery'); ?></a>
            </p>
        </div>
        <?php
    }
}
