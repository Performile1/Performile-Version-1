/**
 * Performile Delivery - Checkout JavaScript
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        
        // Handle courier selection
        $('.performile-courier').on('click', function() {
            var $courier = $(this);
            var courierId = $courier.data('courier-id');
            var courierName = $courier.data('courier-name');
            
            // Update radio button
            $courier.find('input[type="radio"]').prop('checked', true);
            
            // Update hidden field
            $('#performile_courier_name').val(courierName);
            
            // Update visual state
            $('.performile-courier').removeClass('selected');
            $courier.addClass('selected');
            
            // Trigger WooCommerce update
            $(document.body).trigger('update_checkout');
        });
        
        // Handle radio button change
        $('input[name="performile_courier_id"]').on('change', function() {
            var $radio = $(this);
            var $courier = $radio.closest('.performile-courier');
            var courierName = $courier.data('courier-name');
            
            $('#performile_courier_name').val(courierName);
            
            $('.performile-courier').removeClass('selected');
            $courier.addClass('selected');
        });
        
        // Update courier ratings when postal code changes
        var postalCodeTimeout;
        
        $(document.body).on('change', '#billing_postcode, #shipping_postcode', function() {
            clearTimeout(postalCodeTimeout);
            
            postalCodeTimeout = setTimeout(function() {
                updateCourierRatings();
            }, 500);
        });
        
        function updateCourierRatings() {
            var postalCode = $('#shipping_postcode').val() || $('#billing_postcode').val();
            
            if (!postalCode || postalCode.length < 3) {
                return;
            }
            
            var $container = $('#performile-courier-selector');
            
            if ($container.length === 0) {
                return;
            }
            
            // Show loading state
            $container.addClass('loading');
            
            $.ajax({
                url: performileData.apiUrl + '/couriers/ratings-by-postal',
                method: 'GET',
                data: {
                    postal_code: postalCode,
                    limit: performileData.numCouriers || 3
                },
                success: function(response) {
                    if (response.success && response.couriers && response.couriers.length > 0) {
                        renderCouriers(response.couriers);
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Performile API Error:', error);
                },
                complete: function() {
                    $container.removeClass('loading');
                }
            });
        }
        
        function renderCouriers(couriers) {
            var $container = $('.performile-couriers');
            
            if ($container.length === 0) {
                return;
            }
            
            $container.empty();
            
            couriers.forEach(function(courier, index) {
                var isRecommended = index === 0;
                var badgeClass = courier.badge + '-badge';
                var badgeLabels = {
                    'excellent': 'Excellent',
                    'very_good': 'Very Good',
                    'good': 'Good',
                    'average': 'Average'
                };
                
                var stars = '';
                var rating = parseFloat(courier.trust_score);
                var fullStars = Math.floor(rating);
                
                for (var i = 0; i < fullStars; i++) {
                    stars += '⭐';
                }
                
                // Create logo HTML
                var logoHtml = '';
                if (courier.logo_url) {
                    logoHtml = `
                        <div class="courier-logo">
                            <img src="${courier.logo_url}" 
                                 alt="${courier.courier_name}"
                                 loading="lazy">
                        </div>
                    `;
                } else {
                    logoHtml = `
                        <div class="courier-logo courier-logo-placeholder">
                            <span>${courier.courier_name.charAt(0)}</span>
                        </div>
                    `;
                }
                
                var html = `
                    <div class="performile-courier ${isRecommended ? 'recommended' : ''}" 
                         data-courier-id="${courier.courier_id}"
                         data-courier-name="${courier.courier_name}">
                        
                        <div class="courier-radio">
                            <input type="radio" 
                                   name="performile_courier_id" 
                                   id="courier_${courier.courier_id}"
                                   value="${courier.courier_id}"
                                   ${isRecommended ? 'checked' : ''}>
                        </div>
                        
                        ${logoHtml}
                        
                        <div class="courier-info">
                            <div class="courier-header">
                                <label for="courier_${courier.courier_id}" class="courier-name">
                                    ${courier.courier_name}
                                </label>
                                
                                ${isRecommended ? '<span class="badge recommended-badge">Recommended</span>' : ''}
                                ${courier.badge ? `<span class="badge ${badgeClass}">${badgeLabels[courier.badge] || ''}</span>` : ''}
                            </div>
                            
                            <div class="courier-rating">
                                <span class="stars">${stars}</span>
                                <span class="rating-text">
                                    ${courier.trust_score}/5 (${courier.total_reviews} reviews)
                                </span>
                            </div>
                            
                            <div class="courier-stats">
                                <span class="stat">
                                    <span class="icon">🚚</span>
                                    ${courier.avg_delivery_time}
                                </span>
                                <span class="stat">
                                    <span class="icon">✓</span>
                                    ${courier.on_time_percentage}% on-time
                                </span>
                            </div>
                        </div>
                    </div>
                `;
                
                $container.append(html);
            });
            
            // Update hidden field with first courier
            if (couriers.length > 0) {
                $('#performile_courier_name').val(couriers[0].courier_name);
            }
            
            // Re-bind click handlers
            $('.performile-courier').off('click').on('click', function() {
                var $courier = $(this);
                var courierId = $courier.data('courier-id');
                var courierName = $courier.data('courier-name');
                
                $courier.find('input[type="radio"]').prop('checked', true);
                $('#performile_courier_name').val(courierName);
                
                $('.performile-courier').removeClass('selected');
                $courier.addClass('selected');
                
                $(document.body).trigger('update_checkout');
            });
        }
    });
    
})(jQuery);
