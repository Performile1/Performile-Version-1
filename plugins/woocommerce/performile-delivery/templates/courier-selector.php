<?php
/**
 * Courier Selector Template
 * Displays courier ratings in checkout
 */

if (!defined('ABSPATH')) {
    exit;
}
?>

<div id="performile-courier-selector" class="performile-section">
    <h3><?php echo esc_html($title); ?></h3>
    
    <div class="performile-couriers">
        <?php foreach ($couriers as $index => $courier): ?>
            <div class="performile-courier <?php echo $index === 0 ? 'recommended' : ''; ?>" 
                 data-courier-id="<?php echo esc_attr($courier['courier_id']); ?>"
                 data-courier-name="<?php echo esc_attr($courier['courier_name']); ?>">
                
                <div class="courier-radio">
                    <input type="radio" 
                           name="performile_courier_id" 
                           id="courier_<?php echo esc_attr($courier['courier_id']); ?>"
                           value="<?php echo esc_attr($courier['courier_id']); ?>"
                           <?php checked($index, 0); ?>>
                </div>
                
                <?php if (!empty($courier['logo_url'])): ?>
                    <div class="courier-logo">
                        <img src="<?php echo esc_url($courier['logo_url']); ?>" 
                             alt="<?php echo esc_attr($courier['courier_name']); ?>"
                             loading="lazy">
                    </div>
                <?php else: ?>
                    <div class="courier-logo courier-logo-placeholder">
                        <span><?php echo esc_html(substr($courier['courier_name'], 0, 1)); ?></span>
                    </div>
                <?php endif; ?>
                
                <div class="courier-info">
                    <div class="courier-header">
                        <label for="courier_<?php echo esc_attr($courier['courier_id']); ?>" class="courier-name">
                            <?php echo esc_html($courier['courier_name']); ?>
                        </label>
                        
                        <?php if ($index === 0): ?>
                            <span class="badge recommended-badge"><?php _e('Recommended', 'performile-delivery'); ?></span>
                        <?php endif; ?>
                        
                        <?php if (isset($courier['badge'])): ?>
                            <span class="badge <?php echo esc_attr($courier['badge']); ?>-badge">
                                <?php 
                                $badge_labels = array(
                                    'excellent' => __('Excellent', 'performile-delivery'),
                                    'very_good' => __('Very Good', 'performile-delivery'),
                                    'good' => __('Good', 'performile-delivery'),
                                    'average' => __('Average', 'performile-delivery')
                                );
                                echo esc_html($badge_labels[$courier['badge']] ?? '');
                                ?>
                            </span>
                        <?php endif; ?>
                    </div>
                    
                    <div class="courier-rating">
                        <span class="stars">
                            <?php
                            $rating = floatval($courier['trust_score']);
                            $full_stars = floor($rating);
                            $half_star = ($rating - $full_stars) >= 0.5;
                            
                            for ($i = 0; $i < $full_stars; $i++) {
                                echo '⭐';
                            }
                            if ($half_star) {
                                echo '⭐';
                            }
                            ?>
                        </span>
                        <span class="rating-text">
                            <?php echo esc_html($courier['trust_score']); ?>/5 
                            (<?php echo esc_html($courier['total_reviews']); ?> <?php _e('reviews', 'performile-delivery'); ?>)
                        </span>
                    </div>
                    
                    <div class="courier-stats">
                        <span class="stat">
                            <span class="icon">🚚</span>
                            <?php echo esc_html($courier['avg_delivery_time']); ?>
                        </span>
                        <span class="stat">
                            <span class="icon">✓</span>
                            <?php echo esc_html($courier['on_time_percentage']); ?>% <?php _e('on-time', 'performile-delivery'); ?>
                        </span>
                    </div>
                </div>
            </div>
        <?php endforeach; ?>
    </div>
    
    <input type="hidden" name="performile_courier_name" id="performile_courier_name" value="<?php echo esc_attr($couriers[0]['courier_name'] ?? ''); ?>">
    
    <p class="performile-footer">
        <small>
            ⭐ <?php _e('Ratings based on verified customer reviews', 'performile-delivery'); ?> • 
            <?php _e('Powered by', 'performile-delivery'); ?> <strong>Performile</strong>
        </small>
    </p>
</div>
